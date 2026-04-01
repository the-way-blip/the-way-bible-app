import { useState } from "react";
import topics from "../data/topicIndex";
import ShareSheet from "../components/ShareSheet";

export default function Topics() {
  const [expanded, setExpanded] = useState(null);
  const [shareData, setShareData] = useState(null);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Topics</h1>
      <p className="text-sm text-warm-brown-light mb-6">Browse key verses by topic</p>

      <div className="space-y-2">
        {topics.map((topic, i) => (
          <div key={i} className="bg-white rounded-xl border border-cream-dark overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-cream/50 transition-colors"
            >
              <span className="text-sm font-medium text-warm-brown">{topic.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-warm-brown-light">{topic.verses.length} verses</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded === i ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {expanded === i && (
              <div className="px-4 pb-3 border-t border-cream-dark pt-2 space-y-1.5">
                {topic.verses.map((ref, j) => (
                  <div key={j} className="flex items-center justify-between py-1.5">
                    <a
                      href={`/search?q=${encodeURIComponent(ref)}`}
                      className="text-xs text-gold hover:text-gold/80"
                    >
                      {ref}
                    </a>
                    <button
                      type="button"
                      onClick={() => setShareData({ content: ref, reference: ref })}
                      className="text-warm-brown-light/30 hover:text-gold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {shareData && (
        <ShareSheet content={shareData.content} reference={shareData.reference} onClose={() => setShareData(null)} />
      )}
    </div>
  );
}
