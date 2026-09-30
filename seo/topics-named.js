/**
 * seo/topics-named.js — fourth wave of topic pages (Sept 30, 2026).
 *
 * Why these and not more thematic topics: 28 days of Search Console data
 * split the existing 290 topic pages into two populations that behave
 * nothing alike.
 *
 *   27 specific, named topics  — median position 12.0  (page 1-2)
 *   32 generic theme topics    — median position 77.4  (page 8)
 *
 * The names of God rank 8-13 (jehovah-shalom 8.2, god-most-high 8.2,
 * king-of-kings 9.3), the named people and stories rank 6-16
 * (the-twelve-disciples 6.6, enoch 9.3, zacchaeus 9.8, noahs-ark 12.0),
 * and every topic-page click in the period came from that group. Meanwhile
 * "hope" sits at 89 and "forgiveness" at 81, because those queries belong to
 * sites with twenty years of links.
 *
 * So this wave is entirely named entities — more titles of God, more people,
 * more specific events. Same shape as topics-people.js.
 *
 * Every reference must resolve in seo/data/kjv.json (`node seo/check.mjs`).
 */
const NAMES = [
  { name: "Jehovah Rohi", aliases: ["jehovah-raah", "the-lord-is-my-shepherd", "jehovah-rohi-meaning"],
    verses: ["Psalm 23:1", "Psalm 80:1", "Psalm 100:3", "Isaiah 40:11", "Ezekiel 34:11", "Ezekiel 34:12", "John 10:11", "John 10:14", "John 10:27", "Hebrews 13:20", "1 Peter 2:25", "1 Peter 5:4"] },
  { name: "Jehovah Shammah", aliases: ["the-lord-is-there", "jehovah-shammah-meaning"],
    verses: ["Ezekiel 48:35", "Psalm 139:7", "Psalm 139:8", "Deuteronomy 31:6", "Joshua 1:9", "Isaiah 41:10", "Psalm 46:1", "Zephaniah 3:17", "Matthew 28:20", "Hebrews 13:5", "Revelation 21:3"] },
  { name: "Jehovah Tsidkenu", aliases: ["the-lord-our-righteousness", "jehovah-tsidkenu-meaning"],
    verses: ["Jeremiah 23:6", "Jeremiah 33:16", "Isaiah 61:10", "Isaiah 64:6", "Romans 3:22", "Romans 5:19", "1 Corinthians 1:30", "2 Corinthians 5:21", "Philippians 3:9", "Titus 3:5"] },
  { name: "Jehovah Sabaoth", aliases: ["the-lord-of-hosts", "jehovah-sabaoth-meaning", "lord-of-hosts"],
    verses: ["1 Samuel 1:3", "1 Samuel 17:45", "Psalm 24:10", "Psalm 46:7", "Psalm 46:11", "Isaiah 6:3", "Isaiah 54:5", "Jeremiah 32:18", "Zechariah 4:6", "Haggai 2:8", "James 5:4"] },
  { name: "Elohim", aliases: ["elohim-meaning", "the-name-elohim"],
    verses: ["Genesis 1:1", "Genesis 1:26", "Genesis 1:27", "Deuteronomy 10:17", "Psalm 19:1", "Psalm 68:5", "Isaiah 40:28", "Jeremiah 32:27", "Nehemiah 9:6"] },
  { name: "Adonai", aliases: ["adonai-meaning", "the-name-adonai"],
    verses: ["Genesis 15:2", "Exodus 4:10", "Psalm 8:1", "Psalm 16:2", "Psalm 86:8", "Isaiah 6:1", "Isaiah 6:8", "Daniel 9:4", "Malachi 1:6"] },
  { name: "El Roi", aliases: ["the-god-who-sees", "el-roi-meaning", "thou-god-seest-me"],
    verses: ["Genesis 16:7", "Genesis 16:11", "Genesis 16:13", "2 Chronicles 16:9", "Psalm 33:13", "Psalm 139:1", "Psalm 139:2", "Psalm 139:3", "Proverbs 15:3", "Jeremiah 23:24", "Hebrews 4:13"] },
  { name: "The Ancient of Days", aliases: ["ancient-of-days", "ancient-of-days-meaning"],
    verses: ["Daniel 7:9", "Daniel 7:13", "Daniel 7:22", "Psalm 90:2", "Psalm 102:27", "Isaiah 57:15", "Habakkuk 1:12", "Revelation 1:8", "Hebrews 13:8"] },
  { name: "The Lion of Judah", aliases: ["lion-of-judah", "lion-of-the-tribe-of-judah"],
    verses: ["Genesis 49:9", "Genesis 49:10", "Hosea 11:10", "Amos 3:8", "Micah 5:2", "Hebrews 7:14", "Revelation 5:5", "Revelation 19:16", "Proverbs 28:1"] },
  { name: "The Bright and Morning Star", aliases: ["bright-and-morning-star", "the-morning-star"],
    verses: ["Revelation 22:16", "Revelation 2:28", "Numbers 24:17", "2 Peter 1:19", "Malachi 4:2", "Isaiah 9:2", "Matthew 2:2", "John 8:12", "Luke 1:78"] },
  { name: "The Cornerstone", aliases: ["chief-cornerstone", "the-chief-corner-stone", "jesus-the-cornerstone"],
    verses: ["Isaiah 28:16", "Psalm 118:22", "Zechariah 10:4", "Matthew 21:42", "Acts 4:11", "Ephesians 2:20", "1 Peter 2:6", "1 Peter 2:7", "1 Corinthians 3:11"] },
  { name: "Living Water", aliases: ["the-living-water", "wells-of-salvation"],
    verses: ["John 4:10", "John 4:13", "John 4:14", "John 7:37", "John 7:38", "Jeremiah 2:13", "Isaiah 12:3", "Isaiah 55:1", "Psalm 42:1", "Revelation 21:6", "Revelation 22:17"] },
  { name: "The True Vine", aliases: ["the-vine-and-the-branches", "i-am-the-true-vine"],
    verses: ["John 15:1", "John 15:2", "John 15:4", "John 15:5", "John 15:8", "Psalm 80:8", "Isaiah 5:1", "Jeremiah 2:21", "Hosea 14:8"] },
  { name: "The Great High Priest", aliases: ["our-high-priest", "jesus-our-high-priest"],
    verses: ["Hebrews 2:17", "Hebrews 4:14", "Hebrews 4:15", "Hebrews 4:16", "Hebrews 7:25", "Hebrews 7:26", "Hebrews 9:11", "Hebrews 9:24", "Hebrews 10:21", "Psalm 110:4"] },
  { name: "The Door", aliases: ["i-am-the-door", "the-narrow-gate", "the-strait-gate"],
    verses: ["John 10:7", "John 10:9", "John 14:6", "Matthew 7:13", "Matthew 7:14", "Psalm 118:20", "Acts 4:12", "Revelation 3:8", "Revelation 3:20"] },
];

const PEOPLE = [
  { name: "Lot", aliases: ["lots-wife", "lot-in-the-bible", "sodom-and-gomorrah"],
    verses: ["Genesis 13:10", "Genesis 13:11", "Genesis 13:12", "Genesis 14:12", "Genesis 19:1", "Genesis 19:16", "Genesis 19:17", "Genesis 19:26", "Luke 17:28", "Luke 17:32", "2 Peter 2:7", "2 Peter 2:8"] },
  { name: "Hagar", aliases: ["hagar-in-the-bible", "hagar-and-ishmael"],
    verses: ["Genesis 16:1", "Genesis 16:7", "Genesis 16:9", "Genesis 16:11", "Genesis 16:13", "Genesis 21:14", "Genesis 21:17", "Genesis 21:19", "Genesis 21:20", "Psalm 34:18"] },
  { name: "Rachel and Leah", aliases: ["rachel", "leah", "jacobs-wives"],
    verses: ["Genesis 29:17", "Genesis 29:20", "Genesis 29:25", "Genesis 29:31", "Genesis 30:1", "Genesis 30:22", "Genesis 35:19", "Ruth 4:11", "Jeremiah 31:15"] },
  { name: "Abigail", aliases: ["abigail-in-the-bible", "abigail-and-david", "nabal"],
    verses: ["1 Samuel 25:3", "1 Samuel 25:18", "1 Samuel 25:23", "1 Samuel 25:24", "1 Samuel 25:28", "1 Samuel 25:32", "1 Samuel 25:33", "1 Samuel 25:42", "Proverbs 15:1", "Proverbs 31:26"] },
  { name: "Jezebel", aliases: ["jezebel-in-the-bible", "queen-jezebel", "the-spirit-of-jezebel"],
    verses: ["1 Kings 16:31", "1 Kings 18:4", "1 Kings 19:2", "1 Kings 21:7", "1 Kings 21:23", "1 Kings 21:25", "2 Kings 9:30", "2 Kings 9:33", "Revelation 2:20"] },
  { name: "Naaman", aliases: ["naaman-the-leper", "naaman-in-the-bible"],
    verses: ["2 Kings 5:1", "2 Kings 5:3", "2 Kings 5:10", "2 Kings 5:11", "2 Kings 5:13", "2 Kings 5:14", "2 Kings 5:15", "Luke 4:27", "Proverbs 16:18"] },
  { name: "Mordecai", aliases: ["mordecai-in-the-bible", "mordecai-and-esther"],
    verses: ["Esther 2:5", "Esther 2:7", "Esther 2:21", "Esther 2:22", "Esther 3:2", "Esther 4:1", "Esther 4:13", "Esther 4:14", "Esther 6:11", "Esther 8:15", "Esther 10:3"] },
  { name: "Lazarus", aliases: ["lazarus-raised-from-the-dead", "the-raising-of-lazarus", "jesus-wept"],
    verses: ["John 11:1", "John 11:3", "John 11:5", "John 11:11", "John 11:21", "John 11:25", "John 11:26", "John 11:35", "John 11:43", "John 11:44", "John 12:1", "John 12:10"] },
  { name: "Simeon and Anna", aliases: ["simeon", "anna-the-prophetess", "nunc-dimittis"],
    verses: ["Luke 2:25", "Luke 2:26", "Luke 2:28", "Luke 2:29", "Luke 2:30", "Luke 2:34", "Luke 2:35", "Luke 2:36", "Luke 2:37", "Luke 2:38"] },
  { name: "Pontius Pilate", aliases: ["pilate", "pilate-in-the-bible", "what-is-truth"],
    verses: ["Matthew 27:11", "Matthew 27:19", "Matthew 27:22", "Matthew 27:24", "Mark 15:15", "Luke 23:4", "John 18:38", "John 19:10", "John 19:11", "John 19:22"] },
  { name: "Barabbas", aliases: ["barabbas-in-the-bible", "release-unto-us-barabbas"],
    verses: ["Matthew 27:16", "Matthew 27:17", "Matthew 27:20", "Matthew 27:21", "Matthew 27:26", "Mark 15:7", "Mark 15:11", "Luke 23:18", "John 18:40", "Isaiah 53:6"] },
  { name: "Ananias and Sapphira", aliases: ["ananias-and-sapphira-in-the-bible", "lying-to-the-holy-ghost"],
    verses: ["Acts 5:1", "Acts 5:2", "Acts 5:3", "Acts 5:4", "Acts 5:5", "Acts 5:9", "Acts 5:10", "Acts 5:11", "Proverbs 12:22", "Numbers 32:23"] },
  { name: "Lydia", aliases: ["lydia-in-the-bible", "lydia-seller-of-purple"],
    verses: ["Acts 16:13", "Acts 16:14", "Acts 16:15", "Acts 16:40", "Romans 16:2", "Hebrews 13:2", "1 Peter 4:9", "Proverbs 31:20"] },
  { name: "Dorcas", aliases: ["tabitha", "dorcas-in-the-bible", "tabitha-arise"],
    verses: ["Acts 9:36", "Acts 9:37", "Acts 9:39", "Acts 9:40", "Acts 9:41", "Acts 9:42", "James 2:17", "Matthew 25:40", "Galatians 6:10"] },
  { name: "Onesimus and Philemon", aliases: ["onesimus", "philemon", "the-book-of-philemon"],
    verses: ["Philemon 1:10", "Philemon 1:11", "Philemon 1:12", "Philemon 1:15", "Philemon 1:16", "Philemon 1:17", "Philemon 1:18", "Colossians 4:9", "Galatians 3:28"] },
  { name: "Apollos", aliases: ["apollos-in-the-bible", "mighty-in-the-scriptures"],
    verses: ["Acts 18:24", "Acts 18:25", "Acts 18:26", "Acts 18:27", "Acts 18:28", "1 Corinthians 1:12", "1 Corinthians 3:6", "Titus 3:13"] },
];

const STORIES = [
  { name: "The Burning Bush", aliases: ["burning-bush", "moses-and-the-burning-bush"],
    verses: ["Exodus 3:1", "Exodus 3:2", "Exodus 3:3", "Exodus 3:4", "Exodus 3:5", "Exodus 3:6", "Exodus 3:10", "Exodus 3:12", "Exodus 3:14", "Mark 12:26", "Acts 7:30"] },
  { name: "The Golden Calf", aliases: ["golden-calf", "the-golden-calf-story"],
    verses: ["Exodus 32:1", "Exodus 32:4", "Exodus 32:7", "Exodus 32:8", "Exodus 32:19", "Exodus 32:26", "Exodus 32:30", "Deuteronomy 9:16", "Psalm 106:19", "Psalm 106:20", "Acts 7:41", "1 Corinthians 10:7"] },
  { name: "The Ten Plagues", aliases: ["ten-plagues", "the-plagues-of-egypt", "the-passover-in-egypt"],
    verses: ["Exodus 7:3", "Exodus 7:17", "Exodus 8:19", "Exodus 9:16", "Exodus 10:21", "Exodus 11:5", "Exodus 12:12", "Exodus 12:13", "Exodus 12:29", "Romans 9:17"] },
  { name: "The Walls of Jericho", aliases: ["walls-of-jericho", "the-battle-of-jericho", "jericho"],
    verses: ["Joshua 6:1", "Joshua 6:2", "Joshua 6:3", "Joshua 6:4", "Joshua 6:16", "Joshua 6:20", "Joshua 6:25", "Hebrews 11:30", "2 Corinthians 10:4"] },
  { name: "Gideon's Fleece", aliases: ["gideons-fleece", "putting-out-a-fleece", "the-fleece"],
    verses: ["Judges 6:12", "Judges 6:36", "Judges 6:37", "Judges 6:38", "Judges 6:39", "Judges 6:40", "Judges 7:2", "Judges 7:7", "Isaiah 7:11"] },
  { name: "Samson and Delilah", aliases: ["delilah", "samson-and-delilah-story"],
    verses: ["Judges 16:4", "Judges 16:6", "Judges 16:16", "Judges 16:17", "Judges 16:19", "Judges 16:20", "Judges 16:21", "Judges 16:28", "Judges 16:30", "Proverbs 5:3"] },
  { name: "The Ark of the Covenant", aliases: ["ark-of-the-covenant", "the-mercy-seat"],
    verses: ["Exodus 25:10", "Exodus 25:22", "Joshua 3:15", "Joshua 3:16", "1 Samuel 4:11", "1 Samuel 5:3", "2 Samuel 6:6", "2 Samuel 6:7", "2 Samuel 6:14", "1 Kings 8:9", "Hebrews 9:4"] },
  { name: "Elijah and the Prophets of Baal", aliases: ["mount-carmel", "elijah-on-mount-carmel", "prophets-of-baal"],
    verses: ["1 Kings 18:21", "1 Kings 18:24", "1 Kings 18:26", "1 Kings 18:27", "1 Kings 18:36", "1 Kings 18:37", "1 Kings 18:38", "1 Kings 18:39", "James 5:17", "James 5:18"] },
  { name: "The Still Small Voice", aliases: ["still-small-voice", "elijah-in-the-cave"],
    verses: ["1 Kings 19:4", "1 Kings 19:5", "1 Kings 19:9", "1 Kings 19:11", "1 Kings 19:12", "1 Kings 19:13", "1 Kings 19:18", "Psalm 46:10", "Isaiah 30:21"] },
  { name: "The Handwriting on the Wall", aliases: ["handwriting-on-the-wall", "mene-mene-tekel-upharsin", "belshazzars-feast"],
    verses: ["Daniel 5:1", "Daniel 5:5", "Daniel 5:6", "Daniel 5:17", "Daniel 5:22", "Daniel 5:23", "Daniel 5:25", "Daniel 5:26", "Daniel 5:27", "Daniel 5:28", "Daniel 5:30"] },
  { name: "Jonah and the Whale", aliases: ["jonah-and-the-great-fish", "the-whale", "jonah-and-the-fish"],
    verses: ["Jonah 1:1", "Jonah 1:2", "Jonah 1:3", "Jonah 1:12", "Jonah 1:17", "Jonah 2:1", "Jonah 2:2", "Jonah 2:9", "Jonah 2:10", "Jonah 3:5", "Matthew 12:40"] },
  { name: "The Wise Men", aliases: ["the-magi", "the-three-wise-men", "the-star-of-bethlehem"],
    verses: ["Matthew 2:1", "Matthew 2:2", "Matthew 2:9", "Matthew 2:10", "Matthew 2:11", "Matthew 2:12", "Micah 5:2", "Numbers 24:17", "Isaiah 60:3"] },
  { name: "The Wedding at Cana", aliases: ["water-into-wine", "the-marriage-at-cana", "first-miracle-of-jesus"],
    verses: ["John 2:1", "John 2:3", "John 2:4", "John 2:5", "John 2:7", "John 2:9", "John 2:10", "John 2:11", "Psalm 104:15"] },
  { name: "The Woman Caught in Adultery", aliases: ["he-that-is-without-sin", "cast-the-first-stone", "the-adulterous-woman"],
    verses: ["John 8:3", "John 8:4", "John 8:5", "John 8:6", "John 8:7", "John 8:9", "John 8:10", "John 8:11", "Romans 8:1", "Psalm 103:10"] },
  { name: "The Triumphal Entry", aliases: ["palm-sunday", "the-triumphal-entry-of-jesus", "hosanna"],
    verses: ["Matthew 21:8", "Matthew 21:9", "Mark 11:7", "Mark 11:9", "Luke 19:38", "Luke 19:40", "Luke 19:41", "John 12:13", "Zechariah 9:9"] },
  { name: "Gethsemane", aliases: ["the-garden-of-gethsemane", "not-my-will-but-thine"],
    verses: ["Matthew 26:36", "Matthew 26:38", "Matthew 26:39", "Matthew 26:40", "Matthew 26:41", "Matthew 26:42", "Mark 14:36", "Luke 22:43", "Luke 22:44", "Hebrews 5:7"] },
  { name: "The Road to Damascus", aliases: ["damascus-road", "the-conversion-of-paul", "sauls-conversion"],
    verses: ["Acts 9:1", "Acts 9:3", "Acts 9:4", "Acts 9:5", "Acts 9:6", "Acts 9:8", "Acts 9:15", "Acts 9:18", "Acts 22:6", "Acts 22:7", "Acts 22:8", "Galatians 1:15"] },
  { name: "The Philippian Jailer", aliases: ["paul-and-silas-in-prison", "what-must-i-do-to-be-saved", "the-jailer-at-philippi"],
    verses: ["Acts 16:23", "Acts 16:25", "Acts 16:26", "Acts 16:27", "Acts 16:28", "Acts 16:29", "Acts 16:30", "Acts 16:31", "Acts 16:33", "Acts 16:34"] },
  { name: "Peter's Vision", aliases: ["peters-vision-of-the-sheet", "the-sheet-let-down-from-heaven", "call-not-thou-common"],
    verses: ["Acts 10:9", "Acts 10:11", "Acts 10:13", "Acts 10:14", "Acts 10:15", "Acts 10:28", "Acts 10:34", "Acts 10:35", "Acts 11:9", "Galatians 2:11"] },
  { name: "The Bronze Serpent", aliases: ["the-brasen-serpent", "the-serpent-of-brass", "moses-and-the-serpent"],
    verses: ["Numbers 21:5", "Numbers 21:6", "Numbers 21:7", "Numbers 21:8", "Numbers 21:9", "John 3:14", "John 3:15", "2 Kings 18:4", "1 Corinthians 10:9"] },
];

export const NAMED_TOPICS = [
  ...NAMES.map((t) => ({ ...t, group: "Names & Titles of God" })),
  ...PEOPLE.map((t) => ({ ...t, group: "People of the Bible" })),
  ...STORIES.map((t) => ({ ...t, group: "Stories & Teachings" })),
];
