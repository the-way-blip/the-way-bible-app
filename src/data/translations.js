/**
 * Available Bible translations.
 * - source: "bible-api" (KJV, free public-domain — bible-api.com)
 *         | "api-bible" (modern translations via API.Bible — needs API key server-side)
 * - bibleId: API.Bible's bible id (only for api-bible sources)
 * - copyright: short attribution shown under the chapter text
 */
const TRANSLATIONS = [
  {
    id: "KJV",
    name: "King James Version",
    short: "KJV",
    description: "The classic 1611 translation. Public domain.",
    source: "bible-api",
    copyright: "Public domain.",
    isDefault: true,
  },
  {
    id: "CSB",
    name: "Christian Standard Bible",
    short: "CSB",
    description: "Modern, accurate, readable. 2017 update.",
    source: "api-bible",
    bibleId: "a556c5305ee15c3f-01",
    copyright: "Christian Standard Bible® © 2017 Holman Bible Publishers. Used by permission.",
  },
  {
    id: "NLT",
    name: "New Living Translation",
    short: "NLT",
    description: "Easy-to-read thought-for-thought translation.",
    source: "api-bible",
    bibleId: "d6e14a625393b4da-01",
    copyright: "Holy Bible, New Living Translation © 1996, 2004, 2015 by Tyndale House Foundation. All rights reserved.",
  },
  {
    id: "AMP",
    name: "Amplified Bible",
    short: "AMP",
    description: "Expanded text revealing nuances of the original.",
    source: "api-bible",
    bibleId: "a81b73293d3080c9-01",
    copyright: "Amplified® Bible (AMP), Copyright © 2015 by The Lockman Foundation. Used by Permission.",
  },
  {
    id: "ASV",
    name: "American Standard Version",
    short: "ASV",
    description: "1901 modern English translation. Public domain.",
    source: "api-bible",
    bibleId: "06125adad2d5898a-01",
    copyright: "Public domain.",
  },
  {
    id: "WEB",
    name: "World English Bible",
    short: "WEB",
    description: "Modern public-domain update of the ASV.",
    source: "api-bible",
    bibleId: "9879dbb7cfe39e4d-04",
    copyright: "Public domain.",
  },
];

export default TRANSLATIONS;

export function getTranslation(id) {
  return TRANSLATIONS.find((t) => t.id === id) || TRANSLATIONS[0];
}

/**
 * Map "Book Name" → USFM book ID (e.g., "John" → "JHN").
 * Used to build API.Bible chapter URLs.
 */
export const USFM_BOOK_IDS = {
  "Genesis": "GEN",
  "Exodus": "EXO",
  "Leviticus": "LEV",
  "Numbers": "NUM",
  "Deuteronomy": "DEU",
  "Joshua": "JOS",
  "Judges": "JDG",
  "Ruth": "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  "Ezra": "EZR",
  "Nehemiah": "NEH",
  "Esther": "EST",
  "Job": "JOB",
  "Psalms": "PSA",
  "Psalm": "PSA",
  "Proverbs": "PRO",
  "Ecclesiastes": "ECC",
  "Song of Solomon": "SNG",
  "Song of Songs": "SNG",
  "Isaiah": "ISA",
  "Jeremiah": "JER",
  "Lamentations": "LAM",
  "Ezekiel": "EZK",
  "Daniel": "DAN",
  "Hosea": "HOS",
  "Joel": "JOL",
  "Amos": "AMO",
  "Obadiah": "OBA",
  "Jonah": "JON",
  "Micah": "MIC",
  "Nahum": "NAM",
  "Habakkuk": "HAB",
  "Zephaniah": "ZEP",
  "Haggai": "HAG",
  "Zechariah": "ZEC",
  "Malachi": "MAL",
  "Matthew": "MAT",
  "Mark": "MRK",
  "Luke": "LUK",
  "John": "JHN",
  "Acts": "ACT",
  "Romans": "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  "Galatians": "GAL",
  "Ephesians": "EPH",
  "Philippians": "PHP",
  "Colossians": "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  "Titus": "TIT",
  "Philemon": "PHM",
  "Hebrews": "HEB",
  "James": "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  "Jude": "JUD",
  "Revelation": "REV",
};
