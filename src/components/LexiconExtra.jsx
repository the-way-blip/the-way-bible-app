import { useState, useEffect } from "react";
import { linkifyRefs } from "./RefText";

const SOURCES = {
  "abbott-smith": "Abbott-Smith Greek Lexicon (1922)",
  bdb: "Brown-Driver-Briggs Hebrew Lexicon",
};
const files = new Map();
function load(strongs) {
  const file = `${strongs[0]}${Math.floor(parseInt(strongs.slice(1), 10) / 500)}`;
  if (!files.has(file)) files.set(file, fetch(`/data/lexicon-extra/${file}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => { files.delete(file); return {}; }));
  return files.get(file).then((d) => d[strongs] || null);
}

/** Fuller Greek/Hebrew definition for a Strong's number; renders nothing if none. */
export default function LexiconExtra({ strongs, className = "" }) {
  const [entry, setEntry] = useState(null);
  const [open, setOpen] = useState(false);
  const id = /^[GH]\d+$/.test(strongs || "") ? strongs.replace(/^([GH])0+/, "$1") : null;

  useEffect(() => {
    let cancelled = false;
    setEntry(null); setOpen(false);
    if (id) load(id).then((e) => { if (!cancelled) setEntry(e); });
    return () => { cancelled = true; };
  }, [id]);

  if (!entry) return null;
  const [src, text] = entry;
  const long = text.length > 700;
  const shown = long && !open ? text.slice(0, text.lastIndexOf(" ", 700)) + "…" : text;
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">{SOURCES[src]}</p>
      <p className="text-xs text-warm-brown leading-relaxed whitespace-pre-wrap">{linkifyRefs(shown)}</p>
      {long && <button type="button" onClick={() => setOpen((o) => !o)} className="text-[10px] font-medium text-gold mt-1">{open ? "Show less" : "Full entry"}</button>}
    </div>
  );
}
