import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getDevotional, DEVOTIONALS, dayKey } from "../services/libraryService";
import { linkifyRefs } from "../components/RefText";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const label = (key) => `${MONTHS[+key.slice(0, 2) - 1]} ${+key.slice(3)}`;
function shift(key, days) {
  const d = new Date(2024, +key.slice(0, 2) - 1, +key.slice(3));   // leap year so Feb 29 exists
  d.setDate(d.getDate() + days);
  return dayKey(d);
}

export default function Devotional() {
  const [params, setParams] = useSearchParams();
  const source = DEVOTIONALS[params.get("source")] ? params.get("source") : "morning-evening";
  const day = /^\d\d\.\d\d$/.test(params.get("day") || "") ? params.get("day") : dayKey();
  const [part, setPart] = useState(() => (new Date().getHours() >= 16 ? "evening" : "morning"));
  const [data, setData] = useState(null);
  useDocumentTitle(`${DEVOTIONALS[source].name} — ${label(day)}`);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    getDevotional(source, day).then((d) => { if (!cancelled) setData(d || { morning: "", evening: "" }); });
    return () => { cancelled = true; };
  }, [source, day]);

  const set = (next) => setParams({ source, day, ...next });
  const text = data?.[part] || "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <div className="flex gap-2 mb-4">
        {Object.entries(DEVOTIONALS).map(([id, d]) => (
          <button key={id} type="button" onClick={() => set({ source: id })}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${source === id ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}>
            {d.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={() => set({ day: shift(day, -1) })} className="text-xs text-warm-brown-light hover:text-warm-brown px-2 py-1" aria-label="Previous day">‹ Prev</button>
        <h1 className="font-serif text-xl font-bold text-warm-brown text-center">{label(day)}</h1>
        <button type="button" onClick={() => set({ day: shift(day, 1) })} className="text-xs text-warm-brown-light hover:text-warm-brown px-2 py-1" aria-label="Next day">Next ›</button>
      </div>
      <p className="text-[11px] text-warm-brown-light text-center mb-4">
        {DEVOTIONALS[source].author}, {DEVOTIONALS[source].date}
        {day !== dayKey() && <> · <button type="button" onClick={() => set({ day: dayKey() })} className="text-gold">Today</button></>}
      </p>

      <div className="flex bg-cream-dark rounded-full p-1 mb-5 max-w-xs mx-auto">
        {["morning", "evening"].map((p) => (
          <button key={p} type="button" onClick={() => setPart(p)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${part === p ? "bg-white text-warm-brown shadow-sm" : "text-warm-brown-light"}`}>
            {p === "morning" ? "Morning" : "Evening"}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto my-12" />
      ) : (
        <div className="bg-white border border-cream-dark rounded-2xl p-5">
          <p className="font-scripture text-[15px] text-warm-brown leading-relaxed whitespace-pre-wrap">{linkifyRefs(text)}</p>
        </div>
      )}
      <p className="text-[10px] text-warm-brown-light/60 mt-4 text-center">Public domain, via the CrossWire Bible Society.</p>
      <p className="text-center mt-2"><Link to="/library" className="text-xs text-gold">More classics in the Library →</Link></p>
    </div>
  );
}
