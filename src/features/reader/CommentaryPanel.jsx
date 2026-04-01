import { useState, useEffect } from "react";
import { fetchCommentaries, getBibleHubUrl } from "../../services/commentaryService";

export default function CommentaryPanel({ book, chapter }) {
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  const handleLoad = async () => {
    if (commentaries.length > 0) {
      setExpanded(!expanded);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await fetchCommentaries(book, chapter);
      setCommentaries(results);
      setExpanded(true);
    } catch (err) {
      setError("Failed to load commentaries");
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (i) => {
    setExpandedCards((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const bibleHubUrl = getBibleHubUrl(book, chapter, 1);

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={handleLoad}
        disabled={loading}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {loading ? "Loading commentaries..." : "Commentaries"}
          {commentaries.length > 0 && (
            <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">
              {commentaries.length}
            </span>
          )}
        </span>
        {loading ? (
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}

      {expanded && (
        <div className="mt-2 space-y-2">
          {commentaries.length === 0 && !loading && (
            <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
              <p className="text-sm text-warm-brown-light mb-2">
                No commentaries loaded for this chapter.
              </p>
              {bibleHubUrl && (
                <a
                  href={bibleHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:text-gold/80"
                >
                  View commentaries on BibleHub
                </a>
              )}
            </div>
          )}

          {commentaries.map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-cream-dark overflow-hidden">
              <button
                onClick={() => toggleCard(i)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-cream/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-warm-brown">
                      {c.author}
                    </span>
                    {c.date && (
                      <span className="text-[10px] bg-cream-dark text-warm-brown-light px-1.5 py-0.5 rounded-full">
                        {c.date}
                      </span>
                    )}
                  </div>
                  {c.verseRef && (
                    <p className="text-[11px] text-gold mt-0.5">{c.verseRef}</p>
                  )}
                  {!expandedCards[i] && (
                    <p className="text-xs text-warm-brown-light mt-1 line-clamp-2">
                      {c.quote}
                    </p>
                  )}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light shrink-0 mt-1 transition-transform ${expandedCards[i] ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedCards[i] && (
                <div className="px-4 pb-4 border-t border-cream-dark pt-3">
                  <p className="text-sm text-warm-brown leading-relaxed whitespace-pre-line">
                    {c.quote}
                  </p>
                  {c.source && (
                    <p className="text-[10px] text-warm-brown-light/60 mt-2 italic">
                      Source: {c.source}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* BibleHub link */}
          {bibleHubUrl && commentaries.length > 0 && (
            <a
              href={bibleHubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-warm-brown-light hover:text-gold py-2"
            >
              More commentaries on BibleHub
            </a>
          )}
        </div>
      )}
    </div>
  );
}
