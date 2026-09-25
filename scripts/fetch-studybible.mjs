// Polite resumable downloader for studybible.info pre-KJV Bibles → raw verse JSON per chapter
import fs from "fs";
const SC = process.argv[2];
const { usfm, counts } = JSON.parse(fs.readFileSync(`${SC}/sword/kjv-meta.json`, "utf8"));
const VERSIONS = ["Bishops", "Coverdale", "Great", "Matthew"];
const jobs = [];
for (const v of VERSIONS) for (const [book, chs] of Object.entries(counts)) for (const ch of Object.keys(chs)) jobs.push({ v, book, ch });
const out = (j) => `${SC}/sb/raw/${j.v}/${usfm[j.book]}/${j.ch}.json`;
const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();
function parse(html, v) {
  const re = new RegExp(`<sup><a class="verse_ref ${v}"[^>]*>(\\d+)</a></sup>`, "g");
  const marks = [...html.matchAll(re)];
  const verses = {};
  marks.forEach((m, i) => {
    let end = i + 1 < marks.length ? marks[i + 1].index : html.indexOf("</div>", m.index);
    verses[m[1]] = decode(html.slice(m.index + m[0].length, end));
  });
  return verses;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let done = 0, fetched = 0, failed = [];
async function worker() {
  while (jobs.length) {
    const j = jobs.shift();
    const f = out(j);
    if (fs.existsSync(f)) { done++; continue; }
    const url = `https://www.studybible.info/${j.v}/${encodeURIComponent(`${j.book} ${j.ch}`)}`;
    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        const r = await fetch(url, { headers: { "User-Agent": "TheWayBibleApp/1.0 (thewaybible.app; one-time import)" } });
        if (r.status === 429 || r.status >= 500) { await sleep(5000 * (attempt + 1)); continue; }
        const verses = parse(await r.text(), j.v);
        fs.mkdirSync(f.replace(/\/[^/]+$/, ""), { recursive: true });
        fs.writeFileSync(f, JSON.stringify(verses));
        ok = true; fetched++;
      } catch { await sleep(3000); }
    }
    if (!ok) failed.push(`${j.v} ${j.book} ${j.ch}`);
    done++;
    if (done % 100 === 0) console.log(new Date().toISOString().slice(11, 19), `${done} done, ${fetched} fetched, ${failed.length} failed`);
    await sleep(400);
  }
}
const total = jobs.length;
console.log("jobs", total);
await Promise.all([worker(), worker()]);
console.log("FINISHED", done, "fetched", fetched, "failed", failed.length, failed.slice(0, 20));
