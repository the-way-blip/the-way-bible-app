import { useState } from "react";
import { Link } from "react-router-dom";
import useMemoryVerses from "../hooks/useMemoryVerses";
import ShareSheet from "../components/ShareSheet";

export default function MemoryVerses() {
  const { verses, removeVerse } = useMemoryVerses();
  const [shareData, setShareData] = useState(null);

  const learning = verses.filter((v) => v.status === "learning");
  const mastered = verses.filter((v) => v.status !== "learning");

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-warm-brown mb-1">Memory Verses</h1>
          <p className="text-sm text-warm-brown-light">
            {verses.length} {verses.length === 1 ? "verse" : "verses"} saved
          </p>
        </div>
        {verses.length > 0 && (
          <Link
            to="/memory/practice"
            className="bg-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Practice
          </Link>
        )}
      </div>

      {verses.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto text-cream-dark mb-4">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <p className="text-warm-brown-light text-sm mb-4">
            No memory verses yet. Tap a verse while reading to save it.
          </p>
          <Link
            to="/read/Genesis/1"
            className="inline-block bg-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Start Reading
          </Link>
        </div>
      ) : (
        <>
          {learning.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">
                Learning ({learning.length})
              </h2>
              <div className="space-y-2">
                {learning.map((v) => (
                  <VerseCard key={v.id} verse={v} onRemove={removeVerse} onShare={(v) => setShareData({ content: v.text, reference: `${v.book} ${v.chapter}:${v.verseNumber}` })} />
                ))}
              </div>
            </div>
          )}

          {mastered.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">
                Mastered ({mastered.length})
              </h2>
              <div className="space-y-2">
                {mastered.map((v) => (
                  <VerseCard key={v.id} verse={v} onRemove={removeVerse} onShare={(v) => setShareData({ content: v.text, reference: `${v.book} ${v.chapter}:${v.verseNumber}` })} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {shareData && (
        <ShareSheet content={shareData.content} reference={shareData.reference} onClose={() => setShareData(null)} />
      )}
    </div>
  );
}

function VerseCard({ verse, onRemove, onShare }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-cream-dark">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gold mb-1">
            {verse.book} {verse.chapter}:{verse.verseNumber}
          </p>
          <p className="font-scripture text-sm text-warm-brown leading-relaxed line-clamp-3">
            {verse.text}
          </p>
        </div>
        <button
          onClick={() => onRemove(verse.id)}
          className="text-warm-brown-light/50 hover:text-red-400 transition-colors shrink-0 mt-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Link
          to={`/read/${encodeURIComponent(verse.book)}/${verse.chapter}`}
          className="text-xs text-warm-brown-light hover:text-gold"
        >
          Read in context
        </Link>
        <button
          onClick={() => onShare(verse)}
          className="text-xs text-warm-brown-light/50 hover:text-gold flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}
