import { useState, useEffect } from "react";
import { fetchCommentaries, getBibleHubUrl } from "../../services/commentaryService";

const TABS = [
  { id: "commentary", label: "Commentary" },
  { id: "notes", label: "Notes" },
  { id: "wordstudy", label: "Word Study" },
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
  // Keep a local copy so the word study persists after the popup closes
  const [lastWordInfo, setLastWordInfo] = useState(null);

  useEffect(() => {
    if (activeWordInfo) {
      setLastWordInfo(activeWordInfo);
      setActiveTab("wordstudy");
    }
  }, [activeWordInfo]);

  const displayedWord = activeWordInfo || lastWordInfo;

  return (
    <div className="flex flex-col h-full bg-white border-l border-cream-dark">
      {/* Tabs */}
      <div className="flex border-b border-cream-dark shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab(tab.id); }}
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

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {activeTab === "commentary" && (
          <CommentaryTab book={book} chapter={chapter} />
        )}
        {activeTab === "notes" && (
          <NotesTab
            book={book}
            chapter={chapter}
            notes={notes}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        )}
        {activeTab === "wordstudy" && (
          <WordStudyTab wordInfo={displayedWord} />
        )}
      </div>
    </div>
  );
}

/* ─── Commentary Tab ─── */
function CommentaryTab({ book, chapter }) {
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCommentaries([]);
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
      {commentaries.map((c, i) => (
        <div key={i} className="px-4 py-3">
          <button
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
          {c.quote.length > 150 && (
            <button
              onClick={() => setExpandedCards((p) => ({ ...p, [i]: !p[i] }))}
              className="text-[10px] text-gold mt-1"
            >
              {expandedCards[i] ? "Show less" : "Read more"}
            </button>
          )}
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
            <button onClick={() => setEditingVerse(null)} className="text-[10px] text-warm-brown-light">Cancel</button>
            <button onClick={save} className="text-[10px] text-gold font-medium">Save</button>
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
              <button
                onClick={() => startEdit(note.verseNumber, note.text)}
                className="text-[10px] text-warm-brown-light hover:text-warm-brown"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteNote(note.verseNumber)}
                className="text-[10px] text-red-400 hover:text-red-500"
              >
                Delete
              </button>
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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
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

      {/* Strong's Definition */}
      {wordInfo.strongs_def && (
        <StudySection title="Strong's Definition">
          <p>{wordInfo.strongs_def}</p>
        </StudySection>
      )}

      {/* KJV Definition */}
      {wordInfo.kjv_def && (
        <StudySection title="KJV Translations">
          <p className="font-mono text-xs">{wordInfo.kjv_def}</p>
        </StudySection>
      )}

      {/* Derivation / Etymology */}
      {wordInfo.derivation && (
        <StudySection title="Derivation">
          <p>{wordInfo.derivation}</p>
        </StudySection>
      )}

      {/* Usage */}
      {wordInfo.outline_usage && (
        <StudySection title="Usage">
          <p>{wordInfo.outline_usage}</p>
        </StudySection>
      )}

      {/* Occurrences */}
      {wordInfo.occurrences && (
        <StudySection title="Occurrences">
          <p className="text-xs">{wordInfo.occurrences}</p>
        </StudySection>
      )}
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
