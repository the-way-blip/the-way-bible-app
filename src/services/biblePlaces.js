/**
 * Biblical geography lookup — "which places does this chapter walk through,
 * and where in the text are they named?"
 *
 * Backed by the OpenBible.info geocoding dataset (CC BY 4.0), bundled as
 * src/data/biblePlaces.json by scripts/build-bible-places.mjs. The dataset is
 * ~260 KB, so it is dynamically imported the first time a chapter asks for it
 * and then kept in module scope.
 *
 * Two lookups work together:
 *
 *   1. getChapterPlaces() uses the dataset's own verse references. This is the
 *      authoritative list — it works no matter how the translation spells a
 *      name, and it knows which verse each place belongs to.
 *   2. detectMentions() then scans the rendered verse text for those specific
 *      places, so we only ever regex against a handful of candidates rather
 *      than all 1,200. That keeps it fast and keeps false positives near zero.
 */

let loadPromise = null;
let dataset = null;
let chapterIndex = null;

/** Names too generic to auto-link inside verse text, even when referenced. */
const UNLINKABLE = new Set([
  "River", "Beyond the River", "Great Sea", "Sea", "Valley", "Wilderness",
  "The Sea", "Brook", "City", "Tower", "Gate", "Pool", "Spring", "Well",
]);

/** True once the dataset is in memory and lookups resolve synchronously. */
export function isPlacesLoaded() {
  return dataset !== null;
}

/** Load and index the dataset. Safe to call repeatedly. */
export function loadPlaces() {
  if (loadPromise) return loadPromise;
  loadPromise = import("../data/biblePlaces.json")
    .then((module) => {
      dataset = module.default || module;
      chapterIndex = buildChapterIndex(dataset);
      return dataset;
    })
    .catch((error) => {
      // Let a later call retry rather than caching the failure forever.
      loadPromise = null;
      throw error;
    });
  return loadPromise;
}

/**
 * Map of "<bookIndex>:<chapter>" → Map(placeIndex → sorted verse numbers).
 */
function buildChapterIndex(data) {
  const index = new Map();
  data.places.forEach((place, placeIdx) => {
    const refs = place.v;
    for (let i = 0; i < refs.length; i += 3) {
      const key = `${refs[i]}:${refs[i + 1]}`;
      let chapterEntry = index.get(key);
      if (!chapterEntry) {
        chapterEntry = new Map();
        index.set(key, chapterEntry);
      }
      let verses = chapterEntry.get(placeIdx);
      if (!verses) {
        verses = new Set();
        chapterEntry.set(placeIdx, verses);
      }
      verses.add(refs[i + 2]);
    }
  });
  return index;
}

/** Shape a raw dataset row into the object the UI works with. */
function hydrate(place, placeIdx, verses) {
  return {
    id: place.n,
    name: place.d,
    fullName: place.n,
    lat: place.la,
    lon: place.lo,
    precision: place.p || "exact",
    parent: place.r || null,
    comment: place.c || null,
    note: place.note,
    modern: place.m || null,
    curated: Boolean(place.k),
    aliases: place.a || [],
    mentionCount: place.v.length / 3,
    verses: verses ? [...verses].sort((a, b) => a - b) : [],
    index: placeIdx,
  };
}

/**
 * Every geocoded place the dataset ties to this chapter, most significant
 * first. Returns [] before the dataset has loaded — callers await loadPlaces().
 */
export function getChapterPlaces(book, chapter) {
  if (!dataset || !chapterIndex) return [];
  const bookIdx = dataset.books.indexOf(book);
  if (bookIdx === -1) return [];

  const entry = chapterIndex.get(`${bookIdx}:${chapter}`);
  if (!entry) return [];

  const places = [];
  for (const [placeIdx, verses] of entry) {
    places.push(hydrate(dataset.places[placeIdx], placeIdx, verses));
  }

  // Curated places first (they have real notes to show), then by how often the
  // place shows up in this chapter, then by overall prominence in Scripture.
  return places.sort(
    (a, b) =>
      Number(b.curated) - Number(a.curated) ||
      b.verses.length - a.verses.length ||
      b.mentionCount - a.mentionCount ||
      a.name.localeCompare(b.name)
  );
}

/** Look a place up by its dataset id, for deep links and restored state. */
export function getPlaceById(id) {
  if (!dataset) return null;
  const idx = dataset.places.findIndex((place) => place.n === id);
  return idx === -1 ? null : hydrate(dataset.places[idx], idx, null);
}

/**
 * Look a place up by dataset id ("Antioch 1") or, failing that, by display
 * name ("Antioch"). Journey waypoints use ids only where the name is
 * ambiguous, so both paths are needed.
 */
export function getPlaceByName(name) {
  if (!dataset || !name) return null;
  let idx = dataset.places.findIndex((place) => place.n === name);
  if (idx === -1) idx = dataset.places.findIndex((place) => place.d === name);
  return idx === -1 ? null : hydrate(dataset.places[idx], idx, null);
}

export function getDatasetMeta() {
  if (!dataset) return null;
  const { source, sourceUrl, license, generated, places } = dataset;
  return { source, sourceUrl, license, generated, count: places.length };
}

// ─── Text detection ─────────────────────────────────────────────────────────

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build one alternation regex for a chapter's candidate places. Longest names
 * are tried first so "Caesarea Philippi" wins over "Caesarea", and each
 * alternative is tagged back to its place via a lookup on the matched text.
 */
function buildMatcher(places) {
  const byPattern = new Map();
  for (const place of places) {
    if (UNLINKABLE.has(place.name)) continue;
    for (const variant of [place.name, ...place.aliases]) {
      const key = variant.toLowerCase();
      // First place wins — the list is already sorted by significance.
      if (!byPattern.has(key)) byPattern.set(key, place);
    }
  }
  if (byPattern.size === 0) return null;

  const patterns = [...byPattern.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe);

  return {
    regex: new RegExp(`\\b(${patterns.join("|")})\\b`, "gi"),
    byPattern,
  };
}

const matcherCache = new WeakMap();

function getMatcher(places) {
  if (!places || places.length === 0) return null;
  let matcher = matcherCache.get(places);
  if (matcher === undefined) {
    matcher = buildMatcher(places);
    matcherCache.set(places, matcher);
  }
  return matcher;
}

/**
 * Split verse text into renderable segments, marking place names.
 *
 *   detectMentions("And Jesus went to Capernaum.", places)
 *     → [{ text: "And Jesus went to " }, { text: "Capernaum", place }, { text: "." }]
 *
 * Returns null when nothing matched, so callers can skip the extra spans
 * entirely and render plain text.
 */
export function detectMentions(text, places) {
  const matcher = getMatcher(places);
  if (!matcher || !text) return null;

  const segments = [];
  let cursor = 0;
  let found = false;

  matcher.regex.lastIndex = 0;
  let match;
  while ((match = matcher.regex.exec(text)) !== null) {
    const place = matcher.byPattern.get(match[0].toLowerCase());
    if (!place) continue;
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index) });
    }
    segments.push({ text: match[0], place });
    cursor = match.index + match[0].length;
    found = true;
  }

  if (!found) return null;
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/**
 * Study mode renders one span per word, so place detection has to work on the
 * token stream instead of a string. Returns a Map of word index → place for
 * the first token of each match, plus how many tokens the match spans.
 *
 *   → Map(7 → { place, length: 2 })   // "Caesarea Philippi"
 */
export function detectMentionsInWords(words, places) {
  const matcher = getMatcher(places);
  if (!matcher || !words?.length) return null;

  // Longest names first so multi-word places win over their first token.
  const variants = [...matcher.byPattern.entries()].sort(
    (a, b) => b[0].split(/\s+/).length - a[0].split(/\s+/).length
  );

  const clean = words.map((w) => (w.word || "").replace(/[^A-Za-z-]/g, "").toLowerCase());
  const marks = new Map();

  for (let i = 0; i < words.length; i++) {
    if (!clean[i]) continue;
    for (const [variant, place] of variants) {
      const tokens = variant.split(/\s+/);
      if (i + tokens.length > words.length) continue;
      let matched = true;
      for (let t = 0; t < tokens.length; t++) {
        if (clean[i + t] !== tokens[t]) { matched = false; break; }
      }
      if (matched) {
        marks.set(i, { place, length: tokens.length });
        i += tokens.length - 1;
        break;
      }
    }
  }

  return marks.size > 0 ? marks : null;
}

/** "Matthew 4:13, 18" — how a place's verses in one chapter read. */
export function formatVerseList(book, chapter, verses) {
  if (!verses?.length) return `${book} ${chapter}`;
  return `${book} ${chapter}:${verses.join(", ")}`;
}
