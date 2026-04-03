import { useState } from "react";
import { Link } from "react-router-dom";

let searchIndex = null;

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchType, setSearchType] = useState("reference"); // "reference" or "keyword"

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    if (searchType === "keyword") {
      await keywordSearch(query.trim());
    } else {
      await referenceSearch(query.trim());
    }
    setLoading(false);
  };

  const referenceSearch = async (q) => {
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(q)}?translation=kjv`);
      if (res.ok) {
        const data = await res.json();
        if (data.verses) {
          setResults(data.verses.map((v) => ({
            ref: `${v.book_name} ${v.chapter}:${v.verse}`,
            book: v.book_name, chapter: v.chapter, verse: v.verse,
            text: v.text.trim(),
          })));
        } else setResults([]);
      } else setResults([]);
    } catch { setResults([]); }
  };

  const keywordSearch = async (q) => {
    try {
      if (!searchIndex) {
        const res = await fetch("/data/search-index.json");
        searchIndex = await res.json();
      }
      const lowerQ = q.toLowerCase();
      const found = [];
      for (const entry of searchIndex) {
        if (entry.t.toLowerCase().includes(lowerQ)) {
          found.push({
            ref: entry.r,
            book: entry.b,
            chapter: entry.c,
            verse: entry.v,
            text: highlightMatch(entry.t, q),
            rawText: entry.t,
          });
          if (found.length >= 50) break;
        }
      }
      setResults(found);
    } catch { setResults([]); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-brown mb-4">Search Scripture</h1>

      {/* Search type toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setSearchType("reference")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${searchType === "reference" ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}
        >
          Verse Reference
        </button>
        <button
          type="button"
          onClick={() => setSearchType("keyword")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${searchType === "keyword" ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}
        >
          Keyword Search
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === "reference" ? "e.g. John 3:16, Psalm 23" : "e.g. faith, love, redemption"}
          className="flex-1 bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <button type="submit" disabled={loading} className="bg-gold text-white rounded-xl px-4 py-3 hover:bg-gold/90 disabled:opacity-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>

      {/* Quick links */}
      {!searched && (
        <div className="space-y-2">
          <p className="text-xs text-warm-brown-light uppercase tracking-wider mb-2">Popular</p>
          {["John 3:16", "Psalm 23", "Romans 8:28", "Philippians 4:13", "Proverbs 3:5-6", "Isaiah 41:10"].map((ref) => (
            <button
              key={ref}
              type="button"
              onClick={() => { setQuery(ref); setSearchType("reference"); }}
              className="block w-full text-left bg-white border border-cream-dark rounded-lg px-4 py-2.5 text-sm text-warm-brown hover:border-gold/30 transition-colors"
            >
              {ref}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-warm-brown-light">
            {searchType === "keyword" ? "Searching all 66 books..." : "Looking up verse..."}
          </span>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-warm-brown-light text-center py-8">No results found.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-warm-brown-light mb-2">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((r, i) => (
            <Link
              key={i}
              to={`/read/${encodeURIComponent(r.book)}/${r.chapter}`}
              className="block bg-white border border-cream-dark rounded-xl p-4 hover:border-gold/30 transition-colors"
            >
              <p className="text-xs font-medium text-gold mb-1">{r.ref}</p>
              <p className="font-scripture text-sm text-warm-brown leading-relaxed">
                {typeof r.text === "string" ? r.text : r.rawText}
              </p>
            </Link>
          ))}
          {results.length >= 50 && (
            <p className="text-xs text-warm-brown-light text-center py-2">Showing first 50 results</p>
          )}
        </div>
      )}
    </div>
  );
}

function highlightMatch(text, query) {
  // Return text as-is for now (could add HTML highlighting later)
  return text.length > 150 ? text.substring(0, 150) + "..." : text;
}
