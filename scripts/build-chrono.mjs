#!/usr/bin/env node
// Bible + World timeline data.
//   node scripts/build-chrono.mjs <Theographic folder with verses.json>
// → public/data/chrono.json
// Chapter years come from Theographic's per-verse yearNum (KJV margin / Ussher);
// people, books and world history from scripts/chrono-data.mjs.
// Every year in the output is astronomical (1 BC = 0, 2 BC = -1) to match
// timeline.json and formatYear().
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BOOKS, PEOPLE, BIBLE_EXTRA, WORLD, ERAS, CHAPTER_YEARS } from "./chrono-data.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2];
const astro = (y) => (y < 0 ? y + 1 : y);
const span = (y) => (Array.isArray(y) ? y.map(astro) : [astro(y), astro(y)]);

// Harmonize conventional dates older than 1650 BC into the post-Flood window:
// 3200 BC → c. 2230 BC (just after Babel), 1650 BC unchanged, linear between.
// From 1650 BC on the biblical and conventional frameworks broadly agree.
const HARM_FROM = 1650, HARM_TOP = 3200, HARM_TO = 2230;
function harmonize(y) {
  if (y >= -HARM_FROM) return y;
  const bc = Math.min(-y, HARM_TOP);
  return -Math.round((HARM_FROM + (bc - HARM_FROM) * (HARM_TO - HARM_FROM) / (HARM_TOP - HARM_FROM)) / 10) * 10;
}

// ── Chapter years ────────────────────────────────────────────────────────────
const OSIS = "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split(" ");
const counts = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/verseCounts.json"), "utf8"))); // canonical order
const verses = JSON.parse(fs.readFileSync(path.join(SRC, "verses.json"), "utf8"));
const byChapter = {};
for (const { fields: v } of verses) {
  if (v.yearNum == null) continue;
  const [b, c] = v.osisRef.split(".");
  (byChapter[`${b}.${c}`] ||= []).push(v.yearNum);
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

const chapters = {};
const books = [];
BOOKS.forEach(([name, author, written], i) => {
  const osis = OSIS[i];
  const n = counts[i].length;
  const w = span(written);
  const years = [];
  for (let c = 1; c <= n; c++) {
    const a = byChapter[`${osis}.${c}`];
    years.push(CHAPTER_YEARS[name] ? astro(CHAPTER_YEARS[name][c - 1]) : a ? astro(median(a)) : null);
  }
  // Letters are dated by when they were written; undated narrative chapters
  // carry the previous chapter's year; undated psalms default to David's reign.
  const letter = i >= OSIS.indexOf("Rom");
  const fallback = name === "Psalms" ? astro(-1040) : Math.round((w[0] + w[1]) / 2);
  const dated = years.filter((y) => y != null);
  for (let c = 0; c < years.length; c++) {
    if (letter) years[c] = fallback;
    else if (years[c] == null) years[c] = name === "Psalms" ? fallback : (years[c - 1] ?? dated[0] ?? fallback);
  }
  chapters[name] = years;
  const c = letter || name === "Psalms" ? w : [Math.min(...years), Math.max(...years)];
  books.push({ n: name, a: author, w, c });
});

// ── People, events, world ────────────────────────────────────────────────────
const people = PEOPLE.map(([slug, name, from, to, role]) => [slug, name, astro(from), astro(to), role]);
const names = Object.fromEntries(people.map(([s, n]) => [s, n]));
const index = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/people/index.json"), "utf8"));
for (const [s, n] of index) names[s] ||= n;

const bible = BIBLE_EXTRA.map(([y, title, ref, who], i) => ({
  id: `x${i + 1}`, year: astro(y), title, ref, people: who.filter((s) => names[s]).map((s) => [s, names[s]]), places: [],
}));

const world = WORLD.map((w, i) => {
  const [cs, ce] = span(w.y);
  const y = Array.isArray(w.y) ? w.y : [w.y, w.y];
  const [s, e] = w.h != null ? span(w.h) : y.map((v) => astro(harmonize(v)));
  const out = { id: `w${i + 1}`, t: w.t, s, e, r: w.r, k: w.k, d: w.d };
  if (s !== cs || e !== ce) out.cv = [cs, ce];
  if (w.p) out.p = w.p;
  if (w.ref) out.ref = w.ref;
  return out;
}).sort((a, b) => a.s - b.s);

const eras = ERAS.map((e) => ({ ...e, from: astro(e.from), to: astro(e.to) }));

const out = { eras, books, people, bible, world, chapters };
fs.writeFileSync(path.join(ROOT, "public/data/chrono.json"), JSON.stringify(out));
console.log(`chrono.json: ${books.length} books, ${people.length} people, ${bible.length} extra events, ${world.length} world entries, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
const missing = PEOPLE.filter(([s]) => !index.some(([x]) => x === s)).map(([s]) => s);
if (missing.length) console.warn("people not in index:", missing.join(", "));
