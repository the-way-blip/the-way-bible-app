import { useState, useEffect, useRef } from "react";
import { useToast } from "../../components/Toast";
import { hapticTap } from "../../utils/native";
import { Link } from "react-router-dom";
import useT from "../../hooks/useT";
import useHighlightLabels from "../../hooks/useHighlightLabels";
import { HIGHLIGHT_COLORS, HIGHLIGHT_STYLES } from "../../utils/highlights";

const STYLE_LABEL = { fill: "Fill", underline: "Underline", dashed: "Dashed", dotted: "Dotted" };

/** A tiny preview of each highlight style for the style picker. */
function StyleSample({ style }) {
  if (style === "fill") return <span className="px-1 rounded-sm bg-highlight-yellow">Aa</span>;
  return <span style={{ textDecorationLine: "underline", textDecorationStyle: style === "underline" ? "solid" : style, textDecorationThickness: "2px", textUnderlineOffset: "3px", textDecorationColor: "#d4a514" }}>Aa</span>;
}

export default function VerseActions({
  verse,
  verseText,
  book,
  chapter,
  currentHighlight,
  currentNote,
  verseCount,
  isMemoryVerse,
  isBookmarkedVerse,
  onHighlight,
  onSaveNote,
  onDeleteNote,
  onAddMemoryVerse,
  onToggleBookmark,
  onAddToJournal,
  onShare,
  onCommentary,
  onPlayFromHere,
  onClose,
}) {
  const showToast = useToast();
  const t = useT();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(currentNote?.text || "");
  // A range note opened from any of its verses is saved under its first verse.
  const noteStart = currentNote?.verseNumber || verse;
  const [noteEnd, setNoteEnd] = useState(currentNote?.verseEnd || noteStart);
  const [visible, setVisible] = useState(false);
  const labels = useHighlightLabels();
  const [style, setStyle] = useState(currentHighlight?.style || "fill");
  const panelRef = useRef(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close if clicking a verse number button
        if (e.target.closest(".verse-number-btn")) return;
        onClose();
      }
    };
    // Use a short delay so the opening click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("touchstart", handleClick, { passive: true });
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [onClose]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 left-1 right-1 z-40" ref={panelRef}>
      <div
        className={`max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-cream-dark overflow-hidden transition-all duration-300 ease-out ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-cream-dark flex items-center justify-between">
          <span className="text-xs font-medium text-warm-brown-light">
            {book} {chapter}:{verse}
          </span>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-warm-brown-light hover:text-warm-brown rounded-full hover:bg-cream-dark transition-colors"
            aria-label={t("general.close")}
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!showNote ? (
          <div>
            {/* Top row: highlight colours (with the reader's names for them) */}
            <div className="px-4 pt-3 pb-1 flex items-start justify-center gap-3">
              {HIGHLIGHT_COLORS.map((c) => {
                const active = currentHighlight?.color === c.name;
                return (
                  <div key={c.name} className="flex flex-col items-center w-14">
                    <button
                      aria-label={`Highlight ${labels[c.name] || c.name}`}
                      aria-pressed={active}
                      onClick={() => {
                        onHighlight(verse, c.name, style);
                        hapticTap();
                        showToast(t("verse.highlightApplied"));
                      }}
                      className={`w-11 h-11 rounded-full ${c.fill} border-2 ${active ? c.ring : "border-transparent"} transition-transform hover:scale-110`}
                    />
                    {labels[c.name] && <span className="mt-1 text-[10px] leading-tight text-warm-brown-light text-center truncate w-full">{labels[c.name]}</span>}
                  </div>
                );
              })}
              {currentHighlight && (
                <button
                  onClick={() => {
                    onHighlight(verse, null);
                    showToast(t("verse.highlightRemoved"));
                  }}
                  className="w-6 h-6 mt-2.5 rounded-full border border-cream-dark flex items-center justify-center text-warm-brown-light hover:text-warm-brown hover:border-warm-brown-light transition-colors"
                  title={t("verse.clearHighlight")}
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            {/* Style: fill or one of three underlines. Changing it restyles the current highlight. */}
            <div className="px-4 pb-2 flex items-center justify-center gap-1.5" role="radiogroup" aria-label={t("verse.highlightStyle", "Highlight style")}>
              {HIGHLIGHT_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={style === s}
                  onClick={() => {
                    setStyle(s);
                    if (currentHighlight && (currentHighlight.style || "fill") !== s) onHighlight(verse, currentHighlight.color, s);
                  }}
                  className={`min-h-[36px] px-2.5 rounded-full text-[11px] flex items-center gap-1.5 border ${style === s ? "border-gold text-warm-brown bg-gold/10" : "border-cream-dark text-warm-brown-light"}`}
                >
                  <StyleSample style={s} /> {t(`verse.style.${s}`, STYLE_LABEL[s])}
                </button>
              ))}
            </div>
            <p className="text-center pb-2">
              <Link to="/settings#highlight-names" onClick={onClose} className="text-[11px] text-gold">
                {Object.keys(labels).length ? t("verse.editColourNames", "Edit colour names") : t("verse.nameColours", "Name your colours")}
              </Link>
            </p>

            {/* Divider */}
            <div className="mx-4 border-t border-cream-dark" />

            {/* Bottom row: action icons with labels */}
            <div className="px-4 pt-2 pb-3 flex items-start justify-around">
              {/* Note */}
              <button
                onClick={() => setShowNote(true)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
                title={t("verse.addNote")}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span className="text-[9px] leading-none">{t("verse.note")}</span>
              </button>

              {/* Memory / Save */}
              <button
                onClick={() => {
                  if (!isMemoryVerse) {
                    onAddMemoryVerse(book, chapter, verse, verseText);
                    hapticTap();
                    showToast(t("verse.savedToMemory"));
                  }
                  onClose();
                }}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark transition-colors ${
                  isMemoryVerse ? "text-gold" : "text-warm-brown-light hover:text-warm-brown"
                }`}
                title={isMemoryVerse ? t("verse.alreadySaved") : t("verse.saveToMemory")}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isMemoryVerse ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-[9px] leading-none">{t("verse.memorize")}</span>
              </button>

              {/* Bookmark / Mark */}
              <button
                onClick={onToggleBookmark}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark transition-colors ${
                  isBookmarkedVerse ? "text-gold" : "text-warm-brown-light hover:text-warm-brown"
                }`}
                title={isBookmarkedVerse ? t("verse.removeHighlight") : t("verse.bookmark")}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isBookmarkedVerse ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-[9px] leading-none">{t("verse.bookmark")}</span>
              </button>

              {/* Journal */}
              <button
                onClick={onAddToJournal}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
                title={t("verse.journal")}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <span className="text-[9px] leading-none">{t("verse.journal")}</span>
              </button>

              {/* Copy verse + reference */}
              <button
                onClick={async () => {
                  const reference = `${book} ${chapter}:${verse}`;
                  const formatted = `"${verseText}"\n— ${reference} (KJV)`;
                  try {
                    await navigator.clipboard.writeText(formatted);
                  } catch {
                    // execCommand fallback for older WebViews
                    const ta = document.createElement("textarea");
                    ta.value = formatted;
                    ta.style.position = "fixed";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                  }
                  hapticTap();
                  showToast(t("verse.copiedWithRef"));
                  onClose();
                }}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
                title={t("verse.copy")}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span className="text-[9px] leading-none">{t("verse.copy")}</span>
              </button>

              {/* Listen from this verse */}
              {onPlayFromHere && (
                <button
                  onClick={onPlayFromHere}
                  className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
                  title="Listen from here"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                  </svg>
                  <span className="text-[9px] leading-none">Listen</span>
                </button>
              )}

              {/* Commentary (phones — tablets/desktop have the study panel) */}
              {onCommentary && (
                <button
                  onClick={onCommentary}
                  className="md:hidden flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
                  title={t("verse.commentary", "Commentary")}
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span className="text-[9px] leading-none">{t("verse.commentary", "Commentary")}</span>
                </button>
              )}

              {/* Share */}
              <button
                onClick={onShare}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
                title={t("verse.share")}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span className="text-[9px] leading-none">{t("verse.share")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            {verseCount > noteStart && (
              <label className="flex items-center gap-2 mb-2 text-xs text-warm-brown-light">
                {t("verse.noteCovers", "Note on")} {book} {chapter}:{noteStart}
                <span aria-hidden="true">–</span>
                <select
                  value={noteEnd}
                  onChange={(e) => setNoteEnd(Number(e.target.value))}
                  aria-label={t("verse.noteThrough", "Through verse")}
                  className="bg-cream rounded-md px-2 py-1 text-[16px] text-warm-brown focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  {Array.from({ length: verseCount - noteStart + 1 }, (_, i) => noteStart + i).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            )}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t("verse.writeNote")}
              className="w-full h-28 bg-cream rounded-lg px-3 py-2 text-[16px] text-warm-brown placeholder-warm-brown-light/50 resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
              autoFocus
            />
            <p className="text-[10px] text-warm-brown-light/70 mt-1">{t("verse.noteFormatting", "**bold**, *italic*, “- ” for a list, “> ” to quote. References like John 3:16 become links.")}</p>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setShowNote(false)}
                className="text-sm text-warm-brown-light hover:text-warm-brown"
              >
                {t("verse.cancel")}
              </button>
              <div className="flex gap-2">
                {currentNote && (
                  <button
                    onClick={() => {
                      onDeleteNote(noteStart);
                      showToast(t("verse.noteDeleted"));
                      setShowNote(false);
                    }}
                    className="text-sm text-red-400 hover:text-red-500"
                  >
                    {t("verse.delete")}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (noteText.trim()) {
                      onSaveNote(noteStart, noteText.trim(), currentNote?.tags || [], noteEnd);
                      showToast(t("verse.noteSaved"));
                    }
                    setShowNote(false);
                  }}
                  className="text-sm font-medium text-gold hover:text-gold/80"
                >
                  {t("verse.save")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
