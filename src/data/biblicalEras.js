/**
 * Biblical eras — the "when" behind every atlas view.
 *
 * Each chapter of Scripture resolves to one era, and the era drives three
 * things in the atlas: which historical territories are drawn, what a place
 * was called at the time, and how the map is lit and graded.
 *
 * Dates are approximate and deliberately hedged. Biblical chronology is
 * genuinely disputed — especially for the patriarchs and the exodus — so
 * these follow widely used conventional ranges and are labelled "c." The
 * point is orientation, not precision.
 */

/** Negative years are BC. There is no year 0. */
export const ERAS = [
  {
    id: "primeval",
    name: "Primeval History",
    range: "Before c. 2100 BC",
    start: -4000,
    end: -2100,
    blurb: "Creation, the flood, and the scattering from Babel.",
    visual: {
      accent: "#d8b45f",
      filter: "saturate(0.82) contrast(1.04) sepia(0.10)",
      wash: "rgba(196, 152, 74, 0.10)",
      sun: [90, 18],
      sunIntensity: 6,
    },
  },
  {
    id: "patriarchs",
    name: "The Patriarchs",
    range: "c. 2100–1800 BC",
    start: -2100,
    end: -1800,
    blurb: "Abraham, Isaac, and Jacob living as strangers in the land of promise.",
    visual: {
      accent: "#d9a441",
      filter: "saturate(0.86) contrast(1.05) sepia(0.14)",
      wash: "rgba(201, 155, 70, 0.12)",
      sun: [110, 22],
      sunIntensity: 8,
    },
  },
  {
    id: "egypt-exodus",
    name: "Egypt & the Exodus",
    range: "c. 1800–1400 BC",
    start: -1800,
    end: -1400,
    blurb: "Bondage in Egypt, the deliverance at the sea, and forty years in the wilderness.",
    visual: {
      accent: "#e0a24a",
      filter: "saturate(0.90) contrast(1.06) sepia(0.12)",
      wash: "rgba(214, 148, 62, 0.13)",
      sun: [140, 28],
      sunIntensity: 10,
    },
  },
  {
    id: "conquest",
    name: "Conquest of Canaan",
    range: "c. 1400–1375 BC",
    start: -1400,
    end: -1375,
    blurb: "Joshua leads Israel across the Jordan and the land is divided among the tribes.",
    visual: {
      accent: "#cf9a4b",
      filter: "saturate(0.92) contrast(1.06) sepia(0.08)",
      wash: "rgba(190, 140, 66, 0.11)",
      sun: [160, 30],
      sunIntensity: 11,
    },
  },
  {
    id: "judges",
    name: "The Judges",
    range: "c. 1375–1050 BC",
    start: -1375,
    end: -1050,
    blurb: "Everyone did what was right in his own eyes, and God raised up deliverers.",
    visual: {
      accent: "#c08a4e",
      filter: "saturate(0.84) contrast(1.08) sepia(0.10)",
      wash: "rgba(150, 110, 62, 0.14)",
      sun: [200, 20],
      sunIntensity: 8,
    },
  },
  {
    id: "united-monarchy",
    name: "The United Monarchy",
    range: "c. 1050–930 BC",
    start: -1050,
    end: -930,
    blurb: "Saul, David, and Solomon rule a single kingdom from Jerusalem.",
    visual: {
      accent: "#e2c268",
      filter: "saturate(1.0) contrast(1.04) sepia(0.05)",
      wash: "rgba(214, 178, 92, 0.10)",
      sun: [180, 38],
      sunIntensity: 14,
    },
  },
  {
    id: "divided-kingdom",
    name: "The Divided Kingdom",
    range: "c. 930–722 BC",
    start: -930,
    end: -722,
    blurb: "Israel in the north, Judah in the south, and prophets sent to both.",
    visual: {
      accent: "#cf8f57",
      filter: "saturate(0.88) contrast(1.08)",
      wash: "rgba(150, 96, 60, 0.13)",
      sun: [220, 24],
      sunIntensity: 9,
    },
  },
  {
    id: "judah-alone",
    name: "Judah Alone",
    range: "722–586 BC",
    start: -722,
    end: -586,
    blurb: "Samaria has fallen. Judah survives under the shadow of Assyria, then Babylon.",
    visual: {
      accent: "#c37f5a",
      filter: "saturate(0.80) contrast(1.10)",
      wash: "rgba(122, 74, 56, 0.16)",
      sun: [240, 16],
      sunIntensity: 7,
    },
  },
  {
    id: "exile",
    name: "The Exile",
    range: "586–538 BC",
    start: -586,
    end: -538,
    blurb: "Jerusalem is burned and Judah sits down by the rivers of Babylon.",
    visual: {
      accent: "#9fa8c4",
      filter: "saturate(0.62) contrast(1.12) brightness(0.94)",
      wash: "rgba(64, 74, 108, 0.20)",
      sun: [260, 10],
      sunIntensity: 5,
    },
  },
  {
    id: "return",
    name: "Return & Restoration",
    range: "538–400 BC",
    start: -538,
    end: -400,
    blurb: "Cyrus sends the exiles home to rebuild the temple and the walls.",
    visual: {
      accent: "#b9c48a",
      filter: "saturate(0.90) contrast(1.05)",
      wash: "rgba(120, 138, 92, 0.12)",
      sun: [150, 32],
      sunIntensity: 11,
    },
  },
  {
    id: "gospels",
    name: "The Life of Jesus",
    range: "c. 6 BC – AD 33",
    start: -6,
    end: 33,
    blurb: "Roman Judea, Herod's temple, and the ministry of Jesus in Galilee and Jerusalem.",
    visual: {
      accent: "#e8d48b",
      filter: "saturate(1.02) contrast(1.03)",
      wash: "rgba(196, 186, 140, 0.08)",
      sun: [170, 44],
      sunIntensity: 15,
    },
  },
  {
    id: "apostolic",
    name: "The Early Church",
    range: "AD 33–95",
    start: 33,
    end: 95,
    blurb: "The gospel moves out from Jerusalem across the Roman world.",
    visual: {
      accent: "#8fc0d0",
      filter: "saturate(0.94) contrast(1.05)",
      wash: "rgba(78, 122, 140, 0.11)",
      sun: [190, 40],
      sunIntensity: 13,
    },
  },
];

export const ERA_BY_ID = Object.fromEntries(ERAS.map((era) => [era.id, era]));

/**
 * Book → era. Books whose narrative crosses an era boundary list chapter
 * ranges instead; the first matching range wins.
 */
const BOOK_ERAS = {
  "Genesis": [{ to: 11, era: "primeval" }, { era: "patriarchs" }],
  "Exodus": "egypt-exodus",
  "Leviticus": "egypt-exodus",
  "Numbers": "egypt-exodus",
  "Deuteronomy": "egypt-exodus",
  "Job": "patriarchs",
  "Joshua": "conquest",
  "Judges": "judges",
  "Ruth": "judges",
  // Samuel's boyhood and Eli's house still belong to the era of the judges
  "1 Samuel": [{ to: 7, era: "judges" }, { era: "united-monarchy" }],
  "2 Samuel": "united-monarchy",
  "1 Chronicles": "united-monarchy",
  "Psalms": "united-monarchy",
  "Proverbs": "united-monarchy",
  "Ecclesiastes": "united-monarchy",
  "Song of Solomon": "united-monarchy",
  // The kingdom splits at Rehoboam
  "1 Kings": [{ to: 11, era: "united-monarchy" }, { era: "divided-kingdom" }],
  // Samaria falls in 2 Kings 17
  "2 Kings": [{ to: 17, era: "divided-kingdom" }, { era: "judah-alone" }],
  "2 Chronicles": [
    { to: 9, era: "united-monarchy" },
    { to: 28, era: "divided-kingdom" },
    { era: "judah-alone" },
  ],
  "Hosea": "divided-kingdom",
  "Amos": "divided-kingdom",
  "Jonah": "divided-kingdom",
  "Micah": "divided-kingdom",
  // Isaiah 40 onward speaks past the fall of Jerusalem to the exiles
  "Isaiah": [{ to: 39, era: "judah-alone" }, { era: "exile" }],
  "Jeremiah": "judah-alone",
  "Joel": "judah-alone",
  "Nahum": "judah-alone",
  "Habakkuk": "judah-alone",
  "Zephaniah": "judah-alone",
  "Lamentations": "exile",
  "Ezekiel": "exile",
  "Daniel": "exile",
  "Obadiah": "exile",
  "Ezra": "return",
  "Nehemiah": "return",
  "Esther": "return",
  "Haggai": "return",
  "Zechariah": "return",
  "Malachi": "return",
  "Matthew": "gospels",
  "Mark": "gospels",
  "Luke": "gospels",
  "John": "gospels",
};

/** Everything from Acts onward belongs to the apostolic era. */
const APOSTOLIC_DEFAULT = "apostolic";

/**
 * The era a given chapter belongs to. Falls back to the apostolic era for the
 * epistles and Revelation, which aren't listed individually.
 */
export function resolveEra(book, chapter) {
  const entry = BOOK_ERAS[book];
  if (!entry) return ERA_BY_ID[APOSTOLIC_DEFAULT];
  if (typeof entry === "string") return ERA_BY_ID[entry];

  const num = Number(chapter) || 1;
  for (const rule of entry) {
    if (rule.to === undefined || num <= rule.to) return ERA_BY_ID[rule.era];
  }
  return ERA_BY_ID[entry[entry.length - 1].era];
}

/** The era covering a given year, for the timeline scrubber. */
export function eraForYear(year) {
  return (
    ERAS.find((era) => year >= era.start && year < era.end) ||
    (year < ERAS[0].start ? ERAS[0] : ERAS[ERAS.length - 1])
  );
}

/** "1010 BC" / "AD 62" */
export function formatYear(year) {
  if (year < 0) return `${Math.abs(Math.round(year))} BC`;
  return `AD ${Math.max(1, Math.round(year))}`;
}

/** Midpoint of an era, used as the scrubber's landing point. */
export function eraMidpoint(era) {
  return Math.round((era.start + era.end) / 2);
}

export const TIMELINE_START = ERAS[0].start;
export const TIMELINE_END = ERAS[ERAS.length - 1].end;
