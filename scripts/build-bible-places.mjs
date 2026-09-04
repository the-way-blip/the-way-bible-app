#!/usr/bin/env node
/**
 * Builds src/data/biblePlaces.json from the OpenBible.info Bible geocoding
 * dataset (CC BY 4.0 — https://www.openbible.info/geo/).
 *
 *   node scripts/build-bible-places.mjs            # use the vendored copy
 *   node scripts/build-bible-places.mjs --fetch    # re-download from openbible.info
 *
 * The raw source is vendored at scripts/data/openbible-merged.txt so builds are
 * reproducible offline. Re-run with --fetch to pick up upstream corrections.
 *
 * Output is deliberately compact (short keys, integer book indexes, rounded
 * coordinates) because it ships in the client bundle.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PLACE_NOTES } from "../src/data/biblePlaceNotes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE_URL = "https://www.openbible.info/geo/data/merged.txt";
const VENDORED = resolve(__dirname, "data/openbible-merged.txt");
const OUTPUT = resolve(ROOT, "src/data/biblePlaces.json");

/** Canonical book order — index into this list is what the JSON stores. */
const BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua",
  "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
  "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
  "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah",
  "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
  "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
  "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
  "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John",
  "2 John", "3 John", "Jude", "Revelation",
];

/** OpenBible's ESV-style reference abbreviations → canonical book names. */
const ABBREV = {
  "Gen": "Genesis", "Ex": "Exodus", "Exod": "Exodus", "Lev": "Leviticus",
  "Num": "Numbers", "Deut": "Deuteronomy", "Josh": "Joshua", "Judg": "Judges",
  "Ruth": "Ruth", "1 Sam": "1 Samuel", "2 Sam": "2 Samuel", "1 Kgs": "1 Kings",
  "2 Kgs": "2 Kings", "1 Chr": "1 Chronicles", "2 Chr": "2 Chronicles",
  "Ezra": "Ezra", "Neh": "Nehemiah", "Est": "Esther", "Esth": "Esther",
  "Job": "Job", "Ps": "Psalms", "Psa": "Psalms", "Prov": "Proverbs",
  "Eccl": "Ecclesiastes", "Sng": "Song of Solomon", "Song": "Song of Solomon",
  "Isa": "Isaiah", "Jer": "Jeremiah", "Lam": "Lamentations", "Ezek": "Ezekiel",
  "Dan": "Daniel", "Hos": "Hosea", "Joel": "Joel", "Amos": "Amos",
  "Obad": "Obadiah", "Jonah": "Jonah", "Mic": "Micah", "Nahum": "Nahum",
  "Nah": "Nahum", "Hab": "Habakkuk", "Zeph": "Zephaniah", "Hag": "Haggai",
  "Zech": "Zechariah", "Mal": "Malachi", "Matt": "Matthew", "Mark": "Mark",
  "Luke": "Luke", "John": "John", "Acts": "Acts", "Rom": "Romans",
  "1 Cor": "1 Corinthians", "2 Cor": "2 Corinthians", "Gal": "Galatians",
  "Eph": "Ephesians", "Phil": "Philippians", "Col": "Colossians",
  "1 Thes": "1 Thessalonians", "2 Thes": "2 Thessalonians",
  "1 Tim": "1 Timothy", "2 Tim": "2 Timothy", "Titus": "Titus",
  "Phlm": "Philemon", "Heb": "Hebrews", "Jas": "James", "1 Pet": "1 Peter",
  "2 Pet": "2 Peter", "1 Jn": "1 John", "2 Jn": "2 John", "3 Jn": "3 John",
  "Jude": "Jude", "Rev": "Revelation",
};

const BOOK_INDEX = new Map(BOOKS.map((name, i) => [name, i]));

/**
 * Entries in the dataset that aren't geography in any useful sense — the
 * tabernacle's rooms travel with the camp and would drop pins on Jerusalem.
 */
const SKIP = new Set([
  "Holy Place 1", "Most Holy Place 1", "Holy Place 2", "Most Holy Place 2",
  "Holy Place 3", "Most Holy Place 3",
]);

/**
 * KJV (and other older translations) spell many of these differently from the
 * ESV names OpenBible uses. Detecting a place in the reader's text depends on
 * matching what's actually printed, so map the variants here.
 */
const ALIASES = {
  "Pergamum": ["Pergamos"],
  "Ur": ["Ur of the Chaldees", "Ur of the Chaldeans"],
  "Sea of Galilee": ["sea of Tiberias", "lake of Gennesaret", "Gennesaret", "sea of Chinnereth"],
  "Salt Sea": ["Dead Sea", "sea of the plain"],
  "Great Sea": ["Mediterranean"],
  "Memphis": ["Noph"],
  "Cush": ["Ethiopia"],
  "Syria": ["Aram"],
  "Sidon": ["Zidon", "Sidonians", "Zidonians"],
  "Tyre": ["Tyrus"],
  "Zarephath": ["Sarepta"],
  "Shechem": ["Sichem", "Sychem"],
  "Kiriath-jearim": ["Kirjath-jearim", "Kirjathjearim"],
  "Kiriath-arba": ["Kirjath-arba", "Kirjatharba"],
  "Ai 1": ["Hai"],
  "Golgotha": ["Calvary"],
  "Mount Sinai": ["Sinai"],
  "Horeb": ["Mount Horeb"],
  "Jordan": ["river Jordan", "Jordan River"],
  "Negeb": ["Negev"],
  "Bethel 1": ["Beth-el", "Luz"],
  "Beersheba": ["Beer-sheba"],
  "Mount of Olives": ["Olivet", "mount of Olives"],
  "Valley of Hinnom": ["Gehenna", "valley of Hinnom"],
  "Nile": ["the river of Egypt"],
  "Euphrates": ["the great river"],
  "Caesarea Philippi": ["Cesarea Philippi"],
  "Caesarea": ["Cesarea"],
  "Colossae": ["Colosse"],
  "Ephraim": ["Ephraim (city)"],
  "Cyprus": ["Chittim", "Kittim"],
  "Tarshish": ["Tharshish"],
  "Berea": ["Beroea"],
  "Troas": ["Troad"],
  "Perea": ["beyond Jordan"],
  "Mount Carmel": ["Carmel"],
  "Mount Hermon": ["Hermon", "Sirion", "Senir"],
  "Mount Nebo": ["Nebo"],
  "Peniel": ["Penuel"],
  "Zoar": ["Bela"],
};

// ─── Parsing ────────────────────────────────────────────────────────────────

/** Coordinates may be prefixed: `<` inside, `>` surrounds, `~` approximate. */
function parseCoord(raw) {
  const text = (raw || "").trim();
  if (!text) return { value: null, precision: "exact" };
  const marker = text[0];
  const precision =
    marker === "<" ? "within" :
    marker === ">" ? "region" :
    marker === "~" ? "approx" : "exact";
  const value = Number.parseFloat(precision === "exact" ? text : text.slice(1));
  return { value: Number.isFinite(value) ? value : null, precision };
}

/** "2 Kgs 5:12" → { book: "2 Kings", chapter: 5, verse: 12 } */
const REF_RE = /^((?:[123]\s)?[A-Za-z]+)\s+(\d+):(\d+)$/;

function parseRef(raw, unknown) {
  const match = raw.trim().match(REF_RE);
  if (!match) return null;
  const book = ABBREV[match[1]];
  if (!book) {
    unknown.add(match[1]);
    return null;
  }
  return { book, chapter: Number(match[2]), verse: Number(match[3]) };
}

/** Strip OpenBible's disambiguating suffix: "Bethel 1" → "Bethel". */
function displayName(name) {
  return name.replace(/\s+\d+$/, "");
}

/** Fallback note for places the curated set doesn't cover. */
function generatedNote(place, refs) {
  const first = refs[0];
  const where = first ? `${first.book} ${first.chapter}:${first.verse}` : null;
  const count = refs.length;
  const times = count === 1 ? "once" : `${count} times`;
  const comment = (place.comment || "").trim();
  const modern = /^(now|Now)\s/.test(comment) ? comment.replace(/^[Nn]ow\s/, "") : "";

  const parts = [];
  parts.push(
    where
      ? `Named ${times} in Scripture, first at ${where}.`
      : `Named ${times} in Scripture.`
  );
  if (modern) parts.push(`Known today as ${modern.replace(/\.$/, "")}.`);
  else if (comment && !comment.includes("http")) parts.push(`${comment.replace(/\.$/, "")}.`);
  if (place.root) parts.push(`Located in relation to ${displayName(place.root)}.`);
  return parts.join(" ");
}

// ─── Build ──────────────────────────────────────────────────────────────────

async function loadSource() {
  const wantsFetch = process.argv.includes("--fetch");
  if (!wantsFetch && existsSync(VENDORED)) {
    console.log(`· using vendored source ${VENDORED.replace(ROOT + "/", "")}`);
    return readFile(VENDORED, "utf8");
  }
  console.log(`· downloading ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "the-way-bible-app/atlas-build" },
  });
  if (!response.ok) throw new Error(`${SOURCE_URL} → HTTP ${response.status}`);
  const text = await response.text();
  await mkdir(dirname(VENDORED), { recursive: true });
  await writeFile(VENDORED, text);
  console.log(`· vendored to ${VENDORED.replace(ROOT + "/", "")}`);
  return text;
}

async function main() {
  const source = await loadSource();
  const unknownBooks = new Set();

  const rows = source
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.split("\t"));

  const places = [];
  let skippedNoCoords = 0;

  for (const cols of rows) {
    const [name = "", root = "", latRaw = "", lonRaw = "", passages = "", comment = ""] = cols;
    if (!name.trim() || SKIP.has(name.trim())) continue;

    const lat = parseCoord(latRaw);
    const lon = parseCoord(lonRaw);
    if (lat.value === null || lon.value === null) {
      skippedNoCoords++;
      continue;
    }

    const refs = passages
      .split(",")
      .map((ref) => parseRef(ref, unknownBooks))
      .filter(Boolean);
    if (refs.length === 0) continue;

    const raw = {
      name: name.trim(),
      root: root.trim(),
      comment: comment.trim(),
    };
    const curated = PLACE_NOTES[raw.name] || PLACE_NOTES[displayName(raw.name)];

    // Refs as flat [bookIndex, chapter, verse] triples — smallest useful shape.
    const flatRefs = [];
    for (const ref of refs) {
      const bookIdx = BOOK_INDEX.get(ref.book);
      if (bookIdx === undefined) continue;
      flatRefs.push(bookIdx, ref.chapter, ref.verse);
    }
    if (flatRefs.length === 0) continue;

    places.push({
      n: raw.name,
      d: displayName(raw.name),
      la: Number(lat.value.toFixed(5)),
      lo: Number(lon.value.toFixed(5)),
      p: lat.precision === "exact" && lon.precision === "exact" ? undefined : lat.precision,
      r: raw.root ? displayName(raw.root) : undefined,
      c: raw.comment && !raw.comment.includes("http") ? raw.comment : undefined,
      note: curated?.note || generatedNote(raw, refs),
      m: curated?.modern,
      k: curated ? 1 : undefined, // curated flag — used to rank the place list
      a: ALIASES[raw.name] || ALIASES[displayName(raw.name)],
      v: flatRefs,
    });
  }

  // Warn about curated notes whose key no longer exists upstream.
  const known = new Set(places.flatMap((p) => [p.n, p.d]));
  const orphans = Object.keys(PLACE_NOTES).filter((key) => !known.has(key));
  if (orphans.length) {
    console.warn(`! ${orphans.length} curated note(s) match no dataset place:`);
    for (const key of orphans) console.warn(`    ${key}`);
  }
  if (unknownBooks.size) {
    console.warn(`! unmapped book abbreviations: ${[...unknownBooks].join(", ")}`);
  }

  places.sort((a, b) => b.v.length - a.v.length || a.d.localeCompare(b.d));

  const payload = {
    source: "OpenBible.info Bible Geocoding data",
    sourceUrl: "https://www.openbible.info/geo/",
    license: "CC BY 4.0",
    generated: new Date().toISOString().slice(0, 10),
    books: BOOKS,
    places,
  };

  const json = JSON.stringify(payload);
  await writeFile(OUTPUT, json);

  const curatedCount = places.filter((p) => p.k).length;
  console.log(`✓ ${places.length} places → ${OUTPUT.replace(ROOT + "/", "")}`);
  console.log(`  ${curatedCount} with curated notes · ${skippedNoCoords} skipped (no coordinates)`);
  console.log(`  ${(json.length / 1024).toFixed(1)} KB raw`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
