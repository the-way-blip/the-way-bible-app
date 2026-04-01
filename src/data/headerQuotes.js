// Inspirational quotes about scripture for page headers
const headerQuotes = [
  { text: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105" },
  { text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.", ref: "2 Timothy 3:16" },
  { text: "So then faith cometh by hearing, and hearing by the word of God.", ref: "Romans 10:17" },
  { text: "The entrance of thy words giveth light; it giveth understanding unto the simple.", ref: "Psalm 119:130" },
  { text: "Heaven and earth shall pass away, but my words shall not pass away.", ref: "Matthew 24:35" },
  { text: "For the word of God is quick, and powerful, and sharper than any twoedged sword.", ref: "Hebrews 4:12" },
  { text: "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.", ref: "2 Timothy 2:15" },
  { text: "Thy word have I hid in mine heart, that I might not sin against thee.", ref: "Psalm 119:11" },
  { text: "But be ye doers of the word, and not hearers only, deceiving your own selves.", ref: "James 1:22" },
  { text: "The grass withereth, the flower fadeth: but the word of our God shall stand for ever.", ref: "Isaiah 40:8" },
  { text: "Blessed is he that readeth, and they that hear the words of this prophecy.", ref: "Revelation 1:3" },
  { text: "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.", ref: "Matthew 4:4" },
  { text: "As newborn babes, desire the sincere milk of the word, that ye may grow thereby.", ref: "1 Peter 2:2" },
  { text: "Open thou mine eyes, that I may behold wondrous things out of thy law.", ref: "Psalm 119:18" },
  { text: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night.", ref: "Joshua 1:8" },
  { text: "Sanctify them through thy truth: thy word is truth.", ref: "John 17:17" },
  { text: "The law of the LORD is perfect, converting the soul.", ref: "Psalm 19:7" },
  { text: "Seek ye out of the book of the LORD, and read.", ref: "Isaiah 34:16" },
  { text: "I will delight myself in thy statutes: I will not forget thy word.", ref: "Psalm 119:16" },
  { text: "The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times.", ref: "Psalm 12:6" },
];

export function getHeaderQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return headerQuotes[dayOfYear % headerQuotes.length];
}

export default headerQuotes;
