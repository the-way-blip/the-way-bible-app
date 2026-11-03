// Word study "Dictionaries" tab: KJV renderings → Bible-dictionary headwords.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchRenderingHeadwords, normKey } from "../src/services/libraryService.js";

const idx = JSON.parse(readFileSync(new URL("../public/data/dict/index.json", import.meta.url)));
const byKey = new Map(idx.words.map((w) => [normKey(w[0]), w]));
const heads = (r) => matchRenderingHeadwords(r, byKey).map((m) => m.headword);

test("G26 agapē matches Love and Charity, not the 1x rendering", () => {
  assert.deepEqual(heads([["love", 86], ["charity", 28], ["dear", 1]]), ["Love", "Charity"]);
});

test("H2617 chesed matches its common renderings in frequency order", () => {
  const r = [["mercy", 149], ["kindness", 40], ["lovingkindness", 30], ["goodness", 12], ["kindly", 5], ["merciful", 4], ["favour", 3], ["good", 1], ["reproach", 1]];
  assert.deepEqual(heads(r), ["Mercy", "Kindness", "Lovingkindness", "Goodness"]);
});

test("plural renderings fall back to the singular headword", () => {
  assert.deepEqual(heads([["mercies", 10]]), ["Mercy"]);
});

test("short and unmatched renderings are skipped", () => {
  assert.deepEqual(heads([["of", 50], ["zzzz", 40]]), []);
});
