#!/usr/bin/env node
// Rebuilds public/data/search-index.json from the clean KJV compiled by
// seo/build-data.mjs (seo/data/kjv.json). The older index was derived from the
// Strong's-tagged source, which truncates ~11% of verses.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "seo/data/kjv.json");
const out = path.join(root, "public/data/search-index.json");

if (!fs.existsSync(src)) {
  console.error("seo/data/kjv.json not found — run `node seo/build-data.mjs` first");
  process.exit(1);
}

const { books } = JSON.parse(fs.readFileSync(src, "utf8"));
const rows = [];
for (const b of books) {
  b.chapters.forEach((verses, ci) => {
    verses.forEach((text, vi) => {
      const t = text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
      rows.push({ r: `${b.name} ${ci + 1}:${vi + 1}`, b: b.name, c: ci + 1, v: vi + 1, t });
    });
  });
}
fs.writeFileSync(out, JSON.stringify(rows));
const bad = rows.filter((e) => !/[.!?;:,)\]'"]$/.test(e.t)).length;
console.log(`search-index.json: ${rows.length} verses, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB, ${bad} without closing punctuation`);
