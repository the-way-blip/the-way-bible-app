/**
 * seo/build-commentary.mjs
 * Fetches Matthew Henry's public-domain commentary (bible.helloao.org, the
 * same free source already proxied by api/commentary.js for the in-app
 * reader) for every chapter of the Bible, and distills a short excerpt per
 * verse into seo/data/commentary.json:
 *   { "<bookAbbr>|<chapter>|<verse>": { excerpt, range, chapter } }
 * `range` is the verse span the excerpt actually covers (Matthew Henry
 * comments on blocks of verses, not one at a time), `chapter` is how many
 * verses the block runs to at most, for attribution ("comments on vv 1-21").
 *
 * Run once (or whenever refreshed): `node seo/build-commentary.mjs`
 * Takes a few minutes — fetches ~1,189 chapter files with limited concurrency.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { books } from "./render.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, "data", "commentary.json");
const BASE = "https://bible.helloao.org/api/c/matthew-henry";

const USFM = {
  Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU",
  Joshua: "JOS", Judges: "JDG", Ruth: "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
  Ezra: "EZR", Nehemiah: "NEH", Esther: "EST", Job: "JOB", Psalms: "PSA", Proverbs: "PRO",
  Ecclesiastes: "ECC", "Song of Solomon": "SNG", Isaiah: "ISA", Jeremiah: "JER",
  Lamentations: "LAM", Ezekiel: "EZK", Daniel: "DAN", Hosea: "HOS", Joel: "JOL",
  Amos: "AMO", Obadiah: "OBA", Jonah: "JON", Micah: "MIC", Nahum: "NAM", Habakkuk: "HAB",
  Zephaniah: "ZEP", Haggai: "HAG", Zechariah: "ZEC", Malachi: "MAL",
  Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT", Romans: "ROM",
  "1 Corinthians": "1CO", "2 Corinthians": "2CO", Galatians: "GAL", Ephesians: "EPH",
  Philippians: "PHP", Colossians: "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH",
  "1 Timothy": "1TI", "2 Timothy": "2TI", Titus: "TIT", Philemon: "PHM", Hebrews: "HEB",
  James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN",
  "3 John": "3JN", Jude: "JUD", Revelation: "REV",
};

/** First sentence(s) of a paragraph, trimmed to ~n chars at a sentence/clause boundary. */
function excerptOf(text, n = 320) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= n) return clean;
  const cut = clean.slice(0, n);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  if (lastStop > n * 0.4) return cut.slice(0, lastStop + 1).trim();
  return cut.replace(/\s+\S*$/, "").trim() + "…";
}

async function fetchChapter(usfm, chapter) {
  const url = `${BASE}/${usfm}/${chapter}.json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  return res.json();
}

async function pool(items, concurrency, worker) {
  let i = 0;
  const results = new Array(items.length);
  async function run() {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await worker(items[idx], idx); }
      catch (e) { results[idx] = null; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

async function main() {
  const out = {};
  const jobs = [];
  for (const b of books()) {
    const usfm = USFM[b.name];
    if (!usfm) { console.log(`no USFM code for ${b.name}, skipping`); continue; }
    for (let c = 1; c <= b.chapters.length; c++) jobs.push({ b, usfm, c });
  }
  console.log(`fetching commentary for ${jobs.length} chapters...`);

  let done = 0, ok = 0, missing = 0;
  await pool(jobs, 12, async ({ b, usfm, c }) => {
    const data = await fetchChapter(usfm, c);
    done++;
    if (done % 100 === 0) console.log(`  ${done}/${jobs.length}...`);
    if (!data || !data.chapter || !Array.isArray(data.chapter.content)) { missing++; return; }
    const blocks = data.chapter.content.filter((x) => x.type === "verse" && Number.isInteger(x.number));
    if (!blocks.length) { missing++; return; }
    const verseCount = b.chapters[c - 1].length;
    for (let i = 0; i < blocks.length; i++) {
      const start = blocks[i].number;
      const end = i + 1 < blocks.length ? blocks[i + 1].number - 1 : verseCount;
      const text = (blocks[i].content || []).filter((x) => typeof x === "string").join(" ");
      if (!text.trim()) continue;
      const excerpt = excerptOf(text);
      const range = start === end ? `${start}` : `${start}-${end}`;
      for (let v = Math.max(1, start); v <= Math.min(end, verseCount); v++) {
        out[`${b.abbr}|${c}|${v}`] = { excerpt, range };
      }
    }
    ok++;
  });

  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`done: ${ok} chapters ok, ${missing} missing/empty, ${Object.keys(out).length} verse keys, ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB`);
}

main();
