/**
 * Available Bible translations.
 * - source: "bible-api" (KJV, free public-domain — bible-api.com)
 *         | "api-bible" (modern translations via API.Bible — needs API key server-side)
 * - bibleId: API.Bible's bible id (only for api-bible sources)
 * - copyright: short attribution shown under the chapter text
 * - details: longer info shown in Settings — translation philosophy, history, etc.
 */
const TRANSLATIONS = [
  {
    id: "KJV",
    name: "King James Version",
    short: "KJV",
    language: "English",
    description: "The classic 1611 translation. Public domain.",
    source: "bible-api",
    copyright: "Public domain.",
    isDefault: true,
    details: {
      year: "1611",
      type: "Formal equivalence (word-for-word)",
      philosophy:
        "Commissioned by King James I of England and produced by 47 scholars working from Hebrew and Greek manuscripts, the KJV aimed for a literal, majestic rendering suited for public reading. Its Elizabethan prose shaped the English language itself and remains one of the most widely read books in history.",
      textBase: "Old Testament: Masoretic Text (Ben Chayyim edition). New Testament: Textus Receptus (Greek).",
      readingLevel: "Advanced — archaic English (thee, thou, dost).",
    },
  },
  {
    id: "CSB",
    name: "Christian Standard Bible",
    short: "CSB",
    language: "English",
    description: "Modern, accurate, readable. 2017 update.",
    source: "api-bible",
    bibleId: "a556c5305ee15c3f-01",
    copyright: "Christian Standard Bible® © 2017 Holman Bible Publishers. Used by permission.",
    details: {
      year: "2017 (revision of 2009 HCSB)",
      type: "Optimal equivalence",
      philosophy:
        "The CSB pursues \"optimal equivalence\" — staying as literal as possible while remaining as readable as necessary. It was produced by 100 scholars from 17 denominations working from the best available Hebrew, Aramaic, and Greek manuscripts, with an emphasis on accuracy without sacrificing clarity.",
      textBase: "Old Testament: Biblia Hebraica Stuttgartensia. New Testament: UBS5 / NA28 (Alexandrian text-type).",
      readingLevel: "7th grade — clear and natural modern English.",
    },
  },
  {
    id: "NLT",
    name: "New Living Translation",
    short: "NLT",
    language: "English",
    description: "Easy-to-read thought-for-thought translation.",
    source: "api-bible",
    bibleId: "d6e14a625393b4da-01",
    copyright: "Holy Bible, New Living Translation © 1996, 2004, 2015 by Tyndale House Foundation. All rights reserved.",
    details: {
      year: "1996 (revised 2004, 2015)",
      type: "Dynamic equivalence (thought-for-thought)",
      philosophy:
        "The NLT began as a revision of The Living Bible paraphrase but became a full translation by 90 scholars. The goal is to render the meaning of the original texts into natural, clear English — prioritising how an ancient reader would have understood the text over a strict word-for-word rendering.",
      textBase: "Old Testament: BHS. New Testament: UBS4 / NA27.",
      readingLevel: "6th grade — very accessible, great for new readers.",
    },
  },
  {
    id: "AMP",
    name: "Amplified Bible",
    short: "AMP",
    language: "English",
    description: "Expanded text revealing nuances of the original.",
    source: "api-bible",
    bibleId: "a81b73293d3080c9-01",
    copyright: "Amplified® Bible (AMP), Copyright © 2015 by The Lockman Foundation. Used by Permission.",
    details: {
      year: "1965 (revised 2015)",
      type: "Amplified / expanded equivalence",
      philosophy:
        "The Amplified Bible inserts bracketed synonyms, definitions, and explanatory phrases directly into the text to capture shades of meaning present in the original Hebrew and Greek but difficult to convey in a single English word. It is designed to be read alongside a standard translation for deeper study.",
      textBase: "Old Testament: BHS. New Testament: NA/UBS critical text.",
      readingLevel: "Advanced — expanded phrases require slower, careful reading.",
    },
  },
  {
    id: "ASV",
    name: "American Standard Version",
    short: "ASV",
    language: "English",
    description: "1901 formal translation. Public domain.",
    source: "api-bible",
    bibleId: "06125adad2d5898a-01",
    copyright: "Public domain.",
    details: {
      year: "1901",
      type: "Formal equivalence (word-for-word)",
      philosophy:
        "An American revision of the 1885 English Revised Version, the ASV incorporated the latest 19th-century textual scholarship and corrected perceived KJV weaknesses. It became a foundation for the RSV, NASB, and ESV. Scholars prize it for its precise, consistent rendering of Hebrew and Greek terms.",
      textBase: "Old Testament: Masoretic Text. New Testament: Westcott-Hort Greek text.",
      readingLevel: "Advanced — formal language, now somewhat dated.",
    },
  },
  {
    id: "WEB",
    name: "World English Bible",
    short: "WEB",
    language: "English",
    description: "Modern public-domain update of the ASV.",
    source: "api-bible",
    bibleId: "9879dbb7cfe39e4d-04",
    copyright: "Public domain.",
    details: {
      year: "2000 (ongoing)",
      type: "Formal equivalence",
      philosophy:
        "The World English Bible is a free, public-domain update of the 1901 ASV, modernising spelling and removing archaic pronouns (thee/thou) while preserving the ASV's accuracy. It requires no permission to quote or distribute — a project of the Rainbow Missions organisation.",
      textBase: "Old Testament: Masoretic Text / BHS. New Testament: Majority Text (Byzantine).",
      readingLevel: "Modern and readable, similar to NASB.",
    },
  },
  {
    id: "RVR",
    name: "Reina-Valera 1909",
    short: "RVR",
    language: "Español",
    description: "Traducción clásica española. Dominio público.",
    source: "api-bible",
    bibleId: "592420522e16049f-01",
    copyright: "Dominio público.",
    details: {
      year: "1909 (basada en la Reina-Valera de 1602)",
      type: "Equivalencia formal (palabra por palabra)",
      philosophy:
        "La Reina-Valera tiene su origen en la traducción de Casiodoro de Reina (1569), revisada por Cipriano de Valera (1602) y modernizada en 1909 por la Sociedad Bíblica Americana y la Sociedad Bíblica Británica. Ha sido el texto protestante de referencia en el mundo hispanohablante por más de 400 años.",
      textBase: "Antiguo Testamento: Texto Masorético. Nuevo Testamento: Textus Receptus.",
      readingLevel: "Español clásico — similar al KJV en elegancia y antigüedad.",
    },
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
