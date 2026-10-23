/**
 * Parse the Open Hymnal Project (openhymnal.org) files cached in
 * ~/theway-hymns-cache/{abc,lyrics} into hymn records like hymns-army-navy.mjs.
 *
 * The lyrics pages run each verse together as one paragraph, so lines are
 * rebuilt from the hymn's meter (%OHMETRICAL, syllables per line) using the
 * syllable breaks in the ABC lyric lines ("Bless- èd a- ssu- rance"). A verse
 * that will not divide exactly by the meter keeps the punctuation-based split.
 * A split whose lines all start with a capital (as the source's lines do) is
 * preferred over one that merely fits the syllable counts.
 * Lines shared by the end of every verse become the refrain, shown once.
 *
 * Only hymns whose ABC says "public domain" are kept, and none that credit a
 * writer or translator born in 1900 or later (their wording may still be in
 * copyright even where the project marks the hymn free to use).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DIR = path.join(os.homedir(), "theway-hymns-cache");
const norm = (w) => w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "");

/** Rough English syllable count, for words the ABC files never syllabify. */
function guessSyllables(word) {
  const w = norm(word).replace(/'/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** word → syllable counts seen in every ABC lyric line, most common first. */
function syllableDictionary(files) {
  const dict = new Map();
  for (const f of files) {
    const t = fs.readFileSync(path.join(DIR, "abc", f), "latin1");
    for (const line of t.split(/\r?\n/).filter((l) => l.startsWith("w:"))) {
      const body = line.slice(2).replace(/^\s*\d+\.~?/, "").replace(/[*_|]/g, " ").replace(/~/g, " ");
      // "Bless- èd a- ssu- rance," → words are runs of tokens joined by trailing "-"
      let word = "", count = 0;
      for (const tok of body.split(/\s+/).filter(Boolean)) {
        word += tok.replace(/-$/, ""); count++;
        if (!tok.endsWith("-")) {
          const k = norm(word);
          if (k) { const c = dict.get(k) || {}; c[count] = (c[count] || 0) + 1; dict.set(k, c); }
          word = ""; count = 0;
        }
      }
    }
  }
  return new Map([...dict].map(([k, c]) => [k, Object.entries(c).sort((a, b) => b[1] - a[1]).map(([n]) => +n)]));
}

/**
 * Split a verse's words into lines of the given syllable counts, or null if
 * they don't fit exactly. Words can be sung more than one way ("heaven",
 * "power", "every"), so each word offers its observed counts, most common
 * first, and the split backtracks until every line is exact.
 */
function byMeter(words, meter, options, strict = true) {
  const opts = words.map(options);
  const total = meter.reduce((a, b) => a + b, 0);
  const minLeft = []; for (let i = words.length - 1, m = 0; i >= -1; i--) { minLeft[i + 1] = m; if (i >= 0) m += Math.min(...opts[i]); }
  const breaks = [];
  const seen = new Set();
  function go(i, line, n, used) {
    if (line === meter.length) return i === words.length;
    if (i === words.length || used + minLeft[i] > total) return false;
    const key = `${i},${line},${n}`;
    if (seen.has(key)) return false;
    for (const c of opts[i]) {
      const m = n + c;
      if (m > meter[line]) continue;
      if (m === meter[line]) {
        // Every line of the source starts with a capital, so a break must land before one.
        if (strict && i + 1 < words.length && !/^["'‘“(]*[A-ZÀ-Ý]/.test(words[i + 1])) continue;
        breaks.push(i + 1); if (go(i + 1, line + 1, 0, used + c)) return true; breaks.pop();
      }
      else if (go(i + 1, line, m, used + c)) return true;
    }
    seen.add(key);
    return false;
  }
  if (!go(0, 0, 0, 0)) return null;
  let start = 0;
  return breaks.map((b) => { const l = words.slice(start, b).join(" "); start = b; return l; });
}

/** Fallback: break after , ; : . ! ? when the next word is capitalized (hymn lines start with a capital). */
function byPunctuation(text) {
  return text.split(/(?<=[,;:.!?])\s+(?=[A-Z"'‘“(])/).reduce((out, part) => {
    // Re-join tiny fragments ("O Lord," "Amen") onto the line before.
    if (out.length && part.split(/\s+/).length < 3) out[out.length - 1] += ` ${part}`;
    else out.push(part);
    return out;
  }, []);
}

const years = (s) => [...String(s).matchAll(/\((\d{3,4})\s*-\s*(\d{4})?\)/g)].map((m) => +m[1]);

export function loadOpenHymnal() {
  const files = fs.readdirSync(path.join(DIR, "abc")).filter((f) => f.endsWith(".abc"));
  const dict = syllableDictionary(files);
  const options = (w) => { const g = guessSyllables(w); const o = dict.get(norm(w)) || [g, g + 1, g - 1].filter((x) => x > 0); return o; };
  const out = [], skipped = [];
  let metered = 0, fallback = 0;
  for (const f of files) {
    const abc = fs.readFileSync(path.join(DIR, "abc", f), "latin1").replace(/\r/g, "");
    const meta = (k) => abc.match(new RegExp(`^%${k}\\s*(.*)$`, "m"))?.[1].trim() || "";
    const credits = abc.match(/^C:.*$/gm)?.join(" ") || "";
    const author = meta("OHAUTHOR"), translator = meta("OHTRANSLATOR");
    if (!/public domain/i.test(credits)) { skipped.push(`${f}: not public domain`); continue; }
    if ([...years(author), ...years(translator)].some((y) => y >= 1900)) { skipped.push(`${f}: modern contributor (${author}; ${translator})`); continue; }

    const htmlFile = path.join(DIR, "lyrics", f.replace(/\.abc$/, ".html"));
    if (!fs.existsSync(htmlFile)) { skipped.push(`${f}: no lyrics page`); continue; }
    const html = fs.readFileSync(htmlFile, "utf8");
    const title = (abc.match(/^T:\s*(.*)$/m)?.[1] || "").trim();
    const paras = [...html.matchAll(/<p>\s*([\s\S]*?)\s*<\/p>/g)].map((m) => m[1])
      .filter((p) => /^\d+\.\s/.test(p.trim()))
      .map((p) => p.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "’").replace(/&lsquo;/g, "‘").replace(/\s+/g, " ").replace(/^\d+\.\s*/, "").trim());
    if (!paras.length) { skipped.push(`${f}: no verses`); continue; }

    const meter = meta("OHMETRICAL").split(/\s+/).map(Number).filter(Boolean);
    let verses = paras.map((p) => {
      const w = p.split(" ");
      const lines = meter.length ? byMeter(w, meter, options) || byMeter(w, meter, options, false) : null;
      if (lines) metered++; else fallback++;
      return lines || byPunctuation(p);
    });

    // Lines every verse ends with (verse count > 1) are the refrain.
    let refrain = null;
    if (verses.length > 1) {
      let k = 0;
      const last = (v, i) => v[v.length - 1 - i];
      while (k < Math.min(...verses.map((v) => v.length)) - 1 && verses.every((v) => last(v, k) === last(verses[0], k))) k++;
      if (k > 0) {
        refrain = verses[0].slice(-k);
        verses = verses.map((v) => v.slice(0, -k));
      }
    }
    // "Spafford, Horatio Gates (1828-1888)" → "Horatio Gates Spafford"; several writers are ";"-separated.
    const person = (s) => s.split(";").map((x) => x.replace(/\s*\(.*$/, "").trim()).filter((x) => x && !/^(none|unknown|anonymous)$/i.test(x))
      .map((x) => (/,/.test(x) ? x.split(",").reverse().map((y) => y.trim()).join(" ") : x)).join(" and ");
    const wordsYear = credits.match(/Words:[^]*?\b((?:c\.\s*)?1[0-9]{3})\b/i)?.[1] || "";
    out.push({
      source: "openhymnal", file: f, title,
      author: person(author),
      year: wordsYear,
      translator: person(translator) || null,
      tune: (f.replace(/\.abc$/, "").split("-")[1] || "").replace(/_/g, " "),
      meter: meter.join(" "),
      scripture: meta("OHSCRIP"),
      topics: [...meta("OHTOPICS").matchAll(/\{([^}[(]+)/g)].map((m) => m[1].trim()),
      verses, refrain,
    });
  }
  return { hymns: out, skipped, metered, fallback };
}
