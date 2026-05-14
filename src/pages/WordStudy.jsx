import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { lookupConcordance, lookupWebsters } from "../services/concordanceService";
import useDocumentTitle from "../hooks/useDocumentTitle";

function clean(text) {
  if (!text) return text;
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

export default function WordStudy() {
  const { strongsId } = useParams();
  useDocumentTitle(strongsId ? `Word Study: ${strongsId}` : "Word Study");
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [concordance, setConcordance] = useState(null);
  const [websters, setWebsters] = useState(null);
  const [verseResults, setVerseResults] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Load lexicon data for this Strong's number
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEntry(null);
    setConcordance(null);
    setWebsters(null);
    setVerseResults(null);
    setActiveTab("overview");

    (async () => {
      try {
        const isGreek = strongsId.startsWith("G");
        const num = strongsId.slice(1);

        // Load main lexicon
        const lexRes = await fetch("/data/lexicon.json");
        const lexicon = await lexRes.json();
        const lexEntry = lexicon[strongsId];

        // Load openscriptures data for richer info
        let osEntry = null;
        try {
          const osRes = await fetch(`/data/strongs/${isGreek ? "greek" : "hebrew"}.json`);
          const osData = await osRes.json();
          osEntry = osData[strongsId];
        } catch {}

        if (cancelled) return;

        if (!lexEntry && !osEntry) {
          setLoading(false);
          return;
        }

        // Merge data from both sources
        const merged = {
          strongs: strongsId,
          language: isGreek ? "Greek" : "Hebrew",
          word: isGreek
            ? lexEntry?.Gk_word || lexEntry?.lemma || osEntry?.lemma || ""
            : lexEntry?.Heb_word || lexEntry?.lemma || osEntry?.lemma || "",
          transliteration: lexEntry?.transliteration || lexEntry?.translit || osEntry?.translit || osEntry?.xlit || "",
          pronunciation: lexEntry?.pronunciation || lexEntry?.pron || osEntry?.pron || "",
          strongs_def: clean(lexEntry?.strongs_def || osEntry?.strongs_def || ""),
          kjv_def: lexEntry?.kjv_def || osEntry?.kjv_def || "",
          part_of_speech: lexEntry?.part_of_speech || "",
          derivation: lexEntry?.derivation || lexEntry?.root_word || osEntry?.derivation || "",
          outline_usage: clean(lexEntry?.outline_usage || ""),
          occurrences: lexEntry?.occurrences || "",
          biblehub_url: `https://biblehub.com/str/${isGreek ? "greek" : "hebrew"}/${num}.htm`,
          blb_url: `https://www.blueletterbible.org/lexicon/${strongsId.toLowerCase()}/kjv/wlc/0-1/`,
        };

        // Parse occurrence map
        const occMap = {};
        if (merged.occurrences) {
          const regex = /([a-zA-Z\s\-'()]+)\((\d+)x\)/g;
          let m;
          while ((m = regex.exec(merged.occurrences)) !== null) {
            occMap[m[1].trim()] = parseInt(m[2]);
          }
        }
        merged.occurrence_map = occMap;
        merged.total_occurrences = Object.values(occMap).reduce((s, c) => s + c, 0);

        // Parse root words
        if (merged.derivation) {
          const rootParts = merged.derivation.split(/,\s*(?=[HG]\d)/).filter(Boolean);
          merged.root_words = rootParts.map((part) => {
            const rmatch = part.match(/([HG]\d+)\s*\|\s*([^|]+)\|\s*(.*)/);
            if (rmatch) return { strongs: rmatch[1].trim(), word: rmatch[2].trim(), meaning: rmatch[3].trim() };
            return { strongs: null, word: null, meaning: part.trim() };
          }).filter((r) => r.meaning);
        }

        setEntry(merged);
        setLoading(false);

        // Load concordance and Webster's in background
        if (merged.kjv_def) {
          const firstTranslation = merged.kjv_def.split(",")[0].trim().replace(/[^a-zA-Z\s]/g, "").trim();
          if (firstTranslation) {
            lookupConcordance(strongsId).then((c) => { if (!cancelled) setConcordance(c); });
            lookupWebsters(firstTranslation).then((w) => { if (!cancelled) setWebsters(w); });
          }
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [strongsId]);

  // Search for verses containing a KJV translation
  const searchTranslation = async (word) => {
    const trimmed = word.trim().replace(/[^a-zA-Z\s]/g, "").trim();
    if (!trimmed) return;
    if (verseResults?.word === trimmed) { setVerseResults(null); return; }
    setVerseResults({ word: trimmed, results: [], loading: true });
    try {
      const res = await fetch("/data/search-index.json");
      const index = await res.json();
      const lower = trimmed.toLowerCase();
      const found = [];
      for (const e of index) {
        const regex = new RegExp(`\\b${lower}\\b`, "i");
        if (regex.test(e.t)) {
          found.push({ ref: e.r, book: e.b, chapter: e.c, verse: e.v, text: e.t });
          if (found.length >= 50) break;
        }
      }
      setVerseResults({ word: trimmed, results: found, loading: false });
    } catch {
      setVerseResults({ word: trimmed, results: [], loading: false });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-warm-brown-light mt-3">Loading word study...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-warm-brown-light mb-2">No data found for <span className="font-mono text-gold">{strongsId}</span></p>
        <Link to="/" className="text-sm text-gold hover:text-gold/80">Back to reading</Link>
      </div>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "usage", label: "Usage" },
    { id: "dictionaries", label: "Dictionaries" },
    { id: "references", label: "References" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm mb-5 flex-wrap">
        <Link to="/" className="text-warm-brown-light hover:text-warm-brown">Home</Link>
        <span className="text-warm-brown-light/40" aria-hidden="true">/</span>
        <button onClick={() => window.history.back()} className="text-warm-brown-light hover:text-warm-brown">Reading</button>
        <span className="text-warm-brown-light/40" aria-hidden="true">/</span>
        <span className="text-gold font-medium">{strongsId}</span>
      </nav>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-cream-dark p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-2xl font-bold text-warm-brown">{entry.word}</span>
              <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-mono font-medium">{entry.strongs}</span>
              <span className="text-[10px] bg-cream-dark text-warm-brown-light px-2 py-0.5 rounded-full">{entry.language}</span>
            </div>
            <div className="flex items-center gap-2 text-warm-brown-light">
              <span className="text-sm font-medium">{entry.transliteration}</span>
              {entry.pronunciation && (
                <span className="text-xs opacity-60">/{entry.pronunciation}/</span>
              )}
            </div>
            {entry.part_of_speech && (
              <p className="text-[11px] text-warm-brown-light/60 mt-1">{entry.part_of_speech}</p>
            )}
          </div>
          {entry.total_occurrences > 0 && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-gold">{entry.total_occurrences}</p>
              <p className="text-[10px] text-warm-brown-light">KJV uses</p>
            </div>
          )}
        </div>

        {entry.strongs_def && (
          <div className="mt-4 pt-4 border-t border-cream-dark">
            <p className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">Strong's Definition</p>
            <p className="text-sm text-warm-brown leading-relaxed">{entry.strongs_def}</p>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.id ? "bg-gold text-white" : "bg-white border border-cream-dark text-warm-brown-light hover:border-gold/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* KJV Translations */}
          {Object.keys(entry.occurrence_map).length > 0 && (
            <Section title="KJV Translations">
              <p className="text-[10px] text-warm-brown-light/60 mb-2">Tap a translation to find verses</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(entry.occurrence_map)
                  .sort(([, a], [, b]) => b - a)
                  .map(([eng, count]) => (
                    <button
                      key={eng}
                      onClick={() => searchTranslation(eng)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        verseResults?.word === eng.trim().replace(/[^a-zA-Z\s]/g, "").trim()
                          ? "bg-gold text-white"
                          : "bg-cream text-warm-brown hover:bg-gold/10 hover:text-gold"
                      }`}
                    >
                      {eng} <span className="opacity-60">({count}x)</span>
                    </button>
                  ))}
              </div>
            </Section>
          )}

          {/* Verse search results */}
          {verseResults && (
            <div className="bg-white rounded-xl border border-cream-dark p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gold">
                  Verses with "{verseResults.word}"
                </h4>
                <button onClick={() => setVerseResults(null)} className="text-[10px] text-warm-brown-light hover:text-warm-brown">
                  Close
                </button>
              </div>
              {verseResults.loading ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-warm-brown-light">Searching...</span>
                </div>
              ) : verseResults.results.length === 0 ? (
                <p className="text-xs text-warm-brown-light/60 py-2">No verses found.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {verseResults.results.map((r, i) => (
                    <Link
                      key={i}
                      to={`/read/${encodeURIComponent(r.book)}/${r.chapter}`}
                      className="block bg-cream rounded-lg p-3 hover:bg-gold/10 transition-colors"
                    >
                      <p className="text-[10px] font-medium text-gold mb-0.5">{r.ref}</p>
                      <p className="text-xs text-warm-brown leading-relaxed line-clamp-2">
                        <HighlightWord text={r.text} word={verseResults.word} />
                      </p>
                    </Link>
                  ))}
                  {verseResults.results.length >= 50 && (
                    <p className="text-[10px] text-warm-brown-light/60 text-center">Showing first 50 results</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Derivation / Root Words */}
          {entry.root_words?.length > 0 && (
            <Section title="Derivation">
              <div className="space-y-2">
                {entry.root_words.map((root, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {root.strongs ? (
                      <Link
                        to={`/word/${root.strongs}`}
                        className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-mono hover:bg-gold/20 shrink-0"
                      >
                        {root.strongs}
                      </Link>
                    ) : null}
                    <div>
                      {root.word && <span className="text-sm text-warm-brown font-medium mr-2">{root.word}</span>}
                      <span className="text-sm text-warm-brown-light">{root.meaning}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {entry.derivation && !entry.root_words?.length && (
            <Section title="Derivation">
              <p className="text-sm text-warm-brown leading-relaxed">{clean(entry.derivation)}</p>
            </Section>
          )}
        </div>
      )}

      {activeTab === "usage" && (
        <div className="space-y-4">
          {entry.outline_usage ? (
            <Section title="Thayer's / BDB Outline">
              <p className="text-sm text-warm-brown leading-relaxed whitespace-pre-line">{entry.outline_usage}</p>
            </Section>
          ) : (
            <Section title="Usage">
              <p className="text-sm text-warm-brown-light italic">No detailed usage outline available for this word.</p>
            </Section>
          )}

          {entry.kjv_def && (
            <Section title="KJV Definition">
              <p className="text-sm text-warm-brown leading-relaxed">{entry.kjv_def}</p>
            </Section>
          )}
        </div>
      )}

      {activeTab === "dictionaries" && (
        <div className="space-y-4">
          {concordance ? (
            <Section title="Nave's Topical Concordance">
              {concordance.entries?.map((ce, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  {ce.topic && <p className="text-xs font-semibold text-gold mb-1">{ce.topic}</p>}
                  <p className="text-sm text-warm-brown leading-relaxed">{ce.text}</p>
                </div>
              )) || <p className="text-sm text-warm-brown leading-relaxed">{concordance.text || "No entries found."}</p>}
            </Section>
          ) : (
            <Section title="Nave's Topical Concordance">
              <p className="text-sm text-warm-brown-light italic">Loading...</p>
            </Section>
          )}

          {websters ? (
            <Section title="Webster's 1828 Dictionary">
              {websters.definitions?.map((d, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-sm text-warm-brown leading-relaxed">{d}</p>
                </div>
              )) || <p className="text-sm text-warm-brown leading-relaxed">{websters.text || "No definition found."}</p>}
            </Section>
          ) : (
            <Section title="Webster's 1828 Dictionary">
              <p className="text-sm text-warm-brown-light italic">Loading...</p>
            </Section>
          )}
        </div>
      )}

      {activeTab === "references" && (
        <div className="space-y-4">
          {/* External study links */}
          <Section title="Study Resources">
            <div className="space-y-2">
              <a
                href={entry.biblehub_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-cream rounded-lg p-3 hover:bg-gold/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gold shrink-0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <div>
                  <p className="text-sm text-warm-brown font-medium">BibleHub — {entry.strongs}</p>
                  <p className="text-[10px] text-warm-brown-light">Strong's concordance, interlinear, and commentaries</p>
                </div>
              </a>
              <a
                href={entry.blb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-cream rounded-lg p-3 hover:bg-gold/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gold shrink-0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <div>
                  <p className="text-sm text-warm-brown font-medium">Blue Letter Bible — {entry.strongs}</p>
                  <p className="text-[10px] text-warm-brown-light">Lexicon, outline of biblical usage, concordance</p>
                </div>
              </a>
            </div>
          </Section>

          {/* Related Strong's numbers from derivation */}
          {entry.root_words?.some((r) => r.strongs) && (
            <Section title="Related Words">
              <div className="space-y-2">
                {entry.root_words.filter((r) => r.strongs).map((root, i) => (
                  <Link
                    key={i}
                    to={`/word/${root.strongs}`}
                    className="flex items-center gap-3 bg-cream rounded-lg p-3 hover:bg-gold/10 transition-colors"
                  >
                    <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-mono">{root.strongs}</span>
                    <div>
                      {root.word && <span className="text-sm text-warm-brown font-medium mr-1">{root.word}</span>}
                      <span className="text-sm text-warm-brown-light">{root.meaning}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-cream-dark p-4">
      <h3 className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function HighlightWord({ text, word }) {
  if (!word || !text) return text;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(\\b${escaped}\\b)`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <mark key={i} className="bg-gold/20 text-warm-brown rounded-sm px-0.5">{part}</mark>
        ) : part
      )}
    </>
  );
}
