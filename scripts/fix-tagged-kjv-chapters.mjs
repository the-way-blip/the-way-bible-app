#!/usr/bin/env node
/**
 * fix-tagged-kjv-chapters.mjs — drop cumulative chapter copies from the Strong's-tagged KJV.
 *
 * Twelve of the public/data/<Abbr>.json files (1Sa 2Sa 2Ki 1Ch 2Co 1Th 2Th 1Ti 2Ti 1Pe
 * 2Pe 1Jo) shipped with each chapter object also holding every earlier chapter's
 * verses: "2Co|3" held 2Co|1|*, 2Co|2|* and 2Co|3|*. The copies were identical, so
 * keyed lookups still worked, but anything that walked every chapter counted them
 * again (76,774 verses instead of 31,102).
 *
 * The files are hand-assembled JSON with mixed separators, so no serializer reproduces
 * them. This removes the foreign "Book|c|v": {...} members by byte span and leaves
 * every other byte as it was. Idempotent; rerun safely. Verified by
 * tests/tagged-kjv.test.mjs.
 *
 * Run:  node scripts/fix-tagged-kjv-chapters.mjs [--check]
 *   --check  report affected files without writing (exit 1 if any)
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "public/data");
const CHECK = process.argv.includes("--check");

// Index of the char after the JSON value starting at i (strings, objects, arrays, scalars).
function skipValue(s, i) {
  if (s[i] === '"') {
    for (i++; s[i] !== '"'; i++) if (s[i] === "\\") i++;
    return i + 1;
  }
  if (s[i] === "{" || s[i] === "[") {
    let depth = 0;
    for (; i < s.length; i++) {
      const c = s[i];
      if (c === '"') { i = skipValue(s, i) - 1; continue; }
      if (c === "{" || c === "[") depth++;
      else if (c === "}" || c === "]") { if (--depth === 0) return i + 1; }
    }
    throw new Error("unterminated value");
  }
  while (i < s.length && !/[,}\]\s]/.test(s[i])) i++;
  return i;
}
const skipWs = (s, i) => { while (/\s/.test(s[i])) i++; return i; };

// Members of the object starting at `open`: [{ key, start, end, valueStart }], start = key's quote.
function members(s, open) {
  const out = [];
  let i = skipWs(s, open + 1);
  if (s[i] === "}") return { list: out, close: i };
  for (;;) {
    const start = i;
    const keyEnd = skipValue(s, i);
    const key = JSON.parse(s.slice(start, keyEnd));
    i = skipWs(s, keyEnd);
    assert.equal(s[i], ":");
    const valueStart = skipWs(s, i + 1);
    const end = skipValue(s, valueStart);
    out.push({ key, start, end, valueStart });
    i = skipWs(s, end);
    if (s[i] === "}") return { list: out, close: i };
    assert.equal(s[i], ",");
    i = skipWs(s, i + 1);
  }
}

const books = JSON.parse(fs.readFileSync(path.join(DATA, "books.json"), "utf8")).books.map((o) => Object.values(o)[0]);
let changed = 0, removed = 0;

for (const abbr of books) {
  const file = path.join(DATA, `${abbr}.json`);
  const src = fs.readFileSync(file, "utf8");
  const root = members(src, skipWs(src, 0)).list;
  assert.equal(root.length, 1, `${abbr}: expected one top-level key`);
  const chapters = members(src, root[0].valueStart).list;

  // Rebuild back to front so earlier offsets stay valid.
  let out = src, dropped = 0;
  for (const ch of [...chapters].reverse()) {
    const chNum = ch.key.split("|")[1];
    const { list, close } = members(src, ch.valueStart);
    const keep = list.filter((m) => m.key.split("|")[1] === chNum);
    if (keep.length === list.length) continue;
    assert.ok(keep.length, `${abbr} ${ch.key}: no verses of its own`);
    // Separator between members as this object writes it (", " or ",\n\t\t\t").
    const sep = src.slice(list[0].end, list[1].start);
    const body =
      src.slice(ch.valueStart, list[0].start) +
      keep.map((m) => src.slice(m.start, m.end)).join(sep) +
      src.slice(list.at(-1).end, close + 1);
    out = out.slice(0, ch.valueStart) + body + out.slice(close + 1);
    dropped += list.length - keep.length;
  }
  if (!dropped) continue;

  // Same verses, each once, under its own chapter; every kept verse byte-identical.
  const before = JSON.parse(src), after = JSON.parse(out);
  const flat = (d) => {
    const m = new Map();
    for (const ch of Object.values(Object.values(d)[0])) for (const [k, v] of Object.entries(ch)) if (!m.has(k)) m.set(k, v);
    return m;
  };
  assert.deepEqual(flat(after), flat(before), `${abbr}: verse set changed`);
  for (const [ck, ch] of Object.entries(Object.values(after)[0]))
    for (const k of Object.keys(ch)) assert.equal(k.split("|")[1], ck.split("|")[1], `${abbr}: ${k} still under ${ck}`);

  changed++;
  removed += dropped;
  console.log(`${abbr}: removed ${dropped} copied verses (${(src.length / 1e6).toFixed(2)} → ${(out.length / 1e6).toFixed(2)} MB chars)`);
  if (!CHECK) fs.writeFileSync(file, out);
}

console.log(changed ? `${CHECK ? "Would fix" : "Fixed"} ${changed} files, ${removed} copied verses.` : "No cumulative chapter copies found.");
if (CHECK && changed) process.exit(1);
