/**
 * seo/build-strongs.mjs
 * Compiles a reverse index of Strong's numbers for the /strongs/<id> pages.
 *
 *   node seo/build-strongs.mjs
 *
 * Why a build step. The app's Strong's-tagged text lives in public/data/<abbr>.json
 * as one 224MB set of files carrying four translations each, which a serverless
 * function has no business reading per request. This walks them once and writes a
 * lean index the renderer can hold in memory.
 *
 * Source format. Each verse's `en` field interleaves the KJV words with the number
 * of the word they translate:
 *
 *   "The elder[G4245] unto the elect[G1588] lady[G2959] and[G2532] her[G846]"
 *
 * The rendering is whatever sits between the previous "]" and the next "[", so
 * "they that have known[G1097]" is one rendering of G1097, not four of them.
 *
 * Two quirks of the source, both handled here and both worth knowing before editing.
 *
 * Chapter objects are cumulative in some books and not in others: 1Ch|29 carries
 * every verse in 1 Chronicles, while 2Ch|36 carries only its own. Summing chapters
 * therefore counts 1 Chronicles two and a half times. Verses are deduped by key.
 *
 * Supplied words are marked up — "the name[H8034] of the man[H376] <em>was</em>
 * Elimelech,[H458]" — so tags are stripped before the renderings are read.
 *
 * And build-data.mjs notes that these files drop the trailing word of roughly 3,300
 * verses, so a count taken from them can be slightly low. The page therefore says
 * how many verses the word appears in, counted from this index, rather than
 * claiming an exhaustive total, and says that is where the number comes from.
 *
 * Output (committed): seo/data/strongs.json — the lexical entry and the index in
 * one file, so the renderer loads one thing rather than three:
 *   { "G25": { lemma, xlit, pron, derivation, def, kjvDef,
 *              n: 107, refs: [[bookIndex, chapter, verse], ...],
 *              kjv: [["love", 69], ["loved", 32], ...] } }
 *
 * Entries the lexicon knows but the KJV text never tags still get a page, with the
 * definition and no verse list. Entries tagged in the text but absent from the
 * lexicon are dropped — a page with no word on it is not a page.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "public", "data");
const OUT = path.join(__dirname, "data");

// Leading function words are an artefact of the tagging, not of the translation:
// H7965 shows up as "peace", "in peace" and "and peace" for the same word, because
// whatever sat between the previous number and this one gets swept in. Stripping
// them from the front merges those back into one rendering. At least one word
// always survives, so "that which is" does not become nothing.
const LEADING = new Set(("the a an of and in to for is it that he she they ye thou thee " +
  "shall shalt was were be been with by on at from as his her their my thy our your " +
  "him them us me i not so but which who whom what when all any this these those " +
  "there then do did doth hath have had has are am will would may let unto into upon " +
  "o ye we ours yours hers its").split(" "));
const trimLeading = (w) => {
  const parts = w.split(" ");
  while (parts.length > 1 && LEADING.has(parts[0])) parts.shift();
  return parts.join(" ");
};

const REFS_SHOWN = 40;      // verses listed on the page
const KJV_SHOWN = 12;       // distinct renderings listed

const kjv = JSON.parse(fs.readFileSync(path.join(OUT, "kjv.json"), "utf8"));
const byAbbr = new Map(kjv.books.map((b, i) => [b.abbr, i]));

// public/data uses its own abbreviations; map them onto kjv.json's book order.
const booksMap = JSON.parse(fs.readFileSync(path.join(DATA, "books.json"), "utf8"));
const fileAbbrs = booksMap.books.map((o) => Object.values(o)[0]);

const index = Object.create(null);
let verses = 0, tagged = 0;

fileAbbrs.forEach((abbr, bookOrder) => {
  const file = path.join(DATA, `${abbr}.json`);
  if (!fs.existsSync(file)) { console.warn(`  missing ${abbr}.json`); return; }
  const root = JSON.parse(fs.readFileSync(file, "utf8"));
  const bookName = Object.keys(root)[0];
  // kjv.json may abbreviate differently (Rth/Rut, Jhn/Joh) — fall back to order.
  const bi = byAbbr.has(abbr) ? byAbbr.get(abbr) : bookOrder;

  // Deduped because chapter objects are cumulative in some books. See the note above.
  const seenVerse = new Map();
  for (const chapter of Object.values(root[bookName])) {
    for (const [key, v] of Object.entries(chapter)) {
      if (v && typeof v.en === "string" && !seenVerse.has(key)) seenVerse.set(key, v.en);
    }
  }

  for (const [key, raw] of seenVerse) {
    const [, ch, vs] = key.split("|");
    const c = +ch, n = +vs;
    if (!c || !n) continue;
    verses++;
    const en = raw.replace(/<[^>]*>/g, " ");   // drop <em> around supplied words
    let cursor = 0, carried = "";
    const re = /\[([GH]\d+)\]/g;
    let m;
    while ((m = re.exec(en))) {
      const id = m[1];
      // The rendering is the text since the last "]". Where two numbers share one
      // word — "Bethlehemjudah.[H1035][H3063]" — the second finds nothing, so the
      // first one's wording is carried over rather than dropped.
      let word = en.slice(cursor, m.index).replace(/[^A-Za-z'\u2019\- ]+/g, " ").trim().toLowerCase();
      cursor = m.index + m[0].length;
      if (!word) word = carried;
      else { word = word.split(/\s+/).slice(-5).join(" "); carried = word; }
      word = trimLeading(word);
      if (!word) continue;
      tagged++;
      const e = index[id] || (index[id] = { n: 0, refs: [], kjv: Object.create(null), seen: new Set() });
      e.n++;
      e.kjv[word] = (e.kjv[word] || 0) + 1;
      const rk = `${bi}|${c}|${n}`;
      if (!e.seen.has(rk)) { e.seen.add(rk); e.refs.push([bi, c, n]); }
    }
  }
  process.stdout.write(".");
});
console.log("");

// The lexicon itself: lemma, transliteration, pronunciation, derivation, and the
// two definitions. Public domain (Strong's, 1890).
const lex = Object.create(null);
for (const f of ["hebrew", "greek"]) {
  const src = JSON.parse(fs.readFileSync(path.join(DATA, "strongs", `${f}.json`), "utf8"));
  for (const [id, e] of Object.entries(src)) lex[id] = e;
}

const out = Object.create(null);
let ids = 0, orphans = 0, untagged = 0;
for (const [id, e] of Object.entries(lex)) {
  const hits = index[id];
  if (!hits) untagged++;
  ids++;
  const clean = (x) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim() : "");
  out[id] = {
    lemma: clean(e.lemma),
    xlit: clean(e.xlit || e.translit),
    pron: clean(e.pron),
    derivation: clean(e.derivation).replace(/;$/, ""),
    def: clean(e.strongs_def).replace(/^[-,;\s]+/, ""),
    kjvDef: clean(e.kjv_def).replace(/\.$/, ""),
    n: hits ? hits.refs.length : 0,
    refs: hits ? hits.refs.slice(0, REFS_SHOWN) : [],
    kjv: hits ? Object.entries(hits.kjv).sort((a, b) => b[1] - a[1]).slice(0, KJV_SHOWN) : [],
  };
}
for (const id of Object.keys(index)) if (!lex[id]) orphans++;

fs.writeFileSync(path.join(OUT, "strongs.json"), JSON.stringify(out));
const kb = (fs.statSync(path.join(OUT, "strongs.json")).size / 1024).toFixed(0);
console.log(`verses read: ${verses.toLocaleString()}  tagged words: ${tagged.toLocaleString()}`);
console.log(`strongs.json: ${ids.toLocaleString()} ids, ${kb}kB  (${untagged.toLocaleString()} with no tagged verse, ${orphans.toLocaleString()} tagged ids absent from the lexicon and dropped)`);
for (const probe of ["G25", "G26", "H7965", "G2316", "H5239"]) {
  const e = out[probe];
  console.log(`  ${probe}: ${e ? `${e.lemma} (${e.xlit}) — ${e.n} verses — ${e.kjv.slice(0, 4).map(([w, c]) => `${w}×${c}`).join(", ")}` : "ABSENT"}`);
}
