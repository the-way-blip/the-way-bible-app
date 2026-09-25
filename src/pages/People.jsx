import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getPeopleIndex, getPerson, getTimeline, formatYear } from "../services/libraryService";
import DictionaryPeek from "../components/DictionaryPeek";
import { linkifyRefs } from "../components/RefText";

const DIVINE = new Set(["god_1324", "holy_spirit_7400"]);
const JESUS = "jesus_905";
const JESUS_TITLES = ["Christ", "Messiah", "Immanuel", "The Word", "Lamb of God", "Son of God", "Son of Man", "Saviour", "Lord", "King of kings"];

export default function People() {
  const { slug } = useParams();
  return slug ? <Profile slug={slug} /> : <Directory />;
}

function Tabs({ active }) {
  return (
    <div className="flex gap-2 mb-4">
      {[["/people", "People"], ["/timeline", "Timeline"]].map(([to, label]) => (
        <Link key={to} to={to} className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${active === to ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}>{label}</Link>
      ))}
    </div>
  );
}
export { Tabs as PeopleTabs };

function Directory() {
  useDocumentTitle("People of the Bible");
  const [index, setIndex] = useState(null);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(60);
  useEffect(() => { getPeopleIndex().then(setIndex); }, []);
  const list = useMemo(() => {
    if (!index) return [];
    const k = q.trim().toLowerCase();
    if (!k) return index;
    return index.filter(([, label]) => label.toLowerCase().includes(k))
      .sort((a, b) => (b[1].toLowerCase().startsWith(k) - a[1].toLowerCase().startsWith(k)) || b[2] - a[2]);
  }, [index, q]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <Tabs active="/people" />
      <h1 className="text-xl font-bold text-warm-brown mb-1">People of the Bible</h1>
      <p className="text-xs text-warm-brown-light mb-4">{index ? `${index.length.toLocaleString()} people` : "Loading…"} — family, key passages and the events they were part of.</p>
      <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(60); }} placeholder="Find a person…" aria-label="Find a person"
        className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-4" />
      <div className="divide-y divide-cream-dark bg-white border border-cream-dark rounded-xl">
        {list.slice(0, shown).map(([s, label, count]) => (
          <Link key={s} to={`/people/${s}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-cream/50">
            <span className="text-sm text-warm-brown">{label}</span>
            <span className="text-[10px] text-warm-brown-light">{count.toLocaleString()} {count === 1 ? "verse" : "verses"}</span>
          </Link>
        ))}
      </div>
      {list.length > shown && <button type="button" onClick={() => setShown((n) => n + 100)} className="w-full text-xs text-gold py-3">Show more ({list.length - shown})</button>}
      <p className="text-[10px] text-warm-brown-light/60 mt-4">Data: Theographic Bible Metadata (CC BY-SA 4.0).</p>
    </div>
  );
}

function PersonLinks({ title, people }) {
  if (!people?.length) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold text-warm-brown-light uppercase tracking-wider mb-1">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {people.map(([s, label]) => (
          <Link key={s} to={`/people/${s}`} className="bg-white border border-cream-dark rounded-full px-3 py-1 text-xs text-warm-brown hover:border-gold/40">{label}</Link>
        ))}
      </div>
    </div>
  );
}

function Profile({ slug }) {
  const [p, setP] = useState(undefined);
  const [events, setEvents] = useState([]);
  useDocumentTitle(p ? `${p.label} — People of the Bible` : "People of the Bible");
  useEffect(() => {
    let cancelled = false;
    setP(undefined);
    getPerson(slug).then((rec) => {
      if (cancelled) return;
      setP(rec);
      if (rec?.events.length) getTimeline().then((t) => { if (!cancelled) setEvents((t || []).filter((e) => rec.events.includes(e.id))); });
      else setEvents([]);
    });
    window.scrollTo?.(0, 0);
    return () => { cancelled = true; };
  }, [slug]);

  if (p === undefined) return <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto my-16" />;
  if (!p) return <p className="p-8 text-center text-sm text-warm-brown-light">Person not found. <Link to="/people" className="text-gold">All people</Link></p>;

  const life = DIVINE.has(slug) ? null
    : slug === JESUS ? `Born c. ${formatYear(p.born)} · crucified and risen c. ${formatYear(p.died)}`
    : [p.born != null && `Born c. ${formatYear(p.born)}${p.bornAt ? ` in ${p.bornAt}` : ""}`, p.died != null && `died c. ${formatYear(p.died)}${p.diedAt ? ` in ${p.diedAt}` : ""}`].filter(Boolean).join(" · ");

  return (
    <article className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <Link to="/people" className="text-xs text-warm-brown-light hover:text-warm-brown">‹ People</Link>
      <h1 className="font-serif text-3xl font-bold text-warm-brown mt-2">{p.label}</h1>
      {life && <p className="text-sm text-warm-brown-light mt-1">{life}</p>}
      <p className="text-xs text-gold mt-1">Mentioned in {p.verseCount.toLocaleString()} {p.verseCount === 1 ? "verse" : "verses"}{p.groups.length ? ` · ${p.groups.join(" · ")}` : ""}</p>
      {(slug === JESUS || p.alsoCalled.length > 0) && (
        <p className="text-xs text-warm-brown-light mt-1">Also called: {(slug === JESUS ? JESUS_TITLES : p.alsoCalled).join(", ")}</p>
      )}

      <DictionaryPeek word={slug === JESUS ? "Christ" : p.name} className="mt-4" />

      <section className="mt-5">
        <PersonLinks title="Father" people={p.father} />
        <PersonLinks title="Mother" people={p.mother} />
        <PersonLinks title={p.spouses.length === 1 ? "Spouse" : "Spouses"} people={p.spouses} />
        <PersonLinks title="Brothers & sisters" people={p.siblings} />
        <PersonLinks title="Children" people={p.children} />
      </section>

      {events.length > 0 && (
        <section className="mt-5">
          <p className="text-[10px] font-semibold text-warm-brown-light uppercase tracking-wider mb-2">Events</p>
          <ol className="border-l-2 border-gold/30 pl-4 space-y-3">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold" />
                <p className="text-[10px] text-warm-brown-light">{formatYear(e.year)}</p>
                <p className="text-sm font-medium text-warm-brown">{e.title}</p>
                {e.ref && <p className="text-xs">{linkifyRefs(e.ref)}</p>}
              </li>
            ))}
          </ol>
          <Link to={`/timeline#event-${events[0].id}`} className="inline-block text-xs text-gold mt-2">See on the timeline →</Link>
        </section>
      )}

      {p.keyRefs.length > 0 && (
        <section className="mt-5">
          <p className="text-[10px] font-semibold text-warm-brown-light uppercase tracking-wider mb-2">Where to read</p>
          <p className="text-sm text-warm-brown leading-relaxed">{linkifyRefs(p.keyRefs.join(" · "))}</p>
          {p.books.length > 0 && (
            <p className="text-xs text-warm-brown-light mt-2">Most mentioned in {p.books.slice(0, 5).map(([b, n]) => `${b} (${n})`).join(", ")}</p>
          )}
          <Link to={`/search?q=${encodeURIComponent(p.name)}`} className="inline-block text-xs text-gold mt-2">Every verse mentioning {p.name} →</Link>
        </section>
      )}
      <p className="text-[10px] text-warm-brown-light/60 mt-8">Data: Theographic Bible Metadata (CC BY-SA 4.0). Dates follow Ussher's traditional chronology and are approximate.</p>
    </article>
  );
}
