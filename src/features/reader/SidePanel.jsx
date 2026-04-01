import { useState, useEffect, useRef } from "react";
import { fetchCommentaries, getBibleHubUrl } from "../../services/commentaryService";
import { saveCommentary } from "../../pages/CommentaryLibrary";

const TABS = [
  { id: "commentary", label: "Commentary" },
  { id: "notes", label: "Notes" },
  { id: "wordstudy", label: "Word Study" },
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
  const [activeTab, setActiveTab] = useState("commentary");
  const [lastWordInfo, setLastWordInfo] = useState(null);

  useEffect(() => {
    if (activeWordInfo) {
      setLastWordInfo(activeWordInfo);
      setActiveTab("wordstudy");
    }
  }, [activeWordInfo]);

  const displayedWord = activeWordInfo || lastWordInfo;

  return (
    <div className="flex flex-col h-full bg-white border-l border-cream-dark w-full">
      {/* Tabs */}
      <div className="flex border-b border-cream-dark shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors relative ${
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
        <TabPane visible={activeTab === "commentary"}>
          <CommentaryTab book={book} chapter={chapter} />
        </TabPane>
        <TabPane visible={activeTab === "notes"}>
          <NotesTab
            book={book}
            chapter={chapter}
            notes={notes}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        </TabPane>
        <TabPane visible={activeTab === "wordstudy"}>
          <WordStudyTab wordInfo={displayedWord} />
        </TabPane>
        <TabPane visible={activeTab === "journal"}>
          <JournalTab book={book} chapter={chapter} />
        </TabPane>
      </div>
    </div>
  );
}

// Keep tab mounted but hidden when not active — preserves state & scroll
function TabPane({ visible, children }) {
  return (
    <div
      className="absolute inset-0 overflow-y-auto overscroll-contain"
      style={{ visibility: visible ? "visible" : "hidden", zIndex: visible ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

/* ─── Commentary Tab ─── */
function CommentaryTab({ book, chapter }) {
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const loadedRef = useRef("");

  useEffect(() => {
    const key = `${book}-${chapter}`;
    if (loadedRef.current === key) return; // already loaded this chapter
    loadedRef.current = key;

    let cancelled = false;
    setLoading(true);
    setExpandedCards({});
    fetchCommentaries(book, chapter).then((results) => {
      if (!cancelled) {
        setCommentaries(results);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [book, chapter]);

  const bibleHubUrl = getBibleHubUrl(book, chapter, 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-xs text-warm-brown-light">Loading commentaries...</span>
      </div>
    );
  }

  if (commentaries.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-warm-brown-light mb-3">No commentaries available.</p>
        {bibleHubUrl && (
          <a href={bibleHubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:text-gold/80">
            View on BibleHub
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-cream-dark">
      <div className="px-4 py-2 bg-cream/50">
        <p className="text-[10px] text-warm-brown-light">{commentaries.length} commentaries for {book} {chapter}</p>
      </div>
      {commentaries.map((c, i) => (
        <div key={i} className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpandedCards((p) => ({ ...p, [i]: !p[i] }))}
            className="w-full text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-warm-brown">{c.author}</span>
              {c.date && (
                <span className="text-[9px] bg-cream-dark text-warm-brown-light px-1.5 py-0.5 rounded-full">{c.date}</span>
              )}
            </div>
            {c.verseRef && <p className="text-[10px] text-gold mb-1">{c.verseRef}</p>}
          </button>
          <p className={`text-xs text-warm-brown leading-relaxed ${expandedCards[i] ? "" : "line-clamp-3"}`}>
            {c.quote}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {c.quote.length > 150 && (
              <button type="button" onClick={() => setExpandedCards((p) => ({ ...p, [i]: !p[i] }))} className="text-[10px] text-gold">
                {expandedCards[i] ? "Less" : "More"}
              </button>
            )}
            {expandedCards[i] && (
              <button type="button" onClick={() => saveCommentary(c, book, chapter)} className="text-[10px] text-warm-brown-light hover:text-gold flex items-center gap-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save
              </button>
            )}
          </div>
        </div>
      ))}
      {bibleHubUrl && (
        <div className="p-3 text-center">
          <a href={bibleHubUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-warm-brown-light hover:text-gold">
            More on BibleHub
          </a>
        </div>
      )}
    </div>
  );
}

/* ─── Notes Tab ─── */
function NotesTab({ book, chapter, notes, onSaveNote, onDeleteNote }) {
  const [editingVerse, setEditingVerse] = useState(null);
  const [noteText, setNoteText] = useState("");

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

  if (notes.length === 0 && !editingVerse) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-warm-brown-light">No notes for this chapter yet.</p>
        <p className="text-xs text-warm-brown-light/60 mt-1">Tap a verse number to add notes.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {editingVerse && (
        <div className="bg-cream rounded-lg p-3">
          <p className="text-[10px] text-gold font-medium mb-2">
            {book} {chapter}:{editingVerse}
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full h-20 bg-white rounded-lg px-3 py-2 text-xs text-warm-brown resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
            placeholder="Write a note..."
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setEditingVerse(null)} className="text-[10px] text-warm-brown-light">Cancel</button>
            <button type="button" onClick={save} className="text-[10px] text-gold font-medium">Save</button>
          </div>
        </div>
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

  // Clean HTML entities
  const clean = (t) => t?.replace(/&#39\s+s\b/g, "'s").replace(/&#(\d+);?/g, (_, c) => String.fromCharCode(parseInt(c))).replace(/&amp;/g, "&") || "";

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

      {wordInfo.kjv_def && (
        <StudySection title="KJV Translations">
          <div className="flex flex-wrap gap-1">
            {wordInfo.kjv_def.split(",").map((t, i) => (
              <span key={i} className="text-[10px] bg-cream-dark px-2 py-0.5 rounded-full text-warm-brown">{t.trim()}</span>
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

      {wordInfo.occurrences && (
        <StudySection title="Occurrences">
          <p className="text-xs">{wordInfo.occurrences}</p>
        </StudySection>
      )}

      {/* External links */}
      {wordInfo.biblehub_url && (
        <div className="pt-2 border-t border-cream-dark space-y-1.5">
          <a href={wordInfo.biblehub_url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-gold hover:text-gold/80">
            BibleHub: {wordInfo.strongs}
          </a>
          {wordInfo.blb_url && (
            <a href={wordInfo.blb_url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-gold hover:text-gold/80">
              Blue Letter Bible: {wordInfo.strongs}
            </a>
          )}
        </div>
      )}
    </div>
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
        placeholder="What stood out to you? What is God speaking to your heart?"
        className="w-full h-32 bg-cream rounded-lg px-3 py-2 text-sm text-warm-brown placeholder-warm-brown-light/40 resize-none focus:outline-none focus:ring-1 focus:ring-gold/30 font-scripture leading-relaxed"
      />
      <button
        type="button"
        onClick={saveJournalEntry}
        disabled={!text.trim() || saved}
        className={`w-full mt-2 py-2 rounded-lg text-sm font-medium transition-colors ${
          saved ? "bg-green-100 text-green-600" : "bg-gold text-white hover:bg-gold/90 disabled:opacity-40"
        }`}
      >
        {saved ? "Saved!" : "Save to Journal"}
      </button>
      <a href="/journal" className="block text-center text-[10px] text-warm-brown-light hover:text-gold mt-2">
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
