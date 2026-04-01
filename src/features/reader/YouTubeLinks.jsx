import { useState } from "react";

// Curated YouTube channels that teach Bible content
const CHANNELS = [
  { name: "The Bible Project", id: "UCVfwlh9XpX2Y_tQfjeln9QA", slug: "bibleproject" },
  { name: "David Guzik", id: "UCfSbLDnlGEh4MqMH4mDYhfA", slug: "davidguzik" },
  { name: "Through the Word", id: "UCxwBOTqrKJE0hCKYk1iXJ2g", slug: "throughtheword" },
];

export default function YouTubeLinks({ book, chapter }) {
  const [expanded, setExpanded] = useState(false);

  const searchQuery = `${book} ${chapter} Bible study`;
  const bibleProjectQuery = `${book} Bible Project`;

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          Video Teachings
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark p-3 space-y-2">
          {/* Bible Project overview */}
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(bibleProjectQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-cream rounded-lg p-3 hover:bg-cream-dark transition-colors"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-warm-brown">The Bible Project: {book}</p>
              <p className="text-[10px] text-warm-brown-light">Book overview and themes</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light/50 shrink-0">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          {/* Chapter-specific search */}
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-cream rounded-lg p-3 hover:bg-cream-dark transition-colors"
          >
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-600">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-warm-brown">{book} {chapter} — Study Videos</p>
              <p className="text-[10px] text-warm-brown-light">Sermons, lessons, and commentary</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light/50 shrink-0">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          {/* Verse-specific */}
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${book} chapter ${chapter} verse by verse`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-cream rounded-lg p-3 hover:bg-cream-dark transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-blue-600">V×V</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-warm-brown">Verse-by-Verse Teaching</p>
              <p className="text-[10px] text-warm-brown-light">In-depth chapter walkthrough</p>
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
