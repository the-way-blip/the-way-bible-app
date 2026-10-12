/**
 * seo/topic-lists.js — the enumerated list for topics that ARE a list.
 *
 * Why this exists. 28 days of Search Console data (Oct 2026) showed the
 * named-entity topic pages splitting into two groups that behave nothing
 * alike, even though they are built from the same template:
 *
 *   jehovah-shalom, el-roi, king-of-kings   position 6-10
 *   the-ten-commandments                    position 23-78
 *   the-fruit-of-the-spirit                 position 37-69
 *
 * Both kinds quote twelve verses. The difference is what the searcher
 * wanted. "jehovah shalom bible verse kjv" wants verses, and gets them.
 * "ten commandments list", "what are the 10 commandments in the bible",
 * "list of 12 disciples of jesus bible verse kjv" want *the list* — and a
 * page headed "12 Bible Verses About the Ten Commandments" does not promise
 * one, so it loses to pages that do.
 *
 * Two signals say the fix is the list and not more verses. "list of 12
 * disciples of jesus bible verse kjv" already sits at position 5.0, our best
 * on the board, because Matthew 10:2-4 happens to name all twelve in the
 * quoted text. And every "fruit of the spirit" variant ranks 37-69 while the
 * page never once names the nine.
 *
 * So: topics keyed here get the list itself, a title that promises it, and
 * an FAQ. Everything else is untouched — the names of God rank fine as they
 * are and this would only get in their way.
 *
 * Fields:
 *   title    replaces "N Bible Verses About X" in the <title> and <h1>.
 *   lead     one sentence under the heading. Plain, no doctrinal argument.
 *   heading  the <h2> over the list.
 *   source   the passage the list is drawn from. Must resolve in kjv.json.
 *   items    [text, reference]. `text` is KJV wording wherever it is a quote
 *            — check it against seo/data/kjv.json before editing, because the
 *            page prints it as scripture.
 *   note     an honest caveat where traditions differ. Optional, and worth
 *            more than it looks: it is the kind of thing that gets a page
 *            cited rather than skimmed.
 *   faq      [question, answer]. Emitted as FAQPage JSON-LD too.
 */
export const TOPIC_LISTS = {
  /* ------------------------------------------------------------------ law */
  "the-ten-commandments": {
    desc: "All ten commandments as Exodus 20 gives them, numbered and linked: no other gods, no graven image, not taking the LORD's name in vain, the sabbath, honouring father and mother, killing, adultery, stealing, false witness, and coveting.",
    title: "The Ten Commandments",
    lead: "Ten commands given at Sinai and written on two tables of stone — the first four about God, the last six about other people.",
    heading: "All ten, in order",
    source: "Exodus 20:3-17",
    items: [
      ["Thou shalt have no other gods before me.", "Exodus 20:3"],
      ["Thou shalt not make unto thee any graven image.", "Exodus 20:4"],
      ["Thou shalt not take the name of the LORD thy God in vain.", "Exodus 20:7"],
      ["Remember the sabbath day, to keep it holy.", "Exodus 20:8"],
      ["Honour thy father and thy mother.", "Exodus 20:12"],
      ["Thou shalt not kill.", "Exodus 20:13"],
      ["Thou shalt not commit adultery.", "Exodus 20:14"],
      ["Thou shalt not steal.", "Exodus 20:15"],
      ["Thou shalt not bear false witness against thy neighbour.", "Exodus 20:16"],
      ["Thou shalt not covet.", "Exodus 20:17"],
    ],
    note: "The numbering above is the one used by most Protestant churches. Catholic and Lutheran tradition joins the first two into one and splits coveting into two, which gets to ten a different way. The text of Exodus 20 is the same either way; it is the dividing that differs.",
    faq: [
      ["What are the Ten Commandments?", "They are the ten commands God gave Israel at Mount Sinai, recorded in Exodus 20:3-17 and again in Deuteronomy 5:7-21: have no other gods, make no graven image, do not take the LORD's name in vain, keep the sabbath, honour your father and mother, do not kill, do not commit adultery, do not steal, do not bear false witness, and do not covet."],
      ["Where are the Ten Commandments in the Bible?", "Twice. Exodus 20:3-17 gives them at Sinai, and Moses repeats them to the next generation in Deuteronomy 5:7-21."],
      ["Did Jesus summarise the Ten Commandments?", "He summed up the whole law in two commands in Matthew 22:37-40 — love God with all your heart, soul and mind, and love your neighbour as yourself. The first four commandments are the first of those; the last six are the second."],
      ["Why do some churches number them differently?", "The passage never numbers itself. Protestant tradition counts 'no other gods' and 'no graven image' as two; Catholic and Lutheran tradition counts them as one and splits the final command about coveting in two."],
    ],
  },

  /* ---------------------------------------------------------------- fruit */
  "the-fruit-of-the-spirit": {
    desc: "All nine: love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, and temperance — Galatians 5:22-23 in the King James Version, with the modern rendering of each word alongside it.",
    title: "The Fruit of the Spirit",
    lead: "Paul names nine things in Galatians 5:22-23 and calls them one fruit, not nine fruits — which is the argument in miniature: this grows, it is not assembled.",
    heading: "All nine, as Galatians 5:22-23 lists them",
    source: "Galatians 5:22-23",
    items: [
      ["Love", "Galatians 5:22"],
      ["Joy", "Galatians 5:22"],
      ["Peace", "Galatians 5:22"],
      ["Longsuffering — patience", "Galatians 5:22"],
      ["Gentleness — kindness", "Galatians 5:22"],
      ["Goodness", "Galatians 5:22"],
      ["Faith — faithfulness", "Galatians 5:22"],
      ["Meekness — gentleness", "Galatians 5:23"],
      ["Temperance — self-control", "Galatians 5:23"],
    ],
    note: "Four of the nine are words the King James translators used in 1611 that have since drifted. Longsuffering is what newer translations call patience, gentleness is kindness, faith here means faithfulness, and temperance is self-control. The second word in each line above is the modern rendering, not a different item — the list is nine, not thirteen.",
    faq: [
      ["What are the nine fruits of the Spirit?", "Love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, and temperance — Galatians 5:22-23 in the King James Version. Newer translations render the last several as patience, kindness, goodness, faithfulness, gentleness, and self-control."],
      ["Where is the fruit of the Spirit in the Bible?", "Galatians 5:22-23. Paul sets it directly against the works of the flesh he has just listed in Galatians 5:19-21."],
      ["Is it fruit or fruits of the Spirit?", "The verse says fruit, singular, even though nine things follow. The grammar is deliberate: these grow together out of one life, rather than being nine separate achievements."],
      ["What is the difference between gentleness and meekness in the list?", "They translate two different Greek words. The KJV's 'gentleness' in verse 22 is the one modern versions call kindness; its 'meekness' in verse 23 is the one they call gentleness."],
    ],
  },

  /* ------------------------------------------------------------ disciples */
  "the-twelve-disciples": {
    desc: "All twelve named: Peter, Andrew, James, John, Philip, Bartholomew, Thomas, Matthew, James the son of Alphaeus, Thaddaeus, Simon the Canaanite, and Judas Iscariot — Matthew 10:2-4.",
    title: "The Twelve Disciples of Jesus",
    lead: "Twelve ordinary men — fishermen, a tax collector, a zealot, a traitor — named together in Matthew 10:2-4 and sent out with authority.",
    heading: "All twelve, as Matthew 10:2-4 names them",
    source: "Matthew 10:2-4",
    items: [
      ["Simon, who is called Peter", "Matthew 10:2"],
      ["Andrew, his brother", "Matthew 10:2"],
      ["James, the son of Zebedee", "Matthew 10:2"],
      ["John, his brother", "Matthew 10:2"],
      ["Philip", "Matthew 10:3"],
      ["Bartholomew", "Matthew 10:3"],
      ["Thomas", "Matthew 10:3"],
      ["Matthew the publican", "Matthew 10:3"],
      ["James, the son of Alphaeus", "Matthew 10:3"],
      ["Lebbaeus, whose surname was Thaddaeus", "Matthew 10:3"],
      ["Simon the Canaanite", "Matthew 10:4"],
      ["Judas Iscariot, who also betrayed him", "Matthew 10:4"],
    ],
    note: "Four lists of the twelve survive — Matthew 10:2-4, Mark 3:16-19, Luke 6:14-16 and Acts 1:13 — and they agree on every name but one. Where Matthew and Mark have Thaddaeus, Luke and Acts have Judas the brother of James, long taken to be the same man under another name. After the betrayal, Matthias was chosen to take Judas Iscariot's place in Acts 1:26.",
    faq: [
      ["Who were the twelve disciples of Jesus?", "Peter, Andrew, James the son of Zebedee, John, Philip, Bartholomew, Thomas, Matthew, James the son of Alphaeus, Thaddaeus, Simon the Canaanite, and Judas Iscariot — Matthew 10:2-4."],
      ["What is the difference between a disciple and an apostle?", "A disciple is a learner and follower; an apostle is one sent out. The twelve were both, and Matthew 10:2 calls them apostles at the moment Jesus sends them."],
      ["Who replaced Judas Iscariot?", "Matthias. The eleven cast lots between him and Joseph called Barsabas, and the lot fell on Matthias in Acts 1:26."],
      ["Do the four lists of the twelve disagree?", "Only on one name. Matthew and Mark name Thaddaeus where Luke and Acts name Judas the brother of James — understood since early times to be the same man, distinguished from Judas Iscariot."],
    ],
  },

  /* ---------------------------------------------------------------- armor */
  "the-armor-of-god": {
    desc: "All six pieces from Ephesians 6:14-17: the belt of truth, the breastplate of righteousness, feet shod with the gospel of peace, the shield of faith, the helmet of salvation, and the sword of the Spirit.",
    title: "The Armor of God",
    lead: "Six pieces, named one at a time in Ephesians 6:14-17, and a seventh thing to do while wearing them.",
    heading: "All six pieces, from Ephesians 6:14-17",
    source: "Ephesians 6:14-17",
    items: [
      ["Loins girt about with truth — the belt", "Ephesians 6:14"],
      ["The breastplate of righteousness", "Ephesians 6:14"],
      ["Feet shod with the preparation of the gospel of peace", "Ephesians 6:15"],
      ["The shield of faith", "Ephesians 6:16"],
      ["The helmet of salvation", "Ephesians 6:17"],
      ["The sword of the Spirit, which is the word of God", "Ephesians 6:17"],
    ],
    note: "Paul keeps going in verse 18 — 'praying always with all prayer and supplication in the Spirit' — and many people count prayer as a seventh piece. He does not name it as armour, but he does not stop the sentence either.",
    faq: [
      ["What are the six pieces of the armor of God?", "The belt of truth, the breastplate of righteousness, feet shod with the gospel of peace, the shield of faith, the helmet of salvation, and the sword of the Spirit, which is the word of God — Ephesians 6:14-17."],
      ["Where is the armor of God in the Bible?", "Ephesians 6:10-18. Paul has just told the church to be strong in the Lord, and the armour is how."],
      ["Is prayer the seventh piece of armor?", "Paul names six pieces and then tells them to pray always, in verse 18. Prayer is not called a piece of armour, but it belongs to the same instruction."],
      ["What is the only offensive weapon in the armor of God?", "The sword of the Spirit, which Ephesians 6:17 identifies as the word of God. Everything else listed is for standing and for defence."],
    ],
  },

  /* ----------------------------------------------------------- beatitudes */
  "the-beatitudes": {
    desc: "All eight blessings from Matthew 5:3-10, quoted in full — the poor in spirit, those that mourn, the meek, those who hunger after righteousness, the merciful, the pure in heart, the peacemakers, and the persecuted.",
    title: "The Beatitudes",
    lead: "Eight blessings that open the Sermon on the Mount, each one naming a kind of person and what God will do for them.",
    heading: "All eight, from Matthew 5:3-10",
    source: "Matthew 5:3-10",
    items: [
      ["Blessed are the poor in spirit: for theirs is the kingdom of heaven.", "Matthew 5:3"],
      ["Blessed are they that mourn: for they shall be comforted.", "Matthew 5:4"],
      ["Blessed are the meek: for they shall inherit the earth.", "Matthew 5:5"],
      ["Blessed are they which do hunger and thirst after righteousness: for they shall be filled.", "Matthew 5:6"],
      ["Blessed are the merciful: for they shall obtain mercy.", "Matthew 5:7"],
      ["Blessed are the pure in heart: for they shall see God.", "Matthew 5:8"],
      ["Blessed are the peacemakers: for they shall be called the children of God.", "Matthew 5:9"],
      ["Blessed are they which are persecuted for righteousness’ sake: for theirs is the kingdom of heaven.", "Matthew 5:10"],
    ],
    note: "A ninth blessing follows in Matthew 5:11-12, addressed to 'ye' rather than to a kind of person, which is why it is usually counted separately. Luke gives four of these as blessings in Luke 6:20-22 and sets four woes against them.",
    faq: [
      ["What are the Beatitudes?", "They are the eight blessings Jesus opens the Sermon on the Mount with, in Matthew 5:3-10 — on the poor in spirit, those that mourn, the meek, those who hunger and thirst after righteousness, the merciful, the pure in heart, the peacemakers, and the persecuted."],
      ["How many Beatitudes are there?", "Eight, in Matthew 5:3-10. A ninth in verses 11-12 switches from describing a kind of person to addressing the hearers directly, so it is often counted on its own."],
      ["Where are the Beatitudes in the Bible?", "Matthew 5:3-12, at the start of the Sermon on the Mount. A shorter parallel stands in Luke 6:20-23."],
      ["What does 'blessed' mean in the Beatitudes?", "The Greek word behind it describes someone who is genuinely well off — happy in the deep sense, and congratulated. It is a statement about their condition, not a wish for their future."],
    ],
  },

  /* --------------------------------------------------------- lords prayer */
  "the-lords-prayer": {
    desc: "The Lord's Prayer in the words of Matthew 6:9-13, line by line, with the shorter Luke 11 version and the question of debts versus trespasses explained.",
    title: "The Lord's Prayer",
    titleSuffix: "Full Text, Line by Line",
    lead: "The prayer Jesus gave when the disciples asked to be taught, in the words of Matthew 6:9-13.",
    heading: "The prayer, line by line",
    source: "Matthew 6:9-13",
    items: [
      ["Our Father which art in heaven, Hallowed be thy name.", "Matthew 6:9"],
      ["Thy kingdom come. Thy will be done in earth, as it is in heaven.", "Matthew 6:10"],
      ["Give us this day our daily bread.", "Matthew 6:11"],
      ["And forgive us our debts, as we forgive our debtors.", "Matthew 6:12"],
      ["And lead us not into temptation, but deliver us from evil:", "Matthew 6:13"],
      ["For thine is the kingdom, and the power, and the glory, for ever. Amen.", "Matthew 6:13"],
    ],
    note: "Luke 11:2-4 records a shorter version, given on a different occasion when a disciple asked to be taught to pray. The closing line — 'For thine is the kingdom, and the power, and the glory' — is in the King James text of Matthew and is absent from Luke.",
    faq: [
      ["What is the Lord's Prayer?", "It is the prayer Jesus taught his disciples, given in Matthew 6:9-13: 'Our Father which art in heaven, Hallowed be thy name. Thy kingdom come. Thy will be done in earth, as it is in heaven. Give us this day our daily bread. And forgive us our debts, as we forgive our debtors. And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.'"],
      ["Where is the Lord's Prayer in the Bible?", "Matthew 6:9-13, inside the Sermon on the Mount, with a shorter version in Luke 11:2-4."],
      ["Is it 'debts' or 'trespasses'?", "The King James text of Matthew 6:12 says debts. Trespasses comes from the wording of the Book of Common Prayer, which many churches say aloud, and it echoes Matthew 6:14-15 where Jesus explains the line using that word."],
      ["Why do some versions leave off 'for thine is the kingdom'?", "The line stands in the King James text of Matthew 6:13. It is absent from several of the oldest surviving manuscripts, which is why some modern translations footnote it rather than print it."],
    ],
  },

  /* ----------------------------------------------------- great commission */
  "the-great-commission": {
    desc: "The Great Commission in all five places it is recorded — Matthew 28:19, Mark 16:15, Luke 24:47, John 20:21 and Acts 1:8 — quoted and linked.",
    title: "The Great Commission",
    titleSuffix: "All 5 Passages",
    lead: "The last thing Jesus told his followers to do, recorded at the end of every gospel and again at the start of Acts.",
    heading: "Where it is recorded — all five",
    source: "Matthew 28:18-20",
    items: [
      ["Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost", "Matthew 28:19"],
      ["Go ye into all the world, and preach the gospel to every creature", "Mark 16:15"],
      ["That repentance and remission of sins should be preached in his name among all nations", "Luke 24:47"],
      ["As my Father hath sent me, even so send I you", "John 20:21"],
      ["Ye shall be witnesses unto me ... unto the uttermost part of the earth", "Acts 1:8"],
    ],
    note: "Matthew's is the version usually meant by the name, and the name itself is not in the Bible — it came into common use among English-speaking Protestants in the nineteenth century.",
    faq: [
      ["What is the Great Commission?", "It is Jesus' command to his disciples to go and make disciples of all nations, baptizing and teaching them, given in Matthew 28:18-20 after the resurrection."],
      ["Where is the Great Commission in the Bible?", "Matthew 28:18-20 is the best-known form. Parallels close each of the other gospels — Mark 16:15, Luke 24:46-48, John 20:21 — and Acts 1:8 repeats it just before the ascension."],
      ["What does Matthew 28:19 say?", "'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.'"],
      ["Is the phrase 'Great Commission' in the Bible?", "No. The passage is; the label is not. It became the common name for it among English-speaking Protestants in the 1800s."],
    ],
  },
};
