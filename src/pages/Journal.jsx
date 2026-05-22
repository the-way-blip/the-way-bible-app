import { useState } from "react";
import { Link } from "react-router-dom";
import useJournal from "../hooks/useJournal";
import SkeletonList from "../components/SkeletonList";
import useDocumentTitle from "../hooks/useDocumentTitle";

const MOOD_LABELS = {
  reflective: "Reflective",
  thankful: "Thankful",
  questioning: "Questioning",
  convicted: "Convicted",
  joyful: "Joyful",
  sorrowful: "Sorrowful",
};

const MOOD_COLORS = {
  reflective: "bg-blue-100 text-blue-700",
  thankful: "bg-green-100 text-green-700",
  questioning: "bg-purple-100 text-purple-700",
  convicted: "bg-orange-100 text-orange-700",
  joyful: "bg-yellow-100 text-yellow-700",
  sorrowful: "bg-gray-100 text-gray-600",
};

export default function Journal() {
  useDocumentTitle("Journal");
  const { entries, loading, deleteEntry } = useJournal();
  const [moodFilter, setMoodFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [view, setView] = useState("list"); // "list" | "calendar"

  // Filter entries
  const filtered = entries.filter((e) => {
    if (moodFilter && e.mood !== moodFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = (e.title || "").toLowerCase().includes(q);
      const matchContent = (e.content || "").toLowerCase().includes(q);
      const matchBook = (e.book || "").toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchBook) return false;
    }
    return true;
  });

  // Mood summary counts
  const moodCounts = {};
  entries.forEach((e) => {
    if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  // Calendar data — group by date
  const byDate = {};
  entries.forEach((e) => {
    const d = new Date(e.createdAt).toISOString().split("T")[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });

  const handleDelete = async (id) => {
    await deleteEntry(id);
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-warm-brown">Journal</h1>
          <p className="text-sm text-warm-brown-light">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <Link
          to="/journal/new"
          className="bg-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Entry
        </Link>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-brown-light/40">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search journal entries..."
              className="w-full bg-white rounded-xl border border-cream-dark pl-10 pr-4 py-2.5 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:border-gold/30"
            />
          </div>

          {/* Mood filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
            <button
              onClick={() => setMoodFilter(null)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
                !moodFilter ? "bg-gold text-white" : "bg-white border border-cream-dark text-warm-brown-light"
              }`}
            >
              All ({entries.length})
            </button>
            {Object.entries(moodCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([mood, count]) => (
                <button
                  key={mood}
                  onClick={() => setMoodFilter(moodFilter === mood ? null : mood)}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
                    moodFilter === mood ? "bg-gold text-white" : `${MOOD_COLORS[mood] || "bg-cream text-warm-brown-light"}`
                  }`}
                >
                  {MOOD_LABELS[mood] || mood} ({count})
                </button>
              ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-warm-brown-light/60">
              {filtered.length === entries.length ? "" : `${filtered.length} of ${entries.length} shown`}
            </p>
            <div className="flex bg-cream rounded-lg p-0.5">
              <button
                onClick={() => setView("list")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${view === "list" ? "bg-white text-warm-brown shadow-sm" : "text-warm-brown-light"}`}
              >
                List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${view === "calendar" ? "bg-white text-warm-brown shadow-sm" : "text-warm-brown-light"}`}
              >
                Calendar
              </button>
            </div>
          </div>

          {view === "list" ? (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl border border-cream-dark overflow-hidden hover:border-gold/30 transition-colors">
                  <Link to={`/journal/${entry.id}`} className="block p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-warm-brown truncate">
                          {entry.title || "Untitled"}
                        </h3>
                        <p className="text-xs text-warm-brown-light mt-1 line-clamp-2">
                          {entry.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] text-warm-brown-light/60">
                            {new Date(entry.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {entry.mood && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${MOOD_COLORS[entry.mood] || "bg-cream text-warm-brown-light"}`}>
                              {MOOD_LABELS[entry.mood] || entry.mood}
                            </span>
                          )}
                          {entry.book && (
                            <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">
                              {entry.book} {entry.chapter && entry.chapter}{entry.verseNumber && `:${entry.verseNumber}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="border-t border-cream-dark px-4 py-2 flex justify-end">
                    <button
                      onClick={() => setConfirmDelete(entry.id)}
                      className="text-[10px] text-red-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-warm-brown-light py-8">No entries match your filter.</p>
              )}
            </div>
          ) : (
            <CalendarView byDate={byDate} />
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl max-w-xs w-full">
              <h3 className="text-warm-brown font-semibold mb-2">Delete Entry?</h3>
              <p className="text-sm text-warm-brown-light mb-4">This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm border border-cream-dark text-warm-brown-light hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CalendarView({ byDate }) {
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;

  const d = new Date(year, month, 1);
  const currentMonth = d.getMonth();
  const currentYear = d.getFullYear();
  const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="bg-white rounded-xl border border-cream-dark p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOffset(offset - 1)} className="text-warm-brown-light hover:text-warm-brown p-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-medium text-warm-brown">{monthName}</span>
        <button onClick={() => setOffset(offset + 1)} className="text-warm-brown-light hover:text-warm-brown p-1" disabled={offset >= 0}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-warm-brown-light/60 font-medium py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEntries = byDate[dateStr];
          const hasEntries = dayEntries?.length > 0;

          return (
            <div
              key={i}
              className={`relative aspect-square flex items-center justify-center rounded-lg text-xs transition-colors ${
                hasEntries ? "bg-gold/10 text-gold font-medium" : "text-warm-brown-light"
              }`}
              title={hasEntries ? `${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"}` : undefined}
            >
              {day}
              {hasEntries && (
                <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                  {dayEntries.slice(0, 3).map((_, j) => (
                    <div key={j} className="w-1 h-1 bg-gold rounded-full" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gold">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <h2 className="font-serif text-xl font-bold text-warm-brown mb-2">What is God showing you?</h2>
      <p className="text-warm-brown-light text-sm mb-1 max-w-xs mx-auto leading-relaxed">
        Capture reflections, questions, prayers, and insights as you read. Your journal lives with the Word it came from — searchable, yours forever.
      </p>
      <p className="text-xs text-warm-brown-light/70 mb-6 max-w-xs mx-auto">
        Most journals get lost in a drawer. This one stays with you.
      </p>
      <Link
        to="/journal/new"
        className="inline-block bg-gold text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20"
      >
        Write your first entry
      </Link>
    </div>
  );
}
