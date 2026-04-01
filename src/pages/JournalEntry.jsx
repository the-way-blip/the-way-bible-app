import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useJournal from "../hooks/useJournal";

const MOODS = [
  { value: "reflective", label: "Reflective" },
  { value: "thankful", label: "Thankful" },
  { value: "questioning", label: "Questioning" },
  { value: "convicted", label: "Convicted" },
  { value: "joyful", label: "Joyful" },
  { value: "sorrowful", label: "Sorrowful" },
];

export default function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEntry, saveEntry, deleteEntry } = useJournal();
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verseNumber, setVerseNumber] = useState("");
  const [loaded, setLoaded] = useState(isNew);

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
        }
        setLoaded(true);
      });
    }
  }, [id, isNew]);

  const handleSave = async () => {
    if (!content.trim()) return;
    const entryId = await saveEntry({
      id: isNew ? undefined : id,
      title: title.trim() || "Untitled",
      content: content.trim(),
      mood: mood || undefined,
      book: book || undefined,
      chapter: chapter ? parseInt(chapter) : undefined,
      verseNumber: verseNumber ? parseInt(verseNumber) : undefined,
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
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
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
              onClick={handleDelete}
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

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title..."
        className="w-full text-xl font-semibold text-warm-brown placeholder-warm-brown-light/40 bg-transparent border-none focus:outline-none mb-4"
      />

      {/* Mood selector */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Verse link */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={book}
          onChange={(e) => setBook(e.target.value)}
          placeholder="Book"
          className="flex-1 text-sm bg-cream-dark rounded-lg px-3 py-2 text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <input
          type="number"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          placeholder="Ch"
          className="w-16 text-sm bg-cream-dark rounded-lg px-3 py-2 text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <input
          type="number"
          value={verseNumber}
          onChange={(e) => setVerseNumber(e.target.value)}
          placeholder="V"
          className="w-16 text-sm bg-cream-dark rounded-lg px-3 py-2 text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reflections..."
        className="w-full min-h-[300px] bg-scripture-bg rounded-xl px-4 py-3 text-warm-brown placeholder-warm-brown-light/40 resize-none focus:outline-none focus:ring-2 focus:ring-gold/30 font-scripture leading-relaxed"
        autoFocus={isNew}
      />
    </div>
  );
}
