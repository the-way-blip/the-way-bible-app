import { useState } from "react";
import { getChapterOutline } from "../../data/chapterOutlines";

export default function ChapterOutline({ book, chapter }) {
  const [open, setOpen] = useState(false);
  const outline = getChapterOutline(book, chapter);

  if (!outline) return null;

  return (
    <div className="mx-4 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Chapter Outline
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 bg-white rounded-lg border border-cream-dark overflow-hidden">
          {outline.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                const verseEl = document.querySelector(`.verse-number`);
                // Find the verse number element and scroll to it
                const allNums = document.querySelectorAll('.verse-number');
                for (const el of allNums) {
                  if (el.textContent === String(item.verse)) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    break;
                  }
                }
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-cream transition-colors border-b border-cream-dark last:border-b-0"
            >
              <span className="text-xs font-mono text-gold w-6 text-right shrink-0">
                v{item.verse}
              </span>
              <span className="text-xs text-warm-brown">{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
