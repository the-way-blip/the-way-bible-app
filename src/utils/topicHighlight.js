/**
 * Bulk highlighting for topic verses.
 * Expands references like "Ephesians 2:8-9" into individual verses
 * and writes/deletes highlight records in IndexedDB + Supabase.
 */
import { dbPut, dbDelete, dbGet } from "../hooks/useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";

/**
 * Parse a verse reference into an array of individual {book, chapter, verse} objects.
 * Handles:
 *   "John 3:16"           → [{ book: "John", chapter: 3, verse: 16 }]
 *   "Ephesians 2:8-9"     → [{ Ephesians, 2, 8 }, { Ephesians, 2, 9 }]
 *   "Psalm 23"            → null  (whole chapter — too broad, skip)
 */
export function expandRef(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  const [, book, chapterStr, startStr, endStr] = m;
  const chapter = parseInt(chapterStr, 10);
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : start;
  const verses = [];
  for (let v = start; v <= end; v++) {
    verses.push({ book: book.trim(), chapter, verse: v });
  }
  return verses;
}

/**
 * Expand a list of refs into a flat array of {book, chapter, verse} objects.
 */
export function expandRefs(refs) {
  const out = [];
  for (const ref of refs) {
    const expanded = expandRef(ref);
    if (expanded) out.push(...expanded);
  }
  return out;
}

const HIGHLIGHT_ID = (book, chapter, verse) => `${book}-${chapter}-${verse}`;

/**
 * Highlight every verse in the list with the given color.
 * Returns the count of highlights actually written.
 */
export async function highlightVerses(refs, color, userId) {
  const verses = expandRefs(refs);
  let written = 0;
  for (const { book, chapter, verse } of verses) {
    const id = HIGHLIGHT_ID(book, chapter, verse);
    const record = {
      id,
      book,
      chapter,
      verseNumber: verse,
      color,
      createdAt: Date.now(),
    };
    await dbPut("highlights", record);
    syncPush("highlights", record, userId);
    written++;
  }
  return written;
}

/**
 * Remove highlights for every verse in the list.
 * Returns the count of highlights actually removed.
 */
export async function unhighlightVerses(refs, userId) {
  const verses = expandRefs(refs);
  let removed = 0;
  for (const { book, chapter, verse } of verses) {
    const id = HIGHLIGHT_ID(book, chapter, verse);
    const existing = await dbGet("highlights", id);
    if (existing) {
      await dbDelete("highlights", id);
      syncDelete("highlights", id, userId);
      removed++;
    }
  }
  return removed;
}

/**
 * Check how many verses in the topic are already highlighted.
 */
export async function countExistingHighlights(refs) {
  const verses = expandRefs(refs);
  let count = 0;
  for (const { book, chapter, verse } of verses) {
    const id = HIGHLIGHT_ID(book, chapter, verse);
    const existing = await dbGet("highlights", id);
    if (existing) count++;
  }
  return count;
}
