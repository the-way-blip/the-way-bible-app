// Search across the local commentaries using the sharded inverted index built by
// scripts/build-commentary-index.mjs (public/data/commentary-index/). A query
// fetches only the manifest plus the shards for its words; snippets are pulled
// lazily from the commentary files when a result is shown.

import { COMMENTARIES, loadCommentary } from "./commentaryService";

const BASE = "/data/commentary-index";
const STOPWORDS = new Set((
  "a about above after again against all also am an and any are as at be because been before being below between both but by " +
  "can could did do does doing down during each few for from further had has have having he her here hers herself him himself " +
  "his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours " +
  "ourselves out over own same she should so some such than that the their theirs them themselves then there these they this " +
  "those through to too under until up upon very was we were what when where which while who whom why will with would you your " +
  "yours yourself yourselves thee thou thy thine ye unto shall hath doth didst hast art may might must one two us let yet even " +
  "say said see ver vers verse verses chap ch viz etc"
).split(/\s+/));

const AUTO_PREFIX_MIN = 4;   // "justif" → justify, justified, justification…
const MAX_EXPANSIONS = 40;   // prefix expansions per word
const MAX_SHARDS_PER_WORD = 8;

let manifestPromise = null;
const shardCache = new Map();

export function loadCommentaryManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(`${BASE}/manifest.json`).then((r) => {
      if (!r.ok) throw new Error("commentary index missing");
      return r.json();
    }).catch((e) => { manifestPromise = null; throw e; });
  }
  return manifestPromise;
}

function loadShard(key) {
  if (!shardCache.has(key)) {
    shardCache.set(key, fetch(`${BASE}/${encodeURIComponent(key)}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => {
      shardCache.delete(key);
      return {};
    }));
  }
  return shardCache.get(key);
}

/** Which shard keys can hold `word` (exact) or terms starting with it (prefix). */
function shardsFor(manifest, word, prefix) {
  const out = [];
  for (const k of manifest.shards) {
    const leaf = k.endsWith("$");
    const base = leaf ? k.slice(0, -1) : k;
    if (leaf ? (prefix ? base.startsWith(word) : base === word)
      : (word.startsWith(base) || (prefix && base.startsWith(word)))) out.push(k);
  }
  return out.slice(0, MAX_SHARDS_PER_WORD);
}

function decodePostings(str) {
  const out = [];
  let k = 0;
  for (const d of str.split(",")) { k += parseInt(d, 36); out.push(k); }
  return out;
}

function decodeKey(key, manifest) {
  const verse = key % 180;
  let r = (key - verse) / 180;
  const chapter = r % 151; r = (r - chapter) / 151;
  const bi = r % 66;
  const ci = (r - bi) / 66;
  return { id: manifest.commentaries[ci], book: manifest.books[bi], chapter, verse };
}

/** Split a query into words (quoted phrases contribute their words too). */
export function parseCommentaryQuery(raw) {
  const phrases = [];
  // Phrase words match exactly (no prefix expansion); adjacency is checked once the text loads
  const rest = raw.replace(/"([^"]+)"/g, (_, p) => {
    phrases.push(p.trim().toLowerCase().replace(/\s+/g, " "));
    return ` ${p.replace(/[a-z]+/gi, (w) => `${w}\u0001`)} `;
  });
  const words = [];
  for (const tok of rest.toLowerCase().replace(/[’‘]/g, "'").replace(/'s\b/g, "").match(/[a-z*]+\u0001?/g) || []) {
    const inPhrase = tok.endsWith("\u0001");
    const star = !inPhrase && tok.endsWith("*");
    const w = tok.replace(/[*\u0001]/g, "");
    if (w.length < (star ? 2 : 3) || STOPWORDS.has(w)) continue;
    const prefix = !inPhrase && (star || w.length >= AUTO_PREFIX_MIN);
    const existing = words.find((x) => x.w === w);
    if (existing) existing.prefix = existing.prefix && prefix;
    else words.push({ w, prefix });
  }
  return { words, phrases };
}

/**
 * Search the commentary index. Returns
 * { results: [{ id, name, book, chapter, verse, matched, score }], terms, words, total, relaxed }
 * `terms` are the index terms that matched (for highlighting snippets).
 * Options: books: Set<string> | null (reader book names), commentary: id | "all".
 */
export async function searchCommentaries(raw, { books = null, commentary = "all" } = {}) {
  const manifest = await loadCommentaryManifest();
  const { words, phrases } = parseCommentaryQuery(raw);
  if (!words.length) return { results: [], terms: [], words: [], phrases, total: 0, relaxed: false };

  // Per word: Map(docKey → weight) — exact match 2, prefix expansion 1
  const perWord = await Promise.all(words.map(async ({ w, prefix }) => {
    const shards = await Promise.all(shardsFor(manifest, w, prefix).map(loadShard));
    const hits = new Map();
    const terms = [];
    const candidates = [];
    for (const sh of shards) {
      if (sh[w]) candidates.unshift([w, sh[w]]);
      if (prefix) for (const t in sh) if (t !== w && t.startsWith(w)) candidates.push([t, sh[t]]);
    }
    // Prefer the exact term, then the most frequent expansions
    const exact = candidates.filter(([t]) => t === w);
    const expansions = candidates.filter(([t]) => t !== w).sort((a, b) => b[1].length - a[1].length).slice(0, MAX_EXPANSIONS);
    for (const [t, str] of [...exact, ...expansions]) {
      terms.push(t);
      const weight = t === w ? 2 : 1;
      for (const k of decodePostings(str)) if ((hits.get(k) || 0) < weight) hits.set(k, weight);
    }
    return { hits, terms };
  }));

  const allowedIds = commentary !== "all" ? new Set([commentary]) : null;
  const combine = (requireAll) => {
    const scores = new Map();
    const counts = new Map();
    perWord.forEach(({ hits }) => {
      for (const [k, wgt] of hits) {
        scores.set(k, (scores.get(k) || 0) + wgt);
        counts.set(k, (counts.get(k) || 0) + 1);
      }
    });
    const out = [];
    for (const [k, score] of scores) {
      const matched = counts.get(k);
      if (requireAll && matched < perWord.length) continue;
      const d = decodeKey(k, manifest);
      if (allowedIds && !allowedIds.has(d.id)) continue;
      if (books && !books.has(d.book)) continue;
      out.push({ ...d, key: k, matched, score });
    }
    return out;
  };

  let results = combine(true);
  let relaxed = false;
  if (!results.length && perWord.length > 1) { results = combine(false); relaxed = results.length > 0; }

  const order = new Map(COMMENTARIES.map((c, i) => [c.id, i]));
  const bookOrder = new Map(manifest.books.map((b, i) => [b, i]));
  results.sort((a, b) => b.matched - a.matched || b.score - a.score
    || bookOrder.get(a.book) - bookOrder.get(b.book) || a.chapter - b.chapter || a.verse - b.verse
    || (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  const names = new Map(COMMENTARIES.map((c) => [c.id, c.name]));
  for (const r of results) r.name = names.get(r.id) || r.id;

  return {
    results,
    total: results.length,
    terms: [...new Set(perWord.flatMap((p) => p.terms))],
    words: words.map((x) => x.w),
    phrases,
    relaxed,
  };
}

/** The commentary section a result points at: { label, text } (lazy, cached by commentaryService). */
export async function loadCommentarySection(r) {
  const data = await loadCommentary(r.id, r.book, r.chapter);
  if (!data) return null;
  if (r.verse === 0) return data.intro ? { label: null, text: data.intro } : null;
  const s = data.sections.find((x) => x.start === r.verse) || data.sections.find((x) => r.verse >= x.start && r.verse <= x.end);
  return s ? { label: s.label, text: s.text } : null;
}
