import { useState } from "react";

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
  onHighlight,
  onSaveNote,
  onDeleteNote,
  onAddMemoryVerse,
  onShare,
  onClose,
}) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(currentNote?.text || "");

  return (
    <div className="fixed bottom-20 left-2 right-2 z-40">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-cream-dark overflow-hidden">
        <div className="px-4 py-3 border-b border-cream-dark flex items-center justify-between">
          <span className="text-xs font-medium text-warm-brown-light">
            {book} {chapter}:{verse}
          </span>
          <button onClick={onClose} className="text-warm-brown-light hover:text-warm-brown">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!showNote ? (
          <div className="px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => onHighlight(verse, c.name)}
                  className={`w-7 h-7 rounded-full ${c.bg} border-2 ${
                    currentHighlight?.color === c.name ? c.border : "border-transparent"
                  } transition-transform hover:scale-110`}
                />
              ))}
            </div>

            <div className="w-px h-6 bg-cream-dark" />

            <button
              onClick={() => setShowNote(true)}
              className="p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
              title="Add note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>

            <button
              onClick={() => {
                onAddMemoryVerse(book, chapter, verse, verseText);
                onClose();
              }}
              className={`p-1.5 rounded-lg hover:bg-cream-dark transition-colors ${
                isMemoryVerse ? "text-gold" : "text-warm-brown-light hover:text-warm-brown"
              }`}
              title={isMemoryVerse ? "Already saved" : "Save to memory"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isMemoryVerse ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            <button
              onClick={onShare}
              className="p-1.5 rounded-lg hover:bg-cream-dark text-warm-brown-light hover:text-warm-brown transition-colors"
              title="Share verse"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="px-4 py-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write a note..."
              className="w-full h-24 bg-cream rounded-lg px-3 py-2 text-sm text-warm-brown placeholder-warm-brown-light/50 resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setShowNote(false)}
                className="text-sm text-warm-brown-light hover:text-warm-brown"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                {currentNote && (
                  <button
                    onClick={() => {
                      onDeleteNote(verse);
                      setShowNote(false);
                    }}
                    className="text-sm text-red-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    if (noteText.trim()) {
                      onSaveNote(verse, noteText.trim());
                    }
                    setShowNote(false);
                  }}
                  className="text-sm font-medium text-gold hover:text-gold/80"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
