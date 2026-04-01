import { Link } from "react-router-dom";
import useJournal from "../hooks/useJournal";

const MOOD_LABELS = {
  reflective: "Reflective",
  thankful: "Thankful",
  questioning: "Questioning",
  convicted: "Convicted",
  joyful: "Joyful",
  sorrowful: "Sorrowful",
};

export default function Journal() {
  const { entries, deleteEntry } = useJournal();

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-warm-brown">Journal</h1>
          <p className="text-sm text-warm-brown-light">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <Link
          to="/journal/new"
          className="bg-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          New Entry
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto text-cream-dark mb-4">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <p className="text-warm-brown-light text-sm mb-4">
            Start journaling your reflections and prayers.
          </p>
          <Link
            to="/journal/new"
            className="inline-block bg-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Write First Entry
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={`/journal/${entry.id}`}
              className="block bg-white rounded-xl p-4 border border-cream-dark hover:border-gold/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-warm-brown truncate">
                    {entry.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-warm-brown-light mt-1 line-clamp-2">
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-warm-brown-light/60">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {entry.mood && (
                      <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">
                        {MOOD_LABELS[entry.mood] || entry.mood}
                      </span>
                    )}
                    {entry.book && (
                      <span className="text-[10px] text-warm-brown-light/60">
                        {entry.book} {entry.chapter && `${entry.chapter}`}
                        {entry.verseNumber && `:${entry.verseNumber}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
