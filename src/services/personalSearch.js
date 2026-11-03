// Search the reader's own study data (IndexedDB): notes and highlights.

import { dbGetAll } from "../hooks/useDB";
import bibleBooks from "../data/bibleBooks";
import { USFM_BOOK_IDS } from "../data/translations";
import { loadIndex, getVerseText, stem } from "./bibleSearch";

const BOOK_ORDER = new Map(bibleBooks.map((b, i) => [b.name, i]));
const READER_BOOK = { Psalm: "Psalms", "Song of Songs": "Song of Solomon" };
const readerBook = (b) => READER_BOOK[b] || b;

export const verseOf = (item) => item.verseNumber ?? item.verse;

export const studyVerseUrl = (item) =>
  `/read/${encodeURIComponent(readerBook(item.book))}/${item.chapter}${verseOf(item) ? `?verse=${parseInt(verseOf(item), 10) || verseOf(item)}` : ""}`;

export const studyRef = (item) => `${readerBook(item.book)} ${item.chapter}${verseOf(item) ? `:${verseOf(item)}` : ""}`;

const canonical = (a, b) =>
  (BOOK_ORDER.get(readerBook(a.book)) ?? 99) - (BOOK_ORDER.get(readerBook(b.book)) ?? 99)
  || a.chapter - b.chapter || (parseInt(verseOf(a), 10) || 0) - (parseInt(verseOf(b), 10) || 0);

/**
 * Parse a personal-search query: "#hope grace \"living water\" redeem*"
 * → { tags: ["hope"], words: ["grace", "redeem"], phrases: ["living water"] }
 * Every word matches as a word prefix ("redeem" finds "redeemed"), so a trailing * is optional.
 */
export function parsePersonalQuery(raw) {
  const phrases = [];
  let rest = (raw || "").replace(/"([^"]+)"/g, (_, p) => { phrases.push(p.trim().toLowerCase()); return " "; });
  const tags = [];
  rest = rest.replace(/#([\p{L}\p{N}_-]+)/gu, (_, tg) => { tags.push(tg.toLowerCase()); return " "; });
  const words = (rest.toLowerCase().replace(/[’‘]/g, "'").match(/[\p{L}\p{N}'*-]+/gu) || [])
    .map((w) => w.replace(/\*/g, "").replace(/^'+|'+$/g, ""))
    .filter((w) => w.length >= 1);
  return { tags, words, phrases };
}

const wordList = (lower) => lower.replace(/[’‘]/g, "'").match(/[\p{L}\p{N}'-]+/gu) || [];
const normTag = (t) => String(t || "").replace(/^#/, "").trim().toLowerCase();

/** Notes matching words (prefix), quoted phrases and #tags — all must match. Empty query = all notes, newest first. */
export async function searchNotes(raw, { books = null } = {}) {
  const all = (await dbGetAll("notes").catch(() => [])).filter((n) => n && (n.text || n.tags?.length));
  const { tags, words, phrases } = parsePersonalQuery(raw);
  const results = [];
  for (const n of all) {
    if (books && !books.has(readerBook(n.book))) continue;
    const lower = String(n.text || "").toLowerCase();
    const noteTags = (n.tags || []).map(normTag);
    if (tags.length && !tags.every((tg) => noteTags.some((nt) => nt === tg || nt.startsWith(tg)))) continue;
    if (phrases.length && !phrases.every((p) => lower.includes(p))) continue;
    if (words.length) {
      const ws = wordList(lower);
      // A word may also match a tag ("hope" finds a note tagged #hope)
      if (!words.every((w) => ws.some((x) => x.startsWith(w)) || noteTags.some((nt) => nt.startsWith(w)))) continue;
    }
    results.push(n);
  }
  const hasQuery = tags.length || words.length || phrases.length;
  results.sort(hasQuery ? canonical : (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  return { results, total: results.length, words, phrases, tags, count: all.length };
}

/** Every tag used across the reader's notes, with counts (most used first). */
export async function noteTagCounts() {
  const all = await dbGetAll("notes").catch(() => []);
  const counts = new Map();
  for (const n of all) for (const t of n?.tags || []) {
    const k = normTag(t);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// KJV per-book files as a fallback when a verse isn't in the search index
const kjvBooks = new Map();
function loadKjvBook(book) {
  const usfm = USFM_BOOK_IDS[readerBook(book)];
  if (!usfm) return Promise.resolve(null);
  if (!kjvBooks.has(usfm)) {
    kjvBooks.set(usfm, fetch(`/data/bibles/kjv/${usfm}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => {
      kjvBooks.delete(usfm);
      return null;
    }));
  }
  return kjvBooks.get(usfm);
}

async function kjvText(h) {
  const v = parseInt(verseOf(h), 10);
  const fromIndex = getVerseText(readerBook(h.book), Number(h.chapter), v);
  if (fromIndex) return fromIndex;
  const data = await loadKjvBook(h.book);
  return data?.[String(h.chapter)]?.[v - 1] || "";
}

/**
 * Query stem `q` vs verse-word stem `w`: equal, a typed prefix ("redee" → redeemed),
 * or a stem the stemmer cut shorter ("love" vs "loved" → "lov").
 */
export const stemMatch = (q, w) =>
  q === w || (q.length >= 4 && w.startsWith(q)) || (w.length >= 3 && q.startsWith(w) && q.length - w.length <= 2);

/**
 * Highlighted verses, optionally filtered by colour and by words/phrases in the KJV text
 * (words match by stem, like Bible search). Results carry `text`.
 */
export async function searchHighlights(raw, { color = "all", books = null } = {}) {
  const all = (await dbGetAll("highlights").catch(() => [])).filter((h) => h && h.book && h.chapter);
  const colorCounts = {};
  for (const h of all) colorCounts[h.color] = (colorCounts[h.color] || 0) + 1;
  let list = all.filter((h) => (color === "all" || h.color === color) && (!books || books.has(readerBook(h.book))));
  await loadIndex().catch(() => {});
  const withText = await Promise.all(list.map(async (h) => ({ ...h, text: await kjvText(h) })));
  const { words, phrases } = parsePersonalQuery(raw);
  const stems = words.map(stem).filter(Boolean);
  list = withText.filter((h) => {
    if (!stems.length && !phrases.length) return true;
    const lower = h.text.toLowerCase().replace(/[’‘]/g, "'");
    if (phrases.length && !phrases.every((p) => lower.includes(p))) return false;
    if (stems.length) {
      const ws = new Set(wordList(lower).map(stem));
      if (!stems.every((s) => ws.has(s) || [...ws].some((x) => stemMatch(s, x)))) return false;
    }
    return true;
  });
  list.sort(canonical);
  return { results: list, total: list.length, stems, phrases, count: all.length, colorCounts };
}

/** Cheap counts for the scope switcher. */
export async function studyCounts() {
  const [notes, highlights] = await Promise.all([
    dbGetAll("notes").catch(() => []),
    dbGetAll("highlights").catch(() => []),
  ]);
  return { notes: notes.filter((n) => n && (n.text || n.tags?.length)).length, highlights: highlights.length };
}

/** User-chosen names for highlight colours (localStorage "highlightLabels": { color: name }). */
export function getHighlightLabels() {
  try {
    const v = JSON.parse(localStorage.getItem("highlightLabels") || "null");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
