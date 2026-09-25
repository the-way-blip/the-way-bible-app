import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDictionaryEntry } from "../services/libraryService";

/** Short Bible-dictionary preview for a word or name; renders nothing if there's no entry. */
export default function DictionaryPeek({ word, className = "" }) {
  const [entry, setEntry] = useState(null);
  const clean = (word || "").replace(/[^A-Za-z' -]/g, "").trim();

  useEffect(() => {
    let cancelled = false;
    setEntry(null);
    if (clean.length < 3) return;
    getDictionaryEntry(clean).then((e) => { if (!cancelled) setEntry(e); });
    return () => { cancelled = true; };
  }, [clean]);

  const article = entry?.articles.find((a) => a.meta.kind === "dictionary") || entry?.articles.find((a) => a.meta.kind === "topical");
  if (!article) return null;
  const meaning = entry.articles.find((a) => a.meta.kind === "names");
  const snippet = article.text.replace(/\s+/g, " ").slice(0, 220);
  return (
    <Link to={`/dictionary/${encodeURIComponent(entry.headword)}`}
      className={`block bg-cream/60 border border-cream-dark rounded-xl p-3 hover:border-gold/30 transition-colors ${className}`}>
      <p className="text-[10px] font-semibold text-gold uppercase tracking-wider">Bible Dictionary · {entry.headword}</p>
      {meaning && <p className="text-[11px] italic text-warm-brown-light mt-0.5">“{meaning.text}”</p>}
      <p className="text-xs text-warm-brown leading-relaxed mt-1">{snippet}{article.text.length > 220 ? "…" : ""}</p>
      <p className="text-[10px] text-warm-brown-light mt-1">{article.meta.short} · {entry.articles.length} {entry.articles.length === 1 ? "source" : "sources"} →</p>
    </Link>
  );
}
