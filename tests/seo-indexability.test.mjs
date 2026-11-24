import test from "node:test";
import assert from "node:assert/strict";
import { render } from "../seo/render.js";

const robots = (q) => (render(q).body.match(/<meta name="robots" content="([^"]*)"/) || [])[1];

test("verse pages with writing, a topic link or search demand stay indexable", () => {
  assert.match(robots({ kind: "verse", book: "isaiah", chapter: "41", verse: "10" }), /^index/);
  assert.match(robots({ kind: "verse", book: "ephesians", chapter: "2", verse: "8-9" }), /^index/);
});

test("verse pages with none of those render but are noindexed", () => {
  const r = render({ kind: "verse", book: "numbers", chapter: "7", verse: "42" });
  assert.equal(r.status, 200);
  assert.equal(robots({ kind: "verse", book: "numbers", chapter: "7", verse: "42" }), "noindex,follow");
});

test("rare Strong's entries are noindexed unless a topic list links to them", () => {
  assert.equal(robots({ kind: "strongs", id: "h12" }), "noindex,follow");
  assert.match(robots({ kind: "strongs", id: "g1466" }), /^index/); // temperance, linked from the fruit of the Spirit
  assert.match(robots({ kind: "strongs", id: "h1" }), /^index/);
});

test("verse sitemaps list only indexable pages", () => {
  const xml = render({ kind: "sitemap", file: "verses-numbers" }).body;
  assert.ok(!xml.includes("/bible/numbers/7/42<"));
});

test("list pages carry the per-item detail", () => {
  const b = render({ kind: "topic", topic: "the-ten-commandments" }).body;
  assert.ok(b.includes("Each commandment in full"));
  assert.ok(b.includes("Deuteronomy 5:12-15"));
  const f = render({ kind: "topic", topic: "the-fruit-of-the-spirit" }).body;
  assert.ok(f.includes("ἐγκράτεια"));
});
