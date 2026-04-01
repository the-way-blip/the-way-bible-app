import { useState } from "react";

const BOOK_ABBREV = {
  "Genesis": "Gen", "Exodus": "Exod", "Leviticus": "Lev", "Numbers": "Num",
  "Deuteronomy": "Deut", "Joshua": "Josh", "Judges": "Judg", "Ruth": "Ruth",
  "1 Samuel": "1Sam", "2 Samuel": "2Sam", "1 Kings": "1Kgs", "2 Kings": "2Kgs",
  "1 Chronicles": "1Chr", "2 Chronicles": "2Chr", "Ezra": "Ezra", "Nehemiah": "Neh",
  "Esther": "Esth", "Job": "Job", "Psalms": "Ps", "Proverbs": "Prov",
  "Ecclesiastes": "Eccl", "Song of Solomon": "Song", "Isaiah": "Isa",
  "Jeremiah": "Jer", "Lamentations": "Lam", "Ezekiel": "Ezek", "Daniel": "Dan",
  "Hosea": "Hos", "Joel": "Joel", "Amos": "Amos", "Obadiah": "Obad",
  "Jonah": "Jonah", "Micah": "Mic", "Nahum": "Nah", "Habakkuk": "Hab",
  "Zephaniah": "Zeph", "Haggai": "Hag", "Zechariah": "Zech", "Malachi": "Mal",
  "Matthew": "Matt", "Mark": "Mark", "Luke": "Luke", "John": "John",
  "Acts": "Acts", "Romans": "Rom", "1 Corinthians": "1Cor",
  "2 Corinthians": "2Cor", "Galatians": "Gal", "Ephesians": "Eph",
  "Philippians": "Phil", "Colossians": "Col", "1 Thessalonians": "1Thess",
  "2 Thessalonians": "2Thess", "1 Timothy": "1Tim", "2 Timothy": "2Tim",
  "Titus": "Titus", "Philemon": "Phlm", "Hebrews": "Heb", "James": "Jas",
  "1 Peter": "1Pet", "2 Peter": "2Pet", "1 John": "1John", "2 John": "2John",
  "3 John": "3John", "Jude": "Jude", "Revelation": "Rev",
};

export default function AudioBible({ book, chapter }) {
  const [expanded, setExpanded] = useState(false);
  const abbrev = BOOK_ABBREV[book] || book;

  // Free KJV audio sources
  const audioLinks = [
    {
      name: "Bible.is (Dramatized KJV)",
      url: `https://www.bible.is/bible/ENGKJV/search?query=${encodeURIComponent(book + " " + chapter)}`,
      desc: "Dramatized audio with sound effects",
    },
    {
      name: "ESV.org Audio",
      url: `https://www.esv.org/audio/${encodeURIComponent(book)}+${chapter}/`,
      desc: "Clear narration (ESV translation)",
    },
    {
      name: "BibleGateway Audio",
      url: `https://www.biblegateway.com/audio/mclean/kjv/${encodeURIComponent(book)}.${chapter}`,
      desc: "KJV narration by Alexander Scourby",
    },
  ];

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          Listen to Audio
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark p-3 space-y-2">
          {audioLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-cream rounded-lg p-3 hover:bg-cream-dark transition-colors"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-purple-600">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-warm-brown">{link.name}</p>
                <p className="text-[10px] text-warm-brown-light">{link.desc}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light/50 shrink-0">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
