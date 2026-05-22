import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import useJournal from "../hooks/useJournal";
import { tokenizeRefs, refToUrl } from "../utils/scriptureRef";

const MOODS = [
  { value: "reflective", label: "Reflective" },
  { value: "thankful",   label: "Thankful" },
  { value: "questioning", label: "Questioning" },
  { value: "convicted",  label: "Convicted" },
  { value: "joyful",     label: "Joyful" },
  { value: "sorrowful",  label: "Sorrowful" },
];

export default function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getEntry, saveEntry, deleteEntry } = useJournal();
  const isNew = id === "new";

  // URL params passed from "Add to Journal" in the reader
  const urlBook    = searchParams.get("book")    || "";
  const urlChapter = searchParams.get("chapter") || "";
  const urlVerse   = searchParams.get("verse")   || "";
  const urlText    = searchParams.get("text")    || "";

  const [title,       setTitle]       = useState("");
  const [content,     setContent]     = useState("");
  const [mood,        setMood]        = useState("");
  const [book,        setBook]        = useState(urlBook);
  const [chapter,     setChapter]     = useState(urlChapter);
  const [verseNumber, setVerseNumber] = useState(urlVerse);
  const [verseText,   setVerseText]   = useState(urlText);
  const [loaded,      setLoaded]      = useState(isNew);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef(null);

  // Load existing entry
  useEffect(() => {
    if (!isNew) {
      getEntry(id).then((entry) => {
        if (entry) {
          setTitle(entry.title || "");
          setContent(entry.content || "");
          setMood(entry.mood || "");
          setBook(entry.book || "");
          setChapter(entry.chapter?.toString() || "");
          setVerseNumber(entry.verseNumber?.toString() || "");
          setVerseText(entry.verseText || "");
        }
        setLoaded(true);
      });
    }
  }, [id, isNew]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  const hasRef = book && chapter;
  const refLabel = hasRef
    ? `${book} ${chapter}${verseNumber ? `:${verseNumber}` : ""}`
    : "";

  const clearRef = () => {
    setBook(""); setChapter(""); setVerseNumber(""); setVerseText("");
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    await saveEntry({
      id: isNew ? undefined : id,
      title: title.trim() || "Untitled",
      content: content.trim(),
      mood: mood || undefined,
      book: book || undefined,
      chapter: chapter ? parseInt(chapter) : undefined,
      verseNumber: verseNumber ? parseInt(verseNumber) : undefined,
      verseText: verseText || undefined,
      tags: [],
    });
    navigate("/journal", { replace: true });
  };

  const handleDelete = async () => {
    await deleteEntry(id);
    navigate("/journal", { replace: true });
  };

  if (!loaded) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <Link
          to="/journal"
          className="text-sm text-warm-brown-light hover:text-warm-brown flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Journal
        </Link>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="bg-gold text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gold/90 disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Verse quote block — shown when coming from reader or an existing entry has verse text */}
      {verseText && (
        <div className="mb-4 bg-scripture-bg rounded-xl border border-gold/20 px-4 py-3">
          <p className="text-xs font-semibold text-gold mb-1.5">{refLabel}</p>
          <p className="text-sm text-warm-brown leading-relaxed font-scripture italic">
            "{verseText}"
          </p>
        </div>
      )}

      {/* Scripture reference chip */}
      {hasRef && !verseText && (
        <div className="mb-4 flex items-center gap-2">
          <Link
            to={`/read/${encodeURIComponent(book)}/${chapter}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold rounded-full text-xs font-semibold hover:bg-gold/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            {refLabel}
          </Link>
          <button
            onClick={clearRef}
            className="text-warm-brown-light/50 hover:text-warm-brown-light transition-colors"
            aria-label="Remove reference"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title..."
        className="w-full text-xl font-semibold text-warm-brown placeholder-warm-brown-light/40 bg-transparent border-none focus:outline-none mb-3"
      />

      {/* Mood chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(mood === m.value ? "" : m.value)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              mood === m.value
                ? "bg-gold text-white"
                : "bg-cream-dark text-warm-brown-light hover:bg-gold/10"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Scripture reference inputs (collapsed to one row if no ref yet, hidden if chip showing) */}
      {!hasRef && (
        <RefInputRow
          book={book} setBook={setBook}
          chapter={chapter} setChapter={setChapter}
          verse={verseNumber} setVerse={setVerseNumber}
        />
      )}
      {hasRef && verseText && (
        <div className="flex items-center gap-2 mb-4">
          <Link
            to={`/read/${encodeURIComponent(book)}/${chapter}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold rounded-full text-xs font-semibold hover:bg-gold/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Open in reader
          </Link>
          <button
            onClick={clearRef}
            className="text-warm-brown-light/50 hover:text-warm-brown-light transition-colors"
            aria-label="Remove reference"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Main content */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
        }}
        placeholder="Write your reflections… (verse references like John 3:16 will become tappable links)"
        className="w-full min-h-[280px] bg-scripture-bg rounded-xl px-4 py-3 text-warm-brown placeholder-warm-brown-light/40 resize-none focus:outline-none focus:ring-2 focus:ring-gold/30 font-scripture leading-relaxed"
        autoFocus={isNew}
        style={{ overflow: "hidden" }}
      />

      {/* Live preview of ref links found in content */}
      <RefPreview content={content} />

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl max-w-xs w-full">
              <h3 className="text-warm-brown font-semibold mb-2">Delete Entry?</h3>
              <p className="text-sm text-warm-brown-light mb-4">This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm border border-cream-dark text-warm-brown-light hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Three compact inputs for scripture reference */
function RefInputRow({ book, setBook, chapter, setChapter, verse, setVerse }) {
  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={book}
        onChange={(e) => setBook(e.target.value)}
        placeholder="Book (e.g. John)"
        className="flex-1 text-sm bg-cream-dark rounded-lg px-3 py-2 text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <input
        type="number"
        value={chapter}
        onChange={(e) => setChapter(e.target.value)}
        placeholder="Ch"
        className="w-14 text-sm bg-cream-dark rounded-lg px-3 py-2 text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <input
        type="number"
        value={verse}
        onChange={(e) => setVerse(e.target.value)}
        placeholder="V"
        className="w-14 text-sm bg-cream-dark rounded-lg px-3 py-2 text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
    </div>
  );
}

/**
 * Detects scripture references typed in the content field and shows them
 * as a live preview row of tappable chips beneath the textarea.
 */
function RefPreview({ content }) {
  const tokens = tokenizeRefs(content || "");
  const refs = tokens.filter((t) => t.type === "ref");
  if (refs.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {refs.map(({ ref }, i) => (
        <Link
          key={i}
          to={refToUrl(ref)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gold/10 text-gold rounded-full text-[11px] font-semibold hover:bg-gold/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          {ref.raw}
        </Link>
      ))}
      <span className="text-[10px] text-warm-brown-light/50 self-center">— tap to open</span>
    </div>
  );
}

/**
 * Renders journal entry content with scripture references replaced by
 * tappable gold link chips. Used when viewing a saved entry.
 */
export function RichContent({ text, className = "" }) {
  const tokens = tokenizeRefs(text || "");
  return (
    <p className={`text-sm text-warm-brown leading-relaxed whitespace-pre-wrap ${className}`}>
      {tokens.map((token, i) =>
        token.type === "ref" ? (
          <Link
            key={i}
            to={refToUrl(token.ref)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gold/10 text-gold rounded text-xs font-semibold hover:bg-gold/20 transition-colors mx-0.5"
          >
            {token.text}
          </Link>
        ) : (
          <span key={i}>{token.text}</span>
        )
      )}
    </p>
  );
}
