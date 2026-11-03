#!/usr/bin/env node
// Builds a compact, sharded inverted index over the local commentary texts
// (public/data/commentary/<id>/...) so the Search page can search commentaries
// without downloading the ~65 MB of source files.
//
// Output: public/data/commentary-index/
//   manifest.json   { v, commentaries: [ids], books: [USFM], shards: [keys], docs, terms }
//   <key>.json      { "<term>": "<postings>" }
//
// A document is one commentary section: (commentary, book, chapter, start verse);
// verse 0 = the chapter introduction. Postings are packed integers
//   ((commentaryIdx * 66 + bookIdx) * 151 + chapter) * 180 + verse
// sorted ascending, delta-encoded, written in base 36 and joined by ",".
// Very common terms keep only their MAX_POSTINGS highest-frequency documents.
//
// Shards are keyed by term prefix and split adaptively (1 → 2 → 3 → 4 letters)
// until each one is under TARGET_GZ bytes gzipped, so a query fetches only the
// shards for its words and prefix search works by prefix lookup. A term shorter
// than its shard's depth lives in the "<term>$" shard.
//
//   node scripts/build-commentary-index.mjs
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public/data/commentary");
const outDir = path.join(root, "public/data/commentary-index");
const TARGET_GZ = 280 * 1024;
const MAX_POSTINGS = 1500;
const MAX_DEPTH = 4;

const { USFM_BOOK_IDS } = await import(path.join(root, "src/data/translations.js"));
const svc = fs.readFileSync(path.join(root, "src/services/commentaryService.js"), "utf8");
// Read the COMMENTARIES table without importing the browser module
const commentaries = [...svc.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*source:\s*"local"([^}]*)\}/g)]
  .filter((m) => !/kind:\s*"crossrefs"/.test(m[2]))
  .map((m) => m[1]);
const { default: bibleBooks } = await import(path.join(root, "src/data/bibleBooks.js"));
// Reader book names in canonical order; USFM ids looked up per name (USFM_BOOK_IDS has aliases)
const BOOK_NAMES = bibleBooks.map((b) => b.name);
const BOOKS = BOOK_NAMES.map((n) => USFM_BOOK_IDS[n]);
if (BOOKS.length !== 66 || BOOKS.some((b) => !b) || new Set(BOOKS).size !== 66) throw new Error("book table mismatch");
const coverage = JSON.parse(fs.readFileSync(path.join(root, "src/data/commentaryCoverage.json"), "utf8"));

export const STOPWORDS = new Set((
  "a about above after again against all also am an and any are as at be because been before being below between both but by " +
  "can could did do does doing down during each few for from further had has have having he her here hers herself him himself " +
  "his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours " +
  "ourselves out over own same she should so some such than that the their theirs them themselves then there these they this " +
  "those through to too under until up upon very was we were what when where which while who whom why will with would you your " +
  "yours yourself yourselves thee thou thy thine ye unto shall hath doth didst hast art may might must one two us let yet even " +
  "say said see ver vers verse verses chap ch viz etc"
).split(/\s+/));

const tokenize = (text) =>
  text.toLowerCase().replace(/[’‘]/g, "'").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/'s\b/g, "").match(/[a-z]{3,24}/g) || [];

// term → Map(docKey → tf)
const index = new Map();
let docs = 0;

function addDoc(ci, bi, chapter, verse, text) {
  const key = ((ci * 66 + bi) * 151 + chapter) * 180 + verse;
  const counts = new Map();
  for (const tok of tokenize(text)) {
    if (STOPWORDS.has(tok)) continue;
    counts.set(tok, (counts.get(tok) || 0) + 1);
  }
  if (!counts.size) return;
  docs++;
  for (const [tok, n] of counts) {
    let m = index.get(tok);
    if (!m) index.set(tok, (m = new Map()));
    m.set(key, (m.get(key) || 0) + n);
  }
}

function addChapter(ci, bi, chapter, entries) {
  for (const [k, raw] of entries || []) {
    const verse = k === "intro" ? 0 : parseInt(k, 10);
    if (!Number.isFinite(verse) || verse > 179 || chapter > 150) continue;
    addDoc(ci, bi, chapter, verse, raw.replace(/<[^>]+>/g, " "));
  }
}

commentaries.forEach((id, ci) => {
  const books = coverage.commentaries[id] || [];
  for (const usfm of books) {
    const bi = BOOKS.indexOf(usfm);
    if (bi < 0) continue;
    const chunked = coverage.chunked?.[id]?.includes(usfm);
    if (chunked) {
      const dir = path.join(dataDir, id, usfm);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        const ch = parseInt(f, 10);
        if (!ch) continue;
        addChapter(ci, bi, ch, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      }
    } else {
      const file = path.join(dataDir, id, `${usfm}.json`);
      if (!fs.existsSync(file)) continue;
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const [ch, entries] of Object.entries(data)) addChapter(ci, bi, parseInt(ch, 10), entries);
    }
  }
});

// Drop one-off noise (OCR fragments, transliteration typos) that appear in a single doc once
const encoded = new Map();
let postingsTotal = 0, capped = 0;
for (const [term, m] of index) {
  if (m.size === 1 && [...m.values()][0] === 1 && term.length > 14) continue;
  let entries = [...m.entries()];
  if (entries.length > MAX_POSTINGS) {
    capped++;
    entries.sort((a, b) => b[1] - a[1]);
    entries = entries.slice(0, MAX_POSTINGS);
  }
  const keys = entries.map((e) => e[0]).sort((a, b) => a - b);
  let prev = 0;
  encoded.set(term, keys.map((k) => { const d = k - prev; prev = k; return d.toString(36); }).join(","));
  postingsTotal += keys.length;
}

const gzSize = (obj) => zlib.gzipSync(JSON.stringify(obj), { level: 9 }).length;

// Adaptive prefix sharding
const shards = new Map(); // key → { term: postings }
function place(terms, prefix, depth) {
  const obj = Object.fromEntries(terms.map((t) => [t, encoded.get(t)]));
  if (depth >= MAX_DEPTH || gzSize(obj) <= TARGET_GZ) {
    shards.set(prefix, obj);
    return;
  }
  const groups = new Map();
  for (const t of terms) {
    const k = t.length > depth ? t.slice(0, depth + 1) : `${t}$`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  for (const [k, ts] of groups) {
    if (k.endsWith("$")) shards.set(k, Object.fromEntries(ts.map((t) => [t, encoded.get(t)])));
    else place(ts, k, depth + 1);
  }
}
const byFirst = new Map();
for (const t of [...encoded.keys()].sort()) {
  const k = t[0];
  if (!byFirst.has(k)) byFirst.set(k, []);
  byFirst.get(k).push(t);
}
for (const [k, ts] of byFirst) place(ts, k, 1);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let total = 0, totalGz = 0, largest = { key: "", gz: 0, raw: 0 };
const keys = [...shards.keys()].sort();
for (const k of keys) {
  const json = JSON.stringify(shards.get(k));
  fs.writeFileSync(path.join(outDir, `${k}.json`), json);
  const gz = zlib.gzipSync(json, { level: 9 }).length;
  total += json.length; totalGz += gz;
  if (gz > largest.gz) largest = { key: k, gz, raw: json.length };
}
const manifest = { v: 1, commentaries, books: BOOK_NAMES, shards: keys, docs, terms: encoded.size, maxPostings: MAX_POSTINGS };
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest));

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`commentary-index: ${commentaries.length} commentaries, ${docs.toLocaleString()} sections, ${encoded.size.toLocaleString()} terms, ${postingsTotal.toLocaleString()} postings (${capped} terms capped at ${MAX_POSTINGS})`);
console.log(`  ${keys.length} shards, ${(total / 1e6).toFixed(1)} MB raw / ${(totalGz / 1e6).toFixed(1)} MB gz; largest "${largest.key}" ${kb(largest.raw)} raw / ${kb(largest.gz)} gz`);
