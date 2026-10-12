/**
 * seo/build-words.mjs
 * Compiles the index behind /bible-words — the King James words a modern reader
 * either does not know or, worse, thinks they know.
 *
 *   node seo/build-words.mjs
 *
 * For each entry in seo/words-archaic.js this finds every verse the word (and
 * its other forms) appears in, counts them, and works out which Hebrew or Greek
 * words it is translating, by reading the tagged text in public/data the same
 * way seo/build-strongs.mjs does — including the two quirks documented there:
 * chapter objects are cumulative in some books, and supplied words carry markup.
 *
 * The sense and the note are written by hand in words-archaic.js. Everything
 * here is counted from the text, so the page never claims a usage the KJV does
 * not actually have. If a word turns out to appear nowhere, the build says so
 * rather than shipping a page about a word that is not there.
 *
 * Words that kept both senses need care. "Let" appears 1,511 times and means
 * hinder in about four of them; listing all 1,221 verses under the heading "to
 * hinder" would be a lie told by a true number. Those entries carry an `only`
 * list of the references where the old sense is the one in play, and the page
 * shows those while still reporting the real total. An `only` reference that
 * does not resolve fails the build rather than quietly disappearing.
 *
 * Output (committed): seo/data/archaic.json
 *   { "let": { n: 2, refs: [[bookIndex, chapter, verse], ...],
 *              forms: [["letteth", 1], ["let", 1]],
 *              strongs: [["G2722", 2]] } }
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WORDS } from "./words-archaic.js";
import { parseRef } from "./render.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "public", "data");
const OUT = path.join(__dirname, "data");
const REFS_SHOWN = 30;

const kjv = JSON.parse(fs.readFileSync(path.join(OUT, "kjv.json"), "utf8"));
const byAbbr = new Map(kjv.books.map((b, i) => [b.abbr, i]));

// Every form we are looking for, pointing back at the entry that owns it. A form
// claimed by two entries is a mistake in the list, so it is reported, not merged.
const owner = new Map();
for (const w of WORDS) {
  for (const f of [w.word, ...(w.forms || [])]) {
    const k = f.toLowerCase();
    if (owner.has(k) && owner.get(k) !== w.word) console.warn(`  form "${k}" claimed by both ${owner.get(k)} and ${w.word}`);
    owner.set(k, w.word);
  }
}

const index = Object.create(null);
for (const w of WORDS) index[w.word] = { n: 0, refs: [], forms: Object.create(null), strongs: Object.create(null), seen: new Set() };

/* ---- pass 1: the clean KJV text, for counts and verse references ---- */
// A headword with a space in it ("by and by") never matches a token scan.
const PHRASES = WORDS.filter((w) => w.word.includes(" "))
  .map((w) => [w.word, new RegExp(`\\b${w.word.replace(/ /g, "\\s+")}\\b`, "g")]);
kjv.books.forEach((b, bi) => {
  b.chapters.forEach((ch, ci) => ch.forEach((txt, vi) => {
    const lower = String(txt).toLowerCase();
    const words = lower.replace(/[’']/g, " ").match(/[a-z]+/g);
    if (!words) return;
    const hit = new Set();
    for (const [phrase, re] of PHRASES) {
      const found = lower.match(re);
      if (!found) continue;
      const e = index[phrase];
      e.n += found.length;
      e.forms[phrase] = (e.forms[phrase] || 0) + found.length;
      hit.add(phrase);
    }
    for (const word of words) {
      const own = owner.get(word);
      if (!own) continue;
      const e = index[own];
      e.n++;
      e.forms[word] = (e.forms[word] || 0) + 1;
      hit.add(own);
    }
    for (const own of hit) {
      const e = index[own], rk = `${bi}|${ci}|${vi}`;
      if (!e.seen.has(rk)) { e.seen.add(rk); e.refs.push([bi, ci + 1, vi + 1]); }
    }
  }));
});

/* ---- pass 2: the tagged text, for the Hebrew or Greek behind each word ---- */
const booksMap = JSON.parse(fs.readFileSync(path.join(DATA, "books.json"), "utf8"));
booksMap.books.map((o) => Object.values(o)[0]).forEach((abbr, order) => {
  const file = path.join(DATA, `${abbr}.json`);
  if (!fs.existsSync(file)) return;
  const root = JSON.parse(fs.readFileSync(file, "utf8"));
  const bookName = Object.keys(root)[0];
  void (byAbbr.has(abbr) ? byAbbr.get(abbr) : order);
  const verses = new Map();              // deduped: chapter objects are cumulative in some books
  for (const chapter of Object.values(root[bookName])) {
    for (const [key, v] of Object.entries(chapter)) {
      if (v && typeof v.en === "string" && !verses.has(key)) verses.set(key, v.en);
    }
  }
  for (const raw of verses.values()) {
    const en = raw.replace(/<[^>]*>/g, " ");
    let cursor = 0, carried = "";
    const re = /\[([GH]\d+)\]/g;
    let m;
    while ((m = re.exec(en))) {
      const id = m[1];
      let rendering = en.slice(cursor, m.index).replace(/[^A-Za-z'’\- ]+/g, " ").trim().toLowerCase();
      cursor = m.index + m[0].length;
      if (!rendering) rendering = carried; else carried = rendering;
      if (!rendering) continue;
      for (const token of rendering.split(/\s+/)) {
        const own = owner.get(token);
        if (!own) continue;
        index[own].strongs[id] = (index[own].strongs[id] || 0) + 1;
      }
    }
  }
  process.stdout.write(".");
});
console.log("");

const out = Object.create(null);
const missing = [];
const bad = [];
for (const w of WORDS) {
  const e = index[w.word];
  if (!e.n) { missing.push(w.word); continue; }
  let refs = e.refs, picked = false;
  if (w.only && w.only.length) {
    picked = true;
    refs = [];
    for (const ref of w.only) {
      const r = parseRef(ref);
      if (!r) { bad.push(`${w.word}: ${ref}`); continue; }
      refs.push([r.book.index, r.chapter, r.from]);
    }
  }
  out[w.word] = {
    n: e.n,
    verses: e.refs.length,
    refs: refs.slice(0, REFS_SHOWN),
    picked,                                  // true: refs are chosen, not the first N
    forms: Object.entries(e.forms).sort((a, b) => b[1] - a[1]),
    // For a picked word the tally is dominated by the sense we are NOT describing
    // - "let" comes out as H7971 "send" and H5971 "people" - so it is left off
    // rather than printed under a heading it does not belong to.
    strongs: picked ? [] : Object.entries(e.strongs).sort((a, b) => b[1] - a[1]).slice(0, 6),
  };
}
if (bad.length) { console.error(`unresolved "only" references:\n  ${bad.join("\n  ")}`); process.exitCode = 1; }
fs.writeFileSync(path.join(OUT, "archaic.json"), JSON.stringify(out));
console.log(`archaic.json: ${Object.keys(out).length} words, ${(fs.statSync(path.join(OUT, "archaic.json")).size / 1024).toFixed(0)}kB`);
if (missing.length) console.warn(`NOT IN THE TEXT (no page will be built): ${missing.join(", ")}`);
for (const probe of ["let", "charity", "selah", "circumspectly", "prevent"]) {
  const e = out[probe];
  if (e) console.log(`  ${probe}: ${e.n} uses in ${e.verses} verses · forms ${e.forms.slice(0, 3).map(([f, c]) => `${f}×${c}`).join(", ")} · ${e.strongs.slice(0, 3).map(([id, c]) => `${id}×${c}`).join(", ")}`);
}
