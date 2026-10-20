/**
 * seo/topics-named-2.js — fifth wave of topic pages (Oct 20, 2026).
 *
 * Why this wave exists: 28 days of Search Console to Oct 17 settled the
 * argument the fourth wave started. Clicks went 328 -> 427 and average
 * position 32.8 -> 30.2, and nine of the site's ten best pages are the
 * named entities shipped on Sept 30 — god-most-high, jehovah-nissi, el-roi,
 * jehovah-shalom, king-of-kings, spiritual-dryness, jehovah-sabaoth,
 * el-shaddai, i-am. The generic themes have not moved: "hope" and
 * "forgiveness" are still on page 8, because those queries belong to sites
 * with twenty years of links.
 *
 * So: named entities again. The difference is that the fourth wave consumed
 * almost the whole backlog list, so these are new candidates, chosen where a
 * thing has one settled name that people type:
 *
 *   - The parables, individually. We had "The Parables of Jesus" as one page
 *     and nothing for "the parable of the sower", which is the actual query.
 *   - The prophetic and Revelation entities. High volume, unambiguous names,
 *     and nothing on the site served them.
 *   - The named events and places that the fourth wave left out.
 *
 * Every reference must resolve in seo/data/kjv.json (`node seo/check.mjs`).
 */

const PARABLES = [
  { name: "The Parable of the Sower", aliases: ["the-sower-and-the-seed", "the-four-soils", "the-seed-and-the-sower", "sowing-on-stony-ground"],
    verses: ["Matthew 13:3", "Matthew 13:4", "Matthew 13:5", "Matthew 13:6", "Matthew 13:7", "Matthew 13:8", "Matthew 13:19", "Matthew 13:20", "Matthew 13:22", "Matthew 13:23", "Mark 4:14", "Luke 8:11", "Luke 8:15"] },
  { name: "The Parable of the Lost Sheep", aliases: ["the-ninety-and-nine", "the-one-lost-sheep", "the-shepherd-who-leaves-the-ninety-nine"],
    verses: ["Luke 15:4", "Luke 15:5", "Luke 15:6", "Luke 15:7", "Matthew 18:12", "Matthew 18:13", "Matthew 18:14", "Ezekiel 34:16", "Isaiah 53:6", "1 Peter 2:25"] },
  { name: "The Parable of the Lost Coin", aliases: ["the-woman-and-the-lost-piece-of-silver", "the-lost-piece-of-silver", "joy-in-heaven-over-one-sinner"],
    verses: ["Luke 15:8", "Luke 15:9", "Luke 15:10", "Luke 15:7", "Luke 19:10", "Zephaniah 3:17"] },
  { name: "The Parable of the Mustard Seed", aliases: ["the-least-of-all-seeds", "faith-as-a-grain-of-mustard-seed", "the-smallest-seed"],
    verses: ["Matthew 13:31", "Matthew 13:32", "Mark 4:30", "Mark 4:31", "Mark 4:32", "Luke 13:18", "Luke 13:19", "Matthew 17:20", "Zechariah 4:10"] },
  { name: "The Parable of the Talents", aliases: ["the-five-talents", "well-done-thou-good-and-faithful-servant", "the-unprofitable-servant", "the-one-talent"],
    verses: ["Matthew 25:14", "Matthew 25:15", "Matthew 25:19", "Matthew 25:20", "Matthew 25:21", "Matthew 25:23", "Matthew 25:24", "Matthew 25:25", "Matthew 25:26", "Matthew 25:28", "Matthew 25:29", "Luke 19:13", "Luke 19:17"] },
  { name: "The Parable of the Ten Virgins", aliases: ["the-wise-and-foolish-virgins", "the-five-wise-and-five-foolish", "oil-in-their-lamps", "the-bridegroom-cometh"],
    verses: ["Matthew 25:1", "Matthew 25:2", "Matthew 25:3", "Matthew 25:4", "Matthew 25:5", "Matthew 25:6", "Matthew 25:7", "Matthew 25:8", "Matthew 25:10", "Matthew 25:11", "Matthew 25:12", "Matthew 25:13"] },
  { name: "The Parable of the Wheat and the Tares", aliases: ["the-tares-among-the-wheat", "the-weeds-and-the-wheat", "let-both-grow-together"],
    verses: ["Matthew 13:24", "Matthew 13:25", "Matthew 13:26", "Matthew 13:27", "Matthew 13:28", "Matthew 13:29", "Matthew 13:30", "Matthew 13:38", "Matthew 13:39", "Matthew 13:40", "Matthew 13:43"] },
  { name: "The Parable of the Pearl of Great Price", aliases: ["the-pearl-of-great-price", "the-treasure-hid-in-a-field", "the-hidden-treasure", "he-sold-all-that-he-had"],
    verses: ["Matthew 13:44", "Matthew 13:45", "Matthew 13:46", "Philippians 3:7", "Philippians 3:8", "Proverbs 3:15", "Proverbs 8:11"] },
  { name: "The Parable of the Unforgiving Servant", aliases: ["the-unmerciful-servant", "seventy-times-seven", "the-ten-thousand-talents", "the-wicked-servant-forgiven"],
    verses: ["Matthew 18:21", "Matthew 18:22", "Matthew 18:23", "Matthew 18:24", "Matthew 18:26", "Matthew 18:27", "Matthew 18:28", "Matthew 18:30", "Matthew 18:32", "Matthew 18:33", "Matthew 18:34", "Matthew 18:35"] },
  { name: "The Rich Man and Lazarus", aliases: ["lazarus-and-the-rich-man", "the-beggar-at-the-gate", "abrahams-bosom", "a-great-gulf-fixed"],
    verses: ["Luke 16:19", "Luke 16:20", "Luke 16:21", "Luke 16:22", "Luke 16:23", "Luke 16:24", "Luke 16:25", "Luke 16:26", "Luke 16:27", "Luke 16:29", "Luke 16:31"] },
  { name: "The Parable of the Pharisee and the Publican", aliases: ["the-pharisee-and-the-tax-collector", "god-be-merciful-to-me-a-sinner", "two-men-went-up-to-pray"],
    verses: ["Luke 18:9", "Luke 18:10", "Luke 18:11", "Luke 18:12", "Luke 18:13", "Luke 18:14", "Psalm 51:17", "Isaiah 57:15", "James 4:6"] },
  { name: "The Parable of the Persistent Widow", aliases: ["the-importunate-widow", "the-unjust-judge", "men-ought-always-to-pray", "the-widow-and-the-judge"],
    verses: ["Luke 18:1", "Luke 18:2", "Luke 18:3", "Luke 18:4", "Luke 18:5", "Luke 18:6", "Luke 18:7", "Luke 18:8", "1 Thessalonians 5:17", "Colossians 4:2"] },
  { name: "The Parable of the Great Supper", aliases: ["the-wedding-feast", "the-marriage-of-the-kings-son", "the-invited-guests-who-would-not-come", "compel-them-to-come-in"],
    verses: ["Luke 14:16", "Luke 14:17", "Luke 14:18", "Luke 14:20", "Luke 14:21", "Luke 14:22", "Luke 14:23", "Luke 14:24", "Matthew 22:2", "Matthew 22:9", "Matthew 22:14"] },
  { name: "The Parable of the Vineyard Workers", aliases: ["the-labourers-in-the-vineyard", "the-eleventh-hour", "the-last-shall-be-first", "a-penny-a-day"],
    verses: ["Matthew 20:1", "Matthew 20:2", "Matthew 20:3", "Matthew 20:6", "Matthew 20:8", "Matthew 20:9", "Matthew 20:10", "Matthew 20:11", "Matthew 20:13", "Matthew 20:14", "Matthew 20:15", "Matthew 20:16"] },
  { name: "The Parable of the Rich Fool", aliases: ["the-man-who-built-bigger-barns", "thou-fool-this-night", "the-foolish-rich-man", "laying-up-treasure-for-himself"],
    verses: ["Luke 12:16", "Luke 12:17", "Luke 12:18", "Luke 12:19", "Luke 12:20", "Luke 12:21", "Luke 12:15", "1 Timothy 6:7", "Matthew 6:19"] },
  { name: "The Parable of the Wicked Husbandmen", aliases: ["the-vineyard-and-the-husbandmen", "the-tenants-who-killed-the-son", "the-stone-which-the-builders-rejected"],
    verses: ["Matthew 21:33", "Matthew 21:34", "Matthew 21:35", "Matthew 21:37", "Matthew 21:38", "Matthew 21:39", "Matthew 21:40", "Matthew 21:41", "Matthew 21:42", "Mark 12:1", "Mark 12:9", "Psalm 118:22"] },
  { name: "The Parable of the Barren Fig Tree", aliases: ["the-fig-tree-that-bore-no-fruit", "three-years-and-no-fruit", "let-it-alone-this-year-also"],
    verses: ["Luke 13:6", "Luke 13:7", "Luke 13:8", "Luke 13:9", "Matthew 21:19", "John 15:2", "Hebrews 6:7", "2 Peter 3:9"] },
  { name: "The Parable of the Wise and Foolish Builders", aliases: ["the-house-on-the-rock", "the-house-built-on-sand", "the-rock-and-the-sand", "a-wise-man-built-his-house-upon-a-rock"],
    verses: ["Matthew 7:24", "Matthew 7:25", "Matthew 7:26", "Matthew 7:27", "Luke 6:47", "Luke 6:48", "Luke 6:49", "1 Corinthians 3:11", "Isaiah 28:16"] },
  { name: "The Parable of the Two Sons", aliases: ["the-son-who-said-i-go-not", "the-two-sons-and-the-vineyard", "which-of-the-twain-did-the-will"],
    verses: ["Matthew 21:28", "Matthew 21:29", "Matthew 21:30", "Matthew 21:31", "Matthew 21:32", "James 1:22", "1 John 3:18", "Luke 6:46"] },
];

const PROPHECY = [
  { name: "The Four Horsemen", aliases: ["the-four-horsemen-of-the-apocalypse", "the-white-horse", "the-pale-horse", "death-and-hell-followed"],
    verses: ["Revelation 6:1", "Revelation 6:2", "Revelation 6:3", "Revelation 6:4", "Revelation 6:5", "Revelation 6:6", "Revelation 6:7", "Revelation 6:8", "Zechariah 6:2", "Zechariah 6:3"] },
  { name: "Armageddon", aliases: ["the-battle-of-armageddon", "the-valley-of-decision", "the-last-battle", "the-great-day-of-god-almighty"],
    verses: ["Revelation 16:14", "Revelation 16:15", "Revelation 16:16", "Revelation 19:11", "Revelation 19:15", "Revelation 19:19", "Revelation 19:20", "Zechariah 14:2", "Zechariah 14:3", "Joel 3:14"] },
  { name: "The Mark of the Beast", aliases: ["six-hundred-threescore-and-six", "the-number-of-the-beast", "the-mark-in-the-right-hand", "666"],
    verses: ["Revelation 13:16", "Revelation 13:17", "Revelation 13:18", "Revelation 14:9", "Revelation 14:10", "Revelation 14:11", "Revelation 15:2", "Revelation 20:4"] },
  { name: "The Great White Throne", aliases: ["the-great-white-throne-judgment", "the-books-were-opened", "the-dead-were-judged", "the-second-death"],
    verses: ["Revelation 20:11", "Revelation 20:12", "Revelation 20:13", "Revelation 20:14", "Revelation 20:15", "Hebrews 9:27", "Romans 14:12", "2 Corinthians 5:10", "Daniel 7:9", "Daniel 7:10"] },
  { name: "The Book of Life", aliases: ["the-lamb's-book-of-life", "written-in-the-book-of-life", "blotted-out-of-my-book", "names-written-in-heaven"],
    verses: ["Revelation 3:5", "Revelation 13:8", "Revelation 20:12", "Revelation 20:15", "Revelation 21:27", "Revelation 22:19", "Philippians 4:3", "Luke 10:20", "Exodus 32:33", "Psalm 69:28", "Daniel 12:1"] },
  { name: "The Tree of Life", aliases: ["the-tree-in-the-midst-of-the-garden", "the-leaves-of-the-tree", "the-tree-whose-leaves-heal", "right-to-the-tree-of-life"],
    verses: ["Genesis 2:9", "Genesis 3:22", "Genesis 3:24", "Revelation 2:7", "Revelation 22:2", "Revelation 22:14", "Proverbs 3:18", "Proverbs 11:30", "Proverbs 13:12", "Ezekiel 47:12"] },
  { name: "The Antichrist", aliases: ["the-man-of-sin", "the-son-of-perdition", "the-spirit-of-antichrist", "the-lawless-one"],
    verses: ["1 John 2:18", "1 John 2:22", "1 John 4:3", "2 John 1:7", "2 Thessalonians 2:3", "2 Thessalonians 2:4", "2 Thessalonians 2:8", "2 Thessalonians 2:9", "Daniel 7:25", "Daniel 11:36", "Revelation 13:5"] },
  { name: "The Seven Churches", aliases: ["the-seven-churches-of-asia", "the-seven-candlesticks", "the-letters-to-the-seven-churches", "he-that-hath-an-ear-let-him-hear"],
    verses: ["Revelation 1:11", "Revelation 1:20", "Revelation 2:1", "Revelation 2:4", "Revelation 2:8", "Revelation 2:12", "Revelation 2:18", "Revelation 3:1", "Revelation 3:7", "Revelation 3:14", "Revelation 3:15", "Revelation 3:20"] },
  { name: "The Two Witnesses", aliases: ["the-two-olive-trees", "the-two-candlesticks", "the-witnesses-who-prophesy-1260-days", "the-two-prophets-of-revelation"],
    verses: ["Revelation 11:3", "Revelation 11:4", "Revelation 11:5", "Revelation 11:6", "Revelation 11:7", "Revelation 11:8", "Revelation 11:11", "Revelation 11:12", "Zechariah 4:3", "Zechariah 4:14"] },
  { name: "The New Jerusalem", aliases: ["the-holy-city", "the-bride-the-lamb's-wife", "the-city-of-pure-gold", "the-twelve-gates"],
    verses: ["Revelation 21:2", "Revelation 21:10", "Revelation 21:11", "Revelation 21:12", "Revelation 21:18", "Revelation 21:21", "Revelation 21:22", "Revelation 21:23", "Revelation 21:25", "Revelation 22:1", "Revelation 22:3", "Revelation 22:5", "Hebrews 11:10"] },
  { name: "The Valley of Dry Bones", aliases: ["can-these-bones-live", "the-dry-bones-of-ezekiel", "breath-upon-these-slain", "ezekiel's-vision-of-the-bones"],
    verses: ["Ezekiel 37:1", "Ezekiel 37:2", "Ezekiel 37:3", "Ezekiel 37:4", "Ezekiel 37:5", "Ezekiel 37:7", "Ezekiel 37:8", "Ezekiel 37:9", "Ezekiel 37:10", "Ezekiel 37:11", "Ezekiel 37:12", "Ezekiel 37:14"] },
];

const EVENTS = [
  { name: "The Last Supper", aliases: ["the-lord's-supper", "this-is-my-body", "the-bread-and-the-cup", "the-upper-room-supper"],
    verses: ["Matthew 26:26", "Matthew 26:27", "Matthew 26:28", "Matthew 26:29", "Mark 14:22", "Mark 14:23", "Mark 14:24", "Luke 22:15", "Luke 22:19", "Luke 22:20", "1 Corinthians 11:23", "1 Corinthians 11:24", "1 Corinthians 11:25", "1 Corinthians 11:26"] },
  { name: "Jacob's Ladder", aliases: ["the-ladder-set-up-on-the-earth", "the-gate-of-heaven", "bethel", "jacob's-dream-at-bethel"],
    verses: ["Genesis 28:10", "Genesis 28:11", "Genesis 28:12", "Genesis 28:13", "Genesis 28:14", "Genesis 28:15", "Genesis 28:16", "Genesis 28:17", "Genesis 28:18", "Genesis 28:19", "John 1:51"] },
  { name: "Manna from Heaven", aliases: ["bread-from-heaven", "the-food-in-the-wilderness", "angels'-food", "what-is-it"],
    verses: ["Exodus 16:4", "Exodus 16:14", "Exodus 16:15", "Exodus 16:18", "Exodus 16:31", "Exodus 16:35", "Numbers 11:7", "Numbers 11:8", "Deuteronomy 8:3", "Psalm 78:24", "Psalm 78:25", "John 6:31", "John 6:32", "John 6:35", "Revelation 2:17"] },
  { name: "The Rich Young Ruler", aliases: ["the-young-man-who-had-great-possessions", "sell-all-that-thou-hast", "the-camel-and-the-needle's-eye", "what-lack-i-yet"],
    verses: ["Matthew 19:16", "Matthew 19:17", "Matthew 19:20", "Matthew 19:21", "Matthew 19:22", "Matthew 19:23", "Matthew 19:24", "Matthew 19:26", "Mark 10:17", "Mark 10:21", "Mark 10:22", "Luke 18:18", "Luke 18:22", "Luke 18:27"] },
  { name: "Sodom and Gomorrah", aliases: ["lot's-wife", "the-pillar-of-salt", "fire-and-brimstone", "the-destruction-of-the-cities-of-the-plain"],
    verses: ["Genesis 18:20", "Genesis 18:32", "Genesis 19:1", "Genesis 19:13", "Genesis 19:17", "Genesis 19:24", "Genesis 19:25", "Genesis 19:26", "Genesis 19:29", "Luke 17:29", "Luke 17:32", "2 Peter 2:6", "Jude 1:7"] },
  { name: "The Red Sea Crossing", aliases: ["the-parting-of-the-red-sea", "stand-still-and-see-the-salvation", "the-waters-were-divided", "israel-walked-through-on-dry-ground"],
    verses: ["Exodus 14:13", "Exodus 14:14", "Exodus 14:15", "Exodus 14:16", "Exodus 14:21", "Exodus 14:22", "Exodus 14:26", "Exodus 14:27", "Exodus 14:29", "Exodus 14:31", "Exodus 15:1", "Exodus 15:2", "Psalm 106:9", "Hebrews 11:29"] },
  { name: "Mount Sinai", aliases: ["the-mountain-of-god", "mount-horeb", "the-thunderings-and-lightnings", "moses-on-the-mount-forty-days"],
    verses: ["Exodus 19:16", "Exodus 19:17", "Exodus 19:18", "Exodus 19:20", "Exodus 20:18", "Exodus 20:19", "Exodus 20:21", "Exodus 24:12", "Exodus 24:18", "Exodus 34:28", "Exodus 34:29", "Deuteronomy 5:4", "Hebrews 12:18", "Hebrews 12:21"] },
  { name: "The Upper Room", aliases: ["the-large-upper-room", "they-were-all-with-one-accord-in-one-place", "where-the-disciples-waited", "the-room-at-pentecost"],
    verses: ["Luke 22:12", "Acts 1:13", "Acts 1:14", "Acts 2:1", "Acts 2:2", "Acts 2:3", "Acts 2:4", "Acts 20:8", "John 14:1", "John 14:27"] },
  { name: "The Pool of Bethesda", aliases: ["wilt-thou-be-made-whole", "the-man-sick-thirty-eight-years", "rise-take-up-thy-bed-and-walk", "the-five-porches"],
    verses: ["John 5:2", "John 5:3", "John 5:5", "John 5:6", "John 5:7", "John 5:8", "John 5:9", "John 5:14", "Psalm 103:3", "Isaiah 35:6"] },
  { name: "The Passover", aliases: ["the-blood-on-the-doorpost", "the-lamb-without-blemish", "when-i-see-the-blood", "the-night-of-the-firstborn"],
    verses: ["Exodus 12:3", "Exodus 12:5", "Exodus 12:6", "Exodus 12:7", "Exodus 12:11", "Exodus 12:12", "Exodus 12:13", "Exodus 12:14", "Exodus 12:21", "Exodus 12:22", "Exodus 12:27", "Luke 22:15", "1 Corinthians 5:7", "John 1:29"] },
  { name: "The Day of Atonement", aliases: ["yom-kippur", "the-scapegoat", "the-two-goats", "once-a-year-into-the-holiest"],
    verses: ["Leviticus 16:6", "Leviticus 16:8", "Leviticus 16:9", "Leviticus 16:10", "Leviticus 16:15", "Leviticus 16:21", "Leviticus 16:22", "Leviticus 16:30", "Leviticus 16:34", "Hebrews 9:7", "Hebrews 9:11", "Hebrews 9:12", "Hebrews 10:4"] },
  { name: "The Tabernacle", aliases: ["the-tent-of-meeting", "that-i-may-dwell-among-them", "the-pattern-shewed-in-the-mount", "the-cloud-covered-the-tent"],
    verses: ["Exodus 25:8", "Exodus 25:9", "Exodus 26:1", "Exodus 29:45", "Exodus 40:2", "Exodus 40:34", "Exodus 40:35", "Exodus 40:38", "Hebrews 8:5", "Hebrews 9:1", "Hebrews 9:2", "Hebrews 9:11", "John 1:14"] },
  { name: "The Mercy Seat", aliases: ["the-golden-lid-of-the-ark", "between-the-cherubims", "there-i-will-meet-with-thee", "the-blood-upon-the-mercy-seat"],
    verses: ["Exodus 25:17", "Exodus 25:18", "Exodus 25:20", "Exodus 25:21", "Exodus 25:22", "Leviticus 16:14", "Leviticus 16:15", "Numbers 7:89", "Romans 3:25", "Hebrews 4:16", "Hebrews 9:5"] },
  { name: "The Veil of the Temple", aliases: ["the-veil-rent-in-twain", "the-way-into-the-holiest", "a-new-and-living-way", "the-curtain-torn-from-top-to-bottom"],
    verses: ["Exodus 26:31", "Exodus 26:33", "Leviticus 16:2", "Matthew 27:50", "Matthew 27:51", "Mark 15:38", "Luke 23:45", "Hebrews 6:19", "Hebrews 9:3", "Hebrews 10:19", "Hebrews 10:20"] },
];

export const NAMED_TOPICS_2 = [
  ...PARABLES.map((t) => ({ ...t, group: "Stories & Teachings" })),
  ...PROPHECY.map((t) => ({ ...t, group: "Stories & Teachings" })),
  ...EVENTS.map((t) => ({ ...t, group: "Stories & Teachings" })),
];
