import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import bibleBooks from "../data/bibleBooks";

export default function Progress() {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("readingProgress") || "{}");
      setProgress(p);
    } catch {}
  }, []);

  const completed = progress.completedChapters || {};
  const totalChapters = bibleBooks.reduce((sum, b) => sum + b.chapters, 0);
  const totalRead = Object.values(completed).reduce((sum, chs) => sum + chs.length, 0);
  const percentage = totalChapters > 0 ? Math.round((totalRead / totalChapters) * 100) : 0;

  const otBooks = bibleBooks.filter((b) => b.testament === "OT");
  const ntBooks = bibleBooks.filter((b) => b.testament === "NT");

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Reading Progress</h1>
      <p className="text-sm text-warm-brown-light mb-6">
        {totalRead} of {totalChapters} chapters ({percentage}%)
      </p>

      {/* Overall progress bar */}
      <div className="bg-white rounded-2xl p-4 border border-cream-dark mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-warm-brown">Overall</span>
          <span className="text-sm text-gold font-semibold">{percentage}%</span>
        </div>
        <div className="h-3 bg-cream-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {progress.streak > 0 && (
          <p className="text-xs text-warm-brown-light mt-2">
            {progress.streak} day reading streak
          </p>
        )}
      </div>

      {/* Old Testament */}
      <BookSection title="Old Testament" books={otBooks} completed={completed} />

      {/* New Testament */}
      <BookSection title="New Testament" books={ntBooks} completed={completed} />
    </div>
  );
}

function BookSection({ title, books, completed }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-2">
        {books.map((book) => {
          const readChapters = completed[book.name] || [];
          const pct = Math.round((readChapters.length / book.chapters) * 100);

          return (
            <Link
              key={book.name}
              to={`/read/${encodeURIComponent(book.name)}/1`}
              className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-cream-dark hover:border-gold/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-brown truncate">{book.name}</span>
                  <span className="text-[10px] text-warm-brown-light ml-2">
                    {readChapters.length}/{book.chapters}
                  </span>
                </div>
                <div className="h-1.5 bg-cream-dark rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
