#!/usr/bin/env node
/**
 * Build public/data/hymns/hymns.json, the app's hymnal for reading, from two
 * public-domain sources:
 *
 *  1. The Army and Navy Hymnal (1920), Wikisource transcription
 *     (fetch-army-navy-hymnal.mjs → hymns-army-navy.mjs). Wikisource had only
 *     proofread 50 of its pages, so every hymn on an unproofread page was
 *     checked line by line against the page scans; the corrected texts are in
 *     ~/theway-hymns-cache/anh/proof/batch*.out.json and replace the raw ones.
 *  2. The Open Hymnal Project (hymns-open-hymnal.mjs), public-domain hymns only.
 *
 * Where a hymn is in both, the scan-checked 1920 text is kept (it has the
 * printed line breaks) and Open Hymnal's Scripture references are added.
 *
 * A second, independent scan check of every 1920 hymn found the first pass's
 * misses; those corrections live in scripts/hymn-fixes.json (number, where,
 * from → to, why) and are applied last, so they win over the automatic clean-up.
 *
 *   node scripts/fetch-army-navy-hymnal.mjs   # once; cached
 *   node scripts/build-hymns.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadArmyNavy } from "./hymns-army-navy.mjs";
import { loadOpenHymnal } from "./hymns-open-hymnal.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(os.homedir(), "theway-hymns-cache");
const OUT = path.join(ROOT, "public/data/hymns");

// Hymns left out: 233 loses words at a page turn in the scan; 242 is a sung Amen.
const DROP_ANH = new Set([233, 242]);
// Printer's slips in the 1920 book where the sense is certain.
const MISPRINTS = { 127: [["We ne'er can fill.", "We ne'er can fail."]] };
// Typing slips in Open Hymnal's texts (title → [from, to]); each checked against
// the hymn as written ("Thou hast", "Israel's", "receive").
const OH_FIXES = {
  "Crown Him With Many Crowns": [["For Thou has died for me", "For Thou hast died for me"]],
  "It Is Well With My Soul": [["Thou has taught me to say", "Thou hast taught me to say"]],
  "In Peace and Joy I Now Depart": [["Is rael's", "Israel's"]],
  "By Grace I'm Saved": [["His Word is truethen", "His Word is true, then"], ["oftimes", "ofttimes"]],
  "How Blest the Hearts": [["sufice", "suffice"]],
  "How Can I Keep from Singing?": [["faroff", "far-off"]],
  "Lo He Comes! Whom Every Nation": [["Disant climes", "Distant climes"]],
  "Now Sin, With Reign Unbroken": [["yeilding", "yielding"]],
  "O Holy Spirit, Enter In": [["recieve", "receive"]],
  "Sing My Tongue, The Glorious Battle": [["swad dling", "swaddling"]],
  "Evening and Morning": [["lifegiving", "life-giving"]],
  "God Rest Ye Merry Gentlemen": [["afeeding", "a-feeding"]],
};

// The 1920 transcription keeps the music's syllable breaks ("lib-er-ty",
// "Sav - iour"). Join them back into words, but keep real compounds
// ("heaven-born", "sin-sick") whose parts are each words.
const DICT = new Set((fs.existsSync("/usr/share/dict/words") ? fs.readFileSync("/usr/share/dict/words", "utf8") : "").toLowerCase().split("\n"));
const isWord = (w) => {
  const x = w.toLowerCase().replace(/[’']/g, "'").replace(/^'+|'+$/g, "");
  if (!x) return false;
  const base = x.replace(/'s$/, "").replace(/'/g, "");
  const forms = [x, base, ...["s", "es", "ed", "d", "eth", "est", "st", "ing", "ly", "er", "ness"].map((s) => base.endsWith(s) && base.slice(0, -s.length)),
    base.replace(/(eth|est|ed|ing)$/, "e"), base.replace(/ies$/, "y"), base.replace(/ied$/, "y")].filter(Boolean);
  return forms.some((f) => DICT.has(f));
};
function joinSyllables(line) {
  return line.replace(/[A-Za-zÀ-ÿ'’]+(?:\s?-\s?[A-Za-zÀ-ÿ'’]+)+/g, (m) => {
    const parts = m.split(/\s?-\s?/);
    const joined = parts.join("");
    if (/^re$/i.test(parts[0]) && /^e/i.test(parts[1] || "")) return parts.join("-");   // re-echo
    if (isWord(joined)) return joined;                                   // pas-tures, kind-ness, to-day
    const last = parts[parts.length - 1];
    // An elided word before a real one keeps its hyphen (heav'n-sent, o'er-take);
    // a syllable carrying the apostrophe joins (Je-sus', cre-a-tion's, wand-'ring).
    if (/['’]/.test(joined)) return /^['’]/.test(last) || !isWord(last) || last.length <= 2 ? joined : parts.join("-");
    if (parts.every((p) => p.length > 2 && isWord(p))) return parts.join("-"); // blood-bought, sin-sick
    return joined;                                                       // glo-ri-ous
  });
}

// Hymnal sections and Open Hymnal categories → the topics readers browse by.
const TOPICS = [
  ["Praise & Worship", /PRAISE|OPENING|TRINITY|DOXOLOGY|GOD OF LOVE|RESPONSES/],
  ["Christmas", /CHRISTMAS|ADVENT|EPIPHANY|NAT[I]?VITY/],
  ["The Cross", /LENT|GOOD FRIDAY|GOOD THURSDAY|PALM SUNDAY|MAN OF SORROWS|REDEEMER|JUSTIFICATION/],
  ["Easter", /EASTER|ASCENSION|TRANSFIGURATION/],
  ["The Holy Spirit", /PENTECOST|HOLY SPIRIT/],
  ["Invitation", /EVANGELISTIC|COMING TO CHRIST|CONFESSION/],
  ["Faith & Trust", /TRUST|FAITH|LIGHT AND GUIDANCE/],
  ["Comfort", /COMFORT|FUNERAL/],
  ["Consecration", /CONSECRATION|NEW OBEDIENCE|PURITY|LOVE AND LOYALTY|STEWARDSHIP|LIFE VICTORIOUS/],
  ["Christian Warfare", /CONFLICT|HEROISM/],
  ["Prayer", /PRAYER(?! AND D)/],
  ["Heaven", /HEAVEN|END TIMES/],
  ["The Church", /COMMUNION OF SAINTS|THE CHURCH|REFORMATION|BAPTISMAL|LORD'S SUPPER|CHRISTIAN HOME/],
  ["Missions & Service", /MISSIONS|HUMAN SERVICE/],
  ["The Word of God", /WORD OF GOD/],
  ["Morning & Evening", /MORNING|EVENING|CLOSING/],
  ["Thanksgiving", /THANKSGIVING/],
  ["Life of Christ", /LIFE AND MINISTRY/],
  ["Nation", /NATIONAL|PATRIOTISM|FREEDOM AND JUSTICE/],
];
const topicsFor = (heading) => TOPICS.filter(([, re]) => re.test(heading || "")).map(([t]) => t);

// Open Hymnal's Scripture abbreviations → the app's book names (Ez = Ezekiel 36–37 here).
const BOOK = { Gen: "Genesis", Ex: "Exodus", Lv: "Leviticus", Num: "Numbers", Deut: "Deuteronomy", Josh: "Joshua",
  "1Sam": "1 Samuel", "2Sam": "2 Samuel", "1Kgs": "1 Kings", "1Chr": "1 Chronicles", Job: "Job", Ps: "Psalms", PS: "Psalms",
  Pr: "Proverbs", So: "Song of Solomon", Is: "Isaiah", Jer: "Jeremiah", Lam: "Lamentations", Ez: "Ezekiel", Dan: "Daniel",
  Hos: "Hosea", Mic: "Micah", Hab: "Habakkuk", Zeph: "Zephaniah", Zech: "Zechariah", Mal: "Malachi", Mt: "Matthew",
  Mk: "Mark", Lk: "Luke", Jn: "John", Acts: "Acts", Rom: "Romans", "1Cor": "1 Corinthians", "2Cor": "2 Corinthians",
  Gal: "Galatians", Eph: "Ephesians", Phil: "Philippians", Col: "Colossians", "1Thess": "1 Thessalonians", "1Th": "1 Thessalonians",
  "2Thess": "2 Thessalonians", "1Tim": "1 Timothy", "2Tim": "2 Timothy", Titus: "Titus", Heb: "Hebrews", Jas: "James",
  "1Pt": "1 Peter", "2Pt": "2 Peter", "1Jn": "1 John", "2Jn": "2 John", Jude: "Jude", Rev: "Revelation" };
const USFM = { Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU", Joshua: "JOS", "1 Samuel": "1SA",
  "2 Samuel": "2SA", "1 Kings": "1KI", "1 Chronicles": "1CH", Job: "JOB", Psalms: "PSA", Proverbs: "PRO", "Song of Solomon": "SNG",
  Isaiah: "ISA", Jeremiah: "JER", Lamentations: "LAM", Ezekiel: "EZK", Daniel: "DAN", Hosea: "HOS", Micah: "MIC", Habakkuk: "HAB",
  Zephaniah: "ZEP", Zechariah: "ZEC", Malachi: "MAL", Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT",
  Romans: "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", Galatians: "GAL", Ephesians: "EPH", Philippians: "PHP",
  Colossians: "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI", Titus: "TIT",
  Hebrews: "HEB", James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", Jude: "JUD", Revelation: "REV" };
const COUNTS = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/verseCounts.json"), "utf8"));
const badRefs = [];
/**
 * "Jn 14:27-28" → "John 14:27–28". A reference without a book ("Ps 46:1, 73:23")
 * continues the previous one's book; "Rev 4-6" is a chapter range; a verse part
 * ("5:7b") is dropped. Returns null (and logs) when the passage doesn't exist.
 */
function fullRefs(list, title) {
  let book = null;
  return list.map((r) => {
    const m = r.trim().replace(/(\d)[ab]\b/g, "$1").match(/^(?:(\d?\s?[A-Za-z]+)\s+)?(\d+)(?:-(\d+)(?!:))?(?::(\d+)(?:-(\d+))?)?$/);
    if (m?.[1]) book = BOOK[m[1].replace(/\s/g, "")] || null;
    const counts = book && COUNTS[USFM[book]];
    const [, , ch, chEnd, v1, v2] = m || [];
    const ok = counts && counts[ch - 1] && (!chEnd || counts[chEnd - 1]) && (!v1 || +v1 <= counts[ch - 1]) && (!v2 || +v2 <= counts[ch - 1]);
    if (!ok) { badRefs.push(`${title}: ${r}`); return null; }
    return `${book} ${ch}${chEnd ? `–${chEnd}` : ""}${v1 ? `:${v1}` : ""}${v2 ? `–${v2}` : ""}`;
  }).filter(Boolean);
}

const key = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const tidy = (l) => l.replace(/\s*\(REPEAT\)\s*/gi, " ").replace(/\s*--\s*/g, "—").replace(/\s{2,}/g, " ").trim();

// Second-pass corrections from the scans: { number, where: "v3 l1" | "refrain l2" | field | "restructure", from, to }.
const FIXES = fs.existsSync(path.join(ROOT, "scripts/hymn-fixes.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/hymn-fixes.json"), "utf8")) : [];
const fixMisses = [];
function applyFixes(h) {
  for (const f of FIXES.filter((x) => x.number === h.number)) {
    if (f.where === "restructure") { h.verses = f.verses; h.refrain = f.refrain ?? h.refrain; continue; }
    const m = f.where.match(/^(?:v(\d+)|refrain) l(\d+)$/);
    if (m) {
      const lines = m[1] ? h.verses[m[1] - 1] : h.refrain;
      const i = +m[2] - 1;
      if (lines?.[i] === f.from) lines[i] = f.to;
      else if (lines?.[i] !== f.to) fixMisses.push(`#${h.number} ${f.where}: "${f.from}" (now "${lines?.[i]}")`);
    } else if (["title", "author", "year", "translator"].includes(f.where)) {
      if ((h[f.where] ?? "") === (f.from ?? "")) h[f.where] = f.to;
      else if ((h[f.where] ?? "") !== (f.to ?? "")) fixMisses.push(`#${h.number} ${f.where}: "${f.from}" (now "${h[f.where]}")`);
    } else fixMisses.push(`#${h.number}: unknown place "${f.where}"`);
  }
}

// ── 1. Army and Navy Hymnal, with the scan-checked corrections ───────────────
const proofed = new Map();
for (const f of fs.readdirSync(path.join(CACHE, "anh/proof")).filter((f) => /^batch\d+\.out\.json$/.test(f))) {
  for (const h of JSON.parse(fs.readFileSync(path.join(CACHE, "anh/proof", f), "utf8"))) proofed.set(h.number, h);
}
const pages = JSON.parse(fs.readFileSync(path.join(CACHE, "anh/pages.json"), "utf8"));
const headingOf = (n) => {
  const t = pages[`Page:The Army and Navy Hymnal.djvu/${n}`]?.text || "";
  return (t.match(/<noinclude>[\s\S]*?(?:\{\{right\|([^}]*)\}\}|\/>\s*([A-Z][A-Z ,'&-]{3,}))/)?.slice(1).find(Boolean) || "").trim();
};
const anh = [];
let unchecked = 0;
for (const raw of loadArmyNavy()) {
  if (DROP_ANH.has(raw.number)) continue;
  const p = proofed.get(raw.number);
  if (!p && raw.level < 3) { unchecked++; continue; }        // never publish an unproofread page
  const h = p ? { ...raw, title: p.title, author: p.author, year: p.year, translator: p.translator, verses: p.verses, refrain: p.refrain } : raw;
  for (const [from, to] of MISPRINTS[raw.number] || []) h.verses = h.verses.map((v) => v.map((l) => l.replace(from, to)));
  h.verses = h.verses.map((v) => v.map((l) => joinSyllables(tidy(l)))).filter((v) => v.length);
  if (h.refrain) h.refrain = h.refrain.map((l) => joinSyllables(tidy(l)));
  applyFixes(h);
  h.verses = h.verses.map((v) => v.map((l) => l.replace(/\s*--\s*/g, "—")));
  if (h.refrain) h.refrain = h.refrain.map((l) => l.replace(/\s*--\s*/g, "—"));
  if (!h.verses.length || !h.title) continue;
  anh.push({ ...h, topics: topicsFor(headingOf(raw.pages[0])) });
}

// ── 2. Open Hymnal ──────────────────────────────────────────────────────────
const oh = loadOpenHymnal();
const catOf = (file) => fs.readFileSync(path.join(CACHE, "abc", file), "latin1").match(/^%OHCATEGORY\s*(.*)$/m)?.[1].trim() || "";

// ── 3. Merge ────────────────────────────────────────────────────────────────
const byKey = new Map();
const add = (h) => {
  const k1 = key(h.verses[0][0]), k2 = key(h.title);
  const hit = byKey.get(k1) || byKey.get(k2);
  if (hit) return hit;
  byKey.set(k1, h); byKey.set(k2, h);
  return null;
};
const all = [];
for (const h of anh) {
  add(h);
  all.push({
    title: h.title, author: h.author, year: h.year, translator: h.translator || null, tune: h.tune, meter: h.meter,
    verses: h.verses, refrain: h.refrain || null, topics: h.topics, scripture: [],
    source: { name: "The Army and Navy Hymnal (1920)", number: h.number, url: `https://en.wikisource.org/wiki/Page:The_Army_and_Navy_Hymnal.djvu/${h.pages[0]}` },
  });
}
let merged = 0;
for (const h of oh.hymns) {
  for (const [from, to] of OH_FIXES[h.title] || []) {
    const fix = (l) => l.replace(from, to);
    if (!h.verses.flat().concat(h.refrain || []).some((l) => l.includes(from))) throw new Error(`OH fix not found in ${h.title}: ${from}`);
    h.verses = h.verses.map((v) => v.map(fix));
    if (h.refrain) h.refrain = h.refrain.map(fix);
  }
  h.verses = h.verses.map((v) => v.map(joinSyllables));
  if (h.refrain) h.refrain = h.refrain.map(joinSyllables);
  const scripture = h.scripture ? fullRefs(h.scripture.split(/[,;]\s*/).filter(Boolean), h.title) : [];
  const dup = add(h);
  if (dup) {
    const rec = all.find((r) => r.source.number === dup.number);
    if (rec) { rec.scripture = scripture; rec.topics = [...new Set([...rec.topics, ...topicsFor(catOf(h.file))])]; }
    merged++;
    continue;
  }
  all.push({
    title: h.title, author: h.author, year: h.year, translator: h.translator, tune: h.tune, meter: h.meter,
    verses: h.verses, refrain: h.refrain, topics: topicsFor(catOf(h.file)), scripture,
    source: { name: "The Open Hymnal Project", url: `http://openhymnal.org/Lyrics/${h.file.replace(/\.abc$/, ".html")}` },
  });
}

all.sort((a, b) => a.title.replace(/^['"‘’“”]/, "").localeCompare(b.title.replace(/^['"‘’“”]/, "")));
const ids = new Set();
for (const h of all) {
  let id = slug(h.title) || "hymn";
  for (let n = 2; ids.has(id); n++) id = `${slug(h.title)}-${n}`;
  ids.add(id);
  h.id = id;
  h.firstLine = h.verses[0][0].replace(/[,;:.!?—-]+$/, "");
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "hymns.json"), JSON.stringify(all.map(({ id, ...h }) => ({ id, ...h }))));
const topicCounts = {};
for (const h of all) for (const t of h.topics) topicCounts[t] = (topicCounts[t] || 0) + 1;
console.log(`${all.length} hymns (${anh.length} from the 1920 hymnal, ${all.length - anh.length} from Open Hymnal; ${merged} duplicates merged; ${unchecked} unchecked pages skipped)`);
console.log("topics:", JSON.stringify(topicCounts));
if (fixMisses.length) { console.error(`${fixMisses.length} scan corrections no longer match:\n  ${fixMisses.join("\n  ")}`); process.exit(1); }
if (badRefs.length) console.log(`dropped ${badRefs.length} Scripture refs that don't exist:`, badRefs.join("; "));
console.log("no topic:", all.filter((h) => !h.topics.length).length, "| no author:", all.filter((h) => !h.author).length);

export { joinSyllables };
