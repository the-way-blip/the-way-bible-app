import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bibleBooks from "../../data/bibleBooks";

export default function ChapterNav({ currentBook, currentChapter, onClose }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [tab, setTab] = useState("OT");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const searchLower = search.toLowerCase().trim();
  const filteredBooks = searchLower
    ? bibleBooks.filter((b) => b.name.toLowerCase().includes(searchLower))
    : bibleBooks.filter((b) => b.testament === tab);

  if (selectedBook) {
    const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    return (
      <div className="fixed inset-0 bg-cream z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedBook(null)}
              className="text-warm-brown-light hover:text-warm-brown flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Books
            </button>
            <button onClick={onClose} className="p-2 text-warm-brown-light hover:text-warm-brown">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <h2 className="text-lg font-semibold text-warm-brown mb-3">{selectedBook.name}</h2>
          <div className="grid grid-cols-6 gap-2">
            {chapters.map((ch) => (
              <button
                key={ch}
                onClick={() => {
                  navigate(`/read/${encodeURIComponent(selectedBook.name)}/${ch}`);
                  onClose();
                }}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  selectedBook.name === currentBook && ch === currentChapter
                    ? "bg-gold text-white"
                    : "bg-cream-dark text-warm-brown hover:bg-gold-light"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-cream z-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-warm-brown">Select Book</h2>
          <button onClick={onClose} className="p-2 text-warm-brown-light hover:text-warm-brown">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search books..."
          aria-label="Search books"
          className="w-full bg-white border border-cream-dark rounded-lg px-3 py-2.5 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-3"
        />

        {!searchLower && (
          <div className="flex gap-2 mb-4">
            {["OT", "NT"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-gold text-white"
                    : "bg-cream-dark text-warm-brown hover:bg-gold-light"
                }`}
              >
                {t === "OT" ? "Old Testament" : "New Testament"}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {filteredBooks.map((book) => (
            <button
              key={book.name}
              onClick={() => setSelectedBook(book)}
              className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                book.name === currentBook
                  ? "bg-gold/10 text-gold font-medium border border-gold/30"
                  : "bg-white text-warm-brown hover:bg-cream-dark"
              }`}
            >
              {book.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
