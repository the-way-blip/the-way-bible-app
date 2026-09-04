import { useMemo, useRef } from "react";
import { useApp } from "../../stores/AppContext";
import { detectMentions, detectMentionsInWords } from "../../services/biblePlaces";

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
  places,
  onPlaceTap,
}) {
  const { fontSize, studyMode, fontFamily, showVerseNumbers, translation } = useApp();
  // Word study data is aligned to KJV word positions — can't apply it to other translations
  const wordStudyAvailable = !translation || translation === "KJV";
  const containerRef = useRef(null);

  if (!verses || verses.length === 0) return null;

  return (
    <div ref={containerRef} onCopy={(e) => handleCopyEvent(e, containerRef.current, book, chapter)}>
      {/* Notice when study mode is on but word-study data only covers KJV */}
      {studyMode && !wordStudyAvailable && (
        <div className="mx-2 mb-2 px-3 py-2 bg-gold/10 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-gold shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[11px] text-gold leading-snug">
            Word study (Greek/Hebrew) requires KJV. Verse actions still work — tap a verse number.
          </p>
        </div>
      )}
    <div
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
              {studyMode && wordStudyAvailable && wordsForVerse ? (
                <EnrichedText
                  words={wordsForVerse}
                  onWordTap={onWordTap}
                  places={places}
                  onPlaceTap={onPlaceTap}
                />
              ) : (
                <ReadText text={v.text} places={places} onPlaceTap={onPlaceTap} />
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
    </div>
  );
}

/**
 * A place name inside the scripture text. Tapping it opens the 3D atlas.
 * Rendered as a span rather than a <button> so it can sit inside a paragraph
 * without breaking text flow, justification, or the drop cap.
 */
function PlaceMention({ place, onPlaceTap, children }) {
  const open = (event) => {
    event.stopPropagation();
    event.preventDefault();
    onPlaceTap(place);
  };
  return (
    <span
      className="place-mention"
      role="button"
      tabIndex={0}
      title={`${place.name} — open map`}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") open(event);
      }}
    >
      {children}
    </span>
  );
}

// Read mode — clean text, with detected place names linked to the atlas
function ReadText({ text, places, onPlaceTap }) {
  const segments = useMemo(
    () => (onPlaceTap ? detectMentions(text, places) : null),
    [text, places, onPlaceTap]
  );

  if (!segments) return <span>{text}</span>;

  return (
    <span>
      {segments.map((segment, i) =>
        segment.place ? (
          <PlaceMention key={i} place={segment.place} onPlaceTap={onPlaceTap}>
            {segment.text}
          </PlaceMention>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </span>
  );
}

// Study mode — original words tappable with underline, added words italic.
// Place names win over word study: their Strong's entries are just
// transliterations, and the map is the more useful thing to surface.
function EnrichedText({ words, onWordTap, places, onPlaceTap }) {
  const placeMarks = useMemo(
    () => (onPlaceTap ? detectMentionsInWords(words, places) : null),
    [words, places, onPlaceTap]
  );

  const rendered = [];
  for (let i = 0; i < words.length; i++) {
    const mark = placeMarks?.get(i);

    if (mark) {
      const phrase = words.slice(i, i + mark.length).map((w) => w.word).join(" ");
      // Trailing punctuation and the word gap stay outside the span, so the
      // pin marker sits tight against the name instead of after a comma.
      const [, name, tail] = phrase.match(/^(.*?[A-Za-z])([^A-Za-z]*)$/) || [null, phrase, ""];
      rendered.push(
        <span key={i}>
          <PlaceMention place={mark.place} onPlaceTap={onPlaceTap}>
            {name}
          </PlaceMention>
          {tail}{" "}
        </span>
      );
      i += mark.length - 1;
      continue;
    }

    const w = words[i];
    if (w.added) {
      rendered.push(
        <span key={i} className="italic text-warm-brown-light/80">
          {w.word}{" "}
        </span>
      );
      continue;
    }

    rendered.push(
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
  }

  return <>{rendered}</>;
}
