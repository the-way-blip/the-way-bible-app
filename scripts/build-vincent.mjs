#!/usr/bin/env node
/**
 * Vincent's Word Studies in the New Testament (Marvin R. Vincent, 1887–1900;
 * public domain) → public/data/commentary/vincent/<USFM>.json in the same shape
 * build-sword-data.py writes: { "<ch>": [["<verse>", "text"], ...] }.
 *
 * Source: the digital edition on biblehub.com/commentaries/vws/ (one page per
 * chapter, clean polytonic Greek; the archive.org scans' OCR mangles the Greek).
 * Pages are cached in ~/theway-vws-cache so a rerun does not refetch.
 *
 *   node scripts/build-vincent.mjs            fetch (1 req/0.8 s) + build
 *   node scripts/build-vincent.mjs --offline  build from the cache only
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/data/commentary/vincent");
const CACHE = path.join(os.homedir(), "theway-vws-cache");
const OFFLINE = process.argv.includes("--offline");

// [app book, USFM, biblehub slug, chapters]
const NT = [
  ["Matthew", "MAT", "matthew", 28], ["Mark", "MRK", "mark", 16], ["Luke", "LUK", "luke", 24],
  ["John", "JHN", "john", 21], ["Acts", "ACT", "acts", 28], ["Romans", "ROM", "romans", 16],
  ["1 Corinthians", "1CO", "1_corinthians", 16], ["2 Corinthians", "2CO", "2_corinthians", 13],
  ["Galatians", "GAL", "galatians", 6], ["Ephesians", "EPH", "ephesians", 6],
  ["Philippians", "PHP", "philippians", 4], ["Colossians", "COL", "colossians", 4],
  ["1 Thessalonians", "1TH", "1_thessalonians", 5], ["2 Thessalonians", "2TH", "2_thessalonians", 3],
  ["1 Timothy", "1TI", "1_timothy", 6], ["2 Timothy", "2TI", "2_timothy", 4], ["Titus", "TIT", "titus", 3],
  ["Philemon", "PHM", "philemon", 1], ["Hebrews", "HEB", "hebrews", 13], ["James", "JAS", "james", 5],
  ["1 Peter", "1PE", "1_peter", 5], ["2 Peter", "2PE", "2_peter", 3], ["1 John", "1JN", "1_john", 5],
  ["2 John", "2JN", "2_john", 1], ["3 John", "3JN", "3_john", 1], ["Jude", "JUD", "jude", 1],
  ["Revelation", "REV", "revelation", 22],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(slug, ch) {
  const file = path.join(CACHE, `${slug}-${ch}.htm`);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  if (OFFLINE) return null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`https://biblehub.com/commentaries/vws/${slug}/${ch}.htm`, {
      headers: { "User-Agent": "TheWayBibleApp-build/1.0 (+https://thewaybible.app)" },
    }).catch(() => null);
    await sleep(800);
    if (res?.status === 404) return null;
    if (res?.ok) {
      const html = await res.text();
      fs.writeFileSync(file, html);
      return html;
    }
  }
  throw new Error(`fetch failed: ${slug} ${ch}`);
}

const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** One comm div → plain text: "Headword (Greek)\n\nNote…", one block per <p>. */
function clean(html) {
  const t = decode(html
    .replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, ""))
    .normalize("NFC")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return t;
}

function parse(html, slug, ch) {
  const out = [];
  const re = /<div class="versenum"><a href="\/[^/]+\/(\d+)-(\d+)\.htm">[^<]*<\/a><\/div>(?:<div class="verse">[\s\S]*?<\/div>)?<div class="comm">([\s\S]*?)<\/div>/g;
  for (let m; (m = re.exec(html)); ) {
    if (Number(m[1]) !== ch) throw new Error(`${slug} ${ch}: verse link points at chapter ${m[1]}`);
    const text = clean(m[3]);
    if (text) out.push([m[2], text]);
  }
  return out;
}

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const counts = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/verseCounts.json"), "utf8"));
let notes = 0, chapters = 0, empty = [];
for (const [book, usfm, slug, n] of NT) {
  const data = {};
  for (let ch = 1; ch <= n; ch++) {
    const html = await page(slug, ch);
    if (!html) { empty.push(`${book} ${ch} (no page)`); continue; }
    const entries = parse(html, slug, ch);
    const last = counts[usfm]?.[ch - 1];
    if (!last) throw new Error(`${book} ${ch}: no KJV verse count`);
    for (const [v] of entries) if (last && Number(v) > last) throw new Error(`${book} ${ch}:${v} is past the last verse (${last})`);
    if (!entries.length) { empty.push(`${book} ${ch}`); continue; }
    data[String(ch)] = entries;
    notes += entries.length;
    chapters++;
  }
  fs.writeFileSync(path.join(OUT, `${usfm}.json`), JSON.stringify(data));
  process.stdout.write(`${usfm} `);
}
console.log(`\n${chapters} chapters, ${notes} verse notes. Chapters without notes: ${empty.length ? empty.join(", ") : "none"}`);

// Register the books in the coverage map the reader uses to list commentaries.
const covFile = path.join(ROOT, "src/data/commentaryCoverage.json");
const cov = JSON.parse(fs.readFileSync(covFile, "utf8"));
cov.commentaries.vincent = NT.map(([, usfm]) => usfm).filter((u) => fs.existsSync(path.join(OUT, `${u}.json`)));
fs.writeFileSync(covFile, JSON.stringify(cov));
