/**
 * Reading plans — each plan is an array of daily readings, where
 * each day's `refs` is one or more chapter references.
 *
 * Format: refs are { book, chapter } pairs (we deliberately keep this
 * structured instead of free-form strings so the Reader links open cleanly).
 *
 * To add a plan: append a new object to PLANS. Keep ids stable.
 */

/* ── Helpers to compactly build chapter ranges ────────────────────────── */
const range = (book, start, end) => {
  const days = [];
  for (let c = start; c <= end; c++) days.push({ refs: [{ book, chapter: c }] });
  return days;
};

/* ── Plan: Gospel of John in 21 days (one chapter/day) ────────────────── */
const johnPlan = range("John", 1, 21);

/* ── Plan: Proverbs 31 days (one chapter/day) ─────────────────────────── */
const proverbsPlan = range("Proverbs", 1, 31);

/* ── Plan: Psalms 60 days (roughly 2-3 chapters/day) ──────────────────── */
const psalmsPlan = (() => {
  const days = [];
  // 150 psalms / 60 days ≈ 2.5 per day. Distribute as 2-3-2-3-…
  let chapter = 1;
  for (let d = 0; d < 60; d++) {
    const count = d % 2 === 0 ? 3 : 2; // 3,2,3,2 → ~150 total over 60 days
    const refs = [];
    for (let i = 0; i < count && chapter <= 150; i++) {
      refs.push({ book: "Psalms", chapter });
      chapter++;
    }
    if (refs.length) days.push({ refs });
  }
  return days;
})();

/* ── Plan: New Testament in 90 days ───────────────────────────────────── */
const ntPlan = (() => {
  const ntBooks = [
    { name: "Matthew",         chapters: 28 },
    { name: "Mark",            chapters: 16 },
    { name: "Luke",            chapters: 24 },
    { name: "John",            chapters: 21 },
    { name: "Acts",            chapters: 28 },
    { name: "Romans",          chapters: 16 },
    { name: "1 Corinthians",   chapters: 16 },
    { name: "2 Corinthians",   chapters: 13 },
    { name: "Galatians",       chapters: 6 },
    { name: "Ephesians",       chapters: 6 },
    { name: "Philippians",     chapters: 4 },
    { name: "Colossians",      chapters: 4 },
    { name: "1 Thessalonians", chapters: 5 },
    { name: "2 Thessalonians", chapters: 3 },
    { name: "1 Timothy",       chapters: 6 },
    { name: "2 Timothy",       chapters: 4 },
    { name: "Titus",           chapters: 3 },
    { name: "Philemon",        chapters: 1 },
    { name: "Hebrews",         chapters: 13 },
    { name: "James",           chapters: 5 },
    { name: "1 Peter",         chapters: 5 },
    { name: "2 Peter",         chapters: 3 },
    { name: "1 John",          chapters: 5 },
    { name: "2 John",          chapters: 1 },
    { name: "3 John",          chapters: 1 },
    { name: "Jude",            chapters: 1 },
    { name: "Revelation",      chapters: 22 },
  ];
  // Flatten into chapter list
  const allChapters = [];
  for (const b of ntBooks) {
    for (let c = 1; c <= b.chapters; c++) allChapters.push({ book: b.name, chapter: c });
  }
  // 260 chapters / 90 days ≈ 2.89 per day → 3-3-3-3-3-2 pattern
  const perDay = Math.ceil(allChapters.length / 90);
  const days = [];
  for (let i = 0; i < allChapters.length; i += perDay) {
    days.push({ refs: allChapters.slice(i, i + perDay) });
  }
  return days;
})();

/* ── Plan: Whole Bible in 365 days (3-4 chapters/day) ─────────────────── */
const wholeBiblePlan = (() => {
  // Generate from the full canon ordering. ~1189 chapters / 365 ≈ 3.26 → 3-3-4
  const books = [
    { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 },
    { name: "Leviticus", chapters: 27 }, { name: "Numbers", chapters: 36 },
    { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
    { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 },
    { name: "1 Samuel", chapters: 31 }, { name: "2 Samuel", chapters: 24 },
    { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
    { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 },
    { name: "Ezra", chapters: 10 }, { name: "Nehemiah", chapters: 13 },
    { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
    { name: "Psalms", chapters: 150 }, { name: "Proverbs", chapters: 31 },
    { name: "Ecclesiastes", chapters: 12 }, { name: "Song of Solomon", chapters: 8 },
    { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
    { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 },
    { name: "Daniel", chapters: 12 }, { name: "Hosea", chapters: 14 },
    { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
    { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 },
    { name: "Micah", chapters: 7 }, { name: "Nahum", chapters: 3 },
    { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
    { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 },
    { name: "Malachi", chapters: 4 },
    { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 },
    { name: "Luke", chapters: 24 }, { name: "John", chapters: 21 },
    { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
    { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 },
    { name: "Galatians", chapters: 6 }, { name: "Ephesians", chapters: 6 },
    { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
    { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 },
    { name: "1 Timothy", chapters: 6 }, { name: "2 Timothy", chapters: 4 },
    { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
    { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 },
    { name: "1 Peter", chapters: 5 }, { name: "2 Peter", chapters: 3 },
    { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
    { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 },
    { name: "Revelation", chapters: 22 },
  ];
  const allChapters = [];
  for (const b of books) for (let c = 1; c <= b.chapters; c++) allChapters.push({ book: b.name, chapter: c });
  // Spread evenly across 365 days
  const perDay = Math.ceil(allChapters.length / 365);
  const days = [];
  for (let i = 0; i < allChapters.length; i += perDay) {
    days.push({ refs: allChapters.slice(i, i + perDay) });
  }
  return days;
})();

/* ── Plan: Sermon on the Mount in 7 days (deep dive in Matthew 5-7) ───── */
const sermonOnMountPlan = [
  { refs: [{ book: "Matthew", chapter: 5 }], note: "Beatitudes — the heart of Jesus' kingdom ethic" },
  { refs: [{ book: "Matthew", chapter: 5 }], note: "Re-read with focus on 'You have heard it said... but I say'" },
  { refs: [{ book: "Matthew", chapter: 6 }], note: "Prayer, fasting, and treasures" },
  { refs: [{ book: "Matthew", chapter: 6 }], note: "Re-read with focus on anxiety + the lilies" },
  { refs: [{ book: "Matthew", chapter: 7 }], note: "Judging, asking, the narrow way" },
  { refs: [{ book: "Matthew", chapter: 7 }], note: "Re-read with focus on the wise and foolish builders" },
  { refs: [{ book: "Matthew", chapter: 5 }, { book: "Matthew", chapter: 6 }, { book: "Matthew", chapter: 7 }], note: "Read all three chapters together as one sermon" },
];

/* ─────────────────────────────────────────────────────────────────────── */

const PLANS = [
  {
    id: "john-21",
    name: "Gospel of John",
    shortName: "John",
    description: "21 days through the Gospel of John — the most-read introduction to Jesus.",
    duration: 21,
    cover: "📖",
    days: johnPlan,
  },
  {
    id: "proverbs-31",
    name: "Proverbs in 31 Days",
    shortName: "Proverbs",
    description: "A chapter a day for a month — wisdom for everyday life.",
    duration: 31,
    cover: "🦉",
    days: proverbsPlan,
  },
  {
    id: "psalms-60",
    name: "Psalms in 60 Days",
    shortName: "Psalms",
    description: "All 150 psalms in two months — worship, lament, and praise.",
    duration: 60,
    cover: "🎵",
    days: psalmsPlan,
  },
  {
    id: "sermon-mount-7",
    name: "Sermon on the Mount",
    shortName: "Sermon",
    description: "One week of slow, repeated reading through Matthew 5-7. Jesus' core teaching.",
    duration: 7,
    cover: "⛰️",
    days: sermonOnMountPlan,
  },
  {
    id: "nt-90",
    name: "New Testament in 90 Days",
    shortName: "NT 90",
    description: "All 27 New Testament books in three months — about 3 chapters per day.",
    duration: 90,
    cover: "✝️",
    days: ntPlan,
  },
  {
    id: "bible-365",
    name: "Whole Bible in a Year",
    shortName: "Bible 365",
    description: "All 66 books in 365 days — 3-4 chapters per day in canonical order.",
    duration: 365,
    cover: "📚",
    days: wholeBiblePlan,
  },
];

export default PLANS;

export function getPlan(id) {
  return PLANS.find((p) => p.id === id) || null;
}

/**
 * Determine the user's current day in a plan based on their progress
 * record. Returns 1-indexed day.
 */
export function getCurrentDay(plan, progress) {
  if (!progress) return 1;
  const completedDays = Object.keys(progress.completedDays || {}).length;
  return Math.min(completedDays + 1, plan.duration);
}
