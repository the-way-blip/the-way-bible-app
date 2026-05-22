/**
 * Larger curated pool of verses for "Verse of the Day".
 * Tagged with topics so we can match against the user's onboarding selections.
 *
 * Topic tags map to onboarding "topics" survey values:
 *   salvation, faith, love, wisdom, prayer, hope, forgiveness, spiritual_warfare
 *
 * Books are tracked so we can also pull contextually from the user's lastReadBook.
 */
const DAILY_VERSES = [
  // ── Foundational gospel verses ──
  { ref: "John 3:16",        book: "John",          chapter: 3,   verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", topics: ["salvation", "love"] },
  { ref: "Romans 10:9",      book: "Romans",        chapter: 10,  verse: 9,  text: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.", topics: ["salvation"] },
  { ref: "Ephesians 2:8-9",  book: "Ephesians",     chapter: 2,   verse: 8,  text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.", topics: ["salvation", "faith"] },
  { ref: "Romans 6:23",      book: "Romans",        chapter: 6,   verse: 23, text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.", topics: ["salvation"] },
  { ref: "John 14:6",        book: "John",          chapter: 14,  verse: 6,  text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.", topics: ["salvation"] },
  { ref: "Romans 5:8",       book: "Romans",        chapter: 5,   verse: 8,  text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.", topics: ["love", "salvation"] },
  { ref: "Acts 16:31",       book: "Acts",          chapter: 16,  verse: 31, text: "Believe on the Lord Jesus Christ, and thou shalt be saved.", topics: ["salvation"] },
  { ref: "2 Corinthians 5:17", book: "2 Corinthians", chapter: 5, verse: 17, text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.", topics: ["salvation"] },

  // ── Faith ──
  { ref: "Hebrews 11:1",     book: "Hebrews",       chapter: 11,  verse: 1,  text: "Now faith is the substance of things hoped for, the evidence of things not seen.", topics: ["faith"] },
  { ref: "Hebrews 11:6",     book: "Hebrews",       chapter: 11,  verse: 6,  text: "But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.", topics: ["faith"] },
  { ref: "Mark 11:24",       book: "Mark",          chapter: 11,  verse: 24, text: "Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.", topics: ["faith", "prayer"] },
  { ref: "Romans 10:17",     book: "Romans",        chapter: 10,  verse: 17, text: "So then faith cometh by hearing, and hearing by the word of God.", topics: ["faith"] },
  { ref: "James 2:17",       book: "James",         chapter: 2,   verse: 17, text: "Even so faith, if it hath not works, is dead, being alone.", topics: ["faith"] },
  { ref: "2 Corinthians 5:7", book: "2 Corinthians", chapter: 5,  verse: 7,  text: "For we walk by faith, not by sight.", topics: ["faith"] },
  { ref: "Galatians 2:20",   book: "Galatians",     chapter: 2,   verse: 20, text: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me.", topics: ["faith"] },

  // ── Love ──
  { ref: "1 Corinthians 13:4-7", book: "1 Corinthians", chapter: 13, verse: 4, text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; rejoiceth not in iniquity, but rejoiceth in the truth; beareth all things, believeth all things, hopeth all things, endureth all things.", topics: ["love"] },
  { ref: "1 John 4:8",       book: "1 John",        chapter: 4,   verse: 8,  text: "He that loveth not knoweth not God; for God is love.", topics: ["love"] },
  { ref: "John 15:13",       book: "John",          chapter: 15,  verse: 13, text: "Greater love hath no man than this, that a man lay down his life for his friends.", topics: ["love"] },
  { ref: "1 John 4:19",      book: "1 John",        chapter: 4,   verse: 19, text: "We love him, because he first loved us.", topics: ["love"] },
  { ref: "Romans 8:38-39",   book: "Romans",        chapter: 8,   verse: 38, text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.", topics: ["love"] },

  // ── Prayer ──
  { ref: "Philippians 4:6-7", book: "Philippians",  chapter: 4,   verse: 6,  text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.", topics: ["prayer"] },
  { ref: "1 Thessalonians 5:17", book: "1 Thessalonians", chapter: 5, verse: 17, text: "Pray without ceasing.", topics: ["prayer"] },
  { ref: "James 5:16",       book: "James",         chapter: 5,   verse: 16, text: "Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.", topics: ["prayer"] },
  { ref: "Jeremiah 33:3",    book: "Jeremiah",      chapter: 33,  verse: 3,  text: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.", topics: ["prayer"] },
  { ref: "Matthew 7:7",      book: "Matthew",       chapter: 7,   verse: 7,  text: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.", topics: ["prayer"] },
  { ref: "1 John 5:14",      book: "1 John",        chapter: 5,   verse: 14, text: "And this is the confidence that we have in him, that, if we ask any thing according to his will, he heareth us.", topics: ["prayer"] },
  { ref: "Psalm 145:18",     book: "Psalms",        chapter: 145, verse: 18, text: "The LORD is nigh unto all them that call upon him, to all that call upon him in truth.", topics: ["prayer"] },

  // ── Hope ──
  { ref: "Jeremiah 29:11",   book: "Jeremiah",      chapter: 29,  verse: 11, text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", topics: ["hope"] },
  { ref: "Romans 15:13",     book: "Romans",        chapter: 15,  verse: 13, text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.", topics: ["hope"] },
  { ref: "Romans 8:28",      book: "Romans",        chapter: 8,   verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", topics: ["hope"] },
  { ref: "Isaiah 40:31",     book: "Isaiah",        chapter: 40,  verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", topics: ["hope"] },
  { ref: "Lamentations 3:22-23", book: "Lamentations", chapter: 3, verse: 22, text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", topics: ["hope"] },
  { ref: "Hebrews 6:19",     book: "Hebrews",       chapter: 6,   verse: 19, text: "Which hope we have as an anchor of the soul, both sure and stedfast, and which entereth into that within the veil.", topics: ["hope"] },
  { ref: "1 Peter 1:3",      book: "1 Peter",       chapter: 1,   verse: 3,  text: "Blessed be the God and Father of our Lord Jesus Christ, which according to his abundant mercy hath begotten us again unto a lively hope by the resurrection of Jesus Christ from the dead.", topics: ["hope"] },

  // ── Wisdom ──
  { ref: "Proverbs 3:5-6",   book: "Proverbs",      chapter: 3,   verse: 5,  text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.", topics: ["wisdom"] },
  { ref: "James 1:5",        book: "James",         chapter: 1,   verse: 5,  text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.", topics: ["wisdom"] },
  { ref: "Proverbs 1:7",     book: "Proverbs",      chapter: 1,   verse: 7,  text: "The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction.", topics: ["wisdom"] },
  { ref: "Proverbs 9:10",    book: "Proverbs",      chapter: 9,   verse: 10, text: "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.", topics: ["wisdom"] },
  { ref: "Psalm 111:10",     book: "Psalms",        chapter: 111, verse: 10, text: "The fear of the LORD is the beginning of wisdom: a good understanding have all they that do his commandments: his praise endureth for ever.", topics: ["wisdom"] },

  // ── Forgiveness ──
  { ref: "1 John 1:9",       book: "1 John",        chapter: 1,   verse: 9,  text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.", topics: ["forgiveness"] },
  { ref: "Ephesians 4:32",   book: "Ephesians",     chapter: 4,   verse: 32, text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.", topics: ["forgiveness"] },
  { ref: "Colossians 3:13",  book: "Colossians",    chapter: 3,   verse: 13, text: "Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.", topics: ["forgiveness"] },
  { ref: "Psalm 103:12",     book: "Psalms",        chapter: 103, verse: 12, text: "As far as the east is from the west, so far hath he removed our transgressions from us.", topics: ["forgiveness"] },
  { ref: "Matthew 6:14-15",  book: "Matthew",       chapter: 6,   verse: 14, text: "For if ye forgive men their trespasses, your heavenly Father will also forgive you: But if ye forgive not men their trespasses, neither will your Father forgive your trespasses.", topics: ["forgiveness"] },

  // ── Spiritual warfare / strength ──
  { ref: "Ephesians 6:10-11", book: "Ephesians",    chapter: 6,   verse: 10, text: "Finally, my brethren, be strong in the Lord, and in the power of his might. Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.", topics: ["spiritual_warfare"] },
  { ref: "James 4:7",        book: "James",         chapter: 4,   verse: 7,  text: "Submit yourselves therefore to God. Resist the devil, and he will flee from you.", topics: ["spiritual_warfare"] },
  { ref: "1 Peter 5:8-9",    book: "1 Peter",       chapter: 5,   verse: 8,  text: "Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour: Whom resist stedfast in the faith.", topics: ["spiritual_warfare"] },
  { ref: "2 Corinthians 10:4", book: "2 Corinthians", chapter: 10, verse: 4, text: "For the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds.", topics: ["spiritual_warfare"] },
  { ref: "Philippians 4:13", book: "Philippians",   chapter: 4,   verse: 13, text: "I can do all things through Christ which strengtheneth me.", topics: ["faith", "spiritual_warfare"] },

  // ── Fear & courage ──
  { ref: "Joshua 1:9",       book: "Joshua",        chapter: 1,   verse: 9,  text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", topics: ["hope", "faith"] },
  { ref: "Isaiah 41:10",     book: "Isaiah",        chapter: 41,  verse: 10, text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", topics: ["hope"] },
  { ref: "2 Timothy 1:7",    book: "2 Timothy",     chapter: 1,   verse: 7,  text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", topics: ["spiritual_warfare", "love"] },
  { ref: "Deuteronomy 31:6", book: "Deuteronomy",   chapter: 31,  verse: 6,  text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.", topics: ["faith", "hope"] },

  // ── Comfort / shepherd / abiding ──
  { ref: "Psalm 23:1",       book: "Psalms",        chapter: 23,  verse: 1,  text: "The LORD is my shepherd; I shall not want.", topics: ["hope"] },
  { ref: "Psalm 119:105",    book: "Psalms",        chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path.", topics: ["wisdom"] },
  { ref: "Matthew 11:28",    book: "Matthew",       chapter: 11,  verse: 28, text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", topics: ["hope"] },
  { ref: "John 14:27",       book: "John",          chapter: 14,  verse: 27, text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.", topics: ["hope"] },
  { ref: "John 16:33",       book: "John",          chapter: 16,  verse: 33, text: "These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.", topics: ["hope", "faith"] },
  { ref: "Romans 12:2",      book: "Romans",        chapter: 12,  verse: 2,  text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.", topics: ["wisdom"] },
  { ref: "Psalm 46:1",       book: "Psalms",        chapter: 46,  verse: 1,  text: "God is our refuge and strength, a very present help in trouble.", topics: ["hope"] },
  { ref: "Psalm 27:1",       book: "Psalms",        chapter: 27,  verse: 1,  text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?", topics: ["hope", "faith"] },
];

/**
 * Pick the verse of the day, using:
 *   - day-of-year for daily rotation (deterministic)
 *   - user's selected topics from onboarding (50% chance of matching one)
 *   - last book read (10% chance, contextual nudge)
 *
 * Falls back to pure rotation if no profile data.
 */
export function getSmartDailyVerse({ topics = [], lastReadBook = null, profile = null } = {}) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  // Stable per-day seed
  const seed = dayOfYear;

  const userTopics = topics.length > 0 ? topics : (profile?.topics || []);

  // 10% chance: contextual to last book
  if (lastReadBook && (seed % 10) === 0) {
    const matches = DAILY_VERSES.filter((v) => v.book === lastReadBook);
    if (matches.length) return matches[seed % matches.length];
  }

  // 50% chance: matches a user topic
  if (userTopics.length > 0 && (seed % 2) === 0) {
    const topicMatches = DAILY_VERSES.filter((v) =>
      v.topics?.some((t) => userTopics.includes(t))
    );
    if (topicMatches.length) return topicMatches[seed % topicMatches.length];
  }

  // Default: stable rotation through the full pool
  return DAILY_VERSES[seed % DAILY_VERSES.length];
}

export default DAILY_VERSES;
