import { getTranslation, USFM_BOOK_IDS } from "../data/translations";
import { dbGet, dbPut } from "../hooks/useDB";

const BASE_URL = "https://bible-api.com";

// Single-chapter books: bible-api.com interprets "Jude 1" as "Jude verse 1"
// so we must request the full verse range instead
const SINGLE_CHAPTER_VERSES = {
  Obadiah: 21,
  Philemon: 25,
  "2 John": 13,
  "3 John": 14,
  Jude: 25,
};

/**
 * Fetch a chapter from bible-api.com (public-domain texts: kjv, asv, web…).
 * Returns { reference, book, chapter, verses: [{ book, chapter, verse, text }] }
 */
export async function fetchChapter(bookName, chapter, apiCode = "kjv") {
  const verseCount = SINGLE_CHAPTER_VERSES[bookName];
  const ref = verseCount
    ? `${bookName} ${chapter}:1-${verseCount}`
    : `${bookName} ${chapter}`;
  const url = `${BASE_URL}/${encodeURIComponent(ref)}?translation=${apiCode}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw new Error(navigator.onLine ? "Failed to reach the Bible text server." : "You're offline. Previously read chapters are available offline.");
  }
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${ref}: ${res.status}`);
  }

  const data = await res.json();

  const verses = data.verses.map((v) => ({
    book: bookName,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text.trim(),
  }));

  return {
    reference: data.reference,
    book: bookName,
    chapter,
    verses,
  };
}

/**
 * Fetch a chapter from API.Bible via our /api/bible-chapter serverless proxy.
 * Used for all translations other than KJV.
 */
async function fetchChapterFromApiBible(bookName, chapter, translation) {
  const bookId = USFM_BOOK_IDS[bookName];
  if (!bookId) {
    throw new Error(`Unknown book: ${bookName}`);
  }

  const params = new URLSearchParams({
    bibleId: translation.bibleId,
    book: bookId,
    chapter: String(chapter),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let res;
  try {
    res = await fetch(`/api/bible-chapter?${params}`, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw new Error(navigator.onLine ? "Failed to reach the Bible text server." : "You're offline. Previously read chapters are available offline.");
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch ${bookName} ${chapter}: ${res.status}`);
  }

  const data = await res.json();

  const verses = (data.verses || []).map((v) => ({
    book: bookName,
    chapter,
    verse: v.verse,
    text: v.text,
  }));

  return {
    reference: `${bookName} ${chapter}`,
    book: bookName,
    chapter,
    verses,
  };
}

/**
 * Unified fetch — routes to the right source based on translation.
 * @param {string} bookName        — e.g. "John"
 * @param {number} chapter         — e.g. 3
 * @param {string} [translationId] — translation id (default "KJV")
 */
export async function fetchChapterByTranslation(bookName, chapter, translationId = "KJV") {
  const translation = getTranslation(translationId);
  if (translation.source === "bible-api") {
    return fetchChapter(bookName, chapter, translation.apiCode || "kjv");
  }
  return fetchChapterFromApiBible(bookName, chapter, translation);
}

/**
 * Chapter fetch that goes through the same IndexedDB cache the reader uses
 * (store "cachedChapters", key `${book}-${chapter}-${translationId}`).
 *
 * Anything that needs verse text — the Compare tab especially — should call
 * this instead of hitting the network per verse. One network call per
 * chapter per translation, then every verse in that chapter is free, and a
 * chapter the reader has already loaded costs nothing at all.
 *
 * In-flight requests are de-duplicated so parallel callers share one fetch.
 */
const inflight = new Map();

export async function getChapterCached(bookName, chapter, translationId = "KJV") {
  const key = `${bookName}-${chapter}-${translationId}`;

  const cached = await dbGet("cachedChapters", key).catch(() => null);
  if (cached?.verses?.length) return cached;

  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    try {
      const result = await fetchChapterByTranslation(bookName, chapter, translationId);
      const record = { key, ...result, translationId, fetchedAt: Date.now() };
      await dbPut("cachedChapters", record).catch(() => {});
      return record;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/**
 * Text of a single verse from the cached chapter (null if unavailable).
 */
export async function getVerseTextCached(bookName, chapter, verse, translationId = "KJV") {
  const data = await getChapterCached(bookName, chapter, translationId);
  const v = (data?.verses || []).find((x) => Number(x.verse) === Number(verse));
  return v?.text?.trim() || null;
}
