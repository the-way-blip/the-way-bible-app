#!/usr/bin/env node
/**
 * Fetch The Army and Navy Hymnal (1920, public domain) from Wikisource into
 * ~/theway-hymns-cache/anh/: hymns.json maps each hymn page to its transcription
 * source { title, page, section }, and pages.json holds the raw wikitext and
 * proofreading level of every Page: it uses. Only the Hymns/ section is taken
 * (not Catholic/, Secular/ or Readings/). Rerunning reuses the cache.
 *
 *   node scripts/fetch-army-navy-hymnal.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DIR = path.join(os.homedir(), "theway-hymns-cache/anh");
const API = "https://en.wikisource.org/w/api.php";
const UA = { "User-Agent": "TheWayBibleApp-build/1.0 (https://thewaybible.app)" };
fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: UA }).catch(() => null);
    if (res?.ok) return res.json();
    await sleep(2000);
  }
  throw new Error(`Wikisource request failed: ${url}`);
}
const contentOf = (p) => p.revisions?.[0]?.slots?.main?.content ?? "";

// 1. Every page under Hymns/
const hymnsFile = path.join(DIR, "hymns.json");
let hymns = fs.existsSync(hymnsFile) ? JSON.parse(fs.readFileSync(hymnsFile, "utf8")) : null;
if (!hymns) {
  const titles = [];
  let cont = {};
  do {
    const r = await api({ action: "query", list: "allpages", apprefix: "The Army and Navy Hymnal/Hymns/", aplimit: "500", ...cont });
    titles.push(...r.query.allpages.map((p) => p.title));
    cont = r.continue || null;
  } while (cont);
  hymns = {};
  for (let i = 0; i < titles.length; i += 50) {
    const r = await api({ action: "query", titles: titles.slice(i, i + 50).join("|"), prop: "revisions", rvprop: "content", rvslots: "main" });
    for (const p of r.query.pages) {
      const m = contentOf(p).match(/<pages index="([^"]+)" from=(\d+) to=(\d+) onlysection=([^ />]+)/);
      if (m) hymns[p.title] = { index: m[1], from: +m[2], to: +m[3], section: m[4] };
      else hymns[p.title] = null;                              // a redirect or contents page
    }
    await sleep(500);
  }
  fs.writeFileSync(hymnsFile, JSON.stringify(hymns, null, 1));
}

// 2. The Page: transcriptions those hymns point at
const pagesFile = path.join(DIR, "pages.json");
const pages = fs.existsSync(pagesFile) ? JSON.parse(fs.readFileSync(pagesFile, "utf8")) : {};
const wanted = new Set();
for (const h of Object.values(hymns)) if (h) for (let n = h.from; n <= h.to; n++) wanted.add(`Page:${h.index}/${n}`);
const missing = [...wanted].filter((t) => !(t in pages));
for (let i = 0; i < missing.length; i += 50) {
  const r = await api({ action: "query", titles: missing.slice(i, i + 50).join("|"), prop: "revisions", rvprop: "content", rvslots: "main" });
  for (const p of r.query.pages) {
    const text = contentOf(p);
    pages[p.title] = { level: +(text.match(/pagequality level="(\d)"/)?.[1] ?? 0), text };
  }
  await sleep(500);
}
fs.writeFileSync(pagesFile, JSON.stringify(pages));
const found = Object.values(hymns).filter(Boolean).length;
const levels = {};
for (const p of Object.values(pages)) levels[p.level] = (levels[p.level] || 0) + 1;
console.log(`${found} hymn pages, ${Object.keys(pages).length} source pages; proofreading levels: ${JSON.stringify(levels)} (3 = proofread, 4 = validated)`);
