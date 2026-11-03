// Search scopes beyond Bible text: the reader's notes, highlights, and the
// local commentaries. Rendered by pages/Search.jsx when ?scope= is set.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { searchNotes, noteTagCounts, searchHighlights, getHighlightLabels, studyVerseUrl, studyRef, stemMatch } from "../../services/personalSearch";
import { stem } from "../../services/bibleSearch";
import { HIGHLIGHT_PALETTE } from "../reader/highlightPalette";
import { makeSnippet, markParts } from "../../utils/snippet";

const PAGE = 20;

function Marked({ text, isHit, phrases }) {
  return (
    <>
      {markParts(text, isHit, phrases).map((p, i) =>
        typeof p === "string" ? p : <mark key={i} className="bg-gold/20 text-warm-brown rounded-sm px-0.5">{p.hit}</mark>
      )}
    </>
  );
}

function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center py-12 gap-2" role="status">
      <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-warm-brown-light">{label}</span>
    </div>
  );
}

function Empty({ title, hint }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-warm-brown-light">{title}</p>
      {hint && <p className="text-xs text-warm-brown-light/70 mt-1">{hint}</p>}
    </div>
  );
}

function MoreButton({ remaining, onClick, t }) {
  if (remaining <= 0) return null;
  return (
    <button type="button" onClick={onClick}
      className="w-full text-center text-xs font-medium text-gold py-3 bg-white border border-cream-dark rounded-xl hover:border-gold/30">
      {t("search.showMore", "Show more")} ({remaining})
    </button>
  );
}

const pluralLabel = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/* ─────────────────────────── Notes ─────────────────────────── */

export function NotesResults({ q, books, t, onAddTag }) {
  const [res, setRes] = useState(null);
  const [tags, setTags] = useState([]);
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => { noteTagCounts().then(setTags).catch(() => {}); }, []);
  useEffect(() => {
    let cancelled = false;
    searchNotes(q, { books }).then((r) => { if (!cancelled) { setVisible(PAGE); setRes(r); } }).catch(() => { if (!cancelled) setRes({ results: [], total: 0, count: 0, words: [], phrases: [], tags: [] }); });
    return () => { cancelled = true; };
  }, [q, books]);

  if (!res) return <Spinner label={t("search.searchingNotes", "Searching your notes…")} />;
  if (!res.count) return <Empty title={t("search.noNotes", "You haven't written any notes yet.")} hint={t("search.noNotesHint", "Tap a verse in the reader and choose Note.")} />;

  const hasQuery = q.trim().length > 0;
  const isHit = (w) => res.words.some((x) => w.startsWith(x));
  return (
    <div className="space-y-4">
      {tags.length > 0 && (
        <div>
          <p className="text-[10px] text-warm-brown-light uppercase tracking-wider mb-1.5">{t("search.tags", "Tags")}</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tags.map(([tag, n]) => {
              const on = res.tags.includes(tag);
              return (
                <button key={tag} type="button" onClick={() => onAddTag(tag)} aria-pressed={on}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${on ? "bg-gold text-white" : "bg-white border border-cream-dark text-warm-brown-light hover:border-gold/30"}`}>
                  #{tag} <span className="opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <section>
        <p className="text-xs font-medium text-warm-brown-light mb-2">
          {hasQuery ? pluralLabel(res.total, t("search.noteOne", "note"), t("search.noteMany", "notes")) : t("search.recentNotes", "Recent notes")}
        </p>
        {res.total === 0 ? (
          <Empty title={t("search.noResults")} hint={t("search.notesHint", "Words match the start of a word; use \"quotes\" for a phrase and #tag for tags.")} />
        ) : (
          <div className="space-y-2">
            {res.results.slice(0, visible).map((n) => (
              <Link key={n.id} to={studyVerseUrl(n)} className="block bg-white border border-cream-dark rounded-xl p-4 hover:border-gold/30 transition-colors">
                <p className="text-xs font-medium text-gold mb-1">{studyRef(n)}</p>
                <p className="text-sm text-warm-brown leading-relaxed break-words">
                  <Marked text={makeSnippet(n.text, isHit, 260, res.phrases)} isHit={isHit} phrases={res.phrases} />
                </p>
                {n.tags?.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {n.tags.map((tg) => (
                      <span key={tg} className={`text-[10px] px-2 py-0.5 rounded-full ${res.tags.some((x) => String(tg).toLowerCase().replace(/^#/, "").startsWith(x)) ? "bg-gold/20 text-warm-brown" : "bg-cream text-warm-brown-light"}`}>
                        #{String(tg).replace(/^#/, "")}
                      </span>
                    ))}
                  </p>
                )}
              </Link>
            ))}
            <MoreButton remaining={res.results.length - visible} onClick={() => setVisible((v) => v + PAGE)} t={t} />
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────── Highlights ─────────────────────────── */

export function HighlightsResults({ q, books, t, color, onColor }) {
  const [res, setRes] = useState(null);
  const [visible, setVisible] = useState(PAGE);
  const [labels] = useState(getHighlightLabels);

  useEffect(() => {
    let cancelled = false;
    searchHighlights(q, { color, books }).then((r) => { if (!cancelled) { setVisible(PAGE); setRes(r); } }).catch(() => { if (!cancelled) setRes({ results: [], total: 0, count: 0, colorCounts: {}, stems: [], phrases: [] }); });
    return () => { cancelled = true; };
  }, [q, books, color]);

  if (!res) return <Spinner label={t("search.searchingHighlights", "Loading your highlights…")} />;
  if (!res.count) return <Empty title={t("search.noHighlights", "No highlighted verses yet.")} hint={t("search.noHighlightsHint", "Tap a verse in the reader to highlight it.")} />;

  const colorName = (c) => {
    const custom = typeof labels[c] === "string" ? labels[c].trim() : "";
    return custom || t(`search.color.${c}`, c.charAt(0).toUpperCase() + c.slice(1));
  };
  const swatch = (c) => HIGHLIGHT_PALETTE.find((p) => p.name === c);
  const stemSet = new Set(res.stems);
  const isHit = (w) => { const s = stem(w); return stemSet.has(s) || res.stems.some((x) => stemMatch(x, s)); };
  const chip = (active) => `whitespace-nowrap inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${active ? "bg-gold text-white" : "bg-white border border-cream-dark text-warm-brown-light hover:border-gold/30"}`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] text-warm-brown-light uppercase tracking-wider mb-1.5">{t("search.color", "Colour")}</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("search.color", "Colour")}>
          <button type="button" onClick={() => onColor("all")} aria-pressed={color === "all"} className={chip(color === "all")}>
            {t("search.allColors", "All")} <span className="opacity-70">{res.count}</span>
          </button>
          {HIGHLIGHT_PALETTE.map((p) => (
            <button key={p.name} type="button" onClick={() => onColor(color === p.name ? "all" : p.name)} aria-pressed={color === p.name} className={chip(color === p.name)}>
              <span aria-hidden="true" className={`w-3 h-3 rounded-full border ${p.bg} ${p.border}`} />
              {colorName(p.name)} <span className="opacity-70">{res.colorCounts[p.name] || 0}</span>
            </button>
          ))}
        </div>
      </div>
      <section>
        <p className="text-xs font-medium text-warm-brown-light mb-2">
          {pluralLabel(res.total, t("search.highlightOne", "highlighted verse"), t("search.highlightMany", "highlighted verses"))}
        </p>
        {res.total === 0 ? (
          <Empty title={t("search.noResults")} hint={t("search.highlightsHint", "Try another colour or fewer words.")} />
        ) : (
          <div className="space-y-2">
            {res.results.slice(0, visible).map((h) => {
              const sw = swatch(h.color);
              return (
                <Link key={h.id} to={studyVerseUrl(h)} className="block bg-white border border-cream-dark rounded-xl p-4 hover:border-gold/30 transition-colors">
                  <p className="text-xs font-medium text-gold mb-1 flex items-center gap-1.5">
                    <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full border ${sw ? `${sw.bg} ${sw.border}` : "bg-cream border-cream-dark"}`} />
                    {studyRef(h)}
                    <span className="sr-only">({colorName(h.color || "")})</span>
                    {labels[h.color] && <span className="text-[10px] font-normal text-warm-brown-light">· {labels[h.color]}</span>}
                  </p>
                  <p className={`font-scripture text-sm text-warm-brown leading-relaxed rounded px-1 -mx-1 ${sw ? sw.bg : ""}`}>
                    {h.text ? <Marked text={h.text} isHit={isHit} phrases={res.phrases} /> : <span className="italic text-warm-brown-light">{studyRef(h)}</span>}
                  </p>
                </Link>
              );
            })}
            <MoreButton remaining={res.results.length - visible} onClick={() => setVisible((v) => v + PAGE)} t={t} />
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────── Commentaries ─────────────────────────── */

export function CommentaryResults({ q, books, commentary, t }) {
  // { req, data | error } — a result belongs to one request, so stale ones read as "loading"
  const [out, setOut] = useState(null);
  const [visible, setVisible] = useState(PAGE);
  const req = useMemo(() => ({ q, books, commentary }), [q, books, commentary]);

  useEffect(() => {
    if (!req.q.trim()) return;
    let cancelled = false;
    import("../../services/commentarySearch")
      .then((m) => m.searchCommentaries(req.q, { books: req.books, commentary: req.commentary }))
      .then((data) => { if (!cancelled) { setVisible(PAGE); setOut({ req, data }); } })
      .catch(() => { if (!cancelled) setOut({ req, error: true }); });
    return () => { cancelled = true; };
  }, [req]);

  if (!q.trim()) {
    return <Empty title={t("search.commentaryHint", "Search the commentaries stored in the app — Barnes, Spurgeon, Wesley, Vincent and more.")}
      hint={t("search.commentaryExample", "Try a word like propitiation, or several words for sections that use them all.")} />;
  }
  const current = out?.req === req ? out : null;
  const res = current?.data || null;
  const error = !!current?.error;
  if (error) return <Empty title={t("search.commentaryError", "Couldn't load the commentary index.")} hint={t("search.offlineHint", "Check your connection and try again.")} />;
  if (!res) return <Spinner label={t("search.searchingCommentaries", "Searching commentaries…")} />;
  if (!res.total) return <Empty title={t("search.noResults")} hint={t("search.noResultsHint")} />;

  const termSet = new Set(res.terms);
  const isHit = (w) => termSet.has(w);
  return (
    <section>
      <p className="text-xs font-medium text-warm-brown-light">
        {pluralLabel(res.total, t("search.commentarySectionOne", "commentary section"), t("search.commentarySectionMany", "commentary sections"))}
      </p>
      {res.relaxed && <p className="text-[11px] text-warm-brown-light/70">{t("search.noCommentaryAllWords", "No section has every word — showing the closest matches")}</p>}
      <div className="space-y-2 mt-2">
        {res.results.slice(0, visible).map((r) => <CommentaryCard key={r.key} r={r} isHit={isHit} phrases={res.phrases} t={t} />)}
        <MoreButton remaining={res.results.length - visible} onClick={() => setVisible((v) => v + PAGE)} t={t} />
      </div>
    </section>
  );
}

function CommentaryCard({ r, isHit, phrases, t }) {
  const ref = useRef(null);
  const [section, setSection] = useState(undefined); // undefined = not loaded, null = missing
  const [expanded, setExpanded] = useState(false);

  // Fetch the section text only once the card scrolls near the viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const load = () => import("../../services/commentarySearch").then((m) => m.loadCommentarySection(r))
      .then((s) => { if (!cancelled) setSection(s || null); }).catch(() => { if (!cancelled) setSection(null); });
    if (typeof IntersectionObserver === "undefined") { load(); return () => { cancelled = true; }; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [r]);

  const verseLabel = r.verse === 0 ? null : (section?.label || String(r.verse));
  const refText = `${r.book} ${r.chapter}${verseLabel ? `:${verseLabel}` : ""}`;
  const to = `/read/${encodeURIComponent(r.book)}/${r.chapter}${r.verse ? `?verse=${r.verse}` : ""}`;
  // The index only knows a section has the words; once loaded, check the quoted phrase itself
  const flat = section ? section.text.toLowerCase().replace(/\s+/g, " ") : "";
  const phraseMissing = !!section && phrases.length > 0 && !phrases.every((p) => flat.includes(p));

  return (
    <div ref={ref} className={`bg-white border border-cream-dark rounded-xl p-4 ${phraseMissing ? "opacity-60" : ""}`}>
      <Link to={to} className="block group">
        <p className="text-xs font-medium text-gold mb-1 group-hover:underline">
          {r.name} {t("search.on", "on")} {refText}
          {r.verse === 0 && <span className="font-normal text-warm-brown-light"> · {t("search.introduction", "introduction")}</span>}
          {phraseMissing && <span className="block font-normal text-[11px] text-warm-brown-light">{t("search.wordsApart", "Has the words, but not as an exact phrase")}</span>}
        </p>
      </Link>
      {section === undefined && (
        <div className="space-y-1.5 py-1" aria-hidden="true">
          <div className="h-2.5 bg-cream-dark/60 rounded w-full animate-pulse" />
          <div className="h-2.5 bg-cream-dark/60 rounded w-4/5 animate-pulse" />
        </div>
      )}
      {section === null && <p className="text-xs text-warm-brown-light italic">{t("search.snippetUnavailable", "Preview unavailable — open the reader to see this note.")}</p>}
      {section && (
        <>
          <p className={`text-sm text-warm-brown leading-relaxed break-words ${expanded ? "whitespace-pre-line" : ""}`}>
            <Marked text={expanded ? section.text.trim() : makeSnippet(section.text, isHit, 260, phrases)} isHit={isHit} phrases={phrases} />
          </p>
          <div className="flex items-center justify-between mt-2">
            {section.text.replace(/\s+/g, " ").trim().length > 260 ? (
              <button type="button" onClick={() => setExpanded((x) => !x)} aria-expanded={expanded} className="text-xs text-gold font-medium py-1">
                {expanded ? t("search.showLess", "Show less") : t("search.readMore", "Read more")}
              </button>
            ) : <span />}
            <Link to={to} className="text-xs text-warm-brown-light hover:text-gold py-1">{t("search.openInReader", "Open in reader")} →</Link>
          </div>
        </>
      )}
    </div>
  );
}
