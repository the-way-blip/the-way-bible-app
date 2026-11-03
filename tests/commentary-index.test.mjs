// The sharded commentary search index (scripts/build-commentary-index.mjs →
// public/data/commentary-index/) must cover every term with exactly one shard,
// stay within the per-shard size budget, and point at real commentary sections.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public/data/commentary-index");
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
const shard = (k) => JSON.parse(fs.readFileSync(path.join(dir, `${k}.json`), "utf8"));
const coverage = JSON.parse(fs.readFileSync(path.join(root, "src/data/commentaryCoverage.json"), "utf8"));
const { USFM_BOOK_IDS } = await import(path.join(root, "src/data/translations.js"));

// Same lookup rule as src/services/commentarySearch.js (exact term)
const shardFor = (term) => manifest.shards.filter((k) => (k.endsWith("$") ? k.slice(0, -1) === term : term.startsWith(k)));

function decode(str) {
  let k = 0;
  return str.split(",").map((d) => {
    k += parseInt(d, 36);
    const verse = k % 180; let r = (k - verse) / 180;
    const chapter = r % 151; r = (r - chapter) / 151;
    const bi = r % 66;
    return { id: manifest.commentaries[(r - bi) / 66], book: manifest.books[bi], chapter, verse };
  });
}

function sectionText({ id, book, chapter, verse }) {
  const usfm = USFM_BOOK_IDS[book];
  const chunked = coverage.chunked?.[id]?.includes(usfm);
  const file = path.join(root, "public/data/commentary", id, chunked ? `${usfm}/${chapter}.json` : `${usfm}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = chunked ? data : data[String(chapter)];
  const hit = entries.find(([k]) => (verse === 0 ? k === "intro" : parseInt(k, 10) === verse));
  return hit?.[1] || "";
}

test("manifest lists 66 books and the local prose commentaries", () => {
  assert.equal(manifest.books.length, 66);
  assert.ok(manifest.commentaries.includes("barnes"));
  assert.ok(!manifest.commentaries.includes("treasury-of-scripture-knowledge"));
});

test("every shard is under 300 KB gzipped and every term sits in exactly one shard", () => {
  for (const k of manifest.shards) {
    const raw = fs.readFileSync(path.join(dir, `${k}.json`));
    assert.ok(zlib.gzipSync(raw).length < 300 * 1024, `${k} too large`);
    for (const term of Object.keys(JSON.parse(raw))) assert.deepEqual(shardFor(term), [k], term);
  }
});

test("'propitiation' finds Barnes on Romans 3:25 and the section really uses the word", () => {
  const [k] = shardFor("propitiation");
  const postings = decode(shard(k).propitiation);
  const barnes = postings.find((p) => p.id === "barnes" && p.book === "Romans" && p.chapter === 3 && p.verse === 25);
  assert.ok(barnes, "Barnes Romans 3:25");
  for (const p of postings.slice(0, 15)) assert.match(sectionText(p).toLowerCase(), /propitiation/, JSON.stringify(p));
});
