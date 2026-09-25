import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getDictionaryEntry, suggestHeadwords, DICTIONARIES } from "../services/libraryService";
import { linkifyRefs } from "../components/RefText";

const STARTERS = ["Abraham", "Covenant", "Faith", "Grace", "Jerusalem", "Messiah", "Passover", "Pharisees", "Redemption", "Sabbath", "Tabernacle", "Zion"];

export default function Dictionary() {
  const { term } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(term || "");
  const [suggestions, setSuggestions] = useState([]);
  useDocumentTitle(term ? `${term} — Bible Dictionary` : "Bible Dictionary");

  useEffect(() => { setQuery(term || ""); }, [term]);

  useEffect(() => {
    const q = query.trim();
    if (!q || q === term) { setSuggestions([]); return; }
    let cancelled = false;
    const t = setTimeout(() => suggestHeadwords(q).then((s) => { if (!cancelled) setSuggestions(s); }), 120);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, term]);

  const open = (word) => { setSuggestions([]); navigate(`/dictionary/${encodeURIComponent(word)}`); };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Bible Dictionary</h1>
      <p className="text-xs text-warm-brown-light mb-4">People, places, customs and topics — Easton, Smith, ISBE, Nave, Torrey and more.</p>

      <form onSubmit={(e) => { e.preventDefault(); if (suggestions[0]) open(suggestions[0][0]); }} className="relative mb-6">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Look up a person, place, or topic…"
          autoComplete="off" enterKeyHint="search" aria-label="Look up a word"
          className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30" />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-cream-dark rounded-xl shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
            {suggestions.map(([word, srcs]) => (
              <button key={word} type="button" onClick={() => open(word)}
                className="w-full text-left px-4 py-2 text-sm text-warm-brown hover:bg-cream flex items-center justify-between gap-3">
                <span>{word}</span>
                <span className="text-[10px] text-warm-brown-light">{srcs.length} {srcs.length === 1 ? "source" : "sources"}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {term ? <Entry term={term} /> : (
        <div>
          <p className="text-[10px] text-warm-brown-light uppercase tracking-wider mb-2">Start with</p>
          <div className="flex flex-wrap gap-1.5">
            {STARTERS.map((w) => (
              <Link key={w} to={`/dictionary/${w}`} className="bg-white border border-cream-dark rounded-full px-3 py-1.5 text-xs text-warm-brown hover:border-gold/30">{w}</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Entry({ term }) {
  const [state, setState] = useState({ loading: true, entry: null });
  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, entry: null });
    getDictionaryEntry(term).then((entry) => { if (!cancelled) setState({ loading: false, entry }); });
    return () => { cancelled = true; };
  }, [term]);

  if (state.loading) return <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto my-12" />;
  if (!state.entry) return <p className="text-sm text-warm-brown-light text-center py-8">No dictionary entry for “{term}”.</p>;

  const { headword, articles } = state.entry;
  const meaning = articles.find((a) => a.meta.kind === "names");
  return (
    <article>
      <h2 className="font-serif text-2xl font-bold text-warm-brown">{headword}</h2>
      {meaning && <p className="text-sm text-warm-brown-light italic mt-1">Name meaning: {meaning.text}</p>}
      <div className="mt-4 space-y-3">
        {articles.filter((a) => a.meta.kind !== "names").map((a, i) => <ArticleCard key={a.id} article={a} defaultOpen={i === 0} />)}
      </div>
      <p className="text-[10px] text-warm-brown-light/60 mt-6">Public-domain works, via the CrossWire Bible Society.</p>
    </article>
  );
}

function ArticleCard({ article, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [full, setFull] = useState(false);
  const { meta, text } = article;
  const long = text.length > 1800;
  const shown = long && !full ? text.slice(0, text.lastIndexOf(" ", 1800)) + "…" : text;
  return (
    <div className="bg-white border border-cream-dark rounded-xl">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full px-4 py-3 flex items-center justify-between text-left gap-3">
        <div>
          <p className="text-sm font-semibold text-warm-brown">{meta.name}</p>
          <p className="text-[10px] text-warm-brown-light">{meta.date} · {meta.kind === "topical" ? "Topical Bible" : "Dictionary"}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`w-4 h-4 text-warm-brown-light/50 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-warm-brown leading-relaxed whitespace-pre-wrap">{linkifyRefs(shown)}</p>
          {long && <button type="button" onClick={() => setFull((f) => !f)} className="text-xs font-medium text-gold mt-2">{full ? "Show less" : "Read the full article"}</button>}
        </div>
      )}
    </div>
  );
}

export { DICTIONARIES };
