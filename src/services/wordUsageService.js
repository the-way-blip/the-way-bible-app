// "See how a word is used" data for the word study page: per-book counts with
// beyond-chance flags, the verses that use the word, and the words it is most
// often found with. Built by scripts/build-word-usage.mjs into sharded files
// (/data/word-usage/<H|G><floor(n/50)>.json, ≤ ~50 KB each).
import BIBLE_BOOKS from "../data/bibleBooks";
import { USFM_BOOK_IDS } from "../data/translations";

const shards = new Map();
const kjvBooks = new Map();

function shardOf(id) {
  const m = /^([HG])(\d+)$/.exec(id || "");
  return m ? `${m[1]}${Math.floor(Number(m[2]) / 50)}` : null;
}

/**
 * Returns null when there is no tagged data, else
 * { total, books: [{ index, name, count, flag, expected }] (all 66, canonical order),
 *   verses: { [bookIndex]: [{ chapter, verse }] }, foundWith: [{ id, shared, gloss }] }.
 * flag: 1 more than expected, -1 fewer, 0 neither.
 */
export async function getWordUsage(id) {
  const shard = shardOf(id);
  if (!shard) return null;
  if (!shards.has(shard)) {
    shards.set(shard, fetch(`/data/word-usage/${shard}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => {
      shards.delete(shard);
      return null;
    }));
  }
  const e = (await shards.get(shard))?.[id];
  if (!e) return null;
  const books = BIBLE_BOOKS.map((b, index) => ({ index, name: b.name, count: 0, flag: 0, expected: null }));
  for (const [bi, count, flag, expected] of e.b) Object.assign(books[bi], { count, flag, expected: expected ?? null });
  for (const [bi, expected] of e.z || []) Object.assign(books[bi], { flag: -1, expected });
  const verses = {};
  for (const [bi, list] of Object.entries(e.v)) verses[bi] = list.map((cv) => ({ chapter: Math.floor(cv / 1000), verse: cv % 1000 }));
  return { total: e.n, books, verses, foundWith: e.f.map(([fid, shared, gloss]) => ({ id: fid, shared, gloss })) };
}

/** Plain KJV text for the given verses of one book: [{ chapter, verse, text }]. */
export async function getKjvVerses(bookName, refs) {
  const usfm = USFM_BOOK_IDS[bookName];
  if (!usfm) return refs.map((r) => ({ ...r, text: "" }));
  if (!kjvBooks.has(usfm)) {
    kjvBooks.set(usfm, fetch(`/data/bibles/kjv/${usfm}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => {
      kjvBooks.delete(usfm);
      return null;
    }));
  }
  const book = await kjvBooks.get(usfm);
  return refs.map((r) => ({ ...r, text: book?.[String(r.chapter)]?.[r.verse - 1] || "" }));
}
