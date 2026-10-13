/**
 * seo/topics-doctrine.js — verse collections for the foundational doctrines,
 * following the outline for TheWay's beliefs page: God and Scripture, sin and
 * salvation, the Holy Spirit and the church, last things.
 *
 * A note on restraint, because this file is different from the others.
 *
 * Choosing which verses go on a page is itself a position. On the doctrines
 * where Christians who hold the same Bible land in different places — when the
 * rapture happens, how to read the thousand years, whether a believer can fall
 * away — these pages set out the passages and describe what they say, and stop
 * there. They do not adjudicate. Where a passage is commonly set against
 * another, both are listed: justification carries James 2:24 next to Romans
 * 3:28, because leaving it out would be making an argument by omission.
 *
 * Scripture is not here either, because "Scripture & God's Word" already exists
 * and a second page on the same subject would only compete with it; its extra
 * verses were folded into that topic instead. "Holiness" likewise already
 * exists, and keeps the holiness queries — sanctification is the work, holiness
 * is what it is working toward, and they stay separate pages.
 *
 * Two topics are deliberately absent until Dillon settles his position, since
 * a verse list would take the side without saying so: eternal security, and
 * grounds for separation (Ephesians 4:1-7). Both are on his outline as open.
 *
 * Shape matches topics-people.js — { name, aliases, verses, group } — plus an
 * intro, merged into TOPIC_INTROS by seo/topic-intros.js.
 *
 * Every reference must resolve in seo/data/kjv.json (`node seo/check.mjs`).
 */
export const DOCTRINE_TOPICS = [
  /* ------------------------------------------------------ God and Scripture */
  { name: "The Virgin Birth", group: "What We Believe",
    aliases: ["virgin-birth", "born-of-a-virgin", "the-virgin-mary", "virgin-birth-of-jesus"],
    verses: ["Isaiah 7:14", "Matthew 1:18", "Matthew 1:20", "Matthew 1:22-23", "Matthew 1:24-25", "Luke 1:26-27", "Luke 1:30-31", "Luke 1:34", "Luke 1:35", "Luke 1:38", "Luke 2:7", "Galatians 4:4"] },
  { name: "The Deity of Christ", group: "What We Believe",
    aliases: ["jesus-is-god", "deity-of-jesus", "is-jesus-god", "the-godhead"],
    verses: ["John 1:1", "John 1:14", "John 8:58", "John 10:30", "Colossians 1:16", "Colossians 2:9", "Hebrews 1:3", "Hebrews 1:8", "Philippians 2:6", "Titus 2:13", "Revelation 1:8", "Isaiah 9:6"] },
  { name: "The Incarnation", group: "What We Believe",
    aliases: ["god-in-the-flesh", "the-word-made-flesh", "jesus-became-man"],
    verses: ["John 1:14", "Philippians 2:5-7", "Philippians 2:8", "1 Timothy 3:16", "Hebrews 2:14", "Hebrews 2:17", "Galatians 4:4-5", "Matthew 1:23", "Luke 2:11", "Romans 8:3", "1 John 4:2", "Colossians 2:9"] },

  /* ------------------------------------------------------- sin and salvation */
  { name: "The Gospel", group: "What We Believe",
    aliases: ["the-good-news", "gospel", "what-is-the-gospel"],
    verses: ["1 Corinthians 15:1-2", "1 Corinthians 15:3-4", "Romans 1:16", "Mark 16:15", "John 3:16", "Romans 10:9", "Romans 10:10", "Ephesians 2:8-9", "Acts 4:12", "Romans 6:23", "1 Peter 3:18", "2 Corinthians 5:21"] },
  { name: "The Atonement", group: "What We Believe",
    aliases: ["atonement", "the-blood-atonement", "propitiation", "scriptures-on-the-blood-of-jesus"],
    verses: ["Romans 3:25", "1 John 2:2", "1 John 4:10", "Isaiah 53:5", "Isaiah 53:6", "Hebrews 9:22", "Hebrews 9:28", "Leviticus 17:11", "2 Corinthians 5:21", "1 Peter 2:24", "Romans 5:11", "Colossians 1:20"] },
  { name: "Justification", group: "What We Believe",
    aliases: ["justified", "justified-by-faith", "declared-righteous"],
    verses: ["Romans 3:24", "Romans 3:28", "Romans 4:5", "Romans 5:1", "Romans 5:9", "Romans 8:30", "Romans 8:33", "Galatians 2:16", "Galatians 3:11", "Titus 3:7", "Acts 13:39", "James 2:24"] },
  { name: "Redemption", group: "What We Believe",
    aliases: ["redeemed", "the-redeemer", "bought-with-a-price"],
    verses: ["Ephesians 1:7", "Colossians 1:14", "Titus 2:14", "1 Peter 1:18-19", "Galatians 3:13", "Romans 3:24", "Hebrews 9:12", "Psalm 130:7", "Job 19:25", "Luke 1:68", "Revelation 5:9", "1 Corinthians 6:20"] },
  { name: "Grace", group: "What We Believe",
    aliases: ["gods-grace", "saved-by-grace", "amazing-grace"],
    verses: ["Ephesians 2:8-9", "Romans 3:24", "Romans 5:20", "2 Corinthians 12:9", "Titus 2:11", "Titus 3:7", "Hebrews 4:16", "John 1:16", "Romans 6:14", "1 Corinthians 15:10", "Ephesians 1:7", "2 Timothy 1:9"] },
  { name: "Being Born Again", group: "What We Believe",
    aliases: ["born-again", "the-new-birth", "new-creature", "ye-must-be-born-again"],
    verses: ["John 3:3", "John 3:5", "John 3:6", "John 3:7", "1 Peter 1:23", "2 Corinthians 5:17", "Titus 3:5", "Ezekiel 36:26", "John 1:12", "John 1:13", "Romans 6:4", "1 John 5:1"] },
  { name: "Sanctification", group: "What We Believe",
    aliases: ["sanctified", "being-made-holy", "progressive-sanctification"],
    verses: ["1 Thessalonians 4:3", "1 Thessalonians 5:23", "John 17:17", "Hebrews 10:10", "Hebrews 10:14", "Romans 6:22", "2 Corinthians 7:1", "Ephesians 5:26", "1 Corinthians 6:11", "1 Peter 1:15-16", "Philippians 1:6", "2 Thessalonians 2:13"] },
  { name: "Glorification", group: "What We Believe",
    aliases: ["glorified", "our-glorified-body", "the-resurrection-body"],
    verses: ["Romans 8:17", "Romans 8:18", "Romans 8:30", "1 Corinthians 15:42-44", "1 Corinthians 15:51-52", "Philippians 3:21", "Colossians 3:4", "1 John 3:2", "2 Corinthians 4:17", "1 Thessalonians 4:17", "2 Timothy 2:10", "Revelation 21:4"] },
  { name: "The Image of God", group: "What We Believe",
    aliases: ["imago-dei", "made-in-gods-image", "created-in-his-image", "human-dignity"],
    verses: ["Genesis 1:26", "Genesis 1:27", "Genesis 5:1", "Genesis 9:6", "Psalm 139:13-14", "Psalm 8:5", "James 3:9", "Colossians 3:10", "Ephesians 4:24", "1 Corinthians 11:7", "Acts 17:28", "Romans 8:29"] },

  /* -------------------------------------------- the Holy Spirit and the church */
  { name: "Spiritual Gifts", group: "What We Believe",
    aliases: ["gifts-of-the-spirit", "the-gifts", "spiritual-gifts-in-the-bible"],
    verses: ["1 Corinthians 12:4-6", "1 Corinthians 12:7", "1 Corinthians 12:8-10", "1 Corinthians 12:11", "1 Corinthians 12:28", "Romans 12:6", "Romans 12:7-8", "Ephesians 4:11-12", "1 Peter 4:10", "1 Peter 4:11", "1 Corinthians 14:12", "Hebrews 2:4"] },
  { name: "Elders and Deacons", group: "What We Believe",
    aliases: ["elders", "deacons", "bishops", "church-leadership", "qualifications-for-elders", "church-offices"],
    verses: ["1 Timothy 3:1", "1 Timothy 3:2", "1 Timothy 3:3", "1 Timothy 3:4-5", "1 Timothy 3:8", "1 Timothy 3:9-10", "1 Timothy 3:12-13", "Titus 1:5", "Titus 1:6", "Titus 1:7-9", "Acts 6:3", "1 Peter 5:1-3"] },
  { name: "Discipleship", group: "What We Believe",
    aliases: ["making-disciples", "following-jesus", "being-a-disciple", "counting-the-cost"],
    verses: ["Matthew 28:19-20", "Luke 9:23", "Luke 14:27", "Luke 14:33", "John 8:31", "John 13:35", "John 15:8", "Matthew 4:19", "2 Timothy 2:2", "Matthew 16:24", "Mark 8:34", "Colossians 2:6-7"] },

  /* --------------------------------------------------------------- last things */
  { name: "Heaven", group: "What We Believe",
    aliases: ["what-is-heaven-like", "eternal-life-in-heaven", "the-fathers-house"],
    verses: ["John 14:2", "John 14:3", "Revelation 21:1", "Revelation 21:3", "Revelation 21:4", "Revelation 21:27", "Revelation 22:3", "Revelation 22:4", "2 Corinthians 5:1", "2 Corinthians 5:8", "Philippians 3:20", "1 Peter 1:4"] },
  { name: "The Rapture", group: "What We Believe",
    aliases: ["rapture", "caught-up", "the-catching-away", "meet-the-lord-in-the-air"],
    verses: ["1 Thessalonians 4:16", "1 Thessalonians 4:17", "1 Thessalonians 4:18", "1 Corinthians 15:51", "1 Corinthians 15:52", "John 14:3", "Titus 2:13", "Philippians 3:20-21", "1 Thessalonians 5:9", "Matthew 24:40-41", "Matthew 24:42", "1 John 3:2-3"] },
  { name: "The Millennium", group: "What We Believe",
    aliases: ["the-thousand-years", "millennial-reign", "the-reign-of-christ"],
    verses: ["Revelation 20:1-2", "Revelation 20:3", "Revelation 20:4", "Revelation 20:5", "Revelation 20:6", "Isaiah 11:6", "Isaiah 11:9", "Isaiah 2:4", "Zechariah 14:9", "Psalm 72:8", "Daniel 7:14", "Isaiah 9:7"] },
  { name: "The New Heaven and New Earth", group: "What We Believe",
    aliases: ["new-heaven-and-new-earth", "all-things-new", "the-new-jerusalem"],
    verses: ["Revelation 21:1", "Revelation 21:2", "Revelation 21:5", "2 Peter 3:13", "2 Peter 3:10", "Isaiah 65:17", "Isaiah 66:22", "Revelation 22:5", "Revelation 21:23", "Revelation 21:25", "Romans 8:21", "Revelation 22:1-2"] },
  { name: "The Judgment", group: "What We Believe",
    aliases: ["judgment", "the-great-white-throne", "judgment-day", "scriptures-on-judgement", "the-judgment-seat-of-christ"],
    verses: ["Hebrews 9:27", "Revelation 20:11", "Revelation 20:12", "Revelation 20:13", "Revelation 20:15", "2 Corinthians 5:10", "Romans 14:10", "Romans 14:12", "Matthew 12:36", "Acts 17:31", "Ecclesiastes 12:14", "John 5:28-29"] },
  { name: "Satan", group: "What We Believe",
    aliases: ["the-devil", "the-enemy", "lucifer", "who-is-satan"],
    verses: ["Genesis 3:1", "Isaiah 14:12", "Ezekiel 28:15", "John 8:44", "1 Peter 5:8", "2 Corinthians 11:14", "Ephesians 6:11", "James 4:7", "Revelation 12:9", "Revelation 20:10", "Luke 10:18", "1 John 3:8"] },
  { name: "The Falling Away", group: "What We Believe",
    aliases: ["apostasy", "the-great-apostasy", "departing-from-the-faith", "falling-away"],
    verses: ["2 Thessalonians 2:3", "1 Timothy 4:1", "2 Timothy 3:1-5", "2 Timothy 4:3-4", "Matthew 24:10", "Matthew 24:11-12", "Hebrews 3:12", "2 Peter 2:1", "2 Peter 3:3-4", "1 John 2:19", "Acts 20:29-30", "Galatians 1:6-7"] },
];

/**
 * The intro shown above the verses. On the contested doctrines these describe
 * the passage and name the disagreement without settling it — see the note at
 * the top of this file.
 */
export const DOCTRINE_INTROS = {
  "the-virgin-birth": "Matthew and Luke both say it, independently and plainly: Mary conceived before she and Joseph came together, and the child was of the Holy Ghost. Matthew reads it as the fulfilment of Isaiah's sign, a virgin shall conceive. Luke gives Mary's own question — how shall this be — and the angel's answer.",
  "the-deity-of-christ": "The claim is not that Jesus was a good man or a great teacher. It is that the Word was God, that before Abraham was, I am, and that in him dwelleth all the fulness of the Godhead bodily. These are the verses that say it.",
  "the-incarnation": "The Word was made flesh and dwelt among us. Not God appearing to be a man, and not a man promoted — God taking on flesh and blood, born of a woman, made under the law.",
  "the-gospel": "Paul puts it in four lines in 1 Corinthians 15: Christ died for our sins according to the scriptures, he was buried, he rose again the third day, and he was seen. Everything else here is that same news from another angle.",
  "the-atonement": "Without shedding of blood is no remission. These verses trace what the cross accomplished — the propitiation, the substitution, the ransom — from Leviticus through Isaiah 53 to Romans and 1 John.",
  "justification": "To be justified is to be declared righteous, and Paul insists it comes by faith and not by the deeds of the law. James 2:24 is here too, because it is the verse people set against that, and leaving it out would be an argument made by silence.",
  "redemption": "Redemption means a price was paid to buy something back. The New Testament uses the language of the slave market and the kinsman-redeemer: ye are bought with a price, not with corruptible things, but with the precious blood of Christ.",
  "grace": "Grace is favour nobody earned and nobody can repay. By grace are ye saved through faith, and that not of yourselves — which is the whole argument of Ephesians 2 in one sentence.",
  "being-born-again": "Nicodemus came at night with a compliment and got an interruption: except a man be born again, he cannot see the kingdom of God. Not reformed, not improved — born, a second time, of the Spirit.",
  "sanctification": "Sanctified means set apart. The New Testament uses the word both ways — as something already done at the cross, and as something still being worked out — and these verses include both rather than choosing between them.",
  "glorification": "What happens at the end for those who are in Christ: the body raised, the corruptible putting on incorruption, and we shall be like him, for we shall see him as he is.",
  "the-image-of-god": "God made man in his own image, and Genesis says it three times in two verses, as if daring the reader to miss it. It is also why Genesis 9 and James 3 treat an attack on a person as an attack on something of God's.",
  "spiritual-gifts": "There are diversities of gifts, but the same Spirit. Paul gives three lists that do not match each other exactly, and in every one the point is the same: the gift is given to profit the whole body, not the person holding it.",
  "elders-and-deacons": "What the New Testament actually requires of church leaders, from 1 Timothy 3, Titus 1 and 1 Peter 5. Most of the list is character rather than ability, which is itself the point.",
  "discipleship": "A disciple is a learner who follows. Jesus set the terms out loud and more than once — deny yourself, take up the cross, count the cost — and the Great Commission is not to make converts but to make disciples.",
  heaven: "In my Father's house are many mansions. These are the passages that describe where believers go and what is finally done away with there: no more death, no more sorrow, no more crying, no more pain.",
  "the-rapture": "The passages behind the word: the Lord descending with a shout, the dead in Christ rising first, and the living caught up together with them to meet the Lord in the air. Christians who hold the same Bible disagree about when this happens in relation to the tribulation, and these verses are set out without settling that.",
  "the-millennium": "Revelation 20 describes a thousand years in which Satan is bound and those who were beheaded for the witness of Jesus reign with Christ. The Old Testament passages here are the ones commonly read alongside it. How literally to take the thousand years is a question Christians answer differently, and this page lays out the text rather than the argument.",
  "the-new-heaven-and-new-earth": "Not an escape from the world but the remaking of it. Behold, I make all things new — a new heaven and a new earth, a city coming down, and no more curse.",
  "the-judgment": "It is appointed unto men once to die, but after this the judgment. These passages cover both the great white throne and the judgment seat of Christ, and what is said to be the standard in each.",
  satan: "Scripture presents him as real and personal rather than a figure of speech: a liar from the beginning, an adversary walking about, able to appear as an angel of light — and already defeated, with the end stated plainly.",
  "the-falling-away": "That day shall not come, Paul writes, except there come a falling away first. These are the passages about departing from the faith in the last days — the apostasy itself, not the separate question of whether a believer can lose salvation.",
};
