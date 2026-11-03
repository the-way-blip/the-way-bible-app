// Shape of the Strong's-tagged KJV in public/data/<Abbr>.json and the concordance built
// from it. Twelve book files once repeated every earlier chapter inside each later
// chapter object (76,774 verse entries for 31,102 verses); see
// scripts/fix-tagged-kjv-chapters.mjs. Run: node --test tests/tagged-kjv.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public/data");
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
const books = read("books.json").books.map((o) => Object.entries(o)[0]);
const chapterCount = read("chapter_count.json");

test("66 books, each with its chapters 1..N in order", () => {
  assert.equal(books.length, 66);
  for (const [name, abbr] of books) {
    const d = read(`${abbr}.json`);
    assert.equal(Object.keys(d).length, 1, `${abbr}: one top-level key`);
    const chKeys = Object.keys(d[abbr] || d[name]);
    const n = Number(chapterCount[abbr]);
    assert.deepEqual(chKeys, Array.from({ length: n }, (_, i) => `${abbr}|${i + 1}`), `${abbr}: chapter keys`);
  }
});

test("each chapter object holds only its own verses, each verse once", () => {
  let entries = 0;
  const all = new Set();
  for (const [name, abbr] of books) {
    const root = Object.values(read(`${abbr}.json`))[0];
    for (const [ck, ch] of Object.entries(root)) {
      const prefix = `${ck}|`;
      for (const [key, v] of Object.entries(ch)) {
        entries++;
        assert.ok(key.startsWith(prefix) && /^\d+$/.test(key.slice(prefix.length)), `${name}: ${key} under ${ck}`);
        assert.ok(!all.has(key), `${key} appears twice`);
        all.add(key);
        assert.equal(typeof v.en, "string", `${key}: en text`);
      }
    }
  }
  assert.equal(all.size, 31102, "unique verses");
  assert.equal(entries, 31102, "verse entries (no copies)");
});

test("concordance lists each verse once and covers all 66 books", () => {
  const conc = read("concordance.json");
  const names = new Set(books.map(([name]) => name));
  const seenBooks = new Set();
  for (const [id, refs] of Object.entries(conc)) {
    assert.match(id, /^[HG]\d+$/);
    assert.ok(refs.length >= 1 && refs.length <= 10, `${id}: ${refs.length} refs`);
    const rs = refs.map((x) => x.r);
    assert.equal(new Set(rs).size, rs.length, `${id}: duplicate refs ${rs.join("; ")}`);
    for (const r of rs) {
      const book = r.replace(/ \d+:\d+$/, "");
      assert.ok(names.has(book), `${id}: unknown book in ${r}`);
      seenBooks.add(book);
    }
  }
  assert.equal(seenBooks.size, 66);
});
