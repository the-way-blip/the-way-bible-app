import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import usePageMeta from "../hooks/usePageMeta";
import bibleBooks from "../data/bibleBooks";
import useT from "../hooks/useT";
import {
  loadIndex, parseReference, lookupReference, keywordSearch, suggestCorrection,
  matchTopic, matchBook, parseStrongs, getLexicon, getConcordance, lookupOriginalWord, lexiconSummary, stem,
} from "../services/bibleSearch";
import { parseRef } from "../utils/scriptureRef";

const TOPIC_CHIPS = ["Faith", "Love", "Prayer", "Salvation", "Grace", "Peace", "Hope", "Forgiveness", "Wisdom", "Strength", "Joy", "Anxiety"];
const EXAMPLES = ["John 3:16", "Psalm 23", "faith hope love", "what does the Bible say about anxiety", "\"be still\"", "H430"];
const PAGE = 40;

function getSearchHistory() {
  try { return JSON.parse(localStorage.getItem("searchHistory") || "[]"); } catch { return []; }
}
function addToHistory(query) {
  const history = getSearchHistory().filter((h) => h !== query);
  history.unshift(query);
  localStorage.setItem("searchHistory", JSON.stringify(history.slice(0, 10)));
}

const verseUrl = (r) => `/read/${encodeURIComponent(r.book)}/${r.chapter}?v=${r.verse}`;

export default function Search() {
  useDocumentTitle("Search Scripture");
  const t = useT();
  usePageMeta({
    description: "Search the King James Bible by reference, keyword, phrase, topic, question, or Strong's number across all 66 books.",
    ogTitle: "Search Scripture — TheWay Bible App",
  });

  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [state, setState] = useState(null); // result bundle
  const [loading, setLoading] = useState(false);
  const [indexReady, setIndexReady] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [testamentFilter, setTestamentFilter] = useState("all");
  const [bookFilter, setBookFilter] = useState("all");
  const [matchType, setMatchType] = useState("all"); // all | any | exact
  const [visible, setVisible] = useState(PAGE);
  const inputRef = useRef(null);
  const runId = useRef(0);

  useEffect(() => { loadIndex().then(() => setIndexReady(true)); }, []);

  const booksByTestament = useMemo(
    () => (testamentFilter === "all" ? bibleBooks : bibleBooks.filter((b) => b.testament === testamentFilter)),
    [testamentFilter]
  );
  const activeFilterCount = (testamentFilter !== "all" ? 1 : 0) + (bookFilter !== "all" ? 1 : 0) + (matchType !== "all" ? 1 : 0);

  const runSearch = useCallback(async (raw, { record = true, corrected = null } = {}) => {
    const q = raw.trim();
    if (!q) { setState(null); return; }
    const id = ++runId.current;
    setLoading(true);
    setVisible(PAGE);
    if (record) addToHistory(q);
    await loadIndex();
    if (id !== runId.current) return;

    const books = (testamentFilter !== "all" || bookFilter !== "all")
      ? new Set(bibleBooks.filter((b) => (testamentFilter === "all" || b.testament === testamentFilter) && (bookFilter === "all" || b.name === bookFilter)).map((b) => b.name))
      : null;

    const bundle = { query: q, corrected, reference: null, refVerses: [], book: null, strongs: null, original: [], topic: null, verses: null, suggestion: null, relaxed: false };

    // 1. Reference ("john 3:16", "ps 23", "1cor13")
    const ref = parseReference(q);
    if (ref?.chapter) {
      bundle.reference = ref;
      bundle.refVerses = lookupReference(ref);
    } else if (ref) {
      bundle.book = matchBook(q);
    }

    // 2. Strong's number
    const strongsId = parseStrongs(q);
    if (strongsId) {
      const [lex, conc] = await Promise.all([getLexicon(), getConcordance()]);
      if (id !== runId.current) return;
      const entry = lex[strongsId];
      const refs = (conc[strongsId] || []).slice(0, 8);
      bundle.strongs = entry || refs.length ? { id: strongsId, entry, refs } : null;
    }

    // 3. Keywords / phrases / questions (skip when it's clearly a reference)
    if (!bundle.reference && !strongsId) {
      bundle.topic = matchTopic(q);
      let kw = keywordSearch(q, { books, mode: matchType });
      if (kw.total === 0 && matchType === "all" && kw.terms.length > 1) {
        kw = keywordSearch(q, { books, mode: "any" });
        bundle.relaxed = kw.total > 0;
      }
      if (kw.terms.length === 1 && kw.total < 200) {
        try { bundle.original = await lookupOriginalWord(kw.terms[0]); } catch {}
        if (id !== runId.current) return;
      }
      // Only auto-correct when nothing at all matched (a transliteration like "agape" is a real hit)
      if (kw.total === 0 && !bundle.original.length && !bundle.topic && !corrected) {
        const suggestion = suggestCorrection(q);
        if (suggestion && suggestion !== q.toLowerCase()) {
          return runSearch(suggestion, { record: false, corrected: q });
        }
      }
      bundle.verses = kw;
    }

    setState(bundle);
    setLoading(false);
  }, [testamentFilter, bookFilter, matchType]);

  // Search from the URL on load / back-forward
  useEffect(() => {
    const q = params.get("q") || "";
    setQuery(q);
    if (q) runSearch(q, { record: false });
    else setState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Re-run when filters change
  useEffect(() => {
    if (state?.query) runSearch(state.query, { record: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testamentFilter, bookFilter, matchType]);

  // Live search while typing (after the index is in memory)
  useEffect(() => {
    if (!indexReady) return;
    const q = query.trim();
    if (q.length < 3 || q === (params.get("q") || "")) return;
    const timer = setTimeout(() => runSearch(q, { record: false }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, indexReady]);

  const submit = (q) => {
    const trimmed = (q ?? query).trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setShowHistory(false);
    inputRef.current?.blur();
    addToHistory(trimmed);
    if (trimmed === (params.get("q") || "")) runSearch(trimmed, { record: false });
    else setParams({ q: trimmed });
  };

  const history = getSearchHistory();
  const hasResults = state && (state.refVerses.length || state.book || state.strongs || state.original.length || state.topic || state.verses?.total);
  const searched = !!state && !loading;

  return (
    <div className="flex max-w-6xl mx-auto">
      <div className="flex-1 min-w-0 px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-warm-brown mb-3">{t("search.scriptureTitle")}</h1>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-2 mb-2 relative">
          <div className="flex-1 relative">
            <label className="sr-only" htmlFor="search-input">{t("search.searchHint")}</label>
            <input
              id="search-input"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              placeholder={t("search.unifiedPlaceholder", "Reference, word, phrase, topic, or question…")}
              autoComplete="off"
              enterKeyHint="search"
              className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            {showHistory && history.length > 0 && !query && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-cream-dark rounded-xl shadow-lg z-20 py-1">
                <p className="px-3 py-1 text-[10px] text-warm-brown-light uppercase tracking-wider">{t("search.recent")}</p>
                {history.map((h) => (
                  <button key={h} type="button" onMouseDown={(e) => { e.preventDefault(); submit(h); }}
                    className="w-full text-left px-3 py-2 text-sm text-warm-brown hover:bg-cream transition-colors flex items-center gap-2">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-warm-brown-light/50 shrink-0">
                      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} aria-label={t("search.title")} className="bg-gold text-white rounded-xl px-4 py-3 hover:bg-gold/90 disabled:opacity-50 transition-colors">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        {/* Filters */}
        <div className="mb-4">
          <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-brown-light hover:text-warm-brown py-1.5 px-2 -ml-2 rounded-lg hover:bg-cream-dark/40 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {t("search.filters")}
            {activeFilterCount > 0 && <span className="ml-1 bg-gold text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{activeFilterCount}</span>}
          </button>
          {showFilters && (
            <div className="mt-2 bg-white border border-cream-dark rounded-xl p-3 space-y-3">
              <div>
                <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-1.5">{t("search.testament")}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ v: "all", l: t("search.allShort") }, { v: "OT", l: t("search.oldShort") }, { v: "NT", l: t("search.newShort") }].map((opt) => (
                    <button key={opt.v} type="button"
                      onClick={() => { setTestamentFilter(opt.v); if (opt.v !== "all" && bookFilter !== "all" && !bibleBooks.find((b) => b.name === bookFilter && b.testament === opt.v)) setBookFilter("all"); }}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${testamentFilter === opt.v ? "bg-gold text-white" : "bg-cream text-warm-brown-light hover:bg-cream-dark"}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="book-filter" className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-1.5 block">{t("search.book")}</label>
                <select id="book-filter" value={bookFilter} onChange={(e) => setBookFilter(e.target.value)}
                  className="w-full bg-cream border border-cream-dark rounded-lg px-3 py-2 text-sm text-warm-brown focus:outline-none focus:border-gold/30">
                  <option value="all">{t("search.allBooks")}</option>
                  {booksByTestament.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-1.5">{t("search.matchType")}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ v: "all", l: t("search.allWords") }, { v: "any", l: t("search.anyWord") }, { v: "exact", l: t("search.exact") }].map((opt) => (
                    <button key={opt.v} type="button" onClick={() => setMatchType(opt.v)}
                      className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors ${matchType === opt.v ? "bg-gold text-white" : "bg-cream text-warm-brown-light hover:bg-cream-dark"}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button type="button" onClick={() => { setTestamentFilter("all"); setBookFilter("all"); setMatchType("all"); }}
                  className="w-full text-xs text-warm-brown-light hover:text-warm-brown py-1">{t("search.resetFilters")}</button>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!state && !loading && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-warm-brown-light uppercase tracking-wider mb-2">{t("search.tryExamples", "Try")}</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button key={ex} type="button" onClick={() => submit(ex)}
                    className="bg-white border border-cream-dark rounded-full px-3 py-1.5 text-xs text-warm-brown hover:border-gold/30 hover:bg-gold/5 transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-warm-brown-light uppercase tracking-wider mb-2">{t("topics.title")}</p>
              <div className="grid grid-cols-3 gap-2">
                {TOPIC_CHIPS.map((topic) => (
                  <button key={topic} type="button" onClick={() => submit(topic)}
                    className="bg-white border border-cream-dark rounded-xl px-3 py-3 text-sm text-warm-brown hover:border-gold/30 hover:bg-gold/5 transition-colors text-center">
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-warm-brown-light uppercase tracking-wider mb-2">{t("search.popular")}</p>
              <div className="space-y-2">
                {["John 3:16", "Romans 8:28", "Philippians 4:13", "Proverbs 3:5-6", "Isaiah 41:10", "Jeremiah 29:11"].map((ref) => (
                  <button key={ref} type="button" onClick={() => submit(ref)}
                    className="block w-full text-left bg-white border border-cream-dark rounded-lg px-4 py-2.5 text-sm text-warm-brown hover:border-gold/30 transition-colors">
                    {ref}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2" role="status">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-warm-brown-light">{indexReady ? t("search.searchingAll") : t("search.loadingIndex", "Loading the Bible…")}</span>
            </div>
          )}
          {searched && !hasResults && (
            <div className="text-center py-8">
              <p className="text-sm text-warm-brown-light">{t("search.noResults")}</p>
              <p className="text-xs text-warm-brown-light/70 mt-1">{t("search.noResultsHint")}</p>
            </div>
          )}
        </div>

        {searched && hasResults && (
          <div className="space-y-5">
            {state.corrected && (
              <p className="text-xs text-warm-brown-light bg-cream-dark/40 rounded-lg px-3 py-2">
                {t("search.showingResultsFor", "Showing results for")} <strong className="text-warm-brown">{state.query}</strong>.{" "}
                <button type="button" className="text-gold underline" onClick={() => runSearch(state.corrected, { corrected: "__none__" })}>
                  {t("search.searchInsteadFor", "Search instead for")} “{state.corrected}”
                </button>
              </p>
            )}

            {/* Reference */}
            {state.refVerses.length > 0 && (
              <ResultSection title={state.reference.verse ? t("search.verseReference") : `${state.reference.book} ${state.reference.chapter}`}
                action={<Link to={`/read/${encodeURIComponent(state.reference.book)}/${state.reference.chapter}${state.reference.verse ? `?v=${state.reference.verse}` : ""}`} className="text-xs text-gold font-medium">{t("search.readChapter", "Read chapter")} →</Link>}>
                {state.refVerses.slice(0, state.reference.verse ? 200 : 6).map((r) => <VerseCard key={r.ref} r={r} />)}
                {!state.reference.verse && state.refVerses.length > 6 && (
                  <Link to={`/read/${encodeURIComponent(state.reference.book)}/${state.reference.chapter}`} className="block text-center text-xs text-gold py-2">
                    {t("search.allVersesInChapter", "All")} {state.refVerses.length} {t("search.verses", "verses")} →
                  </Link>
                )}
              </ResultSection>
            )}
            {state.reference && state.refVerses.length === 0 && (
              <p className="text-sm text-warm-brown-light">{t("search.refNotFound", "That reference doesn't exist in this book.")}</p>
            )}

            {/* Book */}
            {state.book && (
              <Link to={`/read/${encodeURIComponent(state.book.name)}/1`} className="flex items-center justify-between bg-white border border-cream-dark rounded-xl px-4 py-3 hover:border-gold/30 transition-colors">
                <div>
                  <p className="text-[10px] text-warm-brown-light uppercase tracking-wider">{t("search.openBook", "Open book")}</p>
                  <p className="font-serif font-bold text-warm-brown">{state.book.name}</p>
                </div>
                <span className="text-xs text-warm-brown-light">{state.book.chapters} {t("search.chapters", "chapters")} →</span>
              </Link>
            )}

            {/* Strong's */}
            {state.strongs && <StrongsCard s={state.strongs} t={t} />}

            {/* Original-language word (agape, shalom, λόγος) */}
            {state.original.length > 0 && (
              <ResultSection title={t("search.originalWord", "Original language")}>
                {state.original.map(({ id, entry }) => (
                  <Link key={id} to={`/word/${id}`} className="block bg-white border border-cream-dark rounded-xl px-4 py-3 hover:border-gold/30 transition-colors">
                    <p className="text-sm text-warm-brown"><span className="font-serif text-lg mr-2">{entry.Hb_word || entry.Gk_word || entry.lemma}</span><span className="italic">{entry.transliteration || entry.translit}</span> <span className="text-xs text-gold ml-1">{id}</span></p>
                    {lexiconSummary(entry) && <p className="text-xs text-warm-brown-light mt-1 line-clamp-2">{lexiconSummary(entry)}</p>}
                  </Link>
                ))}
              </ResultSection>
            )}

            {/* Topic */}
            {state.topic && <TopicCard topic={state.topic} t={t} />}

            {/* Ranked verses */}
            {state.verses && state.verses.total > 0 && (
              <ResultSection
                title={`${state.verses.total.toLocaleString()} ${t("search.results")}`}
                subtitle={state.relaxed ? t("search.noAllWords", "No verse has every word — showing the closest matches") : null}>
                {state.verses.results.slice(0, visible).map((r) => (
                  <VerseCard key={r.ref} r={r} stems={state.verses.highlight} phrases={state.verses.highlightPhrases} dim={state.relaxed && !r.full} />
                ))}
                {state.verses.results.length > visible && (
                  <button type="button" onClick={() => setVisible((v) => v + PAGE)}
                    className="w-full text-center text-xs font-medium text-gold py-3 bg-white border border-cream-dark rounded-xl hover:border-gold/30">
                    {t("search.showMore", "Show more")} ({state.verses.results.length - visible})
                  </button>
                )}
                {state.verses.total > state.verses.results.length && state.verses.results.length <= visible && (
                  <p className="text-xs text-warm-brown-light text-center py-2">{t("search.showingFirstN", "Showing the top")} {state.verses.results.length} — {t("search.narrowHint", "narrow with filters or more words")}</p>
                )}
              </ResultSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, subtitle, action, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <p className="text-xs font-medium text-warm-brown-light">{title}</p>
          {subtitle && <p className="text-[11px] text-warm-brown-light/70">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function VerseCard({ r, stems, phrases, dim }) {
  return (
    <Link to={verseUrl(r)} className={`block bg-white border border-cream-dark rounded-xl p-4 hover:border-gold/30 transition-colors ${dim ? "opacity-70" : ""}`}>
      <p className="text-xs font-medium text-gold mb-1">{r.ref}</p>
      <p className="font-scripture text-sm text-warm-brown leading-relaxed">
        <HighlightedText text={r.text} stems={stems} phrases={phrases} />
      </p>
    </Link>
  );
}

function StrongsCard({ s, t }) {
  const e = s.entry || {};
  return (
    <ResultSection title={`Strong's ${s.id}`} action={<Link to={`/word/${s.id}`} className="text-xs text-gold font-medium">{t("search.wordStudy", "Word study")} →</Link>}>
      <Link to={`/word/${s.id}`} className="block bg-white border border-cream-dark rounded-xl px-4 py-3 hover:border-gold/30 transition-colors">
        <p className="text-warm-brown"><span className="font-serif text-2xl mr-2">{e.Hb_word || e.Gk_word || e.lemma || ""}</span><span className="italic">{e.transliteration || e.translit || ""}</span></p>
        {lexiconSummary(e) && <p className="text-xs text-warm-brown-light mt-1 line-clamp-2">{lexiconSummary(e)}</p>}
      </Link>
      {s.refs.map((r) => {
        const ref = parseRef(r.r);
        const to = ref ? `/read/${encodeURIComponent(ref.book === "Psalm" ? "Psalms" : ref.book)}/${ref.chapter}${ref.verse ? `?v=${ref.verse}` : ""}` : "/search";
        return (
          <Link key={r.r} to={to} className="block bg-white border border-cream-dark rounded-xl p-4 hover:border-gold/30 transition-colors">
            <p className="text-xs font-medium text-gold mb-1">{r.r}</p>
            <p className="font-scripture text-sm text-warm-brown leading-relaxed">{r.t}</p>
          </Link>
        );
      })}
    </ResultSection>
  );
}

function TopicCard({ topic, t }) {
  const [verses, setVerses] = useState([]);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadIndex().then(() => {
      if (cancelled) return;
      const out = [];
      for (const refStr of topic.verses) {
        const ref = parseReference(refStr);
        if (!ref) continue;
        const found = lookupReference(ref);
        if (found.length) out.push({ label: refStr, first: found[0], text: found.map((v) => v.text).join(" ") });
      }
      setVerses(out);
    });
    return () => { cancelled = true; };
  }, [topic]);
  const shown = expanded ? verses : verses.slice(0, 4);
  return (
    <ResultSection title={`${t("search.keyVersesOn", "Key verses on")} ${topic.name}`} action={<Link to="/topics" className="text-xs text-gold font-medium">{t("topics.title")} →</Link>}>
      {shown.map((v) => (
        <Link key={v.label} to={verseUrl(v.first)} className="block bg-gold/5 border border-gold/20 rounded-xl p-4 hover:border-gold/40 transition-colors">
          <p className="text-xs font-medium text-gold mb-1">{v.label}</p>
          <p className="font-scripture text-sm text-warm-brown leading-relaxed line-clamp-3">{v.text}</p>
        </Link>
      ))}
      {verses.length > 4 && (
        <button type="button" onClick={() => setExpanded((x) => !x)} className="w-full text-xs text-gold py-1">
          {expanded ? t("search.showLess", "Show less") : `${t("search.showMore", "Show more")} (${verses.length - 4})`}
        </button>
      )}
    </ResultSection>
  );
}

function HighlightedText({ text, stems, phrases }) {
  if (!text || (!stems?.length && !phrases?.length)) return text;
  const stemSet = new Set(stems || []);
  const lower = text.toLowerCase();
  // Mark phrase spans first, then individual stem matches outside them
  const spans = [];
  for (const p of phrases || []) {
    let i = lower.indexOf(p);
    while (i !== -1) { spans.push([i, i + p.length]); i = lower.indexOf(p, i + 1); }
  }
  const inSpan = (i) => spans.some(([a, b]) => i >= a && i < b);
  const parts = [];
  const re = /[A-Za-z][A-Za-z'-]*|[^A-Za-z]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const word = m[0];
    const isWord = /^[A-Za-z]/.test(word);
    const hit = isWord && (stemSet.has(stem(word)) || inSpan(m.index));
    parts.push(hit ? <mark key={m.index} className="bg-gold/20 text-warm-brown rounded-sm px-0.5">{word}</mark> : word);
  }
  return <>{parts}</>;
}
