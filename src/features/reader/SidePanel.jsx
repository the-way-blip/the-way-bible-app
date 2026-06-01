import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { getChapterCrossReferences } from "../../services/crossReferences";
import { fetchCommentaries } from "../../services/commentaryService";
import { USFM_BOOK_IDS } from "../../data/translations";
import useJournal from "../../hooks/useJournal";
import { tokenizeRefs } from "../../utils/scriptureRef";
import useT from "../../hooks/useT";

export default function SidePanel({
  book,
  chapter,
  activeWordInfo,
  selectedVerse,
  translation,
}) {
  const t = useT();
  const TABS = [
    { id: "wordstudy",  label: t("panel.tabStudy") },
    { id: "crossrefs",  label: t("panel.tabRefs") },
    { id: "commentary", label: t("panel.tabCommentary") },
    { id: "compare",    label: t("panel.tabCompare") },
    { id: "journal",    label: t("panel.tabJournal") },
  ];
  const [activeTab, setActiveTab] = useState("wordstudy");
  const [lastWordInfo, setLastWordInfo] = useState(null);

  useEffect(() => {
    if (activeWordInfo) {
      setLastWordInfo(activeWordInfo);
      setActiveTab("wordstudy");
    }
  }, [activeWordInfo]);

  const displayedWord = activeWordInfo || lastWordInfo;

  return (
    <aside className="flex flex-col h-full bg-white border-l border-cream-dark w-full" aria-label="Study panel">
      {/* Tabs — scrollable so 6 fit without wrapping */}
      <div
        className="flex border-b border-cream-dark shrink-0 overflow-x-auto scrollbar-hide"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3 min-h-[44px] text-xs font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? "text-gold"
                : "text-warm-brown-light hover:text-warm-brown"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content — all tabs stay mounted, only active one visible */}
      <div className="flex-1 min-h-0 relative">
        <TabPane id="panel-wordstudy" labelledBy="tab-wordstudy" visible={activeTab === "wordstudy"}>
          <WordStudyTab wordInfo={displayedWord} />
        </TabPane>
        <TabPane id="panel-crossrefs" labelledBy="tab-crossrefs" visible={activeTab === "crossrefs"}>
          <CrossRefsTab book={book} chapter={chapter} />
        </TabPane>
        <TabPane id="panel-commentary" labelledBy="tab-commentary" visible={activeTab === "commentary"}>
          <CommentaryTab book={book} chapter={chapter} />
        </TabPane>
        <TabPane id="panel-compare" labelledBy="tab-compare" visible={activeTab === "compare"}>
          <CompareTab
            book={book}
            chapter={chapter}
            selectedVerse={selectedVerse}
            currentTranslation={translation}
          />
        </TabPane>
        <TabPane id="panel-journal" labelledBy="tab-journal" visible={activeTab === "journal"}>
          <JournalTab book={book} chapter={chapter} />
        </TabPane>
      </div>
    </aside>
  );
}

// Keep tab mounted but hidden when not active — preserves state & scroll
function TabPane({ id, labelledBy, visible, children }) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="absolute inset-0 overflow-y-auto overscroll-contain"
      style={{ visibility: visible ? "visible" : "hidden", zIndex: visible ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

/* ─── Commentary Tab ─── */
function CommentaryTab({ book, chapter }) {
  const t = useT();
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCommentaries([]);
    setExpanded(null);
    fetchCommentaries(book, chapter).then((data) => {
      if (!cancelled) {
        setCommentaries(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [book, chapter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-warm-brown-light">{t("panel.loadingCommentaries")}</span>
      </div>
    );
  }

  if (commentaries.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mx-auto text-cream-dark mb-3">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <p className="text-sm text-warm-brown-light">{t("panel.noCommentary")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-2 bg-cream/50 border-b border-cream-dark">
        <p className="text-[10px] text-warm-brown-light">
          {book} {chapter} — {t("panel.classicalCommentaries")}
        </p>
      </div>
      <div className="divide-y divide-cream-dark">
        {commentaries.map((c, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full px-4 py-3 flex items-start justify-between text-left hover:bg-cream/40 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-warm-brown">{c.author}</p>
                  <p className="text-[10px] text-warm-brown-light mt-0.5">
                    {c.date && <span>{c.date}</span>}
                    {c.style && <span className="ml-1 opacity-70">· {c.style}</span>}
                  </p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`w-4 h-4 text-warm-brown-light/50 shrink-0 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1">
                  <p className="text-xs text-warm-brown leading-relaxed whitespace-pre-wrap">
                    {c.quote}
                  </p>
                  <p className="text-[9px] text-warm-brown-light/40 mt-2">{t("panel.source")} {c.source}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Compare Tab ─── */
const COMPARE_TRANSLATIONS = [
  { id: "KJV",  name: "King James Version",    short: "KJV",  source: "bible-api" },
  { id: "CSB",  name: "Christian Standard",     short: "CSB",  source: "api-bible", bibleId: "a556c5305ee15c3f-01" },
  { id: "NLT",  name: "New Living Translation", short: "NLT",  source: "api-bible", bibleId: "d6e14a625393b4da-01" },
  { id: "AMP",  name: "Amplified Bible",        short: "AMP",  source: "api-bible", bibleId: "a81b73293d3080c9-01" },
  { id: "ASV",  name: "American Standard",      short: "ASV",  source: "api-bible", bibleId: "06125adad2d5898a-01" },
];

async function fetchVerseText(translation, book, chapter, verse) {
  if (translation.source === "bible-api") {
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(book)}+${chapter}:${verse}?translation=kjv`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.text?.trim() || null;
  }

  // API.Bible — via our verse proxy
  const bookId = USFM_BOOK_IDS[book];
  if (!bookId) return null;
  const res = await fetch(
    `/api/bible-verse?bibleId=${translation.bibleId}&book=${bookId}&chapter=${chapter}&verse=${verse}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.text?.trim() || null;
}

function CompareTab({ book, chapter, selectedVerse, currentTranslation }) {
  const t = useT();
  const [verse, setVerse] = useState(selectedVerse || 1);
  const [inputVerse, setInputVerse] = useState(String(selectedVerse || 1));
  const [results, setResults] = useState({}); // { translationId: { text, loading, error } }

  // Sync when selectedVerse changes from outside (user taps a verse number)
  useEffect(() => {
    if (selectedVerse && selectedVerse !== verse) {
      setVerse(selectedVerse);
      setInputVerse(String(selectedVerse));
    }
  }, [selectedVerse]); // eslint-disable-line react-hooks/exhaustive-deps

  const runCompare = useCallback(
    async (verseNum) => {
      const init = {};
      COMPARE_TRANSLATIONS.forEach((t) => { init[t.id] = { loading: true }; });
      setResults(init);

      await Promise.all(
        COMPARE_TRANSLATIONS.map(async (t) => {
          try {
            const text = await fetchVerseText(t, book, chapter, verseNum);
            setResults((prev) => ({ ...prev, [t.id]: { text, loading: false } }));
          } catch {
            setResults((prev) => ({ ...prev, [t.id]: { text: null, loading: false } }));
          }
        })
      );
    },
    [book, chapter]
  );

  // Auto-load when verse or chapter changes
  useEffect(() => {
    runCompare(verse);
  }, [verse, runCompare]);

  // Also reload when book/chapter changes
  useEffect(() => {
    const v = selectedVerse || 1;
    setVerse(v);
    setInputVerse(String(v));
  }, [book, chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGo = () => {
    const v = parseInt(inputVerse, 10);
    if (v > 0) setVerse(v);
  };

  return (
    <div className="p-3 space-y-2">
      {/* Verse picker */}
      <div className="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
        <span className="text-xs text-warm-brown-light shrink-0">{book} {chapter}:</span>
        <input
          type="number"
          value={inputVerse}
          min="1"
          onChange={(e) => setInputVerse(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGo()}
          className="w-14 bg-white rounded-lg px-2 py-1 text-xs text-center text-warm-brown focus:outline-none focus:ring-1 focus:ring-gold/30"
        />
        <button
          type="button"
          onClick={handleGo}
          className="text-xs text-gold font-medium hover:text-gold/80 transition-colors"
        >
          {t("panel.compare")}
        </button>
        {!selectedVerse && (
          <span className="text-[10px] text-warm-brown-light/50 ml-auto">{t("panel.tapVerseHint")}</span>
        )}
      </div>

      {/* Translation cards */}
      {COMPARE_TRANSLATIONS.map((t) => {
        const r = results[t.id];
        const isCurrent = t.id === currentTranslation;
        return (
          <div
            key={t.id}
            className={`bg-white rounded-xl border p-3 transition-colors ${
              isCurrent ? "border-gold/50 ring-1 ring-gold/20" : "border-cream-dark"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-gold">{t.short}</span>
              <span className="text-[10px] text-warm-brown-light">{t.name}</span>
              {isCurrent && (
                <span className="ml-auto text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full font-medium">
                  {t("panel.active")}
                </span>
              )}
            </div>
            {!r || r.loading ? (
              <div className="flex items-center gap-1.5 py-1">
                <div className="w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                <span className="text-[10px] text-warm-brown-light/50">{t("general.loading")}</span>
              </div>
            ) : r.text ? (
              <p className="text-xs text-warm-brown leading-relaxed font-scripture">{r.text}</p>
            ) : (
              <p className="text-[10px] text-warm-brown-light/40 italic">{t("panel.notAvailable")}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Cross-References Tab ─── */
function CrossRefsTab({ book, chapter }) {
  const t = useT();
  const [refs, setRefs] = useState({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setExpanded({});
    getChapterCrossReferences(book, chapter).then((data) => {
      if (!cancelled) {
        setRefs(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [book, chapter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-warm-brown-light">{t("panel.loadingRefs")}</span>
      </div>
    );
  }

  const verseNums = Object.keys(refs).map(Number).sort((a, b) => a - b);

  if (verseNums.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mx-auto text-cream-dark mb-3">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <p className="text-sm text-warm-brown-light">{t("panel.noRefs")}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-cream-dark">
      <div className="px-4 py-2 bg-cream/50">
        <p className="text-[10px] text-warm-brown-light">
          Treasury of Scripture Knowledge — {book} {chapter}
        </p>
      </div>
      {verseNums.map((v) => {
        const verseRefs = refs[v];
        const isExpanded = expanded[v];
        const shown = isExpanded ? verseRefs : verseRefs.slice(0, 3);

        return (
          <div key={v} className="px-4 py-3">
            <button
              type="button"
              onClick={() => setExpanded((p) => ({ ...p, [v]: !p[v] }))}
              className="flex items-center gap-2 mb-2 w-full text-left"
            >
              <span className="text-xs font-semibold text-gold">{book} {chapter}:{v}</span>
              <span className="text-[10px] text-warm-brown-light/60">{verseRefs.length} {t("panel.refs")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`w-3 h-3 text-warm-brown-light/40 ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="flex flex-wrap gap-1.5">
              {shown.map((ref, i) => (
                <Link
                  key={i}
                  to={`/read/${encodeURIComponent(ref.b)}/${ref.c}`}
                  className="text-[11px] bg-cream hover:bg-gold/10 text-warm-brown px-2.5 py-1 rounded-lg transition-colors hover:text-gold"
                >
                  {ref.r}
                </Link>
              ))}
              {!isExpanded && verseRefs.length > 3 && (
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [v]: true }))}
                  className="text-[10px] text-gold px-2 py-1"
                >
                  +{verseRefs.length - 3} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Word Study Tab ─── */
function WordStudyTab({ wordInfo }) {
  const t = useT();
  const [chipSearch, setChipSearch] = useState(null);

  if (!wordInfo) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-warm-brown-light">{t("panel.tapToStudy")}</p>
        <p className="text-xs text-warm-brown-light/60 mt-1">
          {t("panel.goldUnderline")}
        </p>
      </div>
    );
  }

  const isAdded = wordInfo.added;
  const sourceWord = wordInfo.greek || wordInfo.hebrew;

  if (isAdded) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-bold text-warm-brown mb-2">{wordInfo.word}</h3>
        <p className="text-sm text-warm-brown-light italic">
          {t("panel.addedByTranslators")}
        </p>
      </div>
    );
  }

  const clean = (t) => {
    if (!t) return "";
    return t
      .replace(/&#8212-/g, "—")
      .replace(/&mdash[^;]/g, (m) => "—" + m.slice(6))
      .replace(/&mdash;/g, "—")
      .replace(/&quot-/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  };

  const searchChip = async (eng) => {
    const trimmed = eng.trim().replace(/[^a-zA-Z\s]/g, "").trim();
    if (!trimmed) return;
    if (chipSearch?.word === trimmed) { setChipSearch(null); return; }
    setChipSearch({ word: trimmed, results: [], loading: true });
    try {
      const res = await fetch("/data/search-index.json");
      const index = await res.json();
      const lower = trimmed.toLowerCase();
      const found = [];
      for (const entry of index) {
        const regex = new RegExp(`\\b${lower}\\b`, "i");
        if (regex.test(entry.t)) {
          found.push({ ref: entry.r, book: entry.b, chapter: entry.c, verse: entry.v, text: entry.t });
          if (found.length >= 30) break;
        }
      }
      setChipSearch({ word: trimmed, results: found, loading: false });
    } catch {
      setChipSearch({ word: trimmed, results: [], loading: false });
    }
  };

  const chipClass = (eng) => {
    const trimmed = eng.trim().replace(/[^a-zA-Z\s]/g, "").trim();
    const isActive = chipSearch?.word === trimmed;
    return `text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
      isActive
        ? "bg-gold text-white"
        : "bg-cream-dark text-warm-brown hover:bg-gold/20 hover:text-gold"
    }`;
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold text-warm-brown">{wordInfo.word}</span>
          {wordInfo.strongs && (
            <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-mono">{wordInfo.strongs}</span>
          )}
        </div>
        {sourceWord && (
          <div className="flex items-center gap-2">
            <span className="text-xl text-warm-brown">{sourceWord}</span>
            <span className="text-xs text-warm-brown-light">
              {wordInfo.transliteration}
              {wordInfo.pronunciation && <span className="ml-1 opacity-60">/{wordInfo.pronunciation}/</span>}
            </span>
          </div>
        )}
        {wordInfo.part_of_speech && (
          <p className="text-[10px] text-warm-brown-light/60 mt-1">{wordInfo.part_of_speech}</p>
        )}
      </div>

      {wordInfo.strongs_def && (
        <StudySection title={t("panel.strongsDef")}>
          <p>{clean(wordInfo.strongs_def)}</p>
        </StudySection>
      )}

      {wordInfo.kjv_def && !wordInfo.occurrence_map && (
        <StudySection title={t("panel.kjvTranslations")}>
          <div className="flex flex-wrap gap-1">
            {wordInfo.kjv_def.split(",").map((t, i) => (
              <button key={i} type="button" onClick={() => searchChip(t)} className={chipClass(t)}>
                {t.trim()}
              </button>
            ))}
          </div>
        </StudySection>
      )}

      {wordInfo.derivation && (
        <StudySection title={t("panel.derivation")}>
          <p>{clean(wordInfo.derivation)}</p>
        </StudySection>
      )}

      {wordInfo.outline_usage && (
        <StudySection title={t("panel.usage")}>
          <p>{clean(wordInfo.outline_usage)}</p>
        </StudySection>
      )}

      {wordInfo.occurrence_map && Object.keys(wordInfo.occurrence_map).length > 0 && (
        <StudySection title={t("panel.kjvTranslations")}>
          <p className="text-[10px] text-warm-brown-light/60 mb-1.5">{t("panel.tapTranslation")}</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(wordInfo.occurrence_map)
              .sort(([, a], [, b]) => b - a)
              .map(([eng, count], i) => (
                <button key={i} type="button" onClick={() => searchChip(eng)} className={chipClass(eng)}>
                  {eng} ({count}x)
                </button>
              ))}
          </div>
        </StudySection>
      )}

      {chipSearch && (
        <div className="border-t border-cream-dark pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-semibold text-gold uppercase tracking-wider">
              Verses with "{chipSearch.word}"
            </h4>
            <button type="button" onClick={() => setChipSearch(null)} className="text-[10px] text-warm-brown-light hover:text-warm-brown">
              {t("general.close")}
            </button>
          </div>
          {chipSearch.loading ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-warm-brown-light">{t("panel.searching")}</span>
            </div>
          ) : chipSearch.results.length === 0 ? (
            <p className="text-xs text-warm-brown-light/60 py-2">{t("panel.noVersesFound")}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chipSearch.results.map((r, i) => (
                <Link
                  key={i}
                  to={`/read/${encodeURIComponent(r.book)}/${r.chapter}`}
                  className="block bg-cream rounded-lg p-2.5 hover:bg-gold/10 transition-colors"
                >
                  <p className="text-[10px] font-medium text-gold mb-0.5">{r.ref}</p>
                  <p className="text-[11px] text-warm-brown leading-relaxed line-clamp-2">
                    <ChipHighlight text={r.text} word={chipSearch.word} />
                  </p>
                </Link>
              ))}
              {chipSearch.results.length >= 30 && (
                <p className="text-[10px] text-warm-brown-light/60 text-center py-1">{t("panel.showing30")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {wordInfo.biblehub_url && (
        <div className="pt-2 border-t border-cream-dark space-y-1">
          <a href={wordInfo.biblehub_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 min-h-[44px] text-xs text-gold hover:text-gold/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 shrink-0">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            BibleHub: {wordInfo.strongs}
          </a>
          {wordInfo.blb_url && (
            <a href={wordInfo.blb_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 min-h-[44px] text-xs text-gold hover:text-gold/80">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 shrink-0">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Blue Letter Bible: {wordInfo.strongs}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ChipHighlight({ text, word }) {
  if (!word || !text) return text;
  const parts = text.split(new RegExp(`(\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b)`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <mark key={i} className="bg-gold/20 text-warm-brown rounded-sm px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/* ─── Journal Tab ─── */
function JournalTab({ book, chapter }) {
  const t = useT();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const { entries, saveEntry } = useJournal();

  const chapterEntries = useMemo(() => {
    const chNum = parseInt(chapter);
    return entries.filter((e) => {
      if (e.book === book && e.chapter === chNum) return true;
      if (e.content) {
        const refs = tokenizeRefs(e.content).filter((tok) => tok.type === "ref");
        return refs.some((tok) => tok.ref.book === book && tok.ref.chapter === chNum);
      }
      return false;
    });
  }, [entries, book, chapter]);

  const handleSave = async () => {
    if (!text.trim()) return;
    await saveEntry({
      title: `${book} ${chapter} reflection`,
      content: text.trim(),
      book,
      chapter: parseInt(chapter),
      tags: [],
      mood: "reflective",
    });
    setSaved(true);
    setTimeout(() => { setText(""); setSaved(false); }, 2000);
  };

  return (
    <div className="p-3 space-y-3">
      {chapterEntries.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">
            {t("panel.pastEntries")} — {book} {chapter}
          </p>
          <div className="space-y-2">
            {chapterEntries.map((entry) => (
              <Link
                key={entry.id}
                to={`/journal/${entry.id}`}
                className="block bg-cream rounded-lg p-2.5 hover:bg-gold/5 transition-colors border border-transparent hover:border-gold/20"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-medium text-warm-brown leading-snug line-clamp-1">
                    {entry.title || "Untitled"}
                  </p>
                  {entry.mood && (
                    <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-gold/10 text-gold font-medium">
                      {entry.mood}
                    </span>
                  )}
                </div>
                {entry.verseText && (
                  <p className="text-[10px] text-gold italic leading-snug mb-1 line-clamp-1">
                    "{entry.verseText}"
                  </p>
                )}
                <p className="text-[11px] text-warm-brown-light leading-snug line-clamp-2">
                  {entry.content}
                </p>
                <p className="text-[9px] text-warm-brown-light/50 mt-1">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-cream rounded-lg p-3">
        <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">
          {t("panel.writeReflection")}
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.max(96, e.target.scrollHeight) + "px"; }}
          placeholder={t("panel.reflectionPlaceholder")}
          className="w-full bg-white rounded-lg px-3 py-2 text-xs text-warm-brown placeholder-warm-brown-light/40 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30 font-scripture leading-relaxed"
          style={{ minHeight: "96px" }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!text.trim() || saved}
          className={`w-full mt-2 min-h-[36px] rounded-lg text-xs font-medium transition-colors ${
            saved ? "bg-green-100 text-green-600" : "bg-gold text-white hover:bg-gold/90 disabled:opacity-40"
          }`}
        >
          {saved ? t("journal.savedMsg") : t("journal.saveToJournal")}
        </button>
      </div>

      {chapterEntries.length === 0 && (
        <p className="text-[11px] text-warm-brown-light/60 text-center py-1">
          {t("journal.noEntriesChapter")}
        </p>
      )}

      <Link
        to="/journal"
        className="flex items-center justify-center min-h-[36px] text-xs text-warm-brown-light hover:text-gold transition-colors"
      >
        {t("journal.viewAll")}
      </Link>
    </div>
  );
}

function StudySection({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">{title}</h4>
      <div className="text-sm text-warm-brown leading-relaxed">{children}</div>
    </div>
  );
}
