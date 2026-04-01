// Local word study service — uses bundled KJV interlinear data + Strong's lexicon
// No API key needed

let lexiconCache = null;
let booksMapCache = null;

async function getLexicon() {
  if (lexiconCache) return lexiconCache;
  const res = await fetch("/data/lexicon.json");
  lexiconCache = await res.json();
  return lexiconCache;
}

async function getBooksMap() {
  if (booksMapCache) return booksMapCache;
  const res = await fetch("/data/books.json");
  const data = await res.json();
  // Convert [{Genesis: "Gen"}, ...] to {genesis: "Gen", ...}
  booksMapCache = {};
  for (const entry of data.books) {
    const [name, abbrev] = Object.entries(entry)[0];
    booksMapCache[name.toLowerCase()] = abbrev;
  }
  return booksMapCache;
}

async function getBookData(abbrev) {
  const res = await fetch(`/data/${abbrev}.json`);
  if (!res.ok) return null;
  return res.json();
}

// Parse the tagged KJV text: "In the beginning[H7225] God[H430] created[H1254]..."
// Returns array of word objects
function parseTaggedText(taggedText) {
  const words = [];
  // Remove <em> tags and track which words are added
  // Pattern: word[H####] or word[G####] for original, <em>word</em> for added
  let remaining = taggedText;

  // Split into tokens: either <em>...</em> blocks or word[code] or plain words
  const regex = /<em>(.*?)<\/em>|(\S+?)(\[([HG]\d+)\](?:\[([HG]\d+)\])?(?:\[([HG]\d+)\])?)|(\S+)/g;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    if (match[1] !== undefined) {
      // <em>word</em> — translator added
      words.push({
        word: match[1],
        added: true,
      });
    } else if (match[2] !== undefined) {
      // word[H####] — original language word with Strong's tag(s)
      const strongsNums = [match[4], match[5], match[6]].filter(Boolean);
      words.push({
        word: match[2].replace(/[.,;:!?]/g, ""),
        added: false,
        strongs: strongsNums[0] || null,
        strongs_extra: strongsNums.slice(1),
        punctuation: match[2].match(/[.,;:!?]$/)?.[0] || "",
      });
    } else if (match[7] !== undefined) {
      // Plain word with no tag — likely added or punctuation
      const clean = match[7].replace(/[.,;:!?]/g, "");
      if (clean) {
        words.push({
          word: clean,
          added: true,
        });
      }
    }
  }

  return words;
}

// Enrich word objects with lexicon data
function enrichWithLexicon(words, lexicon) {
  return words.map((w) => {
    if (w.added || !w.strongs) return w;

    const entry = lexicon[w.strongs];
    if (!entry) return w;

    const isGreek = w.strongs.startsWith("G");

    // Parse root_word: "G1210 | δέω |  bind, tie, knit" → structured
    const rootWords = parseRootWord(entry.root_word);

    // Parse occurrences: "love(135x), beloved(7x)" → { love: 135, beloved: 7 }
    const parsedOccurrences = parseOccurrences(entry.occurrences);

    // Parse kjv_def into array of translations
    const kjvTranslations = entry.kjv_def
      ? entry.kjv_def.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      ...w,
      // Original language word
      greek: isGreek ? entry.Gk_word || entry.lemma : undefined,
      hebrew: !isGreek ? entry.Heb_word || entry.lemma : undefined,
      transliteration: entry.transliteration || entry.translit,
      pronunciation: entry.pronunciation || entry.pron,
      // Definitions
      strongs_def: cleanDef(entry.strongs_def),
      kjv_def: entry.kjv_def,
      part_of_speech: entry.part_of_speech,
      derivation: entry.derivation || entry.root_word,
      // Parsed structured data
      root_words: rootWords,
      kjv_translation_list: kjvTranslations,
      occurrence_map: parsedOccurrences.map,
      total_occurrences: parsedOccurrences.total,
      // Usage info
      outline_usage: cleanHtml(entry.outline_usage),
      occurrences: entry.occurrences,
      // External links
      biblehub_url: `https://biblehub.com/str/${isGreek ? "greek" : "hebrew"}/${w.strongs.slice(1)}.htm`,
      blb_url: `https://www.blueletterbible.org/lexicon/${w.strongs.toLowerCase()}/kjv/wlc/0-1/`,
    };
  });
}

// Also enrich from the openscriptures Strong's data for fuller definitions
async function enrichWithOpenScriptures(words) {
  let greekDict = null;
  let hebrewDict = null;

  const needsGreek = words.some((w) => w.strongs?.startsWith("G"));
  const needsHebrew = words.some((w) => w.strongs?.startsWith("H"));

  if (needsGreek) {
    try {
      const res = await fetch("/data/strongs/greek.json");
      greekDict = await res.json();
    } catch {}
  }
  if (needsHebrew) {
    try {
      const res = await fetch("/data/strongs/hebrew.json");
      hebrewDict = await res.json();
    } catch {}
  }

  return words.map((w) => {
    if (w.added || !w.strongs) return w;

    const dict = w.strongs.startsWith("G") ? greekDict : hebrewDict;
    if (!dict) return w;

    const entry = dict[w.strongs];
    if (!entry) return w;

    return {
      ...w,
      // Fill in missing fields from openscriptures
      greek: w.greek || entry.lemma,
      hebrew: w.hebrew || entry.lemma,
      transliteration: w.transliteration || entry.translit || entry.xlit,
      pronunciation: w.pronunciation || entry.pron,
      strongs_def: w.strongs_def || cleanDef(entry.strongs_def),
      kjv_def: w.kjv_def || entry.kjv_def,
      derivation: w.derivation || entry.derivation,
    };
  });
}

function cleanDef(def) {
  if (!def) return null;
  return decodeEntities(def)
    .replace(/-+$/, "")
    .replace(/^\s+/, "")
    .replace(/^null/, "")
    .trim();
}

function cleanHtml(text) {
  if (!text) return null;
  return decodeEntities(text).trim();
}

function decodeEntities(text) {
  if (!text) return "";
  return text
    // &#39 s → 's (common pattern in this dataset — apostrophe before s)
    .replace(/&#39\s+s\b/g, "'s")
    // Standard HTML numeric entities (with or without semicolon)
    .replace(/&#(\d+);?/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'");
}

// Parse "G1210 | δέω |  bind, tie, knit" into structured object
function parseRootWord(rootStr) {
  if (!rootStr) return [];
  // Could be "primitive root" or "H433 | אֱלוֹהַּ |  God, god"
  // Could have multiple roots separated by commas or "and"
  const parts = rootStr.split(/,\s*(?=[HG]\d)/).filter(Boolean);
  return parts.map((part) => {
    const match = part.match(/([HG]\d+)\s*\|\s*([^\|]+)\|\s*(.*)/);
    if (match) {
      return {
        strongs: match[1].trim(),
        word: match[2].trim(),
        meaning: match[3].trim(),
      };
    }
    // "primitive root" or "a primary word"
    return { strongs: null, word: null, meaning: part.trim() };
  }).filter((r) => r.meaning);
}

// Parse "love(135x), beloved(7x)" into { map: { love: 135, beloved: 7 }, total: 142 }
function parseOccurrences(occStr) {
  if (!occStr) return { map: {}, total: 0 };
  const map = {};
  const regex = /([a-zA-Z\s\-()]+)\((\d+)x\)/g;
  let match;
  while ((match = regex.exec(occStr)) !== null) {
    const word = match[1].trim();
    const count = parseInt(match[2]);
    if (!map[word]) map[word] = count;
  }
  const total = Object.values(map).reduce((s, c) => s + c, 0);
  return { map, total };
}

// Main entry point
export async function getLocalWordStudy(book, chapter, verseNumber) {
  const booksMap = await getBooksMap();
  const abbrev = booksMap[book.toLowerCase()];
  if (!abbrev) return null;

  const bookData = await getBookData(abbrev);
  if (!bookData) return null;

  // Navigate to the verse — format: {"Gen": {"Gen|1": {"Gen|1|1": {"en": "..."}}}}
  const bookKey = Object.keys(bookData)[0];
  const chapterKey = `${bookKey}|${chapter}`;
  const verseKey = `${bookKey}|${chapter}|${verseNumber}`;

  const chapterData = bookData[bookKey]?.[chapterKey];
  if (!chapterData) return null;

  const verseData = chapterData[verseKey];
  if (!verseData || !verseData.en) return null;

  // Parse the tagged text
  let words = parseTaggedText(verseData.en);

  // Enrich with lexicon
  const lexicon = await getLexicon();
  words = enrichWithLexicon(words, lexicon);

  // Further enrich with openscriptures data
  words = await enrichWithOpenScriptures(words);

  return { words };
}
