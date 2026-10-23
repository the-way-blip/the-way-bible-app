#!/usr/bin/env node
// =============================================================================
// build-poems.mjs — builds public/data/poems/poems.json, the devotional-poetry
// anthology for TheWay Bible App.
//
// WHAT IT DOES
//   For every poem in MANIFEST below it
//     1. fetches the PRIMARY text from English Wikisource through the MediaWiki
//        API (action=query&prop=revisions&rvslots=main).  Mainspace pages that
//        transclude a scanned edition (<pages index=… from= to=>) are expanded
//        by fetching each "Page:<index>/<n>" (and its pagequality level);
//        explicit Page: lists ("Page:<index>/<n>#<section>") are used where the
//        poem has no mainspace page of its own;
//     2. strips the wiki markup ({{templates}}, [[links]], <ref>s, ''italics'',
//        drop-capitals, running heads, titles) down to plain verse, keeping the
//        edition's spelling, punctuation, line breaks, stanza breaks and (as
//        2-space steps) its indentation;
//     3. CROSS-CHECKS the words against a second, independent public-domain copy
//        (Project Gutenberg plain text, or the archive.org OCR text of another
//        printed edition) with a word-level LCS diff on spelling-normalised
//        tokens, and prints every differing hunk.  Spelling/punctuation
//        differences are expected and ignored; word differences were resolved
//        by hand and are recorded in each entry's `resolved` list (the `fix`
//        list applies any agreed change to the primary text);
//     4. writes the JSON array (ordered by the author's birth year, then the
//        order of the poems in their collection).
//
// SOURCES (all US public domain: authors dead, poems first published ≤ 1930)
//   primary (Wikisource)                                         cross-check (second independent copy)
//   Herbert    The Temple, 2nd ed. 1633 scan (proofread)          archive.org Cloister Library ed. 1902 OCR
//                                                                 (Easter-wings: Grosart's Aldine ed. 1886 OCR)
//   Donne      Holy Sonnets / Hymn to God my God pages (unsourced Gutenberg #48688 (Grierson 1912, vol. 1)
//              transcriptions); A Hymn to God the Father from the
//              Oxford Book of English Verse (1900) scan
//   Herrick    Hesperides & Noble Numbers vol. 2 (Pollard 1898)    Gutenberg #1211 (Palgrave's selection)
//   Milton     Poems 1645 / Poems 1673 scans (proofread)           Gutenberg #1745 (Beeching's old-spelling text)
//   Bradstreet Campbell, Anne Bradstreet and her Time (1891)       archive.org Hopkins ed. 1897 OCR (+ Ellis 1867)
//   Vaughan    Oxford Book of English Verse (1900) scan            archive.org Chambers ed. vol. 1 (1896) OCR
//   Bunyan     Pilgrim's Progress (Nelson 1902, proofread)         Gutenberg #6048 (Offor's Works)
//   Cowper     Olney Hymns (1840 ed., proofread/validated)         Gutenberg #47790 (Works of Cowper)
//   Keble      The Christian Year (Cassell 1887)                   Gutenberg #4272
//   E.B. Browning  Poems (Routledge 1887, validated)               archive.org Poems (Moxon 1844) OCR — the 1st ed.
//   Tennyson   In Memoriam scan (validated)                        Gutenberg #70950
//   Rossetti   Goblin Market 1862 1st ed. / Poems 1901 scans       Gutenberg #16950
//   Hopkins    Poems 1918 1st ed. scan (validated)                 Gutenberg #22403
//
// RERUN
//   node scripts/build-poems.mjs            # uses the on-disk cache (scripts/.cache/poems)
//   node scripts/build-poems.mjs --refresh  # refetch everything (≤ 2 requests/second)
//   node scripts/build-poems.mjs --only herbert-love-iii   # one poem, verbose diff
//   Output: public/data/poems/poems.json  ·  review log: scripts/.cache/poems/review.txt (the HTTP cache lives there too)
//   Requests use the User-Agent "TheWayBibleApp-build/1.0 (https://thewaybible.app)".
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// ===================== fetching, wikitext → verse, word diff =====================
export const CACHE = process.env.POEMS_CACHE || path.join(path.dirname(fileURLToPath(import.meta.url)), '.cache', 'poems');
fs.mkdirSync(CACHE, { recursive: true });
const UA = 'TheWayBibleApp-build/1.0 (https://thewaybible.app)';
const REFRESH = process.argv.includes('--refresh');

let last = 0;
export async function fetchText(url) {
  const key = crypto.createHash('sha1').update(url).digest('hex');
  const f = path.join(CACHE, key + '.txt');
  if (!REFRESH && fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  for (let i = 0; i < 5; i++) {
    const wait = Math.max(0, last + 600 - Date.now()); // ≤ 2 requests / second
    await new Promise(r => setTimeout(r, wait));
    last = Date.now();
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      const t = await r.text();
      fs.writeFileSync(f, t);
      return t;
    }
    if (r.status === 404) throw new Error('404 ' + url);
    await new Promise(res => setTimeout(res, 2000 * (i + 1)));
  }
  throw new Error('fetch failed ' + url);
}

const API = 'https://en.wikisource.org/w/api.php';
export async function wikitext(title) {
  const u = `${API}?action=query&titles=${encodeURIComponent(title)}&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&redirects=1`;
  const j = JSON.parse(await fetchText(u));
  const p = j.query.pages[0];
  if (p.missing || !p.revisions) throw new Error('missing page ' + title);
  return { title: p.title, text: p.revisions[0].slots.main.content };
}
export const wsUrl = t => 'https://en.wikisource.org/wiki/' + encodeURIComponent(t.replace(/ /g, '_')).replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%2C/g, ',').replace(/%27/g, "'").replace(/%28/g, '(').replace(/%29/g, ')');

// ---------- wikitext → text ----------
function sectionOf(t, name) {
  const q = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const b = t.match(new RegExp(`<section\\s+begin\\s*=\\s*["']?${q}["']?\\s*/?>`, 'i'));
  const e = t.match(new RegExp(`<section\\s+end\\s*=\\s*["']?${q}["']?\\s*/?>`, 'i'));
  if (!b && !e) throw new Error('section not found: ' + name);
  const start = b ? b.index + b[0].length : 0;
  const end = e ? e.index : t.length;
  return t.slice(start, end);
}

// Fetch Page:<index>/<n> and return {text (noinclude stripped), quality}
export async function pageNs(index, n, section) {
  const { text } = await wikitext(`Page:${index}/${n}`);
  const q = +((text.match(/pagequality level="(\d)"/) || [])[1] ?? -1);
  let body = text.replace(/<noinclude>[\s\S]*?<\/noinclude>/g, '');
  if (section) body = sectionOf(body, section);
  else body = body.replace(/<section[^>]*\/>/g, '');
  return { text: body, quality: q, title: `Page:${index}/${n}` };
}

// Resolve a mainspace page into chunks of wikitext: one chunk per transcluded
// Page: (with its proofreading quality), or the page's own text if it has no <pages>.
export async function resolveMain(title) {
  const { text } = await wikitext(title);
  const chunks = [];
  const re = /<pages\s+([^>]*?)\/?>/g;
  let m;
  while ((m = re.exec(text))) {
    const attrs = {};
    for (const a of m[1].matchAll(/(\w+)\s*=\s*("([^"]*)"|'([^']*)'|(\S+))/g)) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5];
    let nums;
    if (attrs.include) nums = attrs.include.split(',').flatMap(x => { const [a, b] = x.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, k) => a + k) : [a]; });
    else { const f = +attrs.from, t = +(attrs.to ?? attrs.from); nums = Array.from({ length: t - f + 1 }, (_, k) => f + k); }
    const from = nums[0], to = nums[nums.length - 1];
    for (const n of nums) {
      const sec = attrs.onlysection ? attrs.onlysection : n === from && attrs.fromsection ? attrs.fromsection : n === to && attrs.tosection ? attrs.tosection : null;
      const p = await pageNs(attrs.index, n, sec);
      chunks.push(p);
    }
  }
  if (!chunks.length) chunks.push({ text, quality: null, title });
  return chunks;
}

const PASS_FIRST = new Set(['tpp', 'li', 'di', 'dropinitial', 'drop initial', 'uc', 'sc', 'smallcaps', 'small-caps', 'larger', 'x-larger', 'xx-larger', 'smaller', 'x-smaller', 'small', 'big', 'nowrap', 'fine', 'bold', 'italic', 'reconstruct', 'sic', 'SIC', 'tooltip', 'abbr', 'u', 'hi', 'hanging indent', 'gr', 'greek', 'fqm', 'sm', 'sans-serif', 'serif', 'blackletter', 'bl', 'black letter', 'resize', 'font-size', 'fs', 'fs85', 'fs90', 'fs120', 'letter-spacing', 'ls1', 'expand', 'spaced', 'em-dash', 'r', 'right', 'float right', 'smaller block', 'larger block', 'block center', 'block centre', 'center block', 'float center', 'fine block', 'bc', 'ppoem', 'poem', 'pline', 'line', 'nobr', 'span', 'bc/s', 'wikisource:', 'italics', 'i', 'b', 'lang', 'lang-el', 'polytonic', 'ditto', 'overline', 'underline', 'ul', 'smallcaps all', 'asc', 'all small caps', 'cap', 'uc-', 'Uc', 'Sc', 'SC', 'x-smaller block']);
const DROP = new Set(['nop', 'rule', 'dhr', 'pb', 'page break', 'clear', 'clearleft', 'clearright', 'anchor', 'anchor+', 'nbsp', 'rh', 'rvh', 'running header', 'header', 'similar', 'other versions', 'versions', 'pd-old', 'author', 'hwe', 'dotted tof line', 'dtpl', 'dotted tof', 'gap', 'custom rule', 'separator', 'smallrefs', 'reflist', 'float left', 'img float', 'figure', 'missing image', 'sidenote', 'left sidenote', 'right sidenote', 'outside l', 'outside r', 'lps', 'rh/2', 'ppoem/s', 'ppoem/e', 'pline/s', 'blank line', 'bl/s', 'ellipsis', 'peh', 'pb/s', 'larger/s', 'larger/e', 'smaller/s', 'smaller/e', 'block center/s', 'block center/e', 'fine block/s', 'fine block/e', 'c/s', 'c/e', 'center/s', 'center/e', 'bc/e', 'float center/s', 'float center/e', 'center block/s', 'center block/e', 'block center/s', 'block center/e', 'continues', 'right', 'margin', 'outside', 'pd-old-80', 'textquality', 'ts', 'table style', 'tooltip/s', 'italic block/s', 'italic block/e', 'em/s']);

// innermost-first template expansion; returns string with markers
//  \u0001<n>\u0001 = em-indent of n,  \u0002 = centred-line marker
function expandTemplates(s, warn) {
  for (let guard = 0; guard < 2000; guard++) {
    const m = s.match(/\{\{([^{}]*)\}\}/);
    if (!m) break;
    const parts = m[1].split('|');
    const name = parts[0].trim();
    const lname = name.toLowerCase();
    const pos = parts.slice(1).filter(p => !/^\s*[\w-]+\s*=/.test(p));
    let rep;
    if (lname === 'em' || lname === 'gap' || lname === 'indent' || lname === 'em/s') rep = `\u0001${parseFloat(pos[0] || (lname === 'gap' ? '2' : '1')) || 1}\u0001`;
    else if (lname === 'ws' || lname === 'word-spacing') rep = pos[pos.length - 1] ?? '';
    else if (/^(defaultsort|displaytitle)\s*:/i.test(name)) rep = '';
    else if (lname === 'hws') rep = (pos[1] ?? pos[0] ?? '');
    else if (lname === 'hwe') rep = '';
    else if (lname === 'ls') rep = 's';
    else if (lname === 'lang' || lname === 'lang block') rep = pos[pos.length - 1] ?? '';
    else if (['c', 'center', 'centre', 'csc'].includes(lname)) rep = '\n\u0002' + pos.join('|').replace(/\n/g, ' ') + '\n';
    else if (DROP.has(lname) || lname.startsWith('rule') || lname.startsWith('dhr')) rep = '';
    else if (PASS_FIRST.has(lname) || PASS_FIRST.has(name)) {
      if (lname === 'tpp') rep = '\u0003' + pos.slice(1).join('|') + '\u0004';
      else if (lname === 'ppoem' || lname === 'poem') {
        const kv = Object.fromEntries(parts.slice(1).filter(p => /^\s*[\w-]+\s*=/.test(p)).map(p => p.split('=').map(x => x.trim())));
        rep = '\u0003' + (kv.start === 'stanza' ? '\u0007' : '') + pos.join('|') + (kv.end === 'stanza' ? '\u0007' : '') + '\u0004';
      }
      else if (['di', 'dropinitial', 'drop initial', 'li'].includes(lname)) rep = '\u0005' + (pos[0] ?? '');
      else if (lname === 'sic' && pos.length > 1) rep = pos[0];
      else if (lname === 'tooltip' || lname === 'abbr') rep = pos[0] ?? '';
      else rep = pos.join('|');
    } else {
      warn?.(`unknown template {{${m[1].slice(0, 60)}}}`);
      rep = pos[0] ?? '';
    }
    s = s.slice(0, m.index) + rep + s.slice(m.index + m[0].length);
  }
  return s;
}

// wikitext (already resolved) → array of {indent:number, text} lines with '' for stanza breaks
export function wikitextToLines(raw, { warn, keepCentered = false } = {}) {
  let s = raw;
  s = s.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<section[^>]*\/>/g, '');
  s = s.replace(/\[\[(?:Category|File|Image):[^\]]*\]\]/gi, '');
  s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1');
  s = s.replace(/<br\s*\/?>[ \t]*\n?/gi, '\n');
  // <poem> blocks → markers
  s = s.replace(/<poem[^>]*>/gi, '\u0003').replace(/<\/poem>/gi, '\u0004');
  s = expandTemplates(s, warn);
  // drop initial followed by a capital second letter (1633 'LOrd', 'HAving') → normal case
  s = s.replace(/\u0005([A-Z])([A-Z]+)(?=[a-z'’]|\b)/g, (m, a, b) => a + b.toLowerCase()).replace(/\u0005/g, '');
  s = s.replace(/'''/g, '').replace(/''/g, '');
  s = s.replace(/<\/?(span|small|big|sup|sub|div|p|b|i|u|em|strong|font|center|tt|s|abbr|nowiki)[^>]*>/gi, '');
  s = s.replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&thinsp;|&#8201;|&hairsp;/g, '');
  // If poem markers exist, keep only text inside them
  if (s.includes('\u0003')) {
    const blocks = [];
    let depth = 0, cur = '';
    for (const ch of s) {
      if (ch === '\u0003') { if (depth === 0) cur = ''; depth++; continue; }
      if (ch === '\u0004') { depth = Math.max(0, depth - 1); if (depth === 0) blocks.push(cur); continue; }
      if (depth > 0) cur += ch;
    }
    if (depth > 0) blocks.push(cur); // unterminated (start=follow across pages)
    s = blocks.map(b => b.replace(/^[ \t]*\n+|\n+[ \t]*$/g, '')).join('\n');
    s = s.replace(/\u0007/g, '\n\n');
  }
  const out = [];
  for (let line of s.split('\n')) {
    if (/^\s*\u0002/.test(line) && !keepCentered) continue; // centred → title / number / ornament; drop
    if (/^\s*(<>|>>)/.test(line) && !keepCentered) continue; // ppoem centred / right-aligned line → heading
    line = line.replace(/\u0002/g, '');
    let indent = 0;
    line = line.replace(/^\s*\d+\s*<<<\s*/, '').replace(/^\s*<<<\s*/, ''); // ppoem hanging verse numbers (hymn-books)
    const cm = line.match(/^(:+)/); if (cm) { indent += cm[1].length * 2; line = line.slice(cm[1].length); }
    let m2;
    while ((m2 = line.match(/^(\s*)\u0001([\d.]+)\u0001/))) { indent += m2[1].length / 2 + parseFloat(m2[2]); line = line.slice(m2[0].length); }
    const sp = line.match(/^( +)/); if (sp) { indent += sp[1].length / 2; }
    line = line.replace(/\u0001[\d.]+\u0001/g, ' ').replace(/[\u0001-\u0005]/g, '').replace(/[ \t]+/g, ' ').trim();
    if (!line) { out.push(''); continue; }
    out.push({ indent, text: line });
  }
  // collapse blank runs, trim
  const res = [];
  for (const l of out) { if (l === '' && res.length && res[res.length - 1] === '') continue; res.push(l); }
  while (res.length && res[res.length - 1] === '') res.pop();
  return res;
}

// chunks: [{lines}] — indentation levels are ranked per chunk (per printed page),
// because proofreaders' em-values differ from page to page.
export function linesToStanzas(chunkLines, { indentTol = 0, flatIndent = false } = {}) {
  const stanzas = [[]];
  for (const lines of chunkLines) {
    const vals = [...new Set(lines.filter(l => l !== '' && l.indent > 0).map(l => l.indent))].sort((a, b) => a - b);
    const lvlOf = new Map(); let lvl = 0, base = -Infinity;
    for (const v of vals) { if (v - base > indentTol) { lvl++; base = v; } lvlOf.set(v, flatIndent ? 1 : lvl); }
    for (const l of lines) {
      if (l === '') { if (stanzas[stanzas.length - 1].length) stanzas.push([]); continue; }
      const lvl = l.indent > 0 ? lvlOf.get(l.indent) : 0;
      stanzas[stanzas.length - 1].push('  '.repeat(lvl) + l.text);
    }
  }
  if (!stanzas[stanzas.length - 1].length) stanzas.pop();
  return stanzas;
}

// ---------- comparison ----------
export function skel(w) {
  return w.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ſ/g, 's').replace(/æ/g, 'ae').replace(/œ/g, 'oe')
    .replace(/[^a-z]/g, '')
    .replace(/v/g, 'u').replace(/[jy]/g, 'i')
    .replace(/e/g, '')
    .replace(/(.)\1+/g, '$1');
}
export function tokens(text) {
  return text.replace(/[‘’`´]/g, "'").split(/[\s—–\-]+/).map(w => w.replace(/^[^A-Za-zÀ-ÿſ]+|[^A-Za-zÀ-ÿſ']+$/g, '').replace(/'/g, '')).filter(Boolean);
}
// Locate the poem in a big comparison text, return the best-aligned window of tokens.
// Anchors on several 8-token runs of the poem (in case its opening differs or is
// mangled by OCR); a `hint` string is tried first, then the whole text.
export function locate(poemTokens, bigText, hint) {
  const P = poemTokens.map(skel);
  const offsets = [0, 8, 16, 24].filter(o => o + 4 <= P.length);
  const search = (hay, lim) => {
    const H = tokens(hay); const Hs = H.map(skel);
    let best = { score: -1 };
    for (const off of offsets) {
      const K = Math.min(8, P.length - off);
      for (let i = 0; i < Math.min(Hs.length, lim); i++) {
        let sc = 0;
        for (let k = 0; k < K; k++) if (Hs[i + k] === P[off + k]) sc++;
        if (sc / K > best.score) best = { score: sc / K, start: Math.max(0, i - off), H };
      }
    }
    return best;
  };
  let best = { score: -1 };
  if (hint) {
    const re = new RegExp(hint.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['’]/g, "['’]")).join('\\s+'));
    const m = re.exec(bigText);
    if (m) best = search(bigText.slice(m.index), 6000);
  }
  if (best.score < 0.75) { const b2 = search(bigText, Infinity); if (b2.score > best.score) best = b2; }
  const win = best.H.slice(best.start, best.start + Math.round(P.length * 1.3) + 25);
  return { score: best.score, start: best.start, window: win };
}
// LCS diff on skeletons; returns list of differing hunks {a:[...], b:[...]}
export function diffTokens(A, B) {
  const a = A.map(skel), b = B.map(skel);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hunks = []; let i = 0, j = 0, cur = null;
  const flush = () => { if (cur) { hunks.push(cur); cur = null; } };
  while (i < n && j < m) {
    if (a[i] === b[j]) { flush(); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { (cur ??= { at: i, a: [], b: [] }).a.push(A[i]); i++; }
    else { (cur ??= { at: i, a: [], b: [] }).b.push(B[j]); j++; }
  }
  flush();
  // trailing: poem tokens left unmatched
  if (i < n) hunks.push({ at: i, a: A.slice(i), b: [] });
  return { hunks, matched: dp[0][0], total: n };
}
// trim the comparison window to end where the poem ends (drop trailing b-only hunk)
export function compare(poemText, bigText, hint) {
  const P = tokens(poemText);
  const loc = locate(P, bigText, hint);
  const d = diffTokens(P, loc.window);
  // drop the trailing hunk that is only extra comparison text
  const hunks = d.hunks.filter((h, k) => !(k === d.hunks.length - 1 && h.a.length === 0));
  return { anchor: loc.score, matched: d.matched, total: d.total, hunks };
}

// ================================ the anthology ================================

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/data/poems/poems.json');

const TEMPLE = 'The Temple: Sacred Poems and Private Ejaculations';
const M1645 = "Poems of Mr. John Milton, Both English and Latin, Compos'd at several times";
const OBEV = 'Oxford Book of English Verse 1250-1900.djvu';
const GM1862 = 'Goblin Market and Other Poems (1862)';
const R1901 = 'Poems (Rossetti, 1901)';
const HOP = 'Poems of Gerard Manley Hopkins, 1918.djvu';
const EBB = 'Poems Barrett.djvu';
const OLNEY = 'Olney Hymns - 1840.djvu';

const AUTHORS = {
  donne: { author: 'John Donne', lifespan: '1572–1631', born: 1572 },
  herrick: { author: 'Robert Herrick', lifespan: '1591–1674', born: 1591 },
  herbert: { author: 'George Herbert', lifespan: '1593–1633', born: 1593 },
  milton: { author: 'John Milton', lifespan: '1608–1674', born: 1608 },
  bradstreet: { author: 'Anne Bradstreet', lifespan: 'c. 1612–1672', born: 1612 },
  vaughan: { author: 'Henry Vaughan', lifespan: '1621–1695', born: 1621 },
  bunyan: { author: 'John Bunyan', lifespan: '1628–1688', born: 1628 },
  cowper: { author: 'William Cowper', lifespan: '1731–1800', born: 1731 },
  keble: { author: 'John Keble', lifespan: '1792–1866', born: 1792 },
  ebb: { author: 'Elizabeth Barrett Browning', lifespan: '1806–1861', born: 1806 },
  tennyson: { author: 'Alfred Tennyson', lifespan: '1809–1892', born: 1809 },
  rossetti: { author: 'Christina Rossetti', lifespan: '1830–1894', born: 1830 },
  hopkins: { author: 'Gerard Manley Hopkins', lifespan: '1844–1889', born: 1844 },
};

// Cross-check copies
const IA = id => ({ url: `https://archive.org/details/${id}`, text: `https://archive.org/download/${id}/${id}_djvu.txt` });
const PG = id => ({ url: `https://www.gutenberg.org/ebooks/${id}`, text: `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt` });
const HERBERT_CHECK = IA('templeandpriestt00herbiala');
const HINTS = { 'easter-wings': 'Lord, Who createdst man' };
// the 1902 OCR of the sideways-printed Easter-wings is unreadable: use Grosart's 1886 Aldine edition instead
const CHECKS = { 'easter-wings': IA('poeticalworkherb00herbuoft') };

// ---------------------------------------------------------------------------
// MANIFEST.  src: mainspace title, or array of "Page:<index>/<n>[#section]".
// startAt / endAt: substring of the first / last line to keep (for pages that
// carry several poems).  opts: indentTol (merge indents ≤ n em), stanzaSizes
// (re-cut stanzas where the transcription double-spaces every line).
// fix: [from, to] replacements applied to the primary text (each explained in
// `resolved`).  resolved: word-level discrepancies and how they were settled.
// ---------------------------------------------------------------------------
const MANIFEST = [
  // ── John Donne ─────────────────────────────────────────────────────────────
  {
    id: 'donne-holy-sonnet-thou-hast-made-me', a: 'donne', title: 'Holy Sonnet: “Thou hast made me”', year: '1635', collection: 'Holy Sonnets',
    src: 'Holy Sonnets/Holy Sonnet 1', opts: { stanzaSizes: [14] }, check: PG(48688), hint: 'HOLY SONNETS',
    scripture: [], notes: 'Numbered I in Wikisource’s and Grierson’s arrangement of the Holy Sonnets; first printed in the 1635 edition of Donne’s Poems.',
  },
  {
    id: 'donne-holy-sonnet-at-the-round-earths', a: 'donne', title: 'Holy Sonnet: “At the round earth’s imagined corners”', year: '1633', collection: 'Holy Sonnets',
    src: 'Holy Sonnets/Holy Sonnet 7', opts: { stanzaSizes: [14] }, check: PG(48688), hint: "At the round earths imagin'd corners, blow",
    fix: [['dea[r]th', 'dearth']],
    scripture: ['Revelation 7:1', '1 Corinthians 15:52'], notes: 'Holy Sonnet VII.',
  },
  {
    id: 'donne-holy-sonnet-death-be-not-proud', a: 'donne', title: 'Holy Sonnet: “Death, be not proud”', year: '1633', collection: 'Holy Sonnets',
    src: 'Holy Sonnets/Holy Sonnet 10', check: PG(48688), hint: 'HOLY SONNETS',
    scripture: ['1 Corinthians 15:26', '1 Corinthians 15:55', 'Revelation 21:4'], notes: 'Holy Sonnet X.',
  },
  {
    id: 'donne-holy-sonnet-batter-my-heart', a: 'donne', title: 'Holy Sonnet: “Batter my heart”', year: '1633', collection: 'Holy Sonnets',
    src: 'Holy Sonnets/Holy Sonnet 14', check: PG(48688), hint: 'HOLY SONNETS',
    scripture: ['Revelation 3:20'], notes: 'Holy Sonnet XIV. “Three-person’d God” is the Trinity; the closing paradox (only God’s mastery makes the soul free and pure) borrows the Bible’s language of God as husband to his people.',
  },
  {
    id: 'donne-hymn-to-god-my-god-in-my-sickness', a: 'donne', title: 'Hymn to God, my God, in my Sickness', year: '1635', collection: null,
    src: 'Hymn to God, My God, In My Sickness', opts: { stanzaSizes: [5, 5, 5, 5, 5, 5] }, check: PG(48688), hint: 'Hymne to God my God, in my sicknesse',
    scripture: [], notes: 'Traditionally dated to Donne’s serious illness of 1623 (or his last illness, 1631). Per fretum febris: “through the strait of fever.” Anyan, Magellan and Gibraltar are the straits of the old maps; Japhet, Cham (Ham) and Shem are the sons of Noah, from whom the three known continents were said to be peopled.',
  },
  {
    id: 'donne-a-hymn-to-god-the-father', a: 'donne', title: 'A Hymn to God the Father', year: '1633', collection: null,
    src: [`Page:${OBEV}/256`, `Page:${OBEV}/257`], startAt: 'Wilt Thou forgive that sin where I begun', endAt: 'I fear no more.', opts: { stanzaSizes: [6, 6, 6] },
    check: PG(48688), hint: 'Wilt thou forgive that sinne where I begunne',
    resolved: ['l. 8 “made my sins their door” (OBEV 1900, confirmed in Gutenberg #66619’s transcription of OBEV) vs Grierson’s manuscript-based text “made my sinne their doore”: an editorial variant between editions, not a transcription error — kept the primary edition’s reading.'],
    scripture: [], notes: 'Text as printed in The Oxford Book of English Verse (1900). The refrain puns on the poet’s own name (“done” / Donne) and, in the last stanza, on Son / sun.',
  },

  // ── Robert Herrick ─────────────────────────────────────────────────────────
  {
    id: 'herrick-his-litany-to-the-holy-spirit', a: 'herrick', title: 'His Litany, to the Holy Spirit', year: '1648', collection: 'His Noble Numbers',
    src: ['Page:Hesperides Vol 2.djvu/192#41', 'Page:Hesperides Vol 2.djvu/193'], endAt: 'Sweet Spirit, comfort me!', endOccurrence: 12, opts: { stanzaSizes: Array(12).fill(4) },
    check: PG(1211), hint: 'LITANY',
    scripture: [], notes: 'From His Noble Numbers (1648), the sacred poems printed with Hesperides.',
  },
  {
    id: 'herrick-a-thanksgiving-to-god-for-his-house', a: 'herrick', title: 'A Thanksgiving to God, for his House', year: '1648', collection: 'His Noble Numbers',
    src: ['Page:Hesperides Vol 2.djvu/195#47', 'Page:Hesperides Vol 2.djvu/196'], endAt: 'My Christ, by Thee.',
    check: PG(1211), hint: 'Lord, thou hast given me a cell',
    fix: [['Unclipt, unflead', 'Unchipt, unflead']],
    resolved: ['l. 22 “Unclipt” (Pollard 1898, the Wikisource text) vs “Unchipt” (Palgrave 1877, and the 1846, Hazlitt 1869 and Grosart 1876 texts checked on archive.org): adopted “Unchipt” (bread whose crust is not chipped away).'],
    scripture: [], notes: 'Herrick was vicar of Dean Prior in Devon. “Pulse” = beans and peas; “unclipt, unflead” = uncut and unpeeled; “wassail bowls” = spiced ale; “soils my land” = manures my field.',
  },

  // ── George Herbert ─────────────────────────────────────────────────────────
  ...[
    ['the-altar', 'The Altar', 'The Altar', ['Exodus 20:25', 'Luke 19:40'], 'A “pattern poem”: in the 1633 printing the lines are set in the shape of an altar.', { indentTol: 0 }],
    ['redemption', 'Redemption', 'Redemption', [], 'A sonnet told as a parable: the “rich Lord” is God, the new lease is the new covenant bought by Christ’s death.'],
    ['the-agony', 'The Agonie', 'The Agonie', ['Luke 22:44', 'John 19:34'], 'Spelled “Agonie” in 1633: Christ’s agony in Gethsemane and the wine of the Lord’s Supper. “Sound” = fathom, measure the depth of.', null, null,
      ['l. 6 “Yet few there are that sound them” (primary; Grosart’s edition also reads “sound”) vs “found” in the 1902 and 1899 reprints: a long-s misreading in those reprints; “sound” (fathom) continues “measur’d … Fathom’d” — kept the primary.']],
    ['easter', 'Easter', 'Easter', ['Psalm 57:8'], 'The 1633 text prints the closing song (“I got me flowers…”) as part of “Easter”.'],
    ['easter-wings', 'Easter-wings', 'Easter Wings', [], 'A pattern poem: in 1633 each stanza is printed sideways so that the lines form a pair of wings. “Imp” (falconry) = to graft feathers onto a damaged wing.', { indentTol: 0 }],
    ['sin', 'Sinne (I)', 'Sinne', [], 'The first of two poems titled “Sinne” in The Temple.'],
    ['affliction-i', 'Affliction (I)', 'Affliction (I)', [], 'The first of five poems titled “Affliction” in The Temple; a spiritual autobiography.', { indentTol: 2 }, [['Yet left perchance', 'Yet lest perchance']],
      ['l. 49 “Yet left perchance” (Wikisource transcription) vs “Yet lest perchance” (Cloister 1902, Temple 1899 and Grosart texts): the 1633 long-s “leſt” was misread — corrected to “lest”.', 'l. 33 “My mirth and edge was lost” (primary, 1899 and Grosart) vs “age” in the 1902 OCR: OCR/reprint error — kept “edge”.']],
    ['prayer-i', 'Prayer (I)', 'Prayer (I)', [], 'The first of two poems titled “Prayer” — a sonnet of images with no main verb.', null, null, ['l. 12 “The milkie way” (primary, 1899, Grosart) vs “milkie may” in the 1902 OCR: OCR error.']],
    ['jordan-i', 'Jordan (I)', 'Jordan (I)', [], 'The first of two poems titled “Jordan”: a plea for plain, true devotional verse. “Pull for Prime” = draw for a winning hand (a card game).'],
    ['the-windows', 'The Windows', 'The Windows', [], 'On preaching: the preacher is a “brittle crazie glasse” through which Christ’s story shines.'],
    ['virtue', 'Vertue', 'Vertue', [], 'Usually modernised as “Virtue”.'],
    ['the-call', 'The Call', 'The Call', ['John 14:6'], ''],
    ['gratefulness', 'Gratefulnesse', 'Gratefulnesse', [], ''],
    ['the-pulley', 'The Pulley', 'The Pulley', [], 'God withholds “rest” from man so that restlessness may draw him back to God.'],
    ['the-flower', 'The Flower', 'The Flower', ['1 Samuel 2:6'], '', null, [['ground,as', 'ground, as']]],
    ['bitter-sweet', 'Bitter-sweet', 'Bitter-sweet', [], ''],
    ['aaron', 'Aaron', 'Aaron', ['Exodus 28:33-36'], 'Aaron’s high-priestly dress (the golden plate “Holiness to the Lord”, the bells on the robe) is fulfilled in Christ.'],
    ['the-collar', 'The Collar', 'The Collar', [], 'The title puns on a clergyman’s collar, on “choler” (anger) and on “caller”.'],
    ['discipline', 'Discipline', 'Discipline', ['Exodus 15:3', 'Hebrews 4:16'], ''],
    ['the-elixir', 'The Elixer', 'The Elixer', ['Colossians 3:23'], 'Spelled “Elixer” in 1633. The elixir (the alchemists’ “famous stone”) turns base metal to gold.'],
    ['love-iii', 'Love (III)', 'Love (III)', ['Luke 12:37'], '“Love (III)” is the third poem titled “Love” in The Temple, and the last poem of “The Church”.'],
  ].map(([slug, title, page, scripture, notes, opts, fix, resolved]) => ({
    id: 'herbert-' + slug, a: 'herbert', title, year: '1633', collection: 'The Temple', src: `${TEMPLE}/${page}`,
    check: CHECKS[slug] || HERBERT_CHECK, hint: HINTS[slug], scripture, notes, opts: opts || undefined, fix: fix || undefined, resolved,
  })),

  // ── John Milton ────────────────────────────────────────────────────────────
  {
    id: 'milton-on-time', a: 'milton', title: 'On Time', year: '1645', collection: 'Poems (1645)', src: `${M1645}/On Time`,
    check: PG(1745), hint: 'FLY envious Time',
    scripture: [], notes: 'In the Trinity College manuscript Milton noted it was “to be set on a clock-case.” “Individual” = indivisible, inseparable.',
  },
  {
    id: 'milton-at-a-solemn-music', a: 'milton', title: 'At a Solemn Musick', year: '1645', collection: 'Poems (1645)', src: `${M1645}/At a Solemn Musick`,
    check: PG(1745), hint: 'Blest pair of Sirens',
    resolved: ['l. 21 “Broke the fair musick” (1645 scan, validated; also Thurber’s text) vs Beeching’s text (Gutenberg #1745), which omits “Broke”: kept the 1645 reading.', 'l. 6 “pure content” (1645, and Beeching’s 1645 text) vs “pure concent” (Thurber’s modernised Minor Poems, Gutenberg #31706, following Milton’s manuscript): kept the 1645 printed reading.'],
    scripture: ['Revelation 5:13'], notes: 'The “Sirens” are Voice and Verse; “Diapason” = perfect concord.',
  },
  {
    id: 'milton-how-soon-hath-time', a: 'milton', title: 'Sonnet VII: “How soon hath Time”', year: '1645', collection: 'Poems (1645)', src: `${M1645}/Sonnets/Sonnet 7`,
    check: PG(1745), hint: 'How soon hath Time',
    fix: [['My hafting dayes', 'My hasting dayes'], ["blossom shew'd;", "blossom shew'th;"]],
    resolved: ['l. 3 “hafting” in the Wikisource transcription is a long-s misreading of “hasting” (Beeching’s and Thurber’s texts both read “hasting”) — corrected.', 'l. 4 “shew’d” (Wikisource transcription) vs “shew’th” (Beeching’s 1645 text and Thurber): adopted “shew’th”, which the rhyme with youth / truth / indu’th requires.'],
    scripture: [], notes: 'Written about the time of his twenty-third birthday (December 1631); often titled “On His Being Arrived to the Age of Twenty-Three.” “Indu’th” = endueth; “eev’n” = even, equal.',
  },
  {
    id: 'milton-when-i-consider', a: 'milton', title: 'Sonnet XIX: “When I consider how my light is spent”', year: '1673', collection: 'Poems, &c. upon Several Occasions (1673)', src: 'Poems, &c. Upon Several Occasions/Sonnets/Sonnet 16',
    check: PG(1745), hint: 'When I consider how my light',
    fix: [['I fondly ask ;', 'I fondly ask;']],
    scripture: ['Matthew 25:14-30', 'Matthew 11:30'], notes: 'Commonly called “On His Blindness” (a later editor’s title). Numbered XVI in the 1673 edition, XIX in most modern ones.',
  },

  // ── Anne Bradstreet ────────────────────────────────────────────────────────
  {
    id: 'bradstreet-upon-the-burning-of-our-house', a: 'bradstreet', title: 'Upon the Burning of Our House, July 10th, 1666', year: '1867', collection: null,
    src: ['Page:Anne Bradstreet and her time.djvu/350', 'Page:Anne Bradstreet and her time.djvu/351'], opts: { stanzaSizes: Array(9).fill(6) },
    check: IA('mrsannepoems00bradrich'), hint: 'In silent night, when rest I took,',
    fix: [['When coming out, beheld a space,', 'Then coming out, beheld a space,'], ['Thou hast a house on high erect,', 'Thou hast an house on high erect,']],
    resolved: ['l. 11 Campbell (1891) “When coming out” vs “Then coming out” in Hopkins (1897) and in the first printing (Ellis, 1867, checked on its archive.org scan text): adopted “Then”.', 'l. 43 Campbell “Thou hast a house” vs “an house” in Hopkins (1897) and Ellis (1867): adopted “an”.', 'l. 37 “’gin” (Campbell, Ellis) vs “’gan” (Hopkins’s modernised text): kept “’gin”, the 1867 reading.', 'l. 54 “lyes” (Campbell, Ellis) vs “lie” (Hopkins): kept “lyes”, the 1867 reading.'],
    scripture: ['Job 1:21', '2 Corinthians 5:1'], notes: 'Written in 1666 and left in manuscript; first printed in J. H. Ellis’s edition of her Works (1867). Text as quoted in Helen Campbell, Anne Bradstreet and her Time (1891).',
  },

  // ── Henry Vaughan ──────────────────────────────────────────────────────────
  {
    id: 'vaughan-the-retreat', a: 'vaughan', title: 'The Retreat', year: '1650', collection: 'Silex Scintillans',
    src: [`Page:${OBEV}/421`, `Page:${OBEV}/422`], startAt: 'Happy those early days', endAt: 'In that state I came, return.',
    check: IA('povaug01vaug'), hint: 'Happy  those  early  days',
    scripture: ['Deuteronomy 34:3'], notes: 'Text as printed in The Oxford Book of English Verse (1900). The “shady City of Palm-trees” is Jericho, seen by Moses from Pisgah (Deuteronomy 34:3) — a figure of the heavenly country.',
  },
  {
    id: 'vaughan-peace', a: 'vaughan', title: 'Peace', year: '1650', collection: 'Silex Scintillans',
    src: [`Page:${OBEV}/422`], startAt: 'My soul, there is a country', endAt: 'Thy God, thy life, thy cure.',
    check: IA('povaug01vaug'), hint: 'My  soul,  there  is  a  country',
    scripture: [], notes: 'Text as printed in The Oxford Book of English Verse (1900).',
  },
  {
    id: 'vaughan-they-are-all-gone', a: 'vaughan', title: 'They are all gone into the world of light!', year: '1655', collection: 'Silex Scintillans',
    src: [`Page:${OBEV}/423`, `Page:${OBEV}/424`, `Page:${OBEV}/425`], startAt: 'They are all gone into the world of light!', endAt: 'Where I shall need no glass.', opts: { stanzaSizes: Array(10).fill(4) },
    check: IA('povaug01vaug'), hint: 'THEY are all gone into the world of light',
    scripture: ['1 Corinthians 13:12'], notes: 'Untitled in Silex Scintillans, Part II (1655); The Oxford Book of English Verse calls it “Friends Departed”, whose text is followed here. “Perspective” = telescope.',
  },

  // ── John Bunyan ────────────────────────────────────────────────────────────
  {
    id: 'bunyan-the-shepherd-boys-song', a: 'bunyan', title: 'The Shepherd Boy’s Song', year: '1684', collection: 'The Pilgrim’s Progress, Part II',
    src: ["Page:The Pilgrim's Progress, the Holy War, Grace Abounding Chunk1.djvu/248"], startAt: 'He that is down needs fear no fall', endAt: 'Is best from age to age.',
    opts: { stanzaSizes: [4, 4, 4] },
    check: PG(6048), hint: 'He that is down needs fear no fall',
    scripture: ['Hebrews 13:5'], notes: 'Sung by a shepherd’s boy in the Valley of Humiliation, in the second part of The Pilgrim’s Progress (1684).',
  },

  // ── William Cowper ─────────────────────────────────────────────────────────
  {
    id: 'cowper-walking-with-god', a: 'cowper', title: 'Walking with God', year: '1772', collection: 'Olney Hymns (1779)',
    src: [`Page:${OLNEY}/63`], startAt: 'Oh for a closer walk with God', endAt: 'That leads me to the Lamb.',
    check: PG(47790), hint: 'Oh! for a closer walk with God',
    scripture: ['Genesis 5:24'], notes: 'Collected in Olney Hymns (1779), Book I, under the heading “Walking with God.—Gen. v. 24.” Usually sung as the hymn “O for a closer walk with God.”',
  },
  {
    id: 'cowper-light-shining-out-of-darkness', a: 'cowper', title: 'Light Shining out of Darkness', year: '1774', collection: 'Olney Hymns (1779)',
    src: [`Page:${OLNEY}/298`, `Page:${OLNEY}/299#s1`], startAt: 'God moves in a mysterious way',
    check: PG(47790), hint: 'God moves in a mysterious way His wonders to perform',
    scripture: [], notes: 'Collected in Olney Hymns (1779), Book III. Usually sung as the hymn “God moves in a mysterious way.”',
  },

  // ── John Keble ─────────────────────────────────────────────────────────────
  {
    id: 'keble-morning', a: 'keble', title: 'Morning', year: '1827', collection: 'The Christian Year',
    src: ['Page:The Christian Year 1887.djvu/17', 'Page:The Christian Year 1887.djvu/18'], startAt: 'Hues of the rich unfolding morn', fix: [['come and go:-', 'come and go:—']],
    check: PG(4272), hint: 'Hues of the rich unfolding morn',
    scripture: ['Lamentations 3:22-23'], notes: 'The first poem of The Christian Year, headed by Lamentations 3:22–23 (“His compassions fail not. They are new every morning”). Several stanzas are sung as the hymn “New every morning is the love.”',
  },

  // ── Elizabeth Barrett Browning ─────────────────────────────────────────────
  ...[
    ['substitution', 'Substitution', [`Page:${EBB}/96#c`, `Page:${EBB}/97#a`], 'When some beloved voice', [], ''],
    ['comfort', 'Comfort', [`Page:${EBB}/97#b`], 'Speak low to me', ['Luke 10:39'], ''],
    ['the-two-sayings', 'The Two Sayings', [`Page:${EBB}/99#b`], 'Two sayings of the Holy', ['John 11:35', 'Luke 22:61'], 'The two sayings are “Jesus wept” and “the Lord turned, and looked upon Peter.”',
      ['l. 6 “One is, And Jesus wept” (1887 reprint; confirmed in the 1844 first edition) vs “The first is Jesus wept” in the 1869 collected edition: Mrs Browning’s later revision — kept the 1844 reading.']],
    ['the-look', 'The Look', [`Page:${EBB}/99#c`, `Page:${EBB}/100#a`], 'looked on Peter. Ay, no word', ['Luke 22:61'], ''],
    ['the-meaning-of-the-look', 'The Meaning of the Look', [`Page:${EBB}/100#b`], 'I THINK that look of Christ', ['Luke 22:61-62'], '',
      ['l. 11 “For when thy deathly need is bitterest” (1887 reprint; confirmed in the 1844 first edition) vs “final need is dreariest” in the 1869 collected edition: Mrs Browning’s later revision — kept the 1844 reading.']],
  ].map(([slug, title, src, hint, scripture, notes, resolved]) => ({
    id: 'browning-' + slug, a: 'ebb', title, year: '1844', collection: 'Poems (1844)', src, opts: { stanzaSizes: [14] },
    check: IA('poemselizabethb00browgoog'), hint, scripture, notes, resolved,
  })),

  // ── Alfred Tennyson ────────────────────────────────────────────────────────
  {
    id: 'tennyson-strong-son-of-god', a: 'tennyson', title: 'Strong Son of God, Immortal Love', year: '1850', collection: 'In Memoriam A. H. H.',
    src: 'In Memoriam (Tennyson)/Prologue', opts: { stanzaSizes: Array(11).fill(4) },
    check: PG(70950), hint: 'Strong Son of God',
    scripture: ['1 Peter 1:8'], notes: 'The untitled prologue to In Memoriam (1850), Tennyson’s elegy for his friend Arthur Hallam (“one removed”, stanza 10).',
  },

  // ── Christina Rossetti ─────────────────────────────────────────────────────
  {
    id: 'rossetti-up-hill', a: 'rossetti', title: 'Up-Hill', year: '1861', collection: 'Goblin Market and Other Poems', src: `${GM1862}/Up-Hill`,
    check: PG(16950), hint: 'Does the road wind up-hill',
    scripture: [], notes: 'First printed in Macmillan’s Magazine (February 1861); collected in Goblin Market and Other Poems (1862).',
  },
  {
    id: 'rossetti-the-love-of-christ-which-passeth-knowledge', a: 'rossetti', title: '“The Love of Christ which Passeth Knowledge”', year: '1862', collection: 'Goblin Market and Other Poems',
    src: `${GM1862}/"The Love of Christ which Passeth Knowledge"`, fix: [["and rejoiced':", 'and rejoiced:']],
    check: PG(16950), hint: 'I bore with thee long weary days',
    scripture: ['Ephesians 3:19'], notes: 'Christ speaks to the soul. The title is from Ephesians 3:19.',
  },
  {
    id: 'rossetti-a-better-resurrection', a: 'rossetti', title: 'A Better Resurrection', year: '1862', collection: 'Goblin Market and Other Poems', src: `${GM1862}/A Better Resurrection`,
    check: PG(16950), hint: 'I have no wit, no words, no tears',
    scripture: ['Hebrews 11:35', 'Psalm 121:1'], notes: 'The title is from Hebrews 11:35.',
  },
  {
    id: 'rossetti-despised-and-rejected', a: 'rossetti', title: 'Despised and Rejected', year: '1866', collection: 'The Prince’s Progress and Other Poems', src: `${R1901}/Despised and Rejected`, fix: [['Aught thou may st have.', 'Aught thou mayst have.']],
    check: PG(16950), hint: 'My sun has set, I dwell',
    scripture: ['Isaiah 53:3', 'Revelation 3:20'], notes: '',
  },
  {
    id: 'rossetti-good-friday', a: 'rossetti', title: 'Good Friday', year: '1866', collection: 'The Prince’s Progress and Other Poems', src: `${R1901}/Good Friday`,
    check: PG(16950), hint: 'Am I a stone and not a sheep',
    scripture: ['Luke 22:62', 'Luke 23:44-45', 'Numbers 20:11'], notes: '',
  },

  // ── Gerard Manley Hopkins ──────────────────────────────────────────────────
  {
    id: 'hopkins-gods-grandeur', a: 'hopkins', title: 'God’s Grandeur', year: '1918', collection: 'Poems (1918)', src: [`Page:${HOP}/40#s1`],
    check: PG(22403), hint: 'GOD’S GRANDEUR',
    scripture: [], notes: 'Written 1877; first published by Robert Bridges in 1918. “Reck his rod” = heed his authority.',
  },
  {
    id: 'hopkins-the-windhover', a: 'hopkins', title: 'The Windhover', year: '1918', collection: 'Poems (1918)', src: [`Page:${HOP}/43#s2`],
    check: PG(22403), hint: "I CAUGHT this morning morning's minion",
    scripture: [], notes: 'Dedicated “To Christ our Lord.” The windhover is a kestrel; “minion” = darling; “sillion” = furrow. Written 1877.',
  },
  {
    id: 'hopkins-pied-beauty', a: 'hopkins', title: 'Pied Beauty', year: '1918', collection: 'Poems (1918)', src: [`Page:${HOP}/44#s1`],
    check: PG(22403), hint: 'Glory be to God for dappled things',
    scripture: [], notes: 'A “curtal” (shortened) sonnet, written 1877. Pied = dappled, of two or more colours.',
  },
  {
    id: 'hopkins-thou-art-indeed-just-lord', a: 'hopkins', title: 'Thou art indeed just, Lord', year: '1918', collection: 'Poems (1918)', src: [`Page:${HOP}/85#s2`, `Page:${HOP}/86#s1`],
    check: PG(22403), hint: 'Justus quidem',
    scripture: ['Jeremiah 12:1'], notes: 'Written March 1889, three months before his death. Headed in the 1918 edition by the Vulgate of Jeremiah 12:1.',
  },
];

// ---------------------------------------------------------------------------
async function renderPrimary(e) {
  let chunks, sourceTitle;
  if (typeof e.src === 'string') { chunks = await resolveMain(e.src); sourceTitle = e.src; }
  else {
    chunks = [];
    for (const spec of e.src) {
      const m = spec.match(/^Page:(.*)\/(\d+)(?:#(.*))?$/);
      chunks.push(await pageNs(m[1], +m[2], m[3]));
    }
    sourceTitle = e.src[0].replace(/#.*$/, '');
  }
  const warns = [];
  let chunkLines = chunks.map(c => wikitextToLines(c.text, { warn: w => warns.push(w) }));
  // startAt / endAt selection across the concatenated chunks
  if (e.startAt) {
    const ci = chunkLines.findIndex(ls => ls.some(l => l && l.text.includes(e.startAt)));
    if (ci < 0) throw new Error(`${e.id}: startAt not found`);
    chunkLines = chunkLines.slice(ci);
    const li = chunkLines[0].findIndex(l => l && l.text.includes(e.startAt));
    chunkLines[0] = chunkLines[0].slice(li);
  }
  if (e.endAt) {
    let seen = 0, done = false;
    chunkLines = chunkLines.map(ls => {
      if (done) return [];
      const out = [];
      for (const l of ls) { out.push(l); if (l && l.text.includes(e.endAt) && ++seen === (e.endOccurrence || 1)) { done = true; break; } }
      return out;
    });
    if (!done) throw new Error(`${e.id}: endAt not found`);
  }
  let stanzas = linesToStanzas(chunkLines, e.opts || {});
  if (e.opts?.stanzaSizes) {
    const all = stanzas.flat();
    const total = e.opts.stanzaSizes.reduce((a, b) => a + b, 0);
    if (all.length !== total) throw new Error(`${e.id}: stanzaSizes ${total} ≠ ${all.length} lines`);
    let k = 0; stanzas = e.opts.stanzaSizes.map(n => all.slice(k, k += n));
  }
  // fixes (typographic, or adopting a verified reading — see `resolved`)
  for (const [from, to] of e.fix || []) {
    let hit = false;
    stanzas = stanzas.map(s => s.map(l => { if (l.includes(from)) { hit = true; return l.split(from).join(to); } return l; }));
    if (!hit) throw new Error(`${e.id}: fix not applied: ${from}`);
  }
  const qualities = chunks.map(c => c.quality);
  return { stanzas, qualities, sourceTitle, warns: [...new Set(warns)] };
}

async function main() {
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  const review = [];
  const out = [];
  const order = MANIFEST.map((e, i) => ({ e, i })).sort((x, y) => AUTHORS[x.e.a].born - AUTHORS[y.e.a].born || x.i - y.i);
  for (const { e } of order) {
    if (only && !e.id.includes(only)) continue;
    const r = await renderPrimary(e);
    const text = r.stanzas.map(s => s.join('\n')).join('\n\n');
    const big = await fetchText(e.check.text);
    const cmp = compare(text, big, e.hint);
    const lines = r.stanzas.flat().length;
    review.push(`\n=== ${e.id}  [${lines} lines, page quality ${r.qualities.join(',')}]  anchor=${cmp.anchor.toFixed(2)} matched ${cmp.matched}/${cmp.total}`);
    if (r.warns.length) review.push('  warn: ' + r.warns.join('; '));
    for (const h of cmp.hunks) review.push(`  @${h.at}  primary: ${JSON.stringify(h.a.join(' '))}   other: ${JSON.stringify(h.b.join(' '))}`);
    if (only) review.push(text);
    out.push({
      id: e.id, title: e.title, author: AUTHORS[e.a].author, lifespan: AUTHORS[e.a].lifespan, year: e.year,
      collection: e.collection ?? null, stanzas: r.stanzas,
      source: wsUrl(r.sourceTitle), checkedAgainst: e.check.url,
      scripture: e.scripture || [], notes: e.notes || '',
    });
  }
  const log = review.join('\n');
  fs.writeFileSync(path.join(CACHE, only ? 'review-only.txt' : 'review.txt'), log);
  console.log(log);
  if (!only) {
    const ids = new Set();
    for (const p of out) { if (ids.has(p.id)) throw new Error('duplicate id ' + p.id); ids.add(p.id); }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    const by = {};
    for (const p of out) by[p.author] = (by[p.author] || 0) + 1;
    console.log(`\nWrote ${out.length} poems → ${path.relative(ROOT, OUT)}`);
    console.log(by);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
