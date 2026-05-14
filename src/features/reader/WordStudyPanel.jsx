import { useState, useEffect } from "react";
import { lookupConcordance, lookupWebsters } from "../../services/concordanceService";

// Decode HTML entities and fix malformed entity references in lexicon data
function clean(text) {
  if (!text) return text;
  // Fix broken entities: &#8212- → —, &mdash → —, &quot- → "
  let fixed = text
    .replace(/&#8212-/g, "\u2014")
    .replace(/&mdash[^;]/g, (m) => "\u2014" + m.slice(6))
    .replace(/&mdash;/g, "\u2014")
    .replace(/&quot-/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  return fixed;
}

const TABS = [
  { id: "definition", label: "Definition" },
  { id: "dictionaries", label: "Dictionaries" },
  { id: "etymology", label: "Etymology" },
  { id: "usage", label: "Usage" },
  { id: "references", label: "References" },
];

export default function WordStudyPanel({ wordInfo, onClose }) {
  const [activeTab, setActiveTab] = useState("definition");

  if (!wordInfo) return null;

  const isAdded = wordInfo.added;
  const sourceWord = wordInfo.greek || wordInfo.hebrew;

  // On desktop, don't show the popup — side panel handles it
  // On mobile, show the popup modal
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end md:hidden pointer-events-none">
        <div className="bg-white rounded-t-2xl shadow-2xl flex flex-col w-full pointer-events-auto animate-slide-up" style={{ height: "75vh" }}>

          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-cream-dark flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-warm-brown">{wordInfo.word}</span>
                {wordInfo.strongs && (
                  <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-mono font-medium">{wordInfo.strongs}</span>
                )}
                {wordInfo.part_of_speech && (
                  <span className="text-[10px] bg-cream-dark text-warm-brown-light px-2 py-0.5 rounded-full">{wordInfo.part_of_speech}</span>
                )}
              </div>
              <button onClick={onClose} className="text-warm-brown-light hover:text-warm-brown p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {sourceWord && (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl text-warm-brown">{sourceWord}</span>
                <div className="text-xs text-warm-brown-light">
                  <span className="font-medium">{wordInfo.transliteration}</span>
                  {wordInfo.pronunciation && (
                    <span className="ml-1.5 text-warm-brown-light/60">/{wordInfo.pronunciation}/</span>
                  )}
                </div>
              </div>
            )}

            {!isAdded && (
              <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
                {TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeTab === tab.id ? "bg-gold text-white" : "bg-cream text-warm-brown-light hover:bg-cream-dark"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4" style={{ minHeight: "40vh" }}>
            {isAdded ? (
              <p className="text-sm text-warm-brown-light italic py-4">
                This word was added by the KJV translators for clarity and does not correspond to a word in the original text. In printed KJV Bibles, these words appear in italics.
              </p>
            ) : (
              <>
                {activeTab === "definition" && <DefinitionTab word={wordInfo} />}
                {activeTab === "dictionaries" && <DictionariesTab word={wordInfo} />}
                {activeTab === "etymology" && <EtymologyTab word={wordInfo} />}
                {activeTab === "usage" && <UsageTab word={wordInfo} />}
                {activeTab === "references" && <ReferencesTab word={wordInfo} />}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Smart Usage List ──
function UsageList({ text: rawText }) {
  const text = clean(rawText);
  if (!text) return null;

  let items = [];

  if (/\d\)|[a-z]\)/.test(text)) {
    items = text.split(/(?=\d\)|[a-z]\))/).map((s) => s.trim()).filter(Boolean);
  } else if (/\([A-Z][a-z]+\)/.test(text)) {
    items = text.split(/(?=\([A-Z])/).map((s) => s.trim()).filter(Boolean);
  } else {
    const raw = text.split(/,\s*/);
    let current = "";
    for (const seg of raw) {
      if (current && current.length > 40) {
        items.push(current);
        current = seg;
      } else if (current) {
        current += ", " + seg;
      } else {
        current = seg;
      }
    }
    if (current) items.push(current);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
          <p className="text-sm leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}

// ── Definition Tab ──
function DefinitionTab({ word }) {
  return (
    <div className="space-y-5">
      {word.strongs_def && (
        <Section title={`Strong's ${word.strongs}`}>
          <p>{clean(word.strongs_def)}</p>
        </Section>
      )}

      {word.outline_usage && (
        <Section title="Biblical Usage">
          <UsageList text={word.outline_usage} />
        </Section>
      )}

      {word.kjv_def && (
        <Section title="KJV Renderings">
          <div className="flex flex-wrap gap-1.5">
            {(word.kjv_translation_list || word.kjv_def.split(",")).map((t, i) => (
              <span key={i} className="text-xs bg-cream-dark px-2.5 py-1 rounded-full text-warm-brown">
                {clean((typeof t === "string" ? t : "").trim())}
              </span>
            ))}
          </div>
        </Section>
      )}

      {word.part_of_speech && (
        <Section title="Part of Speech">
          <p className="capitalize">{word.part_of_speech}</p>
        </Section>
      )}
    </div>
  );
}

// ── Dictionaries Tab ──
function DictionariesTab({ word }) {
  const isGreek = !!word.greek;
  const [webstersDef, setWebstersDef] = useState(null);
  const [webstersLoading, setWebstersLoading] = useState(false);

  useEffect(() => {
    setWebstersLoading(true);
    lookupWebsters(word.word).then((def) => {
      setWebstersDef(def);
      setWebstersLoading(false);
    });
  }, [word.word]);

  return (
    <div className="space-y-5">
      {word.strongs_def && (
        <Section title="Strong's Exhaustive Concordance">
          <p className="mb-2">{clean(word.strongs_def)}</p>
          {word.kjv_def && (
            <p className="text-xs text-warm-brown-light"><span className="font-medium">KJV:</span> {clean(word.kjv_def)}</p>
          )}
        </Section>
      )}

      {word.outline_usage && (
        <Section title="Expository Usage">
          <UsageList text={word.outline_usage} />
        </Section>
      )}

      <Section title="Webster's 1828 Dictionary">
        <p className="text-[10px] text-warm-brown-light/60 mb-2 italic">
          Shows how English speakers understood this word when the KJV was the standard Bible.
        </p>
        {webstersLoading && (
          <div className="flex items-center gap-2 py-2">
            <div className="w-3 h-3 border border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-warm-brown-light">Loading definition...</span>
          </div>
        )}
        {webstersDef && (
          <div className="bg-cream rounded-lg p-3">
            <p className="text-sm leading-relaxed">{clean(webstersDef)}</p>
          </div>
        )}
        {!webstersLoading && !webstersDef && (
          <a
            href={`http://webstersdictionary1828.com/Dictionary/${encodeURIComponent(word.word)}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-gold hover:text-gold/80"
          >
            Look up "{word.word}" on webstersdictionary1828.com
          </a>
        )}
      </Section>

      <Section title="More Resources">
        <div className="space-y-2">
          {word.biblehub_url && (
            <ExternalLink href={word.biblehub_url}
              title={`BibleHub Strong's ${word.strongs}`} subtitle="Thayer's, NAS Exhaustive, concordance" />
          )}
          {word.blb_url && (
            <ExternalLink href={word.blb_url}
              title={`Blue Letter Bible ${word.strongs}`} subtitle="Vine's, Gesenius, Outline of Biblical Usage" />
          )}
          <ExternalLink
            href={`https://www.studylight.org/lexicons/eng/${isGreek ? "greek" : "hebrew"}/${word.strongs?.toLowerCase()}.html`}
            title="StudyLight Lexicon" subtitle="Thayer's, BDB, TWOT references" />
        </div>
      </Section>
    </div>
  );
}

// ── Etymology Tab ──
function EtymologyTab({ word }) {
  const sourceWord = word.greek || word.hebrew;
  const hasRoots = word.root_words?.length > 0 && word.root_words[0].strongs;

  return (
    <div className="space-y-5">
      {word.derivation && (
        <Section title="Derivation">
          <p>{clean(word.derivation)}</p>
        </Section>
      )}

      {hasRoots && (
        <Section title="Root Words">
          <div className="space-y-2">
            {word.root_words.filter((r) => r.strongs).map((root, i) => (
              <div key={i} className="bg-cream rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg text-warm-brown">{root.word}</span>
                  <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-mono">{root.strongs}</span>
                </div>
                <p className="text-xs text-warm-brown-light">{clean(root.meaning)}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {word.root_words?.length > 0 && !hasRoots && (
        <Section title="Origin">
          <p className="italic">{clean(word.root_words[0].meaning)}</p>
        </Section>
      )}

      {sourceWord && (
        <Section title="Word Formation">
          <div className="bg-cream rounded-xl p-4 text-center">
            <p className="text-3xl text-warm-brown mb-2">{sourceWord}</p>
            <p className="text-sm text-warm-brown-light">
              {word.transliteration}
              {word.pronunciation && <span className="ml-2 opacity-60">/{word.pronunciation}/</span>}
            </p>
            {word.part_of_speech && (
              <p className="text-[10px] text-warm-brown-light/60 mt-1 capitalize">{word.part_of_speech}</p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Usage Tab ──
function UsageTab({ word }) {
  const hasOccurrenceMap = word.occurrence_map && Object.keys(word.occurrence_map).length > 0;
  // Determine OT vs NT from Strong's number prefix: H = Hebrew (OT), G = Greek (NT)
  const isOT = word.strongs?.startsWith("H");
  const testamentLabel = isOT ? "Old Testament" : "New Testament";

  return (
    <div className="space-y-5">
      {word.total_occurrences > 0 && (
        <Section title="Frequency">
          <div className="bg-cream rounded-xl p-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gold">{word.total_occurrences}</p>
              <p className="text-[10px] text-warm-brown-light">total uses</p>
            </div>
            <p className="text-xs text-warm-brown-light">
              in the {testamentLabel} (KJV)
            </p>
          </div>
        </Section>
      )}

      {hasOccurrenceMap && (
        <Section title="KJV Translation Breakdown">
          <div className="space-y-2.5">
            {Object.entries(word.occurrence_map)
              .sort(([, a], [, b]) => b - a)
              .map(([eng, count], i) => {
                const maxCount = Math.max(...Object.values(word.occurrence_map));
                const pct = (count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-warm-brown font-medium">"{clean(eng)}"</span>
                      <span className="text-[10px] text-warm-brown-light">{count}x</span>
                    </div>
                    <div className="h-2.5 bg-cream-dark rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Section>
      )}

      {word.outline_usage && (
        <Section title="Biblical Usage Outline">
          <UsageList text={word.outline_usage} />
        </Section>
      )}

      {!hasOccurrenceMap && !word.outline_usage && !word.total_occurrences && (
        <EmptyState text="No usage data available for this word." />
      )}
    </div>
  );
}

// ── References Tab ──
function ReferencesTab({ word }) {
  const sourceWord = word.greek || word.hebrew;
  const hasRoots = word.root_words?.length > 0 && word.root_words[0].strongs;
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (word.strongs) {
      setLoading(true);
      lookupConcordance(word.strongs).then((results) => {
        setVerses(results);
        setLoading(false);
      });
    }
  }, [word.strongs]);

  const displayed = showAll ? verses : verses.slice(0, 5);

  return (
    <div className="space-y-5">
      <Section title={`${sourceWord || word.word} (${word.strongs}) in Scripture`}>
        {loading ? (
          <div className="flex items-center gap-2 py-3">
            <div className="w-3 h-3 border border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-warm-brown-light">Loading concordance...</span>
          </div>
        ) : verses.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] text-warm-brown-light/60 mb-1">
              {word.total_occurrences ? `${word.total_occurrences} total occurrences` : `${verses.length} verses found`}
            </p>
            {displayed.map((v, i) => (
              <div key={i} className="bg-cream rounded-lg p-2.5">
                <span className="text-[10px] font-medium text-gold">{v.r}</span>
                <p className="text-xs text-warm-brown leading-relaxed mt-0.5">{clean(v.t)}</p>
              </div>
            ))}
            {verses.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-gold hover:text-gold/80 w-full text-center py-1"
              >
                {showAll ? "Show less" : `Show all ${verses.length} verses`}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-warm-brown-light">No concordance data available.</p>
        )}
      </Section>

      {hasRoots && (
        <Section title="Related Word Family">
          <div className="space-y-2">
            {word.root_words.filter((r) => r.strongs).map((root, i) => (
              <div key={i} className="bg-cream rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-warm-brown">{root.word}</span>
                  <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full font-mono">{root.strongs}</span>
                </div>
                <p className="text-xs text-warm-brown-light">{clean(root.meaning)}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Study Further">
        <div className="space-y-2">
          <ExternalLink href={word.biblehub_url}
            title="Full BibleHub Concordance" subtitle="Every occurrence with full verse context" />
          <ExternalLink href={word.blb_url}
            title="Blue Letter Bible" subtitle="Treasury of Scripture Knowledge" />
        </div>
      </Section>
    </div>
  );
}

// ── Shared Components ── Clean section headers with gold accent, no emoji circles
function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-2 border-b border-cream-dark pb-1.5">{title}</h4>
      <div className="text-sm text-warm-brown leading-relaxed">
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
    </div>
  );
}

function ExternalLink({ href, title, subtitle }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 bg-cream rounded-lg p-3 hover:bg-cream-dark transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-warm-brown">{title}</p>
        {subtitle && <p className="text-[10px] text-warm-brown-light">{subtitle}</p>}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light/50 shrink-0">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

function EmptyState({ text }) {
  return <div className="text-center py-6"><p className="text-sm text-warm-brown-light">{text}</p></div>;
}
