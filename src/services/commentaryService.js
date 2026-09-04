/**
 * Commentary service — HelloAO (bible.helloao.org).
 * Free, no API key, public domain / CC licensed.
 * Replaces historicalchristian.faith (broken HTML scraping).
 */

import { dbGet, dbPut } from "../hooks/useDB";
import { USFM_BOOK_IDS } from "../data/translations";

// ── Available commentaries ────────────────────────────────────────────────────
export const COMMENTARIES = [
  { id: "matthew-henry",            name: "Matthew Henry",          short: "MH",  date: "1714", style: "Devotional, practical, warm" },
  { id: "jamieson-fausset-brown",   name: "Jamieson-Fausset-Brown", short: "JFB", date: "1871", style: "Concise and scholarly" },
  { id: "adam-clarke",              name: "Adam Clarke",            short: "AC",  date: "1832", style: "Detailed, word-level" },
  { id: "tyndale",                   name: "Tyndale Study Notes",    short: "TSN", date: "2023", style: "Modern, openly licensed" },
];

// Default commentaries fetched on each chapter load
const DEFAULT_FETCH = ["matthew-henry", "jamieson-fausset-brown", "tyndale"];

// ── BibleHub fallback link ────────────────────────────────────────────────────
const BIBLEHUB_SLUGS = {
  "genesis": "genesis", "exodus": "exodus", "leviticus": "leviticus",
  "numbers": "numbers", "deuteronomy": "deuteronomy", "joshua": "joshua",
  "judges": "judges", "ruth": "ruth", "1 samuel": "1_samuel", "2 samuel": "2_samuel",
  "1 kings": "1_kings", "2 kings": "2_kings", "1 chronicles": "1_chronicles",
  "2 chronicles": "2_chronicles", "ezra": "ezra", "nehemiah": "nehemiah",
  "esther": "esther", "job": "job", "psalms": "psalms", "proverbs": "proverbs",
  "ecclesiastes": "ecclesiastes", "song of solomon": "songs",
  "isaiah": "isaiah", "jeremiah": "jeremiah", "lamentations": "lamentations",
  "ezekiel": "ezekiel", "daniel": "daniel", "hosea": "hosea", "joel": "joel",
  "amos": "amos", "obadiah": "obadiah", "jonah": "jonah", "micah": "micah",
  "nahum": "nahum", "habakkuk": "habakkuk", "zephaniah": "zephaniah",
  "haggai": "haggai", "zechariah": "zechariah", "malachi": "malachi",
  "matthew": "matthew", "mark": "mark", "luke": "luke", "john": "john",
  "acts": "acts", "romans": "romans", "1 corinthians": "1_corinthians",
  "2 corinthians": "2_corinthians", "galatians": "galatians", "ephesians": "ephesians",
  "philippians": "philippians", "colossians": "colossians",
  "1 thessalonians": "1_thessalonians", "2 thessalonians": "2_thessalonians",
  "1 timothy": "1_timothy", "2 timothy": "2_timothy", "titus": "titus",
  "philemon": "philemon", "hebrews": "hebrews", "james": "james",
  "1 peter": "1_peter", "2 peter": "2_peter", "1 john": "1_john",
  "2 john": "2_john", "3 john": "3_john", "jude": "jude", "revelation": "revelation",
};

export function getBibleHubUrl(book, chapter, verse) {
  const slug = BIBLEHUB_SLUGS[book.toLowerCase()];
  if (!slug) return null;
  return `https://biblehub.com/commentaries/${slug}/${chapter}-${verse}.htm`;
}

// ── Fetch one commentary from the proxy ──────────────────────────────────────
async function fetchOne(commentaryId, bookId, chapter) {
  try {
    // Flat route with query param — Vercel's [...path] catch-all in subdirectories
    // only matches one path segment; using ?p= avoids that limitation.
    const res = await fetch(`/api/commentary?p=${commentaryId}/${bookId}/${chapter}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Extract readable text from HelloAO chapter response.
 * API shape: { chapter: { introduction?: string, content: [{ type, number, content: string[] }] } }
 */
function extractText(data) {
  if (!data) return null;

  // All usable content lives inside data.chapter
  const chapter = data.chapter;
  if (!chapter) return null;

  const intro = chapter.introduction || chapter.intro || "";

  const contentItems = chapter.content;
  if (!Array.isArray(contentItems) || contentItems.length === 0) {
    return intro || null;
  }

  // Each item: { type: "verse", number: N, content: string[] }
  const verseTexts = contentItems
    .slice(0, 12)
    .map((item) => {
      const lines = Array.isArray(item.content)
        ? item.content.map((s) => (typeof s === "string" ? s : "")).join(" ")
        : typeof item.content === "string"
        ? item.content
        : "";
      return lines.trim();
    })
    .filter(Boolean)
    .join("\n\n");

  return [intro, verseTexts].filter(Boolean).join("\n\n") || null;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function fetchCommentaries(book, chapter) {
  const cacheKey = `helloao-${book}-${chapter}`;

  // Return cache if fresh (7 days)
  try {
    const cached = await dbGet("cachedChapters", cacheKey);
    if (cached && Date.now() - cached.fetchedAt < 7 * 24 * 60 * 60 * 1000) {
      return cached.commentaries;
    }
  } catch {}

  const bookId = USFM_BOOK_IDS[book];
  if (!bookId) return [];

  // Fetch in parallel
  const settled = await Promise.allSettled(
    DEFAULT_FETCH.map((id) => fetchOne(id, bookId, chapter))
  );

  const commentaries = [];
  for (let i = 0; i < DEFAULT_FETCH.length; i++) {
    const result = settled[i];
    if (result.status !== "fulfilled" || !result.value) continue;

    const meta = COMMENTARIES.find((c) => c.id === DEFAULT_FETCH[i]);
    const text = extractText(result.value);
    if (!text) continue;

    commentaries.push({
      author: meta?.name ?? DEFAULT_FETCH[i],
      date: meta?.date ?? null,
      style: meta?.style ?? null,
      quote: text.length > 2000 ? text.substring(0, 2000) + "…" : text,
      source: "bible.helloao.org",
      commentaryId: DEFAULT_FETCH[i],
    });
  }

  // Cache
  try {
    await dbPut("cachedChapters", {
      key: cacheKey,
      commentaries,
      fetchedAt: Date.now(),
    });
  } catch {}

  return commentaries;
}
