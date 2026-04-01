import { useApp } from "../../stores/AppContext";

const HIGHLIGHT_COLORS = {
  yellow: "bg-highlight-yellow",
  green: "bg-highlight-green",
  blue: "bg-highlight-blue",
  pink: "bg-highlight-pink",
};

export default function VerseList({
  verses,
  getHighlight,
  getNote,
  selectedVerse,
  onVerseNumberTap,
  onWordTap,
  chapterWords,
}) {
  const { fontSize } = useApp();

  if (!verses || verses.length === 0) return null;

  return (
    <div
      className="font-scripture px-5 py-4 bg-scripture-bg rounded-xl mx-2"
      style={{ fontSize: `${fontSize}px` }}
    >
      {verses.map((v) => {
        const highlight = getHighlight(v.verse);
        const note = getNote(v.verse);
        const isSelected = selectedVerse === v.verse;
        const hlClass = highlight ? HIGHLIGHT_COLORS[highlight.color] : "";
        const wordsForVerse = chapterWords?.[v.verse];

        return (
          <span
            key={v.verse}
            className={`transition-colors rounded-sm ${hlClass} ${
              isSelected ? "ring-2 ring-gold/50 rounded" : ""
            }`}
          >
            {/* Verse number — tappable for actions */}
            <sup
              className="verse-number cursor-pointer hover:text-gold/80 select-none"
              onClick={(e) => {
                e.stopPropagation();
                onVerseNumberTap(isSelected ? null : v.verse);
              }}
            >
              {v.verse}
            </sup>
            {wordsForVerse ? (
              <EnrichedText words={wordsForVerse} onWordTap={onWordTap} />
            ) : (
              <PlainText text={v.text} verseNumber={v.verse} onWordTap={onWordTap} />
            )}
            {" "}
            {note && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3 inline text-gold -mt-1"
              >
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l12.15-12.15z" />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}

// Plain text fallback while word data loads
function PlainText({ text, verseNumber, onWordTap }) {
  const words = text.split(/\s+/);
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onWordTap(word, verseNumber, text);
          }}
        >
          {word}{" "}
        </span>
      ))}
    </>
  );
}

// Enriched view — original words tappable with underline, added words italic
function EnrichedText({ words, onWordTap }) {
  return (
    <>
      {words.map((w, i) => {
        if (w.added) {
          return (
            <span key={i} className="italic text-warm-brown-light/80">
              {w.word}{" "}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="word-tappable"
            onClick={(e) => {
              e.stopPropagation();
              onWordTap(w);
            }}
          >
            {w.word}{" "}
          </span>
        );
      })}
    </>
  );
}
