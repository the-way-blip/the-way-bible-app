import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hymnSlides, passageSlides, slideIndexForVerse } from "../src/utils/presentSlides.js";

const hymns = JSON.parse(readFileSync(new URL("../public/data/hymns/hymns.json", import.meta.url), "utf8"));

test("hymn with a refrain: title, then verse + refrain for every verse", () => {
  const h = hymns.find((x) => x.id === "it-is-well-with-my-soul");
  assert.ok(h?.refrain?.length, "fixture hymn has a refrain");
  const slides = hymnSlides(h);
  assert.equal(slides.length, 1 + h.verses.length * 2);
  assert.equal(slides[0].kind, "title");
  assert.equal(slides[0].title, h.title);
  assert.match(slides[0].subtitle, /Spafford/);
  for (let i = 0; i < h.verses.length; i++) {
    assert.equal(slides[1 + i * 2].label, `Verse ${i + 1}`);
    assert.deepEqual(slides[1 + i * 2].lines, h.verses[i].map((l) => l.trim()).filter(Boolean));
    assert.equal(slides[2 + i * 2].label, "Refrain");
    assert.equal(slides[2 + i * 2].italic, true);
  }
});

test("hymn without a refrain: title + one slide per verse", () => {
  const h = hymns.find((x) => !x.refrain && x.verses.length > 1);
  const slides = hymnSlides(h);
  assert.equal(slides.length, 1 + h.verses.length);
  assert.ok(slides.slice(1).every((s) => s.label.startsWith("Verse")));
});

const verses = [
  { verse: 1, text: "Short one." },
  { verse: 2, text: "Short two." },
  { verse: 3, text: "Short three." },
  { verse: 4, text: "x".repeat(300) },
  { verse: 5, text: "Short five." },
];

test("passage: one verse per slide with reference caption", () => {
  const s = passageSlides(verses, { book: "John", chapter: 3, translation: "KJV" });
  assert.equal(s.length, 5);
  assert.equal(s[0].caption, "John 3:1 KJV");
  assert.deepEqual(s[0].lines, ["Short one."]);
});

test("passage: 3 per slide packs short verses, long verse stands alone", () => {
  const s = passageSlides(verses, { book: "John", chapter: 3, translation: "KJV", perSlide: 3 });
  assert.deepEqual(s.map((x) => x.caption), ["John 3:1–3 KJV", "John 3:4 KJV", "John 3:5 KJV"]);
  assert.equal(s[0].lines[1].sup, 2);
  assert.equal(slideIndexForVerse(s, 2), 0);
  assert.equal(slideIndexForVerse(s, 5), 2);
  assert.equal(slideIndexForVerse(s, null), 0);
});
