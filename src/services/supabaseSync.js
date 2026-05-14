/**
 * Supabase sync service — dual-writes IndexedDB + Supabase.
 * All operations write to IndexedDB first (local-first), then push to Supabase
 * in the background. Supabase failures are silent — the app works offline.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";

// IndexedDB store name → Supabase table name
const TABLE_MAP = {
  highlights: "highlights",
  notes: "notes",
  memoryVerses: "memory_verses",
  journal: "journal",
};

// camelCase → snake_case field mapping
function toSnakeCase(obj) {
  const map = {
    verseNumber: "verse_number",
    createdAt: "created_at",
    updatedAt: "updated_at",
    easeFactor: "ease_factor",
    nextReview: "next_review",
    practiceCount: "practice_count",
  };
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[map[key] || key] = value;
  }
  return result;
}

// snake_case → camelCase field mapping
function toCamelCase(obj) {
  const map = {
    verse_number: "verseNumber",
    created_at: "createdAt",
    updated_at: "updatedAt",
    ease_factor: "easeFactor",
    next_review: "nextReview",
    practice_count: "practiceCount",
    user_id: null, // strip user_id from local objects
  };
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (map[key] === null) continue; // skip
    result[map[key] || key] = value;
  }
  return result;
}

/**
 * Get the current Supabase user ID, or null.
 */
function getUserId() {
  // supabase.auth.getUser() is async; use the session cache instead
  const session = supabase?.auth?.session?.();
  // v2 client uses getSession synchronously from cache
  return null; // will be set by caller
}

/**
 * Push a record to Supabase (upsert). Fire-and-forget.
 */
export async function syncPush(storeName, record, userId) {
  if (!isSupabaseConfigured() || !userId) return;
  const table = TABLE_MAP[storeName];
  if (!table) return;

  try {
    const sb = await getSupabase();
    if (!sb) return;
    const row = toSnakeCase({ ...record, user_id: userId });
    await sb.from(table).upsert(row, { onConflict: "id,user_id" });
  } catch {
    // Silent fail — local data is the source of truth
  }
}

/**
 * Delete a record from Supabase. Fire-and-forget.
 */
export async function syncDelete(storeName, recordId, userId) {
  if (!isSupabaseConfigured() || !userId) return;
  const table = TABLE_MAP[storeName];
  if (!table) return;

  try {
    const sb = await getSupabase();
    if (!sb) return;
    await sb.from(table).delete().eq("id", recordId).eq("user_id", userId);
  } catch {
    // Silent fail
  }
}

/**
 * Pull all records for a store from Supabase and merge into IndexedDB.
 * Used on login to sync remote data down.
 * Returns the merged items.
 */
export async function syncPull(storeName, userId) {
  if (!isSupabaseConfigured() || !userId) return [];
  const table = TABLE_MAP[storeName];
  if (!table) return [];

  try {
    const sb = await getSupabase();
    if (!sb) return [];
    const { data, error } = await sb
      .from(table)
      .select("*")
      .eq("user_id", userId);

    if (error || !data) return [];

    // Import dbPut dynamically to avoid circular deps
    const { dbPut, dbGetAll } = await import("../hooks/useDB");

    // Get existing local data
    const localItems = await dbGetAll(storeName);
    const localMap = new Map(localItems.map((item) => [item.id, item]));

    // Merge: remote wins if newer, otherwise keep local
    for (const remoteRow of data) {
      const local = toCamelCase(remoteRow);
      const existing = localMap.get(local.id);

      // Use updatedAt or createdAt for comparison
      const remoteTime = local.updatedAt || local.createdAt || 0;
      const localTime = existing?.updatedAt || existing?.createdAt || 0;

      if (!existing || remoteTime >= localTime) {
        await dbPut(storeName, local);
      }
    }

    return dbGetAll(storeName);
  } catch {
    return [];
  }
}

/**
 * Push all local data for a store up to Supabase.
 * Used on first login to seed remote with existing offline data.
 */
export async function syncPushAll(storeName, userId) {
  if (!isSupabaseConfigured() || !userId) return;
  const table = TABLE_MAP[storeName];
  if (!table) return;

  try {
    const { dbGetAll } = await import("../hooks/useDB");
    const items = await dbGetAll(storeName);
    if (!items.length) return;

    const sb = await getSupabase();
    if (!sb) return;
    const rows = items.map((item) => toSnakeCase({ ...item, user_id: userId }));
    // Upsert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      await sb.from(table).upsert(batch, { onConflict: "id,user_id" });
    }
  } catch {
    // Silent fail
  }
}

/**
 * Full sync: push local data up, then pull remote data down.
 * Call this on login.
 */
export async function syncAll(userId) {
  if (!isSupabaseConfigured() || !userId) return;

  const stores = ["highlights", "notes", "memoryVerses", "journal"];

  // Push local data first (so offline work isn't lost)
  await Promise.all(stores.map((s) => syncPushAll(s, userId)));

  // Then pull remote data (merges by timestamp)
  await Promise.all(stores.map((s) => syncPull(s, userId)));

  // Sync reading progress
  await syncReadingProgress(userId);
}

/**
 * Sync reading progress (stored in localStorage, backed by Supabase table).
 */
async function syncReadingProgress(userId) {
  if (!isSupabaseConfigured() || !userId) return;

  try {
    const sb = await getSupabase();
    if (!sb) return;
    const localProgress = JSON.parse(localStorage.getItem("readingProgress") || "{}");

    // Push local progress
    if (Object.keys(localProgress).length > 0) {
      await sb.from("reading_progress").upsert({
        user_id: userId,
        completed_chapters: localProgress.completedChapters || {},
        streak: localProgress.streak || 0,
        last_read_date: localProgress.lastReadDate || null,
        last_read_book: localProgress.lastReadBook || null,
        last_read_chapter: localProgress.lastReadChapter || null,
        updated_at: new Date().toISOString(),
      });
    }

    // Pull remote progress
    const { data } = await sb
      .from("reading_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      const merged = {
        completedChapters: data.completed_chapters || localProgress.completedChapters || {},
        streak: Math.max(data.streak || 0, localProgress.streak || 0),
        lastReadDate: data.last_read_date || localProgress.lastReadDate,
        lastReadBook: data.last_read_book || localProgress.lastReadBook,
        lastReadChapter: data.last_read_chapter || localProgress.lastReadChapter,
      };
      localStorage.setItem("readingProgress", JSON.stringify(merged));
    }
  } catch {
    // Silent fail
  }
}

/**
 * Push reading progress update to Supabase.
 */
export async function syncReadingProgressUpdate(userId) {
  if (!isSupabaseConfigured() || !userId) return;

  try {
    const sb = await getSupabase();
    if (!sb) return;
    const progress = JSON.parse(localStorage.getItem("readingProgress") || "{}");
    await sb.from("reading_progress").upsert({
      user_id: userId,
      completed_chapters: progress.completedChapters || {},
      streak: progress.streak || 0,
      last_read_date: progress.lastReadDate || null,
      last_read_book: progress.lastReadBook || null,
      last_read_chapter: progress.lastReadChapter || null,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Silent fail
  }
}
