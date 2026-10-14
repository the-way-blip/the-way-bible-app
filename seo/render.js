/**
 * seo/render.js — server-rendered, indexable Bible pages for thewaybible.app
 *
 * Routes (see vercel.json rewrites → /api/bible-page):
 *   /bible                         index of all 66 books
 *   /bible/<book>                  book page (chapter grid, popular verses)
 *   /bible/<book>/<chapter>        full chapter, every verse number links to its verse page
 *   /bible/<book>/<chapter>/<v>    single verse (or range 16-18): text, context, cross refs, key words
 *   /verses-about                  topic index
 *   /verses-about/<topic>          all verses for a topic, in full
 *   /sitemap.xml, /sitemaps/*.xml  sitemap index + per-book verse sitemaps
 *
 * Everything is KJV (public domain). Verse text is never altered. Strong's key
 * words, Psalm superscriptions and cross references come from seo/data/*.json
 * (built by seo/build-data.mjs).
 *
 * Pure functions: render(query) → { status, headers, body }.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOPICS, TOPIC_BY_SLUG } from "./topics.js";
import { votdRef } from "./votd.js";
import { BOOK_INTROS } from "./books-intro.js";
import { VERSE_MEANINGS } from "./meanings.js";
import { TOPIC_INTROS } from "./topic-intros.js";
import { TOPIC_LISTS } from "./topic-lists.js";
import { NAMES } from "./names.js";
import { inviteHtml, inviteJs, INVITE_CSS } from "./invite.js";
import { KJV_FACTS, KJV_SECTIONS, KJV_FAQ } from "./kjv-story.js";
import { WORDS } from "./words-archaic.js";
import { CHURCHES as DIRECTORY, CHURCH_BY_SLUG, churchesByState } from "./churches.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const SITE = "https://thewaybible.app";
const SITE_NAME = "TheWay Bible";
const VERSION = "KJV";
const VERSION_LONG = "King James Version";
const GA_ID = "G-H116EGYPXS"; // same GA4 property as the app (index.html)
// iOS app push. Fill these in once the app is live on the App Store:
//  - APP_STORE_URL: where every "Get the iOS app" CTA points (falls back to the homepage until then)
//  - APP_STORE_ID: numeric Apple ID → enables Safari's native Smart App Banner (<meta name="apple-itunes-app">)
const APP_STORE_URL = "https://apps.apple.com/us/app/read-the-bible-follow-jesus/id6762105782";
const APP_STORE_ID = "6762105782";
const appHref = () => APP_STORE_URL || "/";

/* ------------------------------------------------------------------ data */
let _books, _xrefs, _lex, _words, _titles, _bySlug, _byName, _verseTopics, _commentary, _strongs, _archaic;
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(DIR, "data", f), "utf8"));

export function books() {
  if (!_books) {
    _books = readJson("kjv.json").books;
    _books.forEach((b, i) => (b.index = i));
  }
  return _books;
}
const xrefs = () => (_xrefs ??= readJson("xrefs.json"));
const lexicon = () => (_lex ??= readJson("lexicon.json"));
const wordsIndex = () => (_words ??= readJson("words.json"));
const titlesIndex = () => (_titles ??= readJson("titles.json"));
const strongsIndex = () => (_strongs ??= readJson("strongs.json"));
const archaicIndex = () => (_archaic ??= readJson("archaic.json"));
function commentaryIndex() {
  if (!_commentary) {
    try { _commentary = readJson("commentary.json"); }
    catch { _commentary = {}; }
  }
  return _commentary;
}
/** Matthew Henry excerpt covering a verse key ("Jhn|3|16"), if any: { excerpt, range }. */
function commentaryFor(key) {
  return commentaryIndex()[key] || null;
}

let _meanings;
/** Our own "what this verse means" paragraph for an exact reference, if we have written one. */
function meaningFor(b, c, from, to) {
  if (!_meanings) {
    _meanings = new Map();
    for (const [ref, text] of Object.entries(VERSE_MEANINGS)) {
      const r = parseRef(ref);
      if (r) _meanings.set(`${r.book.abbr}|${r.chapter}|${r.from}|${r.to}`, text);
    }
  }
  return _meanings.get(`${b.abbr}|${c}|${from}|${to}`) || null;
}

const SLUG_ALIASES = {
  psalm: "psalms", "song-of-songs": "song-of-solomon", songs: "song-of-solomon", canticles: "song-of-solomon",
  revelations: "revelation", "the-revelation": "revelation",
  // common abbreviations typed into the search box
  gen: "genesis", ex: "exodus", exod: "exodus", lev: "leviticus", num: "numbers", deut: "deuteronomy", dt: "deuteronomy", josh: "joshua", judg: "judges", jdg: "judges",
  "1-sam": "1-samuel", "2-sam": "2-samuel", "1-kgs": "1-kings", "2-kgs": "2-kings", "1-chr": "1-chronicles", "2-chr": "2-chronicles", neh: "nehemiah", est: "esther",
  ps: "psalms", psa: "psalms", pss: "psalms", prov: "proverbs", pr: "proverbs", eccl: "ecclesiastes", ecc: "ecclesiastes", song: "song-of-solomon", sos: "song-of-solomon",
  isa: "isaiah", jer: "jeremiah", lam: "lamentations", ezek: "ezekiel", dan: "daniel", hos: "hosea", mic: "micah", hab: "habakkuk", zeph: "zephaniah", zech: "zechariah", mal: "malachi",
  matt: "matthew", mt: "matthew", mk: "mark", mrk: "mark", lk: "luke", jn: "john", jhn: "john", rom: "romans", "1-cor": "1-corinthians", "2-cor": "2-corinthians", gal: "galatians",
  eph: "ephesians", phil: "philippians", php: "philippians", col: "colossians", "1-thess": "1-thessalonians", "2-thess": "2-thessalonians", "1-tim": "1-timothy", "2-tim": "2-timothy",
  tit: "titus", phlm: "philemon", heb: "hebrews", jas: "james", "1-pet": "1-peter", "2-pet": "2-peter", "1-jn": "1-john", "2-jn": "2-john", "3-jn": "3-john", rev: "revelation",
};
function bySlug() {
  if (!_bySlug) {
    _bySlug = new Map();
    for (const b of books()) {
      _bySlug.set(b.slug, b);
      _bySlug.set(b.slug.replace(/-/g, ""), b);   // 1john
      _bySlug.set(b.abbr.toLowerCase(), b);        // jhn, 1jo
    }
    for (const [a, s] of Object.entries(SLUG_ALIASES)) _bySlug.set(a, _bySlug.get(s));
  }
  return _bySlug;
}
export function findBook(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase().replace(/%20|\s+|_/g, "-");
  return bySlug().get(s) || null;
}
function byName() {
  if (!_byName) {
    _byName = new Map();
    for (const b of books()) _byName.set(b.name.toLowerCase(), b);
    _byName.set("psalm", _byName.get("psalms"));
    _byName.set("song of songs", _byName.get("song of solomon"));
  }
  return _byName;
}

/** "1 John 4:9-10" → { book, chapter, from, to } or null (only if it resolves) */
export function parseRef(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(String(ref).trim());
  if (!m) return null;
  const book = byName().get(m[1].toLowerCase());
  if (!book) return null;
  const chapter = +m[2], from = +m[3], to = m[4] ? +m[4] : from;
  const ch = book.chapters[chapter - 1];
  if (!ch || from < 1 || to < from || to > ch.length) return null;
  return { book, chapter, from, to };
}

function verseTopics() {
  if (!_verseTopics) {
    _verseTopics = new Map();
    for (const t of TOPICS) for (const ref of t.verses) {
      const r = parseRef(ref);
      if (!r) continue;
      for (let v = r.from; v <= r.to; v++) {
        const k = `${r.book.abbr}|${r.chapter}|${v}`;
        if (!_verseTopics.has(k)) _verseTopics.set(k, []);
        if (!_verseTopics.get(k).includes(t)) _verseTopics.get(k).push(t);
      }
    }
  }
  return _verseTopics;
}

/* ------------------------------------------------------------------ text */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = esc;
/** Safe JS string literal for inline scripts (quotes, backslashes, and </script> all neutralised). */
const js = (s) => JSON.stringify(String(s)).replace(/</g, "\\u003c");

/** Plain text (verse text is already clean; this only normalises whitespace). */
export function plain(t) {
  return String(t).replace(/\s+/g, " ").trim();
}
/** Psalm superscription for a verse key ("Psa|23|1"), if any. */
function superscription(key) {
  return titlesIndex()[key] || null;
}
/** Display HTML for a verse. */
export function verseHtml(t) {
  return esc(plain(t));
}
/** Key words with Strong's numbers for one or more verse keys. */
export function keyWords(keys, max = 6) {
  const lex = lexicon(), idx = wordsIndex();
  const seen = new Set(), out = [];
  for (const key of keys) for (const [word, code] of idx[key] || []) {
    if (seen.has(code) || !lex[code]) continue;
    seen.add(code);
    out.push({ word, code, translit: lex[code][0], def: lex[code][1] });
  }
  return out.sort((a, b) => b.word.length - a.word.length).slice(0, max);
}
const snippet = (s, n) => (s.length <= n + 8 ? s : s.slice(0, n).replace(/\s+\S*$/, "").replace(/[,.;:]$/, "") + "…");

/* ------------------------------------------------------------------ urls */
const bookUrl = (b) => `/bible/${b.slug}`;
const chapterUrl = (b, c) => `/bible/${b.slug}/${c}`;
const verseUrl = (b, c, from, to) => `/bible/${b.slug}/${c}/${from}${to && to !== from ? `-${to}` : ""}`;
const appChapterUrl = (b, c, v) => `/read/${encodeURIComponent(b.name)}/${c}${v ? `?v=${v}` : ""}`;
const refLabel = (b, c, from, to) => `${b.name === "Psalms" ? "Psalm" : b.name} ${c}:${from}${to && to !== from ? `-${to}` : ""}`;
const chapterLabel = (b, c) => `${b.name === "Psalms" ? "Psalm" : b.name} ${c}`;
const refLink = (ref) => {
  const r = parseRef(ref);
  return r ? `<a href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a>` : esc(ref);
};

/* ------------------------------------------------------------------ shell */
const CSS = `
:root{--cream:#faf7f2;--cream-dark:#f0ebe3;--parchment:#f5f0e8;--brown:#5c4033;--brown-light:#806252;--gold:#c9a84c;--gold-dark:#a8862f;--paper:#fdfbf7;--line:#e6dfd3}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
.wrap{padding-left:max(20px,env(safe-area-inset-left));padding-right:max(20px,env(safe-area-inset-right))}
body{margin:0;background:var(--cream);color:var(--brown);font:16px/1.6 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--gold-dark);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
html{scroll-padding-top:76px}
header.top{position:sticky;top:0;z-index:50;border-bottom:1px solid var(--line);background:var(--paper);background:color-mix(in srgb,var(--paper) 92%,transparent);-webkit-backdrop-filter:saturate(1.4) blur(8px);backdrop-filter:saturate(1.4) blur(8px)}
@supports not (backdrop-filter:blur(8px)){header.top{background:var(--paper)}}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;min-height:56px;gap:12px;flex-wrap:wrap;padding-top:8px;padding-bottom:8px}
form.search{display:flex;flex:1;min-width:180px;max-width:360px;margin:0 auto}
form.search input{flex:1;min-width:0;border:1px solid var(--line);border-right:0;border-radius:9px 0 0 9px;padding:8px 12px;font:16px Inter,system-ui,sans-serif;color:var(--brown);background:var(--cream);-webkit-appearance:none;appearance:none}
form.search input:focus{outline:none;border-color:var(--gold)}
form.search button{border:1px solid var(--gold);background:var(--gold);color:#fff;border-radius:0 9px 9px 0;padding:0 14px;min-width:44px;font-size:18px;cursor:pointer}
form.search.big{max-width:none;margin:0 0 22px}form.search.big input{font-size:16px;padding:12px 14px}form.search.big button{padding:0 18px;font:600 15px Inter,system-ui,sans-serif}
mark{background:#fff3b0;color:inherit;padding:0 2px;border-radius:3px}
@media(max-width:640px){html{scroll-padding-top:108px}form.search{order:3;flex-basis:100%;max-width:none}header.top .wrap{padding-top:6px;padding-bottom:8px;gap:6px 12px}.brand{font-size:15px}.brand img{width:24px;height:24px}
.appbar .wrap{gap:10px;padding-top:7px;padding-bottom:7px}.appbar .t b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.appbar .cta{padding:8px 12px;font-size:13px}
main{padding:18px 0 40px}.crumbs{margin:0 0 10px;white-space:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch}.sub{font-size:14px;margin:0 0 16px}
.actions .btn{flex:1 1 auto;text-align:center;padding:12px 14px}.actions .btn.primary{flex-basis:100%}
.topicv blockquote{font-size:17px}.commentary p{font-size:15px}h2{margin:28px 0 10px}}
.brand{display:flex;align-items:center;gap:10px;color:var(--brown);font-weight:700;letter-spacing:-.01em}
.brand img{width:28px;height:28px;border-radius:7px}
nav.main{display:flex;gap:6px;font-size:14px}nav.main a{color:var(--brown-light);padding:10px 6px}
nav.main .cta{background:var(--gold);color:#fff;padding:7px 12px;border-radius:8px;font-weight:600}
nav.main .cta:hover{text-decoration:none;background:var(--gold-dark)}
.appbar{background:var(--brown);color:#fff}
.appbar .wrap{display:flex;align-items:center;gap:12px;padding-top:10px;padding-bottom:10px;font-size:14px}
.appbar .t{flex:1;min-width:0;line-height:1.3}.appbar .t b{display:block;font-size:14px}.appbar .t span{opacity:.8;font-size:13px}
.appbar .cta{flex:none;background:var(--gold);color:#fff;padding:8px 14px;border-radius:999px;font-weight:600;font-size:14px;white-space:nowrap}
.appbar .cta:hover{text-decoration:none;background:var(--gold-dark)}
@media(max-width:560px){.appbar .t span{display:none}}
main{padding:28px 0 48px}
.crumbs{font-size:13px;color:var(--brown-light);margin:0 0 14px}.crumbs a{color:var(--brown-light)}.crumbs span{margin:0 6px;opacity:.6}
h1{font-family:Georgia,"Times New Roman",serif;font-weight:600;font-size:34px;line-height:1.15;margin:0 0 6px;letter-spacing:-.01em}
h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:var(--brown-light);margin:36px 0 12px;font-weight:600}
.badge{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.06em;color:var(--gold-dark);border:1px solid var(--gold);border-radius:6px;padding:2px 7px;vertical-align:middle;margin-left:8px}
.sub{color:var(--brown-light);font-size:15px;margin:0 0 22px}
.scripture{font-family:Georgia,"Times New Roman",serif;background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:26px 28px;font-size:23px;line-height:1.55;margin:0 0 18px}
.scripture .ttl{display:block;font-size:15px;font-style:italic;color:var(--brown-light);margin-bottom:8px}
.scripture i{font-style:italic;opacity:.85}
.ref{display:block;margin-top:14px;font-family:Inter,system-ui,sans-serif;font-size:14px;color:var(--brown-light)}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 8px}
.btn{display:inline-block;border:1px solid var(--line);background:var(--paper);border-radius:9px;padding:9px 14px;font-size:14px;color:var(--brown);font-weight:500}
.btn:hover{text-decoration:none;border-color:var(--gold)}
.btn.primary{background:var(--gold);border-color:var(--gold);color:#fff;font-weight:600}.btn.primary:hover{background:var(--gold-dark)}
.pn{display:flex;justify-content:space-between;gap:12px;margin:26px 0 0;font-size:14px}
.chapter{font-family:Georgia,"Times New Roman",serif;font-size:19px;line-height:1.7}
.chapter p{margin:0 0 .35em}.chapter .n{font-family:Inter,system-ui,sans-serif;font-size:12px;font-weight:600;color:var(--gold-dark);vertical-align:super;margin-right:5px}
.chapter .ttl{font-style:italic;color:var(--brown-light);font-size:16px;margin:0 0 .6em}
.ctx p{margin:0 0 .5em;font-family:Georgia,serif;font-size:17px;line-height:1.6}.ctx .n{font-family:Inter,system-ui,sans-serif;font-size:12px;font-weight:600;color:var(--gold-dark);margin-right:6px}
.ctx p.hl{background:#fff3b0;border-radius:6px;padding:6px 10px;margin-left:-10px;margin-right:-10px}
.commentary{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
.meaning p{font-size:17px;line-height:1.7;margin:0}
.lead{font-size:18px;line-height:1.65;margin:0 0 18px}
.facts{display:flex;flex-wrap:wrap;gap:8px 10px;margin:0 0 22px;font-size:14px}
.facts span{background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:6px 12px;color:var(--brown-light)}
.facts span b{color:var(--brown);font-weight:600}
ul.outline{list-style:none;padding:0;margin:0;display:grid;gap:8px}
ul.outline li{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:11px 14px;font-size:15px;display:flex;gap:14px;align-items:baseline}
ul.outline .r{flex:none;font-weight:600;color:var(--gold-dark);min-width:74px}
ol.enum{list-style:none;counter-reset:e;padding:0;margin:0 0 18px;display:grid;gap:8px}ol.enum li{counter-increment:e;background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px 16px 12px 46px;position:relative;font-size:16px;line-height:1.55}ol.enum li::before{content:counter(e);position:absolute;left:14px;top:12px;width:22px;height:22px;border-radius:50%;background:var(--gold);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}ol.enum .r{font-weight:600;color:var(--gold-dark);white-space:nowrap;font-size:14px}p.note{font-size:14px;color:var(--brown-light);line-height:1.65;border-left:3px solid var(--line);padding-left:14px;margin:0 0 20px}.chips.tally span{background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:14px;color:var(--brown-light)}.chips.tally b{color:var(--brown);font-weight:600}.faq{display:grid;gap:10px}
.faq details{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px 16px}
.faq summary{cursor:pointer;font-weight:600;font-size:15px}
.faq p{margin:10px 0 0;font-size:15px;color:var(--brown-light);line-height:1.6}
.commentary p{margin:0 0 .6em;font-size:15px;line-height:1.65}.commentary .cite{margin:0;font-size:13px;color:var(--brown-light);font-style:italic}
ul.refs{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px;font-size:14px}ul.refs a{display:inline-block;background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:7px 12px;color:var(--brown)}ul.refs a:hover{border-color:var(--gold);text-decoration:none}
ul.words{list-style:none;padding:0;margin:0;display:grid;gap:8px}
ul.words li{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:10px 14px;font-size:14px}
ul.words b{font-family:Georgia,serif;font-size:16px}ul.words .tr{color:var(--gold-dark);font-style:italic;margin:0 6px}ul.words .code{color:var(--brown-light);font-size:12px;margin-left:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(48px,1fr));gap:8px}
.grid a{display:block;text-align:center;background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:8px 0;font-weight:600;color:var(--brown)}
.grid a:hover{border-color:var(--gold);text-decoration:none}
.books{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px 16px;font-size:15px}
.books a{color:var(--brown)}.books a small{color:var(--brown-light);font-weight:400}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips a{background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:14px;color:var(--brown)}
.chips a:hover{border-color:var(--gold);text-decoration:none}
.topicv{margin:0 0 22px}.topicv .r{font-weight:600;font-size:15px;margin:0 0 4px}.topicv .r a{color:var(--brown)}
.topicv blockquote{font-family:Georgia,serif;font-size:18px;line-height:1.6;margin:0;padding:0 0 0 16px;border-left:3px solid var(--gold)}
.promo{margin:44px 0 0;background:var(--parchment);border:1px solid var(--line);border-radius:14px;padding:22px 24px}
.promo h3{margin:0 0 6px;font-size:18px}.promo p{margin:0 0 12px;color:var(--brown-light);font-size:15px}
footer.bottom{border-top:1px solid var(--line);color:var(--brown-light);font-size:13px;padding:22px 0 36px}
footer.bottom .wrap{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between}
footer.bottom a{color:var(--brown-light)}
@media(max-width:560px){h1{font-size:28px}.scripture{font-size:20px;padding:20px}nav.main .hide{display:none}}
`;

function shell({ title, description, canonical, h, jsonld, ogImage, noindex, pageType = "bible-other", ref = "", hideSearch = false, extraCss = "", noInvite = false }) {
  const url = SITE + canonical;
  // GA4: same property as the app. content_group / page_type / bible_ref let reports
  // split verse vs chapter vs topic traffic; seo_cta_click measures hand-off into the app.
  const ga = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{content_group:${js(pageType)},page_type:${js(pageType)},bible_ref:${js(ref)}});
document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[data-cta]'):null;if(!a||typeof gtag!=='function')return;gtag('event','seo_cta_click',{cta:a.getAttribute('data-cta'),page_type:${js(pageType)},bible_ref:${js(ref)},link_url:a.getAttribute('href'),transport_type:'beacon'})});</script>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">'}
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:type" content="article">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage || SITE + "/og-image.png"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description)}">
<meta name="twitter:image" content="${ogImage || SITE + "/og-image.png"}">
<meta name="theme-color" content="#c9a84c">
${APP_STORE_ID ? `<meta name="apple-itunes-app" content="app-id=${APP_STORE_ID}">` : ""}
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/favicon-180.png">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
${ga}
<style>${CSS}${INVITE_CSS}${extraCss}</style>
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand" href="/"><img src="/icon-192.png" alt="" width="28" height="28">TheWay Bible</a>
${hideSearch ? "" : `<form class="search" action="/bible/search" role="search"><input type="search" name="q" placeholder="Search verse, topic, or word" aria-label="Search the Bible" enterkeyhint="search" autocapitalize="none" autocorrect="off"><button type="submit" aria-label="Search">⌕</button></form>`}
<nav class="main"><a href="/bible">Read</a><a href="/verses-about">Topics</a><a href="/verse-of-the-day" class="hide">Verse of the day</a><a href="/churches" class="hide">Churches</a></nav>
</div></header>
<div class="appbar"><div class="wrap"><div class="t"><b>Free on iPhone</b><span>Study, memorize, journal, and pray.</span></div><a class="cta" href="${appHref()}" data-cta="appbar-ios">Get the app</a></div></div>
<main><div class="wrap">
${h}
</div></main>
<footer class="bottom"><div class="wrap">
<span>© ${new Date().getFullYear()} TheWay Bible App · Scripture text: ${VERSION_LONG} (public domain)</span>
<span><a href="/bible">Bible</a> · <a href="/verses-about">Topics</a> · <a href="/verse-of-the-day">Verse of the day</a> · <a href="/churches">Find a church</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="mailto:hello@thewaybible.app">Contact</a></span>
</div></footer>
${noindex || noInvite ? "" : inviteHtml(appHref())}
${noindex || noInvite ? "" : `<script>${inviteJs(pageType)}</script>`}
</body>
</html>`;
}

const crumbs = (items) =>
  `<p class="crumbs">${items.map(([label, href], i) => (href && i < items.length - 1 ? `<a href="${href}">${esc(label)}</a>` : esc(label))).join("<span>›</span>")}</p>`;
const breadcrumbLd = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, ...(href ? { item: SITE + href } : {}) })),
});
const webPageLd = (extra) => ({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": SITE + "/#website", name: "TheWay Bible App", url: SITE + "/" },
    ...extra,
  ],
});

const promo = (b, c, v) => `
<section class="promo">
<h3>Keep reading in TheWay Bible App</h3>
<p>Read, study, memorize, journal, and pray — tap any word for its Greek or Hebrew definition, save verses to memorize, and keep a journal. Free on the web and iOS.</p>
<div class="actions"><a class="btn primary" href="${appHref()}" data-cta="promo-ios">Get the iPhone app</a><a class="btn" href="${b ? appChapterUrl(b, c, v) : "/"}" data-cta="promo-open-app">Open on the web</a><a class="btn" href="https://scroll.thewaybible.app" data-cta="promo-scroll">Try Scroll — the timeless feed</a></div>
</section>`;

/* ------------------------------------------------------------------ pages */
const ok = (body, cache = "public, max-age=0, s-maxage=2592000, stale-while-revalidate=86400") => ({
  status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": cache }, body,
});
const redirect = (to) => ({ status: 301, headers: { Location: to, "Cache-Control": "public, s-maxage=2592000" }, body: "" });
const found = (to) => ({ status: 302, headers: { Location: to, "Cache-Control": "public, s-maxage=86400" }, body: "" });
const xml = (body) => ({ status: 200, headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=86400" }, body });

export function notFound() {
  const h = `<h1>Page not found</h1><p class="sub">That reference doesn't exist in the King James Version.</p>
<div class="actions"><a class="btn primary" href="/bible">Browse the Bible</a><a class="btn" href="/verses-about">Verses by topic</a></div>`;
  return { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=3600" },
    body: shell({ title: "Not found | " + SITE_NAME, description: "Page not found.", canonical: "/bible", h, jsonld: {}, noindex: true }) };
}

function bibleIndex() {
  const ot = books().filter((b) => b.testament === "OT"), nt = books().filter((b) => b.testament === "NT");
  const list = (arr) => `<div class="books">${arr.map((b) => `<a href="${bookUrl(b)}">${esc(b.name)} <small>· ${b.chapters.length}</small></a>`).join("")}</div>`;
  const h = `${crumbs([["Home", "/"], ["Bible", "/bible"]])}
<h1>Read the Bible online <span class="badge">${VERSION}</span></h1>
<p class="sub">The complete King James Version — 66 books, 1,189 chapters, 31,102 verses. Every verse has its own page with context, cross references, and Greek/Hebrew key words.</p>
<h2>Old Testament — ${ot.length} books</h2>${list(ot)}
<h2>New Testament — ${nt.length} books</h2>${list(nt)}
<h2>Verse of the day</h2>
<p class="sub" style="margin-bottom:14px"><a href="/verse-of-the-day">A new verse every day →</a></p>
<h2>Verses by topic</h2>
<div class="chips">${FEATURED_TOPICS.map((s) => TOPIC_BY_SLUG.get(s)).filter(Boolean).map((t) => `<a href="/verses-about/${t.slug}">${esc(t.name)}</a>`).join("")}<a href="/verses-about">All ${TOPICS.length} topics →</a></div>
${promo()}`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: "The Holy Bible, King James Version", url: SITE + "/bible", isPartOf: { "@id": SITE + "/#website" } },
    breadcrumbLd([["Home", "/"], ["Bible", "/bible"]]),
  ]);
  return ok(shell({ title: `Read the Bible Online (KJV) – All 66 Books | ${SITE_NAME}`, description: "Read the complete King James Version online, free. Every chapter and verse of all 66 books, with cross references, context, and Greek and Hebrew key words.", canonical: "/bible", h, jsonld, pageType: "bible-index" }));
}

function bookPage(b) {
  const verseCount = b.chapters.reduce((n, c) => n + c.length, 0);
  const intro = BOOK_INTROS[b.slug];
  const oneChapter = b.chapters.length === 1;
  const sizeText = oneChapter ? `${verseCount} verses` : `${b.chapters.length} chapters and ${verseCount.toLocaleString()} verses`;
  // Some books name no author ("Not named in the book; ...") and some have no
  // settled date ("date uncertain"), so neither can be dropped into a sentence raw.
  const undated = intro ? /^date /.test(intro.when) : false;
  const whenChip = intro ? (undated ? `Date <b>${esc(intro.when.replace(/^date /, ""))}</b>` : `Traditionally dated <b>${esc(intro.when)}</b>`) : "";
  const whenAnswer = intro ? (undated ? `The date is ${intro.when.replace(/^date /, "")}.` : `It is traditionally dated ${intro.when}.`) : "";
  // Real questions people type, answered from the book's own data. Also emitted as FAQPage JSON-LD.
  // "how long is ephesians" ranks at 5.9 and "how long is luke in the bible" at
  // 8.0 off the single line below, so the rest of that question shape is worth
  // answering too. All counted, none of it written by hand.
  const st = bookStats(b);
  const all = books();
  const prevBook = all[b.index - 1], nextBook = all[b.index + 1];
  const place = `${b.name} is the ${ordinal(b.index + 1)} book of the Bible and the ${ordinal(b.testament === "OT" ? b.index + 1 : b.index - 38)} of the ${b.testament === "OT" ? "Old" : "New"} Testament${prevBook && nextBook ? `, between ${prevBook.name} and ${nextBook.name}` : prevBook ? `, after ${prevBook.name}` : nextBook ? `, before ${nextBook.name}` : ""}.`;
  const faqs = intro ? [
    [`Who wrote the book of ${b.name}?`, `${intro.wrote}.`],
    [`When was ${b.name} written?`, whenAnswer],
    [`What is the book of ${b.name} about?`, intro.summary],
    [`How long is ${b.name}?`, `${b.name} has ${sizeText} in the King James Version — about ${st.words.toLocaleString()} words.`],
    [`How long does it take to read ${b.name}?`, `${readingTime(st.words)} at an ordinary reading pace of about ${WPM} words a minute.`],
    ...(oneChapter ? [] : [[`How many chapters are in ${b.name}?`, `${st.chapters}.`]]),
    [`How many verses are in ${b.name}?`, `${st.verses.toLocaleString()}.`],
    ...(oneChapter ? [] : [[`What is the longest chapter in ${b.name}?`, `${chapterLabel(b, st.longest[0])}, with ${st.longest[1]} verses. The shortest is ${chapterLabel(b, st.shortest[0])}, with ${st.shortest[1]}.`]]),
    [`Where is ${b.name} in the Bible?`, place],
  ] : [];
  const popular = [];
  for (const t of TOPICS) for (const ref of t.verses) { const r = parseRef(ref); if (r && r.book === b && !popular.some((p) => p.ref === ref)) popular.push({ ref, r }); }
  const grid = `<div class="grid">${b.chapters.map((_, i) => `<a href="${chapterUrl(b, i + 1)}">${i + 1}</a>`).join("")}</div>`;
  const prev = books()[b.index - 1], next = books()[b.index + 1];
  const h = `${crumbs([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)]])}
<h1>${esc(b.name)} <span class="badge">${VERSION}</span></h1>
<p class="sub">${b.testament === "OT" ? "Old" : "New"} Testament · ${b.chapters.length} chapter${b.chapters.length === 1 ? "" : "s"} · ${verseCount.toLocaleString()} verses · ${esc(readingTime(st.words))} to read</p>
<div class="actions"><a class="btn primary" href="${chapterUrl(b, 1)}" data-cta="book-start-reading">Start reading ${esc(chapterLabel(b, 1))}</a><a class="btn" href="${appChapterUrl(b, 1)}" data-cta="book-open-app">Open in the app</a></div>
${intro ? `<p class="lead">${esc(intro.summary)}</p>
<p class="facts"><span>Author: <b>${esc(intro.wrote)}</b></span><span>${whenChip}</span><span>Theme: <b>${esc(intro.theme)}</b></span></p>` : ""}
<h2>Chapters</h2>${grid}
${intro ? `<h2>Outline of ${esc(b.name)}</h2><ul class="outline">${intro.outline.map(([range, label]) => `<li><a class="r" href="${oneChapter ? verseUrl(b, 1, +String(range).split(/[–-]/)[0], +String(range).split(/[–-]/).pop()) : chapterUrl(b, +String(range).split(/[–-]/)[0])}">${oneChapter ? "vv. " : ""}${esc(range)}</a><span>${esc(label)}</span></li>`).join("")}</ul>` : ""}
${intro ? `<h2>Key verses</h2><div>${intro.keys.map((ref) => { const r = parseRef(ref); return r ? `<div class="topicv"><p class="r"><a href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a></p><blockquote>${verseHtml(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" "))}</blockquote></div>` : ""; }).join("")}</div>` : ""}
${popular.length ? `<h2>Well-known verses in ${esc(b.name)}</h2><div class="topicv">${popular.slice(0, 10).map(({ ref, r }) => `<p class="r"><a href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a></p><blockquote>${verseHtml(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" "))}</blockquote>`).join("")}</div>` : ""}
${intro ? `<h2>How long ${esc(b.name)} is</h2>
<p class="facts"><span>Chapters: <b>${st.chapters}</b></span><span>Verses: <b>${st.verses.toLocaleString()}</b></span><span>Words: <b>about ${st.words.toLocaleString()}</b></span><span>Read in: <b>${esc(readingTime(st.words))}</b></span>${oneChapter ? "" : `<span>Longest chapter: <b>${esc(chapterLabel(b, st.longest[0]))}</b> (${st.longest[1]} verses)</span>`}</p>
<p class="sub">${esc(place)} <a href="/bible-statistics">Compare all 66 books &rarr;</a></p>` : ""}
${faqs.length ? `<h2>Common questions</h2><div class="faq">${faqs.map(([q, ans]) => `<details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join("")}</div>` : ""}
<div class="pn"><span>${prev ? `<a href="${bookUrl(prev)}">← ${esc(prev.name)}</a>` : ""}</span><span>${next ? `<a href="${bookUrl(next)}">${esc(next.name)} →</a>` : ""}</span></div>
${promo(b, 1)}`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: `${b.name} (KJV)`, url: SITE + bookUrl(b), isPartOf: { "@id": SITE + "/#website" }, about: { "@type": "Book", name: `The Book of ${b.name}`, isPartOf: { "@type": "Book", name: "The Holy Bible, King James Version" } } },
    breadcrumbLd([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)]]),
    ...(faqs.length ? [{ "@type": "FAQPage", "@id": SITE + bookUrl(b) + "#faq",
      mainEntity: faqs.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans } })) }] : []),
  ]);
  return ok(shell({ title: intro ? `${b.name}: Summary, Author, and Outline (KJV) | ${SITE_NAME}` : `${b.name} (KJV) – Read Online | ${SITE_NAME}`, description: intro ? snippet(`${intro.summary.split(". ")[0]}. ${intro.wrote} — ${undated ? `date ${intro.when.replace(/^date /, "")}` : `traditionally dated ${intro.when}`}. Read all ${sizeText} in the King James Version, free.`, 250) : `Read the Book of ${b.name} in the King James Version — ${sizeText} online, free.`, canonical: bookUrl(b), h, jsonld, pageType: "bible-book", ref: b.name }));
}

function chapterPage(b, c) {
  const ch = b.chapters[c - 1];
  const label = chapterLabel(b, c);
  const text = ch.map((v, i) => {
    const t = superscription(`${b.abbr}|${c}|${i + 1}`);
    return `${t ? `<p class="ttl">${esc(t)}</p>` : ""}<p id="${i + 1}"><a class="n" href="${verseUrl(b, c, i + 1)}">${i + 1}</a>${verseHtml(v)}</p>`;
  }).join("\n");
  const prev = c > 1 ? chapterUrl(b, c - 1) : books()[b.index - 1] ? chapterUrl(books()[b.index - 1], books()[b.index - 1].chapters.length) : null;
  const prevLabel = c > 1 ? chapterLabel(b, c - 1) : books()[b.index - 1] ? chapterLabel(books()[b.index - 1], books()[b.index - 1].chapters.length) : "";
  const next = c < b.chapters.length ? chapterUrl(b, c + 1) : books()[b.index + 1] ? chapterUrl(books()[b.index + 1], 1) : null;
  const nextLabel = c < b.chapters.length ? chapterLabel(b, c + 1) : books()[b.index + 1] ? chapterLabel(books()[b.index + 1], 1) : "";
  const h = `${crumbs([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)], [label, chapterUrl(b, c)]])}
<h1>${esc(label)} <span class="badge">${VERSION}</span></h1>
<p class="sub">${ch.length} verses · <a href="${bookUrl(b)}">all chapters of ${esc(b.name)}</a></p>
<div class="actions"><a class="btn primary" href="${appChapterUrl(b, c)}" data-cta="chapter-study-app">Study this chapter in the app</a></div>
<div class="chapter">${text}</div>
<div class="pn"><span>${prev ? `<a href="${prev}">← ${esc(prevLabel)}</a>` : ""}</span><span>${next ? `<a href="${next}">${esc(nextLabel)} →</a>` : ""}</span></div>
<h2>Chapters in ${esc(b.name)}</h2><div class="grid">${b.chapters.map((_, i) => `<a href="${chapterUrl(b, i + 1)}"${i + 1 === c ? ' style="border-color:var(--gold);background:#fff3b0"' : ""}>${i + 1}</a>`).join("")}</div>
${promo(b, c)}`;
  const desc = `${label} in the King James Version: ${snippet(plain(ch[0]), 120)} Read the full chapter with every verse linked, plus cross references and Greek/Hebrew word studies.`;
  const jsonld = webPageLd([
    { "@type": "WebPage", name: `${label} (KJV)`, url: SITE + chapterUrl(b, c), isPartOf: { "@id": SITE + "/#website" },
      about: { "@type": "Chapter", name: label, position: c, isPartOf: { "@type": "Book", name: `The Book of ${b.name}` } } },
    breadcrumbLd([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)], [label, chapterUrl(b, c)]]),
  ]);
  return ok(shell({ title: `${label} KJV – Read the Full Chapter Online | ${SITE_NAME}`, description: desc, canonical: chapterUrl(b, c), h, jsonld, pageType: "bible-chapter", ref: label }));
}

function versePage(b, c, from, to) {
  const ch = b.chapters[c - 1];
  const raw = ch.slice(from - 1, to);
  const label = refLabel(b, c, from, to);
  const text = plain(raw.join(" "));
  const single = from === to;
  const ttl = superscription(`${b.abbr}|${c}|${from}`);
  const scripture = `<blockquote class="scripture">${ttl ? `<span class="ttl">${esc(ttl)}</span>` : ""}${single ? verseHtml(raw[0]) : raw.map((v, i) => `<sup class="n" style="font-family:Inter,system-ui;font-size:12px;color:var(--gold-dark);margin-right:4px">${from + i}</sup>${verseHtml(v)}`).join(" ")}<span class="ref">${esc(label)} · ${VERSION_LONG}</span></blockquote>`;

  // prev / next verse (crossing chapter and book edges)
  let prev = null, next = null;
  if (from > 1) prev = [b, c, from - 1];
  else if (c > 1) prev = [b, c - 1, b.chapters[c - 2].length];
  else if (books()[b.index - 1]) { const pb = books()[b.index - 1]; prev = [pb, pb.chapters.length, pb.chapters[pb.chapters.length - 1].length]; }
  if (to < ch.length) next = [b, c, to + 1];
  else if (c < b.chapters.length) next = [b, c + 1, 1];
  else if (books()[b.index + 1]) next = [books()[b.index + 1], 1, 1];

  // context: two verses either side
  const cFrom = Math.max(1, from - 2), cTo = Math.min(ch.length, to + 2);
  const context = ch.slice(cFrom - 1, cTo).map((v, i) => {
    const n = cFrom + i, hl = n >= from && n <= to;
    return `<p${hl ? ' class="hl"' : ""}><a class="n" href="${verseUrl(b, c, n)}">${n}</a>${verseHtml(v)}</p>`;
  }).join("");

  // cross references (union across the range)
  const xr = xrefs(); const refs = [];
  for (let v = from; v <= to; v++) for (const r of xr[`${b.abbr}|${c}|${v}`] || []) if (!refs.includes(r) && parseRef(r)) refs.push(r);
  const words = keyWords(Array.from({ length: to - from + 1 }, (_, i) => `${b.abbr}|${c}|${from + i}`), single ? 6 : 8);
  const topics = []; for (let v = from; v <= to; v++) for (const t of verseTopics().get(`${b.abbr}|${c}|${v}`) || []) if (!topics.includes(t)) topics.push(t);
  const commentary = commentaryFor(`${b.abbr}|${c}|${from}`);
  const meaning = meaningFor(b, c, from, to);

  const h = `${crumbs([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)], [chapterLabel(b, c), chapterUrl(b, c)], [label, verseUrl(b, c, from, to)]])}
<h1>${esc(label)} <span class="badge">${VERSION}</span></h1>
<p class="sub">${esc(b.name)} · chapter ${c}${single ? ` · verse ${from}` : ` · verses ${from}–${to}`}</p>
${scripture}
<div class="actions"><a class="btn primary" href="${appChapterUrl(b, c, from)}" data-cta="verse-study-app">Study in the app</a><a class="btn" href="${chapterUrl(b, c)}#${from}" data-cta="verse-read-chapter">Read ${esc(chapterLabel(b, c))} in full</a><a class="btn" href="/api/og?ref=${encodeURIComponent(label)}" data-cta="verse-share-image" download="${attr(label.replace(/[: ]/g, "-"))}.png">Share image</a></div>
${meaning ? `<h2>What ${esc(label)} means</h2><div class="meaning"><p>${esc(meaning)}</p></div><p class="muted">Study note provided by TheWay Bible App, separate from the KJV text. Read the full chapter in context and compare interpretations. <a href="mailto:dillon@branddesignco.com">Report a correction</a>.</p>` : ""}
<h2>${esc(label)} in context</h2><div class="ctx">${context}</div>
<p style="font-size:14px"><a href="${chapterUrl(b, c)}">Read all of ${esc(chapterLabel(b, c))} →</a></p>
${commentary ? `<h2>Commentary</h2><div class="commentary"><p>${esc(commentary.excerpt)}</p><p class="cite">— Matthew Henry's Concise Commentary${commentary.range && commentary.range !== String(from) ? ` on verses ${esc(commentary.range)}` : ""}</p></div>` : ""}
${refs.length ? `<h2>Cross references</h2><ul class="refs">${refs.slice(0, 12).map((r) => `<li>${refLink(r)}</li>`).join("")}</ul>` : ""}
${words.length ? `<h2>Key words (Strong's)</h2><ul class="words">${words.map((w) => `<li><b>${esc(w.word)}</b><span class="tr">${esc(w.translit)}</span>${esc(w.def)}<a class="code" href="${strongsUrl(w.code)}" data-cta="verse-word-study">${w.code} →</a></li>`).join("")}</ul>` : ""}
${topics.length ? `<h2>Topics</h2><div class="chips">${topics.map((t) => `<a href="/verses-about/${t.slug}">${esc(topicPhrase(t))}</a>`).join("")}</div>` : ""}
<div class="pn"><span>${prev ? `<a href="${verseUrl(prev[0], prev[1], prev[2])}">← ${esc(refLabel(prev[0], prev[1], prev[2]))}</a>` : ""}</span><span>${next ? `<a href="${verseUrl(next[0], next[1], next[2])}">${esc(refLabel(next[0], next[1], next[2]))} →</a>` : ""}</span></div>
${promo(b, c, from)}`;

  const title = `${label} KJV – ${snippet(text, 52)} | ${SITE_NAME}`;
  const description = text.length > 158 ? snippet(text, 155) : text;
  const canonical = verseUrl(b, c, from, to);
  const jsonld = webPageLd([
    { "@type": "WebPage", name: `${label} (KJV)`, url: SITE + canonical, description, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "CreativeWork", name: label, text, inLanguage: "en", isPartOf: { "@type": "Book", name: "The Holy Bible, King James Version" }, license: "https://creativecommons.org/publicdomain/mark/1.0/" } },
    breadcrumbLd([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)], [chapterLabel(b, c), chapterUrl(b, c)], [label, canonical]]),
    ...(meaning ? [{ "@type": "FAQPage", "@id": SITE + canonical + "#faq",
      mainEntity: [{ "@type": "Question", name: `What does ${label} mean?`, acceptedAnswer: { "@type": "Answer", text: meaning } }] }] : []),
  ]);
  return ok(shell({ title, description, canonical, h, jsonld, ogImage: `${SITE}/api/og?ref=${encodeURIComponent(label)}`, pageType: "bible-verse", ref: label }));
}

function topicsIndex() {
  const topicList = (arr) => `<div class="books">${arr.map((t) => `<a href="/verses-about/${t.slug}">${esc(t.name)} <small>· ${t.verses.length}</small></a>`).join("")}</div>`;
  const sections = [["Life, faith, and everyday things", TOPICS.filter((t) => !t.group)],
    ...TOPIC_GROUPS.map((g) => [g, TOPICS.filter((t) => t.group === g)])].filter(([, arr]) => arr.length);
  const h = `${crumbs([["Home", "/"], ["Verses by topic", "/verses-about"]])}
<h1>Bible verses by topic <span class="badge">${VERSION}</span></h1>
<p class="sub">${TOPICS.length} topics — what you are walking through, who is in the story, and what God is called. Every verse is quoted in full, with a link to read it in context.</p>
${sections.map(([label, arr]) => `<h2>${esc(label)} — ${arr.length}</h2>${topicList(arr)}`).join("")}
${promo()}`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: "Bible verses by topic", url: SITE + "/verses-about", isPartOf: { "@id": SITE + "/#website" } },
    breadcrumbLd([["Home", "/"], ["Verses by topic", "/verses-about"]]),
  ]);
  return ok(shell({ title: `Bible Verses by Topic – ${TOPICS.length} Topics (KJV) | ${SITE_NAME}`, description: `Bible verses by topic in the King James Version — anxiety, strength, love, healing, marriage and ${TOPICS.length - 5} more, including the people of the Bible, the names of God, and the best-known stories. Every verse quoted in full.`, canonical: "/verses-about", h, jsonld, pageType: "verses-index" }));
}

/** "Bible verses about Anxiety" / "Bible verses for Weddings" / "Short Bible Verses" — per-topic phrasing. */
const topicPhrase = (t, cap = false) => {
  if (t.heading) return t.heading;
  const prep = t.prep || "about";
  const name = t.name.replace(/^The /, "the ");   // mid-sentence: "about the Armor of God"
  return cap ? `Bible Verses ${prep[0].toUpperCase()}${prep.slice(1)} ${name}` : `Bible verses ${prep} ${name}`;
};

// Sections on /verses-about, in the order they are shown.
const TOPIC_GROUPS = ["People of the Bible", "Names & Titles of God", "Stories & Teachings", "What We Believe"];
// Chips on /bible — a spread of the most-searched pages, not the first 24 alphabetically.
const FEATURED_TOPICS = ["fear-and-anxiety", "strength", "love", "healing", "hope", "faith", "peace", "prayer", "marriage", "forgiveness", "grief-and-loss", "encouragement", "trusting-god", "gods-love", "protection", "joy", "david", "jesus", "the-names-of-god", "the-fruit-of-the-spirit", "most-popular-bible-verses", "verses-to-memorize", "short-bible-verses", "christmas"];

function topicPage(t) {
  const items = t.verses.map((ref) => ({ ref, r: parseRef(ref) })).filter((x) => x.r);
  const n = items.length;
  const phrase = topicPhrase(t);
  const list = items.map(({ ref, r }) => `<div class="topicv"><p class="r"><a href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a> <span style="font-weight:400;color:var(--brown-light)">· ${VERSION}</span></p><blockquote>${verseHtml(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" "))}</blockquote></div>`).join("");
  const intro = TOPIC_INTROS[t.slug] || null;
  const related = TOPICS.filter((o) => o !== t && o.verses.some((v) => t.verses.includes(v))).slice(0, 8);
  // Topics that ARE a list (the ten commandments, the nine fruit, the twelve)
  // get the list itself above the verses. See seo/topic-lists.js for why.
  const L = TOPIC_LISTS[t.slug] || null;
  const listBlock = L ? `<h2>${esc(L.heading)}</h2>
<ol class="enum">${L.items.map(([text, ref]) => { const r = parseRef(ref); return `<li><span>${esc(text)}</span>${r ? ` <a class="r" href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a>` : ""}</li>`; }).join("")}</ol>
${L.note ? `<p class="note">${esc(L.note)}</p>` : ""}` : "";
  const h = `${crumbs([["Home", "/"], ["Verses by topic", "/verses-about"], [t.name, `/verses-about/${t.slug}`]])}
<h1>${L ? esc(L.title) : `${n} ${esc(topicPhrase(t))}`} <span class="badge">${VERSION}</span></h1>
${L ? `<p class="lead">${esc(L.lead)}</p>` : intro ? `<div class="meaning"><p>${esc(intro)}</p></div>` : ""}
${listBlock}
${L ? `<h2>${esc(L.title)} in scripture — ${n} verses, quoted in full</h2>` : ""}
<p class="sub">${t.blurb ? esc(t.blurb) + " " : ""}Each verse is quoted in full — tap a reference to read it in context, see cross references, and study the original words.</p>
${list}
${L ? `<h2>Common questions</h2><div class="faq">${L.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>` : ""}
${related.length ? `<h2>Related topics</h2><div class="chips">${related.map((o) => `<a href="/verses-about/${o.slug}">${esc(o.name)}</a>`).join("")}</div>` : ""}
<p style="font-size:14px;margin-top:20px"><a href="/verses-about">All ${TOPICS.length} topics →</a></p>
${promo()}`;
  const first = items[0];
  const lead = L ? snippet(L.lead, 150) : intro ? snippet(intro, 150) : t.blurb || null;
  const description = L
    ? L.desc
    : lead
    ? `${lead} ${n} verses in the King James Version, quoted in full — including ${items.slice(0, 3).map((x) => x.ref).join(", ")}.`
    : `${n} ${phrase} from the King James Version, quoted in full — including ${items.slice(0, 3).map((x) => x.ref).join(", ")}. Read each one in context.`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: topicPhrase(t), url: SITE + `/verses-about/${t.slug}`, description, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "ItemList", numberOfItems: n, itemListElement: items.map(({ ref, r }, i) => ({ "@type": "ListItem", position: i + 1, name: ref, url: SITE + verseUrl(r.book, r.chapter, r.from, r.to) })) } },
    breadcrumbLd([["Home", "/"], ["Verses by topic", "/verses-about"], [t.name, `/verses-about/${t.slug}`]]),
    ...(L ? [{ "@type": "FAQPage", "@id": SITE + `/verses-about/${t.slug}#faq`,
      mainEntity: L.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }] : []),
  ]);
  return ok(shell({ title: L ? `${L.title} (KJV) — ${L.titleSuffix || `All ${L.items.length} Listed`} | ${SITE_NAME}` : `${n} ${topicPhrase(t, true)} (KJV) | ${SITE_NAME}`, description, canonical: `/verses-about/${t.slug}`, h, jsonld, ogImage: first ? `${SITE}/api/og?ref=${encodeURIComponent(first.ref)}` : undefined, pageType: "verses-topic", ref: t.name }));
}

const NAME_BY_SLUG = new Map(NAMES.map((n) => [n.name.toLowerCase(), n]));
// The spelling to look for in the KJV text, which is not always the modern one.
const nameKey = (n) => (n.kjv || n.name).toLowerCase();
const nameUrl = (n) => `/bible-names/${n.name.toLowerCase()}`;

/**
 * Every verse each name appears in, found by scanning the KJV text once.
 * Built lazily and cached: one pass over ~31k verses covers all 117 names,
 * so the first name page pays for it and the rest are free. Matching is on
 * whole lower-cased words, so "Dan" does not match "Daniel".
 */
let _nameHits;
function nameHits() {
  if (_nameHits) return _nameHits;
  _nameHits = new Map();
  for (const n of NAMES) _nameHits.set(nameKey(n), []);
  for (const b of books()) {
    b.chapters.forEach((ch, ci) => ch.forEach((txt, vi) => {
      const words = plain(txt).toLowerCase().match(/[a-z]+/g);
      if (!words) return;
      const seen = new Set();
      for (const w of words) {
        if (!_nameHits.has(w) || seen.has(w)) continue;
        seen.add(w);
        _nameHits.get(w).push([b, ci + 1, vi + 1]);
      }
    }));
  }
  return _nameHits;
}

function namePage(n) {
  const hits = nameHits().get(nameKey(n)) || [];
  const shown = hits.slice(0, 12);
  const topic = n.topic ? TOPIC_BY_SLUG.get(n.topic) : null;
  const first = hits[0];
  // Names that share a meaning cross-link, except "Uncertain", which is the
  // absence of a meaning rather than one they have in common.
  const sameMeaning = /^Uncertain/.test(n.meaning) ? []
    : NAMES.filter((o) => o !== n && o.meaning === n.meaning).slice(0, 6);
  const chips = [
    ["Meaning", n.meaning],
    ["Origin", n.lang],
    n.pron ? ["Said", n.pron] : null,
    ["Strong's", n.strongs],
    ["In the KJV", hits.length ? `${hits.length} verse${hits.length === 1 ? "" : "s"}` : "not as a name"],
  ].filter(Boolean);

  const h = `${crumbs([["Home", "/"], ["Bible names", "/bible-names"], [n.name, nameUrl(n)]])}
<h1>${esc(n.name)} <span class="badge">${esc(n.meaning)}</span></h1>
<p class="sub">${esc(n.name)} is a ${esc(n.lang)} name meaning ${esc(n.meaning.toLowerCase())}${n.pron ? `, said ${esc(n.pron)}` : ""}. ${esc(n.note)}</p>
<div class="chips">${chips.map(([k, v]) => `<span><b>${esc(k)}:</b> ${esc(v)}</span>`).join("")}</div>
<h2>Where the name comes from</h2>
<div class="meaning"><p>${n.lemma ? `<span style="font-size:22px">${esc(n.lemma)}</span>${n.xlit ? ` <i>${esc(n.xlit)}</i>` : ""} — ` : ""}${esc(n.gloss)}.${n.source ? ` Strong's ${esc(n.strongs)} derives it: ${esc(n.source)}.` : ""}</p></div>
${hits.length ? `<h2>${esc(n.name)} in Scripture</h2>
${n.kjv ? `<p class="sub">The King James Version spells it ${esc(n.kjv)}.</p>` : ""}
<p class="sub">The name appears in ${hits.length} verse${hits.length === 1 ? "" : "s"}${first ? `, first at <a href="${verseUrl(first[0], first[1], first[2], first[2])}">${esc(refLabel(first[0], first[1], first[2], first[2]))}</a>` : ""}.</p>
<div>${shown.map(([b, c, v]) => `<div class="topicv"><p class="r"><a href="${verseUrl(b, c, v, v)}">${esc(refLabel(b, c, v, v))}</a> <span style="font-weight:400;color:var(--brown-light)">· ${VERSION}</span></p><blockquote>${verseHtml(b.chapters[c - 1][v - 1])}</blockquote></div>`).join("")}</div>
${hits.length > shown.length ? `<p style="font-size:14px">and ${hits.length - shown.length} more.</p>` : ""}` : ""}
${topic ? `<h2>Who bore the name</h2><p>Read the story: <a href="/verses-about/${topic.slug}">${esc(topicPhrase(topic))}</a>.</p>` : ""}
${sameMeaning.length ? `<h2>Other names meaning ${esc(n.meaning.toLowerCase())}</h2><div class="chips">${sameMeaning.map((o) => `<a href="${nameUrl(o)}">${esc(o.name)}</a>`).join("")}</div>` : ""}
<p style="font-size:14px;margin-top:20px"><a href="/bible-names/${n.sex === "boy" ? "boys" : "girls"}">All ${n.sex === "boy" ? "boys" : "girls"}' names from the Bible →</a> · <a href="/bible-names">All ${NAMES.length} names</a></p>
${promo(first ? first[0] : undefined, first ? first[1] : undefined, first ? first[2] : undefined)}`;

  const description = `${n.name} is a ${n.lang} name meaning ${n.meaning.toLowerCase()}${n.pron ? `, said ${n.pron}` : ""}. ${n.gloss}. ${hits.length ? `The name appears in ${hits.length} verse${hits.length === 1 ? "" : "s"} of the King James Version, quoted in full.` : ""}`;
  const jsonld = webPageLd([
    { "@type": "WebPage", name: `${n.name} — meaning and verses`, url: SITE + nameUrl(n), description, isPartOf: { "@id": SITE + "/#website" } },
    { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: `What does the name ${n.name} mean?`,
      acceptedAnswer: { "@type": "Answer", text: `${n.name} is a ${n.lang} name meaning ${n.meaning.toLowerCase()}. ${n.gloss}.` } }] },
    breadcrumbLd([["Home", "/"], ["Bible names", "/bible-names"], [n.name, nameUrl(n)]]),
  ]);
  return ok(shell({ title: `${n.name} — Meaning, Origin and Bible Verses (KJV) | ${SITE_NAME}`, description, canonical: nameUrl(n), h, jsonld, pageType: "bible-name", ref: n.name }));
}

function namesList(sex) {
  const arr = NAMES.filter((n) => n.sex === sex);
  const label = sex === "boy" ? "boys" : "girls";
  const Label = sex === "boy" ? "Boy" : "Girl";
  const canonical = `/bible-names/${label}`;
  const h = `${crumbs([["Home", "/"], ["Bible names", "/bible-names"], [`${Label}s' names`, canonical]])}
<h1>${arr.length} ${Label}s' Names from the Bible <span class="badge">with meanings</span></h1>
<div class="meaning"><p>Every name here belongs to somebody in the King James Version, and every meaning is traced to the Hebrew or Greek behind it rather than guessed at. Where Strong's calls a derivation uncertain, this says so instead of inventing one.</p></div>
<div class="books">${arr.map((n) => `<a href="${nameUrl(n)}">${esc(n.name)} <small>· ${esc(n.meaning)}</small></a>`).join("")}</div>
<p style="font-size:14px;margin-top:20px"><a href="/bible-names/${sex === "boy" ? "girls" : "boys"}">${sex === "boy" ? "Girls" : "Boys"}' names from the Bible →</a> · <a href="/bible-names">All ${NAMES.length} names</a></p>
${promo()}`;
  const description = `${arr.length} ${label}' names from the Bible with their meanings and the verses they appear in — ${arr.slice(0, 6).map((n) => `${n.name} (${n.meaning.toLowerCase()})`).join(", ")} and more. Each meaning traced to the Hebrew or Greek.`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: `${Label}s' names from the Bible`, url: SITE + canonical, description, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "ItemList", numberOfItems: arr.length, itemListElement: arr.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n.name, url: SITE + nameUrl(n) })) } },
    breadcrumbLd([["Home", "/"], ["Bible names", "/bible-names"], [`${Label}s' names`, canonical]]),
  ]);
  return ok(shell({ title: `${arr.length} ${Label}s' Names from the Bible, with Meanings | ${SITE_NAME}`, description, canonical, h, jsonld, pageType: "bible-names-list" }));
}

function namesIndex() {
  const letters = [...new Set(NAMES.map((n) => n.name[0]))].sort();
  const h = `${crumbs([["Home", "/"], ["Bible names", "/bible-names"]])}
<h1>${NAMES.length} Bible Names and What They Mean <span class="badge">KJV</span></h1>
<div class="meaning"><p>Names from the Bible with the Hebrew or Greek behind them, what each one means, and every verse the name appears in. The meanings are traced to the original word rather than guessed at — and where the derivation is genuinely uncertain, the page says so instead of inventing something.</p></div>
<div class="chips"><a href="/bible-names/boys">Boys' names (${NAMES.filter((n) => n.sex === "boy").length})</a><a href="/bible-names/girls">Girls' names (${NAMES.filter((n) => n.sex === "girl").length})</a></div>
${letters.map((L) => `<h2>${esc(L)}</h2><div class="books">${NAMES.filter((n) => n.name[0] === L).map((n) => `<a href="${nameUrl(n)}">${esc(n.name)} <small>· ${esc(n.meaning)}</small></a>`).join("")}</div>`).join("")}
${promo()}`;
  const description = `${NAMES.length} names from the Bible with their meanings, pronunciation and the verses they appear in — David (beloved), Hannah (favoured), Caleb, Asher, Naomi and more. Every meaning traced to the Hebrew or Greek.`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: "Bible names and their meanings", url: SITE + "/bible-names", description, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "ItemList", numberOfItems: NAMES.length, itemListElement: NAMES.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n.name, url: SITE + nameUrl(n) })) } },
    breadcrumbLd([["Home", "/"], ["Bible names", "/bible-names"]]),
  ]);
  return ok(shell({ title: `${NAMES.length} Bible Names and Their Meanings (KJV) | ${SITE_NAME}`, description, canonical: "/bible-names", h, jsonld, pageType: "bible-names-index" }));
}

function votdPage() {
  const ref = votdRef();
  const r = parseRef(ref);
  const label = refLabel(r.book, r.chapter, r.from, r.to);
  const text = plain(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" "));
  const dateStr = new Date().toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
  const scripture = `<blockquote class="scripture">${verseHtml(text)}<span class="ref">${esc(label)} · ${VERSION_LONG}</span></blockquote>`;
  const topics = []; for (let v = r.from; v <= r.to; v++) for (const t of verseTopics().get(`${r.book.abbr}|${r.chapter}|${v}`) || []) if (!topics.includes(t)) topics.push(t);
  const h = `${crumbs([["Home", "/"], ["Verse of the day", "/verse-of-the-day"]])}
<h1>Verse of the day <span class="badge">${VERSION}</span></h1>
<p class="sub">${esc(dateStr)} · a new verse every day, drawn from a curated pool of the Bible's best-known encouragement, comfort, and truth.</p>
${scripture}
<div class="actions"><a class="btn primary" href="${appChapterUrl(r.book, r.chapter, r.from)}" data-cta="votd-study-app">Study in the app</a><a class="btn" href="${verseUrl(r.book, r.chapter, r.from, r.to)}" data-cta="votd-read-verse">Read ${esc(label)} in context</a><a class="btn" href="/api/og?ref=${encodeURIComponent(label)}" data-cta="votd-share-image" download="${attr(label.replace(/[: ]/g, "-"))}.png">Share image</a></div>
${topics.length ? `<h2>Topics</h2><div class="chips">${topics.map((t) => `<a href="/verses-about/${t.slug}">${esc(topicPhrase(t))}</a>`).join("")}</div>` : ""}
<p style="font-size:14px;margin-top:20px">Come back tomorrow for a new verse, or <a href="/verses-about">browse verses by topic</a> and <a href="/bible">read the whole Bible</a> any time.</p>
${promo(r.book, r.chapter, r.from)}`;
  const description = `Today's Bible verse of the day (${dateStr}): ${label} — "${snippet(text, 140)}" A new King James Version verse every day.`;
  const jsonld = webPageLd([
    { "@type": "WebPage", name: "Verse of the Day", url: SITE + "/verse-of-the-day", description, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "CreativeWork", name: label, text, inLanguage: "en", isPartOf: { "@type": "Book", name: "The Holy Bible, King James Version" }, license: "https://creativecommons.org/publicdomain/mark/1.0/" } },
    breadcrumbLd([["Home", "/"], ["Verse of the day", "/verse-of-the-day"]]),
  ]);
  return ok(shell({ title: `Verse of the Day – ${label} | ${SITE_NAME}`, description, canonical: "/verse-of-the-day", h, jsonld, ogImage: `${SITE}/api/og?ref=${encodeURIComponent(label)}`, pageType: "verse-of-the-day", ref: label }),
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=300");
}


/* ------------------------------------------------------------------ churches */
const churchUrl = (c) => `/churches/${c.slug}`;
const churchTitle = (c) => c.nameLong || c.name;
const addressLine = (a) => [a.street, `${a.city}, ${a.state}${a.zip ? " " + a.zip : ""}`].filter(Boolean).join(", ");
const mapsHref = (c) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name}, ${addressLine(c.address)}`)}`;
const telHref = (p) => `tel:+1${p.replace(/\D/g, "")}`;
const hostOf = (u) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
/** Straight-line miles between two churches (null when either has no coordinates). */
const milesBetween = (a, b) => {
  if (a.lat == null || b.lat == null) return null;
  const r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(x));
};
/** The one outbound link a church page leads with: its own site, else its sermon page. */
const mainLink = (c) => c.website ? { href: c.website, label: `Visit ${c.name}'s website`, short: "Website", cta: "church-website" }
  : c.sermons ? { href: c.sermons, label: "Listen to sermons", short: "Sermons", cta: "church-sermons" } : null;
/** One scannable line for list cards: "Sun 9:45 am · 11:00 am · 6:00 pm — Wed 7:00 pm". */
const glance = (c) => {
  if (!c.services.length) return c.planting ? "Gathering now — join the interest list" : "";
  const sun = [...new Set(c.services.filter((x) => x.day === "Sunday").map((x) => x.time))];
  const wed = [...new Set(c.services.filter((x) => x.day && x.day !== "Sunday").map((x) => `${x.day.slice(0, 3)} ${x.time}`))];
  return [sun.length ? `Sun ${sun.join(" · ")}` : "", ...wed].filter(Boolean).join(" — ");
};
const churchCard = (c, mi) => `<div class="card row" data-s="${attr([c.name, c.city, c.stateName, c.state, c.county || "", c.pastor || "", c.affiliation || "", c.address ? c.address.zip : ""].join(" ").toLowerCase())}" data-kjv="${c.kjv ? 1 : 0}"${c.lat != null ? ` data-lat="${c.lat}" data-lng="${c.lng}"` : ""}><a class="main" href="${churchUrl(c)}"><div class="n">${esc(c.name)}</div><div class="m"><b>${esc(c.city)}, ${esc(c.state)}</b>${c.county ? ` · ${esc(c.county)}` : ""}${c.kjv ? ` · <span class="kjv">King James Bible</span>` : ""}<span class="mi">${mi != null ? ` · ${Math.round(mi)} mi away` : ""}</span></div>${glance(c) ? `<div class="g">${esc(glance(c))}</div>` : ""}</a>${c.phone ? `<a class="call" href="${telHref(c.phone)}" aria-label="Call ${attr(c.name)}" data-cta="church-call-list">Call</a>` : ""}</div>`;

const CHURCH_CSS = `
[hidden]{display:none!important}
.dir{display:grid;gap:10px}
.subform{display:grid;gap:12px;margin-top:12px}.subform label{display:grid;gap:4px;font-size:14px;font-weight:600}.subform input,.subform textarea{font:inherit;font-weight:400;padding:11px 12px;border:1px solid var(--line,#d7d2c8);border-radius:10px;background:#fff;color:inherit;width:100%;box-sizing:border-box}.subform .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.subform .hp{position:absolute;left:-9999px;height:0;overflow:hidden}.citylinks{line-height:2;font-size:15px}.citylinks a{white-space:nowrap}
.card.row{display:flex;align-items:stretch;padding:0;overflow:hidden;background:var(--paper);border:1px solid var(--line);border-radius:12px}
.card.row:hover{border-color:var(--gold)}
.card.row .main{flex:1;min-width:0;display:block;padding:14px 16px;color:var(--brown)}.card.row .main:hover{text-decoration:none;background:var(--cream-dark)}
.card.row .call{flex:none;display:flex;align-items:center;padding:0 20px;border-left:1px solid var(--line);font-weight:600;font-size:14px;min-width:64px;justify-content:center}.card.row .call:hover{background:var(--cream-dark);text-decoration:none}
.dir .n{font-weight:600;font-size:17px;line-height:1.3}.dir .m{font-size:14px;color:var(--brown-light);margin-top:2px}.dir .m b{color:var(--brown);font-weight:500}.dir .g{font-size:14px;margin-top:5px}
.kjv{color:var(--gold-dark);font-weight:600}
.finder{display:grid;gap:4px;margin:0 0 22px}
.finder input[type=search]{width:100%;border:1px solid var(--line);border-radius:10px;padding:14px;font:16px Inter,system-ui,sans-serif;color:var(--brown);background:var(--paper);-webkit-appearance:none;appearance:none}
.finder input[type=search]:focus{outline:none;border-color:var(--gold)}
.finder .row2{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center}
.finder .chk{display:flex;gap:10px;align-items:center;min-height:44px;font-size:15px;cursor:pointer}.finder .chk input{width:20px;height:20px;accent-color:var(--gold-dark)}
.finder .nearbtn{border:1px solid var(--gold);background:var(--gold);color:#fff;border-radius:10px;padding:0 16px;min-height:44px;font:600 15px Inter,system-ui,sans-serif;cursor:pointer}.finder .nearbtn:disabled{opacity:.7;cursor:default}
.finder .count{font-size:14px;color:var(--brown-light);margin:0;min-height:20px}
section.st{margin:0 0 8px}
table.times{width:100%;border-collapse:collapse;background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:16px}
table.times td{padding:12px 14px;border-top:1px solid var(--line)}table.times tr:first-child td{border-top:0}table.times td.t{white-space:nowrap;font-weight:600;color:var(--gold-dark);width:1%}
.info{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px 18px;font-size:16px;line-height:1.6}.info p{margin:0 0 8px}.info p:last-child{margin:0}
.about p{font-size:17px;line-height:1.7;margin:0 0 12px}
p.fine{font-size:13px;color:var(--brown-light);line-height:1.6;margin:22px 0 0}
p.slim{font-size:14px;color:var(--brown-light);margin:26px 0 0;padding-top:16px;border-top:1px solid var(--line)}
.cbar{display:none}
@media(max-width:640px){
.cbar{display:flex;gap:8px;position:fixed;left:0;right:0;bottom:0;z-index:40;padding:10px max(14px,env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));background:var(--paper);border-top:1px solid var(--line)}
.cbar a{flex:1;text-align:center;padding:13px 8px;border:1px solid var(--line);border-radius:10px;font-weight:600;font-size:15px;color:var(--brown);background:var(--cream)}
.cbar a.go{background:var(--gold);border-color:var(--gold);color:#fff}
.cbar a:hover{text-decoration:none}
main{padding-bottom:96px}
.card.row .call{padding:0 16px}
.finder .nearbtn{flex:1 1 100%}
}
`;
const FINDER_JS = `(function(){var f=document.querySelector('.finder');if(!f)return;f.hidden=false;var q=document.getElementById('q'),k=document.getElementById('kjv'),cards=[].slice.call(document.querySelectorAll('.dir .card')),secs=[].slice.call(document.querySelectorAll('section.st')),n=document.getElementById('count'),none=document.getElementById('none'),nb=document.getElementById('near');
function run(){var t=q.value.trim().toLowerCase(),words=t.split(' ').filter(Boolean),shown=0;cards.forEach(function(c){var s=c.getAttribute('data-s'),ok=words.every(function(w){return s.indexOf(w)>-1})&&(!k.checked||c.getAttribute('data-kjv')==='1');c.hidden=!ok;if(ok)shown++});secs.forEach(function(s){s.hidden=!s.querySelector('.card:not([hidden])')});n.textContent=(t||k.checked)?shown+' of '+cards.length+' churches':'';none.hidden=shown>0}
q.addEventListener('input',run);k.addEventListener('change',run);run();
if(nb)nb.addEventListener('click',function(){if(!navigator.geolocation){n.textContent='Location is not available in this browser. Search by city instead.';return}
nb.disabled=true;nb.textContent='Finding you...';
navigator.geolocation.getCurrentPosition(function(p){var la=p.coords.latitude,lo=p.coords.longitude,r=Math.PI/180;
cards.forEach(function(c){var a=parseFloat(c.getAttribute('data-lat')),b=parseFloat(c.getAttribute('data-lng')),m=c.querySelector('.mi');if(isNaN(a)||isNaN(b)){c._d=1e9;if(m)m.textContent='';return}
var x=Math.sin((a-la)*r/2),y=Math.sin((b-lo)*r/2),h=x*x+Math.cos(la*r)*Math.cos(a*r)*y*y;c._d=2*3958.8*Math.asin(Math.sqrt(h));if(m)m.textContent=' · '+Math.round(c._d)+' mi away'});
[].slice.call(document.querySelectorAll('.dir')).forEach(function(d){var cs=[].slice.call(d.children);cs.sort(function(x,y){return x._d-y._d});cs.forEach(function(c){d.appendChild(c)})});
nb.textContent='Sorted by distance from you';n.textContent='Nearest churches first. Your location stays in your browser.';},
function(){nb.disabled=false;nb.textContent='Churches near me';n.textContent='Could not get your location. You can still search by city.'},{timeout:10000,maximumAge:600000})});
})();`;

const SUBMIT_JS = "(function(){var f=document.getElementById(\"subform\");if(!f)return;var m=document.getElementById(\"submsg\"),b=document.getElementById(\"subbtn\");\nvar qs=new URLSearchParams(location.search),fix=qs.get(\"fix\");if(fix){f.kind.value=qs.get(\"remove\")?\"remove\":\"update\";f.slug.value=fix;f.name.value=qs.get(\"n\")||\"\";f.city.value=qs.get(\"c\")||\"\";document.getElementById(\"sub-intro\").textContent=(qs.get(\"remove\")?\"Request removal of this listing\":\"Send corrections for this listing\")+\" and we will review it.\";}\nf.addEventListener(\"submit\",function(e){e.preventDefault();m.hidden=false;if(!f.name.value.trim()||!f.city.value.trim()){m.textContent=\"Please add the church name and city.\";return;}\nb.disabled=true;m.textContent=\"Sending...\";var d={};new FormData(f).forEach(function(v,k){d[k]=v;});\nfetch(\"/api/church-submit\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify(d)}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});}).then(function(x){if(x.ok){f.reset();m.textContent=\"Thank you. We received it and will review it soon.\";}else{m.textContent=x.j.error||\"Something went wrong. Please try again.\";b.disabled=false;}}).catch(function(){m.textContent=\"Could not send. Please email hello@thewaybible.app.\";b.disabled=false;});});})();";

function churchesIndex() {
  const groups = churchesByState();
  const h = `${crumbs([["Home", "/"], ["Churches", "/churches"]])}
<h1>Find a church</h1>
<p class="sub">Service times, address, pastor, and a link to each church's own website. ${DIRECTORY.length} churches listed. No ads, no paid placement.</p>
<div class="finder" hidden>
<input id="q" type="search" placeholder="Search by church, city, or pastor" aria-label="Search churches" autocomplete="off" autocapitalize="none" autocorrect="off" enterkeyhint="search">
<div class="row2"><button type="button" id="near" class="nearbtn">Churches near me</button><label class="chk"><input type="checkbox" id="kjv"> King James Bible churches only</label></div>
<p class="count" id="count" aria-live="polite"></p>
</div>
${groups.map((g) => `<section class="st" id="${g.state.toLowerCase()}"><h2>${esc(g.stateName)} — ${g.churches.length}</h2><div class="dir">${g.churches.map((c) => churchCard(c)).join("")}</div></section>`).join("")}
${(() => { const cs = CITY_LIST.filter((x) => x.list.length > 1); return cs.length ? `<h2>Browse by city</h2><p class="citylinks">${cs.map((x) => `<a href="/churches/in/${x.key}">${esc(x.city)}, ${esc(x.state)} (${x.list.length})</a>`).join(" · ")}</p>` : ""; })()}
<p class="note" id="none" hidden>No churches match that search. Try a city name, or <a href="#list-your-church">tell us about a church to add</a>.</p>
<h2 id="list-your-church">List your church</h2>
<div class="info"><p id="sub-intro">Listing is free, and your page links straight to your website. Send us the basics and we'll review and publish it, usually within a few days.</p>
<form id="subform" class="subform" novalidate>
<input type="hidden" name="kind" value="add"><input type="hidden" name="slug" value="">
<div class="hp" aria-hidden="true"><label>Company<input name="company" tabindex="-1" autocomplete="off"></label></div>
<label>Church name<input name="name" required maxlength="160" autocomplete="organization"></label>
<div class="two"><label>City<input name="city" required maxlength="80" autocomplete="address-level2"></label><label>State<input name="state" maxlength="40" value="MI" autocomplete="address-level1"></label></div>
<label>Website<input name="website" type="url" inputmode="url" placeholder="https://" maxlength="300" autocomplete="url"></label>
<label>Street address<input name="address" maxlength="240" autocomplete="street-address"></label>
<div class="two"><label>Phone<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label>Pastor<input name="pastor" maxlength="120"></label></div>
<label>Service times<textarea name="times" rows="3" maxlength="600" placeholder="Sunday School 10:00 am, Sunday Morning 11:00 am, Sunday Evening 6:00 pm, Wednesday 7:00 pm"></textarea></label>
<label>Anything else (Bible version, what to expect)<textarea name="notes" rows="2" maxlength="1200"></textarea></label>
<label>Your email (so we can reach you)<input name="email" type="email" maxlength="200" autocomplete="email"></label>
<button type="submit" class="nearbtn" id="subbtn">Send for review</button>
<p class="note" id="submsg" role="status" aria-live="polite" hidden></p>
</form></div>
<p class="slim">Free King James Bible online and in the app: <a href="/bible">read on the web</a> · <a href="${appHref()}" data-cta="churches-ios">get the iPhone app</a></p>
<script>${FINDER_JS}</script>
<script>${SUBMIT_JS}</script>`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: "Church directory", url: SITE + "/churches", isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "ItemList", itemListElement: DIRECTORY.slice(0, 100).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: SITE + churchUrl(c) })) } },
    breadcrumbLd([["Home", "/"], ["Churches", "/churches"]]),
  ]);
  return ok(shell({ title: `Find a Church Near You – ${DIRECTORY.length} Bible-Preaching Churches | ${SITE_NAME}`, description: `Find a Bible-preaching church: service times, address, pastor, and website for ${DIRECTORY.length} churches in ${groups.map((g) => g.stateName).join(", ")}. Search by city or use your location. Free listings, no ads.`, canonical: "/churches", h, jsonld, pageType: "churches", extraCss: CHURCH_CSS, noInvite: true }));
}


/* ---- church city pages */
const cityKey = (c) => `${c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${c.state.toLowerCase()}`;
const cityUrl = (c) => `/churches/in/${cityKey(c)}`;
const CITY_MAP = new Map();
for (const c of DIRECTORY) { const k = cityKey(c); if (!CITY_MAP.has(k)) CITY_MAP.set(k, []); CITY_MAP.get(k).push(c); }
const CITY_LIST = [...CITY_MAP.entries()].map(([key, list]) => ({ key, city: list[0].city, state: list[0].state, stateName: list[0].stateName, list: list.slice().sort((a, b) => a.name.localeCompare(b.name)) }))
  .sort((a, b) => a.city.localeCompare(b.city));
function cityPage(key) {
  const g = CITY_LIST.find((x) => x.key === key);
  if (!g) return notFound();
  const n = g.list.length;
  const title = `${n === 1 ? "Church" : "Churches"} in ${g.city}, ${g.state} – Service Times & Addresses | ${SITE_NAME}`;
  const near = DIRECTORY.filter((c) => cityKey(c) !== key && c.lat != null && g.list[0].lat != null)
    .map((c) => ({ c, mi: milesBetween(g.list[0], c) })).filter((x) => x.mi <= 25).sort((a, b) => a.mi - b.mi).slice(0, 6);
  const h = `${crumbs([["Home", "/"], ["Churches", "/churches"], [`${g.city}, ${g.state}`, `/churches/in/${key}`]])}
<h1>${n === 1 ? "Church" : "Churches"} in ${esc(g.city)}, ${esc(g.state)}</h1>
<p class="sub">${n} Bible-preaching ${n === 1 ? "church" : "churches"} listed in ${esc(g.city)}, ${esc(g.stateName)}, with service times, address, pastor, and a link to each church's own website.</p>
<div class="dir">${g.list.map((c) => churchCard(c)).join("")}</div>
${near.length ? `<h2>Churches near ${esc(g.city)}</h2><div class="dir">${near.map((x) => churchCard(x.c, x.mi)).join("")}</div>` : ""}
<p class="slim"><a href="/churches">All churches</a> · <a href="/churches#list-your-church">List your church</a></p>`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: `Churches in ${g.city}, ${g.state}`, url: SITE + `/churches/in/${key}`, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "ItemList", itemListElement: g.list.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: SITE + churchUrl(c) })) } },
    breadcrumbLd([["Home", "/"], ["Churches", "/churches"], [`${g.city}, ${g.state}`, `/churches/in/${key}`]]),
  ]);
  return ok(shell({ title, description: `${n} ${n === 1 ? "church" : "churches"} in ${g.city}, ${g.stateName}: ${g.list.slice(0, 3).map((c) => c.name).join(", ")}${n > 3 ? " and more" : ""}. Service times, addresses, phone numbers and websites. Free, no ads.`, canonical: `/churches/in/${key}`, h, jsonld, pageType: "churches", extraCss: CHURCH_CSS, noInvite: true, noindex: n < 2 }));
}

function churchPage(c) {
  const title = churchTitle(c);
  const place = `${c.city}, ${c.stateName}`;
  const main = mainLink(c);
  const nearby = DIRECTORY.filter((x) => x !== c && x.state === c.state)
    .map((x) => ({ x, mi: milesBetween(c, x) }))
    .sort((p, q) => (p.mi ?? 1e9) - (q.mi ?? 1e9) || p.x.city.localeCompare(q.x.city)).slice(0, 5);
  const social = Object.entries(c.social || {}).map(([k, u]) => `<a class="btn" href="${attr(u)}" target="_blank" rel="noopener">${{ facebook: "Facebook", instagram: "Instagram", youtube: "YouTube" }[k] || k}</a>`).join("");
  const extra = [...(c.website && c.sermons ? [["Sermons", c.sermons]] : []), ...(c.links || [])].map(([n, u]) => `<a class="btn" href="${attr(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join("");
  const facts = [c.kjv && `<span class="kjv-b"><b>King James Bible</b></span>`, c.affiliation && `<span><b>${esc(c.affiliation)}</b></span>`, c.worship && `<span>${esc(c.worship)} worship</span>`, c.founded && `<span>Founded <b>${c.founded}</b></span>`].filter(Boolean).join("");
  const times = c.services.length
    ? `<table class="times">${c.services.map((s) => `<tr><td class="t">${esc([s.day, s.time].filter(Boolean).join(" "))}</td><td>${esc(s.label)}</td></tr>`).join("")}</table>`
    : c.planting
      ? `<div class="info"><p>No regular service times yet. ${esc(c.name)} is gathering people first and meeting in homes and coffee shops. Join the interest list on the church website to hear the location and times first.</p></div>`
      : c.timesNote
        ? `<div class="info"><p>${esc(c.timesNote)}</p></div>`
        : `<div class="info"><p>Service times aren't listed yet.${c.phone ? " Call the church to confirm." : ""}${c.website ? " The church website may have them." : ""}</p></div>`;
  const contact = `<div class="info">
${c.address ? `<p><b>Address:</b> ${esc(addressLine(c.address))} · <a href="${mapsHref(c)}" target="_blank" rel="noopener">Get directions</a></p>` : `<p><b>Location:</b> ${esc(place)} — meeting place not announced yet.</p>`}
${c.phone ? `<p><b>Phone:</b> <a href="${telHref(c.phone)}">${esc(c.phone)}</a></p>` : ""}
${c.email ? `<p><b>Email:</b> <a href="mailto:${attr(c.email)}">${esc(c.email)}</a></p>` : ""}
${c.pastor ? `<p><b>Pastor:</b> ${esc(c.pastor)}</p>` : ""}
${c.website ? `<p><b>Website:</b> <a href="${attr(c.website)}" target="_blank" rel="noopener">${esc(hostOf(c.website))}</a></p>` : ""}
</div>`;
  const bar = [c.phone && `<a href="${telHref(c.phone)}" data-cta="church-call-bar">Call</a>`, c.address && `<a href="${mapsHref(c)}" target="_blank" rel="noopener" data-cta="church-directions-bar">Directions</a>`, main && `<a class="go" href="${attr(main.href)}" target="_blank" rel="noopener" data-cta="${main.cta}-bar">${main.short}</a>`].filter(Boolean);
  const h = `${crumbs([["Home", "/"], ["Churches", "/churches"], [c.stateName, `/churches#${c.state.toLowerCase()}`], [`${c.city}, ${c.state}`, cityUrl(c)], [c.name, churchUrl(c)]])}
<h1>${esc(title)}</h1>
<p class="sub">${esc(place)}${c.county ? ` · ${esc(c.county)}` : ""}${c.tagline ? `<br>${esc(c.tagline)}` : ""}</p>
${facts ? `<div class="facts">${facts}</div>` : ""}
<div class="actions">${main ? `<a class="btn primary" href="${attr(main.href)}" target="_blank" rel="noopener" data-cta="${main.cta}">${esc(main.label)}</a>` : ""}${c.address ? `<a class="btn" href="${mapsHref(c)}" target="_blank" rel="noopener" data-cta="church-directions">Directions</a>` : ""}${c.phone ? `<a class="btn" href="${telHref(c.phone)}" data-cta="church-call">Call</a>` : ""}</div>
<h2>Service times</h2>
${times}
<h2>Visit</h2>
${contact}
<h2>About ${esc(c.name)}</h2>
<div class="about"><p>${esc(c.about)}</p></div>
${c.ministries?.length ? `<h2>Ministries</h2><ul class="outline">${c.ministries.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
${social || extra ? `<h2>Online</h2><div class="actions">${social}${extra}</div>` : ""}
${nearby.length ? `<h2>Churches nearby</h2><div class="dir">${nearby.map(({ x, mi }) => churchCard(x, mi)).join("")}</div>` : ""}
<p class="fine">Details from ${esc(c.source || "the church's website")}, checked ${esc(c.checked || "October 2026")}. Times change, so confirm with the church before you visit. Is this your church? <a href="/churches?fix=${encodeURIComponent(c.slug)}&n=${encodeURIComponent(c.name)}&c=${encodeURIComponent(c.city)}#list-your-church">Send a correction</a> or <a href="/churches?fix=${encodeURIComponent(c.slug)}&n=${encodeURIComponent(c.name)}&c=${encodeURIComponent(c.city)}&remove=1#list-your-church">ask us to remove this page</a>. <a href="/churches">All churches</a></p>
<p class="slim">Free King James Bible online and in the app: <a href="/bible">read on the web</a> · <a href="${appHref()}" data-cta="church-ios">get the iPhone app</a></p>
${bar.length ? `<nav class="cbar" aria-label="Contact ${attr(c.name)}">${bar.join("")}</nav>` : ""}`;
  const church = {
    "@type": "Church", "@id": SITE + churchUrl(c) + "#church", name: c.name, url: c.website || SITE + churchUrl(c), description: c.about,
    ...(c.address ? { address: { "@type": "PostalAddress", streetAddress: c.address.street, addressLocality: c.address.city, addressRegion: c.address.state, ...(c.address.zip ? { postalCode: c.address.zip } : {}), addressCountry: "US" } }
      : { address: { "@type": "PostalAddress", addressLocality: c.city, addressRegion: c.state, addressCountry: "US" } }),
    ...(c.lat != null ? { geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng } } : {}),
    ...(c.phone ? { telephone: "+1" + c.phone.replace(/\D/g, "") } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(c.founded ? { foundingDate: String(c.founded) } : {}),
    ...(c.pastor ? { employee: { "@type": "Person", name: c.pastor.replace(/^Pastor\s+/, ""), jobTitle: "Pastor" } } : {}),
    ...((c.social || c.sermons) ? { sameAs: [...Object.values(c.social || {}), ...(c.sermons ? [c.sermons] : [])] } : {}),
  };
  const jsonld = webPageLd([
    { "@type": "WebPage", name: `${c.name} – ${place}`, url: SITE + churchUrl(c), isPartOf: { "@id": SITE + "/#website" }, about: { "@id": church["@id"] } },
    church,
    breadcrumbLd([["Home", "/"], ["Churches", "/churches"], [c.name, churchUrl(c)]]),
  ]);
  const sun = c.services.filter((s) => s.day === "Sunday").map((s) => `${s.label} ${s.time}`).join(", ");
  const timesBit = sun ? `Service times: ${sun}. ` : c.timesNote ? `Service times: ${c.timesNote} ` : "";
  const description = c.planting
    ? `${c.name} is a new church forming in ${place}. ${c.tagline} Contact, social links, and how to join the interest list.`
    : `${c.name} in ${place}${c.address ? ` (${c.address.street})` : ""}. ${timesBit}${c.pastor ? c.pastor + ". " : ""}Address, phone, directions, and ${c.website ? "website" : "sermons"}.`;
  return ok(shell({ title: c.planting ? `${c.name} – A New Church in ${c.city}, ${c.state} | ${SITE_NAME}` : `${title} – ${c.city}, ${c.state} | Service Times, Address & Website`, description: description.length > 300 ? description.slice(0, 297).replace(/\s+\S*$/, "") + "..." : description, canonical: churchUrl(c), h, jsonld, pageType: "church", ref: c.slug, extraCss: CHURCH_CSS, noInvite: true }));
}

/* ------------------------------------------------------------------ search */
/**
 * Loose reference parser for the search box: "john 3:16", "John 3 16", "jn 3:16-18",
 * "psalm 23", "1 john", "1john4:8" → { book, chapter?, from?, to? } or null.
 */
function parseLooseRef(q) {
  const m = /^\s*(\d?\s*[a-z]+(?:\s+(?:of\s+)?[a-z]+)*)\.?\s*(?:(\d+)(?:\s*[:.,\s]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?)?\s*$/i.exec(q);
  if (!m) return null;
  const book = findBook(m[1].replace(/\s+/g, "-"));
  if (!book) return null;
  if (!m[2]) return { book };
  const chapter = +m[2];
  if (chapter < 1 || chapter > book.chapters.length) return null;
  if (!m[3]) return { book, chapter };
  const len = book.chapters[chapter - 1].length;
  const from = +m[3], to = m[4] ? Math.min(+m[4], len) : from;
  if (from < 1 || from > len || to < from) return { book, chapter };
  return { book, chapter, from, to };
}

const STOP = new Set(["the", "and", "of", "a", "to", "in", "that", "he", "shall", "unto", "for", "i", "his", "is", "be", "not", "they", "him", "with", "it", "all", "thou", "thy", "was", "my", "them", "which", "me", "you", "ye", "as", "have", "from", "but", "are", "this", "their", "were", "on", "or", "by", "an", "will", "so", "we", "our", "us"]);
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function searchVerses(q, limit = 50) {
  const phrase = q.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
  const words = phrase.split(" ").filter((w) => w && !STOP.has(w));
  const terms = words.length ? words : phrase.split(" ").filter(Boolean);
  if (!terms.length) return { hits: [], terms: [] };
  const res = new RegExp(terms.map((t) => `\\b${escRe(t)}`).join("|"), "gi");
  const wordRes = terms.map((t) => new RegExp(`\\b${escRe(t)}`, "i"));
  const hits = [];
  for (const b of books()) b.chapters.forEach((ch, ci) => ch.forEach((v, vi) => {
    const t = v;
    if (!wordRes.every((re) => re.test(t))) return;
    const lower = t.toLowerCase();
    const score = (lower.includes(phrase) ? 100 : 0) + terms.length * 10 - Math.min(t.length / 40, 8);
    hits.push({ b, c: ci + 1, v: vi + 1, t, score });
  }));
  hits.sort((x, y) => y.score - x.score || x.b.index - y.b.index || x.c - y.c || x.v - y.v);
  return { hits: hits.slice(0, limit), total: hits.length, terms, res };
}

function searchPage(qRaw) {
  const q = plain(String(qRaw || "")).slice(0, 120);
  const form = `<form class="search big" action="/bible/search" role="search"><input type="search" name="q" value="${attr(q)}" placeholder="Search a verse, topic, or word…" aria-label="Search" enterkeyhint="search" autocapitalize="none" autocorrect="off"${q ? "" : " autofocus"}><button type="submit">Search</button></form>`;
  const noindexPage = (title, h, description = "Search the King James Bible by verse, topic, or word.") =>
    ({ status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
      body: shell({ title, description, canonical: "/bible/search", h, jsonld: webPageLd([{ "@type": "SearchResultsPage", name: title, url: SITE + "/bible/search" }]), noindex: true, pageType: "search", ref: q, hideSearch: true }) });

  if (!q) {
    const h = `${crumbs([["Home", "/"], ["Search", "/bible/search"]])}<h1>Search the Bible <span class="badge">${VERSION}</span></h1>
<p class="sub">Type a reference (John 3:16, Psalm 23, 1 John 4:8), a topic (anxiety, marriage, funerals), or any word or phrase.</p>${form}
<h2>Popular topics</h2><div class="chips">${FEATURED_TOPICS.map((s) => TOPIC_BY_SLUG.get(s)).filter(Boolean).map((t) => `<a href="/verses-about/${t.slug}">${esc(t.name)}</a>`).join("")}<a href="/verses-about">All ${TOPICS.length} topics →</a></div>${promo()}`;
    return noindexPage(`Search the Bible (KJV) | ${SITE_NAME}`, h);
  }

  // 1. A reference → go straight there.
  const r = parseLooseRef(q);
  if (r) {
    if (r.from) return found(verseUrl(r.book, r.chapter, r.from, r.to));
    if (r.chapter) return found(chapterUrl(r.book, r.chapter));
    return found(bookUrl(r.book));
  }
  // 2. An exact topic name/slug → go straight there.
  const slugQ = q.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const exact = TOPIC_BY_SLUG.get(slugQ) || TOPIC_BY_SLUG.get(slugQ.replace(/^(bible-)?verses?-(about|for|on)-/, ""));
  if (exact) return found(`/verses-about/${exact.slug}`);

  // 3. Full-text: matching topics + verses containing every word.
  const qWords = q.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w && !STOP.has(w));
  const topicHits = TOPICS.filter((t) => { const hay = `${t.name} ${t.aliases.join(" ")}`.toLowerCase().replace(/-/g, " "); return qWords.some((w) => hay.includes(w)); }).slice(0, 10);
  const { hits, total = 0, res } = searchVerses(q);
  const mark = (t) => esc(t).replace(res, (m) => `<mark>${m}</mark>`);
  const gaSearch = `<script>if(typeof gtag==='function')gtag('event','view_search_results',{search_term:${js(q)},results:${total}});</script>`;
  const h = `${crumbs([["Home", "/"], ["Search", "/bible/search"], [q, "/bible/search"]])}<h1 style="font-size:26px">Results for “${esc(q)}” <span class="badge">${VERSION}</span></h1>
<p class="sub">${total ? `${total.toLocaleString()} verse${total === 1 ? "" : "s"} contain${total === 1 ? "s" : ""} ${qWords.length > 1 ? "all of those words" : "that word"}${total > hits.length ? ` — showing the first ${hits.length}` : ""}.` : "No verses contain every word you typed. Try fewer words, or a reference like John 3:16."}</p>${form}
${topicHits.length ? `<h2>Topics</h2><div class="chips">${topicHits.map((t) => `<a href="/verses-about/${t.slug}">${esc(topicPhrase(t))}</a>`).join("")}</div>` : ""}
${hits.length ? `<h2>Verses</h2><div class="results">${hits.map(({ b, c, v, t }) => `<div class="topicv"><p class="r"><a href="${verseUrl(b, c, v)}">${esc(refLabel(b, c, v))}</a></p><blockquote>${mark(plain(t))}</blockquote></div>`).join("")}</div>` : ""}
${gaSearch}${promo()}`;
  return noindexPage(`“${q}” – Bible search results (KJV) | ${SITE_NAME}`, h, `Bible verses containing “${q}” in the King James Version.`);
}

/* ------------------------------------------------------------------ sitemaps */
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p]) => `<url><loc>${SITE}${u}</loc>${p ? `<priority>${p}</priority>` : ""}</url>`).join("\n")}\n</urlset>`;

/* ------------------------------------------------------------------ stats */
/**
 * Counted facts about the text: how long each book is, which chapter is the
 * longest, how long the whole thing takes to read.
 *
 * Worth building because "how long is ephesians" already ranks at 5.9 and "how
 * long is luke in the bible" at 8.0, both answered by a single line in a book
 * page's FAQ, while the bare book names sit at 30-75. The head term is not
 * winnable; the questions around it are. And unlike most sites quoting these
 * numbers, we are counting them rather than repeating them.
 *
 * Reading time assumes 200 words a minute, which is ordinary silent reading,
 * and is always given as "about" — word counts shift with how you treat
 * hyphens and numerals, so a precise figure would be false precision.
 */
const ordinal = (n) => {
  const t = n % 100;
  return `${n}${t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
};
const WPM = 200;
const wordsIn = (t) => (plain(t).match(/[A-Za-z0-9’'-]+/g) || []).length;
const readingTime = (words) => {
  const mins = Math.round(words / WPM);
  if (mins < 60) return `about ${mins} minute${mins === 1 ? "" : "s"}`;
  const h = Math.floor(mins / 60), rem = mins % 60;
  return `about ${h} hour${h === 1 ? "" : "s"}${rem >= 5 ? ` and ${rem} minutes` : ""}`;
};

let _bookStats;
function bookStats(b) {
  if (!_bookStats) _bookStats = new Map();
  if (_bookStats.has(b.slug)) return _bookStats.get(b.slug);
  let verses = 0, words = 0, longest = null, shortest = null;
  b.chapters.forEach((ch, i) => {
    verses += ch.length;
    for (const t of ch) words += wordsIn(t);
    if (!longest || ch.length > longest[1]) longest = [i + 1, ch.length];
    if (!shortest || ch.length < shortest[1]) shortest = [i + 1, ch.length];
  });
  const out = { chapters: b.chapters.length, verses, words, longest, shortest, minutes: Math.round(words / WPM) };
  _bookStats.set(b.slug, out);
  return out;
}

let _bibleStats;
function bibleStats() {
  if (_bibleStats) return _bibleStats;
  const bs = books();
  const per = bs.map((b) => ({ b, ...bookStats(b) }));
  const sum = (k) => per.reduce((a, x) => a + x[k], 0);
  const by = (k, dir) => [...per].sort((x, y) => (dir === "desc" ? y[k] - x[k] : x[k] - y[k]));
  let longestCh = null, shortestCh = null, shortestV = null, longestV = null;
  for (const b of bs) {
    b.chapters.forEach((ch, ci) => {
      if (!longestCh || ch.length > longestCh[2]) longestCh = [b, ci + 1, ch.length];
      if (!shortestCh || ch.length < shortestCh[2]) shortestCh = [b, ci + 1, ch.length];
      ch.forEach((t, vi) => {
        const n = wordsIn(t);
        if (!shortestV || n < shortestV[3]) shortestV = [b, ci + 1, vi + 1, n];
        if (!longestV || n > longestV[3]) longestV = [b, ci + 1, vi + 1, n];
      });
    });
  }
  _bibleStats = {
    books: bs.length, chapters: sum("chapters"), verses: sum("verses"), words: sum("words"),
    ot: per.filter((x) => x.b.testament === "OT"), nt: per.filter((x) => x.b.testament === "NT"),
    longestBook: by("words", "desc")[0], shortestBook: by("words", "asc")[0],
    mostChapters: by("chapters", "desc")[0], fewestVerses: by("verses", "asc")[0],
    longestCh, shortestCh, shortestV, longestV, per,
  };
  return _bibleStats;
}

function bibleStatsPage() {
  const s = bibleStats();
  const canonical = "/bible-statistics";
  const vref = (x) => `<a href="${verseUrl(x[0], x[1], x[2], x[2])}">${esc(refLabel(x[0], x[1], x[2], x[2]))}</a>`;
  const cref = (x) => `<a href="${chapterUrl(x[0], x[1])}">${esc(chapterLabel(x[0], x[1]))}</a>`;
  const bref = (x) => `<a href="${bookUrl(x.b)}">${esc(x.b.name)}</a>`;
  const otWords = s.ot.reduce((a, x) => a + x.words, 0), ntWords = s.nt.reduce((a, x) => a + x.words, 0);

  const rows = [
    ["Books", `${s.books}`], ["Chapters", s.chapters.toLocaleString()], ["Verses", s.verses.toLocaleString()],
    ["Words", `about ${s.words.toLocaleString()}`], ["Time to read it all", readingTime(s.words)],
  ];
  const faqs = [
    ["How many books are in the Bible?", `66 — 39 in the Old Testament and 27 in the New.`],
    ["How many chapters are in the Bible?", `${s.chapters.toLocaleString()}, counted across all 66 books.`],
    ["How many verses are in the Bible?", `${s.verses.toLocaleString()} in the King James Version. Other translations divide a handful of verses differently, so the figure can vary by a few.`],
    ["How long does it take to read the Bible?", `${readingTime(s.words)} of reading at an ordinary pace of about ${WPM} words a minute. Spread over a year that is roughly eleven minutes a day.`],
    ["What is the longest book in the Bible?", `${s.longestBook.b.name}, at about ${s.longestBook.words.toLocaleString()} words across ${s.longestBook.chapters} chapters.`],
    ["What is the shortest book in the Bible?", `${s.shortestBook.b.name}, at about ${s.shortestBook.words} words. By verse count ${s.fewestVerses.b.name} is shorter, with ${s.fewestVerses.verses} verses to ${s.shortestBook.b.name}'s ${s.shortestBook.verses} — which is why the two are both called the shortest, depending on what is being counted.`],
    ["What is the longest chapter in the Bible?", `${chapterLabel(s.longestCh[0], s.longestCh[1])}, with ${s.longestCh[2]} verses.`],
    ["What is the shortest chapter in the Bible?", `${chapterLabel(s.shortestCh[0], s.shortestCh[1])}, with ${s.shortestCh[2]} verses.`],
    ["What is the shortest verse in the Bible?", `${refLabel(s.shortestV[0], s.shortestV[1], s.shortestV[2], s.shortestV[2])} — "${plain(s.shortestV[0].chapters[s.shortestV[1] - 1][s.shortestV[2] - 1])}" — ${s.shortestV[3]} words in the King James Version.`],
    ["What is the longest verse in the Bible?", `${refLabel(s.longestV[0], s.longestV[1], s.longestV[2], s.longestV[2])}, at about ${s.longestV[3]} words.`],
    ["Which book has the most chapters?", `${s.mostChapters.b.name}, with ${s.mostChapters.chapters}.`],
  ];

  const table = (list) => `<table class="times"><tr><th>Book</th><th>Chapters</th><th>Verses</th><th>Reading time</th></tr>${list.map((x) => `<tr><td class="t"><a href="${bookUrl(x.b)}">${esc(x.b.name)}</a></td><td>${x.chapters}</td><td>${x.verses.toLocaleString()}</td><td>${esc(readingTime(x.words))}</td></tr>`).join("")}</table>`;

  const h = `${crumbs([["Home", "/"], ["Bible statistics", canonical]])}
<h1>Bible Statistics <span class="badge">KJV</span></h1>
<p class="lead">How many books, chapters, verses and words are in the Bible, which chapter is longest, and how long the whole thing takes to read. Every number here is counted from the King James text on this site rather than quoted from somewhere else.</p>
<p class="facts">${rows.map(([k, v]) => `<span>${esc(k)}: <b>${esc(v)}</b></span>`).join("")}</p>
<h2>The extremes</h2>
<ul class="outline">
<li><span>Longest book</span> ${bref(s.longestBook)} — about ${s.longestBook.words.toLocaleString()} words</li>
<li><span>Shortest book</span> ${bref(s.shortestBook)} — about ${s.shortestBook.words} words</li>
<li><span>Fewest verses</span> ${bref(s.fewestVerses)} — ${s.fewestVerses.verses} verses</li>
<li><span>Most chapters</span> ${bref(s.mostChapters)} — ${s.mostChapters.chapters}</li>
<li><span>Longest chapter</span> ${cref(s.longestCh)} — ${s.longestCh[2]} verses</li>
<li><span>Shortest chapter</span> ${cref(s.shortestCh)} — ${s.shortestCh[2]} verses</li>
<li><span>Shortest verse</span> ${vref(s.shortestV)} — ${s.shortestV[3]} words</li>
<li><span>Longest verse</span> ${vref(s.longestV)} — about ${s.longestV[3]} words</li>
</ul>
<h2>Old Testament and New</h2>
<p class="facts"><span>Old Testament: <b>${s.ot.length} books</b></span><span><b>${otWords.toLocaleString()}</b> words</span><span><b>${esc(readingTime(otWords))}</b></span></p>
<p class="facts"><span>New Testament: <b>${s.nt.length} books</b></span><span><b>${ntWords.toLocaleString()}</b> words</span><span><b>${esc(readingTime(ntWords))}</b></span></p>
<h2>Every book, longest to shortest</h2>
${table([...s.per].sort((a, b2) => b2.words - a.words))}
<h2>Common questions</h2><div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
${promo()}`;

  const description = `The Bible has 66 books, ${s.chapters.toLocaleString()} chapters and ${s.verses.toLocaleString()} verses — about ${s.words.toLocaleString()} words, or ${readingTime(s.words)} of reading. Longest and shortest book, chapter and verse, with a reading time for all 66 books. Counted from the King James text.`;
  const jsonld = webPageLd([
    { "@type": "WebPage", name: "Bible statistics", url: SITE + canonical, description, isPartOf: { "@id": SITE + "/#website" } },
    { "@type": "FAQPage", "@id": SITE + canonical + "#faq",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    breadcrumbLd([["Home", "/"], ["Bible statistics", canonical]]),
  ]);
  return ok(shell({ title: `Bible Statistics: Books, Chapters, Verses and Reading Time | ${SITE_NAME}`, description, canonical, h, jsonld, pageType: "bible-stats" }));
}

/* ------------------------------------------------------------- bible words */
/**
 * /bible-words — the King James English a modern reader does not know, or
 * thinks they know and does not.
 *
 * "circumspectly bible definition" already ranks at 6.7 with no page built for
 * it. Strong's covers the Hebrew and Greek; this covers the English. The
 * entries that earn the section are not the obsolete ones — a reader knows to
 * look up "habergeon" — but the words that are still current and have changed
 * sides, where nobody thinks to look anything up at all.
 *
 * Counts and verses come from seo/data/archaic.json, built from the text. Where
 * a word kept both senses the page shows chosen verses and says so, rather than
 * listing every occurrence under a heading only some of them belong to.
 */
const WORD_BY_SLUG = new Map(WORDS.map((w) => [w.word.replace(/ /g, "-"), w]));
const wordUrl = (w) => `/bible-words/${w.word.replace(/ /g, "-")}`;
const KIND_LABEL = {
  drifted: "Still in use, different meaning",
  obsolete: "No longer in ordinary English",
  loan: "Left in Hebrew, Aramaic or Greek",
};

function bibleWordPage(w) {
  const e = archaicIndex()[w.word];
  if (!e) return notFound();
  const bs = books();
  const refs = e.refs.map(([bi, c, v]) => [bs[bi], c, v]).filter(([b, c, v]) => b && b.chapters[c - 1] && b.chapters[c - 1][v - 1]);
  const first = refs[0];
  const lex = strongsIndex();
  const behind = e.strongs.map(([id, c]) => [id, lex[id], c]).filter(([, x]) => x);
  const times = (n) => `${n} time${n === 1 ? "" : "s"}`;

  const faqs = [
    [`What does "${w.word}" mean in the Bible?`,
     `In the King James Version ${w.word} means ${w.sense}. ${w.note}`],
    [`How many times does "${w.word}" appear in the King James Version?`,
     `${e.n} ${e.n === 1 ? "time" : "times"}${e.forms.length > 1 ? `, counting its other forms (${e.forms.map(([f, c]) => `${f} ${times(c)}`).join(", ")})` : ""}.`],
    ...(behind.length ? [[`What ${behind[0][0][0] === "H" ? "Hebrew" : "Greek"} word is behind "${w.word}"?`,
      `Most often ${behind[0][1].lemma}${behind[0][1].xlit ? ` (${behind[0][1].xlit})` : ""}, Strong's ${behind[0][0]}${behind[0][1].def ? `, meaning ${behind[0][1].def}` : ""}.`]] : []),
  ];

  const related = WORDS.filter((o) => o !== w && o.kind === w.kind).slice(0, 8);
  const h = `${crumbs([["Home", "/"], ["Bible words", "/bible-words"], [w.word, wordUrl(w)]])}
<h1>${esc(w.word)} <span class="badge">${esc(w.sense)}</span></h1>
<p class="lead">${esc(w.note)}</p>
<p class="facts"><span>Means: <b>${esc(w.sense)}</b></span><span>In the KJV: <b>${esc(times(e.n))}</b></span><span>${esc(KIND_LABEL[w.kind])}</span></p>
${e.forms.length > 1 ? `<h2>Forms in the text</h2><div class="chips tally">${e.forms.map(([f, c]) => `<span><b>${esc(f)}</b> ${c}&times;</span>`).join("")}</div>` : ""}
${behind.length ? `<h2>The word behind it</h2>
<div class="books">${behind.map(([id, x, c]) => `<a href="${strongsUrl(id)}">${esc(x.lemma)} <small>&middot; ${esc(id)}${x.def ? ` &middot; ${esc(snippet(x.def, 40))}` : ""} &middot; ${c}&times;</small></a>`).join("")}</div>` : ""}
${refs.length ? `<h2>Where it appears</h2>
<p class="sub">${e.picked
  ? `${esc(w.word)} appears ${esc(times(e.n))} in the King James Version, mostly in the sense it still carries today. These are the places where it means ${esc(w.sense)}.`
  : (e.verses > refs.length ? `The first ${refs.length} of ${e.verses} verses.` : `All ${refs.length} verse${refs.length === 1 ? "" : "s"}.`)}</p>
<div>${refs.map(([b, c, v]) => `<div class="topicv"><p class="r"><a href="${verseUrl(b, c, v, v)}">${esc(refLabel(b, c, v, v))}</a></p><blockquote>${verseHtml(b.chapters[c - 1][v - 1])}</blockquote></div>`).join("")}</div>` : ""}
<h2>Common questions</h2><div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
${related.length ? `<h2>More like this</h2><div class="chips">${related.map((o) => `<a href="${wordUrl(o)}">${esc(o.word)}</a>`).join("")}</div>` : ""}
<p style="font-size:14px;margin-top:20px"><a href="/bible-words">All ${WORDS.length} words &rarr;</a> &middot; <a href="/strongs">Strong's concordance</a></p>
${promo(first ? first[0] : undefined, first ? first[1] : undefined, first ? first[2] : undefined)}`;

  const description = `"${w.word}" in the King James Bible means ${w.sense}. ${snippet(w.note, 150)} Appears ${times(e.n)}, with the verses quoted in full.`;
  const jsonld = webPageLd([
    { "@type": "DefinedTerm", "@id": SITE + wordUrl(w) + "#term", name: w.word, description: w.sense,
      inDefinedTermSet: { "@type": "DefinedTermSet", name: "King James Bible words", url: SITE + "/bible-words" } },
    { "@type": "WebPage", name: `${w.word} — meaning in the King James Bible`, url: SITE + wordUrl(w), description, isPartOf: { "@id": SITE + "/#website" } },
    { "@type": "FAQPage", "@id": SITE + wordUrl(w) + "#faq",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    breadcrumbLd([["Home", "/"], ["Bible words", "/bible-words"], [w.word, wordUrl(w)]]),
  ]);
  return ok(shell({ title: `What does ${w.word} mean in the Bible? (KJV) | ${SITE_NAME}`, description, canonical: wordUrl(w), h, jsonld, pageType: "bible-word", ref: w.word }));
}

function bibleWordsIndex() {
  const idx = archaicIndex();
  const groups = ["drifted", "loan", "obsolete"].map((k) => [k, WORDS.filter((w) => w.kind === k && idx[w.word])]);
  const h = `${crumbs([["Home", "/"], ["Bible words", "/bible-words"]])}
<h1>${WORDS.length} King James Words and What They Mean <span class="badge">KJV</span></h1>
<div class="meaning"><p>The English of 1611 is not the English of now. Some of these words have simply gone — nobody owns a habergeon any more. The dangerous ones are the words still in daily use that have quietly changed sides: <b>let</b> meant to hinder, <b>prevent</b> meant to go before, and a reader who does not know that will get the verse exactly backwards and never think to check.</p></div>
${groups.map(([k, list]) => list.length ? `<h2>${esc(KIND_LABEL[k])}</h2>
<div class="books">${list.map((w) => `<a href="${wordUrl(w)}">${esc(w.word)} <small>&middot; ${esc(w.sense)}</small></a>`).join("")}</div>` : "").join("")}
<p style="font-size:14px;margin-top:20px"><a href="/strongs">The Hebrew and Greek behind the King James &rarr;</a> &middot; <a href="/king-james-bible">How the translation was made</a></p>
${promo()}`;
  const description = `${WORDS.length} words from the King James Bible explained — what they meant in 1611, the Hebrew or Greek behind them, and every verse they appear in. Including the ones that still exist and have changed meaning: let, prevent, charity, conversation, suffer, quick.`;
  const jsonld = webPageLd([
    { "@type": "DefinedTermSet", "@id": SITE + "/bible-words#set", name: "King James Bible words", url: SITE + "/bible-words", description },
    { "@type": "CollectionPage", name: "King James Bible words", url: SITE + "/bible-words", description, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "ItemList", numberOfItems: WORDS.length, itemListElement: WORDS.map((w, i) => ({ "@type": "ListItem", position: i + 1, name: w.word, url: SITE + wordUrl(w) })) } },
    breadcrumbLd([["Home", "/"], ["Bible words", "/bible-words"]]),
  ]);
  return ok(shell({ title: `${WORDS.length} King James Bible Words and What They Mean | ${SITE_NAME}`, description, canonical: "/bible-words", h, jsonld, pageType: "bible-words-index" }));
}

/* --------------------------------------------------------------- kjv story */
/** /king-james-bible — where the translation we quote on every page came from. */
function kjvPage() {
  const canonical = "/king-james-bible";
  const h = `${crumbs([["Home", "/"], ["The King James Bible", canonical]])}
<h1>The King James Bible <span class="badge">1611</span></h1>
<p class="lead">Commissioned by a king who wanted the marginal notes gone, translated by six committees over seven years, and still the most widely read English Bible four centuries later.</p>
<p class="facts">${KJV_FACTS.map(([k, v]) => `<span>${esc(k)}: <b>${esc(v)}</b></span>`).join("")}</p>
${KJV_SECTIONS.map((sec) => `<h2>${esc(sec.h)}</h2>${sec.p.map((para) => `<p>${esc(para)}</p>`).join("")}`).join("")}
<h2>Common questions</h2><div class="faq">${KJV_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
<h2>Read it</h2>
<div class="actions"><a class="btn primary" href="/bible" data-cta="kjv-read">All 66 books</a><a class="btn" href="/verse-of-the-day" data-cta="kjv-votd">Verse of the day</a><a class="btn" href="/strongs" data-cta="kjv-strongs">The words behind it</a></div>
${promo()}`;
  const description = "The King James Bible, explained: commissioned at Hampton Court in 1604, translated by six companies of scholars and published in 1611. Who made it, what they translated from, how much of it is Tyndale's, and why today's text is not the 1611 text.";
  const jsonld = webPageLd([
    { "@type": "Article", "@id": SITE + canonical + "#article", headline: "The King James Bible: how it was made",
      description, url: SITE + canonical, isPartOf: { "@id": SITE + "/#website" },
      about: { "@type": "Book", name: "The Holy Bible, King James Version" } },
    { "@type": "FAQPage", "@id": SITE + canonical + "#faq",
      mainEntity: KJV_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    breadcrumbLd([["Home", "/"], ["The King James Bible", canonical]]),
  ]);
  return ok(shell({ title: `The King James Bible: Who Wrote It, When, and Why | ${SITE_NAME}`,
    description, canonical, h, jsonld, pageType: "kjv-story" }));
}

/* ----------------------------------------------------------------- strongs */
/**
 * Strong's concordance pages: /strongs/g26, /strongs/h7965.
 *
 * People really do search raw Strong's numbers. In 28 days of Search Console,
 * "h5239", "h5971", "h6777", "h7776" and "h444 meaning" all drew impressions and
 * ranked between 5 and 36 on pages that were never built for them. There are
 * 14,197 of these entries, the lexicon is public domain, and the KJV text in this
 * repo is already tagged with the numbers — so each page can carry the word, what
 * it means, every way the King James translators rendered it, and the verses it
 * stands in. That last part is the reason to build it: a definition alone is a
 * dictionary stub, and the web has those.
 *
 * Counts come from seo/data/strongs.json, built by seo/build-strongs.mjs from the
 * tagged text, and the page says so rather than implying an authority it does not
 * have.
 */
const strongsId = (raw) => {
  const m = /^([ghGH])\s*0*(\d{1,4})$/.exec(String(raw || "").trim());
  return m ? `${m[1].toUpperCase()}${m[2]}` : null;
};
const strongsUrl = (id) => `/strongs/${id.toLowerCase()}`;
const strongsLang = (id) => (id[0] === "H" ? "Hebrew" : "Greek");

function strongsPage(id) {
  const e = strongsIndex()[id];
  if (!e) return notFound();
  const lang = strongsLang(id);
  const bs = books();
  const refs = e.refs.map(([bi, c, v]) => [bs[bi], c, v]).filter(([b]) => b);
  const first = refs[0];
  const top = e.kjv.length ? e.kjv[0][0] : null;
  const total = e.kjv.reduce((a, [, c]) => a + c, 0);

  const chips = [
    ["Word", e.lemma],
    e.xlit ? ["Transliteration", e.xlit] : null,
    e.pron ? ["Said", e.pron] : null,
    ["Language", lang],
    ["In the KJV", e.n ? `${e.n} verse${e.n === 1 ? "" : "s"}` : "not tagged in this text"],
  ].filter(Boolean);

  // "love (69), loved (32), loveth (19)" — how the translators actually rendered it.
  const renderings = e.kjv.map(([w, c]) => `<span><b>${esc(w)}</b> ${c}&times;</span>`).join("");

  const near = [];
  const num = +id.slice(1);
  for (let d = -3; d <= 3; d++) {
    if (!d) continue;
    const o = strongsIndex()[`${id[0]}${num + d}`];
    if (o && o.lemma) near.push([`${id[0]}${num + d}`, o]);
  }

  const faqs = [
    [`What does Strong's ${id} mean?`,
     `${id} is the ${lang} word ${e.lemma}${e.xlit ? ` (${e.xlit})` : ""}${e.def ? `, meaning ${e.def}` : ""}.`],
    e.kjv.length ? [`How is ${id} translated in the King James Version?`,
      `The King James translators rendered it ${e.kjv.slice(0, 5).map(([w, c]) => `${w} (${c} time${c === 1 ? "" : "s"})`).join(", ")}${e.kjv.length > 5 ? ", among others" : ""}.`] : null,
    e.n ? [`How many times does ${id} appear in the Bible?`,
      `${e.lemma}${e.xlit ? ` (${e.xlit})` : ""} is tagged in ${e.n} verse${e.n === 1 ? "" : "s"} of the King James Version in this edition's word index.`] : null,
    e.derivation ? [`Where does ${id} come from?`, `Strong's gives its derivation as: ${e.derivation}.`] : null,
  ].filter(Boolean);

  const h = `${crumbs([["Home", "/"], ["Strong's concordance", "/strongs"], [id, strongsUrl(id)]])}
<h1><span style="font-size:1.15em">${esc(e.lemma)}</span> <span class="badge">${esc(id)}</span></h1>
<p class="sub">${esc(id)} is the ${esc(lang)} word ${esc(e.lemma)}${e.xlit ? `, transliterated ${esc(e.xlit)}` : ""}${e.pron ? ` and said ${esc(e.pron)}` : ""}.${top ? ` The King James Version most often renders it <b>${esc(top)}</b>.` : ""}</p>
<div class="chips">${chips.map(([k, v]) => `<span><b>${esc(k)}:</b> ${esc(v)}</span>`).join("")}</div>
${e.def ? `<h2>What it means</h2><div class="meaning"><p>${esc(e.def)}.</p></div>` : ""}
${e.derivation ? `<h2>Where it comes from</h2><p class="sub">${esc(e.derivation)}.</p>` : ""}
${e.kjv.length ? `<h2>How the King James Version translates it</h2>
<p class="sub">Across ${total.toLocaleString()} tagged occurrence${total === 1 ? "" : "s"}, counted from this edition's word index.</p>
<div class="chips tally">${renderings}</div>` : ""}
${e.kjvDef ? `<p class="note">Strong's own list of renderings: ${esc(e.kjvDef)}.</p>` : ""}
${refs.length ? `<h2>Verses using ${esc(e.lemma)}</h2>
<p class="sub">${e.n > refs.length ? `The first ${refs.length} of ${e.n} verses` : `All ${refs.length} verse${refs.length === 1 ? "" : "s"}`}, quoted in full.</p>
<div>${refs.map(([b, c, v]) => `<div class="topicv"><p class="r"><a href="${verseUrl(b, c, v, v)}">${esc(refLabel(b, c, v, v))}</a> <span style="font-weight:400;color:var(--brown-light)">&middot; ${VERSION}</span></p><blockquote>${verseHtml(b.chapters[c - 1][v - 1])}</blockquote></div>`).join("")}</div>`
: `<p class="sub">This entry is in Strong's lexicon but is not tagged anywhere in the King James text used here, so there are no verses to show.</p>`}
<h2>Common questions</h2><div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
${near.length ? `<h2>Nearby entries</h2><div class="books">${near.map(([oid, o]) => `<a href="${strongsUrl(oid)}">${esc(oid)} <small>&middot; ${esc(o.lemma)}${o.def ? ` — ${esc(snippet(o.def, 44))}` : ""}</small></a>`).join("")}</div>` : ""}
<p style="font-size:14px;margin-top:20px"><a href="/strongs">Strong's concordance &rarr;</a></p>
${promo(first ? first[0] : undefined, first ? first[1] : undefined, first ? first[2] : undefined)}`;

  const description = `Strong's ${id}: ${e.lemma}${e.xlit ? ` (${e.xlit})` : ""}, ${lang}${e.def ? ` — ${e.def}` : ""}.${e.kjv.length ? ` Translated ${e.kjv.slice(0, 4).map(([w]) => w).join(", ")} in the KJV.` : ""}${e.n ? ` Appears in ${e.n} verse${e.n === 1 ? "" : "s"}, quoted in full.` : ""}`;
  const jsonld = webPageLd([
    { "@type": "DefinedTerm", "@id": SITE + strongsUrl(id) + "#term", name: e.lemma, termCode: id,
      description: e.def || undefined, inDefinedTermSet: { "@type": "DefinedTermSet", name: "Strong's Exhaustive Concordance of the Bible" } },
    { "@type": "WebPage", name: `Strong's ${id} — ${e.lemma}`, url: SITE + strongsUrl(id), description, isPartOf: { "@id": SITE + "/#website" } },
    { "@type": "FAQPage", "@id": SITE + strongsUrl(id) + "#faq",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    breadcrumbLd([["Home", "/"], ["Strong's concordance", "/strongs"], [id, strongsUrl(id)]]),
  ]);
  return ok(shell({ title: `Strong's ${id}: ${e.lemma}${e.xlit ? ` (${e.xlit})` : ""} — Meaning and Verses | ${SITE_NAME}`,
    description, canonical: strongsUrl(id), h, jsonld, pageType: "strongs", ref: id }));
}

/** /strongs — the hub, and the only page that links into 14,197 others. */
function strongsHub() {
  const idx = strongsIndex();
  const all = Object.keys(idx);
  const heb = all.filter((k) => k[0] === "H").length;
  const grk = all.length - heb;
  // A handful of words worth landing on, rather than H1 through H24.
  const featured = ["H7965", "H2617", "H539", "H3068", "H7307", "H5315",
                    "G26", "G4102", "G5485", "G1515", "G3056", "G4151"];
  const h = `${crumbs([["Home", "/"], ["Strong's concordance", "/strongs"]])}
<h1>Strong's Concordance <span class="badge">${all.length.toLocaleString()} words</span></h1>
<div class="meaning"><p>Every Hebrew and Greek word behind the King James Version, numbered as Strong's numbered them in 1890. Each entry gives the word itself, how it is said, where it comes from, every way the King James translators rendered it with a count of each, and the verses it stands in — quoted in full.</p></div>
<div class="chips"><span><b>Hebrew &amp; Aramaic:</b> H1&ndash;H${heb.toLocaleString()}</span><span><b>Greek:</b> G1&ndash;G${grk.toLocaleString()}</span></div>
<h2>Words worth starting with</h2>
<div class="books">${featured.map((id) => { const e = idx[id]; return e ? `<a href="${strongsUrl(id)}">${esc(e.lemma)} <small>&middot; ${esc(id)}${e.kjv.length ? ` &middot; ${esc(e.kjv[0][0])}` : ""}</small></a>` : ""; }).join("")}</div>
<h2>Looking one up</h2>
<p class="sub">Entries live at <code>/strongs/h7965</code> and <code>/strongs/g26</code> — the letter for the language, then the number. You can also tap any word while reading to see the word behind it.</p>
<div class="actions"><a class="btn primary" href="/bible/john/3/16" data-cta="strongs-read">Read a chapter and tap a word</a><a class="btn" href="/bible-names">Bible names and meanings</a></div>
${promo()}`;
  const description = `Strong's Concordance for the King James Version — all ${all.length.toLocaleString()} Hebrew, Aramaic and Greek words, each with its meaning, pronunciation, derivation, every KJV rendering with counts, and the verses it appears in.`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: "Strong's Concordance", url: SITE + "/strongs", description, isPartOf: { "@id": SITE + "/#website" } },
    breadcrumbLd([["Home", "/"], ["Strong's concordance", "/strongs"]]),
  ]);
  return ok(shell({ title: `Strong's Concordance (KJV) — All ${all.length.toLocaleString()} Hebrew and Greek Words | ${SITE_NAME}`,
    description, canonical: "/strongs", h, jsonld, pageType: "strongs-hub" }));
}

function sitemapIndex() {
  const maps = ["/sitemaps/pages.xml", "/sitemaps/strongs-hebrew.xml", "/sitemaps/strongs-greek.xml",
    ...books().map((b) => `/sitemaps/verses-${b.slug}.xml`)];
  return xml(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps.map((m) => `<sitemap><loc>${SITE}${m}</loc></sitemap>`).join("\n")}\n</sitemapindex>`);
}
function sitemapFile(name) {
  if (name === "pages") {
    const urls = [["/", "1.0"], ["/bible", "0.9"], ["/verses-about", "0.9"], ["/verse-of-the-day", "0.8"], ["/privacy", "0.3"], ["/terms", "0.3"]];
    for (const t of TOPICS) urls.push([`/verses-about/${t.slug}`, "0.8"]);
    urls.push(["/churches", "0.8"]);
    for (const g of CITY_LIST) if (g.list.length > 1) urls.push([`/churches/in/${g.key}`, "0.7"]);
    for (const c of DIRECTORY) urls.push([churchUrl(c), "0.7"]);
    urls.push(["/strongs", "0.9"], ["/king-james-bible", "0.9"], ["/bible-words", "0.9"], ["/bible-statistics", "0.9"]);
    for (const w of WORDS) urls.push([`/bible-words/${w.word.replace(/ /g, "-")}`, "0.7"]);
    urls.push(["/bible-names", "0.9"], ["/bible-names/boys", "0.8"], ["/bible-names/girls", "0.8"]);
    for (const n of NAMES) urls.push([`/bible-names/${n.name.toLowerCase()}`, "0.7"]);
    for (const b of books()) { urls.push([bookUrl(b), "0.7"]); b.chapters.forEach((_, i) => urls.push([chapterUrl(b, i + 1), "0.6"])); }
    return xml(urlset(urls));
  }
  const sm = /^strongs-(hebrew|greek)$/.exec(name);
  if (sm) {
    const letter = sm[1] === "hebrew" ? "H" : "G";
    return xml(urlset(Object.keys(strongsIndex()).filter((k) => k[0] === letter).map((k) => [strongsUrl(k), "0.5"])));
  }
  const m = /^verses-(.+)$/.exec(name);
  const b = m && findBook(m[1]);
  if (!b) return notFound();
  const urls = [];
  b.chapters.forEach((ch, ci) => ch.forEach((_, vi) => urls.push([verseUrl(b, ci + 1, vi + 1)])));
  return xml(urlset(urls));
}

/* ------------------------------------------------------------------ router */
export function render(q = {}) {
  const kind = q.kind;
  if (kind === "text") {            // tiny JSON used by the edge OG-image renderer
    const r = parseRef(String(q.ref || ""));
    if (!r) return { status: 404, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Unknown reference" }) };
    return { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=31536000" },
      body: JSON.stringify({ label: refLabel(r.book, r.chapter, r.from, r.to), text: plain(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" ")) }) };
  }
  if (kind === "sitemap-index") return sitemapIndex();
  if (kind === "sitemap") return sitemapFile(String(q.file || "").replace(/\.xml$/, ""));
  if (kind === "topics") return topicsIndex();
  if (kind === "votd") return votdPage();
  if (kind === "churches") return churchesIndex();
  if (kind === "churchcity") return cityPage(String(q.city || "").toLowerCase());
  if (kind === "church") {
    const slug = String(q.slug || "").toLowerCase();
    const c = CHURCH_BY_SLUG.get(slug);
    return c ? churchPage(c) : notFound();
  }
  if (kind === "names") return namesIndex();
  if (kind === "name") {
    const raw = String(q.name || "").toLowerCase();
    if (raw === "boys") return namesList("boy");
    if (raw === "girls") return namesList("girl");
    const n = NAME_BY_SLUG.get(raw);
    return n ? namePage(n) : notFound();
  }
  if (kind === "kjv") return kjvPage();
  if (kind === "stats") return bibleStatsPage();
  if (kind === "words") {
    const raw = String(q.word || "").toLowerCase();
    if (!raw) return bibleWordsIndex();
    const w = WORD_BY_SLUG.get(raw);
    return w ? bibleWordPage(w) : notFound();
  }
  if (kind === "strongs") {
    const raw = String(q.id || "");
    if (!raw) return strongsHub();
    const id = strongsId(raw);
    if (!id) return notFound();
    // /strongs/G26 and /strongs/g0026 both settle on /strongs/g26.
    return raw !== id.toLowerCase() ? redirect(strongsUrl(id)) : strongsPage(id);
  }
  if (kind === "search") return searchPage(q.q);
  if (kind === "topic") {
    const slug = String(q.topic || "").toLowerCase();
    const t = TOPIC_BY_SLUG.get(slug);
    if (!t) return notFound();
    if (t.slug !== slug) return redirect(`/verses-about/${t.slug}`);
    return topicPage(t);
  }
  if (kind === "bible") return bibleIndex();
  const b = findBook(q.book);
  if (!b) return notFound();
  const rawBook = String(q.book).toLowerCase();
  if (kind === "book") return rawBook === b.slug ? bookPage(b) : redirect(bookUrl(b));
  const c = parseInt(q.chapter, 10);
  if (!Number.isInteger(c) || c < 1 || c > b.chapters.length) return notFound();
  if (kind === "chapter") return rawBook === b.slug && String(c) === String(q.chapter) ? chapterPage(b, c) : redirect(chapterUrl(b, c));
  if (kind === "verse") {
    const m = /^(\d+)(?:-(\d+))?$/.exec(String(q.verse || ""));
    if (!m) return notFound();
    const from = +m[1], to = m[2] ? +m[2] : from;
    const len = b.chapters[c - 1].length;
    if (from < 1 || from > len || to < from) return notFound();
    const clampedTo = Math.min(to, len);
    const canon = verseUrl(b, c, from, clampedTo);
    if (rawBook !== b.slug || String(c) !== String(q.chapter) || clampedTo !== to) return redirect(canon);
    return versePage(b, c, from, clampedTo);
  }
  return notFound();
}
