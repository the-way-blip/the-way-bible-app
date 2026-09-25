#!/usr/bin/env node
// Cleans public/data/lexicon.json in place: decodes HTML entities that the
// source stores without semicolons ("&quot anointed&quot ,") and collapses
// occurrence lists that were duplicated end-to-end.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/data/lexicon.json");
const lex = JSON.parse(fs.readFileSync(file, "utf8"));

const decode = (s) => s
  .replace(/&#39;?\s+s\b/g, "'s")
  .replace(/&quot;? ?/g, '"')
  .replace(/&#39;? ?/g, "'")
  .replace(/\s*&#8212;?\s*/g, " — ")
  .replace(/&#8230;?/g, "…")
  .replace(/&nbsp;?/g, " ")
  .replace(/&amp;?/g, "&")
  .replace(/&#(\d+);?/g, (_, n) => String.fromCharCode(+n))
  .replace(/"\s+([,.;:)])/g, '"$1')
  .replace(/[ \t]{2,}/g, " ");

const dedupe = (occ) => {
  const parts = occ.split(",").map((p) => p.trim()).filter(Boolean);
  const seen = new Set();
  return parts.filter((p) => !seen.has(p) && seen.add(p)).join(", ");
};

let changed = 0;
for (const entry of Object.values(lex)) {
  for (const [k, v] of Object.entries(entry)) {
    if (typeof v !== "string") continue;
    let next = decode(v);
    if (k === "occurrences") next = dedupe(next);
    if (next !== v) { entry[k] = next; changed++; }
  }
}
fs.writeFileSync(file, JSON.stringify(lex));
const left = JSON.stringify(lex).match(/&[#a-z0-9]+;?/gi) || [];
console.log(`lexicon.json: ${changed} fields cleaned, ${left.length} entities left`);
