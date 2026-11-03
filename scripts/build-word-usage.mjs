#!/usr/bin/env node
/**
 * build-word-usage.mjs — precompute "See how a word is used" data for /word/:strongsId.
 *
 * Source of truth: the reader's Strong's-tagged KJV in public/data/<Abbr>.json
 * (verse text like "God[H430] created[H1254][H853]"). Every [H####]/[G####] tag is
 * one occurrence, so counts here equal what the reader shows.
 *
 * Output: public/data/word-usage/<H|G><bucket>.json, bucket = floor(number / 50),
 * e.g. G26 → word-usage/G0.json, H3068 → word-usage/H61.json. Each shard maps
 * Strong's id → {
 *   n: total tagged occurrences,
 *   b: [[bookIndex, count, flag, expected?], ...]   canonical order, only books with ≥1
 *        flag: 1 = more than expected, -1 = fewer, 0 = neither (expected only when flagged)
 *   z: [[bookIndex, expected], ...]                  books with 0 uses flagged "fewer"
 *   v: { bookIndex: [chapter*1000+verse, ...] }      verses containing the word
 *   f: [[strongsId, sharedVerses, gloss], ...]       "Found with", best first (≤12);
 *        gloss = that word's commonest KJV rendering in this tagged text
 * }
 * bookIndex is 0..65 in src/data/bibleBooks.js order.
 *
 * Statistics
 *   By book — expected = n × (book's tagged words in this testament / testament's
 *     tagged words), counting Hebrew tags against the OT and Greek tags against the NT.
 *     Two-sided exact binomial test, p = min(1, 2·min(P[X≤k], P[X≥k])); flag when
 *     p < 0.01. "More" additionally requires k ≥ 3 so a single use in a tiny book is
 *     not called significant.
 *   Found with — verse-level co-occurrence. For each pair sharing ≥ 3 verses and
 *     occurring more often together than chance, Dunning's log-likelihood (G²) on the
 *     2×2 verse table (N = tagged verses in that testament). Partners that are among
 *     the 150 most frequent Hebrew (or Greek) entries AND are function words by
 *     lexicon.json part of speech (article, pronoun, conjunction, preposition,
 *     particle, adverb, interjection — and not also a noun/verb) are excluded. Content words such as LORD (H3068) or God (H430) are kept.
 *
 * Rerun:  node scripts/build-word-usage.mjs     (≈30 s; rerun whenever the tagged KJV changes)
 * Self-check: the script aborts if per-book counts don't sum to the total, if the
 *   total tags don't match a raw regex count, if unique verses ≠ 31,102, or if G26
 *   (agape) ≠ 108 — its tagged count here (love 78, charity 28, charitably 1, dear 1).
 *   Note lexicon.json's occurrence string (the page header) says 115 for G26: it is
 *   BLB-derived and counts ~7 "love"s this tagged text leaves untagged.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "public/data");
const OUT = path.join(DATA, "word-usage");
const BUCKET = 50;
const P_LIMIT = 0.01;
const MIN_MORE = 3;
const MIN_CO = 3;
const TOP_FOUND = 12;
const STOP_TOP = 150;
const FUNCTION_POS = /article|pronoun|conjunction|preposition|particle|adverb|interjection/i;

const books = JSON.parse(fs.readFileSync(path.join(DATA, "books.json"), "utf8")).books.map((o) => Object.entries(o)[0]);
if (books.length !== 66) throw new Error(`expected 66 books, got ${books.length}`);
const lexicon = JSON.parse(fs.readFileSync(path.join(DATA, "lexicon.json"), "utf8"));

const renderings = new Map(); // id → Map(lowercase → Map(form → count))
const PARTICLE = new Set(["up", "down", "out", "off", "forth", "away", "in", "on", "over", "again", "together", "back", "not"]);
function noteRendering(id, seg) {
  const words = seg.replace(/<[^>]+>/g, " ").replace(/[^A-Za-z' -]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;
  let w = words[words.length - 1].replace(/^'+|'+$/g, "");
  if (PARTICLE.has(w.toLowerCase()) && words.length > 1) w = `${words[words.length - 2]} ${w}`;
  if (!w) return;
  // Forms are grouped case-insensitively; the commonest spelling (God, LORD, faith) is shown.
  const form = w;
  const low = w.toLowerCase();
  let r = renderings.get(id);
  if (!r) renderings.set(id, (r = new Map()));
  if (!r.has(low)) r.set(low, new Map());
  r.get(low).set(form, (r.get(low).get(form) || 0) + 1);
}

// ── 1. Read the tagged KJV ─────────────────────────────────────────────────
const TAG = /\[([HG]\d+)\]/g;
const occ = new Map(); // id → { n, byBook: Int32Array(66), verses: Map(book → [cv]) }
const bookTagged = [new Array(66).fill(0), new Array(66).fill(0)]; // [H, G] per book
const verseSets = [[], []]; // per testament: array of Set(id) for tagged verses
let rawTotal = 0;
let totalVerses = 0;

books.forEach(([name, abbr], bi) => {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, `${abbr}.json`), "utf8"));
  const root = d[abbr] || d[name];
  // Some book files repeat earlier chapters' verses inside later chapter objects
  // (2Co|2 also holds 2Co|1|1…), so dedupe by the verse key, which carries its chapter.
  const verses = new Map();
  for (const ch of Object.values(root)) for (const [key, v] of Object.entries(ch)) if (!verses.has(key)) verses.set(key, v);
  totalVerses += verses.size;
  {
    for (const [key, v] of verses) {
      const en = v.en || "";
      rawTotal += (en.match(/\[[HG]\d+\]/g) || []).length;
      const [, c, vs] = key.split("|");
      const cv = Number(c) * 1000 + Number(vs);
      const seen = new Set();
      let lastEnd = 0;
      for (const m of en.matchAll(TAG)) {
        const id = m[1];
        const L = id[0] === "H" ? 0 : 1;
        bookTagged[L][bi]++;
        // KJV rendering = last English word(s) before the tag; only the first tag of a
        // chain like created[H1254][H853] gets one.
        const seg = en.slice(lastEnd, m.index);
        lastEnd = m.index + m[0].length;
        if (seg.trim()) noteRendering(id, seg);
        let o = occ.get(id);
        if (!o) occ.set(id, (o = { n: 0, byBook: new Int32Array(66), verses: new Map() }));
        o.n++;
        o.byBook[bi]++;
        if (!seen.has(id)) {
          seen.add(id);
          if (!o.verses.has(bi)) o.verses.set(bi, []);
          o.verses.get(bi).push(cv);
        }
      }
      if (seen.size) {
        // Testament by book position; a stray cross-language tag stays with its language.
        const T = bi < 39 ? 0 : 1;
        verseSets[T].push(seen);
      }
    }
  }
});

// ── 1b. Commonest KJV rendering per entry (the gloss shown under "Found with") ──
function topRendering(id) {
  const r = renderings.get(id);
  if (!r) return "";
  let best = "", bestN = 0;
  for (const [low, forms] of r) {
    const n = [...forms.values()].reduce((s, x) => s + x, 0);
    if (n > bestN) { bestN = n; best = [...forms.entries()].sort((a, b) => b[1] - a[1])[0][0]; }
  }
  return best;
}

const langTotal = bookTagged.map((a) => a.reduce((s, x) => s + x, 0));

// ── 2. Binomial test ───────────────────────────────────────────────────────
const LG = (() => { // log-gamma via Lanczos
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  return function lg(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lg(1 - x);
    x -= 1; let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  };
})();
const logPmf = (k, n, p) => LG(n + 1) - LG(k + 1) - LG(n - k + 1) + k * Math.log(p) + (n - k) * Math.log1p(-p);
function tail(k, n, p, upper) { // P[X≥k] if upper else P[X≤k]
  let term = Math.exp(logPmf(k, n, p)), sum = term, i = k;
  const r = p / (1 - p);
  while (upper ? i < n : i > 0) {
    term = upper ? term * ((n - i) / (i + 1)) * r : term * (i / (n - i + 1)) / r;
    i += upper ? 1 : -1;
    sum += term;
    if (term < sum * 1e-15) break;
  }
  return Math.min(1, sum);
}
const binomP = (k, n, p) => Math.min(1, 2 * Math.min(tail(k, n, p, false), tail(k, n, p, true)));

// ── 3. Stop list for "Found with" (per language) ──────────────────────────────────────────
const byFreq = [...occ.entries()].sort((a, b) => b[1].n - a[1].n);
const stop = new Set();
for (const L of ["H", "G"]) {
  for (const [id] of byFreq.filter(([id]) => id[0] === L).slice(0, STOP_TOP)) {
    const pos = lexicon[id]?.part_of_speech || "";
    // Mixed entries such as H1004 "…adverb, masculine noun" (house) stay in.
    if (FUNCTION_POS.test(pos) && !/\b(noun|verb)\b/i.test(pos)) stop.add(id);
  }
}

// ── 4. Co-occurrence ───────────────────────────────────────────────────────
const verseCount = new Map(); // id → verses containing it
const pairs = [new Map(), new Map()]; // per testament: id → Map(partner → shared)
verseSets.forEach((sets, T) => {
  for (const s of sets) {
    const ids = [...s];
    for (const id of ids) verseCount.set(id, (verseCount.get(id) || 0) + 1);
    for (let i = 0; i < ids.length; i++) {
      let mi = pairs[T].get(ids[i]);
      if (!mi) pairs[T].set(ids[i], (mi = new Map()));
      for (let j = 0; j < ids.length; j++) if (i !== j) mi.set(ids[j], (mi.get(ids[j]) || 0) + 1);
    }
  }
});
const xlogx = (x) => (x > 0 ? x * Math.log(x) : 0);
function g2(k11, k12, k21, k22) {
  const N = k11 + k12 + k21 + k22;
  return 2 * (xlogx(k11) + xlogx(k12) + xlogx(k21) + xlogx(k22) + xlogx(N)
    - xlogx(k11 + k12) - xlogx(k21 + k22) - xlogx(k11 + k21) - xlogx(k12 + k22));
}

// ── 5. Assemble + self-check ───────────────────────────────────────────────
const shards = new Map();
let grand = 0;
for (const [id, o] of occ) {
  const L = id[0] === "H" ? 0 : 1;
  const sum = o.byBook.reduce((s, x) => s + x, 0);
  if (sum !== o.n) throw new Error(`${id}: per-book sum ${sum} ≠ total ${o.n}`);
  grand += o.n;

  const b = [], z = [];
  for (let bi = 0; bi < 66; bi++) {
    const k = o.byBook[bi];
    const share = bookTagged[L][bi] / langTotal[L];
    if (share === 0) { if (k) b.push([bi, k, 0]); continue; }
    const exp = o.n * share;
    let flag = 0;
    if (binomP(k, o.n, share) < P_LIMIT) flag = k > exp ? (k >= MIN_MORE ? 1 : 0) : -1;
    const e = Math.round(exp * 10) / 10;
    if (k) b.push(flag ? [bi, k, flag, e] : [bi, k, 0]);
    else if (flag === -1) z.push([bi, e]);
  }

  const v = {};
  for (const [bi, list] of o.verses) v[bi] = list;

  const T = L; // Hebrew ↔ OT verses, Greek ↔ NT verses
  const N = verseSets[T].length;
  const A = verseCount.get(id) || 0;
  const f = [];
  for (const [p, co] of pairs[T].get(id) || []) {
    if (co < MIN_CO || stop.has(p) || p[0] !== id[0]) continue;
    const B = verseCount.get(p);
    if (co * N <= A * B) continue; // only positive association
    f.push([p, co, g2(co, A - co, B - co, N - A - B + co)]);
  }
  f.sort((x, y) => y[2] - x[2]);

  const entry = { n: o.n, b, v, f: f.slice(0, TOP_FOUND).map(([p, co]) => [p, co, topRendering(p)]) };
  if (z.length) entry.z = z;
  const shard = `${id[0]}${Math.floor(Number(id.slice(1)) / BUCKET)}`;
  if (!shards.has(shard)) shards.set(shard, {});
  shards.get(shard)[id] = entry;
}
if (totalVerses !== 31102) throw new Error(`unique verses ${totalVerses} ≠ 31102`);
if (grand !== rawTotal) throw new Error(`grand total ${grand} ≠ raw tag count ${rawTotal}`);
const g26 = occ.get("G26")?.n;
// G26 in this tagged KJV: love 77 + love's 1 + charity 28 + charitably 1 + dear 1 = 108.
// (lexicon.json's BLB-derived "love(86x), charity(28x), dear(1x)" = 115 counts some
// "love"s our text leaves untagged, so the header total can differ from this one.)
if (g26 !== 108) throw new Error(`G26 total ${g26} ≠ 108 tagged occurrences`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let bytes = 0, biggest = ["", 0];
for (const [name, obj] of shards) {
  const s = JSON.stringify(obj);
  fs.writeFileSync(path.join(OUT, `${name}.json`), s);
  bytes += s.length;
  if (s.length > biggest[1]) biggest = [name, s.length];
}
console.log(`words ${occ.size}, tags ${grand} (H ${langTotal[0]}, G ${langTotal[1]}), verses OT ${verseSets[0].length} NT ${verseSets[1].length}`);
console.log(`stop list ${stop.size}: ${[...stop].join(" ")}`);
console.log(`shards ${shards.size}, total ${(bytes / 1024 / 1024).toFixed(2)} MB, largest ${biggest[0]} ${(biggest[1] / 1024).toFixed(0)} KB`);
console.log("self-check OK: per-book sums = totals, grand total = raw tag count, 31102 verses, G26 = 108");
