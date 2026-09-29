import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getTimeline, getChrono, formatYear } from "../services/libraryService";
import { linkifyRefs } from "../components/RefText";
import { PeopleTabs } from "./People";

// Bible + World timeline: two lanes side by side (Bible left, world right),
// synchronized in time blocks like the old Adams Synchronological Chart.
// Dates follow the biblical (Ussher) chronology; world dates earlier than
// 1650 BC are harmonized into it, with the conventional date shown too.

const REGIONS = {
  ne: { label: "Near East", color: "#c0563b" },
  eg: { label: "Egypt & Africa", color: "#23867f" },
  med: { label: "Greece & Rome", color: "#5a67c9" },
  as: { label: "Asia", color: "#b0417a" },
  wo: { label: "Europe & Americas", color: "#4a8a3c" },
};

const JUMPS = [
  ["Creation", -4003], ["Flood", -2347], ["Abraham", -1920], ["Exodus", -1490], ["Judges", -1400],
  ["David", -1054], ["Divided kingdom", -974], ["Exile", -587], ["Return", -535],
  ["Greece", -330], ["Jesus", -3], ["Early church", 33],
];

// Human-friendly block sizes: sparse early history gets wide blocks, the
// crowded kingdom and New Testament years get narrow ones.
function blockSize(h) {
  if (h < -2400) return 200;
  if (h < -1100) return 100;
  if (h < -400) return 50;
  if (h < -100) return 100;
  if (h === -100) return 50;
  if (h === -50) return 40;
  return 10;
}
const toHuman = (y) => (y <= 0 ? y - 1 : y);
const toAstro = (h) => (h < 0 ? h + 1 : h);
function buildBlocks() {
  const blocks = [];
  let h = -4100;
  while (h <= 100) {
    const size = blockSize(h);
    const end = h < 0 ? Math.min(h + size - 1, -1) : h + size - 1;
    blocks.push({ from: toAstro(h), to: toAstro(end), label: h < 0 ? `${Math.min(-h, 4004)} BC` : `AD ${h}` });
    h = end === -1 ? 1 : end + 1;
  }
  return blocks;
}
const BLOCKS = buildBlocks();
const blockIndex = (y) => {
  const i = BLOCKS.findIndex((b) => y >= b.from && y <= b.to);
  return i < 0 ? (y < BLOCKS[0].from ? 0 : BLOCKS.length - 1) : i;
};

const range = (a, b) => (a === b ? formatYear(a) : toHuman(a) < 0 && toHuman(b) < 0 ? `${-toHuman(a)}–${-toHuman(b)} BC` : `${formatYear(a)} – ${formatYear(b)}`);
const approx = (y) => (y < -1000 ? "c. " : "");
const overlaps = (s, e, from, to) => s <= to && e >= from;
const REGION_ORDER = Object.keys(REGIONS);
const byRegion = (a, b) => REGION_ORDER.indexOf(a.r) - REGION_ORDER.indexOf(b.r) || a.s - b.s;

export default function Timeline() {
  useDocumentTitle("Bible & World Timeline");
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState(null);
  const [chrono, setChrono] = useState(null);
  const [regions, setRegions] = useState(() => new Set(Object.keys(REGIONS)));
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(null); // { kind: "bible"|"world"|"moment", item, year }
  const [expanded, setExpanded] = useState(() => new Set());
  const [current, setCurrent] = useState(0);
  const blockRefs = useRef([]);
  const headerRef = useRef(null);

  useEffect(() => {
    Promise.all([getTimeline(), getChrono()]).then(([t, c]) => {
      setChrono(c);
      setEvents([...(t || []), ...(c?.bible || []).map((e) => ({ refCount: 12, ...e }))].sort((a, b) => a.year - b.year));
    });
  }, []);

  // "You are here" from the reader: /timeline?ref=Jeremiah 39 (or ?y=-587)
  const here = useMemo(() => {
    const ref = params.get("ref");
    if (!chrono || (!ref && params.get("y") == null)) return null;
    const m = (ref || "").match(/^(.+?)\s+(\d+)$/);
    const year = params.get("y") != null ? Number(params.get("y")) : chrono.chapters[m?.[1]]?.[Number(m?.[2]) - 1];
    if (year == null || Number.isNaN(year)) return null;
    return { year, ref: ref || formatYear(year), book: chrono.books.find((b) => b.n === m?.[1]) };
  }, [params, chrono]);

  const rows = useMemo(() => {
    if (!events || !chrono) return [];
    const world = chrono.world.filter((w) => regions.has(w.r));
    return BLOCKS.map((b, i) => {
      const bible = events.filter((e) => e.year >= b.from && e.year <= b.to).sort((x, y) => x.year - y.year || y.refCount - x.refCount);
      const powers = world.filter((w) => w.k === "power" && overlaps(w.s, w.e, b.from, b.to)).sort(byRegion);
      const rising = powers.filter((w) => w.s >= b.from);
      const happenings = world.filter((w) => w.k !== "power" && w.s >= b.from && w.s <= b.to);
      const writing = chrono.books.filter((bk) => overlaps(bk.w[0], bk.w[1], b.from, b.to));
      const alive = chrono.people.filter(([, , s, e]) => overlaps(s, e, b.from, b.to));
      const era = chrono.eras.find((e) => Math.round((b.from + b.to) / 2) >= e.from && Math.round((b.from + b.to) / 2) <= e.to) || chrono.eras[chrono.eras.length - 1];
      return { ...b, i, bible, top: [...bible].sort((x, y) => y.refCount - x.refCount).slice(0, 3).sort((x, y) => x.year - y.year), powers, rising, happenings, writing, alive, era };
    });
  }, [events, chrono, regions]);

  // Track which block is under the sticky header
  useEffect(() => {
    if (!rows.length) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const top = (headerRef.current?.getBoundingClientRect().bottom || 0) + 8;
        let idx = 0;
        blockRefs.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= top) idx = i; });
        setCurrent(idx);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [rows.length]);

  const jumpTo = useCallback((year, smooth = true) => {
    const el = blockRefs.current[blockIndex(year)];
    if (!el) return;
    const offset = (headerRef.current?.offsetHeight || 0) + 4;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Deep links: ?y= from the reader, #event-N from people profiles
  useEffect(() => {
    if (!rows.length) return;
    if (here) {
      requestAnimationFrame(() => jumpTo(here.year, false));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- open the "you are here" card once the data is in
      setSheet({ kind: "moment", year: here.year, here });
    } else if (hash.startsWith("#event-")) {
      const ev = events.find((e) => `event-${e.id}` === hash.slice(1));
      if (ev) {
        setExpanded((s) => new Set(s).add(blockIndex(ev.year)));
        requestAnimationFrame(() => {
          const el = document.getElementById(hash.slice(1));
          if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("verse-flash"); }
        });
      }
    }
  }, [rows.length, here, hash]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k || !events || !chrono) return null;
    const b = events.filter((e) => e.title.toLowerCase().includes(k) || e.people.some(([, n]) => n.toLowerCase().includes(k)) || e.places.some((p) => p.toLowerCase().includes(k)))
      .map((e) => ({ kind: "bible", item: e, year: e.year }));
    const w = chrono.world.filter((x) => x.t.toLowerCase().includes(k) || x.d.toLowerCase().includes(k)).map((x) => ({ kind: "world", item: x, year: x.s }));
    const p = chrono.people.filter(([, n]) => n.toLowerCase().includes(k)).map((x) => ({ kind: "person", item: x, year: x[2] }));
    return [...p, ...b, ...w].sort((x, y) => x.year - y.year).slice(0, 60);
  }, [q, events, chrono]);

  const toggleRegion = (r) => setRegions((s) => {
    const next = new Set(s);
    if (s.size === Object.keys(REGIONS).length) return new Set([r]); // first tap isolates a region
    next.has(r) ? next.delete(r) : next.add(r);
    return next.size ? next : new Set(Object.keys(REGIONS));
  });

  const cur = rows[current];

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="px-4 pt-6">
        <PeopleTabs active="/timeline" />
        <h1 className="text-xl font-bold text-warm-brown mb-1">Bible & World Timeline</h1>
        <p className="text-xs text-warm-brown-light mb-3">What was happening in the world while the Bible was being lived and written. Tap anything to see what else was going on at that time.</p>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, events, empires…" aria-label="Search the timeline"
          className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-3" />
      </div>

      {results ? (
        <div className="px-4">
          {results.length === 0 && <p className="text-sm text-warm-brown-light py-6 text-center">Nothing found for “{q}”.</p>}
          <ul className="divide-y divide-cream-dark bg-white border border-cream-dark rounded-xl">
            {results.map((r, i) => (
              <li key={i}>
                <button type="button" className="w-full text-left px-4 py-2.5 hover:bg-cream/50"
                  onClick={() => { setQ(""); requestAnimationFrame(() => jumpTo(r.year)); setSheet(r.kind === "person" ? { kind: "moment", year: r.year } : r); }}>
                  <span className="text-[10px] text-warm-brown-light">{r.kind === "world" ? `${approx(r.item.s)}${range(r.item.s, r.item.e)} · ${REGIONS[r.item.r].label}` : r.kind === "person" ? `${range(r.item[2], r.item[3])} · ${r.item[4]}` : `${approx(r.year)}${formatYear(r.year)} · Bible`}</span>
                  <span className="block text-sm text-warm-brown">{r.kind === "world" ? r.item.t : r.kind === "person" ? r.item[1] : r.item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {/* Sticky "where am I" header */}
          <div ref={headerRef} className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-cream-dark px-4 pt-2 pb-2">
            <div className="flex items-baseline justify-between gap-2">
              <button type="button" onClick={() => cur && setSheet({ kind: "moment", year: Math.round((cur.from + cur.to) / 2) })} className="text-left min-w-0">
                <span className="font-serif text-lg font-bold text-warm-brown">{cur ? cur.label : "…"}</span>
                <span className="text-[11px] text-warm-brown-light ml-2 truncate">{cur?.era?.name}</span>
              </button>
              {cur && (
                <button type="button" onClick={() => setSheet({ kind: "moment", year: Math.round((cur.from + cur.to) / 2) })}
                  className="shrink-0 text-[11px] font-medium text-gold border border-gold/40 rounded-full px-2.5 py-1">Meanwhile…</button>
              )}
            </div>
            <p className="text-[10px] text-warm-brown-light truncate mt-0.5 min-h-[14px]">
              {cur?.powers.length ? <>World powers: {cur.powers.map((w, j) => <span key={w.id}>{j > 0 && " · "}<span style={{ color: REGIONS[w.r].color }}>{w.t}</span></span>)}</> : cur ? "No world empires yet" : ""}
            </p>
            {/* Progress through all of history */}
            <div className="h-1 rounded-full bg-cream-dark mt-1.5 overflow-hidden" aria-hidden="true">
              <div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${rows.length ? ((current + 1) / rows.length) * 100 : 0}%` }} />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mt-2 -mx-4 px-4">
              {JUMPS.map(([label, y]) => (
                <button key={label} type="button" onClick={() => jumpTo(y)}
                  className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full ${cur && y >= cur.from && y <= cur.to ? "bg-gold text-white" : "bg-white border border-cream-dark text-warm-brown-light"}`}>{label}</button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mt-1.5 -mx-4 px-4" role="group" aria-label="World regions">
              {Object.entries(REGIONS).map(([r, { label, color }]) => (
                <button key={r} type="button" onClick={() => toggleRegion(r)} aria-pressed={regions.has(r)}
                  className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1"
                  style={regions.has(r) ? { borderColor: color, color } : { borderColor: "transparent", color: "var(--color-warm-brown-light, #8a7a6a)", opacity: 0.5 }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Lane labels */}
          <div className="grid grid-cols-[1fr_44px_1fr] px-2 pt-3 pb-1 text-[10px] uppercase tracking-wider font-semibold">
            <span className="text-gold text-right pr-1">In the Bible</span>
            <span />
            <span className="text-warm-brown-light pl-1">In the world</span>
          </div>

          {!rows.length && <p className="text-sm text-warm-brown-light text-center py-10">Loading timeline…</p>}

          {rows.map((row, i) => {
            const newEra = i === 0 || rows[i - 1].era !== row.era;
            const open = expanded.has(i);
            const shown = open ? row.bible : row.top;
            const quiet = !row.bible.length && !row.happenings.length && !row.writing.length;
            const isHere = here && here.year >= row.from && here.year <= row.to;
            return (
              <section key={row.from} ref={(el) => { blockRefs.current[i] = el; }} aria-label={row.label}>
                {newEra && (
                  <h2 className="mx-4 mt-4 mb-1 font-serif text-base font-bold text-warm-brown border-b border-gold/30 pb-1">{row.era.name}</h2>
                )}
                <div className={`grid grid-cols-[1fr_44px_1fr] px-2 ${quiet ? "py-1" : "py-2"}`}>
                  {/* Bible lane */}
                  <div className="flex flex-col items-end gap-1.5 min-w-0">
                    {isHere && (
                      <button type="button" onClick={() => setSheet({ kind: "moment", year: here.year, here })}
                        className="w-full text-right rounded-lg bg-gold text-white px-2 py-1.5 shadow-sm">
                        <span className="block text-[9px] uppercase tracking-wider opacity-90">You are here</span>
                        <span className="block text-xs font-semibold">{here.ref}</span>
                      </button>
                    )}
                    {shown.map((e) => (
                      <button key={e.id} id={`event-${e.id}`} type="button" onClick={() => setSheet({ kind: "bible", item: e, year: e.year })}
                        className="w-full text-right rounded-lg bg-white border border-gold/30 px-2 py-1.5 hover:border-gold">
                        <span className="block text-[9px] text-warm-brown-light">{approx(e.year)}{formatYear(e.year)}</span>
                        <span className="block text-xs text-warm-brown leading-snug">{e.title}</span>
                      </button>
                    ))}
                    {row.bible.length > 3 && (
                      <button type="button" onClick={() => setExpanded((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                        className="text-[10px] text-gold px-1">{open ? "Show fewer" : `+${row.bible.length - 3} more events`}</button>
                    )}
                    {row.writing.length > 0 && (
                      <p className="text-[10px] text-warm-brown-light text-right leading-snug">
                        <span aria-hidden="true">✍ </span>{row.writing.map((b) => b.n).join(", ")}
                      </p>
                    )}
                    {!quiet && row.alive.length > 0 && (
                      <p className="text-[10px] text-warm-brown-light/80 text-right leading-snug">
                        {row.alive.slice(0, 4).map(([s, n], j) => <span key={s}>{j > 0 && ", "}<Link to={`/people/${s}`} className="hover:text-gold">{n}</Link></span>)}
                        {row.alive.length > 4 && ` +${row.alive.length - 4}`}
                      </p>
                    )}
                  </div>

                  {/* Spine */}
                  <button type="button" onClick={() => setSheet({ kind: "moment", year: Math.round((row.from + row.to) / 2) })}
                    className="relative flex justify-center" aria-label={`What was happening around ${row.label}`}>
                    <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-cream-dark" />
                    <span className={`relative mt-1 text-[9px] font-semibold leading-tight text-center rounded px-0.5 bg-cream ${isHere ? "text-gold" : "text-warm-brown-light"}`}>
                      {row.label.replace(" BC", "")}<br /><span className="font-normal">{row.label.includes("BC") ? "BC" : ""}</span>
                    </span>
                  </button>

                  {/* World lane */}
                  <div className="flex flex-col items-start gap-1.5 min-w-0">
                    {i === 0 && (
                      <p className="text-[10px] text-warm-brown-light/80 leading-snug pt-1">Before recorded history. For this age Scripture is our only record.</p>
                    )}
                    {row.rising.map((w) => (
                      <button key={w.id} type="button" onClick={() => setSheet({ kind: "world", item: w, year: w.s })}
                        className="w-full text-left rounded-lg px-2 py-1.5" style={{ background: `${REGIONS[w.r].color}1a`, borderLeft: `3px solid ${REGIONS[w.r].color}` }}>
                        <span className="block text-[9px]" style={{ color: REGIONS[w.r].color }}>{approx(w.s)}{range(w.s, w.e)}</span>
                        <span className="block text-xs font-semibold text-warm-brown leading-snug">{w.t}</span>
                      </button>
                    ))}
                    {row.happenings.map((w) => (
                      <button key={w.id} type="button" onClick={() => setSheet({ kind: "world", item: w, year: w.s })}
                        className="w-full text-left rounded-lg bg-white border px-2 py-1.5" style={{ borderColor: `${REGIONS[w.r].color}55` }}>
                        <span className="block text-[9px]" style={{ color: REGIONS[w.r].color }}>{approx(w.s)}{range(w.s, w.e)}</span>
                        <span className="block text-xs text-warm-brown leading-snug">{w.t}</span>
                        {w.p || w.ref ? <span className="block text-[9px] text-gold mt-0.5">In the Bible</span> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </>
      )}

      <p className="px-4 mt-6 text-[10px] text-warm-brown-light/70 leading-relaxed">
        Bible dates follow Ussher's chronology (the dates printed in the margins of many KJV Bibles) and are approximate. World dates are conventional. Dates earlier than 1650 BC are shown within the biblical timeline, with the conventional date also given. Bible data: Theographic Bible Metadata (CC BY-SA 4.0).
      </p>

      {sheet && chrono && events && createPortal(
        <MomentSheet sheet={sheet} chrono={chrono} events={events} onClose={() => { setSheet(null); if (params.get("y") || params.get("ref")) setParams({}, { replace: true }); }}
          onOpen={(s) => { setSheet(s); jumpTo(s.year); }} />,
        document.body,
      )}
    </div>
  );
}

function MomentSheet({ sheet, chrono, events, onClose, onOpen }) {
  const { kind, item, year, here } = sheet;
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // What else was going on: a window around the year that widens in sparse periods
  const win = year < -1500 ? 120 : year < -1000 ? 60 : year < -10 ? 40 : 8;
  const from = year - win, to = year + win;
  const s = kind === "world" ? item.s : year, e = kind === "world" ? item.e : year;
  const alive = chrono.people.filter(([, , a, b]) => overlaps(a, b, s, e));
  const writing = chrono.books.filter((b) => overlaps(b.w[0], b.w[1], s - (win >> 1), e + (win >> 1)));
  const bibleNear = events.filter((ev) => ev.year >= from && ev.year <= to && ev !== item)
    .sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year) || b.refCount - a.refCount).slice(0, 5).sort((a, b) => a.year - b.year);
  const powers = chrono.world.filter((w) => w.k === "power" && overlaps(w.s, w.e, s, e) && w !== item).sort(byRegion);
  const worldNear = chrono.world.filter((w) => w.k !== "power" && w !== item && overlaps(w.s, w.e, from, to))
    .sort((a, b) => Math.abs(a.s - year) - Math.abs(b.s - year)).slice(0, 6).sort((a, b) => a.s - b.s);
  const title = kind === "bible" ? item.title : kind === "world" ? item.t : here ? here.ref : `Around ${formatYear(year)}`;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title}
        className="fixed inset-x-0 bottom-0 z-[60] max-w-2xl mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col animate-slide-up"
        style={{ maxHeight: "82vh", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 border-b border-cream-dark">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: kind === "world" ? REGIONS[item.r].color : "var(--color-gold, #c9a84c)" }}>
              {kind === "world" ? `${REGIONS[item.r].label} · ${{ power: "Empire / kingdom", event: "Event", person: "Person", work: "Culture" }[item.k]}` : kind === "bible" ? "In the Bible" : here ? "You are here" : "Meanwhile"}
            </p>
            <h3 className="font-serif text-lg font-bold text-warm-brown leading-snug">{title}</h3>
            <p className="text-xs text-warm-brown-light">
              {kind === "world" ? `${approx(item.s)}${range(item.s, item.e)}` : `${approx(year)}${formatYear(year)}`}
              {kind === "world" && item.cv && <span className="block text-[10px] text-warm-brown-light/80">Conventional date: {range(item.cv[0], item.cv[1])}</span>}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-warm-brown-light hover:bg-cream-dark/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-4 text-sm">
          {kind === "world" && (
            <div>
              <p className="text-warm-brown leading-relaxed">{item.d}</p>
              {(item.ref || item.p) && (
                <p className="text-xs mt-2 text-warm-brown-light">
                  <span className="font-medium text-gold">In the Bible: </span>
                  {item.ref && linkifyRefs(item.ref)}
                  {item.p && <>{item.ref && " · "}<Link to={`/people/${item.p}`} className="text-gold hover:underline">Profile</Link></>}
                </p>
              )}
            </div>
          )}
          {kind === "bible" && (
            <div>
              {item.ref && <p className="text-xs">{linkifyRefs(item.ref)}</p>}
              {item.places?.length > 0 && <p className="text-xs text-warm-brown-light mt-1">{item.places.join(", ")}</p>}
              {item.people?.length > 0 && (
                <p className="text-xs text-warm-brown-light mt-1">
                  {item.people.slice(0, 6).map(([sl, n], j) => <span key={sl}>{j > 0 && ", "}<Link to={`/people/${sl}`} className="text-gold hover:underline">{n}</Link></span>)}
                </p>
              )}
            </div>
          )}
          {here?.book && (
            <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 text-xs text-warm-brown leading-relaxed">
              <p><span className="font-semibold">{here.book.n}</span> tells of events from {approx(here.book.c[0])}{range(here.book.c[0], here.book.c[1])}.</p>
              <p>Written by {here.book.a}, {approx(here.book.w[0])}{range(here.book.w[0], here.book.w[1])}.</p>
            </div>
          )}

          <Block title="Bible people living then" empty="No dated Bible figures at this point.">
            {alive.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {alive.map(([sl, n, , , role]) => (
                  <Link key={sl} to={`/people/${sl}`} className="text-xs bg-gold/10 text-warm-brown rounded-full px-2.5 py-1 hover:bg-gold/20">
                    {n} <span className="text-[10px] text-warm-brown-light">· {role}</span>
                  </Link>
                ))}
              </div>
            )}
          </Block>

          {writing.length > 0 && (
            <Block title="Books of the Bible being written">
              <p className="text-xs text-warm-brown leading-relaxed">
                {writing.map((b, j) => <span key={b.n}>{j > 0 && " · "}<Link to={`/read/${encodeURIComponent(b.n)}/1`} className="hover:text-gold">{b.n}</Link> {b.a.replace(/ \(.*\)$/, "") !== b.n && <span className="text-warm-brown-light">({b.a.replace(/ \(.*\)$/, "")})</span>}</span>)}
              </p>
            </Block>
          )}

          {bibleNear.length > 0 && (
            <Block title="Nearby in the Bible">
              <ul className="space-y-1">
                {bibleNear.map((ev) => (
                  <li key={ev.id}>
                    <button type="button" onClick={() => onOpen({ kind: "bible", item: ev, year: ev.year })} className="text-left text-xs text-warm-brown hover:text-gold">
                      <span className="text-warm-brown-light">{formatYear(ev.year)} · </span>{ev.title}
                    </button>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          <Block title="Meanwhile in the world" empty="Little recorded history from this time.">
            {(powers.length > 0 || worldNear.length > 0) && (
              <>
                {powers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {powers.map((w) => (
                      <button key={w.id} type="button" onClick={() => onOpen({ kind: "world", item: w, year: w.s })}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${REGIONS[w.r].color}1f`, color: REGIONS[w.r].color }}>{w.t}</button>
                    ))}
                  </div>
                )}
                <ul className="space-y-1.5">
                  {worldNear.map((w) => (
                    <li key={w.id}>
                      <button type="button" onClick={() => onOpen({ kind: "world", item: w, year: w.s })} className="text-left text-xs text-warm-brown hover:text-gold flex gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: REGIONS[w.r].color }} />
                        <span><span className="text-warm-brown-light">{approx(w.s)}{range(w.s, w.e)} · </span>{w.t}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Block>
        </div>
      </div>
    </>
  );
}

function Block({ title, empty, children }) {
  const hasContent = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  if (!hasContent && !empty) return null;
  return (
    <section>
      <h4 className="text-[10px] uppercase tracking-wider font-semibold text-warm-brown-light mb-1.5">{title}</h4>
      {hasContent ? children : <p className="text-xs text-warm-brown-light/70">{empty}</p>}
    </section>
  );
}
