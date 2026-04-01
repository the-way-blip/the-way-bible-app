import { useState } from "react";
import { dbGet, dbPut } from "../../hooks/useDB";
import { generateChapterSummary } from "../../services/aiService";

export default function AISummary({ book, chapter, verses }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const key = `summary-${book}-${chapter}`;

    try {
      const cached = await dbGet("cachedChapters", key);
      if (cached) {
        setSummary(cached.summary);
        setExpanded(true);
        setLoading(false);
        return;
      }

      const versesText = verses.map((v) => `${v.verse}. ${v.text}`).join("\n");
      const result = await generateChapterSummary(book, chapter, versesText);

      await dbPut("cachedChapters", {
        key,
        summary: result,
        fetchedAt: Date.now(),
      });

      setSummary(result);
      setExpanded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading) {
    return (
      <div className="mx-4 mt-4">
        <button
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-xl border border-cream-dark text-sm text-warm-brown-light hover:text-warm-brown hover:border-gold/30 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.5-1 2.5-1.5 3.5s-.5 2.5.5 3.5m-6 0c1-.5 1-2 .5-3.5S8 7.5 8 6a4 4 0 0 1 4-4" />
            <path d="M8 14v.5" /><path d="M16 14v.5" />
            <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
            <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309" />
          </svg>
          AI Chapter Summary
        </button>
        {error && (
          <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-4 mt-4 flex items-center justify-center gap-2 py-6">
        <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-warm-brown-light">Generating summary...</span>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm text-warm-brown hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gold">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.5-1 2.5-1.5 3.5s-.5 2.5.5 3.5m-6 0c1-.5 1-2 .5-3.5S8 7.5 8 6a4 4 0 0 1 4-4" />
            <path d="M8 14v.5" /><path d="M16 14v.5" />
            <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
            <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309" />
          </svg>
          AI Chapter Summary
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 p-4 bg-white rounded-xl border border-cream-dark">
          <div className="text-sm text-warm-brown leading-relaxed prose-sm">
            {summary.split("\n").map((line, i) => {
              if (line.startsWith("**") && line.endsWith("**")) {
                return <h4 key={i} className="font-semibold text-warm-brown mt-3 mb-1 first:mt-0">{line.replace(/\*\*/g, "")}</h4>;
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return <p key={i} className="ml-3 my-0.5">&#8226; {line.slice(2)}</p>;
              }
              if (line.trim() === "") return null;
              return <p key={i} className="my-1">{line.replace(/\*\*/g, "")}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
