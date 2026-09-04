/**
 * seo/build-data.mjs
 * Compiles the app's KJV + Strong's + cross-reference data (public/data/) into
 * lean JSON the /api/bible-page renderer can load in a serverless function.
 *
 *   node seo/build-data.mjs
 *
 * Verse TEXT comes from a clean public-domain KJV (aruljohn/Bible-kjv on GitHub,
 * cached in seo/source/) — the app's Strong's-tagged files in public/data/ drop the
 * last word(s) of ~3,300 verses, so they are used ONLY for Strong's numbers and
 * Psalm superscriptions.
 *
 * Outputs (committed):
 *   seo/data/kjv.json       — { books:[{name,slug,abbr,testament,chapters:[[verse,...],...]}] }
 *   seo/data/words.json     — { "Jhn|3|16": [["loved","G25"], ...] }  Strong's-tagged key words
 *   seo/data/titles.json    — { "Psa|23|1": "A Psalm of David." }     Psalm superscriptions
 *   seo/data/xrefs.json     — { "Jhn|3|16": ["Romans 5:8", ...] }
 *   seo/data/lexicon.json   — { "G3056": ["logos", "short definition"], "H7462": [...] }
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "public", "data");
const OUT = path.join(__dirname, "data");
const SRC = path.join(__dirname, "source");
fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

// Canonical order + display names + URL slugs (slugs are what /bible/<slug> uses)
const BOOKS = [
  ["Genesis","Gen","OT"],["Exodus","Exo","OT"],["Leviticus","Lev","OT"],["Numbers","Num","OT"],
  ["Deuteronomy","Deu","OT"],["Joshua","Jos","OT"],["Judges","Jdg","OT"],["Ruth","Rth","OT"],
  ["1 Samuel","1Sa","OT"],["2 Samuel","2Sa","OT"],["1 Kings","1Ki","OT"],["2 Kings","2Ki","OT"],
  ["1 Chronicles","1Ch","OT"],["2 Chronicles","2Ch","OT"],["Ezra","Ezr","OT"],["Nehemiah","Neh","OT"],
  ["Esther","Est","OT"],["Job","Job","OT"],["Psalms","Psa","OT"],["Proverbs","Pro","OT"],
  ["Ecclesiastes","Ecc","OT"],["Song of Solomon","Sng","OT"],["Isaiah","Isa","OT"],["Jeremiah","Jer","OT"],
  ["Lamentations","Lam","OT"],["Ezekiel","Eze","OT"],["Daniel","Dan","OT"],["Hosea","Hos","OT"],
  ["Joel","Joe","OT"],["Amos","Amo","OT"],["Obadiah","Oba","OT"],["Jonah","Jon","OT"],["Micah","Mic","OT"],
  ["Nahum","Nah","OT"],["Habakkuk","Hab","OT"],["Zephaniah","Zep","OT"],["Haggai","Hag","OT"],
  ["Zechariah","Zec","OT"],["Malachi","Mal","OT"],
  ["Matthew","Mat","NT"],["Mark","Mar","NT"],["Luke","Luk","NT"],["John","Jhn","NT"],["Acts","Act","NT"],
  ["Romans","Rom","NT"],["1 Corinthians","1Co","NT"],["2 Corinthians","2Co","NT"],["Galatians","Gal","NT"],
  ["Ephesians","Eph","NT"],["Philippians","Phl","NT"],["Colossians","Col","NT"],["1 Thessalonians","1Th","NT"],
  ["2 Thessalonians","2Th","NT"],["1 Timothy","1Ti","NT"],["2 Timothy","2Ti","NT"],["Titus","Tit","NT"],
  ["Philemon","Phm","NT"],["Hebrews","Heb","NT"],["James","Jas","NT"],["1 Peter","1Pe","NT"],
  ["2 Peter","2Pe","NT"],["1 John","1Jo","NT"],["2 John","2Jo","NT"],["3 John","3Jo","NT"],
  ["Jude","Jde","NT"],["Revelation","Rev","NT"],
];
const slugOf = (name) => name.toLowerCase().replace(/\s+/g, "-");

const clean = (t) =>
  t.replace(/➔/g, "")
   .replace(/ /g, " ")
   .replace(/\s+/g, " ")
   .trim();

// ---- Clean KJV text (fetched once, cached in seo/source/) ----------------
const CLEAN_BASE = "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/";
async function cleanBook(name) {
  const f = path.join(SRC, name.replace(/\s+/g, "") + ".json");
  if (!fs.existsSync(f)) {
    const r = await fetch(CLEAN_BASE + name.replace(/\s+/g, "") + ".json");
    if (!r.ok) throw new Error(`fetch ${name}: ${r.status}`);
    fs.writeFileSync(f, await r.text());
  }
  return JSON.parse(fs.readFileSync(f, "utf8")).chapters.map((c) => c.verses.map((v) => clean(v.text)));
}

// ---- KJV ---------------------------------------------------------------
const STOP = new Set("the and of a an in to that he his him it is was be for not but they them thou thee thy ye you your unto shall will with which who whom this these those there their her she my me i we us our on at by from as so or if do did are were have hath had all any one every no nor yea also then when what should would could may might can must let hast art been being am doth dost thereof therefore whether wherefore because into upon over under up down out again more most very own some such same other another whose whereby wherein both either neither than until till while yet even now how why where here thing things man men".split(" "));
const books = [];
const words = {}, titles = {};
let verseCount = 0, mismatches = 0;
for (const [name, abbr, testament] of BOOKS) {
  const file = read(`${abbr}.json`);
  const raw = file[abbr] ?? file[name] ?? Object.values(file)[0];
  const cleanChapters = await cleanBook(name);
  const chapters = [];
  const chKeys = Object.keys(raw).sort((a, b) => +a.split("|")[1] - +b.split("|")[1]);
  chKeys.forEach((ck, ci) => {
    // Some source files carry cumulative copies of earlier chapters inside later
    // ones (e.g. 1Sa|4 contains 1Sa|1|*). Keep only keys whose chapter matches.
    const chNum = ck.split("|")[1];
    const vKeys = Object.keys(raw[ck])
      .filter((vk) => vk.split("|")[1] === chNum)
      .sort((a, b) => +a.split("|")[2] - +b.split("|")[2]);
    const cleanVerses = cleanChapters[ci] || [];
    if (cleanVerses.length !== vKeys.length) mismatches++;
    const verses = cleanVerses.slice();
    vKeys.forEach((vk, vi) => {
      const tagged = clean(raw[vk.split("|").slice(0, 2).join("|")] ? raw[ck][vk].en : raw[ck][vk].en);
      const key = `${abbr}|${chNum}|${vi + 1}`;
      const t = /\[\[(.*?)\]\]/.exec(tagged);
      if (t) titles[key] = t[1].replace(/\[[GH]\d+\]/g, "").replace(/<\/?em>/g, "").replace(/\s+/g, " ").trim();
      const pairs = [], seen = new Set();
      const re = /([A-Za-z'’]+)[,.;:?!]*\s*((?:\[[GH]\d+\])+)/g;
      let m;
      const body = tagged.replace(/\[\[.*?\]\]/g, "").replace(/<\/?em>/g, "");
      while ((m = re.exec(body))) {
        if (STOP.has(m[1].toLowerCase())) continue;
        for (const code of [...m[2].matchAll(/\[([GH]\d+)\]/g)].map((x) => x[1])) {
          if (seen.has(code)) continue;
          seen.add(code); pairs.push([m[1], code]);
        }
      }
      if (pairs.length) words[key] = pairs.slice(0, 10);
    });
    verseCount += verses.length;
    chapters.push(verses);
  });
  books.push({ name, slug: slugOf(name), abbr, testament, chapters });
}
fs.writeFileSync(path.join(OUT, "kjv.json"), JSON.stringify({ books }));
fs.writeFileSync(path.join(OUT, "words.json"), JSON.stringify(words));
fs.writeFileSync(path.join(OUT, "titles.json"), JSON.stringify(titles));
console.log(`kjv.json: ${books.length} books, ${verseCount} verses (${mismatches} chapter length mismatches); words: ${Object.keys(words).length}; titles: ${Object.keys(titles).length}`);

// ---- Cross references --------------------------------------------------
// source: { "Genesis-1": { "1": [{r:"John 1:1-3",...}] } }
const nameToAbbr = Object.fromEntries(BOOKS.map(([n, a]) => [n, a]));
const xr = read("cross-references.json");
const xrefs = {};
let xrCount = 0;
for (const [bc, verses] of Object.entries(xr)) {
  const i = bc.lastIndexOf("-");
  const bname = bc.slice(0, i), ch = bc.slice(i + 1);
  const abbr = nameToAbbr[bname] ?? nameToAbbr[bname === "Psalm" ? "Psalms" : bname];
  if (!abbr) continue;
  for (const [v, list] of Object.entries(verses)) {
    const refs = [...new Set(list.map((x) => x.r))].slice(0, 12);
    if (refs.length) { xrefs[`${abbr}|${ch}|${v}`] = refs; xrCount += refs.length; }
  }
}
fs.writeFileSync(path.join(OUT, "xrefs.json"), JSON.stringify(xrefs));
console.log(`xrefs.json: ${Object.keys(xrefs).length} verses, ${xrCount} refs`);

// ---- Lexicon (short) ---------------------------------------------------
const shortDef = (s) => {
  let d = clean(String(s || "").replace(/&#\d+;?/g, " ").replace(/[—–]/g, "-"));
  d = d.split(/;|, i\.e\.| i\.e\. |\s-\s/)[0].replace(/\(.*?\)/g, "").replace(/\s+/g, " ").replace(/[,.:\s]+$/, "").trim();
  if (d.length > 90) d = d.slice(0, 90).replace(/\s+\S*$/, "").replace(/[,.:\s]+$/, "") + "…";
  return d;
};
const lex = {};
const greek = read("lexicon.json");
for (const [k, v] of Object.entries(greek)) {
  const def = shortDef(v.outline_usage || v.strongs_def);
  if (v.transliteration && def) lex[k] = [v.transliteration, def];
}
const hebrew = read("strongs/hebrew.json");
for (const [k, v] of Object.entries(hebrew)) {
  const def = shortDef(v.strongs_def || v.kjv_def);
  if (v.xlit && def) lex[k] = [v.xlit, def];
}
fs.writeFileSync(path.join(OUT, "lexicon.json"), JSON.stringify(lex));
console.log(`lexicon.json: ${Object.keys(lex).length} entries`);
