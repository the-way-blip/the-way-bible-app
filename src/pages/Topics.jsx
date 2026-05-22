import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import topics from "../data/topicIndex";
import ShareSheet from "../components/ShareSheet";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useToast } from "../components/Toast";
import { useAuth } from "../stores/AuthContext";
import {
  highlightVerses,
  unhighlightVerses,
  countExistingHighlights,
} from "../utils/topicHighlight";

const HIGHLIGHT_COLORS = [
  { key: "yellow", label: "Yellow", className: "bg-highlight-yellow" },
  { key: "green", label: "Green", className: "bg-highlight-green" },
  { key: "blue", label: "Blue", className: "bg-highlight-blue" },
  { key: "pink", label: "Pink", className: "bg-highlight-pink" },
];

// Parse "John 3:16" → { book: "John", chapter: "3", verse: "16" }
function parseRef(ref) {
  const m = ref.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!m) return null;
  return { book: m[1], chapter: m[2], verse: m[3] || "1", display: ref };
}

export default function Topics() {
  useDocumentTitle("Topics");
  const [expanded, setExpanded] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [search, setSearch] = useState("");
  const [verseTexts, setVerseTexts] = useState({});
  const [picker, setPicker] = useState(null); // topic name when color picker open
  const [busy, setBusy] = useState(false);
  const [existingCounts, setExistingCounts] = useState({}); // { topicName: highlightedVerseCount }
  const showToast = useToast();
  const { user, profile } = useAuth();

  // Build a personalization map: which topic names are in the user's onboarding selections.
  // Onboarding uses lowercase values like "salvation", "spiritual_warfare". Match
  // case-insensitively against topic.name (which is "Salvation", etc.)
  const userTopicKeys = new Set(
    (profile?.topics || []).map((t) => t.replace(/_/g, " ").toLowerCase())
  );
  const isPersonalTopic = (name) => userTopicKeys.has(name.toLowerCase());

  // Sort: personal topics first, then everything else (alphabetical preserved within each group)
  const sortedTopics = [...topics].sort((a, b) => {
    const aP = isPersonalTopic(a.name) ? 0 : 1;
    const bP = isPersonalTopic(b.name) ? 0 : 1;
    return aP - bP;
  });

  // Filter topics by search
  const filtered = search
    ? sortedTopics.filter((t) => {
        const q = search.toLowerCase();
        if (t.name.toLowerCase().includes(q)) return true;
        return t.verses.some((v) => v.toLowerCase().includes(q));
      })
    : sortedTopics;

  // Lazy-load verse text when a topic is expanded
  const loadVerseText = useCallback(async (ref) => {
    const parsed = parseRef(ref);
    if (!parsed) return;
    // Use functional setter to check & set atomically, avoiding stale closure
    let alreadyLoaded = false;
    setVerseTexts((prev) => {
      if (prev[ref]) { alreadyLoaded = true; return prev; }
      return { ...prev, [ref]: { loading: true } };
    });
    if (alreadyLoaded) return;
    try {
      const res = await fetch(
        `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVerseTexts((prev) => ({ ...prev, [ref]: { text: data.text?.trim() } }));
    } catch {
      setVerseTexts((prev) => ({ ...prev, [ref]: { text: null } }));
    }
  }, []);

  const handleExpand = (i) => {
    if (expanded === i) {
      setExpanded(null);
      setPicker(null);
      return;
    }
    setExpanded(i);
    setPicker(null);
    // Pre-load first few verse texts
    const topic = filtered[i];
    topic.verses.slice(0, 4).forEach(loadVerseText);
    // Refresh existing-highlight count for this topic
    refreshHighlightCount(topic);
  };

  const refreshHighlightCount = useCallback(async (topic) => {
    const count = await countExistingHighlights(topic.verses);
    setExistingCounts((prev) => ({ ...prev, [topic.name]: count }));
  }, []);

  // On mount: load existing highlight counts in the background for currently visible topics
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Only check the first 8 to avoid hammering on initial render — others refresh on expand
      for (const topic of topics.slice(0, 8)) {
        if (cancelled) return;
        const count = await countExistingHighlights(topic.verses);
        if (cancelled) return;
        setExistingCounts((prev) => ({ ...prev, [topic.name]: count }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleHighlightAll = async (topic, color) => {
    setBusy(true);
    try {
      const written = await highlightVerses(topic.verses, color, user?.id);
      showToast(`Highlighted ${written} verse${written === 1 ? "" : "s"} in ${topic.name}`, { icon: "✨" });
      await refreshHighlightCount(topic);
    } catch {
      showToast("Couldn't apply highlights — please try again.", { icon: "⚠️" });
    } finally {
      setBusy(false);
      setPicker(null);
    }
  };

  const handleRemoveAll = async (topic) => {
    setBusy(true);
    try {
      const removed = await unhighlightVerses(topic.verses, user?.id);
      showToast(`Removed ${removed} highlight${removed === 1 ? "" : "s"} from ${topic.name}`, { icon: "🧹" });
      await refreshHighlightCount(topic);
    } catch {
      showToast("Couldn't remove highlights — please try again.", { icon: "⚠️" });
    } finally {
      setBusy(false);
      setPicker(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Topics</h1>
      <p className="text-sm text-warm-brown-light mb-4">Browse key verses by topic</p>

      {/* Search */}
      <div className="relative mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-brown-light/40">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics or verses..."
          className="w-full bg-white rounded-xl border border-cream-dark pl-10 pr-4 py-2.5 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:border-gold/30"
        />
      </div>

      {/* Quick topic chips — personal first */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {sortedTopics.slice(0, 8).map((t) => {
          const isPersonal = isPersonalTopic(t.name);
          return (
            <button
              key={t.name}
              onClick={() => {
                setSearch("");
                const idx = filtered.findIndex((f) => f.name === t.name);
                if (idx >= 0) handleExpand(idx);
              }}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
                isPersonal
                  ? "bg-gold text-white hover:bg-gold/90"
                  : "bg-cream text-warm-brown hover:bg-gold/10 hover:text-gold"
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {userTopicKeys.size > 0 && !search && (
        <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-2">
          For you
        </p>
      )}

      <p className="text-[10px] text-warm-brown-light/60 mb-3">
        {filtered.length} {filtered.length === 1 ? "topic" : "topics"}
      </p>

      <div className="space-y-2">
        {filtered.map((topic, i) => {
          const isPersonal = isPersonalTopic(topic.name);
          return (
          <div key={topic.name} className={`bg-white rounded-xl overflow-hidden border ${isPersonal && !search ? "border-gold/40 ring-1 ring-gold/20" : "border-cream-dark"}`}>
            <button
              type="button"
              onClick={() => handleExpand(i)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-cream/50 transition-colors"
            >
              <span className="text-sm font-medium text-warm-brown">{topic.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">{topic.verses.length}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded === i ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {expanded === i && (
              <div className="border-t border-cream-dark">
                {/* Bulk-highlight bar */}
                <div className="px-4 py-2.5 bg-cream/40 border-b border-cream-dark/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-warm-brown-light">
                    {existingCounts[topic.name] > 0
                      ? `${existingCounts[topic.name]} verse${existingCounts[topic.name] === 1 ? "" : "s"} already highlighted`
                      : "Highlight every verse in this topic"}
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPicker(picker === topic.name ? null : topic.name)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-brown bg-white border border-cream-dark rounded-full px-3 py-1.5 hover:bg-gold/10 hover:text-gold disabled:opacity-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Highlight all
                    </button>

                    {picker === topic.name && (
                      <div
                        className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-xl border border-cream-dark shadow-lg p-2 w-44"
                        onMouseLeave={() => setPicker(null)}
                      >
                        <p className="text-[10px] text-warm-brown-light/80 px-1.5 pb-1.5">Pick a color</p>
                        <div className="flex items-center gap-1.5 px-1">
                          {HIGHLIGHT_COLORS.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              disabled={busy}
                              onClick={() => handleHighlightAll(topic, c.key)}
                              className={`w-7 h-7 rounded-full border border-cream-dark hover:scale-110 transition-transform disabled:opacity-50 ${c.className}`}
                              aria-label={`Highlight in ${c.label}`}
                            />
                          ))}
                        </div>
                        {existingCounts[topic.name] > 0 && (
                          <>
                            <div className="border-t border-cream-dark/60 my-2" />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRemoveAll(topic)}
                              className="w-full text-left text-xs text-warm-brown-light hover:text-red-500 px-1.5 py-1 disabled:opacity-50"
                            >
                              Remove all highlights
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {topic.verses.map((ref, j) => {
                  const parsed = parseRef(ref);
                  const vt = verseTexts[ref];

                  // Load text on scroll into view
                  if (!vt) loadVerseText(ref);

                  return (
                    <div
                      key={j}
                      className="px-4 py-3 border-b border-cream-dark/50 last:border-b-0 hover:bg-cream/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        {parsed ? (
                          <Link
                            to={`/read/${encodeURIComponent(parsed.book)}/${parsed.chapter}`}
                            className="text-xs font-medium text-gold hover:text-gold/80"
                          >
                            {ref}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-gold">{ref}</span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareData({ content: vt?.text || ref, reference: ref });
                            }}
                            className="text-warm-brown-light/30 hover:text-gold p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                          </button>
                          {parsed && (
                            <Link
                              to={`/read/${encodeURIComponent(parsed.book)}/${parsed.chapter}`}
                              className="text-warm-brown-light/30 hover:text-gold p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Verse text preview */}
                      {vt?.loading ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <div className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
                          <span className="text-[10px] text-warm-brown-light/40">Loading...</span>
                        </div>
                      ) : vt?.text ? (
                        <p className="text-xs text-warm-brown-light leading-relaxed line-clamp-3 font-scripture italic">
                          {vt.text}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-warm-brown-light py-8">No topics match your search.</p>
        )}
      </div>

      {shareData && (
        <ShareSheet content={shareData.content} reference={shareData.reference} onClose={() => setShareData(null)} />
      )}
    </div>
  );
}
