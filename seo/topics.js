/**
 * seo/topics.js
 * Topic pages for /verses-about/<slug>. Combines the app's own topic index
 * (src/data/topicIndex.js — what the Topics screen shows) with additional
 * topics chosen from the most-searched "bible verses about ___" queries.
 *
 * Every reference below is KJV chapter:verse and must resolve in seo/data/kjv.json
 * (render.js drops any that don't, and `node seo/check.mjs` reports them).
 *
 * `aliases` are alternate slugs that 301 to the canonical page.
 */
import appTopics from "../src/data/topicIndex.js";

const slugOf = (name) =>
  name.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const extra = [
  { name: "Inspirational", aliases: ["inspiration", "motivation", "motivational"],
    verses: ["Philippians 4:13", "Jeremiah 29:11", "Isaiah 40:31", "Romans 8:28", "Psalm 23:1", "Proverbs 3:5-6", "Joshua 1:9", "Matthew 19:26", "2 Corinthians 5:17", "Psalm 46:10", "Isaiah 41:10", "Philippians 4:6-7"] },
  { name: "Healing", aliases: ["health", "sickness", "the-sick"],
    verses: ["Jeremiah 17:14", "Psalm 147:3", "James 5:14-15", "Isaiah 53:5", "Exodus 15:26", "Psalm 103:2-3", "1 Peter 2:24", "Jeremiah 30:17", "Psalm 30:2", "Matthew 9:35", "Malachi 4:2", "3 John 1:2"] },
  { name: "Encouragement", aliases: ["encouraging", "encourage", "discouragement"],
    verses: ["Isaiah 41:10", "Joshua 1:9", "Psalm 46:1", "Philippians 4:13", "Deuteronomy 31:8", "Isaiah 40:31", "Romans 8:31", "Psalm 23:4", "2 Corinthians 4:16-18", "Hebrews 12:1-2", "Psalm 31:24", "John 16:33"] },
  { name: "God's Love", aliases: ["gods-love-for-us", "the-love-of-god"],
    verses: ["John 3:16", "Romans 5:8", "1 John 4:9-10", "Romans 8:38-39", "Jeremiah 31:3", "Psalm 136:26", "Ephesians 2:4-5", "1 John 3:1", "Zephaniah 3:17", "Psalm 86:15", "Lamentations 3:22-23", "John 15:9"] },
  { name: "Friendship", aliases: ["friends", "friend"],
    verses: ["Proverbs 17:17", "Proverbs 18:24", "John 15:13", "Ecclesiastes 4:9-10", "Proverbs 27:17", "1 Samuel 18:1", "Proverbs 27:9", "John 15:15", "Proverbs 13:20", "Ruth 1:16", "1 Thessalonians 5:11", "Proverbs 22:24-25"] },
  { name: "Blessings", aliases: ["blessing", "being-blessed"],
    verses: ["Numbers 6:24-26", "Jeremiah 17:7-8", "Psalm 1:1-3", "Deuteronomy 28:2", "Ephesians 1:3", "James 1:17", "Proverbs 10:22", "Psalm 34:8", "Matthew 5:8", "Philippians 4:19", "Psalm 23:5-6", "Malachi 3:10"] },
  { name: "Protection", aliases: ["safety", "gods-protection"],
    verses: ["Psalm 91:1-2", "Psalm 91:4", "Psalm 121:7-8", "Proverbs 18:10", "2 Thessalonians 3:3", "Psalm 46:1", "Isaiah 54:17", "Psalm 27:1", "Psalm 18:2", "Deuteronomy 31:6", "Psalm 32:7", "Nahum 1:7"] },
  { name: "Grief & Loss", aliases: ["grief", "loss", "mourning", "losing-a-loved-one"],
    verses: ["Psalm 34:18", "Matthew 5:4", "Revelation 21:4", "Psalm 147:3", "John 14:1-3", "1 Thessalonians 4:13-14", "Isaiah 41:10", "Psalm 23:4", "2 Corinthians 1:3-4", "John 11:25-26", "Psalm 30:5", "Romans 8:38-39"] },
  { name: "Fasting", aliases: ["fasting-and-prayer"],
    verses: ["Matthew 6:16-18", "Joel 2:12", "Isaiah 58:6", "Matthew 4:1-2", "Acts 13:2-3", "Daniel 10:2-3", "Ezra 8:23", "Nehemiah 1:4", "Psalm 35:13", "Esther 4:16", "Matthew 17:21", "Acts 14:23"] },
  { name: "Anger", aliases: ["being-angry", "wrath"],
    verses: ["James 1:19-20", "Ephesians 4:26-27", "Proverbs 15:1", "Proverbs 29:11", "Ecclesiastes 7:9", "Psalm 37:8", "Proverbs 14:29", "Colossians 3:8", "Proverbs 16:32", "Ephesians 4:31-32", "Proverbs 19:11", "Proverbs 15:18"] },
  { name: "Depression", aliases: ["sadness", "feeling-down", "despair"],
    verses: ["Psalm 34:17-18", "Psalm 42:11", "Psalm 40:1-3", "Isaiah 41:10", "Matthew 11:28-30", "Psalm 143:7-8", "1 Peter 5:7", "Psalm 30:5", "Deuteronomy 31:8", "Psalm 9:9", "Romans 15:13", "Psalm 3:3"] },
  { name: "Trusting God", aliases: ["trust", "trust-in-god", "trusting-in-the-lord"],
    verses: ["Proverbs 3:5-6", "Psalm 56:3-4", "Isaiah 26:3-4", "Psalm 37:5", "Jeremiah 17:7", "Psalm 9:10", "Nahum 1:7", "Psalm 20:7", "Psalm 118:8", "Psalm 28:7", "Isaiah 12:2", "Psalm 62:8"] },
  { name: "Children & Parenting", aliases: ["children", "parenting", "parents", "kids", "raising-children"],
    verses: ["Proverbs 22:6", "Psalm 127:3", "Ephesians 6:1-4", "Deuteronomy 6:6-7", "Mark 10:14", "Proverbs 29:17", "Matthew 19:14", "Psalm 139:13-14", "Colossians 3:20-21", "Proverbs 1:8-9", "3 John 1:4", "Isaiah 54:13"] },
  { name: "Family", aliases: ["families", "home"],
    verses: ["Joshua 24:15", "Psalm 133:1", "Proverbs 22:6", "Ephesians 6:1-4", "1 Timothy 5:8", "Exodus 20:12", "Colossians 3:13", "Psalm 128:3", "Deuteronomy 6:6-7", "1 Peter 4:8", "Genesis 2:24", "Proverbs 31:28"] },
  { name: "Money & Finances", aliases: ["money", "finances", "wealth", "debt"],
    verses: ["Matthew 6:24", "1 Timothy 6:10", "Hebrews 13:5", "Proverbs 22:7", "Luke 16:10-11", "Proverbs 3:9-10", "Matthew 6:33", "Philippians 4:19", "Proverbs 13:11", "Ecclesiastes 5:10", "Malachi 3:10", "Proverbs 21:20"] },
  { name: "Work", aliases: ["working", "hard-work", "your-job", "labor"],
    verses: ["Colossians 3:23-24", "Proverbs 16:3", "Ecclesiastes 9:10", "2 Thessalonians 3:10", "Proverbs 14:23", "Genesis 2:15", "1 Corinthians 15:58", "Proverbs 12:11", "Ephesians 6:7", "Proverbs 22:29", "Psalm 90:17", "1 Corinthians 10:31"] },
  { name: "Death", aliases: ["dying", "death-and-dying", "funerals"],
    verses: ["John 11:25-26", "Psalm 23:4", "Revelation 21:4", "Romans 6:23", "1 Corinthians 15:55-57", "Philippians 1:21", "2 Corinthians 5:8", "Psalm 116:15", "John 14:1-3", "Ecclesiastes 3:1-2", "Romans 14:8", "1 Thessalonians 4:13-14"] },
  { name: "Joy", aliases: ["happiness", "rejoicing"],
    verses: ["Nehemiah 8:10", "Psalm 16:11", "Philippians 4:4", "John 15:11", "Romans 15:13", "Psalm 30:5", "James 1:2-3", "Galatians 5:22-23", "Psalm 118:24", "1 Peter 1:8", "Habakkuk 3:18", "Psalm 126:5"] },
  { name: "Thankfulness", aliases: ["gratitude", "thanksgiving", "being-thankful", "giving-thanks"],
    verses: ["1 Thessalonians 5:18", "Psalm 100:4", "Colossians 3:15-17", "Psalm 107:1", "Philippians 4:6", "Ephesians 5:20", "Psalm 136:1", "James 1:17", "Colossians 4:2", "Psalm 95:2", "Hebrews 13:15", "2 Corinthians 9:15"] },
  { name: "Courage", aliases: ["being-brave", "bravery", "boldness"],
    verses: ["Joshua 1:9", "Deuteronomy 31:6", "Psalm 27:14", "Isaiah 41:10", "1 Corinthians 16:13", "Psalm 31:24", "2 Timothy 1:7", "Psalm 56:3-4", "Proverbs 28:1", "Psalm 27:1", "John 16:33", "Ephesians 6:10"] },
  { name: "Temptation", aliases: ["resisting-temptation", "sin"],
    verses: ["1 Corinthians 10:13", "James 1:12-14", "Matthew 26:41", "Hebrews 4:15", "James 4:7", "2 Peter 2:9", "Hebrews 2:18", "Psalm 119:11", "Matthew 6:13", "Galatians 5:16", "1 Peter 5:8-9", "Proverbs 4:14-15"] },
  { name: "Loneliness", aliases: ["being-alone", "feeling-alone", "lonely"],
    verses: ["Deuteronomy 31:6", "Psalm 25:16", "Isaiah 41:10", "Matthew 28:20", "Psalm 68:6", "Hebrews 13:5", "Psalm 139:7-10", "Joshua 1:9", "Psalm 27:10", "John 14:18", "Psalm 23:4", "1 Peter 5:7"] },
  { name: "Comfort", aliases: ["comforting", "gods-comfort"],
    verses: ["2 Corinthians 1:3-4", "Psalm 23:4", "Matthew 11:28-30", "Psalm 34:18", "Isaiah 40:1", "John 14:27", "Psalm 119:50", "Isaiah 51:12", "Psalm 46:1", "Matthew 5:4", "Isaiah 49:13", "Psalm 147:3"] },
];

// Aliases for the app's own topics (their slugs come from the name)
const appAliases = {
  "fear-and-anxiety": ["anxiety", "fear", "worry", "stress", "being-afraid"],
  "gods-promises": ["promises", "promises-of-god"],
  "scripture-and-gods-word": ["the-bible", "gods-word", "scripture"],
  "worship-and-praise": ["worship", "praise"],
  "patience-and-endurance": ["patience", "endurance", "perseverance", "waiting"],
  "grace-and-mercy": ["grace", "mercy"],
  "heaven-and-eternity": ["heaven"],
  "giving-and-generosity": ["giving", "generosity", "tithing"],
  "identity-in-christ": ["identity", "who-i-am-in-christ"],
  "the-blood-of-christ": ["the-blood-of-jesus"],
  "the-return-of-christ": ["the-second-coming", "second-coming"],
  "salvation": ["being-saved", "how-to-be-saved"],
  "love": ["loving-others"],
  "marriage": ["husbands", "wives", "husband-and-wife"],
  "suffering": ["hard-times", "trials", "pain"],
  "strength": ["being-strong", "strength-in-hard-times"],
  "hope": ["hope-for-the-future"],
  "peace": ["peace-of-mind"],
};

// Additional verses for the app's topics, so the highest-volume pages aren't thin.
// (The app's Topics screen still shows only its own 10.)
const moreVerses = {
  "fear-and-anxiety": ["Matthew 6:34", "Matthew 6:25-27", "Psalm 94:19", "Proverbs 12:25", "John 14:27", "Isaiah 43:1-2", "Psalm 118:6", "Romans 8:15", "Psalm 27:1", "Deuteronomy 31:6", "Matthew 11:28-30", "1 John 4:18", "Psalm 46:1-2", "Psalm 55:22", "Isaiah 26:3"],
  strength: ["Psalm 28:7", "Psalm 18:2", "Habakkuk 3:19", "Isaiah 12:2", "2 Timothy 1:7", "Psalm 73:26", "Exodus 15:2", "1 Chronicles 16:11", "Psalm 118:14", "Isaiah 40:29", "Psalm 138:3", "2 Corinthians 4:16"],
  love: ["Mark 12:30-31", "1 John 4:7", "John 13:34-35", "1 Corinthians 16:14", "Proverbs 10:12", "Romans 12:9-10", "1 John 3:18", "Song of Solomon 8:7", "Romans 13:10", "1 John 4:16", "Galatians 5:13-14", "Ephesians 4:2"],
  hope: ["Psalm 33:18", "Psalm 71:5", "Micah 7:7", "Psalm 62:5", "Romans 8:24-25", "Titus 2:13", "Hebrews 11:1", "Psalm 31:24", "Proverbs 23:18", "Psalm 39:7", "Lamentations 3:24-26", "1 Peter 1:13", "Romans 12:12"],
  peace: ["Psalm 4:8", "Isaiah 9:6", "Matthew 5:9", "Psalm 34:14", "Romans 12:18", "Philippians 4:9", "Isaiah 32:17", "Psalm 119:165", "Hebrews 12:14", "2 Corinthians 13:11", "Romans 5:1", "Isaiah 54:10"],
  faith: ["Ephesians 2:8-9", "Romans 5:1", "1 Corinthians 2:5", "Matthew 21:22", "Luke 17:5-6", "Romans 4:20-21", "2 Timothy 4:7", "1 Timothy 6:12", "Habakkuk 2:4", "James 1:6", "Mark 9:23", "Ephesians 3:17", "1 Peter 1:7"],
  forgiveness: ["Mark 11:25", "Luke 23:34", "Psalm 86:5", "Daniel 9:9", "Ephesians 1:7", "Hebrews 8:12", "Isaiah 43:25", "Proverbs 17:9", "Matthew 26:28", "2 Chronicles 7:14", "Psalm 32:1", "Luke 17:3-4"],
  prayer: ["Matthew 6:6", "Luke 18:1", "Colossians 4:2", "Psalm 55:17", "Ephesians 6:18", "Romans 12:12", "Matthew 21:22", "Psalm 66:19-20", "John 15:7", "Matthew 26:41", "Psalm 17:6", "1 Timothy 2:1", "Hebrews 4:16", "Luke 11:9"],
  marriage: ["Genesis 2:24", "Ephesians 5:33", "Proverbs 18:22", "Hebrews 13:4", "1 Corinthians 13:4-7", "Ecclesiastes 4:12", "Mark 10:9", "Colossians 3:18-19", "1 Peter 3:7", "Proverbs 31:10", "Song of Solomon 8:6-7", "Ephesians 5:25", "Ephesians 5:22", "Genesis 2:18", "1 Corinthians 7:3"],
  "gods-promises": ["2 Corinthians 1:20", "Hebrews 10:23", "Numbers 23:19", "Joshua 21:45", "Psalm 145:13", "2 Peter 1:4", "Isaiah 40:31", "Romans 4:21", "Hebrews 6:18", "Deuteronomy 7:9", "1 Kings 8:56", "2 Peter 3:9", "Isaiah 55:11", "Jeremiah 29:11"],
  salvation: ["John 1:12", "1 Timothy 2:3-4", "Isaiah 12:2", "Psalm 27:1", "Romans 10:13", "Luke 19:10", "John 5:24", "Acts 2:21", "Hebrews 7:25", "1 Peter 1:8-9", "Titus 2:11", "Romans 1:16"],
  healing: ["Psalm 41:3", "Isaiah 57:18-19", "Proverbs 17:22", "Psalm 6:2", "Mark 5:34", "Luke 6:19", "Proverbs 4:20-22", "2 Kings 20:5", "Psalm 107:20"],
  encouragement: ["Psalm 55:22", "Isaiah 43:2", "Psalm 34:17", "Matthew 11:28", "Galatians 6:9", "Romans 15:5", "1 Chronicles 28:20", "Psalm 27:14", "Lamentations 3:22-23"],
};
const withMore = (slug, verses) => [...new Set([...verses, ...(moreVerses[slug] || [])])];

const fromApp = appTopics.map((t) => {
  const slug = slugOf(t.name);
  return { name: t.name, slug, aliases: appAliases[slug] || [], verses: withMore(slug, t.verses) };
});

export const TOPICS = [...fromApp, ...extra.map((t) => ({ ...t, slug: slugOf(t.name), verses: withMore(slugOf(t.name), t.verses) }))]
  .sort((a, b) => a.name.localeCompare(b.name));

export const TOPIC_BY_SLUG = new Map();
for (const t of TOPICS) {
  TOPIC_BY_SLUG.set(t.slug, t);
  for (const a of t.aliases) if (!TOPIC_BY_SLUG.has(a)) TOPIC_BY_SLUG.set(a, t);
}
