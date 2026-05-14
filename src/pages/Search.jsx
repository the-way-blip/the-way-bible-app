import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

let searchIndex = null;

const TOPICS = [
  { name: "Faith", query: "faith" },
  { name: "Love", query: "love" },
  { name: "Prayer", query: "pray" },
  { name: "Salvation", query: "salvation" },
  { name: "Grace", query: "grace" },
  { name: "Peace", query: "peace" },
  { name: "Hope", query: "hope" },
  { name: "Forgiveness", query: "forgive" },
  { name: "Wisdom", query: "wisdom" },
  { name: "Strength", query: "strength" },
  { name: "Joy", query: "joy" },
  { name: "Mercy", query: "mercy" },
];

function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem("searchHistory") || "[]");
  } catch { return []; }
}

function addToHistory(query) {
  const history = getSearchHistory().filter((h) => h !== query);
  history.unshift(query);
  localStorage.setItem("searchHistory", JSON.stringify(history.slice(0, 10)));
}

export default function Search() {
  useDocumentTitle("Search Scripture");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchType, setSearchType] = useState("reference");
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  const history = getSearchHistory();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowHistory(false);
    addToHistory(query.trim());

    if (searchType === "keyword") {
      await keywordSearch(query.trim());
    } else {
      await referenceSearch(query.trim());
    }
    setLoading(false);
  };

  const doTopicSearch = async (topicQuery) => {
    setQuery(topicQuery);
    setSearchType("keyword");
    setLoading(true);
    setSearched(true);
    setShowHistory(false);
    addToHistory(topicQuery);
    await keywordSearch(topicQuery);
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
            text: entry.t,
            query: q,
          });
          if (found.length >= 50) break;
        }
      }
      setResults(found);
    } catch { setResults([]); }
  };

  return (
    <div className="flex max-w-6xl mx-auto">
      {/* ─── Main search column ─── */}
      <div className="flex-1 min-w-0 px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-warm-brown mb-4">Search Scripture</h1>

        {/* Search type toggle */}
        <div className="flex gap-2 mb-3">
          {["reference", "keyword", "topic"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { setSearchType(type); setSearched(false); setResults([]); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${searchType === type ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}
            >
              {type === "reference" ? "Verse Reference" : type === "keyword" ? "Keyword" : "Topics"}
            </button>
          ))}
        </div>

        {searchType !== "topic" && (
          <form onSubmit={handleSearch} className="flex gap-2 mb-6 relative">
            <div className="flex-1 relative">
              <label className="sr-only" htmlFor="search-input">
                {searchType === "reference" ? "e.g. John 3:16, Psalm 23" : "e.g. faith, love, redemption"}
              </label>
              <input
                id="search-input"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                placeholder={searchType === "reference" ? "e.g. John 3:16, Psalm 23" : "e.g. faith, love, redemption"}
                className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              {showHistory && history.length > 0 && !searched && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-cream-dark rounded-xl shadow-lg z-20 py-1">
                  <p className="px-3 py-1 text-[10px] text-warm-brown-light uppercase tracking-wider">Recent</p>
                  {history.map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setQuery(h); setShowHistory(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-warm-brown hover:bg-cream transition-colors flex items-center gap-2"
                    >
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-warm-brown-light/50 shrink-0">
                        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} className="bg-gold text-white rounded-xl px-4 py-3 hover:bg-gold/90 disabled:opacity-50 transition-colors">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        )}

        {/* Topics grid */}
        {searchType === "topic" && !searched && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {TOPICS.map((topic) => (
              <button
                key={topic.name}
                type="button"
                onClick={() => doTopicSearch(topic.query)}
                className="bg-white border border-cream-dark rounded-xl px-3 py-3 text-sm text-warm-brown hover:border-gold/30 hover:bg-gold/5 transition-colors text-center"
              >
                {topic.name}
              </button>
            ))}
          </div>
        )}

        {/* Quick links */}
        {searchType === "reference" && !searched && (
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

        <div aria-live="polite" aria-atomic="true">
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2" role="status">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-warm-brown-light">
              {searchType === "keyword" || searchType === "topic" ? "Searching all 66 books..." : "Looking up verse..."}
            </span>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <p className="text-sm text-warm-brown-light text-center py-8">No results found.</p>
        )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-warm-brown-light mb-2" aria-live="polite">{results.length} result{results.length !== 1 ? "s" : ""}</p>
            {results.map((r, i) => (
              <Link key={i} to={`/read/${encodeURIComponent(r.book)}/${r.chapter}`} className="block bg-white border border-cream-dark rounded-xl p-4 hover:border-gold/30 transition-colors">
                <p className="text-xs font-medium text-gold mb-1">{r.ref}</p>
                <p className="font-scripture text-sm text-warm-brown leading-relaxed">
                  <HighlightedText text={r.text} query={r.query} />
                </p>
              </Link>
            ))}
            {results.length >= 50 && (
              <p className="text-xs text-warm-brown-light text-center py-2">Showing first 50 results</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function HighlightedText({ text, query }) {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-gold/20 text-warm-brown rounded-sm px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}
