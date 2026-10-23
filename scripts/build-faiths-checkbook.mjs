#!/usr/bin/env node
/**
 * C. H. Spurgeon, Faith's Checkbook (1888; public domain) → one reading a day in
 * public/data/devotionals/faiths-checkbook/<MM>.json, { "MM.DD": "text" }, the
 * shape the Devotional page already reads.
 *
 * Source: CCEL's ThML edition (ccel.org/ccel/spurgeon/checkbook), cached in
 * ~/theway-devo-cache. Each day is a title, a promise with an OSIS reference,
 * and Spurgeon's comment. Every promise is checked word for word against the
 * app's own KJV (public/data/bibles/kjv); a quote that is not found in its verse
 * stops the build so it can be looked at.
 *
 *   node scripts/build-faiths-checkbook.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/data/devotionals/faiths-checkbook");
const CACHE = path.join(os.homedir(), "theway-devo-cache");
const SRC = path.join(CACHE, "checkbook.xml");

// OSIS book → [app name, USFM]
const BOOKS = {
  Gen: ["Genesis", "GEN"], Exod: ["Exodus", "EXO"], Lev: ["Leviticus", "LEV"], Num: ["Numbers", "NUM"],
  Deut: ["Deuteronomy", "DEU"], Josh: ["Joshua", "JOS"], Judg: ["Judges", "JDG"], "1Sam": ["1 Samuel", "1SA"],
  "2Sam": ["2 Samuel", "2SA"], "1Kgs": ["1 Kings", "1KI"], "2Kgs": ["2 Kings", "2KI"], "1Chr": ["1 Chronicles", "1CH"],
  "2Chr": ["2 Chronicles", "2CH"], Job: ["Job", "JOB"], Ps: ["Psalms", "PSA"], Prov: ["Proverbs", "PRO"],
  Eccl: ["Ecclesiastes", "ECC"], Isa: ["Isaiah", "ISA"], Jer: ["Jeremiah", "JER"], Lam: ["Lamentations", "LAM"],
  Ezek: ["Ezekiel", "EZK"], Dan: ["Daniel", "DAN"], Hos: ["Hosea", "HOS"], Joel: ["Joel", "JOL"], Amos: ["Amos", "AMO"],
  Mic: ["Micah", "MIC"], Nah: ["Nahum", "NAM"], Hab: ["Habakkuk", "HAB"], Zeph: ["Zephaniah", "ZEP"],
  Hag: ["Haggai", "HAG"], Zech: ["Zechariah", "ZEC"], Mal: ["Malachi", "MAL"], Matt: ["Matthew", "MAT"],
  Mark: ["Mark", "MRK"], Luke: ["Luke", "LUK"], John: ["John", "JHN"], Acts: ["Acts", "ACT"], Rom: ["Romans", "ROM"],
  "1Cor": ["1 Corinthians", "1CO"], "2Cor": ["2 Corinthians", "2CO"], Gal: ["Galatians", "GAL"],
  Phil: ["Philippians", "PHP"], "1Thess": ["1 Thessalonians", "1TH"], "2Thess": ["2 Thessalonians", "2TH"],
  "1Tim": ["1 Timothy", "1TI"], Heb: ["Hebrews", "HEB"], Jas: ["James", "JAS"], "1Pet": ["1 Peter", "1PE"],
  "2Pet": ["2 Peter", "2PE"], Rev: ["Revelation", "REV"],
};
const MONTHS = { Jan: 1, Feb: 2, March: 3, April: 4, May: 5, June: 6, July: 7, Aug: 8, Sept: 9, Oct: 10, Nov: 11, Dec: 12 };
const SMALL = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "is", "it", "of", "on", "or", "the", "to", "with"]);

if (!fs.existsSync(SRC)) {
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch("https://ccel.org/ccel/s/spurgeon/checkbook.xml");
  if (!res.ok) throw new Error(`CCEL ${res.status}`);
  fs.writeFileSync(SRC, await res.text());
}
const xml = fs.readFileSync(SRC, "utf8");

const decode = (s) => s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const text = (html) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const titleCase = (s) => s.replace(/\s*--\s*/g, " — ").toLowerCase().replace(/[a-z][a-z']*/g, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)))
  .replace(/\bgod\b/gi, "God").replace(/\blord\b/gi, "Lord");
const words = (s) => s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean).join(" ");

// The KJV wins over CCEL's typing: American spellings ("labor", "honor"),
// joined words ("everyone", "today") and a few real slips ("fruitful" for
// "unfruitful" in 2 Pet 1:8, "Abraham" for "Abram") are all replaced by the
// KJV's own words. Spellings below are folded together only for matching.
const FOLD = { labour: "labor", honour: "honor", honoured: "honored", neighbour: "neighbor", favour: "favor", fulfil: "fulfill",
  lothe: "loathe", shew: "show", shewed: "showed", defence: "defense", brasen: "brazen", saviour: "savior" };
// CCEL tags a few promises with the wrong passage.
const REF_FIX = { "Exod.34.11": "Ezek.34.11" };

const kjv = new Map();
function chapterOf(usfm, ch) {
  if (!kjv.has(usfm)) kjv.set(usfm, JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/bibles/kjv/${usfm}.json`), "utf8")));
  return kjv.get(usfm)[ch] || [];
}
/** All scripRefs in a promise → one range { name, usfm, ch, v1, v2 }. */
function rangeOf(html) {
  const refs = [...html.matchAll(/osisRef="Bible:([^"]+)"/g)].map((m) => REF_FIX[m[1]] || m[1]);
  const tail = text(html.replace(/[\s\S]*<\/scripRef>/, "")).match(/\d+/g) || [];   // "Prov. 3: 25, 26"
  let bk, ch; const vs = [];
  for (const r of refs) for (const part of r.split("-")) {
    const [b, c, v] = part.split(".");
    bk ??= b; ch ??= c;
    if (b !== bk || c !== ch) throw new Error(`promise spans books or chapters: ${refs.join(" ")}`);
    if (v) vs.push(+v);
  }
  if (!vs.length) vs.push(...tail.map(Number));
  const [name, usfm] = BOOKS[bk] || [];
  if (!usfm || !vs.length) throw new Error(`cannot read reference ${refs.join(" ")} ${tail.join(",")}`);
  return { name, usfm, ch, v1: Math.min(...vs), v2: Math.max(...vs) };
}
const fold = (w) => { const x = w.toLowerCase().replace(/[^a-z]/g, ""); return FOLD[x] || x; };
/** KJV words with their spans, and the letters-only stream used to match a quote against them. */
function tokens(str) {
  const out = [];
  for (const m of str.matchAll(/\S+/g)) out.push({ s: m.index, e: m.index + m[0].length, f: fold(m[0]) });
  return out;
}
/** The KJV's own words for a quote, or null if the quote is not in the passage. */
function kjvWords(quote, passage) {
  const k = tokens(passage).filter((t) => t.f);
  const q = tokens(quote).map((t) => t.f).join("");
  if (!q) return null;
  const stream = k.map((t) => t.f).join("");
  const at = stream.indexOf(q);
  if (at < 0) return null;
  let pos = 0, i = -1, j = -1;
  k.forEach((t, n) => { if (pos === at) i = n; pos += t.f.length; if (pos === at + q.length) j = n; });
  if (i < 0 || j < 0) return null;                          // starts or ends mid-word
  let out = passage.slice(k[i].s, k[j].e);
  if (j === k.length - 1) out = passage.slice(k[i].s).trim(); // keep the verse's own closing stop
  return out.replace(/[,;:]$/, "");
}
const overlap = (a, b) => { const B = new Set(tokens(b).map((t) => t.f)); const A = tokens(a).map((t) => t.f).filter(Boolean); return A.filter((w) => B.has(w)).length / A.length; };

const days = {};
const problems = [];
const fallbacks = [];
// Split on each Date paragraph; a day runs until the next one (or the month's end).
const parts = xml.split(/<p class="Date"[^>]*>/).slice(1);
for (const part of parts) {
  const [dateRaw, rest] = [part.slice(0, part.indexOf("</p>")), part.slice(part.indexOf("</p>") + 4)];
  const m = text(dateRaw).match(/^([A-Za-z]+)\.? (\d+)$/);
  if (!m) continue;                                         // a stray empty Date paragraph
  const month = MONTHS[m[1]];
  if (!month) throw new Error(`unknown month ${m[1]}`);
  const body = rest.split(/<\/div1>|<h1\b/)[0];
  const title = text(body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] || "");
  const vq = body.match(/<p class="VerseQuote"[^>]*>([\s\S]*?)<\/p>/);
  if (!title || !vq) throw new Error(`${m[0]}: missing title or promise`);
  const quote = text(vq[1].replace(/<scripRef[\s\S]*/, "")).replace(/^["“']+|["”',.\s]+$/g, "");
  const r = rangeOf(vq[1]);
  const passage = chapterOf(r.usfm, r.ch).slice(r.v1 - 1, r.v2).join(" ");
  if (!passage) { problems.push(`${m[0]}: no KJV text for ${r.name} ${r.ch}:${r.v1}`); continue; }
  let promise = kjvWords(quote, passage);
  if (!promise) {
    if (overlap(quote, passage) < 0.6) problems.push(`${m[0]} ${r.name} ${r.ch}:${r.v1}\n   quote: ${quote}\n   KJV:   ${passage}`);
    fallbacks.push(`${m[0]} ${r.name} ${r.ch}:${r.v1}`);
    promise = passage;
  }
  promise = promise[0].toUpperCase() + promise.slice(1);
  const ref = `${r.name} ${r.ch}:${r.v1}${r.v2 !== r.v1 ? `–${r.v2}` : ""}`;
  const paras = [...body.matchAll(/<p(?![^>]*class=)[^>]*>([\s\S]*?)<\/p>/g)].map((p) => text(p[1])).filter(Boolean);
  const key = `${String(month).padStart(2, "0")}.${String(+m[2]).padStart(2, "0")}`;
  days[key] = `${titleCase(title)}\n\n“${promise}” — ${ref}\n\n${paras.join("\n\n")}`;
}
console.log(`${fallbacks.length} promises shown as the full KJV verse(s) because the quote was adapted: ${fallbacks.join("; ")}`);
if (problems.length) {
  console.error(`${problems.length} promise(s) look like the wrong passage:\n${problems.join("\n")}`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });
for (let mo = 1; mo <= 12; mo++) {
  const mm = String(mo).padStart(2, "0");
  const month = Object.fromEntries(Object.entries(days).filter(([k]) => k.startsWith(`${mm}.`)).sort());
  fs.writeFileSync(path.join(OUT, `${mm}.json`), JSON.stringify(month));
}
console.log(`${Object.keys(days).length} days written; every promise is the KJV text.`);
