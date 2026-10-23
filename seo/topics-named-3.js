/**
 * seo/topics-named-3.js — sixth wave of topic pages (Oct 23, 2026).
 *
 * Same vein, now with the lead verse built in from the start. The Oct 23
 * snippet work established that a topic page has to name the verse the search
 * is for, or Google takes its snippet from the middle of the page: el shaddai
 * ranked 5.8 on 60 impressions and took zero clicks while its defining verse,
 * Genesis 17:1, sat below the fold. Every entry here carries `lead`.
 *
 * Why these names: the fifth wave consumed the stories and the Revelation
 * entities, leaving the three groups the backlog had been holding — the people
 * the earlier waves skipped, the minor prophets as people rather than as books,
 * and the titles of Christ that were never given pages of their own.
 *
 * Every reference must resolve in seo/data/kjv.json (`node seo/check.mjs`).
 */

const PROPHETS = [
  { name: "Hosea", lead: "Hosea 6:6", aliases: ["hosea-and-gomer", "the-prophet-hosea", "i-desired-mercy-and-not-sacrifice"],
    verses: ["Hosea 1:2", "Hosea 2:19", "Hosea 3:1", "Hosea 6:1", "Hosea 6:6", "Hosea 10:12", "Hosea 11:1", "Hosea 11:8", "Hosea 14:1", "Hosea 14:4"] },
  { name: "Joel", lead: "Joel 2:25", aliases: ["the-years-the-locust-hath-eaten", "the-prophet-joel", "pour-out-my-spirit-upon-all-flesh"],
    verses: ["Joel 1:4", "Joel 2:12", "Joel 2:13", "Joel 2:25", "Joel 2:26", "Joel 2:28", "Joel 2:29", "Joel 2:32", "Joel 3:14", "Joel 3:16"] },
  { name: "Amos", lead: "Amos 5:24", aliases: ["the-herdman-of-tekoa", "the-prophet-amos", "let-judgment-run-down-as-waters"],
    verses: ["Amos 1:1", "Amos 3:3", "Amos 3:7", "Amos 4:12", "Amos 5:14", "Amos 5:15", "Amos 5:24", "Amos 7:14", "Amos 7:15", "Amos 8:11", "Amos 9:11"] },
  { name: "Obadiah", lead: "Obadiah 1:3", aliases: ["the-pride-of-thine-heart", "the-prophet-obadiah", "the-shortest-book-in-the-old-testament", "edom"],
    verses: ["Obadiah 1:3", "Obadiah 1:4", "Obadiah 1:10", "Obadiah 1:11", "Obadiah 1:12", "Obadiah 1:15", "Obadiah 1:17", "Obadiah 1:21"] },
  { name: "Micah", lead: "Micah 6:8", aliases: ["do-justly-love-mercy-walk-humbly", "the-prophet-micah", "what-doth-the-lord-require-of-thee"],
    verses: ["Micah 1:1", "Micah 3:8", "Micah 4:2", "Micah 4:3", "Micah 5:2", "Micah 6:6", "Micah 6:8", "Micah 7:7", "Micah 7:8", "Micah 7:18", "Micah 7:19"] },
  { name: "Nahum", lead: "Nahum 1:7", aliases: ["the-lord-is-good-a-strong-hold", "the-prophet-nahum", "the-burden-of-nineveh"],
    verses: ["Nahum 1:2", "Nahum 1:3", "Nahum 1:7", "Nahum 1:9", "Nahum 1:15", "Nahum 2:1", "Nahum 3:1", "Nahum 3:19"] },
  { name: "Habakkuk", lead: "Habakkuk 2:4", aliases: ["the-just-shall-live-by-his-faith", "the-prophet-habakkuk", "though-the-fig-tree-shall-not-blossom", "write-the-vision"],
    verses: ["Habakkuk 1:2", "Habakkuk 1:3", "Habakkuk 1:5", "Habakkuk 2:2", "Habakkuk 2:3", "Habakkuk 2:4", "Habakkuk 2:14", "Habakkuk 2:20", "Habakkuk 3:2", "Habakkuk 3:17", "Habakkuk 3:18", "Habakkuk 3:19"] },
  { name: "Zephaniah", lead: "Zephaniah 3:17", aliases: ["he-will-rejoice-over-thee-with-singing", "the-prophet-zephaniah", "the-day-of-the-lord-is-at-hand"],
    verses: ["Zephaniah 1:7", "Zephaniah 1:12", "Zephaniah 2:3", "Zephaniah 3:5", "Zephaniah 3:9", "Zephaniah 3:12", "Zephaniah 3:17", "Zephaniah 3:19", "Zephaniah 3:20"] },
  { name: "Haggai", lead: "Haggai 1:5", aliases: ["consider-your-ways", "the-prophet-haggai", "the-glory-of-this-latter-house", "rebuilding-the-temple"],
    verses: ["Haggai 1:2", "Haggai 1:4", "Haggai 1:5", "Haggai 1:6", "Haggai 1:8", "Haggai 1:13", "Haggai 2:4", "Haggai 2:7", "Haggai 2:9"] },
  { name: "Zechariah", lead: "Zechariah 4:6", aliases: ["not-by-might-nor-by-power", "the-prophet-zechariah", "thy-king-cometh-unto-thee", "they-shall-look-upon-me-whom-they-have-pierced"],
    verses: ["Zechariah 1:3", "Zechariah 2:8", "Zechariah 3:4", "Zechariah 4:6", "Zechariah 4:10", "Zechariah 8:16", "Zechariah 9:9", "Zechariah 12:10", "Zechariah 13:1", "Zechariah 14:9"] },
  { name: "Malachi", lead: "Malachi 3:10", aliases: ["bring-ye-all-the-tithes-into-the-storehouse", "the-prophet-malachi", "i-am-the-lord-i-change-not", "will-a-man-rob-god"],
    verses: ["Malachi 1:6", "Malachi 2:16", "Malachi 3:1", "Malachi 3:6", "Malachi 3:7", "Malachi 3:8", "Malachi 3:10", "Malachi 3:16", "Malachi 4:2", "Malachi 4:5"] },
];

const PEOPLE = [
  { name: "Rebekah", lead: "Genesis 24:58", aliases: ["rebecca", "isaac-and-rebekah", "wilt-thou-go-with-this-man", "rebekah-at-the-well"],
    verses: ["Genesis 24:15", "Genesis 24:16", "Genesis 24:18", "Genesis 24:19", "Genesis 24:58", "Genesis 24:64", "Genesis 24:67", "Genesis 25:21", "Genesis 25:22", "Genesis 25:23", "Genesis 27:5", "Genesis 27:13", "Romans 9:10", "Romans 9:12"] },
  { name: "Esau", lead: "Genesis 25:34", aliases: ["esau-and-jacob", "the-birthright", "a-mess-of-pottage", "esau-despised-his-birthright"],
    verses: ["Genesis 25:25", "Genesis 25:27", "Genesis 25:29", "Genesis 25:30", "Genesis 25:31", "Genesis 25:32", "Genesis 25:33", "Genesis 25:34", "Genesis 27:34", "Genesis 27:38", "Genesis 33:4", "Hebrews 12:16", "Hebrews 12:17", "Malachi 1:2"] },
  { name: "Absalom", lead: "2 Samuel 18:33", aliases: ["o-my-son-absalom", "absaloms-rebellion", "davids-son-absalom", "absaloms-hair"],
    verses: ["2 Samuel 14:25", "2 Samuel 15:4", "2 Samuel 15:6", "2 Samuel 15:10", "2 Samuel 15:12", "2 Samuel 15:30", "2 Samuel 18:9", "2 Samuel 18:14", "2 Samuel 18:33"] },
  { name: "Bathsheba", lead: "2 Samuel 12:13", aliases: ["david-and-bathsheba", "uriah-the-hittite", "nathan-and-david", "thou-art-the-man"],
    verses: ["2 Samuel 11:2", "2 Samuel 11:3", "2 Samuel 11:4", "2 Samuel 11:27", "2 Samuel 12:7", "2 Samuel 12:9", "2 Samuel 12:13", "2 Samuel 12:24", "1 Kings 1:11", "Psalm 51:1", "Psalm 51:2", "Psalm 51:10"] },
  { name: "Nebuchadnezzar", lead: "Daniel 4:37", aliases: ["nebuchadnezzars-dream", "the-king-who-ate-grass", "those-that-walk-in-pride-he-is-able-to-abase", "king-of-babylon"],
    verses: ["Daniel 2:1", "Daniel 2:46", "Daniel 2:47", "Daniel 3:13", "Daniel 3:15", "Daniel 3:24", "Daniel 3:25", "Daniel 4:30", "Daniel 4:33", "Daniel 4:34", "Daniel 4:37"] },
  { name: "Belshazzar", lead: "Daniel 5:27", aliases: ["belshazzars-feast", "weighed-in-the-balances-and-found-wanting", "mene-mene-tekel-upharsin", "the-writing-on-the-wall"],
    verses: ["Daniel 5:1", "Daniel 5:2", "Daniel 5:5", "Daniel 5:6", "Daniel 5:22", "Daniel 5:23", "Daniel 5:25", "Daniel 5:26", "Daniel 5:27", "Daniel 5:28", "Daniel 5:30"] },
  { name: "Methuselah", lead: "Genesis 5:27", aliases: ["the-oldest-man-in-the-bible", "nine-hundred-sixty-and-nine-years", "enochs-son", "how-old-was-methuselah"],
    verses: ["Genesis 5:21", "Genesis 5:22", "Genesis 5:24", "Genesis 5:25", "Genesis 5:26", "Genesis 5:27", "Luke 3:37"] },
  { name: "Balaam", lead: "Numbers 22:28", aliases: ["balaams-donkey", "balaams-ass", "the-donkey-that-spoke", "the-way-of-balaam"],
    verses: ["Numbers 22:12", "Numbers 22:18", "Numbers 22:21", "Numbers 22:27", "Numbers 22:28", "Numbers 22:31", "Numbers 23:19", "Numbers 23:20", "Numbers 24:17", "2 Peter 2:15", "Jude 1:11", "Revelation 2:14"] },
  { name: "Mephibosheth", lead: "2 Samuel 9:7", aliases: ["jonathans-son", "lame-on-his-feet", "davids-kindness-to-mephibosheth", "eat-bread-at-my-table-continually"],
    verses: ["2 Samuel 4:4", "2 Samuel 9:1", "2 Samuel 9:3", "2 Samuel 9:6", "2 Samuel 9:7", "2 Samuel 9:8", "2 Samuel 9:11", "2 Samuel 9:13"] },
  { name: "Joseph of Arimathaea", lead: "Mark 15:43", aliases: ["joseph-of-arimathea", "the-tomb-of-jesus", "went-in-boldly-unto-pilate", "the-new-sepulchre"],
    verses: ["Matthew 27:57", "Matthew 27:58", "Matthew 27:59", "Matthew 27:60", "Mark 15:43", "Mark 15:44", "Mark 15:45", "Mark 15:46", "Luke 23:50", "Luke 23:51", "Luke 23:53", "John 19:38"] },
  { name: "Jephthah", lead: "Judges 11:35", aliases: ["jephthahs-vow", "jephthahs-daughter", "the-gileadite", "i-cannot-go-back"],
    verses: ["Judges 11:1", "Judges 11:2", "Judges 11:6", "Judges 11:29", "Judges 11:30", "Judges 11:31", "Judges 11:34", "Judges 11:35", "Judges 11:39", "Hebrews 11:32"] },
  { name: "Korah", lead: "Numbers 16:32", aliases: ["korahs-rebellion", "the-earth-opened-her-mouth", "dathan-and-abiram", "the-gainsaying-of-core"],
    verses: ["Numbers 16:1", "Numbers 16:2", "Numbers 16:3", "Numbers 16:5", "Numbers 16:28", "Numbers 16:31", "Numbers 16:32", "Numbers 16:33", "Numbers 26:10", "Numbers 26:11", "Jude 1:11"] },
  { name: "Eli", lead: "1 Samuel 3:13", aliases: ["eli-the-priest", "hophni-and-phinehas", "speak-lord-for-thy-servant-heareth", "he-restrained-them-not"],
    verses: ["1 Samuel 1:9", "1 Samuel 1:14", "1 Samuel 1:17", "1 Samuel 2:12", "1 Samuel 2:22", "1 Samuel 2:29", "1 Samuel 3:9", "1 Samuel 3:13", "1 Samuel 3:18", "1 Samuel 4:18"] },
  { name: "Jesse", lead: "1 Samuel 16:11", aliases: ["the-father-of-david", "there-remaineth-yet-the-youngest", "the-stem-of-jesse", "the-root-of-jesse"],
    verses: ["1 Samuel 16:1", "1 Samuel 16:10", "1 Samuel 16:11", "1 Samuel 16:12", "1 Samuel 16:18", "1 Samuel 17:12", "Isaiah 11:1", "Isaiah 11:10", "Romans 15:12"] },
  { name: "Joab", lead: "2 Samuel 18:14", aliases: ["davids-captain", "joab-and-absalom", "the-son-of-zeruiah", "joab-and-abner"],
    verses: ["2 Samuel 2:18", "2 Samuel 3:27", "2 Samuel 11:14", "2 Samuel 11:15", "2 Samuel 11:16", "2 Samuel 11:17", "2 Samuel 18:14", "2 Samuel 20:9", "2 Samuel 20:10", "1 Kings 2:5", "1 Kings 2:34"] },
  { name: "Ahab", lead: "1 Kings 21:25", aliases: ["ahab-and-jezebel", "naboths-vineyard", "he-sold-himself-to-work-wickedness", "the-king-of-israel"],
    verses: ["1 Kings 16:30", "1 Kings 16:31", "1 Kings 16:33", "1 Kings 18:17", "1 Kings 18:18", "1 Kings 21:4", "1 Kings 21:7", "1 Kings 21:25", "1 Kings 21:27", "1 Kings 22:34", "1 Kings 22:37"] },
  { name: "Caiaphas", lead: "John 11:50", aliases: ["the-high-priest", "the-trial-of-jesus", "one-man-should-die-for-the-people", "caiaphas-and-annas"],
    verses: ["Matthew 26:3", "Matthew 26:57", "Matthew 26:63", "Matthew 26:64", "Matthew 26:65", "John 11:49", "John 11:50", "John 11:51", "John 18:14", "John 18:24"] },
  { name: "Herod the Great", lead: "Matthew 2:16", aliases: ["king-herod", "the-slaughter-of-the-innocents", "herod-and-the-wise-men", "the-flight-into-egypt"],
    verses: ["Matthew 2:1", "Matthew 2:3", "Matthew 2:7", "Matthew 2:8", "Matthew 2:12", "Matthew 2:13", "Matthew 2:16", "Matthew 2:19", "Luke 1:5"] },
  { name: "Simon of Cyrene", lead: "Luke 23:26", aliases: ["simon-the-cyrenian", "the-man-who-carried-the-cross", "bear-it-after-jesus", "alexander-and-rufus"],
    verses: ["Matthew 27:32", "Mark 15:21", "Luke 23:26", "Matthew 16:24", "Luke 9:23", "Luke 14:27"] },
  { name: "Silas", lead: "Acts 16:25", aliases: ["silvanus", "paul-and-silas", "sang-praises-unto-god-at-midnight", "silas-the-prophet"],
    verses: ["Acts 15:22", "Acts 15:32", "Acts 15:40", "Acts 16:19", "Acts 16:25", "Acts 16:29", "Acts 17:4", "Acts 17:10", "2 Corinthians 1:19", "1 Peter 5:12"] },
  { name: "Titus", lead: "Titus 2:7", aliases: ["titus-in-crete", "a-pattern-of-good-works", "pauls-companion-titus", "set-in-order-the-things-that-are-wanting"],
    verses: ["2 Corinthians 2:13", "2 Corinthians 7:6", "2 Corinthians 7:13", "2 Corinthians 8:23", "2 Corinthians 12:18", "Galatians 2:1", "Galatians 2:3", "Titus 1:5", "Titus 2:7", "Titus 3:5"] },
];

const TITLES = [
  { name: "The Son of Man", lead: "Daniel 7:13", aliases: ["son-of-man-meaning", "jesus-called-himself-the-son-of-man", "the-son-of-man-came-to-seek-and-to-save", "coming-in-the-clouds"],
    verses: ["Daniel 7:13", "Daniel 7:14", "Matthew 8:20", "Matthew 9:6", "Matthew 12:8", "Matthew 16:13", "Matthew 20:28", "Matthew 24:30", "Matthew 25:31", "Matthew 26:64", "Mark 10:45", "Luke 19:10", "John 3:13", "John 5:27"] },
  { name: "The Messiah", lead: "Daniel 9:25", aliases: ["messias", "the-anointed-one", "we-have-found-the-messias", "the-christ"],
    verses: ["Daniel 9:25", "Daniel 9:26", "Psalm 2:2", "Isaiah 9:6", "Isaiah 61:1", "John 1:41", "John 4:25", "John 4:26", "Matthew 16:16", "Acts 2:36"] },
  { name: "The Redeemer", lead: "Job 19:25", aliases: ["i-know-that-my-redeemer-liveth", "kinsman-redeemer", "redeemed-by-the-blood", "the-lord-my-redeemer"],
    verses: ["Job 19:25", "Psalm 19:14", "Psalm 78:35", "Psalm 103:4", "Isaiah 41:14", "Isaiah 59:20", "Isaiah 60:16", "Galatians 3:13", "Ephesians 1:7", "Titus 2:14", "1 Peter 1:18", "1 Peter 1:19"] },
  { name: "The Bridegroom", lead: "Revelation 19:7", aliases: ["the-marriage-of-the-lamb", "the-bride-of-christ", "behold-the-bridegroom-cometh", "the-friend-of-the-bridegroom"],
    verses: ["Matthew 9:15", "Matthew 25:1", "Matthew 25:6", "Matthew 25:10", "John 3:29", "Isaiah 62:5", "2 Corinthians 11:2", "Revelation 19:7", "Revelation 19:9", "Revelation 21:2", "Revelation 21:9"] },
  { name: "The Rose of Sharon", lead: "Song of Solomon 2:1", aliases: ["the-lily-of-the-valleys", "rose-of-sharon-meaning", "my-beloved-is-mine", "the-apple-tree-among-the-trees"],
    verses: ["Song of Solomon 2:1", "Song of Solomon 2:2", "Song of Solomon 2:3", "Song of Solomon 2:4", "Song of Solomon 2:16", "Song of Solomon 5:10", "Song of Solomon 5:16", "Song of Solomon 6:3"] },
  { name: "Wonderful Counsellor", lead: "Isaiah 9:6", aliases: ["wonderful-counselor", "the-prince-of-peace", "the-mighty-god", "the-everlasting-father"],
    verses: ["Isaiah 9:6", "Isaiah 9:7", "Isaiah 11:2", "Isaiah 25:1", "Isaiah 28:29", "Psalm 32:8", "John 14:26", "John 16:13", "Romans 11:33", "Romans 11:34"] },
  { name: "The Root of Jesse", lead: "Isaiah 11:10", aliases: ["the-stem-of-jesse", "the-branch", "the-root-and-the-offspring-of-david", "the-rod-out-of-the-stem-of-jesse"],
    verses: ["Isaiah 11:1", "Isaiah 11:10", "Jeremiah 23:5", "Zechariah 6:12", "Romans 15:12", "Revelation 5:5", "Revelation 22:16"] },
  { name: "The Only Begotten Son", lead: "John 3:16", aliases: ["only-begotten-of-the-father", "god-so-loved-the-world", "his-only-begotten-son", "the-word-was-made-flesh"],
    verses: ["John 1:14", "John 1:18", "John 3:16", "John 3:18", "John 5:24", "Romans 8:32", "Hebrews 11:17", "1 John 4:9"] },
  { name: "The Sun of Righteousness", lead: "Malachi 4:2", aliases: ["with-healing-in-his-wings", "the-dayspring-from-on-high", "the-light-of-the-world", "the-bright-and-morning-star"],
    verses: ["Malachi 4:2", "Luke 1:78", "Luke 1:79", "John 8:12", "John 9:5", "Psalm 84:11", "2 Peter 1:19", "Revelation 22:16"] },
  { name: "El Olam", lead: "Genesis 21:33", aliases: ["the-everlasting-god", "from-everlasting-to-everlasting", "the-eternal-god", "el-olam-meaning"],
    verses: ["Genesis 21:33", "Deuteronomy 33:27", "Psalm 90:2", "Psalm 102:27", "Isaiah 40:28", "Habakkuk 1:12", "1 Timothy 1:17", "Revelation 1:8"] },
  { name: "Jehovah Mekoddishkem", lead: "Exodus 31:13", aliases: ["the-lord-that-sanctifies-you", "jehovah-m-kaddesh", "i-am-the-lord-which-sanctify-you", "set-apart"],
    verses: ["Exodus 31:13", "Leviticus 20:8", "Leviticus 21:8", "Leviticus 22:32", "Ezekiel 37:28", "1 Corinthians 6:11", "1 Thessalonians 5:23", "Hebrews 13:12"] },
  { name: "The Advocate", lead: "1 John 2:1", aliases: ["we-have-an-advocate-with-the-father", "jesus-our-advocate", "the-comforter", "he-ever-liveth-to-make-intercession"],
    verses: ["1 John 2:1", "1 John 2:2", "John 14:16", "John 14:26", "Romans 8:34", "Hebrews 7:25", "Hebrews 9:24", "1 Timothy 2:5"] },
  { name: "The Mediator", lead: "1 Timothy 2:5", aliases: ["one-mediator-between-god-and-men", "the-new-covenant", "daysman", "the-mediator-of-a-better-covenant"],
    verses: ["1 Timothy 2:5", "1 Timothy 2:6", "Job 9:33", "Galatians 3:19", "Galatians 3:20", "Hebrews 8:6", "Hebrews 9:15", "Hebrews 12:24"] },
  { name: "The Potter", lead: "Isaiah 64:8", aliases: ["we-are-the-clay", "the-potter-and-the-clay", "the-potters-house", "shall-the-thing-formed-say"],
    verses: ["Isaiah 29:16", "Isaiah 45:9", "Isaiah 64:8", "Jeremiah 18:3", "Jeremiah 18:4", "Jeremiah 18:6", "Romans 9:20", "Romans 9:21", "2 Timothy 2:20", "2 Timothy 2:21"] },
];

export const NAMED_TOPICS_3 = [
  ...PROPHETS.map((t) => ({ ...t, group: "People of the Bible" })),
  ...PEOPLE.map((t) => ({ ...t, group: "People of the Bible" })),
  ...TITLES.map((t) => ({ ...t, group: "Names & Titles of God" })),
];
