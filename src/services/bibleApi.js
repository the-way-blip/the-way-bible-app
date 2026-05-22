import { getTranslation, USFM_BOOK_IDS } from "../data/translations";

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
 * Fetch a chapter from bible-api.com (KJV — public domain).
 * Returns { reference, book, chapter, verses: [{ book, chapter, verse, text }] }
 */
export async function fetchChapter(bookName, chapter) {
  const verseCount = SINGLE_CHAPTER_VERSES[bookName];
  const ref = verseCount
    ? `${bookName} ${chapter}:1-${verseCount}`
    : `${bookName} ${chapter}`;
  const url = `${BASE_URL}/${encodeURIComponent(ref)}?translation=kjv`;

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
    return fetchChapter(bookName, chapter);
  }
  return fetchChapterFromApiBible(bookName, chapter, translation);
}
