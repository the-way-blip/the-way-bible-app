import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getChapterCrossReferences } from "../../services/crossReferences";

const TABS = [
  { id: "wordstudy", label: "Word Study" },
  { id: "crossrefs", label: "Cross-Refs" },
  { id: "notes", label: "Notes" },
  { id: "journal", label: "Journal" },
];

export default function SidePanel({
  book,
  chapter,
  notes,
  activeWordInfo,
  onSaveNote,
  onDeleteNote,
}) {
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
      {/* Tabs */}
      <div className="flex border-b border-cream-dark shrink-0" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-h-[44px] text-xs font-medium transition-colors relative ${
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
        <TabPane id="panel-crossrefs" labelledBy="tab-crossrefs" visible={activeTab === "crossrefs"}>
          <CrossRefsTab book={book} chapter={chapter} />
        </TabPane>
        <TabPane id="panel-notes" labelledBy="tab-notes" visible={activeTab === "notes"}>
          <NotesTab
            book={book}
            chapter={chapter}
            notes={notes}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        </TabPane>
        <TabPane id="panel-wordstudy" labelledBy="tab-wordstudy" visible={activeTab === "wordstudy"}>
          <WordStudyTab wordInfo={displayedWord} />
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

/* ─── Cross-References Tab ─── */
function CrossRefsTab({ book, chapter }) {
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
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-xs text-warm-brown-light">Loading cross-references...</span>
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
        <p className="text-sm text-warm-brown-light">No cross-references found for this chapter.</p>
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
              <span className="text-[10px] text-warm-brown-light/60">{verseRefs.length} refs</span>
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

/* ─── Notes Tab ─── */
function NotesTab({ book, chapter, notes, onSaveNote, onDeleteNote }) {
  const [editingVerse, setEditingVerse] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [newNoteVerse, setNewNoteVerse] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  const startEdit = (verse, text) => {
    setEditingVerse(verse);
    setNoteText(text || "");
  };

  const save = () => {
    if (editingVerse && noteText.trim()) {
      onSaveNote(editingVerse, noteText.trim());
    }
    setEditingVerse(null);
    setNoteText("");
  };

  const addNewNote = () => {
    const verse = parseInt(newNoteVerse);
    if (verse > 0 && newNoteText.trim()) {
      onSaveNote(verse, newNoteText.trim());
      setNewNoteVerse("");
      setNewNoteText("");
    }
  };

  return (
    <div className="p-3 space-y-2">
      {/* Quick add note form — always visible */}
      <div className="bg-cream rounded-lg p-3">
        <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Add Note</p>
        <div className="flex gap-2 mb-2">
          <span className="text-xs text-warm-brown-light self-center whitespace-nowrap">{book} {chapter}:</span>
          <input
            type="number"
            value={newNoteVerse}
            onChange={(e) => setNewNoteVerse(e.target.value)}
            placeholder="v"
            min="1"
            className="w-12 bg-white rounded-lg px-2 py-1.5 text-xs text-warm-brown text-center focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
        </div>
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Write your note..."
          className="w-full bg-white rounded-lg px-3 py-2 text-xs text-warm-brown resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
          style={{ minHeight: "3rem", height: "auto" }}
          rows={2}
          onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
        />
        <button
          type="button"
          onClick={addNewNote}
          disabled={!newNoteVerse || !newNoteText.trim()}
          className="w-full mt-2 min-h-[36px] rounded-lg text-xs font-medium bg-gold text-white hover:bg-gold/90 disabled:opacity-30 transition-colors"
        >
          Save Note
        </button>
      </div>

      {/* Editing existing note */}
      {editingVerse && (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
          <p className="text-[10px] text-gold font-medium mb-2">
            Editing — {book} {chapter}:{editingVerse}
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full bg-white rounded-lg px-3 py-2 text-xs text-warm-brown resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
            style={{ minHeight: "3rem" }}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setEditingVerse(null)} className="text-[10px] text-warm-brown-light">Cancel</button>
            <button type="button" onClick={save} className="text-[10px] text-gold font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Existing notes */}
      {notes.length === 0 && !editingVerse && (
        <p className="text-xs text-warm-brown-light/60 text-center py-2">
          No notes yet. Use the form above or tap a verse number.
        </p>
      )}
      {notes.map((note) => (
        <div key={note.id} className="bg-cream rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gold font-medium">
              {book} {chapter}:{note.verseNumber}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(note.verseNumber, note.text)} className="text-[10px] text-warm-brown-light hover:text-warm-brown">Edit</button>
              <button type="button" onClick={() => onDeleteNote(note.verseNumber)} className="text-[10px] text-red-400 hover:text-red-500">Delete</button>
            </div>
          </div>
          <p className="text-xs text-warm-brown leading-relaxed">{note.text}</p>
          <p className="text-[9px] text-warm-brown-light/50 mt-1">
            {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Word Study Tab ─── */
function WordStudyTab({ wordInfo }) {
  const [chipSearch, setChipSearch] = useState(null); // { word, results, loading }

  if (!wordInfo) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-warm-brown-light">Tap a word in the text to study it.</p>
        <p className="text-xs text-warm-brown-light/60 mt-1">
          Original-language words have a gold dotted underline.
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
          Added by KJV translators for clarity. Not in the original text.
        </p>
      </div>
    );
  }

  // Decode HTML entities and fix malformed entity references
  const clean = (t) => {
    if (!t) return "";
    return t
      .replace(/&#8212-/g, "\u2014")
      .replace(/&mdash[^;]/g, (m) => "\u2014" + m.slice(6))
      .replace(/&mdash;/g, "\u2014")
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
    if (chipSearch?.word === trimmed) { setChipSearch(null); return; } // toggle off
    setChipSearch({ word: trimmed, results: [], loading: true });
    try {
      const res = await fetch("/data/search-index.json");
      const index = await res.json();
      const lower = trimmed.toLowerCase();
      const found = [];
      for (const entry of index) {
        // Match whole word boundary
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
        <StudySection title="Strong's Definition">
          <p>{clean(wordInfo.strongs_def)}</p>
        </StudySection>
      )}

      {wordInfo.kjv_def && !wordInfo.occurrence_map && (
        <StudySection title="KJV Translations">
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
        <StudySection title="Derivation">
          <p>{clean(wordInfo.derivation)}</p>
        </StudySection>
      )}

      {wordInfo.outline_usage && (
        <StudySection title="Usage">
          <p>{clean(wordInfo.outline_usage)}</p>
        </StudySection>
      )}

      {wordInfo.occurrence_map && Object.keys(wordInfo.occurrence_map).length > 0 && (
        <StudySection title="KJV Translations">
          <p className="text-[10px] text-warm-brown-light/60 mb-1.5">Tap a translation to find verses</p>
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

      {/* Chip search results */}
      {chipSearch && (
        <div className="border-t border-cream-dark pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-semibold text-gold uppercase tracking-wider">
              Verses with "{chipSearch.word}"
            </h4>
            <button type="button" onClick={() => setChipSearch(null)} className="text-[10px] text-warm-brown-light hover:text-warm-brown">
              Close
            </button>
          </div>
          {chipSearch.loading ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-warm-brown-light">Searching...</span>
            </div>
          ) : chipSearch.results.length === 0 ? (
            <p className="text-xs text-warm-brown-light/60 py-2">No verses found.</p>
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
                <p className="text-[10px] text-warm-brown-light/60 text-center py-1">Showing first 30 results</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* External links */}
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
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  const saveJournalEntry = async () => {
    if (!text.trim()) return;
    const { dbPut } = await import("../../hooks/useDB");
    await dbPut("journal", {
      id: `journal-${Date.now()}`,
      title: `${book} ${chapter} reflection`,
      content: text.trim(),
      book,
      chapter,
      tags: [],
      mood: "reflective",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setSaved(true);
    setTimeout(() => { setText(""); setSaved(false); }, 2000);
  };

  return (
    <div className="p-4">
      <p className="text-xs text-warm-brown-light mb-3">
        Write your reflections on {book} {chapter}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.max(128, e.target.scrollHeight) + "px"; }}
        placeholder="What stood out to you? What is God speaking to your heart?"
        className="w-full bg-cream rounded-lg px-3 py-2 text-sm text-warm-brown placeholder-warm-brown-light/40 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30 font-scripture leading-relaxed"
        style={{ minHeight: "128px" }}
      />
      <button
        type="button"
        onClick={saveJournalEntry}
        disabled={!text.trim() || saved}
        className={`w-full mt-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
          saved ? "bg-green-100 text-green-600" : "bg-gold text-white hover:bg-gold/90 disabled:opacity-40"
        }`}
      >
        {saved ? "Saved!" : "Save to Journal"}
      </button>
      <a href="/journal" className="flex items-center justify-center min-h-[44px] text-xs text-warm-brown-light hover:text-gold mt-1">
        View all journal entries
      </a>
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
