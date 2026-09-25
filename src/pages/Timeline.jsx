import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getTimeline, formatYear } from "../services/libraryService";
import { linkifyRefs } from "../components/RefText";
import { PeopleTabs } from "./People";

const ERAS = [
  { name: "Creation to the Flood", from: -5000, to: -2349 },
  { name: "The Patriarchs", from: -2348, to: -1707 },
  { name: "Egypt and the Exodus", from: -1706, to: -1452 },
  { name: "Conquest and the Judges", from: -1451, to: -1096 },
  { name: "The Kingdom of Israel", from: -1095, to: -976 },
  { name: "The Divided Kingdom", from: -975, to: -587 },
  { name: "Exile and Return", from: -586, to: -400 },
  { name: "Between the Testaments", from: -399, to: -6 },
  { name: "The Life of Christ", from: -5, to: 33 },
  { name: "The Early Church", from: 34, to: 200 },
];

export default function Timeline() {
  useDocumentTitle("Bible Timeline");
  const { hash } = useLocation();
  const [events, setEvents] = useState(null);
  const [q, setQ] = useState("");
  useEffect(() => { getTimeline().then(setEvents); }, []);
  useEffect(() => {
    if (!events || !hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("verse-flash"); }
  }, [events, hash]);

  const grouped = useMemo(() => {
    if (!events) return [];
    const k = q.trim().toLowerCase();
    const list = k ? events.filter((e) => e.title.toLowerCase().includes(k) || e.people.some(([, n]) => n.toLowerCase().includes(k)) || e.places.some((p) => p.toLowerCase().includes(k))) : events;
    return ERAS.map((era) => ({ ...era, events: list.filter((e) => e.year >= era.from && e.year <= era.to) })).filter((g) => g.events.length);
  }, [events, q]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <PeopleTabs active="/timeline" />
      <h1 className="text-xl font-bold text-warm-brown mb-1">Bible Timeline</h1>
      <p className="text-xs text-warm-brown-light mb-4">{events ? `${events.length} events` : "Loading…"} from Creation to the early church.</p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, people or places…" aria-label="Search the timeline"
        className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-4" />
      {grouped.map((g) => (
        <section key={g.name} className="mb-6">
          <h2 className="font-serif text-lg font-bold text-warm-brown mb-2 sticky top-0 bg-cream/95 backdrop-blur py-1 z-10">{g.name}</h2>
          <ol className="border-l-2 border-gold/30 pl-4 space-y-4">
            {g.events.map((e) => (
              <li key={e.id} id={`event-${e.id}`} className="relative rounded-md">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold" />
                <p className="text-[10px] text-warm-brown-light">{formatYear(e.year)}{e.places.length ? ` · ${e.places.join(", ")}` : ""}</p>
                <p className="text-sm font-medium text-warm-brown">{e.title}</p>
                {e.ref && <p className="text-xs mt-0.5">{linkifyRefs(e.ref)}</p>}
                {e.people.length > 0 && (
                  <p className="text-[11px] text-warm-brown-light mt-1">
                    {e.people.slice(0, 5).map(([s, n], i) => <span key={s}>{i > 0 && ", "}<Link to={`/people/${s}`} className="hover:text-gold">{n}</Link></span>)}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="text-[10px] text-warm-brown-light/60">Data: Theographic Bible Metadata (CC BY-SA 4.0). Dates follow Ussher's traditional chronology and are approximate.</p>
    </div>
  );
}
