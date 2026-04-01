import { useState } from "react";

// Free KJV audio from BibleGateway (direct MP3 URLs)
// Format: https://stream.biblegateway.com/bibles/[version]/[book]_[chapter].mp3
// This uses the openly available audio streams

const BOOK_NUM = {
  "Genesis": "01", "Exodus": "02", "Leviticus": "03", "Numbers": "04",
  "Deuteronomy": "05", "Joshua": "06", "Judges": "07", "Ruth": "08",
  "1 Samuel": "09", "2 Samuel": "10", "1 Kings": "11", "2 Kings": "12",
  "1 Chronicles": "13", "2 Chronicles": "14", "Ezra": "15", "Nehemiah": "16",
  "Esther": "17", "Job": "18", "Psalms": "19", "Proverbs": "20",
  "Ecclesiastes": "21", "Song of Solomon": "22", "Isaiah": "23",
  "Jeremiah": "24", "Lamentations": "25", "Ezekiel": "26", "Daniel": "27",
  "Hosea": "28", "Joel": "29", "Amos": "30", "Obadiah": "31",
  "Jonah": "32", "Micah": "33", "Nahum": "34", "Habakkuk": "35",
  "Zephaniah": "36", "Haggai": "37", "Zechariah": "38", "Malachi": "39",
  "Matthew": "40", "Mark": "41", "Luke": "42", "John": "43",
  "Acts": "44", "Romans": "45", "1 Corinthians": "46",
  "2 Corinthians": "47", "Galatians": "48", "Ephesians": "49",
  "Philippians": "50", "Colossians": "51", "1 Thessalonians": "52",
  "2 Thessalonians": "53", "1 Timothy": "54", "2 Timothy": "55",
  "Titus": "56", "Philemon": "57", "Hebrews": "58", "James": "59",
  "1 Peter": "60", "2 Peter": "61", "1 John": "62", "2 John": "63",
  "3 John": "64", "Jude": "65", "Revelation": "66",
};

export default function AudioBible({ book, chapter }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);

  const bookNum = BOOK_NUM[book];
  const chStr = String(chapter).padStart(3, "0");

  // BibleGateway KJV audio stream URL
  const audioUrl = bookNum
    ? `https://stream.biblegateway.com/bibles/61-KJV-dramatic/${bookNum}_${book.replace(/\s/g, "_")}_${chStr}.mp3`
    : null;

  // Fallback search URL
  const searchUrl = `https://www.biblegateway.com/audio/mclean/kjv/${encodeURIComponent(book)}.${chapter}`;

  return (
    <div className="mx-4 mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          Listen to {book} {chapter}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark p-4">
          {/* In-app audio player */}
          <div className="mb-3">
            <p className="text-[10px] text-warm-brown-light uppercase tracking-wider mb-2">KJV Dramatized Audio</p>
            <audio
              controls
              className="w-full h-10"
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={(e) => {
                // If direct URL fails, show fallback
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            >
              Your browser does not support audio.
            </audio>
            <div style={{ display: "none" }}>
              <p className="text-xs text-warm-brown-light mt-2">
                Direct audio unavailable.{" "}
                <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold/80">
                  Listen on BibleGateway
                </a>
              </p>
            </div>
          </div>

          {/* Bible.is dramatized */}
          <a
            href={`https://www.bible.is/bible/ENGKJV/search?query=${encodeURIComponent(book + " " + chapter)}`}
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
              <p className="text-xs font-medium text-warm-brown">Bible.is — Dramatized KJV</p>
              <p className="text-[10px] text-warm-brown-light">Full cast dramatization with sound effects</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light/50 shrink-0">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
