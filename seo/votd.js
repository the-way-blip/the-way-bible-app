/**
 * seo/votd.js
 * Curated pool for /verse-of-the-day. A deterministic function of the date
 * (UTC day-of-year mod pool length) picks today's verse — same verse for
 * everyone all day, changes at midnight UTC, no state or storage needed.
 *
 * Every reference here must resolve in seo/data/kjv.json; `node seo/check.mjs`
 * verifies that alongside the topic-page references.
 */
export const VOTD_POOL = [
  "John 3:16", "Philippians 4:13", "Jeremiah 29:11", "Romans 8:28", "Psalm 23:1",
  "Proverbs 3:5-6", "Joshua 1:9", "Isaiah 41:10", "Romans 12:2", "Psalm 46:1",
  "2 Corinthians 5:17", "Matthew 6:33", "Psalm 119:105", "Isaiah 40:31", "Philippians 4:6-7",
  "1 Corinthians 13:4-7", "Galatians 5:22-23", "Ephesians 2:8-9", "Psalm 37:4", "Matthew 11:28",
  "Deuteronomy 31:6", "Psalm 27:1", "Romans 5:8", "1 Peter 5:7", "Psalm 34:8",
  "Hebrews 11:1", "James 1:2-3", "Psalm 121:1-2", "Matthew 28:19-20", "1 John 4:19",
  "Psalm 91:1-2", "Colossians 3:23", "Romans 10:9", "Psalm 139:14", "Lamentations 3:22-23",
  "Isaiah 26:3", "Proverbs 16:3", "Matthew 6:34", "2 Timothy 1:7", "Psalm 118:24",
  "John 14:6", "Ephesians 6:10-11", "Psalm 55:22", "Romans 15:13", "Nahum 1:7",
  "1 Thessalonians 5:16-18", "Proverbs 18:10", "Isaiah 43:2", "Psalm 30:5", "Micah 6:8",
  "John 16:33", "Galatians 2:20", "Psalm 100:4-5", "Ecclesiastes 3:1", "Colossians 3:2",
  "1 Corinthians 10:13", "Matthew 5:16", "Psalm 34:18", "Zephaniah 3:17", "Hebrews 13:5",
  "John 1:1", "Psalm 19:1", "Matthew 19:26", "Romans 8:38-39", "Psalm 51:10",
  "Proverbs 22:6", "Isaiah 9:6", "1 Peter 2:9", "Psalm 46:10", "James 4:7",
  "John 8:32", "Ephesians 3:20", "Psalm 143:8", "Matthew 7:7", "Romans 12:1",
  "Psalm 16:11", "2 Corinthians 12:9", "Isaiah 54:17", "Proverbs 31:25", "John 10:10",
  "1 John 1:9", "Psalm 121:7-8", "Galatians 6:9", "Hebrews 12:1-2", "Psalm 62:1-2",
  "Matthew 5:9", "Romans 8:31", "Psalm 84:11", "Isaiah 55:8-9", "John 15:5",
  "Philippians 1:6", "Psalm 27:14", "Ephesians 4:32", "1 Corinthians 15:57", "Psalm 73:26",
  "Joshua 24:15", "Matthew 6:26", "Romans 6:23", "Psalm 90:12", "Deuteronomy 6:5",
  "1 Timothy 4:12", "Psalm 4:8", "John 13:34-35", "2 Corinthians 4:16-18", "Psalm 145:18",
  "Proverbs 3:9-10", "Titus 2:11-12", "Psalm 68:19", "James 1:17", "John 6:35",
  "Colossians 3:15", "Psalm 119:11", "Isaiah 12:2", "Hebrews 4:16", "Psalm 32:8",
  "Matthew 22:37-39", "1 Peter 1:8-9", "Psalm 37:23-24", "Ephesians 1:7", "Ruth 1:16",
  "Romans 14:8", "Psalm 103:2-3", "Micah 7:8", "1 Corinthians 16:13-14", "Psalm 25:4-5",
  "Isaiah 30:21", "John 11:25-26", "Psalm 42:11", "Habakkuk 3:19", "Proverbs 4:23",
  "2 Thessalonians 3:16", "Psalm 5:3", "James 1:5", "Isaiah 41:13", "John 3:17",
  "Psalm 138:8", "1 Corinthians 2:9", "Romans 12:12", "Psalm 20:7", "Matthew 5:4",
  "Colossians 4:6", "Psalm 107:1", "Hebrews 10:23", "1 John 3:1", "Psalm 33:20-22",
  "Genesis 1:1", "Revelation 21:4", "Psalm 23:4", "John 14:27", "Proverbs 17:22",
  "Isaiah 58:11", "1 Peter 3:15", "Psalm 86:5", "Ephesians 4:2-3", "Matthew 6:9-13",
];

/** Day-of-year in UTC, 1-366. */
function dayOfYearUTC(d) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const diff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start;
  return Math.floor(diff / 86400000) + 1;
}

/** Today's verse reference — a pure function of the date, no state. */
export function votdRef(date = new Date()) {
  const idx = dayOfYearUTC(date) % VOTD_POOL.length;
  return VOTD_POOL[idx];
}
