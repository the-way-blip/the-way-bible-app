#!/usr/bin/env node
/**
 * build-concordance.mjs — rebuild public/data/concordance.json from the Strong's-tagged KJV.
 *
 * Output: { "G26": [{ r: "Matthew 5:44", t: "But I say unto you, Love your enemies, bless them..." }, ...] }
 * The first LIMIT verses using each Strong's number, in canonical order, each verse once.
 * Read by the reader's word panel (WordStudyPanel), /word/:id and Strong's search.
 *
 * Replaces the untracked build-concordance.cjs, whose committed output had been built
 * when eight books (1Ki 2Ch Sng Isa Mar Act 1Co Phm) were absent and the twelve
 * cumulative-chapter files (see fix-tagged-kjv-chapters.mjs) listed one verse up to
 * ten times. Format matches that file: 10 refs, text cut at 80 chars + "...".
 *
 * Rerun:  node scripts/build-concordance.mjs     (rerun whenever the tagged KJV changes)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "public/data");
const LIMIT = 10;
const MAX_TEXT = 80;

const books = JSON.parse(fs.readFileSync(path.join(DATA, "books.json"), "utf8")).books.map((o) => Object.entries(o)[0]);
const concordance = {};
const verseKeys = new Set();

for (const [name, abbr] of books) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, `${abbr}.json`), "utf8"));
  for (const ch of Object.values(d[abbr] || d[name])) {
    for (const [key, v] of Object.entries(ch)) {
      if (!v.en || verseKeys.has(key)) continue;
      verseKeys.add(key);
      const [, c, vs] = key.split("|");
      const seen = new Set();
      for (const [, id] of v.en.matchAll(/\[([HG]\d+)\]/g)) {
        if (seen.has(id)) continue;
        seen.add(id);
        const list = (concordance[id] ||= []);
        if (list.length >= LIMIT) continue;
        const t = v.en
          .replace(/\[[HG]\d+\]/g, "")
          .replace(/<\/?em>/g, "")
          .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
          .trim();
        list.push({ r: `${name} ${c}:${vs}`, t: t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT)}...` : t });
      }
    }
  }
}

if (verseKeys.size !== 31102) throw new Error(`expected 31,102 verses, read ${verseKeys.size}`);
const out = path.join(DATA, "concordance.json");
fs.writeFileSync(out, JSON.stringify(concordance));
console.log(`concordance.json: ${verseKeys.size} verses, ${Object.keys(concordance).length} Strong's numbers, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
