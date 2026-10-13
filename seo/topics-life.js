/**
 * seo/topics-life.js — specific verse collections (Oct 2026).
 *
 * The earlier read of Search Console said generic themes do not rank. That was
 * half right, and the half it got wrong matters. The real split is breadth:
 *
 *   bible verses about hope          89.1   |   bible verses about lust          7.3
 *   bible verses about marriage      92.2   |   bible verses about laziness     10.1
 *   bible verses about forgiveness   88.6   |   gifts and talents kjv           10.2
 *   bible verses about wisdom        85.2   |   bible verses about envy        17.1
 *   bible verses about prayer        76.5   |   bible verses about hospitality 22.4
 *
 * Broad abstractions lose to sites with twenty years of links. Narrow topics we
 * win outright, whether the subject is a person, a doctrine or a Tuesday
 * afternoon. So this file is deliberately narrow: not "family" but the empty
 * nest, not "money" but going to court, not "grief" but losing a baby.
 *
 * Several of these are pastoral before they are anything else - infertility,
 * losing a child, church hurt, a prodigal. The intro on those does not try to
 * resolve anything or hurry anyone through it. It says what the passages say
 * and gets out of the way.
 *
 * Shape matches the other topic files. Every reference must resolve in
 * seo/data/kjv.json (`node seo/check.mjs`).
 */
export const LIFE_TOPICS = [
  /* ------------------------------------------------------- the inner weather */
  { name: "Overthinking", aliases: ["racing-thoughts", "cant-stop-thinking", "a-busy-mind", "rumination"],
    verses: ["Philippians 4:6-7", "Philippians 4:8", "Isaiah 26:3", "2 Corinthians 10:5", "Psalm 94:19", "Matthew 6:34", "Colossians 3:2", "Romans 12:2", "Psalm 139:23-24", "Proverbs 12:25", "1 Peter 5:7", "Psalm 55:22"] },
  { name: "Perfectionism", aliases: ["never-good-enough", "being-a-perfectionist", "self-criticism"],
    verses: ["2 Corinthians 12:9", "Philippians 1:6", "Psalm 103:14", "Romans 8:1", "Matthew 11:28-30", "Ecclesiastes 7:20", "Galatians 3:3", "2 Corinthians 3:5", "1 John 1:9", "Hebrews 4:16", "Philippians 3:12", "Psalm 139:14"] },
  { name: "Failure", aliases: ["failing", "messing-up", "starting-over", "when-you-fail"],
    verses: ["Proverbs 24:16", "Micah 7:8", "Psalm 37:23-24", "2 Corinthians 4:8-9", "Philippians 3:13-14", "Lamentations 3:22-23", "Luke 22:61-62", "John 21:15", "Psalm 51:10", "Isaiah 43:18-19", "1 John 1:9", "Romans 8:28"] },
  { name: "Forgiving Yourself", aliases: ["self-forgiveness", "letting-go-of-guilt", "cant-forgive-myself"],
    verses: ["1 John 1:9", "Psalm 103:12", "Isaiah 43:25", "Romans 8:1", "Micah 7:19", "Hebrews 10:17", "2 Corinthians 5:17", "Psalm 32:5", "Philippians 3:13", "Isaiah 1:18", "Colossians 2:13-14", "Psalm 51:1-2"] },
  { name: "False Accusation", aliases: ["being-falsely-accused", "slandered", "when-people-lie-about-you", "clearing-your-name"],
    verses: ["Psalm 35:11", "Matthew 5:11", "1 Peter 2:23", "1 Peter 3:16", "Psalm 31:13", "Proverbs 19:5", "Exodus 23:1", "Isaiah 54:17", "Psalm 37:6", "Luke 6:22", "1 Peter 4:14", "Psalm 57:4"] },

  /* ------------------------------------------------------ when God seems far */
  { name: "Unanswered Prayer", aliases: ["when-god-says-no", "prayers-that-go-unanswered", "waiting-for-an-answer"],
    verses: ["2 Corinthians 12:8-9", "Isaiah 55:8-9", "Psalm 13:1-2", "Habakkuk 1:2", "Luke 18:1", "James 4:3", "Psalm 40:1", "John 11:6", "Romans 8:26", "Psalm 62:8", "1 John 5:14", "Psalm 27:14"] },
  { name: "When God Seems Silent", aliases: ["gods-silence", "the-silence-of-god", "feeling-far-from-god"],
    verses: ["Psalm 22:1-2", "Psalm 13:1", "Job 23:8-9", "Isaiah 45:15", "Psalm 77:7-9", "Lamentations 3:8", "Psalm 30:5", "Isaiah 40:27-28", "Habakkuk 2:3", "Psalm 27:14", "Deuteronomy 31:6", "Psalm 139:7-8"] },
  { name: "Backsliding", aliases: ["coming-back-to-god", "returning-to-god", "falling-away-and-coming-back", "backslidden"],
    verses: ["Jeremiah 3:22", "Hosea 14:4", "Luke 15:20", "1 John 1:9", "Joel 2:25", "Psalm 51:12", "Revelation 2:4-5", "James 4:8", "Isaiah 44:22", "2 Chronicles 7:14", "Galatians 6:1", "Psalm 23:3"] },
  { name: "Church Hurt", aliases: ["hurt-by-the-church", "church-wounds", "leaving-a-church", "hurt-by-christians"],
    verses: ["Psalm 55:12-14", "Romans 12:18", "Ephesians 4:31-32", "Hebrews 10:24-25", "Matthew 18:15", "Colossians 3:13", "Psalm 34:18", "2 Corinthians 2:7", "1 Peter 5:2-3", "Galatians 6:1", "Psalm 147:3", "Romans 12:19"] },

  /* ----------------------------------------------------------------- family */
  { name: "The Empty Nest", aliases: ["empty-nest", "children-leaving-home", "when-the-kids-move-out"],
    verses: ["Psalm 127:3-4", "Proverbs 22:6", "Genesis 2:24", "3 John 1:4", "Isaiah 46:4", "Philippians 1:3", "Psalm 71:18", "Ecclesiastes 3:1", "Deuteronomy 6:6-7", "2 Timothy 1:5", "Psalm 92:14", "Proverbs 17:6"] },
  { name: "Raising Teenagers", aliases: ["teenagers", "parenting-teens", "raising-teens"],
    verses: ["Proverbs 22:6", "Ephesians 6:4", "Deuteronomy 6:6-7", "Proverbs 29:17", "Colossians 3:21", "1 Timothy 4:12", "Psalm 127:3", "Proverbs 3:11-12", "Hebrews 12:11", "Proverbs 23:24", "2 Timothy 3:15", "Proverbs 20:11"] },
  { name: "A Prodigal Child", aliases: ["prodigal-children", "a-child-who-walked-away", "praying-for-a-wayward-child", "wayward-children"],
    verses: ["Luke 15:20", "Luke 15:17-18", "Luke 15:24", "Proverbs 22:6", "Isaiah 49:25", "Jeremiah 31:16-17", "Psalm 126:5-6", "2 Peter 3:9", "1 Timothy 2:1", "Luke 15:4", "Ezekiel 34:16", "Acts 16:31"] },
  { name: "Caring for Aging Parents", aliases: ["aging-parents", "caring-for-your-parents", "elderly-parents"],
    verses: ["Exodus 20:12", "1 Timothy 5:4", "1 Timothy 5:8", "Proverbs 23:22", "Psalm 71:9", "Isaiah 46:4", "Ruth 1:16", "John 19:26-27", "Leviticus 19:32", "Proverbs 20:29", "Psalm 92:14", "Matthew 15:4"] },
  { name: "Caregiving", aliases: ["caregivers", "caring-for-someone", "caregiver-burnout", "looking-after-someone"],
    verses: ["Galatians 6:2", "Galatians 6:9", "Matthew 11:28", "Isaiah 40:29", "2 Corinthians 1:3-4", "Psalm 68:19", "Matthew 25:40", "1 Peter 5:7", "Hebrews 6:10", "Psalm 73:26", "Lamentations 3:22-23", "Colossians 3:23"] },
  { name: "In-Laws", aliases: ["in-law-relationships", "mother-in-law", "your-spouses-family"],
    verses: ["Ruth 1:16-17", "Ruth 2:11", "Genesis 2:24", "Exodus 18:17-19", "Matthew 19:5", "1 Timothy 5:8", "Romans 12:18", "Proverbs 15:1", "Colossians 3:13", "Ephesians 4:2-3", "1 Peter 3:8", "Proverbs 17:6"] },
  { name: "Blended Families", aliases: ["stepfamilies", "step-parents", "stepchildren", "a-blended-family"],
    verses: ["Ephesians 2:19", "Psalm 68:6", "Romans 15:7", "Colossians 3:12-14", "Ephesians 6:4", "1 Corinthians 13:4-7", "Ephesians 4:2-3", "Galatians 6:2", "Esther 2:7", "Romans 12:10", "Joshua 24:15", "1 Peter 4:8"] },
  { name: "Infertility", aliases: ["struggling-to-conceive", "barrenness", "trying-for-a-baby", "childlessness"],
    verses: ["1 Samuel 1:10-11", "1 Samuel 1:27", "Genesis 25:21", "Psalm 113:9", "Luke 1:7", "Luke 1:13", "Isaiah 54:1", "Psalm 139:13-16", "Psalm 34:18", "Genesis 30:22", "2 Corinthians 12:9", "Romans 12:15"] },
  { name: "Losing a Baby", aliases: ["miscarriage", "stillbirth", "infant-loss", "losing-a-child"],
    verses: ["2 Samuel 12:23", "Psalm 34:18", "Psalm 147:3", "Matthew 19:14", "Psalm 139:13-16", "Revelation 21:4", "Isaiah 40:11", "Psalm 56:8", "Romans 8:38-39", "Job 1:21", "Psalm 23:4", "2 Corinthians 1:3-4"] },
  { name: "Homeschooling", aliases: ["teaching-your-children-at-home", "home-education", "homeschool"],
    verses: ["Deuteronomy 6:6-7", "Proverbs 22:6", "Ephesians 6:4", "Proverbs 1:8-9", "Psalm 78:4", "Psalm 78:5-6", "2 Timothy 3:15", "Proverbs 9:10", "Deuteronomy 11:19", "Colossians 3:21", "Isaiah 54:13", "Psalm 127:3"] },
  { name: "Growing Older", aliases: ["aging", "old-age", "getting-old", "growing-old"],
    verses: ["Psalm 71:9", "Psalm 71:18", "Isaiah 46:4", "Proverbs 16:31", "Psalm 92:14", "2 Corinthians 4:16", "Job 12:12", "Titus 2:2", "Psalm 90:12", "Ecclesiastes 12:1", "Psalm 103:5", "Proverbs 20:29"] },

  /* ------------------------------------------------------------ other people */
  { name: "Difficult People", aliases: ["toxic-people", "hard-to-love-people", "difficult-relationships", "dealing-with-difficult-people"],
    verses: ["Romans 12:18", "Proverbs 15:1", "Matthew 5:44", "Proverbs 22:24-25", "Romans 12:19", "1 Corinthians 15:33", "Proverbs 26:4", "Titus 3:10", "Luke 6:27-28", "Proverbs 13:20", "2 Timothy 3:5", "Matthew 18:15"] },
  { name: "Choosing Friends", aliases: ["bad-friends", "good-friends", "friendship", "who-you-spend-time-with"],
    verses: ["Proverbs 13:20", "Proverbs 27:17", "1 Corinthians 15:33", "Proverbs 18:24", "Proverbs 17:17", "Ecclesiastes 4:9-10", "Proverbs 22:24-25", "John 15:13", "Psalm 1:1", "Amos 3:3", "Proverbs 12:26", "2 Corinthians 6:14"] },
  { name: "Honoring Your Parents", aliases: ["honoring-parents", "honour-thy-father-and-mother", "obeying-parents"],
    verses: ["Exodus 20:12", "Ephesians 6:1", "Ephesians 6:2-3", "Colossians 3:20", "Proverbs 1:8", "Proverbs 23:22", "Proverbs 6:20", "Leviticus 19:3", "Deuteronomy 5:16", "Proverbs 30:17", "1 Timothy 5:4", "Matthew 15:4"] },
  { name: "Accountability", aliases: ["accountability-partners", "being-accountable", "confessing-to-one-another"],
    verses: ["Proverbs 27:17", "James 5:16", "Galatians 6:1", "Ecclesiastes 4:9-10", "Hebrews 10:24-25", "Proverbs 27:6", "Matthew 18:15", "2 Timothy 2:2", "Proverbs 11:14", "Galatians 6:2", "1 Thessalonians 5:11", "Romans 15:14"] },

  /* ------------------------------------------------------------ work and money */
  { name: "Saving Money", aliases: ["saving-and-planning", "savings", "planning-ahead", "financial-planning"],
    verses: ["Proverbs 21:20", "Proverbs 13:22", "Proverbs 6:6-8", "Luke 14:28", "Proverbs 27:23-24", "Genesis 41:35-36", "Proverbs 13:11", "Ecclesiastes 11:2", "1 Timothy 5:8", "Proverbs 22:7", "Matthew 6:19-21", "Proverbs 3:9-10"] },
  { name: "Lawsuits", aliases: ["going-to-court", "suing-someone", "legal-disputes", "taking-someone-to-court"],
    verses: ["1 Corinthians 6:1", "1 Corinthians 6:6-7", "Matthew 5:25", "Matthew 5:40", "Proverbs 25:8-9", "Romans 12:19", "Proverbs 17:14", "Luke 12:58", "Exodus 23:1-2", "Deuteronomy 16:19-20", "James 4:1-2", "Romans 13:1"] },
  { name: "Healthcare Workers", aliases: ["nurses", "doctors", "for-nurses", "caring-for-the-sick"],
    verses: ["Matthew 25:36", "Luke 10:33-34", "Colossians 3:23", "Galatians 6:9", "Matthew 10:8", "3 John 1:2", "Jeremiah 30:17", "Psalm 41:3", "Isaiah 40:31", "1 Peter 4:10", "Proverbs 31:20", "Luke 4:40"] },
  { name: "Sports and Competition", aliases: ["sports", "athletes", "competition", "for-athletes"],
    verses: ["1 Corinthians 9:24", "1 Corinthians 9:25", "1 Corinthians 9:27", "Hebrews 12:1", "2 Timothy 2:5", "Philippians 3:14", "Colossians 3:23", "Proverbs 27:17", "1 Timothy 4:8", "Galatians 6:9", "Ecclesiastes 9:11", "2 Timothy 4:7"] },

  /* ------------------------------------------------------------- church life */
  { name: "Singing and Music", aliases: ["singing", "music", "congregational-singing", "psalms-hymns-and-spiritual-songs"],
    verses: ["Psalm 100:1-2", "Ephesians 5:19", "Colossians 3:16", "Psalm 96:1", "Psalm 150:3-5", "Psalm 33:3", "2 Chronicles 20:21", "Acts 16:25", "Psalm 95:1-2", "James 5:13", "Zephaniah 3:17", "Revelation 5:9"] },
  { name: "Modesty", aliases: ["dressing-modestly", "modest-apparel", "how-to-dress"],
    verses: ["1 Timothy 2:9-10", "1 Peter 3:3-4", "Proverbs 31:30", "1 Samuel 16:7", "Romans 12:1-2", "1 Corinthians 6:19-20", "Matthew 5:28", "1 Thessalonians 4:3-4", "Titus 2:3-5", "Psalm 139:14", "1 Corinthians 10:31", "Colossians 3:12"] },
  { name: "The Conscience", aliases: ["conscience", "a-clear-conscience", "a-guilty-conscience"],
    verses: ["Romans 2:15", "Acts 24:16", "1 Timothy 1:5", "1 Timothy 1:19", "1 Timothy 4:2", "Hebrews 9:14", "Hebrews 10:22", "1 Peter 3:16", "1 Corinthians 8:12", "Titus 1:15", "Romans 14:23", "2 Corinthians 1:12"] },

  /* ----------------------------------------------- doctrine the outline wanted */
  { name: "The Work of the Holy Spirit", aliases: ["what-the-holy-spirit-does", "the-holy-spirits-work", "the-ministry-of-the-holy-spirit"],
    verses: ["John 16:8", "John 16:13", "John 16:14", "John 14:26", "Romans 8:26", "Ephesians 1:13-14", "1 Corinthians 6:19", "Galatians 5:16", "Acts 1:8", "Titus 3:5", "Romans 8:14", "2 Corinthians 3:17"] },
  { name: "The Resurrection of the Dead", aliases: ["the-bodily-resurrection", "resurrection-of-the-dead", "will-we-be-raised"],
    verses: ["1 Corinthians 15:20-22", "1 Corinthians 15:42-44", "1 Corinthians 15:52-53", "John 5:28-29", "Daniel 12:2", "1 Thessalonians 4:16", "Job 19:26", "Philippians 3:21", "Acts 24:15", "John 11:25", "Romans 8:11", "Revelation 20:13"] },
  { name: "Covenant", aliases: ["the-covenants", "gods-covenant", "the-new-covenant"],
    verses: ["Genesis 9:13", "Genesis 17:7", "Exodus 19:5", "Jeremiah 31:31", "Jeremiah 31:33", "Luke 22:20", "Hebrews 8:6", "Hebrews 8:10", "Hebrews 9:15", "Hebrews 13:20", "Psalm 89:34", "2 Corinthians 3:6"] },
  { name: "The Flesh and the Spirit", aliases: ["flesh-vs-spirit", "walking-in-the-spirit", "the-old-man", "crucifying-the-flesh"],
    verses: ["Galatians 5:16", "Galatians 5:17", "Galatians 5:19-21", "Galatians 5:22-23", "Romans 8:5", "Romans 8:6", "Romans 8:13", "Romans 7:18", "1 Peter 2:11", "Ephesians 4:22-24", "Colossians 3:5", "Romans 13:14"] },
  { name: "Adopted by God", aliases: ["spiritual-adoption", "sons-of-god", "children-of-god", "adoption-in-christ"],
    verses: ["Romans 8:15", "Romans 8:16", "Romans 8:17", "Galatians 4:4-5", "Galatians 4:6", "Galatians 4:7", "Ephesians 1:5", "John 1:12", "1 John 3:1", "1 John 3:2", "2 Corinthians 6:18", "Romans 9:26"] },
];

export const LIFE_INTROS = {
  overthinking: "The mind that will not stop at bedtime is not a modern invention. Scripture's answer is not to think less but to think toward something — whatsoever things are true, honest, just, pure. Philippians 4 gives the instruction and the result in the same breath.",
  perfectionism: "He knoweth our frame; he remembereth that we are dust. These are the passages for someone who cannot put a thing down until it is flawless, including Paul's admission that he had not arrived either.",
  failure: "A just man falleth seven times, and riseth up again. Scripture's measure of a man is not that he never went down. Peter is here, after the fire and before the beach.",
  "forgiving-yourself": "As far as the east is from the west — God's own description of what he does with sin he has forgiven. These verses are for the person who believes that about everyone else.",
  "false-accusation": "False witnesses did rise up. The Psalms are full of this and so are the gospels, and 1 Peter points at the one who, when he was reviled, reviled not again.",
  "unanswered-prayer": "Paul asked three times and got a no with a reason attached. These are the passages about prayers that do not get the answer asked for — including the ones that simply say how long, O Lord.",
  "when-god-seems-silent": "My God, my God, why hast thou forsaken me. The complaint is in the Bible, which means it is allowed. These verses do not hurry anyone out of it.",
  backsliding: "Return, ye backsliding children, and I will heal your backslidings. The word is God's own, and the offer in it is not grudging.",
  "church-hurt": "It was not an enemy, says Psalm 55 — it was a companion, a guide, someone you went to the house of God with. Scripture knows this wound by name, and these verses hold both that honesty and the instruction not to forsake the assembling.",
  "the-empty-nest": "Children are an heritage of the LORD, and arrows in the hand of a mighty man — and an arrow is made to be released. These verses are for the house that got quiet.",
  "raising-teenagers": "Train up a child in the way he should go, and the harder half: provoke not your children to wrath. Both are commands and they were given to the same parent.",
  "a-prodigal-child": "When he was yet a great way off, his father saw him. He saw him because he was watching. These are the verses for parents who are still watching the road.",
  "caring-for-aging-parents": "Honour thy father and thy mother is not a command for children only. Paul tells Timothy to let the household learn to requite their parents, and Jesus from the cross arranged for his mother.",
  caregiving: "Bear ye one another's burdens. These verses are for the person carrying someone else's, who is tired in a way that sleep does not fix.",
  "in-laws": "Whither thou goest, I will go — said by a woman to her mother-in-law, which is worth remembering. Jethro's advice to Moses is here too, since in-laws sometimes see what you cannot.",
  "blended-families": "Now therefore ye are no more strangers and foreigners, but fellowcitizens. Esther was raised by a cousin; the household of God is built out of people who were not born into it.",
  infertility: "Hannah prayed and wept sore, and the Bible records her bitterness before it records her answer. These verses do not promise a particular ending, and they do not pretend the waiting is light.",
  "losing-a-baby": "David said of his child, I shall go to him, but he shall not return to me — the first clear word of hope in this grief. The LORD is nigh unto them that are of a broken heart, and he putteth thy tears into his bottle.",
  homeschooling: "Thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house. The instruction in Deuteronomy 6 is about the whole day, not a subject slot.",
  "growing-older": "Cast me not off in the time of old age. And the answer: even to your old age I am he, and even to hoar hairs will I carry you.",
  "difficult-people": "If it be possible, as much as lieth in you, live peaceably with all men — a verse with two conditions built into it, which is itself an admission. Proverbs is blunter: make no friendship with an angry man.",
  "choosing-friends": "He that walketh with wise men shall be wise, but a companion of fools shall be destroyed. Scripture treats the question of who you spend time with as a question about who you will become.",
  "honoring-your-parents": "The first commandment with promise, as Paul points out. These verses cover what honour means for a child, and what it means for an adult whose parents are old.",
  accountability: "Iron sharpeneth iron. Confess your faults one to another. Both assume someone close enough to be told the truth and trusted with it.",
  "saving-money": "There is treasure to be desired and oil in the dwelling of the wise, but a foolish man spendeth it up. Joseph stored seven years of grain; the Proverbs tell you to go look at an ant.",
  lawsuits: "Dare any of you, having a matter against another, go to law before the unjust? Paul's question to Corinth is here with Jesus' instruction to agree with your adversary quickly.",
  "healthcare-workers": "I was sick, and ye visited me. The Samaritan bound up wounds and paid for a room. These are the verses for people whose work is other people's worst days.",
  "sports-and-competition": "Paul reached for the track and the arena more than once: run that ye may obtain, strive for the mastery, I have finished my course. The discipline was the point of the picture.",
  "singing-and-music": "Speaking to yourselves in psalms and hymns and spiritual songs — speaking to yourselves, which makes congregational singing something the church does to itself rather than something performed at it.",
  modesty: "In modest apparel, with shamefacedness and sobriety — and immediately, that which becometh women professing godliness, with good works. Peter puts it the same way round: the hidden man of the heart first.",
  "the-conscience": "A conscience void of offence toward God, and toward men. Scripture treats the conscience as real and as trainable — it can be good, weak, seared, or purged.",
  "the-work-of-the-holy-spirit": "Jesus named three things the Comforter would do when he came: reprove the world of sin, of righteousness, and of judgment. These verses cover that and the rest of it — guiding, teaching, indwelling, sealing, interceding.",
  "the-resurrection-of-the-dead": "Not the soul going somewhere, but the body raised. Job expected it from his own flesh; Paul calls Christ the firstfruits and argues that our resurrection follows from his.",
  covenant: "God binds himself by agreements he does not break — with Noah and a rainbow, with Abraham and his seed, at Sinai, and then a new one written not on stone but in the heart.",
  "the-flesh-and-the-spirit": "These two are contrary the one to the other, so that ye cannot do the things that ye would. Galatians 5 and Romans 8 set out the conflict and name both sets of works.",
  "adopted-by-god": "Ye have received the Spirit of adoption, whereby we cry, Abba, Father. Adoption in the New Testament is a legal word about standing and inheritance, not only about belonging.",
};
