/**
 * Reading plans — each plan is an array of daily readings, where
 * each day's `refs` is one or more chapter references.
 *
 * Format: refs are { book, chapter } pairs (we deliberately keep this
 * structured instead of free-form strings so the Reader links open cleanly).
 *
 * To add a plan: append a new object to PLANS. Keep ids stable.
 */

import mcheyneData from "./plans/mcheyne.json";
import chronoData from "./plans/chronological.json";

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

/* ── Classic plans (data built by scripts/build-reading-plans.mjs) ─────── */
// Compact refs: [book, chapter] or [book, chapter, fromVerse, toVerse].
const expandRef = ([book, chapter, from, to]) => (from ? { book, chapter, from, to } : { book, chapter });
/** Flat chapter list for the audio queue (a partial chapter plays as the whole chapter). */
const queueRefs = (refs) => {
  const out = [];
  for (const r of refs) {
    if (!out.some((q) => q.book === r.book && q.chapter === r.chapter)) out.push({ book: r.book, chapter: r.chapter });
  }
  return out;
};

/* M'Cheyne's Calendar for Daily Readings (1842): four readings a day, the first two
   for the family, the last two "secret" (private). Day 1 = January 1. */
const MCHEYNE_LABELS = ["family", "family", "secret", "secret"];
const mcheynePlan = mcheyneData.days.map((day) => {
  const readings = day.map((rs, i) => ({ refs: rs.map(expandRef), label: MCHEYNE_LABELS[i] }));
  return { refs: queueRefs(readings.flatMap((r) => r.refs)), readings };
});

/* Chronological: KJV margin (Ussher) order, split into 365 days by word count. */
// Consecutive chapters of the same book form one reading ("Genesis 1–3", "Psalms 7–9, 12").
const chronologicalPlan = chronoData.days.map((day) => {
  const refs = day.map(expandRef);
  const readings = [];
  for (const r of refs) {
    const last = readings[readings.length - 1];
    if (last && last.refs[0].book === r.book) last.refs.push(r);
    else readings.push({ refs: [r] });
  }
  return { refs, readings };
});

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
  {
    id: "mcheyne",
    name: "M'Cheyne Bible Reading Plan",
    shortName: "M'Cheyne",
    description: "Robert Murray M'Cheyne's 1842 calendar — four readings a day, through the Old Testament once and the New Testament and Psalms twice in a year.",
    duration: 365,
    cover: "🕯️",
    calendar: true, // day 1 = January 1
    days: mcheynePlan,
  },
  {
    id: "chronological-365",
    name: "Chronological Bible in a Year",
    shortName: "Chronological",
    description: "The whole Bible in the order events happened, following the KJV margin (Ussher) chronology used by the app's timeline — psalms with David, prophets with their kings, letters within Acts.",
    duration: 365,
    cover: "⏳",
    days: chronologicalPlan,
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
/** For calendar plans (M'Cheyne): the date a plan day falls on, e.g. "Nov 2". */
export function planDayDate(plan, dayNum, locale) {
  if (!plan?.calendar) return null;
  const d = new Date(2025, 0, dayNum); // a non-leap year, matching the 365-day calendar
  try {
    return d.toLocaleDateString(locale || undefined, { month: "short", day: "numeric" });
  } catch {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}

/** For calendar plans: today's plan day (Feb 29 reads Feb 28's portion). */
export function todaysCalendarDay(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1);
  let doy = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000) + 1;
  const leap = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
  if (leap && doy >= 60) doy -= 1;
  return Math.min(365, Math.max(1, doy));
}

export function getCurrentDay(plan, progress) {
  if (!progress) return 1;
  const completedDays = Object.keys(progress.completedDays || {}).length;
  return Math.min(completedDays + 1, plan.duration);
}
