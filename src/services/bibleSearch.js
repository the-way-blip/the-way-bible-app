// Unified Bible search: one query box that accepts references in any common
// form, Strong's numbers, keywords, phrases, and natural-language questions.
// Everything runs client-side against the bundled KJV index.

import bibleBooks from "../data/bibleBooks";
import topics from "../data/topicIndex";

/* ─────────────────────────── Index ─────────────────────────── */

let indexPromise = null;
let index = null;   // [{ r, b, c, v, t, stems:Set, lower }]
let vocab = null;   // Map<word, count>

export function loadIndex() {
  if (indexPromise) return indexPromise;
  indexPromise = fetch("/data/search-index.json")
    .then((res) => res.json())
    .then((rows) => {
      vocab = new Map();
      index = rows.map((raw) => {
        // Source data carries stray "➔" markers in some verses
        const e = raw.t.includes("➔") ? { ...raw, t: raw.t.replace(/\s*➔\s*/g, " ").replace(/\s+/g, " ").trim() } : raw;
        const lower = e.t.toLowerCase().replace(/[’‘]/g, "'");
        const words = lower.replace(/[^a-z'\s-]/g, " ").split(/\s+/).filter(Boolean);
        const stems = new Set();
        for (const w of words) {
          vocab.set(w, (vocab.get(w) || 0) + 1);
          stems.add(stem(w));
        }
        return { ...e, lower, stems };
      });
      return index;
    });
  return indexPromise;
}

/* ─────────────────────────── Stemming ─────────────────────────── */

// Light stemmer tuned for KJV morphology (loveth/lovest/loved/loving → lov).
export function stem(word) {
  let w = word.toLowerCase().replace(/'s$/, "").replace(/[^a-z-]/g, "");
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  for (const suf of ["ings", "eth", "est", "ing", "ed", "es", "ly", "s"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  if (/([bdfgklmnprst])\1$/.test(w)) w = w.slice(0, -1);       // sinn → sin
  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);      // love → lov
  return w;
}

/* ─────────────────────────── Books ─────────────────────────── */

// The index is built from bibleBooks names (scripts/build-search-index.mjs);
// the mapping stays for any older cached copy that still says "Song of Songs".
const INDEX_BOOK_NAME = {};
const READER_BOOK_NAME = { "Song of Songs": "Song of Solomon" };
export const toReaderBook = (b) => READER_BOOK_NAME[b] || b;

const EXTRA_ALIASES = {
  Genesis: ["gen", "ge", "gn"], Exodus: ["ex", "exo", "exod"], Leviticus: ["lev", "lv", "le"],
  Numbers: ["num", "nu", "nm", "nb"], Deuteronomy: ["deut", "dt", "de", "deu"],
  Joshua: ["josh", "jos", "jsh"], Judges: ["judg", "jdg", "jg", "jdgs"], Ruth: ["ru", "rth"],
  "1 Samuel": ["1sam", "1sa", "1sm", "1s"], "2 Samuel": ["2sam", "2sa", "2sm", "2s"],
  "1 Kings": ["1kgs", "1ki", "1kg", "1k", "1kin"], "2 Kings": ["2kgs", "2ki", "2kg", "2k", "2kin"],
  "1 Chronicles": ["1chr", "1ch", "1chron"], "2 Chronicles": ["2chr", "2ch", "2chron"],
  Ezra: ["ezr"], Nehemiah: ["neh", "ne"], Esther: ["est", "es", "esth"], Job: ["jb"],
  Psalms: ["ps", "psa", "pss", "psalm", "psm", "pslm"], Proverbs: ["prov", "pr", "pro", "prv"],
  Ecclesiastes: ["eccl", "ecc", "ec", "eccles", "qoh"],
  "Song of Solomon": ["song", "sos", "so", "songofsongs", "songofsolomon", "canticles", "cant", "sng"],
  Isaiah: ["isa", "is"], Jeremiah: ["jer", "je", "jr"], Lamentations: ["lam", "la"],
  Ezekiel: ["ezek", "eze", "ezk"], Daniel: ["dan", "da", "dn"], Hosea: ["hos", "ho"],
  Joel: ["jl", "joe"], Amos: ["am"], Obadiah: ["obad", "ob"], Jonah: ["jon", "jnh"],
  Micah: ["mic", "mi"], Nahum: ["nah", "na"], Habakkuk: ["hab", "hb"], Zephaniah: ["zeph", "zep", "zp"],
  Haggai: ["hag", "hg"], Zechariah: ["zech", "zec", "zc"], Malachi: ["mal", "ml"],
  Matthew: ["matt", "mt", "mat"], Mark: ["mk", "mr", "mrk"], Luke: ["lk", "lu", "luk"],
  John: ["jn", "jhn", "joh"], Acts: ["ac", "act"], Romans: ["rom", "ro", "rm"],
  "1 Corinthians": ["1cor", "1co", "1c"], "2 Corinthians": ["2cor", "2co", "2c"],
  Galatians: ["gal", "ga"], Ephesians: ["eph", "ep"], Philippians: ["phil", "php", "pp", "philip"],
  Colossians: ["col", "co"], "1 Thessalonians": ["1thess", "1th", "1thes", "1ths"],
  "2 Thessalonians": ["2thess", "2th", "2thes", "2ths"], "1 Timothy": ["1tim", "1ti", "1tm"],
  "2 Timothy": ["2tim", "2ti", "2tm"], Titus: ["tit", "ti"], Philemon: ["philem", "phm", "pm", "phlm"],
  Hebrews: ["heb", "he"], James: ["jas", "jm", "ja"], "1 Peter": ["1pet", "1pe", "1pt", "1p"],
  "2 Peter": ["2pet", "2pe", "2pt", "2p"], "1 John": ["1jn", "1jo", "1jhn", "1j"],
  "2 John": ["2jn", "2jo", "2jhn", "2j"], "3 John": ["3jn", "3jo", "3jhn", "3j"],
  Jude: ["jud", "jd"], Revelation: ["rev", "re", "rv", "revelations", "apocalypse"],
};

const bookAliases = new Map(); // normalized alias → canonical bibleBooks name
for (const b of bibleBooks) {
  const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  bookAliases.set(key(b.name), b.name);
  bookAliases.set(key(b.abbrev), b.name);
  for (const a of EXTRA_ALIASES[b.name] || []) bookAliases.set(key(a), b.name);
}
const bookByName = new Map(bibleBooks.map((b) => [b.name, b]));

// "first john" → "1 john", "ii kings" → "2 kings", "song of solomon" kept
function normalizeBookWords(q) {
  return q
    .replace(/^\s*(first|1st)\b/i, "1").replace(/^\s*(second|2nd)\b/i, "2").replace(/^\s*(third|3rd)\b/i, "3")
    .replace(/^\s*iii\b/i, "3").replace(/^\s*ii\b/i, "2").replace(/^\s*i\b(?=\s+[a-z])/i, "1");
}

/* ─────────────────────────── Reference parsing ─────────────────────────── */

const TRANSLATION_TAIL = /\s+(kjv|niv|esv|nkjv|nlt|nasb|asv|web)\s*$/i;

/**
 * Parse "john 3:16", "jn 3.16-18", "1cor13", "psalm 23", "john 3 16",
 * "First John 4 v 8", "song of solomon 2:1". Returns
 * { book, chapter, verse, endVerse } (chapter/verse may be null) or null.
 */
export function parseReference(raw) {
  let q = normalizeBookWords(raw.trim().toLowerCase().replace(TRANSLATION_TAIL, ""));
  q = q.replace(/\./g, " ").replace(/\s+/g, " ").trim();
  const m = q.match(/^([1-3]?\s?[a-z][a-z ]*?)\s*(\d+)?(?:\s*(?::|v|vs|verse|,)?\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?\s*$/);
  if (!m) return null;
  const bookKey = m[1].replace(/[^a-z0-9]/g, "");
  if (bookKey.length < 2) return null;
  const book = bookAliases.get(bookKey);
  if (!book) return null;
  const info = bookByName.get(book);
  let chapter = m[2] ? parseInt(m[2], 10) : null;
  let verse = m[3] ? parseInt(m[3], 10) : null;
  const endVerse = m[4] ? parseInt(m[4], 10) : null;
  // Single-chapter books: "jude 5" means verse 5
  if (info.chapters === 1 && chapter && !verse) { verse = chapter; chapter = 1; }
  if (chapter && chapter > info.chapters) return null;
  return { book, chapter, verse, endVerse: endVerse && verse && endVerse > verse ? endVerse : null };
}

export function lookupReference(ref) {
  if (!index) return [];
  const indexBook = INDEX_BOOK_NAME[ref.book] || ref.book;
  const out = [];
  for (const e of index) {
    if (e.b !== indexBook && READER_BOOK_NAME[e.b] !== indexBook) continue;
    if (ref.chapter && e.c !== ref.chapter) continue;
    if (ref.verse) {
      if (e.v < ref.verse) continue;
      if (e.v > (ref.endVerse || ref.verse)) continue;
    }
    out.push(toResult(e));
    if (out.length >= 200) break;
  }
  return out;
}

/* ─────────────────────────── Vocabulary helpers ─────────────────────────── */

const QUESTION_WORDS = /\b(what|how|why|when|where|who|does|do|did|is|are|can|should|say|says|said|about|bible|scripture|scriptures|verse|verses|passage|passages)\b/;
const STOPWORDS = new Set(("what does the bible say about scripture scriptures verse verses passage passages on of in for to a an and " +
  "is are am was were be been being i me my mine we us our you your he him his she her it its they them their this that these those " +
  "there here how can could should would will shall do did done have has had when why where who whom which with from as by at or " +
  "not no if then than so some any all each every into unto out up down over under again also just really please find show give " +
  "tell me about regarding concerning teach teaches teaching says said say deal dealing handle handling cope coping " +
  "get getting feel feeling feelings struggle struggling someone something people person things thing mean means meaning " +
  "good best like want wants would know").split(/\s+/));

// Modern vocabulary → KJV vocabulary. Multi-word entries match as phrases.
const SYNONYMS = {
  anxiety: ["careful", "carefulness", "thought", "afraid", "fear", "troubled", "heaviness", "cast down"],
  anxious: "anxiety", worry: "anxiety", worried: "anxiety", worrying: "anxiety", stress: "anxiety", stressed: "anxiety", overwhelmed: "anxiety",
  depression: ["cast down", "disquieted", "heaviness", "sorrow", "sorrowful", "mourn", "comfort", "despair"],
  depressed: "depression", sad: "depression", sadness: "depression", hopeless: "depression", despair: "depression",
  money: ["money", "riches", "rich", "mammon", "silver", "gold", "treasure", "wealth", "covetousness"],
  finances: "money", financial: "money", wealth: "money", debt: ["debt", "owe", "borrow", "lend", "usury", "surety"],
  marriage: ["marriage", "marry", "married", "wife", "husband", "wedding", "bride", "bridegroom", "one flesh"],
  married: "marriage", marry: "marriage", wedding: "marriage", spouse: "marriage", husband: ["husband", "husbands"], wife: ["wife", "wives"],
  divorce: ["divorce", "divorcement", "put away", "adultery", "fornication"],
  children: ["children", "child", "little ones", "offspring", "babes"], kids: "children", child: "children", parenting: ["children", "train up", "chasten", "father", "mother", "instruction"],
  family: ["family", "father", "mother", "children", "household", "brethren", "kindred"], parents: ["father", "mother", "parents", "honour thy father"],
  anger: ["anger", "angry", "wrath", "wroth", "fury", "provoke", "slow to anger"], angry: "anger", rage: "anger", temper: "anger",
  healing: ["heal", "healed", "healeth", "healing", "sick", "sickness", "disease", "infirmity", "made whole"], heal: "healing", sick: "healing", sickness: "healing", illness: "healing", disease: "healing", cancer: "healing",
  forgiveness: ["forgive", "forgiven", "forgiveth", "forgave", "forgiveness", "remission", "pardon", "trespasses"], forgive: "forgiveness", forgiving: "forgiveness", pardon: "forgiveness",
  strength: ["strength", "strong", "strengthen", "might", "mighty", "power"], strong: "strength", strengthen: "strength", power: ["power", "might", "mighty", "strength"],
  courage: ["courage", "courageous", "be strong", "fear not", "afraid", "dismayed", "good cheer"], courageous: "courage", brave: "courage", bravery: "courage",
  fear: ["fear", "afraid", "fear not", "dread", "terror", "dismayed"], afraid: "fear", scared: "fear", fearful: "fear", terror: "fear",
  death: ["death", "die", "died", "dead", "grave", "mourn", "mourning", "sorrow", "comfort", "sleep"], dying: "death", die: "death", grief: ["mourn", "mourning", "weep", "sorrow", "comfort", "tears"], grieving: "grief", loss: "grief", mourning: "grief", funeral: "death",
  temptation: ["tempt", "tempted", "temptation", "lust", "flesh", "resist"], tempted: "temptation", tempt: "temptation",
  lying: ["lie", "liar", "lying", "lies", "false", "deceit", "deceive", "truth"], lie: "lying", liar: "lying", honesty: ["truth", "true", "honest", "honestly", "upright", "integrity"], honest: "honesty", integrity: "honesty",
  patience: ["patience", "patient", "wait", "waited", "longsuffering", "endure", "endureth"], patient: "patience", waiting: "patience", wait: "patience", perseverance: ["endure", "endureth", "patience", "run", "race", "faint not", "steadfast"], persevere: "perseverance", endurance: "perseverance",
  friendship: ["friend", "friends", "brother", "neighbour", "companion"], friend: "friendship", friends: "friendship",
  work: ["work", "works", "labour", "toil", "diligent", "diligence", "hands", "business"], job: "work", career: "work", labor: "work", diligence: ["diligent", "diligence", "slothful", "sluggard"], laziness: ["slothful", "sluggard", "idle", "idleness"], lazy: "laziness",
  leadership: ["ruler", "shepherd", "lead", "leadeth", "servant", "elder", "overseer", "bishop"], leader: "leadership", leaders: "leadership",
  giving: ["give", "giveth", "gave", "gift", "tithe", "tithes", "offering", "liberal", "bountifully", "cheerful giver"], generosity: "giving", generous: "giving", tithe: "giving", tithing: "giving", charity: ["charity", "give", "alms", "poor"],
  gratitude: ["thank", "thanks", "thanksgiving", "thankful", "praise"], thankfulness: "gratitude", thankful: "gratitude", thanks: "gratitude", thanksgiving: "gratitude",
  humility: ["humble", "humility", "lowly", "meek", "meekness"], humble: "humility", pride: ["pride", "proud", "haughty", "arrogant", "humble"], proud: "pride", arrogance: "pride",
  identity: ["created", "workmanship", "called", "chosen", "image", "child of god", "sons of god"], purpose: ["purpose", "plan", "called", "workmanship", "will of god", "thoughts"], calling: "purpose",
  heaven: ["heaven", "heavens", "kingdom", "paradise", "eternal", "mansions"], hell: ["hell", "fire", "damnation", "destruction", "torment", "lake of fire", "outer darkness"],
  spirit: ["spirit", "holy ghost", "comforter"], holyspirit: "spirit",
  jesus: ["jesus", "christ", "lord", "son of god", "saviour", "messiah", "lamb"], christ: "jesus", messiah: "jesus", savior: ["saviour", "salvation", "save"], saviour: "savior",
  trust: ["trust", "trusted", "trusteth", "confidence", "lean not", "rely"], trusting: "trust",
  worship: ["worship", "praise", "bow", "sing", "psalm", "glorify"], praise: ["praise", "worship", "sing", "glory", "bless the lord"],
  salvation: ["salvation", "saved", "save", "saviour", "redeem", "redemption", "redeemed", "born again"], saved: "salvation", redemption: "salvation", eternallife: ["eternal life", "everlasting life", "life eternal"],
  grace: ["grace", "gracious", "favour", "mercy"], mercy: ["mercy", "merciful", "mercies", "compassion", "pity", "lovingkindness"], compassion: "mercy", kindness: ["kind", "kindness", "lovingkindness", "gentle", "tenderhearted", "compassion"],
  wisdom: ["wisdom", "wise", "understanding", "knowledge", "prudent", "discretion"], wise: "wisdom", understanding: "wisdom", knowledge: ["knowledge", "know", "understanding", "wisdom"],
  loneliness: ["alone", "lonely", "forsake", "forsaken", "never leave", "with thee", "comfort", "desolate"], lonely: "loneliness", alone: "loneliness", abandoned: "loneliness",
  guidance: ["guide", "lead", "direct", "path", "paths", "way", "counsel", "wisdom", "light unto my path"], direction: "guidance", decisions: "guidance", decision: "guidance", guide: "guidance",
  addiction: ["bondage", "servant of sin", "lust", "sober", "temperance", "overcome", "deliver", "drunkenness", "wine"], addicted: "addiction", alcohol: ["wine", "strong drink", "drunken", "drunkenness", "sober"], drinking: "alcohol", drunkenness: "alcohol",
  enemies: ["enemy", "enemies", "adversary", "adversaries", "foes", "persecute", "hate you"], enemy: "enemies", persecution: ["persecute", "persecuted", "persecution", "suffer", "tribulation", "affliction"], persecuted: "persecution",
  holiness: ["holy", "holiness", "sanctify", "sanctified", "pure", "righteous", "separate"], holy: "holiness", purity: ["pure", "purity", "clean", "chaste", "holy"], pure: "purity",
  sin: ["sin", "sins", "sinned", "iniquity", "transgression", "wicked", "trespass"], sins: "sin", sinful: "sin", repentance: ["repent", "repentance", "repented", "turn", "confess"], repent: "repentance", confession: ["confess", "confession", "acknowledge"],
  peace: ["peace", "rest", "quiet", "still", "be still"], calm: "peace", rest: ["rest", "peace", "quiet", "still", "sabbath"],
  comfort: ["comfort", "comforted", "comforter", "consolation", "refuge"], comforting: "comfort", encouragement: ["encourage", "comfort", "strengthen", "good cheer", "be strong", "fear not", "lift up"], encourage: "encouragement", encouraging: "encouragement",
  joy: ["joy", "rejoice", "glad", "gladness", "happy", "blessed", "merry"], happy: "joy", happiness: "joy", rejoice: "joy", contentment: ["content", "contentment", "satisfied", "enough", "godliness with contentment"], content: "contentment",
  truth: ["truth", "true", "verily"], justice: ["justice", "judgment", "just", "righteous", "equity", "oppress", "oppressed"], injustice: "justice", oppression: "justice",
  creation: ["created", "create", "creation", "beginning", "made", "maker", "creator"], created: "creation", creator: "creation", nature: ["created", "heavens", "earth", "sea", "mountains", "trees", "creature"],
  endtimes: ["last days", "coming", "clouds", "trumpet", "tribulation", "end of the world", "son of man", "new heaven"], rapture: "endtimes", prophecy: ["prophesy", "prophecy", "prophet", "prophets", "vision", "last days"], secondcoming: "endtimes", apocalypse: "endtimes",
  baptism: ["baptize", "baptized", "baptism", "baptizing", "baptist"], baptize: "baptism", baptized: "baptism",
  communion: ["bread", "cup", "body", "blood", "remembrance", "supper", "broken"], lordssupper: "communion", eucharist: "communion",
  angels: ["angel", "angels", "cherubim", "seraphim", "host"], angel: "angels",
  satan: ["satan", "devil", "devils", "serpent", "adversary", "evil spirit", "unclean spirit", "beelzebub", "lucifer"], devil: "satan", demons: "satan", demon: "satan", evil: ["evil", "wicked", "wickedness", "iniquity", "devil"],
  prayer: ["pray", "prayer", "prayed", "prayeth", "praying", "supplication", "intercession", "ask"], pray: "prayer", praying: "prayer", intercession: "prayer", fasting: ["fast", "fasted", "fasting", "sackcloth"],
  faith: ["faith", "believe", "believeth", "believed", "faithful", "trust"], believe: "faith", belief: "faith", doubt: ["doubt", "doubted", "unbelief", "wavering", "little faith"], doubting: "doubt", unbelief: "doubt",
  love: ["love", "loved", "loveth", "charity", "beloved"], loving: "love", hope: ["hope", "hoped", "hopeth", "expectation", "wait"],
  marriagebed: "marriage", sex: ["fornication", "adultery", "lust", "flesh", "marriage bed", "chaste", "defile"], lust: ["lust", "lusts", "concupiscence", "flesh", "adultery", "fornication"], adultery: ["adultery", "adulterer", "adulteress", "fornication"], pornography: "lust", sexuality: "sex",
  gossip: ["talebearer", "whisperer", "backbiting", "tongue", "slander", "busybody"], slander: "gossip", tongue: ["tongue", "mouth", "lips", "words", "speech"], words: "tongue", speech: "tongue",
  jealousy: ["jealous", "jealousy", "envy", "envying", "covet"], jealous: "jealousy", envy: "jealousy", covet: "jealousy",
  obedience: ["obey", "obeyed", "obedience", "obedient", "keep my commandments", "hearken"], obey: "obedience", obedient: "obedience", disobedience: ["disobedient", "disobey", "rebel", "rebellion", "stiffnecked"], rebellion: "disobedience",
  suffering: ["suffer", "suffered", "suffering", "affliction", "afflicted", "tribulation", "trial", "trials", "chastening"], suffer: "suffering", trials: "suffering", trial: "suffering", hardship: "suffering", pain: ["pain", "suffer", "affliction", "sorrow", "grief", "hurt"], hurt: "pain",
  war: ["war", "battle", "fight", "sword", "armies", "host"], violence: ["violence", "violent", "murder", "kill", "blood"], murder: ["murder", "kill", "slay", "slew", "blood"],
  government: ["king", "kings", "ruler", "rulers", "powers", "caesar", "magistrate", "authority"], authority: ["authority", "power", "powers", "ruler", "submit", "obey"], politics: "government",
  church: ["church", "churches", "assembly", "congregation", "body of christ", "brethren"], fellowship: ["fellowship", "assembling", "together", "brethren", "one another"], community: "fellowship",
  discipleship: ["disciple", "disciples", "follow me", "take up his cross", "deny himself"], disciple: "discipleship", evangelism: ["preach", "gospel", "witness", "witnesses", "go ye", "teach all nations"], witnessing: "evangelism", missions: "evangelism", greatcommission: "evangelism",
  blessing: ["bless", "blessed", "blessing", "blessings", "favour"], blessings: "blessing", blessed: "blessing", success: ["prosper", "prosperous", "good success", "blessed", "diligent"], prosperity: "success",
  cross: ["cross", "crucified", "crucify", "calvary", "golgotha", "blood"], resurrection: ["resurrection", "risen", "rose again", "raised", "third day", "empty"], easter: "resurrection", christmas: ["born", "birth", "bethlehem", "manger", "mary", "wise men", "shepherds", "immanuel"], nativity: "christmas",
  law: ["law", "commandment", "commandments", "statutes", "ordinances", "precepts"], commandments: "law", tencommandments: ["thou shalt not", "commandments", "sinai", "tables of stone"],
  covenant: ["covenant", "promise", "promised", "oath"], promise: ["promise", "promises", "promised", "covenant", "sware"], promises: "promise",
  water: ["water", "waters", "living water", "thirst", "well", "river"], light: ["light", "lamp", "shine", "candle", "darkness"], darkness: ["darkness", "dark", "night", "light"], bread: ["bread", "loaves", "manna", "bread of life"],
  shepherd: ["shepherd", "sheep", "flock", "pasture", "fold"], sheep: "shepherd", lamb: ["lamb", "lamb of god", "sheep"],
  time: ["time", "times", "season", "seasons", "day", "days", "hour"], age: ["old", "aged", "grey", "hoary", "elder", "ancient"], aging: "age", elderly: "age", youth: ["young", "youth", "child", "children", "young man"],
  widow: ["widow", "widows", "fatherless"], orphan: ["fatherless", "orphans", "widow"], poor: ["poor", "needy", "beggar", "alms", "oppressed"], poverty: "poor", homeless: "poor",
  stranger: ["stranger", "strangers", "sojourner", "alien", "foreigner"], immigration: "stranger", immigrant: "stranger", refugees: "stranger", hospitality: ["hospitality", "stranger", "lodge", "entertain", "given to hospitality"],
  animals: ["beast", "beasts", "cattle", "creature", "creatures", "fowl", "fish"], dogs: ["dog", "dogs"], dog: "dogs",
  sabbath: ["sabbath", "rest", "seventh day", "holy day"], sunday: "sabbath",
  body: ["body", "temple", "flesh", "members"], health: ["health", "heal", "whole", "strength", "sound"], food: ["eat", "meat", "bread", "food", "hunger", "feast"], eating: "food", diet: "food", gluttony: ["glutton", "gluttonous", "excess", "eat", "belly"],
  sleep: ["sleep", "slumber", "rest", "night"], dreams: ["dream", "dreams", "vision", "visions", "night"], dream: "dreams", visions: "dreams",
  music: ["sing", "singing", "song", "songs", "psalm", "harp", "instruments", "praise"], singing: "music", worshipmusic: "music",
  clothing: ["clothed", "clothing", "garment", "garments", "raiment", "apparel", "modest"], modesty: "clothing", beauty: ["beauty", "beautiful", "fair", "comely", "favour is deceitful"],
  neighbor: ["neighbour", "neighbours", "one another", "brother"], neighbour: "neighbor", others: "neighbor", serving: ["serve", "servant", "minister", "ministering", "one another"], service: "serving", servant: "serving", volunteer: "serving",
  future: ["future", "hereafter", "things to come", "expected end", "hope", "plans", "thoughts"], plans: "future", planning: "future",
  victory: ["victory", "overcome", "overcometh", "conquer", "conquerors", "triumph", "prevail"], overcoming: "victory", overcome: "victory",
  armor: ["armour", "sword", "shield", "helmet", "breastplate", "wiles of the devil"], armour: "armor", spiritualwarfare: ["armour", "wiles of the devil", "principalities", "powers", "resist the devil", "wrestle"], warfare: "spiritualwarfare",
  eternity: ["eternal", "everlasting", "for ever", "ever and ever", "eternity"], eternal: "eternity", forever: "eternity", everlasting: "eternity",
  newlife: ["new creature", "born again", "new man", "old things are passed away", "regeneration"], bornagain: "newlife", transformation: ["transformed", "renewing", "new creature", "changed", "new man"], change: "transformation",
  unity: ["unity", "one accord", "one mind", "together", "one body", "peace"], division: ["division", "divisions", "strife", "contention", "schism", "variance"], conflict: "division", arguing: "division", fighting: "division", strife: "division", disagreement: "division",
  respect: ["honour", "honor", "reverence", "esteem", "regard"], honor: "respect", honour: "respect",
  selfcontrol: ["temperance", "temperate", "sober", "self-control", "rule his spirit", "bridle"], discipline: ["chasten", "chastening", "chastise", "correction", "instruction", "rod", "discipline"], correction: "discipline",
  loveofgod: ["love of god", "god so loved", "loved us", "his love", "great love"], godslove: "loveofgod",
  thanksgivingday: "gratitude",
  fruit: ["fruit", "fruits", "fruit of the spirit", "bear fruit", "bring forth fruit"], fruitofthespirit: ["love", "joy", "peace", "longsuffering", "gentleness", "goodness", "faith", "meekness", "temperance", "fruit of the spirit"],
  refuge: ["refuge", "fortress", "rock", "shield", "strong tower", "hiding place", "shelter"], protection: ["protect", "keep", "keepeth", "preserve", "refuge", "shield", "deliver", "cover"], safety: "protection", safe: "protection", security: "protection", shelter: "refuge",
  provision: ["provide", "provided", "supply", "supplied", "need", "needs", "daily bread", "feed", "jehovah-jireh"], provide: "provision", needs: "provision",
  miracles: ["miracle", "miracles", "wonders", "signs", "mighty works", "healed"], miracle: "miracles", signs: "miracles",
  rain: ["rain", "latter rain", "former rain", "showers"], storm: ["storm", "tempest", "wind", "winds", "waves", "whirlwind"], storms: "storm",
  mountains: ["mountain", "mountains", "hill", "hills", "mount"], mountain: "mountains",
};

function expandTerm(term) {
  const key = term.toLowerCase().replace(/[^a-z]/g, "");
  let alts = SYNONYMS[key];
  if (typeof alts === "string") alts = SYNONYMS[alts];
  const set = new Set([term]);
  if (Array.isArray(alts)) for (const a of alts) set.add(a);
  return [...set];
}

/* ─────────────────────────── Query parsing ─────────────────────────── */

export function parseQuery(raw) {
  const q = raw.trim();
  const phrases = [];
  let rest = q.replace(/"([^"]+)"/g, (_, p) => { phrases.push(p.trim().toLowerCase()); return " "; });
  const tokens = rest.toLowerCase().replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean);
  const naturalLanguage = tokens.length >= 4 || QUESTION_WORDS.test(rest.toLowerCase());
  let terms = naturalLanguage ? tokens.filter((t) => !STOPWORDS.has(t)) : tokens;
  if (terms.length === 0) terms = tokens;
  // "holy spirit", "end times" etc. also try the joined form as one synonym key
  const joined = terms.join("");
  if (terms.length > 1 && SYNONYMS[joined]) terms = [joined];
  return { phrases, terms, naturalLanguage };
}

/* ─────────────────────────── Keyword search ─────────────────────────── */

// Curated topic verses plus the verses people most often search for get a nudge
// so they win ties against obscure short verses.
const FAMOUS = ["Genesis 1:1", "John 1:1", "John 3:16", "John 11:35", "John 14:6", "Psalms 23:1", "Psalms 46:10", "Psalms 119:105",
  "Romans 3:23", "Romans 6:23", "Romans 8:28", "Romans 12:2", "Philippians 4:13", "Philippians 4:6", "Jeremiah 29:11", "Proverbs 3:5",
  "Proverbs 22:6", "Isaiah 41:10", "Isaiah 53:5", "Matthew 6:33", "Matthew 11:28", "Matthew 28:19", "Joshua 1:9", "Galatians 5:22",
  "Hebrews 11:1", "1 Corinthians 13:4", "Ephesians 2:8", "2 Timothy 3:16", "Revelation 21:4", "Micah 6:8", "Genesis 1:27", "Exodus 20:3"];
const topicVerseRefs = new Set([...FAMOUS, ...topics.flatMap((t) => t.verses.map((v) => v.replace(/[-–]\d+$/, "")))]);

function toResult(e) {
  return { ref: e.r, book: toReaderBook(e.b), chapter: e.c, verse: e.v, text: e.t };
}

/**
 * Rank verses for a keyword/phrase/natural-language query.
 * Options: { books: Set<string> | null, mode: "all" | "any" | "exact" }
 */
export function keywordSearch(raw, { books = null, mode = "all", limit = 200 } = {}) {
  if (!index) return { results: [], terms: [], highlight: [] };
  const { phrases, terms } = parseQuery(raw);
  const fullLower = raw.trim().toLowerCase();

  if (mode === "exact" && phrases.length === 0) phrases.push(fullLower);

  // Each term becomes a group of alternatives: {stems:Set, phrases:[]}
  const groups = terms.map((t) => {
    const alts = expandTerm(t);
    const stems = new Set();
    const altPhrases = [];
    for (const a of alts) {
      if (a.includes(" ")) altPhrases.push(a.toLowerCase());
      else stems.add(stem(a));
    }
    // Position in the synonym list doubles as strength: early alternatives are the best KJV equivalents
    const weight = new Map();
    alts.forEach((a, i) => weight.set(a.includes(" ") ? a.toLowerCase() : stem(a), i === 0 ? 100 : Math.max(50, 92 - i * 5)));
    return { term: t, stems, phrases: altPhrases, direct: stem(t), weight };
  });

  const highlight = new Set();
  for (const g of groups) { for (const s of g.stems) highlight.add(s); }
  const highlightPhrases = [...phrases, ...groups.flatMap((g) => g.phrases)];

  const scored = [];
  const needAll = mode !== "any";
  const minGroups = needAll ? groups.length : Math.max(1, Math.ceil(groups.length / 2));

  for (const e of index) {
    if (books && !books.has(toReaderBook(e.b))) continue;
    // Quoted / exact phrases are mandatory
    let ok = true;
    for (const p of phrases) if (!e.lower.includes(p)) { ok = false; break; }
    if (!ok) continue;

    let matched = 0, score = 0;
    for (const g of groups) {
      let best = 0;
      for (const s of g.stems) if (e.stems.has(s)) best = Math.max(best, g.weight.get(s) || 50);
      if (best < 100) for (const p of g.phrases) if (e.lower.includes(p)) best = Math.max(best, g.weight.get(p) || 50);
      if (best) { matched++; score += best; }
    }
    if (groups.length && matched < minGroups) continue;
    if (!groups.length && !phrases.length) continue;

    score += phrases.length * 40;
    if (groups.length > 1 && (e.lower.includes(fullLower) || e.lower.includes(terms.join(" ")))) score += 80;
    if (topicVerseRefs.has(e.r)) score += 35;
    score -= Math.min(30, e.t.length / 12);
    scored.push({ e, score, matched });
  }

  scored.sort((a, b) => b.score - a.score || a.e.c - b.e.c);
  return {
    results: scored.slice(0, limit).map(({ e, matched }) => ({ ...toResult(e), full: matched === groups.length })),
    total: scored.length,
    terms,
    highlight: [...highlight],
    highlightPhrases,
  };
}

/* ─────────────────────────── Fuzzy suggestions ─────────────────────────── */

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0]; prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length];
}

/** For terms with no match in the KJV vocabulary, suggest the closest real word. */
export function suggestCorrection(raw) {
  if (!vocab) return null;
  const { terms } = parseQuery(raw);
  let changed = false;
  const fixed = terms.map((t) => {
    if (t.length < 3 || vocab.has(t) || SYNONYMS[t]) return t;
    const st = stem(t);
    for (const w of vocab.keys()) if (stem(w) === st) return t;
    let best = null, bestScore = Infinity;
    for (const [w, count] of vocab) {
      if (count < 2 || w.length < 3) continue;
      const d = editDistance(t, w);
      if (d > 2) continue;
      // Same first letter and similar length beat raw frequency on ties
      let prefix = 0; while (prefix < t.length && prefix < w.length && t[prefix] === w[prefix]) prefix++;
      const s = d * 1000 - Math.min(count, 500) + (w[0] === t[0] ? 0 : 400) + Math.abs(w.length - t.length) * 100 - prefix * 80;
      if (s < bestScore) { bestScore = s; best = w; }
    }
    if (best) { changed = true; return best; }
    return t;
  });
  return changed ? fixed.join(" ") : null;
}

/* ─────────────────────────── Topics & books ─────────────────────────── */

const TOPIC_ALIASES = {
  money: "Giving & Generosity", finances: "Giving & Generosity", tithe: "Giving & Generosity", tithing: "Giving & Generosity",
  worry: "Fear & Anxiety", worried: "Fear & Anxiety", anxious: "Fear & Anxiety", stress: "Fear & Anxiety", scared: "Fear & Anxiety", afraid: "Fear & Anxiety",
  promise: "God's Promises", promises: "God's Promises", spirit: "Holy Spirit", holyspirit: "Holy Spirit",
  mercy: "Grace & Mercy", patience: "Patience & Endurance", perseverance: "Patience & Endurance", endurance: "Patience & Endurance", waiting: "Patience & Endurance",
  praise: "Worship & Praise", heaven: "Heaven & Eternity", eternity: "Heaven & Eternity", identity: "Identity in Christ", purpose: "Identity in Christ",
  easter: "The Resurrection", rapture: "The Return of Christ", endtimes: "The Return of Christ", secondcoming: "The Return of Christ",
  armor: "The Armor of God", armour: "The Armor of God", spiritualwarfare: "The Armor of God", wedding: "Marriage", husband: "Marriage", wife: "Marriage",
  trials: "Suffering", pain: "Suffering", grief: "Suffering", hardship: "Suffering", bible: "Scripture & God's Word", scripture: "Scripture & God's Word", word: "Scripture & God's Word",
  blood: "The Blood of Christ", cross: "The Blood of Christ", generosity: "Giving & Generosity", giving: "Giving & Generosity", humble: "Humility", obey: "Obedience",
};
const TOPIC_NOISE = new Set(["the", "of", "in", "and", "god's", "gods", "christ"]);
const topicWords = topics.map((t) => ({ t, words: new Set(t.name.toLowerCase().split(/[^a-z']+/).filter((w) => w && !TOPIC_NOISE.has(w)).map(stem)) }));

export function matchTopic(raw) {
  const { terms } = parseQuery(raw);
  if (!terms.length || terms.length > 3) return null;
  const joined = terms.join("");
  const alias = TOPIC_ALIASES[joined] || TOPIC_ALIASES[terms[0]];
  if (alias) return topics.find((t) => t.name === alias) || null;
  const key = terms.join(" ");
  for (const t of topics) if (t.name.toLowerCase() === key) return t;
  const stems = new Set(terms.map(stem));
  if (terms.length === 1) for (const a of expandTerm(terms[0]).slice(0, 3)) stems.add(stem(a));
  let best = null, bestHits = 0;
  for (const { t, words } of topicWords) {
    let hits = 0;
    for (const w of words) if (stems.has(w)) hits++;
    if (hits > bestHits) { best = t; bestHits = hits; }
  }
  return best;
}

export function matchBook(raw) {
  const key = normalizeBookWords(raw.trim().toLowerCase()).replace(/[^a-z0-9]/g, "");
  if (key.length < 3) return null;
  const name = bookAliases.get(key);
  return name ? bookByName.get(name) : null;
}

/* ─────────────────────────── Strong's ─────────────────────────── */

const STRONGS_RE = /^\s*([hg])\s*0*(\d{1,5})\s*$/i;
export function parseStrongs(raw) {
  const m = raw.match(STRONGS_RE);
  return m ? `${m[1].toUpperCase()}${m[2]}` : null;
}

let lexiconPromise = null, concordancePromise = null;
export function getLexicon() {
  if (!lexiconPromise) lexiconPromise = fetch("/data/lexicon.json").then((r) => r.json());
  return lexiconPromise;
}
export function getConcordance() {
  if (!concordancePromise) concordancePromise = fetch("/data/concordance.json").then((r) => r.json());
  return concordancePromise;
}

const stripDiacritics = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
// Collapse the usual transliteration variants (šālôm / shalom, ḥesed / chesed / hesed, agapē / agape)
const translitKey = (s) => stripDiacritics(s).replace(/sh/g, "s").replace(/kh|ch/g, "h").replace(/ph/g, "f").replace(/tz|ts/g, "s").replace(/ck|q/g, "k").replace(/y/g, "i").replace(/(.)\1/g, "$1");
const stripPoints = (s) => (s || "").normalize("NFD").replace(/[֑-ׇ̀-ͯ]/g, "");

/** Short human-readable gloss for a lexicon entry (the dataset has no clean kjv_def field). */
export function lexiconSummary(entry) {
  if (!entry) return "";
  const occ = (entry.occurrences || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (occ.length) {
    const seen = new Set(); const out = [];
    for (const o of occ) { const w = o.replace(/\(\d+x\)/, "").trim(); if (w && !seen.has(w)) { seen.add(w); out.push(w); } if (out.length >= 6) break; }
    return out.join(", ");
  }
  return (entry.strongs_def || "").replace(/^null/, "").replace(/&#39\s*/g, "'").replace(/\s+/g, " ").trim().slice(0, 140);
}

/** Find lexicon entries whose transliteration or original word matches (e.g. "agape", "shalom", "אלהים"). */
export async function lookupOriginalWord(raw) {
  const q = raw.trim();
  if (!q || q.includes(" ")) return [];
  const lex = await getLexicon();
  const hasScript = /[֐-׿Ͱ-Ͽ]/.test(q);
  const key = translitKey(q);
  const qScript = stripPoints(q);
  if (!hasScript && key.length < 3) return [];
  const hits = [];
  for (const [id, entry] of Object.entries(lex)) {
    if (hasScript) {
      if (stripPoints(entry.Hb_word || entry.Gk_word || entry.lemma).includes(qScript)) hits.push({ id, entry });
    } else if (translitKey(entry.transliteration || entry.translit) === key) {
      hits.push({ id, entry });
    }
    if (hits.length >= 8) break;
  }
  return hits;
}
