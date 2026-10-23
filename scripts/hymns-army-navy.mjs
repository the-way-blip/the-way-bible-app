/**
 * Parse the Army and Navy Hymnal (1920) Wikisource transcriptions cached by
 * fetch-army-navy-hymnal.mjs into hymn records:
 *   { source: "anh", number, title, author, authorYears, year, translator, tune,
 *     meter, verses: [[line, ...], ...], refrain: [line, ...] | null, pages, level }
 * `level` is the lowest Wikisource proofreading level of the pages it sits on
 * (2 = transcribed only, 3 = proofread, 4 = validated).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DIR = path.join(os.homedir(), "theway-hymns-cache/anh");

// Expand the handful of templates the transcribers used to plain text.
function plain(s) {
  let t = s;
  for (let i = 0; i < 4; i++) {
    t = t
      .replace(/\{\{(?:sc|Sc|smaller|Smaller|normal|nop|center|left|float right|right)\|([^{}]*)\}\}/g, "$1")
      .replace(/\{\{(?:gap|nop|clear|rh|missing score|block center\/[se])[^{}]*\}\}/g, "")
      .replace(/\{\{!\}\}/g, "|")
      .replace(/\{\{c\|[^{}]*\}\}/g, "");
  }
  return t
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'{2,3}/g, "")
    .replace(/<\/?br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ");
}

/** Split at top-level "|" (not inside nested {{ }}). */
function splitTop(s) {
  const out = [];
  let depth = 0, cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s.startsWith("{{", i)) { depth++; cur += "{{"; i++; continue; }
    if (s.startsWith("}}", i)) { depth--; cur += "}}"; i++; continue; }
    if (s[i] === "|" && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += s[i];
  }
  out.push(cur);
  return out;
}

/** The body of the first {{name|...}} in s, braces balanced. */
function templateBody(s, name) {
  const at = s.search(new RegExp(`\\{\\{\\s*${name}\\s*\\|`, "i"));
  if (at < 0) return null;
  let depth = 0;
  for (let i = at; i < s.length; i++) {
    if (s.startsWith("{{", i)) { depth++; i++; continue; }
    if (s.startsWith("}}", i)) { depth--; i++; if (depth === 0) return s.slice(s.indexOf("|", at) + 1, i - 1); }
  }
  return null;
}

const cleanLine = (l) => plain(l)
  .replace(/\(\s*Last verse:?\s*Amen\.?\s*\)/i, "")
  .replace(/\s*\bA-?\s?men\.?\s*$/i, "")
  .replace(/(\w) - (\w)/g, "$1$2")                       // "Be - fore" → "Before"
  .replace(/\s+([,;:.!?])/g, "$1")
  .trim();

function parseSection(text, number, pages, level) {
  const header = templateBody(text, "hymn/header") || "";
  const f = {};
  for (const part of splitTop(header)) {
    const m = part.match(/^\s*(\w+)\s*=([\s\S]*)$/);
    if (m) f[m[1].toLowerCase()] = plain(m[2]).replace(/\s+/g, " ").trim();
  }
  // The first pages carry a LilyPond score instead: title, "(TUNE. meter)" and
  // poet = "Name, year" sit in its \header.
  const lily = text.match(/\\header\s*\{([\s\S]*?)\}\s*\n/)?.[1];
  if (lily && !f.title) {
    const titles = [...(lily.match(/title\s*=\s*\\markup\s*\{([^}]*)\}/)?.[1] || "").matchAll(/"([^"]*)"/g)].map((m) => m[1].trim()).filter(Boolean);
    // The number and the title come in either order.
    f.title = titles.find((t) => !/^\d+$/.test(t)) || "";
    f.number = titles.find((t) => /^\d+$/.test(t)) || f.number;
    const sub = lily.match(/subsubtitle\s*=\s*"\(([^".]*)\.?\s*([^"]*)\)"/);
    if (sub) { f.tune = sub[1]; f.meter = sub[2]; }
    f.lyricist = lily.match(/poet\s*=\s*"([^"]*)"/)?.[1] || "";
  }
  // Lyricist is either "Name, 1820-1915" in one field or first/last/year fields.
  let author = f.lyricist || [f.lfn, f.lln].filter(Boolean).join(" ") || [f.afn, f.aln].filter(Boolean).join(" ") || "";
  let year = f.lyear || "";
  const ym = author.match(/,?\s*(?:Arr\.?\s*)?((?:c\.\s*)?\d{4}(?:\s*-\s*\d{4})?)\s*$/);
  if (ym) { year ||= ym[1]; author = author.slice(0, ym.index).trim(); }
  const translator = [f.tfn, f.tln].filter(Boolean).join(" ") || null;

  const body = templateBody(text, "hymn/verses");
  const rawVerses = body ? splitTop(body) : [text.replace(/\{\{hymn\/header[\s\S]*?\}\}\s*/i, "").replace(/<\/?poem>/g, "")];
  let refrain = null;
  const verses = [];
  for (const raw of rawVerses) {
    const lines = raw.replace(/<\/?poem>/g, "").split("\n").map(cleanLine);
    const r = lines.findIndex((l) => /^(Refrain|Chorus)\.?$/i.test(l));
    const own = (r >= 0 ? lines.slice(0, r) : lines).filter(Boolean);
    if (r >= 0 && !refrain) {
      const rest = lines.slice(r + 1).filter(Boolean);
      if (rest.length) refrain = rest;
    }
    if (own.length) verses.push(own);
  }
  return {
    source: "anh", number: +(f.number || number), title: f.title || "", author, year,
    translator, tune: (f.tune || "").replace(/\.$/, ""), meter: (f.meter || "").replace(/\.$/, ""),
    verses, refrain, pages, level,
  };
}

export function loadArmyNavy() {
  const hymns = JSON.parse(fs.readFileSync(path.join(DIR, "hymns.json"), "utf8"));
  const pages = JSON.parse(fs.readFileSync(path.join(DIR, "pages.json"), "utf8"));
  const seen = new Set();
  const out = [];
  for (const h of Object.values(hymns)) {
    if (!h || seen.has(h.section)) continue;
    seen.add(h.section);
    let text = "", level = 4;
    const nums = [];
    for (let n = h.from; n <= h.to; n++) {
      const p = pages[`Page:${h.index}/${n}`];
      if (!p) continue;
      const m = p.text.match(new RegExp(`<section begin="?${h.section}"?\\s*/>([\\s\\S]*?)(?:<section end="?${h.section}"?\\s*/>|$)`));
      if (!m) continue;
      text += m[1].replace(/<noinclude>[\s\S]*?<\/noinclude>/g, "") + "\n";
      level = Math.min(level, p.level);
      nums.push(n);
    }
    if (!text.trim()) continue;
    out.push(parseSection(text, h.section.replace(/\D/g, ""), nums, level));
  }
  return out.sort((a, b) => a.number - b.number);
}
