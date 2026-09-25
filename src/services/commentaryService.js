/**
 * Commentary service — HelloAO (bible.helloao.org).
 * Free, no API key, public domain / CC licensed.
 * Replaces historicalchristian.faith (broken HTML scraping).
 */

import { dbGet, dbPut } from "../hooks/useDB";
import { USFM_BOOK_IDS } from "../data/translations";
import COVERAGE from "../data/commentaryCoverage.json";
import VERSE_COUNTS from "../data/verseCounts.json";

// ── Available commentaries ────────────────────────────────────────────────────
// source "helloao" = fetched per chapter from bible.helloao.org (CORS-enabled, no key)
// source "local"   = static JSON built from CrossWire SWORD modules by
//                    scripts/build-sword-data.py → public/data/commentary/<id>/<USFM>.json
export const COMMENTARIES = [
  { id: "matthew-henry",                   name: "Matthew Henry",                  short: "MH",   date: "1706–1721", style: "Devotional, practical, warm",            source: "helloao" },
  { id: "jamieson-fausset-brown",          name: "Jamieson-Fausset-Brown",         short: "JFB",  date: "1871",      style: "Concise and scholarly",                  source: "helloao" },
  { id: "john-gill",                       name: "John Gill",                      short: "Gill", date: "1746–1763", style: "Verse by verse, Hebrew & Jewish background", source: "helloao" },
  { id: "spurgeon-treasury-of-david",      name: "Spurgeon — Treasury of David",   short: "TOD",  date: "1869–1885", style: "The classic devotional work on the Psalms", source: "local" },
  { id: "keil-delitzsch",                  name: "Keil & Delitzsch",               short: "K&D",  date: "1861–1875", style: "Scholarly Old Testament, Hebrew text",   source: "helloao" },
  { id: "barnes",                          name: "Barnes' Notes",                  short: "Barnes", date: "1832–1853", style: "Clear explanatory notes for lay readers", source: "local" },
  { id: "john-calvin",                     name: "John Calvin",                    short: "Calvin", date: "1540–1564", style: "Reformation exposition",               source: "helloao" },
  { id: "matthew-henry-concise",           name: "Matthew Henry (Concise)",        short: "MHC",  date: "1706",      style: "Short devotional summaries",             source: "local", passages: true },
  { id: "wesley",                          name: "John Wesley's Notes",            short: "Wesley", date: "1755–1765", style: "Brief, pastoral",                      source: "local" },
  { id: "adam-clarke",                     name: "Adam Clarke",                    short: "AC",   date: "1810–1826", style: "Detailed, word-level",                   source: "helloao" },
  { id: "peoples-new-testament",           name: "People's New Testament",         short: "PNT",  date: "1891",      style: "Plain explanatory notes (B. W. Johnson)", source: "local" },
  { id: "scofield",                        name: "Scofield Reference Notes",       short: "Scofield", date: "1917",  style: "Dispensational study notes",             source: "local" },
  { id: "geneva-notes",                    name: "Geneva Bible Notes",             short: "GBN",  date: "1599",      style: "The Reformers' margin notes",            source: "local" },
  { id: "burkitt",                         name: "Burkitt's Expository Notes",     short: "Burkitt", date: "1700–1703", style: "Practical observations on the NT",    source: "local" },
  { id: "family-bible-notes",              name: "Family Bible Notes",             short: "FBN",  date: "c. 1850",   style: "Short notes for family reading",         source: "local" },
  { id: "fourfold-gospel",                 name: "The Fourfold Gospel",            short: "TFG",  date: "1914",      style: "Harmony of the Gospels (McGarvey & Pendleton)", source: "local" },
  { id: "catena-aurea",                    name: "Catena Aurea (Aquinas)",         short: "Catena", date: "c. 1264", style: "Church Fathers on the Gospels",          source: "local" },
  { id: "lightfoot",                       name: "John Lightfoot",                 short: "Lightfoot", date: "1658–1674", style: "Talmud & Hebrew background (Gospels)", source: "local" },
  { id: "tyndale",                         name: "Tyndale Study Notes",            short: "TSN",  date: "2023",      style: "Modern, openly licensed (CC BY-SA)",     source: "helloao" },
  { id: "treasury-of-scripture-knowledge", name: "Treasury of Scripture Knowledge", short: "TSK", date: "c. 1880",   style: "Cross-references for every verse",       source: "local", kind: "crossrefs" },
];

export function getCommentariesForBook(book) {
  const usfm = USFM_BOOK_IDS[book];
  return COMMENTARIES.filter((c) => COVERAGE.commentaries[c.id]?.includes(usfm));
}

// ── Loading ───────────────────────────────────────────────────────────────────
// Normalized chapter shape: { intro: string, sections: [{ start, end, label, text }] }
const bookFiles = new Map(); // file path → Promise<json>

// Books over ~1 MB are split into one file per chapter (see scripts/build-sword-data.py)
function loadLocalChapter(id, usfm, chapter) {
  const chunked = COVERAGE.chunked?.[id]?.includes(usfm);
  const key = chunked ? `${id}/${usfm}/${chapter}` : `${id}/${usfm}`;
  if (!bookFiles.has(key)) {
    bookFiles.set(key, fetch(`/data/commentary/${key}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => {
      bookFiles.delete(key);
      return null;
    }));
  }
  return bookFiles.get(key).then((data) => (chunked ? data : data?.[String(chapter)]));
}

const rangeLabel = (a, b) => (b && b !== a ? `${a}–${b}` : `${a}`);

// passages: the commentary writes one essay per passage, so a section runs
// until the next one starts (its stored range can be narrower than its text).
function normalizeLocal(entries, { passages = false, lastVerse = 0 } = {}) {
  let intro = "";
  const sections = [];
  for (const [key, raw] of entries || []) {
    let text = raw.replace(/\r/g, "");
    if (key === "intro") { intro = text; continue; }
    const [a, b] = key.split("-").map(Number);
    if (passages && sections.length === 0) {
      const head = text.search(/^Verses? \d/m);
      if (head > 0) { intro = text.slice(0, head).trim(); text = text.slice(head); }
    }
    sections.push({ start: a, end: b || a, text });
  }
  if (passages) {
    sections.forEach((s, i) => {
      const next = sections[i + 1]?.start ?? lastVerse + 1;
      if (next - 1 > s.end) s.end = next - 1;
    });
  }
  sections.forEach((s) => { s.label = rangeLabel(s.start, s.end); });
  return { intro, sections };
}

function normalizeHelloAO(data, lastVerse) {
  const ch = data?.chapter;
  if (!ch) return null;
  const items = (ch.content || []).filter((x) => x.type === "verse" && x.number);
  const sections = items.map((item, i) => {
    const text = (Array.isArray(item.content) ? item.content : [item.content])
      .map((s) => (typeof s === "string" ? s : s?.text || ""))
      .join("\n\n")
      .replace(/&c(?![a-z;.])/g, "&c.")
      .trim();
    // HelloAO keys a section by its first verse; it runs until the next section
    // (the last one runs to the end of the chapter)
    const next = items[i + 1]?.number ?? (lastVerse || item.number) + 1;
    const end = next - 1 > item.number ? next - 1 : item.number;
    return { start: item.number, end, label: rangeLabel(item.number, end), text };
  }).filter((s) => s.text);
  return { intro: (ch.introduction || "").trim(), sections };
}

/**
 * One commentary for one chapter, normalized. Cached in IndexedDB (HelloAO) or
 * in memory per book (local files are already static and HTTP-cached).
 */
export async function loadCommentary(id, book, chapter) {
  const meta = COMMENTARIES.find((c) => c.id === id);
  const usfm = USFM_BOOK_IDS[book];
  if (!meta || !usfm) return null;
  const lastVerse = VERSE_COUNTS[usfm]?.[chapter - 1] || 0;

  if (meta.source === "local") {
    const entries = await loadLocalChapter(id, usfm, chapter).catch(() => null);
    return entries ? normalizeLocal(entries, { passages: meta.passages, lastVerse }) : null;
  }

  const cacheKey = `cmt3-${id}-${usfm}-${chapter}`;
  try {
    const cached = await dbGet("cachedChapters", cacheKey);
    if (cached?.data) return cached.data;
  } catch {}
  const raw = await fetchOne(id, usfm, chapter);
  const data = normalizeHelloAO(raw, lastVerse);
  if (data && (data.sections.length || data.intro)) {
    dbPut("cachedChapters", { key: cacheKey, data, fetchedAt: Date.now() }).catch(() => {});
  }
  return data;
}

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
    // bible.helloao.org sends Access-Control-Allow-Origin: *, so no proxy is needed
    const res = await fetch(`https://bible.helloao.org/api/c/${commentaryId}/${bookId}/${chapter}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
