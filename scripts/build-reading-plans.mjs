#!/usr/bin/env node
// Builds the data behind the classic reading plans and the reading-time estimates.
//
//   node scripts/build-reading-plans.mjs
//
// Outputs (all committed):
//   src/data/plans/mcheyne.json        M'Cheyne's Calendar for Daily Readings (1842)
//   src/data/plans/chronological.json  Chronological Bible in a Year
//   src/data/kjvWordCounts.json        KJV word counts (per chapter, + per verse where a
//                                      plan reads part of a chapter)
//
// Sources
//   KJV text — public/data/bibles/kjv/<USFM>.json  ({ "<ch>": ["v1 text", ...] })
//   M'Cheyne — Robert Murray M'Cheyne, "Calendar for Daily Readings" (Dundee, 1842),
//     public domain. Machine-readable transcription from the speric/mcheyne-api project:
//       https://raw.githubusercontent.com/speric/mcheyne-api/master/plan.json
//     (keyed MMDD → { family: [OT, NT], secret: [OT, NT/Psalms] }), cross-checked
//     reading-for-reading against an independent transcription in Raldan951/Portion:
//       https://raw.githubusercontent.com/Raldan951/Portion/HEAD/assets/plans/mcheyne_plan.json
//   Chronology — public/data/chrono.json (built by scripts/build-chrono.mjs from
//     scripts/chrono-data.mjs: KJV margin / Ussher years for every chapter).
//
// The script fails loudly (exit 1) if any verification check fails.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import bibleBooks from "../src/data/bibleBooks.js";
import { USFM_BOOK_IDS } from "../src/data/translations.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "scripts", "data", "reading-plans");
const MCHEYNE_URL = "https://raw.githubusercontent.com/speric/mcheyne-api/master/plan.json";
const MCHEYNE_CHECK_URL = "https://raw.githubusercontent.com/Raldan951/Portion/HEAD/assets/plans/mcheyne_plan.json";

let failures = 0;
const fail = (msg) => { failures++; console.error("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

/* ── KJV ─────────────────────────────────────────────────────────────── */
const BOOK_INDEX = new Map(bibleBooks.map((b, i) => [b.name, i]));
const kjv = {};
for (const b of bibleBooks) {
  const id = USFM_BOOK_IDS[b.name];
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/bibles/kjv", `${id}.json`), "utf8"));
  const chapters = [];
  for (let c = 1; c <= b.chapters; c++) {
    if (!data[c]) throw new Error(`KJV missing ${b.name} ${c}`);
    chapters.push(data[c]);
  }
  kjv[b.name] = chapters;
}
const verseCount = (book, ch) => kjv[book][ch - 1].length;
const words = (text) => text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const verseWords = (book, ch) => kjv[book][ch - 1].map(words);
const chapterWords = (book, ch) => verseWords(book, ch).reduce((a, b) => a + b, 0);
const refWords = (r) => {
  const vw = verseWords(r.book, r.chapter);
  const from = r.from || 1, to = r.to || vw.length;
  return vw.slice(from - 1, to).reduce((a, b) => a + b, 0);
};

/* ── Fetch with a local cache (scripts/data is gitignored) ───────────── */
function fetchCached(url, name) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, name);
  if (!fs.existsSync(file)) {
    console.log(`  fetching ${url}`);
    execFileSync("curl", ["-sSfL", "-o", file, url]);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/* ── Reference parsing ───────────────────────────────────────────────── */
const NAME_FIX = { "Song of Songs": "Song of Solomon", "Psalm": "Psalms" };
/** "Exodus 11-12:21" → [{book:"Exodus",chapter:11},{book:"Exodus",chapter:12,from:1,to:21}] */
function parseRef(raw) {
  const s = raw.replace(/\s+/g, " ").trim();
  const m = s.match(/^(.+?) (\d.*)$/);
  if (!m) throw new Error(`Unparseable reference: ${raw}`);
  const book = NAME_FIX[m[1]] || m[1];
  if (!BOOK_INDEX.has(book)) throw new Error(`Unknown book "${m[1]}" in ${raw}`);
  const out = [];
  for (const part of m[2].split(/\s*&\s*/)) {
    // c | c-c | c:v-v | c:vff | c:v-c:v | c-c:v
    let r;
    if ((r = part.match(/^(\d+)$/))) out.push({ book, chapter: +r[1] });
    else if ((r = part.match(/^(\d+)-(\d+)$/))) for (let c = +r[1]; c <= +r[2]; c++) out.push({ book, chapter: c });
    else if ((r = part.match(/^(\d+):(\d+)-(\d+)$/))) out.push({ book, chapter: +r[1], from: +r[2], to: +r[3] });
    else if ((r = part.match(/^(\d+):(\d+)ff$/))) out.push({ book, chapter: +r[1], from: +r[2], to: verseCount(book, +r[1]) });
    else if ((r = part.match(/^(\d+):(\d+)-(\d+):(\d+)$/))) {
      out.push({ book, chapter: +r[1], from: +r[2], to: verseCount(book, +r[1]) });
      for (let c = +r[1] + 1; c < +r[3]; c++) out.push({ book, chapter: c });
      out.push({ book, chapter: +r[3], from: 1, to: +r[4] });
    } else if ((r = part.match(/^(\d+)-(\d+):(\d+)$/))) {
      for (let c = +r[1]; c < +r[2]; c++) out.push({ book, chapter: c });
      out.push({ book, chapter: +r[2], from: 1, to: +r[3] });
    } else throw new Error(`Unparseable reference: ${raw}`);
  }
  for (const x of out) {
    const n = verseCount(x.book, x.chapter);
    if (x.from === 1 && x.to === n) { delete x.from; delete x.to; }
    if (x.from && (x.from < 1 || x.to > n || x.from > x.to)) throw new Error(`Bad verse range in ${raw}`);
  }
  return out;
}

/** Expand refs to "Book|ch|v" keys */
function* verseKeys(refs) {
  for (const r of refs) {
    const n = verseCount(r.book, r.chapter);
    for (let v = r.from || 1; v <= (r.to || n); v++) yield `${r.book}|${r.chapter}|${v}`;
  }
}
const compact = (r) => (r.from ? [r.book, r.chapter, r.from, r.to] : [r.book, r.chapter]);

/* ════════════════════ 1. M'Cheyne ════════════════════ */
console.log("M'Cheyne Calendar for Daily Readings");
const src = fetchCached(MCHEYNE_URL, "mcheyne-speric.json");
const check = fetchCached(MCHEYNE_CHECK_URL, "mcheyne-portion.json");

const mdays = Object.keys(src).sort();
if (mdays.length !== 365) fail(`expected 365 days, got ${mdays.length}`); else ok("365 days");
const mcheyne = [];
for (const k of mdays) {
  const d = src[k];
  const raw = [...(d.family || []), ...(d.secret || [])];
  if (raw.length !== 4) fail(`${k}: ${raw.length} readings`);
  mcheyne.push({ mmdd: k, raw, readings: raw.map(parseRef) });
}
if (mcheyne.every((d) => d.readings.length === 4)) ok("every day has exactly 4 readings");

// Jan 1 = Genesis 1, Matthew 1, Ezra 1, Acts 1
const jan1 = mcheyne[0].readings.map((rs) => rs.map((r) => `${r.book} ${r.chapter}`).join(","));
if (JSON.stringify(jan1) !== JSON.stringify(["Genesis 1", "Matthew 1", "Ezra 1", "Acts 1"])) fail(`Jan 1 = ${jan1}`);
else ok("Jan 1 = Genesis 1, Matthew 1, Ezra 1, Acts 1");

// Verse-level coverage: OT (outside Psalms) once, Psalms twice, NT twice
const counts = new Map();
for (const d of mcheyne) for (const rs of d.readings) for (const key of verseKeys(rs)) counts.set(key, (counts.get(key) || 0) + 1);
const tally = { OT: [0, 0], Psalms: [0, 0], NT: [0, 0] };
const chapterHits = new Map();
for (const b of bibleBooks) {
  const group = b.name === "Psalms" ? "Psalms" : b.testament;
  const want = group === "OT" ? 1 : 2;
  for (let c = 1; c <= b.chapters; c++) {
    for (let v = 1; v <= verseCount(b.name, c); v++) {
      const n = counts.get(`${b.name}|${c}|${v}`) || 0;
      tally[group][0]++;
      if (n === want) tally[group][1]++;
      else if (tally[group][0] - tally[group][1] <= 5) fail(`${b.name} ${c}:${v} read ${n}× (want ${want})`);
    }
  }
}
for (const [g, [all, good]] of Object.entries(tally)) {
  const want = g === "OT" ? "once" : "twice";
  if (all !== good) fail(`${g}: ${all - good} of ${all} verses not read exactly ${want}`);
  else ok(`${g === "OT" ? "Old Testament (excl. Psalms)" : g === "NT" ? "New Testament" : "Psalms"}: all ${all.toLocaleString()} verses read exactly ${want}`);
}
// Chapter-level view for the report (Psalm 119 is split into portions)
const ps119 = mcheyne.flatMap((d) => d.readings.flat()).filter((r) => r.book === "Psalms" && r.chapter === 119);
ok(`Psalm 119 read in ${ps119.length} portions (${ps119.map((r) => r.from ? `${r.from}-${r.to}` : "whole").join(", ")})`);

// Cross-check against the independent transcription
{
  const sched = check.schedule || [];
  let mism = 0; const diffs = [];
  for (const d of sched) {
    const k = d.month_day.replace("-", "");
    const mine = mcheyne.find((x) => x.mmdd === k);
    if (!mine) { if (k !== "0229") { mism++; fail(`cross-check: ${k} missing`); } continue; }
    const theirs = d.sections.flatMap((s) => s.readings).map((r) => r.display);
    const norm = (s) => s.replace(/\s+/g, " ").replace(/Song of Songs/, "Song of Solomon").replace(/^Psalm /, "Psalms ").trim();
    const a = mine.raw.map(norm).join(" | "), b = theirs.map(norm).join(" | ");
    if (a !== b) {
      // Tolerate notation-only differences: compare the verse sets.
      const setA = [...verseKeys(mine.readings.flat())].join();
      let setB;
      try { setB = [...verseKeys(theirs.flatMap(parseRef))].join(); } catch { setB = null; }
      if (setA !== setB) { mism++; diffs.push(`${k}: "${a}" vs "${b}"`); }
    }
  }
  if (sched.length < 365) fail(`cross-check source has only ${sched.length} days`);
  else if (!mism) ok(`matches the independent transcription on all 365 days`);
  else {
    // Informational only: on every disputed day checked so far the primary source agrees
    // with BibleGateway's M'Cheyne plan (e.g. 02-28 Exodus 11–12:21, 05-24 Psalm 78:1–37,
    // 08-08 "Jeremiah 36; 45", which the cross-check source drops altogether).
    console.warn(`  ! ${mism} days differ from the cross-check transcription (verse boundaries / omissions):`);
    for (const d of diffs) console.warn("      " + d);
  }
}

/* ════════════════════ 2. Chronological ════════════════════ */
console.log("Chronological Bible in a Year");
const chrono = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/chrono.json"), "utf8"));
// Corrections to obvious per-chapter outliers in chrono.json for *reading order* only
// (chrono.json itself is left untouched): John 1–2 are the Baptist's witness and the
// wedding at Cana (AD 26–27), not the years carried in by the prologue / infancy dating.
const YEAR_OVERRIDES = { "John 1": 26, "John 2": 27 };
// Psalms are independent poems — each is placed on its own date (interleaved with the
// life of David where the data gives a Davidic year). Every other book keeps its own
// chapter order: chapter years are smoothed to a non-decreasing sequence with an L1
// (median) isotonic fit, so a stray chapter (a genealogy, an appendix like Judges 17–21)
// doesn't drag the whole book with it; books then interleave by year.
const UNCHAINED = new Set(["Psalms"]);
function isotonicMedian(ys) {
  const blocks = [];
  const median = (vals) => { const s = [...vals].sort((a, b) => a - b); return s[(s.length - 1) >> 1]; };
  for (const y of ys) {
    blocks.push({ vals: [y], m: y });
    while (blocks.length > 1 && blocks[blocks.length - 1].m < blocks[blocks.length - 2].m) {
      const b = blocks.pop(), a = blocks.pop();
      const vals = a.vals.concat(b.vals);
      blocks.push({ vals, m: median(vals) });
    }
  }
  return blocks.flatMap((b) => b.vals.map(() => b.m));
}
const items = [];
for (const b of bibleBooks) {
  const ys = chrono.chapters[b.name];
  if (!ys || ys.length !== b.chapters) { fail(`chrono.json: ${b.name} has ${ys?.length} years for ${b.chapters} chapters`); continue; }
  const raw = ys.map((y, i) => YEAR_OVERRIDES[`${b.name} ${i + 1}`] ?? y);
  const eff = UNCHAINED.has(b.name) ? raw : isotonicMedian(raw);
  eff.forEach((y, i) => items.push({ book: b.name, chapter: i + 1, year: y, bi: BOOK_INDEX.get(b.name), w: chapterWords(b.name, i + 1) }));
}
items.sort((a, b) => a.year - b.year || a.bi - b.bi || a.chapter - b.chapter);

// Split into 365 days of roughly equal length by word count (DP: minimise the sum of
// squared deviations from the mean day; at most 12 chapters per day).
const N = items.length, K = 365, MAXC = 12;
const pre = [0];
for (const it of items) pre.push(pre[pre.length - 1] + it.w);
const target = pre[N] / K;
const INF = Infinity;
let prev = new Float64Array(N + 1).fill(INF); prev[0] = 0;
const choice = [];
for (let k = 1; k <= K; k++) {
  const cur = new Float64Array(N + 1).fill(INF);
  const ch = new Int32Array(N + 1).fill(-1);
  for (let i = k; i <= N - (K - k); i++) {
    for (let j = Math.max(k - 1, i - MAXC); j < i; j++) {
      if (prev[j] === INF) continue;
      const dev = pre[i] - pre[j] - target;
      const cost = prev[j] + dev * dev;
      if (cost < cur[i]) { cur[i] = cost; ch[i] = j; }
    }
  }
  choice.push(ch); prev = cur;
}
const cuts = [N];
for (let k = K; k >= 1; k--) cuts.unshift(choice[k - 1][cuts[0]]);
const chronoDays = [];
for (let k = 0; k < K; k++) chronoDays.push(items.slice(cuts[k], cuts[k + 1]));

if (chronoDays.length !== 365 || chronoDays.some((d) => !d.length)) fail("chronological plan does not have 365 non-empty days");
else ok("365 non-empty days");
{
  const seen = new Map();
  for (const d of chronoDays) for (const r of d) seen.set(`${r.book} ${r.chapter}`, (seen.get(`${r.book} ${r.chapter}`) || 0) + 1);
  let bad = 0;
  for (const b of bibleBooks) for (let c = 1; c <= b.chapters; c++) if (seen.get(`${b.name} ${c}`) !== 1) { bad++; fail(`${b.name} ${c} appears ${seen.get(`${b.name} ${c}`) || 0}×`); }
  const total = [...seen.values()].reduce((a, b) => a + b, 0);
  if (!bad && total === 1189) ok("all 1,189 chapters appear exactly once"); else fail(`chapter coverage: ${total} refs, ${bad} problems`);
}
const dayWords = chronoDays.map((d) => d.reduce((a, r) => a + r.w, 0));
ok(`words/day: mean ${Math.round(target)}, min ${Math.min(...dayWords)}, max ${Math.max(...dayWords)}`);

/* ════════════════════ 3. Word counts ════════════════════ */
console.log("KJV word counts");
const partial = new Set();
for (const d of mcheyne) for (const rs of d.readings) for (const r of rs) if (r.from) partial.add(`${r.book}|${r.chapter}`);
// c: words per chapter · n: verses per chapter · v: words per verse (partial chapters only)
const wc = { c: {}, n: {}, v: {} };
for (const b of bibleBooks) {
  wc.c[b.name] = Array.from({ length: b.chapters }, (_, i) => chapterWords(b.name, i + 1));
  wc.n[b.name] = Array.from({ length: b.chapters }, (_, i) => verseCount(b.name, i + 1));
}
for (const key of [...partial].sort()) {
  const [book, ch] = key.split("|");
  (wc.v[book] ||= {})[ch] = verseWords(book, +ch);
}
const totalWords = Object.values(wc.c).flat().reduce((a, b) => a + b, 0);
ok(`${totalWords.toLocaleString()} words; per-verse counts kept for ${partial.size} partially-read chapters`);

if (failures) {
  console.error(`\n${failures} check(s) failed — nothing written.`);
  process.exit(1);
}

/* ── Write ───────────────────────────────────────────────────────────── */
const outDir = path.join(ROOT, "src/data/plans");
fs.mkdirSync(outDir, { recursive: true });
// Each day = list of readings; each reading = list of compact refs [book, ch] | [book, ch, from, to]
fs.writeFileSync(path.join(outDir, "mcheyne.json"), JSON.stringify({
  source: MCHEYNE_URL,
  days: mcheyne.map((d) => d.readings.map((rs) => rs.map(compact))),
}) + "\n");
fs.writeFileSync(path.join(outDir, "chronological.json"), JSON.stringify({
  source: "public/data/chrono.json (KJV margin / Ussher)",
  days: chronoDays.map((d) => d.map((r) => [r.book, r.chapter])),
}) + "\n");
fs.writeFileSync(path.join(ROOT, "src/data/kjvWordCounts.json"), JSON.stringify(wc) + "\n");
for (const f of ["src/data/plans/mcheyne.json", "src/data/plans/chronological.json", "src/data/kjvWordCounts.json"]) {
  console.log(`  wrote ${f} (${(fs.statSync(path.join(ROOT, f)).size / 1024).toFixed(1)} KB)`);
}
