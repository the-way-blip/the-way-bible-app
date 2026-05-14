// Commentary service — fetches from multiple free sources
// 1. historicalchristian.faith (church fathers + classic commentators)
// 2. Fallback: links to BibleHub commentaries

import { dbGet, dbPut } from "../hooks/useDB";

const BOOK_SLUGS = {
  "genesis": "genesis", "exodus": "exodus", "leviticus": "leviticus",
  "numbers": "numbers", "deuteronomy": "deuteronomy", "joshua": "joshua",
  "judges": "judges", "ruth": "ruth", "1 samuel": "1-samuel", "2 samuel": "2-samuel",
  "1 kings": "1-kings", "2 kings": "2-kings", "1 chronicles": "1-chronicles",
  "2 chronicles": "2-chronicles", "ezra": "ezra", "nehemiah": "nehemiah",
  "esther": "esther", "job": "job", "psalms": "psalms", "proverbs": "proverbs",
  "ecclesiastes": "ecclesiastes", "song of solomon": "song-of-solomon",
  "isaiah": "isaiah", "jeremiah": "jeremiah", "lamentations": "lamentations",
  "ezekiel": "ezekiel", "daniel": "daniel", "hosea": "hosea", "joel": "joel",
  "amos": "amos", "obadiah": "obadiah", "jonah": "jonah", "micah": "micah",
  "nahum": "nahum", "habakkuk": "habakkuk", "zephaniah": "zephaniah",
  "haggai": "haggai", "zechariah": "zechariah", "malachi": "malachi",
  "matthew": "matthew", "mark": "mark", "luke": "luke", "john": "john",
  "acts": "acts", "romans": "romans", "1 corinthians": "1-corinthians",
  "2 corinthians": "2-corinthians", "galatians": "galatians", "ephesians": "ephesians",
  "philippians": "philippians", "colossians": "colossians",
  "1 thessalonians": "1-thessalonians", "2 thessalonians": "2-thessalonians",
  "1 timothy": "1-timothy", "2 timothy": "2-timothy", "titus": "titus",
  "philemon": "philemon", "hebrews": "hebrews", "james": "james",
  "1 peter": "1-peter", "2 peter": "2-peter", "1 john": "1-john",
  "2 john": "2-john", "3 john": "3-john", "jude": "jude", "revelation": "revelation",
};

// BibleHub book slugs for fallback links
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

// ── Doctrinal filter ──
// Exclude authors with heterodox views that contradict the fundamentals
// (virgin birth, blood atonement, bodily resurrection, physical return of Christ,
// inerrancy of Scripture) as compiled by R.A. Torrey in "The Fundamentals" (1910-1915).
const EXCLUDED_AUTHORS = new Set([
  // Condemned for pre-existence of souls, universalism, allegorizing bodily resurrection
  "origen", "origen of alexandria", "pseudo-origen",
  // Denied original sin and necessity of grace; undermines substitutionary atonement
  "pelagius", "julian of eclanum",
  // Denied deity of Christ
  "arius",
  // Gnostic heretics
  "valentinus", "heracleon",
  // Denied full humanity of Christ
  "apollinaris", "apollinaris of laodicea",
  // Condemned for Nestorianism; denied unity of Christ's person
  "theodore of mopsuestia",
  // Jewish philosopher, not a Christian
  "philo", "philo of alexandria",
  // Condemned alongside Origen for Origenist views
  "didymus the blind", "didymus", "evagrius ponticus", "evagrius",
]);

function isApprovedAuthor(authorName) {
  if (!authorName) return false;
  const lower = authorName.toLowerCase().trim();
  for (const excluded of EXCLUDED_AUTHORS) {
    if (lower === excluded || lower.includes(excluded)) return false;
  }
  return true;
}

export function getBibleHubUrl(book, chapter, verse) {
  const slug = BIBLEHUB_SLUGS[book.toLowerCase()];
  if (!slug) return null;
  return `https://biblehub.com/commentaries/${slug}/${chapter}-${verse}.htm`;
}

export async function fetchCommentaries(book, chapter) {
  const cacheKey = `commentary-${book}-${chapter}`;

  // Check cache
  try {
    const cached = await dbGet("cachedChapters", cacheKey);
    if (cached && Date.now() - cached.fetchedAt < 7 * 24 * 60 * 60 * 1000) {
      return cached.commentaries.filter((c) => isApprovedAuthor(c.author));
    }
  } catch {}

  const slug = BOOK_SLUGS[book.toLowerCase()];
  if (!slug) return [];

  try {
    const url = `/api/commentary/${slug}/${chapter}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const html = await res.text();
    const commentaries = parseCommentaryHTML(html).filter((c) => isApprovedAuthor(c.author));

    // Cache
    try {
      await dbPut("cachedChapters", {
        key: cacheKey,
        commentaries,
        fetchedAt: Date.now(),
      });
    } catch {}

    return commentaries;
  } catch {
    return [];
  }
}

function parseCommentaryHTML(html) {
  const commentaries = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const cards = doc.querySelectorAll(".commentary-card");
  for (const card of cards) {
    const header = card.querySelector(".card-header");
    const body = card.querySelector(".card-body");
    if (!header || !body) continue;

    const titleEl = header.querySelector(".card-title");
    if (!titleEl) continue;

    const titleText = titleEl.textContent.trim();
    // Extract author and verse reference
    // Format: "[AD 347] John Chrysostom on Genesis 1:1"
    const dateMatch = titleText.match(/\[AD (\d+)\]/);
    const date = dateMatch ? dateMatch[1] : null;

    // Get author from the link
    const authorLink = titleEl.querySelector("a");
    const author = authorLink ? authorLink.textContent.trim() : titleText.replace(/\[AD \d+\]\s*/, "").split(" on ")[0].trim();

    // Get verse reference
    const verseMatch = titleText.match(/on\s+(.+)$/);
    const verseRef = verseMatch ? verseMatch[1].trim() : "";

    // Get quote text
    const quoteEl = body.querySelector(".show-read-more");
    const quote = quoteEl
      ? quoteEl.innerHTML
          .replace(/<br\s*\/?>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .trim()
      : body.textContent.trim();

    if (quote && author) {
      commentaries.push({
        author,
        date: date ? `AD ${date}` : null,
        verseRef,
        quote: quote.substring(0, 1000) + (quote.length > 1000 ? "..." : ""),
        source: titleEl.querySelector("small")?.textContent.trim() || null,
      });
    }
  }

  return commentaries;
}
