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
  bookmarks: "bookmarks",
  readingPlanProgress: "reading_plan_progress",
};

// camelCase ↔ snake_case, generic so new fields map automatically
const snake = (k) => k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
const camel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// Older live tables name the verse column "verse" (notes, highlights); send both,
// and let upsertResilient drop whichever the table doesn't have.
const VERSE_ALIAS_TABLES = new Set(["notes", "highlights"]);

function toRow(record, table, userId) {
  const row = { user_id: userId };
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    row[snake(key)] = value;
  }
  if (VERSE_ALIAS_TABLES.has(table) && row.verse_number != null && row.verse == null) row.verse = row.verse_number;
  return row;
}

function fromRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "user_id" || value === null) continue;
    out[camel(key)] = value;
  }
  if (out.verseNumber == null && typeof out.verse === "number" && !("label" in out)) out.verseNumber = out.verse;
  return out;
}

// PostgREST names the missing column in the error message
const missingColumn = (err) =>
  (err?.code === "PGRST204" || err?.code === "42703") && (err.message.match(/'([^']+)' column|column [\w.]*?\.?"?([a-z_]+)"? does not exist/) || []).slice(1).find(Boolean);

/**
 * Upsert that survives schema drift: if the live table lacks a column, drop that
 * field and retry, so one missing column never blocks the whole record.
 */
async function upsertResilient(sb, table, rows) {
  let batch = rows;
  const dropped = [];
  for (let attempt = 0; attempt < 12; attempt++) {
    const { error } = await sb.from(table).upsert(batch, { onConflict: "id,user_id" });
    if (!error) {
      if (dropped.length) console.warn(`[sync] ${table}: live table has no column(s) ${dropped.join(", ")} — run supabase-migration-sync-fix.sql`);
      return true;
    }
    const col = missingColumn(error);
    if (!col) { console.warn(`[sync] ${table} upsert failed:`, error.message); return false; }
    dropped.push(col);
    batch = batch.map(({ [col]: _omit, ...rest }) => rest);
  }
  return false;
}

export function notifySynced() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("theway:synced"));
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
    await upsertResilient(sb, table, [toRow(record, table, userId)]);
  } catch (e) {
    console.warn(`[sync] push ${table} failed:`, e?.message); // local data stays the source of truth
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

    if (error || !data) { if (error) console.warn(`[sync] pull ${table} failed:`, error.message); return []; }

    // Import dbPut dynamically to avoid circular deps
    const { dbPut, dbGetAll } = await import("../hooks/useDB");

    // Get existing local data
    const localItems = await dbGetAll(storeName);
    const localMap = new Map(localItems.map((item) => [item.id, item]));

    // Merge: remote wins if newer, otherwise keep local
    for (const remoteRow of data) {
      const local = fromRow(remoteRow);
      const existing = localMap.get(local.id);

      // Use updatedAt or createdAt for comparison
      const remoteTime = local.updatedAt || local.createdAt || 0;
      const localTime = existing?.updatedAt || existing?.createdAt || 0;

      if (!existing || remoteTime >= localTime) {
        // Merge rather than replace: a table missing a column must not erase that field locally
        await dbPut(storeName, existing ? { ...existing, ...local } : local);
      }
    }

    return await dbGetAll(storeName);
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
    const rows = items.map((item) => toRow(item, table, userId));
    for (let i = 0; i < rows.length; i += 50) {
      await upsertResilient(sb, table, rows.slice(i, i + 50));
    }
  } catch (e) {
    console.warn(`[sync] push-all ${table} failed:`, e?.message);
  }
}

/**
 * Full sync: push local data up, then pull remote data down.
 * Call this on login.
 */
export async function syncAll(userId) {
  if (!isSupabaseConfigured() || !userId) return;

  const stores = ["highlights", "notes", "memoryVerses", "journal", "bookmarks", "readingPlanProgress"];

  // Push local data first (so offline work isn't lost)
  await Promise.all(stores.map((s) => syncPushAll(s, userId)));

  // Then pull remote data (merges by timestamp)
  await Promise.all(stores.map((s) => syncPull(s, userId)));

  // Sync reading progress
  await syncReadingProgress(userId);
  notifySynced();
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
        last_read_book: localProgress.lastRead?.book || null,
        last_read_chapter: localProgress.lastRead?.chapter || null,
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
        completedChapters: (() => {
          const remote = data.completed_chapters || {};
          const local = localProgress.completedChapters || {};
          const merged = { ...local };
          for (const [book, chs] of Object.entries(remote)) {
            merged[book] = [...new Set([...(merged[book] || []), ...chs])];
          }
          return merged;
        })(),
        streak: Math.max(data.streak || 0, localProgress.streak || 0),
        lastReadDate: data.last_read_date || localProgress.lastReadDate,
        lastRead: (data.last_read_book && data.last_read_chapter)
          ? { book: data.last_read_book, chapter: data.last_read_chapter }
          : (localProgress.lastRead || null),
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
      last_read_book: progress.lastRead?.book || null,
      last_read_chapter: progress.lastRead?.chapter || null,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Silent fail
  }
}
