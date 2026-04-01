import { useState } from "react";
import { Link } from "react-router-dom";
import { getParallelPassages } from "../../data/parallelPassages";

export default function ParallelPassages({ book, chapter }) {
  const [expanded, setExpanded] = useState(false);
  const parallels = getParallelPassages(book, chapter);

  if (parallels.length === 0) return null;

  return (
    <div className="mx-4 mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Parallel Passages
          <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">{parallels.length}</span>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark overflow-hidden divide-y divide-cream-dark">
          {parallels.map((p, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-xs font-semibold text-warm-brown mb-2">{p.title}</p>
              <div className="flex flex-wrap gap-2">
                {p.passages.map((pp, j) => (
                  <Link
                    key={j}
                    to={`/read/${encodeURIComponent(pp.book)}/${pp.chapter}`}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                      pp.book === book && pp.chapter === chapter
                        ? "bg-gold text-white"
                        : "bg-cream text-warm-brown hover:bg-cream-dark"
                    }`}
                  >
                    {pp.book} {pp.chapter}:{pp.verses}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
