import { useRef } from "react";
import { useApp } from "../../stores/AppContext";

const HIGHLIGHT_COLORS = {
  yellow: "bg-highlight-yellow",
  green: "bg-highlight-green",
  blue: "bg-highlight-blue",
  pink: "bg-highlight-pink",
};

/**
 * Build a "Book Chapter:V1" or "Book Chapter:V1-Vn" reference string.
 */
function formatReference(book, chapter, verseNumbers) {
  if (!book || !chapter || !verseNumbers?.length) return "";
  const sorted = [...verseNumbers].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const range = first === last ? `${first}` : `${first}-${last}`;
  return `${book} ${chapter}:${range}`;
}

/**
 * Intercept the system copy event so users get
 *   "the selected verse text" — Book Chapter:V (KJV)
 * automatically when they select+copy. If the selection isn't inside the
 * verse list, fall through to the default copy behavior.
 */
function handleCopyEvent(e, container, book, chapter) {
  if (!container || !book || !chapter) return;
  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  // Only intercept if the selection is inside our verse container
  if (!container.contains(range.commonAncestorContainer)) return;

  // Find every verse wrapper that intersects the selection
  const verseEls = container.querySelectorAll("[data-verse]");
  const coveredVerses = [];
  for (const el of verseEls) {
    if (range.intersectsNode(el)) {
      const n = parseInt(el.getAttribute("data-verse"), 10);
      if (Number.isFinite(n)) coveredVerses.push(n);
    }
  }
  if (coveredVerses.length === 0) return;

  // Clone the selection, strip the verse-number buttons so they don't leak
  // into the copied text, and collapse whitespace.
  const fragment = range.cloneContents();
  fragment.querySelectorAll?.(".verse-number-btn").forEach((btn) => btn.remove());
  const cleaned = (fragment.textContent || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return;

  const reference = formatReference(book, chapter, coveredVerses);
  const formatted = `"${cleaned}"\n— ${reference} (KJV)`;

  if (e.clipboardData) {
    e.clipboardData.setData("text/plain", formatted);
    e.preventDefault();
  }
}

// Paragraph break positions for common chapters (every ~4-5 verses as a reading aid)
function shouldBreakParagraph(verseNum, totalVerses) {
  if (totalVerses <= 6) return false;
  if (verseNum === 1) return false;
  // Break every 4-5 verses for readability
  const interval = totalVerses > 30 ? 5 : 4;
  return verseNum > 1 && (verseNum - 1) % interval === 0;
}

export default function VerseList({
  verses,
  getHighlight,
  getNote,
  selectedVerse,
  onVerseNumberTap,
  onWordTap,
  chapterWords,
  book,
  chapter,
}) {
  const { fontSize, studyMode, fontFamily, showVerseNumbers } = useApp();
  const containerRef = useRef(null);

  if (!verses || verses.length === 0) return null;

  return (
    <div
      ref={containerRef}
      onCopy={(e) => handleCopyEvent(e, containerRef.current, book, chapter)}
      className={`font-scripture px-5 py-4 bg-scripture-bg rounded-xl mx-2 max-w-xl mx-auto`}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily,
        lineHeight: "2.1",
        transition: "font-size 0.2s ease, line-height 0.2s ease, max-width 0.2s ease",
      }}
    >
      {verses.map((v) => {
        const highlight = getHighlight(v.verse);
        const note = getNote(v.verse);
        const isSelected = selectedVerse === v.verse;
        const hlClass = highlight ? HIGHLIGHT_COLORS[highlight.color] : "";
        const wordsForVerse = chapterWords?.[v.verse];
        const showBreak = shouldBreakParagraph(v.verse, verses.length);
        const isParaStart = v.verse === 1 || showBreak;

        const Wrapper = isParaStart ? "p" : "span";

        return (
          <Wrapper
            key={v.verse}
            data-verse={v.verse}
            className={isParaStart ? "drop-cap" : undefined}
          >
            {showBreak && <span className="block h-3" aria-hidden="true" />}
            <span
              className={`transition-colors rounded-sm ${hlClass} ${
                isSelected ? "ring-2 ring-gold/50 rounded" : ""
              }`}
            >
              {/* Verse number — tappable for actions */}
              {showVerseNumbers && (
                <button
                  type="button"
                  className="verse-number-btn"
                  aria-label={`Verse ${v.verse}, actions`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onVerseNumberTap(isSelected ? null : v.verse);
                  }}
                >
                  <sup className="verse-number-text">{v.verse}</sup>
                </button>
              )}
              {studyMode && wordsForVerse ? (
                <EnrichedText words={wordsForVerse} onWordTap={onWordTap} />
              ) : (
                <ReadText text={v.text} />
              )}
              {" "}
              {note && (
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3 h-3 inline text-gold -mt-1"
                >
                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l12.15-12.15z" />
                </svg>
              )}
            </span>
          </Wrapper>
        );
      })}
    </div>
  );
}

// Read mode — clean text, no interactivity on words
function ReadText({ text }) {
  return <span>{text}</span>;
}

// Study mode — original words tappable with underline, added words italic
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
              e.preventDefault();
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
