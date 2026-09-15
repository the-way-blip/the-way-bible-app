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
let _books, _xrefs, _lex, _words, _titles, _bySlug, _byName, _verseTopics, _commentary;
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
const appChapterUrl = (b, c, v) => `/read/${encodeURIComponent(b.name)}/${c}${v ? `?verse=${v}` : ""}`;
const refLabel = (b, c, from, to) => `${b.name === "Psalms" ? "Psalm" : b.name} ${c}:${from}${to && to !== from ? `-${to}` : ""}`;
const chapterLabel = (b, c) => `${b.name === "Psalms" ? "Psalm" : b.name} ${c}`;
const refLink = (ref) => {
  const r = parseRef(ref);
  return r ? `<a href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a>` : esc(ref);
};

/* ------------------------------------------------------------------ shell */
const CSS = `
:root{--cream:#faf7f2;--cream-dark:#f0ebe3;--parchment:#f5f0e8;--brown:#5c4033;--brown-light:#806252;--gold:#c9a84c;--gold-dark:#a8862f;--paper:#fdfbf7;--line:#e6dfd3}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--cream);color:var(--brown);font:16px/1.6 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--gold-dark);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
header.top{border-bottom:1px solid var(--line);background:var(--paper)}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;min-height:56px;gap:12px;flex-wrap:wrap;padding-top:8px;padding-bottom:8px}
form.search{display:flex;flex:1;min-width:180px;max-width:360px;margin:0 auto}
form.search input{flex:1;min-width:0;border:1px solid var(--line);border-right:0;border-radius:9px 0 0 9px;padding:8px 12px;font:14px Inter,system-ui,sans-serif;color:var(--brown);background:var(--cream)}
form.search input:focus{outline:none;border-color:var(--gold)}
form.search button{border:1px solid var(--gold);background:var(--gold);color:#fff;border-radius:0 9px 9px 0;padding:0 12px;font-size:16px;cursor:pointer}
form.search.big{max-width:none;margin:0 0 22px}form.search.big input{font-size:16px;padding:12px 14px}form.search.big button{padding:0 18px;font:600 15px Inter,system-ui,sans-serif}
mark{background:#fff3b0;color:inherit;padding:0 2px;border-radius:3px}
@media(max-width:640px){form.search{order:3;flex-basis:100%;max-width:none}}
.brand{display:flex;align-items:center;gap:10px;color:var(--brown);font-weight:700;letter-spacing:-.01em}
.brand img{width:28px;height:28px;border-radius:7px}
nav.main{display:flex;gap:18px;font-size:14px}nav.main a{color:var(--brown-light)}
nav.main .cta{background:var(--gold);color:#fff;padding:7px 12px;border-radius:8px;font-weight:600}
nav.main .cta:hover{text-decoration:none;background:var(--gold-dark)}
.appbar{background:var(--brown);color:#fff}
.appbar .wrap{display:flex;align-items:center;gap:12px;padding-top:10px;padding-bottom:10px;font-size:14px}
.appbar img{width:36px;height:36px;border-radius:9px;flex:none}
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
.commentary p{margin:0 0 .6em;font-size:15px;line-height:1.65}.commentary .cite{margin:0;font-size:13px;color:var(--brown-light);font-style:italic}
ul.refs{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px 14px;font-size:15px}
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

function shell({ title, description, canonical, h, jsonld, ogImage, noindex, pageType = "bible-other", ref = "" }) {
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
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand" href="/"><img src="/icon-192.png" alt="" width="28" height="28">TheWay Bible</a>
<form class="search" action="/bible/search" role="search"><input type="search" name="q" placeholder="Search verse, topic, or word" aria-label="Search the Bible"><button type="submit" aria-label="Search">⌕</button></form>
<nav class="main"><a href="/bible">Read</a><a href="/verses-about">Topics</a><a href="/verse-of-the-day" class="hide">Verse of the day</a></nav>
</div></header>
<div class="appbar"><div class="wrap"><img src="/icon-192.png" alt="" width="36" height="36"><div class="t"><b>TheWay Bible for iPhone</b><span>Study, memorize, journal, and pray — free.</span></div><a class="cta" href="${appHref()}" data-cta="appbar-ios">Get the iOS app</a></div></div>
<main><div class="wrap">
${h}
</div></main>
<footer class="bottom"><div class="wrap">
<span>© ${new Date().getFullYear()} TheWay Bible App · Scripture text: ${VERSION_LONG} (public domain)</span>
<span><a href="/bible">Bible</a> · <a href="/verses-about">Topics</a> · <a href="/verse-of-the-day">Verse of the day</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="mailto:hello@thewaybible.app">Contact</a></span>
</div></footer>
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
<div class="chips">${TOPICS.slice(0, 24).map((t) => `<a href="/verses-about/${t.slug}">${esc(t.name)}</a>`).join("")}<a href="/verses-about">All topics →</a></div>
${promo()}`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: "The Holy Bible, King James Version", url: SITE + "/bible", isPartOf: { "@id": SITE + "/#website" } },
    breadcrumbLd([["Home", "/"], ["Bible", "/bible"]]),
  ]);
  return ok(shell({ title: `Read the Bible Online (KJV) – All 66 Books | ${SITE_NAME}`, description: "Read the complete King James Version online, free. Every chapter and verse of all 66 books, with cross references, context, and Greek and Hebrew key words.", canonical: "/bible", h, jsonld, pageType: "bible-index" }));
}

function bookPage(b) {
  const verseCount = b.chapters.reduce((n, c) => n + c.length, 0);
  const popular = [];
  for (const t of TOPICS) for (const ref of t.verses) { const r = parseRef(ref); if (r && r.book === b && !popular.some((p) => p.ref === ref)) popular.push({ ref, r }); }
  const grid = `<div class="grid">${b.chapters.map((_, i) => `<a href="${chapterUrl(b, i + 1)}">${i + 1}</a>`).join("")}</div>`;
  const prev = books()[b.index - 1], next = books()[b.index + 1];
  const h = `${crumbs([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)]])}
<h1>${esc(b.name)} <span class="badge">${VERSION}</span></h1>
<p class="sub">${b.testament === "OT" ? "Old" : "New"} Testament · ${b.chapters.length} chapter${b.chapters.length === 1 ? "" : "s"} · ${verseCount.toLocaleString()} verses</p>
<div class="actions"><a class="btn primary" href="${chapterUrl(b, 1)}" data-cta="book-start-reading">Start reading ${esc(chapterLabel(b, 1))}</a><a class="btn" href="${appChapterUrl(b, 1)}" data-cta="book-open-app">Open in the app</a></div>
<h2>Chapters</h2>${grid}
${popular.length ? `<h2>Well-known verses in ${esc(b.name)}</h2><div class="topicv">${popular.slice(0, 10).map(({ ref, r }) => `<p class="r"><a href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a></p><blockquote>${verseHtml(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" "))}</blockquote>`).join("")}</div>` : ""}
<div class="pn"><span>${prev ? `<a href="${bookUrl(prev)}">← ${esc(prev.name)}</a>` : ""}</span><span>${next ? `<a href="${bookUrl(next)}">${esc(next.name)} →</a>` : ""}</span></div>
${promo(b, 1)}`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: `${b.name} (KJV)`, url: SITE + bookUrl(b), isPartOf: { "@id": SITE + "/#website" }, about: { "@type": "Book", name: `The Book of ${b.name}`, isPartOf: { "@type": "Book", name: "The Holy Bible, King James Version" } } },
    breadcrumbLd([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)]]),
  ]);
  return ok(shell({ title: `${b.name} (KJV) – Read All ${b.chapters.length} Chapters Online | ${SITE_NAME}`, description: `Read the Book of ${b.name} in the King James Version — all ${b.chapters.length} chapters and ${verseCount.toLocaleString()} verses online, free, with cross references and word studies on every verse.`, canonical: bookUrl(b), h, jsonld, pageType: "bible-book", ref: b.name }));
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

  const h = `${crumbs([["Home", "/"], ["Bible", "/bible"], [b.name, bookUrl(b)], [chapterLabel(b, c), chapterUrl(b, c)], [label, verseUrl(b, c, from, to)]])}
<h1>${esc(label)} <span class="badge">${VERSION}</span></h1>
<p class="sub">${esc(b.name)} · chapter ${c}${single ? ` · verse ${from}` : ` · verses ${from}–${to}`} · King James Version</p>
${scripture}
<div class="actions"><a class="btn primary" href="${appChapterUrl(b, c, from)}" data-cta="verse-study-app">Study in the app</a><a class="btn" href="${chapterUrl(b, c)}#${from}" data-cta="verse-read-chapter">Read ${esc(chapterLabel(b, c))} in full</a><a class="btn" href="/api/og?ref=${encodeURIComponent(label)}" data-cta="verse-share-image" download="${attr(label.replace(/[: ]/g, "-"))}.png">Share image</a></div>
<h2>${esc(label)} in context</h2><div class="ctx">${context}</div>
<p style="font-size:14px"><a href="${chapterUrl(b, c)}">Read all of ${esc(chapterLabel(b, c))} →</a></p>
${commentary ? `<h2>Commentary</h2><div class="commentary"><p>${esc(commentary.excerpt)}</p><p class="cite">— Matthew Henry's Concise Commentary${commentary.range && commentary.range !== String(from) ? ` on verses ${esc(commentary.range)}` : ""}</p></div>` : ""}
${refs.length ? `<h2>Cross references</h2><ul class="refs">${refs.slice(0, 12).map((r) => `<li>${refLink(r)}</li>`).join("")}</ul>` : ""}
${words.length ? `<h2>Key words (Strong's)</h2><ul class="words">${words.map((w) => `<li><b>${esc(w.word)}</b><span class="tr">${esc(w.translit)}</span>${esc(w.def)}<a class="code" href="/word/${w.code}" data-cta="verse-word-study">${w.code} →</a></li>`).join("")}</ul>` : ""}
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
  ]);
  return ok(shell({ title, description, canonical, h, jsonld, ogImage: `${SITE}/api/og?ref=${encodeURIComponent(label)}`, pageType: "bible-verse", ref: label }));
}

function topicsIndex() {
  const h = `${crumbs([["Home", "/"], ["Verses by topic", "/verses-about"]])}
<h1>Bible verses by topic <span class="badge">${VERSION}</span></h1>
<p class="sub">${TOPICS.length} topics. Each page lists the verses in full, in the King James Version, with a link to read every one in context.</p>
<div class="books">${TOPICS.map((t) => `<a href="/verses-about/${t.slug}">${esc(t.name)} <small>· ${t.verses.length}</small></a>`).join("")}</div>
${promo()}`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: "Bible verses by topic", url: SITE + "/verses-about", isPartOf: { "@id": SITE + "/#website" } },
    breadcrumbLd([["Home", "/"], ["Verses by topic", "/verses-about"]]),
  ]);
  return ok(shell({ title: `Bible Verses by Topic – ${TOPICS.length} Topics (KJV) | ${SITE_NAME}`, description: `Bible verses by topic in the King James Version: anxiety, strength, love, healing, hope, marriage, forgiveness, and ${TOPICS.length - 7} more. Every verse in full, linked to its chapter.`, canonical: "/verses-about", h, jsonld, pageType: "verses-index" }));
}

/** "Bible verses about Anxiety" / "Bible verses for Weddings" / "Short Bible Verses" — per-topic phrasing. */
const topicPhrase = (t, cap = false) => {
  if (t.heading) return t.heading;
  const prep = t.prep || "about";
  return cap ? `Bible Verses ${prep[0].toUpperCase()}${prep.slice(1)} ${t.name}` : `Bible verses ${prep} ${t.name}`;
};

function topicPage(t) {
  const items = t.verses.map((ref) => ({ ref, r: parseRef(ref) })).filter((x) => x.r);
  const n = items.length;
  const phraseLower = t.heading ? t.heading : `Bible verses ${t.prep || "about"} ${t.name.toLowerCase()}`;
  const list = items.map(({ ref, r }) => `<div class="topicv"><p class="r"><a href="${verseUrl(r.book, r.chapter, r.from, r.to)}">${esc(ref)}</a> <span style="font-weight:400;color:var(--brown-light)">· ${VERSION}</span></p><blockquote>${verseHtml(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" "))}</blockquote></div>`).join("");
  const related = TOPICS.filter((o) => o !== t && o.verses.some((v) => t.verses.includes(v))).slice(0, 8);
  const h = `${crumbs([["Home", "/"], ["Verses by topic", "/verses-about"], [t.name, `/verses-about/${t.slug}`]])}
<h1>${n} ${esc(topicPhrase(t))} <span class="badge">${VERSION}</span></h1>
<p class="sub">Each verse is quoted in full from the King James Version. Tap the reference to read it in context, see cross references, and study the original words.</p>
${list}
${related.length ? `<h2>Related topics</h2><div class="chips">${related.map((o) => `<a href="/verses-about/${o.slug}">${esc(o.name)}</a>`).join("")}</div>` : ""}
<p style="font-size:14px;margin-top:20px"><a href="/verses-about">All ${TOPICS.length} topics →</a></p>
${promo()}`;
  const first = items[0];
  const description = `${n} ${phraseLower} from the King James Version, quoted in full — including ${items.slice(0, 3).map((x) => x.ref).join(", ")}. Read each one in context.`;
  const jsonld = webPageLd([
    { "@type": "CollectionPage", name: topicPhrase(t), url: SITE + `/verses-about/${t.slug}`, description, isPartOf: { "@id": SITE + "/#website" },
      mainEntity: { "@type": "ItemList", numberOfItems: n, itemListElement: items.map(({ ref, r }, i) => ({ "@type": "ListItem", position: i + 1, name: ref, url: SITE + verseUrl(r.book, r.chapter, r.from, r.to) })) } },
    breadcrumbLd([["Home", "/"], ["Verses by topic", "/verses-about"], [t.name, `/verses-about/${t.slug}`]]),
  ]);
  return ok(shell({ title: `${n} ${topicPhrase(t, true)} (KJV) | ${SITE_NAME}`, description, canonical: `/verses-about/${t.slug}`, h, jsonld, ogImage: first ? `${SITE}/api/og?ref=${encodeURIComponent(first.ref)}` : undefined, pageType: "verses-topic", ref: t.name }));
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
  const form = `<form class="search big" action="/bible/search" role="search"><input type="search" name="q" value="${attr(q)}" placeholder="Search a verse, topic, or word…" aria-label="Search" autofocus><button type="submit">Search</button></form>`;
  const noindexPage = (title, h, description = "Search the King James Bible by verse, topic, or word.") =>
    ({ status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
      body: shell({ title, description, canonical: "/bible/search", h, jsonld: webPageLd([{ "@type": "SearchResultsPage", name: title, url: SITE + "/bible/search" }]), noindex: true, pageType: "search", ref: q }) });

  if (!q) {
    const h = `${crumbs([["Home", "/"], ["Search", "/bible/search"]])}<h1>Search the Bible <span class="badge">${VERSION}</span></h1>
<p class="sub">Type a reference (John 3:16, Psalm 23, 1 John 4:8), a topic (anxiety, marriage, funerals), or any word or phrase.</p>${form}
<h2>Popular topics</h2><div class="chips">${TOPICS.slice(0, 30).map((t) => `<a href="/verses-about/${t.slug}">${esc(t.name)}</a>`).join("")}<a href="/verses-about">All ${TOPICS.length} topics →</a></div>${promo()}`;
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
  const h = `${crumbs([["Home", "/"], ["Search", "/bible/search"], [q, "/bible/search"]])}<h1>Search results for “${esc(q)}” <span class="badge">${VERSION}</span></h1>
<p class="sub">${total ? `${total.toLocaleString()} verse${total === 1 ? "" : "s"} contain${total === 1 ? "s" : ""} ${qWords.length > 1 ? "all of those words" : "that word"}${total > hits.length ? ` — showing the first ${hits.length}` : ""}.` : "No verses contain every word you typed. Try fewer words, or a reference like John 3:16."}</p>${form}
${topicHits.length ? `<h2>Topics</h2><div class="chips">${topicHits.map((t) => `<a href="/verses-about/${t.slug}">${esc(topicPhrase(t))}</a>`).join("")}</div>` : ""}
${hits.length ? `<h2>Verses</h2><div class="results">${hits.map(({ b, c, v, t }) => `<div class="topicv"><p class="r"><a href="${verseUrl(b, c, v)}">${esc(refLabel(b, c, v))}</a></p><blockquote>${mark(plain(t))}</blockquote></div>`).join("")}</div>` : ""}
${gaSearch}${promo()}`;
  return noindexPage(`“${q}” – Bible search results (KJV) | ${SITE_NAME}`, h, `Bible verses containing “${q}” in the King James Version.`);
}

/* ------------------------------------------------------------------ sitemaps */
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p]) => `<url><loc>${SITE}${u}</loc>${p ? `<priority>${p}</priority>` : ""}</url>`).join("\n")}\n</urlset>`;

function sitemapIndex() {
  const maps = ["/sitemaps/pages.xml", ...books().map((b) => `/sitemaps/verses-${b.slug}.xml`)];
  return xml(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps.map((m) => `<sitemap><loc>${SITE}${m}</loc></sitemap>`).join("\n")}\n</sitemapindex>`);
}
function sitemapFile(name) {
  if (name === "pages") {
    const urls = [["/", "1.0"], ["/bible", "0.9"], ["/verses-about", "0.9"], ["/verse-of-the-day", "0.8"], ["/privacy", "0.3"], ["/terms", "0.3"]];
    for (const t of TOPICS) urls.push([`/verses-about/${t.slug}`, "0.8"]);
    for (const b of books()) { urls.push([bookUrl(b), "0.7"]); b.chapters.forEach((_, i) => urls.push([chapterUrl(b, i + 1), "0.6"])); }
    return xml(urlset(urls));
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
