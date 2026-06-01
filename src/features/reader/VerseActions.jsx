import { useState, useEffect, useRef } from "react";
import { useToast } from "../../components/Toast";
import { hapticTap } from "../../utils/native";
import useT from "../../hooks/useT";

const COLORS = [
  { name: "yellow", bg: "bg-highlight-yellow", border: "border-yellow-400" },
  { name: "green", bg: "bg-highlight-green", border: "border-green-400" },
  { name: "blue", bg: "bg-highlight-blue", border: "border-blue-400" },
  { name: "pink", bg: "bg-highlight-pink", border: "border-pink-400" },
];

export default function VerseActions({
  verse,
  verseText,
  book,
  chapter,
  currentHighlight,
  currentNote,
  isMemoryVerse,
  isBookmarkedVerse,
  onHighlight,
  onSaveNote,
  onDeleteNote,
  onAddMemoryVerse,
  onToggleBookmark,
  onAddToJournal,
  onShare,
  onClose,
}) {
  const showToast = useToast();
  const t = useT();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(currentNote?.text || "");
  const [visible, setVisible] = useState(false);
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
            {/* Top row: highlight colors */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    onHighlight(verse, c.name);
                    hapticTap();
                    showToast(t("verse.highlightApplied"));
                  }}
                  className={`w-8 h-8 rounded-full ${c.bg} border-2 ${
                    currentHighlight?.color === c.name ? c.border : "border-transparent"
                  } transition-transform hover:scale-110`}
                />
              ))}
              {currentHighlight && (
                <button
                  onClick={() => {
                    onHighlight(verse, null);
                    showToast(t("verse.highlightRemoved"));
                  }}
                  className="w-6 h-6 rounded-full border border-cream-dark flex items-center justify-center text-warm-brown-light hover:text-warm-brown hover:border-warm-brown-light transition-colors ml-1"
                  title={t("verse.clearHighlight")}
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

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
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t("verse.writeNote")}
              className="w-full h-24 bg-cream rounded-lg px-3 py-2 text-sm text-warm-brown placeholder-warm-brown-light/50 resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
              autoFocus
            />
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
                      onDeleteNote(verse);
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
                      onSaveNote(verse, noteText.trim());
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
