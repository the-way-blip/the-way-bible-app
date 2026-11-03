import { useState } from "react";
import { linkifyRefs } from "./RefText";

/** One source's article for a dictionary headword, collapsible (used by /dictionary and the word study page). */
export default function DictionaryArticle({ article, defaultOpen }) {
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
