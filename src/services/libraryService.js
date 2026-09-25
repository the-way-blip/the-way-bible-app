// Bible dictionaries, topical indexes, devotionals and classic books — static
// JSON built from CrossWire SWORD modules by scripts/build-library-data.py.

export const DICTIONARIES = {
  easton:    { name: "Easton's Bible Dictionary", short: "Easton", date: "1897", kind: "dictionary" },
  smith:     { name: "Smith's Bible Dictionary", short: "Smith", date: "1863", kind: "dictionary" },
  isbe:      { name: "International Standard Bible Encyclopedia", short: "ISBE", date: "1915", kind: "dictionary" },
  amtract:   { name: "American Tract Society Bible Dictionary", short: "ATS", date: "1859", kind: "dictionary" },
  hitchcock: { name: "Hitchcock's Bible Names", short: "Hitchcock", date: "1869", kind: "names" },
  nave:      { name: "Nave's Topical Bible", short: "Nave", date: "1896", kind: "topical" },
  torrey:    { name: "Torrey's New Topical Textbook", short: "Torrey", date: "1897", kind: "topical" },
  tcr:       { name: "Thompson Chain Reference Topics", short: "Thompson", date: "1908", kind: "topical" },
};

const cache = new Map();
function getJSON(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => { cache.delete(url); return null; }));
  }
  return cache.get(url);
}

export const normKey = (s) => (s || "").toUpperCase().replace(/\s+/g, " ").trim();

let indexPromise = null;
/** { sources: [id], twoLetter: [id], words: [[display, [sourceIdx]]], byKey: Map } */
export function loadDictionaryIndex() {
  if (!indexPromise) {
    indexPromise = getJSON("/data/dict/index.json").then((idx) => {
      if (!idx) { indexPromise = null; return null; }
      idx.byKey = new Map(idx.words.map((w) => [normKey(w[0]), w]));
      return idx;
    });
  }
  return indexPromise;
}

function chunkOf(key, twoLetter) {
  const letters = key.replace(/[^A-Z]/g, "");
  if (!letters) return "_";
  return twoLetter && letters.length > 1 ? letters.slice(0, 2) : letters[0];
}

/** All sources' articles for a headword: [{ id, meta, text }] (dictionaries first, then topical). */
export async function getDictionaryEntry(headword) {
  const idx = await loadDictionaryIndex();
  const word = idx?.byKey.get(normKey(headword));
  if (!word) return null;
  const key = normKey(word[0]);
  const ids = word[1].map((i) => idx.sources[i]);
  const articles = await Promise.all(ids.map(async (id) => {
    const chunk = await getJSON(`/data/dict/${id}/${chunkOf(key, idx.twoLetter.includes(id))}.json`);
    return chunk?.[key] ? { id, meta: DICTIONARIES[id], text: chunk[key] } : null;
  }));
  const order = Object.keys(DICTIONARIES);
  return { headword: word[0], articles: articles.filter(Boolean).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)) };
}

/** Headword suggestions: exact, then prefix, then contains. */
export async function suggestHeadwords(q, limit = 12) {
  const idx = await loadDictionaryIndex();
  const k = normKey(q);
  if (!idx || !k) return [];
  const exact = [], prefix = [], contains = [];
  for (const w of idx.words) {
    const n = normKey(w[0]);
    if (n === k) exact.push(w);
    else if (n.startsWith(k)) prefix.push(w);
    else if (k.length > 2 && n.includes(k)) contains.push(w);
    if (prefix.length > limit * 2) break;
  }
  return [...exact, ...prefix, ...contains].slice(0, limit);
}

// ── Devotionals ──────────────────────────────────────────────────────────────
export const DEVOTIONALS = {
  "morning-evening": { name: "Morning and Evening", author: "C. H. Spurgeon", date: "1865" },
  "daily-light": { name: "Daily Light on the Daily Path", author: "Jonathan Bagster", date: "1875" },
};

export const dayKey = (d = new Date()) => `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

/** Text for one day, split into { morning, evening }. */
export async function getDevotional(id, key = dayKey()) {
  const month = await getJSON(`/data/devotionals/${id}/${key.slice(0, 2)}.json`);
  const text = month?.[key];
  if (!text) return null;
  const m = text.match(/^([\s\S]*?)\n*(EVENING,[^\n]*|Evening:)\n+([\s\S]*)$/);
  const strip = (s) => s.replace(/^(MORNING,[^\n]*|Morning:)\n+/, "").trim();
  return m ? { morning: strip(m[1]), evening: m[3].trim() } : { morning: strip(text), evening: "" };
}

// ── Library ──────────────────────────────────────────────────────────────────
export const LIBRARY = [
  { group: "Confessions of Faith", books: [
    { id: "baptist-confession-1689", title: "Second London Baptist Confession", author: "1689", blurb: "The historic confession of Particular Baptists, still the standard for many Baptist churches." },
    { id: "baptist-confession-1646", title: "First London Baptist Confession", author: "1646 edition", blurb: "The first confession of the English Particular Baptists." },
    { id: "westminster", title: "Westminster Confession & Catechisms", author: "1646–1647", blurb: "The Reformed standard, with the Larger and Shorter Catechisms." },
  ]},
  { group: "Christian Classics", books: [
    { id: "pilgrims-progress", title: "The Pilgrim's Progress", author: "John Bunyan", blurb: "Christian's journey from the City of Destruction to the Celestial City." },
    { id: "ryle-holiness", title: "Holiness", author: "J. C. Ryle", blurb: "Its nature, hindrances, difficulties and roots." },
    { id: "bounds-reality-of-prayer", title: "The Reality of Prayer", author: "E. M. Bounds", blurb: "On the power and practice of prayer." },
    { id: "owen-mortification-of-sin", title: "The Mortification of Sin", author: "John Owen", blurb: "\"Be killing sin, or it will be killing you.\"" },
    { id: "owen-glory-of-christ", title: "The Glory of Christ", author: "John Owen", blurb: "Meditations on beholding the glory of Christ." },
    { id: "edwards-religious-affections", title: "Religious Affections", author: "Jonathan Edwards", blurb: "What true, saving religion looks like." },
    { id: "edwards-sermons", title: "Select Sermons", author: "Jonathan Edwards", blurb: "Including \"Sinners in the Hands of an Angry God\"." },
    { id: "finney-sermons", title: "Sermons on Gospel Themes", author: "Charles G. Finney", blurb: "Revival preaching from the Second Great Awakening." },
    { id: "practice-of-the-presence-of-god", title: "The Practice of the Presence of God", author: "Brother Lawrence", blurb: "Walking with God in ordinary work." },
    { id: "imitation-of-christ", title: "The Imitation of Christ", author: "Thomas à Kempis", blurb: "Devotional classic on following Christ." },
    { id: "calvin-institutes", title: "Institutes of the Christian Religion", author: "John Calvin", blurb: "The Reformation's great systematic theology." },
  ]},
  { group: "History", books: [
    { id: "josephus", title: "The Works of Josephus", author: "Flavius Josephus (tr. Whiston)", blurb: "Antiquities of the Jews and The Jewish War — the world of the Bible from a first-century historian." },
  ]},
];
export const findBook = (id) => LIBRARY.flatMap((g) => g.books).find((b) => b.id === id);

export const getBookIndex = (id) => getJSON(`/data/library/${id}/index.json`);
export async function getBookSection(id, n) {
  const idx = await getBookIndex(id);
  const entry = idx?.sections[n];
  if (!entry) return null;
  const file = await getJSON(`/data/library/${id}/${entry[1]}.json`);
  const [title, text] = file?.[entry[2]] || [];
  return title ? { title, text, total: idx.sections.length } : null;
}
