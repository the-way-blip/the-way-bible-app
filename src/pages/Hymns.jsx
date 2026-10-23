import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getHymns, getPoems } from "../services/libraryService";
import { linkifyRefs } from "../components/RefText";
import { logEvent } from "../services/ga";

/**
 * Hymns & Poems for reading: /hymns, /hymns/:id, /poems, /poems/:id.
 * Hymns: public/data/hymns/hymns.json; poems: public/data/poems/poems.json.
 */
export default function Hymns() {
  const { id } = useParams();
  const kind = useLocation().pathname.startsWith("/poems") ? "poems" : "hymns";
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    (kind === "poems" ? getPoems() : getHymns()).then((list) => { if (!cancelled) setItems(list); });
    return () => { cancelled = true; };
  }, [kind]);

  if (!items) return <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto my-16" />;
  if (id) {
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) return <NotFoundItem kind={kind} />;
    return <Reading kind={kind} item={items[i]} prev={items[i - 1]} next={items[i + 1]} />;
  }
  return <Browse kind={kind} items={items} />;
}

const yearText = (y) => (!y ? "" : /\d{4}\s*-\s*\d{4}/.test(y) ? ` (${y.replace(/\s*-\s*/, "–")})` : `, ${y}`);
const fold = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "");
const sortLetter = (t) => (t.replace(/^[^A-Za-z]+/, "")[0] || "#").toUpperCase();

/** One printed line per block, with a hanging indent so a wrapped line reads as one line. */
function Lines({ lines, className }) {
  return (
    <div className={className}>
      {lines.map((l, i) => {
        // A poet's indent (two spaces per level) is a fixed step; a wrapped line hangs deeper.
        const level = Math.floor((l.match(/^ */)[0].length) / 2);
        return <p key={i} className="pl-8 -indent-8" style={level ? { marginLeft: `${level * 1.25}em` } : undefined}>{l.trim() || "\u00a0"}</p>;
      })}
    </div>
  );
}

function Tabs({ kind }) {
  return (
    <div className="flex bg-cream-dark rounded-full p-1 mb-4 max-w-xs">
      {[["hymns", "Hymns"], ["poems", "Poems"]].map(([k, label]) => (
        <Link key={k} to={`/${k}`} replace
          className={`flex-1 text-center py-1.5 rounded-full text-xs font-medium transition-colors ${kind === k ? "bg-white text-warm-brown shadow-sm" : "text-warm-brown-light"}`}>
          {label}
        </Link>
      ))}
    </div>
  );
}

function Browse({ kind, items }) {
  useDocumentTitle(kind === "poems" ? "Poems" : "Hymns");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const filter = params.get(kind === "poems" ? "author" : "topic") || "";
  const set = (k, v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });

  // Hymns filter by topic; poems by poet (in collection order).
  const chips = useMemo(() => {
    if (kind === "poems") return [...new Set(items.map((p) => p.author))];
    const count = {};
    for (const h of items) for (const t of h.topics || []) count[t] = (count[t] || 0) + 1;
    return Object.keys(count).sort((a, b) => count[b] - count[a]);
  }, [items, kind]);

  const shown = useMemo(() => {
    const f = fold(q);
    let list = items.filter((x) => !filter || (kind === "poems" ? x.author === filter : x.topics?.includes(filter)));
    if (f) {
      list = list.filter((x) => fold(`${x.title} ${x.firstLine || x.stanzas?.[0]?.[0] || ""} ${x.author}`).includes(f)
        || (f.length > 3 && fold((x.verses || x.stanzas).flat().join(" ")).includes(f)));
    }
    return kind === "poems" ? list : [...list].sort((a, b) => a.title.replace(/^[^A-Za-z]+/, "").localeCompare(b.title.replace(/^[^A-Za-z]+/, "")));
  }, [items, q, filter, kind]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Hymns &amp; Poems</h1>
      <p className="text-xs text-warm-brown-light mb-4">
        {kind === "poems"
          ? `${items.length} classic Christian poems, from Herbert and Donne to Rossetti.`
          : `${items.length} hymns of the faith, for reading and reflection. All public domain.`}
      </p>
      <Tabs kind={kind} />
      <input type="search" value={q} onChange={(e) => set("q", e.target.value)}
        placeholder={kind === "poems" ? "Search poems, poets or lines" : "Search titles, first lines, authors or words"}
        aria-label={kind === "poems" ? "Search poems" : "Search hymns"}
        className="w-full bg-white border border-cream-dark rounded-xl px-4 py-2.5 text-[16px] text-warm-brown placeholder-warm-brown-light/60 focus:outline-none focus:border-gold mb-3" />
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => set(kind === "poems" ? "author" : "topic", "")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${!filter ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}>All</button>
        {chips.map((c) => (
          <button key={c} type="button" onClick={() => set(kind === "poems" ? "author" : "topic", c === filter ? "" : c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${c === filter ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"}`}>
            {c}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="text-sm text-warm-brown-light text-center py-10">Nothing matches “{q}”.</p>}
      <ul className="divide-y divide-cream-dark bg-white border border-cream-dark rounded-2xl overflow-hidden">
        {shown.map((x, i) => {
          const letter = kind === "hymns" && !q ? sortLetter(x.title) : null;
          const showLetter = letter && (i === 0 || sortLetter(shown[i - 1].title) !== letter);
          return (
            <li key={x.id}>
              {showLetter && <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gold uppercase tracking-wider bg-cream/40">{letter}</p>}
              <Link to={`/${kind}/${x.id}`} className="block px-4 py-3 hover:bg-cream/40">
                <p className="font-serif font-bold text-warm-brown leading-snug">{x.title}</p>
                {kind === "hymns" && fold(x.firstLine) !== fold(x.title) && <p className="text-xs text-warm-brown-light italic mt-0.5 truncate">{x.firstLine}</p>}
                <p className="text-[11px] text-warm-brown-light mt-0.5">{x.author || "Author unknown"}{kind === "poems" && x.year ? `, ${x.year}` : ""}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Reading({ kind, item, prev, next }) {
  useDocumentTitle(item.title);
  const navigate = useNavigate();
  useEffect(() => { logEvent(kind === "poems" ? "poem_view" : "hymn_view", { method: item.id }); }, [kind, item.id]);
  const stanzas = item.verses || item.stanzas;
  const isHymn = kind === "hymns";

  const share = async () => {
    const body = stanzas.map((v, i) => (isHymn && item.refrain && i === 0 ? [...v, "", ...item.refrain] : v).join("\n")).join("\n\n");
    const text = `${item.title}\n${item.author ? `${item.author}\n` : ""}\n${body}\n\n— TheWay Bible App`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, text });
      else { await navigator.clipboard.writeText(text); alert("Copied"); }
    } catch { /* cancelled */ }
  };

  return (
    <article className="max-w-xl mx-auto px-5 py-6 pb-24">
      <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(`/${kind}`))}
        className="text-xs text-warm-brown-light hover:text-warm-brown mb-4">‹ {isHymn ? "Hymns" : "Poems"}</button>
      <h1 className="font-serif text-2xl font-bold text-warm-brown leading-tight">{item.title}</h1>
      <p className="text-sm text-gold mt-1">
        {item.author || "Author unknown"}{isHymn ? yearText(item.year) : item.lifespan ? ` (${item.lifespan})` : ""}
      </p>
      {item.translator && <p className="text-xs text-warm-brown-light">Translated by {item.translator}</p>}
      {!isHymn && (item.collection || item.year) && (
        <p className="text-xs text-warm-brown-light">{[item.collection && <em key="c">{item.collection}</em>, item.year].filter(Boolean).reduce((a, b) => [a, ", ", b])}</p>
      )}

      <div className="mt-6 space-y-5">
        {stanzas.map((v, i) => (
          <div key={i}>
            <div className="flex gap-3">
              {isHymn && stanzas.length > 1 && <span className="text-[11px] font-semibold text-gold w-4 shrink-0 pt-1 text-right">{i + 1}</span>}
              <Lines lines={v} className="font-scripture text-[17px] leading-[1.6] text-warm-brown" />
            </div>
            {isHymn && item.refrain && (i === 0 ? (
              <div className={`mt-3 ${stanzas.length > 1 ? "ml-7" : ""} pl-3 border-l-2 border-gold/40`}>
                <p className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">Refrain</p>
                <Lines lines={item.refrain} className="font-scripture italic text-[16px] leading-[1.6] text-warm-brown" />
              </div>
            ) : (
              <p className={`mt-1 ${stanzas.length > 1 ? "ml-7" : ""} text-[11px] italic text-warm-brown-light`}>Refrain</p>
            ))}
          </div>
        ))}
      </div>

      {(item.scripture?.length > 0 || item.topics?.length > 0 || item.notes) && (
        <div className="mt-8 pt-4 border-t border-cream-dark space-y-2">
          {item.scripture?.length > 0 && (
            <p className="text-xs text-warm-brown-light"><span className="font-semibold text-warm-brown">Scripture: </span>{linkifyRefs(item.scripture.join("; "))}</p>
          )}
          {item.topics?.length > 0 && (
            <p className="flex flex-wrap gap-1.5">
              {item.topics.map((t) => (
                <Link key={t} to={`/hymns?topic=${encodeURIComponent(t)}`} className="px-2.5 py-1 rounded-full bg-cream-dark text-[11px] text-warm-brown-light hover:text-warm-brown">{t}</Link>
              ))}
            </p>
          )}
          {item.notes && <p className="text-xs text-warm-brown-light">{item.notes}</p>}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={share} className="text-xs font-medium text-gold min-h-[44px]">Share</button>
        <p className="text-[10px] text-warm-brown-light/70 text-right">
          Public domain · {isHymn
            ? <a href={item.source?.url} target="_blank" rel="noopener noreferrer" className="underline">{item.source?.name}{item.source?.number ? ` #${item.source.number}` : ""}</a>
            : <a href={item.source} target="_blank" rel="noopener noreferrer" className="underline">Wikisource</a>}
        </p>
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-3 text-xs" aria-label={isHymn ? "More hymns" : "More poems"}>
        {prev ? <Link to={`/${kind}/${prev.id}`} className="bg-white border border-cream-dark rounded-xl px-3 py-2.5 hover:border-gold/30"><span className="text-warm-brown-light">‹ Previous</span><span className="block font-serif font-bold text-warm-brown truncate">{prev.title}</span></Link> : <span />}
        {next ? <Link to={`/${kind}/${next.id}`} className="bg-white border border-cream-dark rounded-xl px-3 py-2.5 text-right hover:border-gold/30"><span className="text-warm-brown-light">Next ›</span><span className="block font-serif font-bold text-warm-brown truncate">{next.title}</span></Link> : <span />}
      </nav>
    </article>
  );
}

function NotFoundItem({ kind }) {
  return (
    <div className="max-w-xl mx-auto px-5 py-16 text-center">
      <p className="text-sm text-warm-brown-light mb-3">That {kind === "poems" ? "poem" : "hymn"} isn't here.</p>
      <Link to={`/${kind}`} className="text-sm text-gold">Browse {kind}</Link>
    </div>
  );
}
