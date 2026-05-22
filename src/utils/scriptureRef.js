/**
 * Scripture reference utilities.
 *
 * Patterns matched (examples):
 *   John 3:16
 *   1 Corinthians 13:4-7
 *   Romans 8:28
 *   Psalm 23
 *   Genesis 1:1-3
 *   2 Timothy 3:16-17
 */

// Full ordered book list used for matching (longer names first so they're
// matched before their prefix, e.g. "Song of Solomon" before "Song").
const BOOK_NAMES = [
  "Song of Solomon", "Song of Songs",
  "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings",
  "1 Chronicles", "2 Chronicles",
  "1 Corinthians", "2 Corinthians",
  "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy",
  "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John",
  "Ezra", "Nehemiah", "Esther",
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth",
  "Job", "Psalms", "Psalm", "Proverbs", "Ecclesiastes",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "Galatians", "Ephesians", "Philippians", "Colossians",
  "Philemon", "Hebrews", "James", "Jude", "Revelation",
  "Titus",
];

// Escape a string for use in a RegExp
function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build one big alternation of all book names (longest first = already ordered above)
const BOOK_PATTERN = BOOK_NAMES.map(escRe).join("|");

// Full reference regex: <Book> <Chapter>:<Verse(-Verse)?>
// OR just <Book> <Chapter> (for whole-chapter refs like "Psalm 23")
export const REF_REGEX = new RegExp(
  `((?:${BOOK_PATTERN}))\\s+(\\d+)(?::(\\d+)(?:[-–](\\d+))?)?`,
  "g"
);

/**
 * Parse the first scripture reference found in a string.
 * Returns { book, chapter, verse, endVerse, raw } or null.
 */
export function parseRef(str) {
  REF_REGEX.lastIndex = 0;
  const m = REF_REGEX.exec(str);
  if (!m) return null;
  return {
    raw: m[0],
    book: m[1],
    chapter: parseInt(m[2]),
    verse: m[3] ? parseInt(m[3]) : null,
    endVerse: m[4] ? parseInt(m[4]) : null,
  };
}

/**
 * Build a reader URL from a reference object.
 */
export function refToUrl({ book, chapter }) {
  return `/read/${encodeURIComponent(book)}/${chapter}`;
}

/**
 * Format a reference object as a human-readable string.
 * e.g. "John 3:16", "Romans 8:28-39", "Psalm 23"
 */
export function formatRef({ book, chapter, verse, endVerse }) {
  let s = `${book} ${chapter}`;
  if (verse) {
    s += `:${verse}`;
    if (endVerse) s += `–${endVerse}`;
  }
  return s;
}

/**
 * Split a piece of text into segments, tagging any scripture reference
 * substrings as { type: "ref", ref, text } and plain text as
 * { type: "text", text }.
 *
 * Use this to render rich content with tappable verse chips.
 */
export function tokenizeRefs(text) {
  if (!text) return [{ type: "text", text: "" }];
  REF_REGEX.lastIndex = 0;
  const tokens = [];
  let last = 0;
  let m;

  while ((m = REF_REGEX.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push({ type: "text", text: text.slice(last, m.index) });
    }
    const ref = {
      raw: m[0],
      book: m[1],
      chapter: parseInt(m[2]),
      verse: m[3] ? parseInt(m[3]) : null,
      endVerse: m[4] ? parseInt(m[4]) : null,
    };
    tokens.push({ type: "ref", ref, text: m[0] });
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    tokens.push({ type: "text", text: text.slice(last) });
  }
  return tokens;
}
