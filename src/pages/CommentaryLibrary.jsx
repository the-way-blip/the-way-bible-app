import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dbGetAll, dbPut, dbDelete } from "../hooks/useDB";

export default function CommentaryLibrary() {
  const [saved, setSaved] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadSaved(); }, []);

  async function loadSaved() {
    const all = await dbGetAll("journal");
    const commentaries = all
      .filter((e) => e.id.startsWith("commentary-"))
      .sort((a, b) => b.createdAt - a.createdAt);
    setSaved(commentaries);
  }

  async function removeCommentary(id) {
    await dbDelete("journal", id);
    loadSaved();
  }

  const authors = [...new Set(saved.map((c) => c.tags?.[1]).filter(Boolean))];
  const filtered = filter === "all"
    ? saved
    : saved.filter((c) => c.tags?.[1] === filter);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Commentary Library</h1>
      <p className="text-sm text-warm-brown-light mb-4">
        {saved.length} saved {saved.length === 1 ? "commentary" : "commentaries"}
      </p>

      {saved.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto text-cream-dark mb-4">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <p className="text-sm text-warm-brown-light mb-2">No saved commentaries yet.</p>
          <p className="text-xs text-warm-brown-light/60 mb-4">
            Open the Commentaries panel while reading, then tap the bookmark icon to save.
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
          {/* Author filter */}
          {authors.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto mb-4 scrollbar-hide">
              <button
                onClick={() => setFilter("all")}
                className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${filter === "all" ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}
              >
                All
              </button>
              {authors.map((a) => (
                <button
                  key={a}
                  onClick={() => setFilter(a)}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${filter === a ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-cream-dark p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-warm-brown">{c.tags?.[1] || "Unknown"}</p>
                    {c.tags?.[2] && (
                      <p className="text-[10px] text-warm-brown-light/60">{c.tags[2]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/read/${encodeURIComponent(c.book || "Genesis")}/${c.chapter || 1}`}
                      className="text-[10px] text-gold"
                    >
                      {c.book} {c.chapter}
                    </Link>
                    <button
                      onClick={() => removeCommentary(c.id)}
                      className="text-warm-brown-light/30 hover:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-warm-brown leading-relaxed">{c.content}</p>
                <p className="text-[10px] text-warm-brown-light/40 mt-2">
                  Saved {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Helper to save a commentary from the CommentaryPanel
export async function saveCommentary(commentary, book, chapter) {
  const { dbPut } = await import("../hooks/useDB");
  await dbPut("journal", {
    id: `commentary-${Date.now()}`,
    title: `${commentary.author} on ${commentary.verseRef || `${book} ${chapter}`}`,
    content: commentary.quote,
    book,
    chapter,
    tags: ["commentary", commentary.author, commentary.date || ""],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
