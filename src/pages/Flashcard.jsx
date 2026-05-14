import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useMemoryVerses from "../hooks/useMemoryVerses";
import { dbPut } from "../hooks/useDB";
import { syncPush } from "../services/supabaseSync";
import { useAuth } from "../stores/AuthContext";
import { sm2, getDueVerses } from "../utils/spaced-repetition";
import ShareSheet from "../components/ShareSheet";

// Research-backed memorization modes:
// 1. Classic flashcard (SM-2 spaced repetition)
// 2. First letter mode — shows only first letter of each word
// 3. Fill-in-the-blank — hides random words
// 4. Type it out — user types the verse from memory
// 5. Ordering — scrambled words to put in order

const MODES = [
  { id: "flashcard", name: "Flashcard", desc: "See reference, recall the verse" },
  { id: "first-letter", name: "First Letter", desc: "Only first letters shown as hints" },
  { id: "fill-blank", name: "Fill in Blank", desc: "Key words are hidden" },
  { id: "type-it", name: "Type It", desc: "Type the verse from memory" },
];

export default function Flashcard() {
  const { verses, reload } = useMemoryVerses();
  const { user } = useAuth();
  const [dueVerses, setDueVerses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [mode, setMode] = useState("flashcard");
  const [userInput, setUserInput] = useState("");
  const [shareData, setShareData] = useState(null);

  useEffect(() => {
    setDueVerses(getDueVerses(verses));
  }, [verses]);

  const current = dueVerses[currentIndex];

  const handleRate = async (quality) => {
    const updated = sm2(current, quality);
    await dbPut("memoryVerses", updated);
    syncPush("memoryVerses", updated, user?.id);
    setFlipped(false);
    setUserInput("");
    setCompleted((c) => c + 1);

    if (currentIndex + 1 < dueVerses.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      await reload();
      setCurrentIndex(0);
    }
  };

  if (dueVerses.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link to="/memory" className="text-sm text-warm-brown-light hover:text-warm-brown flex items-center gap-1 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>
          Memory Verses
        </Link>
        <div className="text-center py-16">
          {completed > 0 ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-green-500"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 className="text-lg font-semibold text-warm-brown mb-2">Session Complete</h2>
              <p className="text-sm text-warm-brown-light">{completed} {completed === 1 ? "verse" : "verses"} reviewed.</p>
            </>
          ) : (
            <>
              <p className="text-warm-brown-light text-sm mb-2">No verses due for review.</p>
              <p className="text-warm-brown-light/60 text-xs">
                {verses.length > 0 ? "Check back later." : "Save some memory verses first."}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Generate first-letter hint
  const firstLetterHint = current?.text
    .split(/\s+/)
    .map((w) => w[0] + "_".repeat(Math.max(0, w.replace(/[.,;:!?]/g, "").length - 1)) + (w.match(/[.,;:!?]$/)?.[0] || ""))
    .join(" ");

  // Generate fill-in-the-blank (hide every 3rd word)
  const fillBlank = current?.text
    .split(/\s+/)
    .map((w, i) => (i % 3 === 2 ? "____" : w))
    .join(" ");

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link to="/memory" className="text-sm text-warm-brown-light hover:text-warm-brown flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </Link>
        <span className="text-xs text-warm-brown-light">{currentIndex + 1} of {dueVerses.length}</span>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setFlipped(false); setUserInput(""); }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === m.id ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light hover:bg-gold/10"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-cream-dark rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${(currentIndex / dueVerses.length) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="min-h-[280px] bg-white rounded-2xl border border-cream-dark shadow-sm flex flex-col items-center justify-center p-6 relative">
        {/* Share button */}
        <button
          onClick={() => setShareData({ content: current.text, reference: `${current.book} ${current.chapter}:${current.verseNumber}` })}
          className="absolute top-3 right-3 text-warm-brown-light/40 hover:text-gold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        <p className="text-gold font-medium text-sm mb-4">
          {current.book} {current.chapter}:{current.verseNumber}
        </p>

        {mode === "flashcard" && (
          <div className="text-center cursor-pointer w-full" onClick={() => !flipped && setFlipped(true)}>
            {!flipped ? (
              <p className="text-warm-brown-light text-sm">Tap to reveal the verse</p>
            ) : (
              <p className="font-scripture text-warm-brown text-center leading-relaxed">{current.text}</p>
            )}
          </div>
        )}

        {mode === "first-letter" && (
          <div className="text-center w-full" onClick={() => setFlipped(!flipped)}>
            {!flipped ? (
              <p className="font-scripture text-warm-brown text-center leading-relaxed tracking-wider font-mono text-sm">
                {firstLetterHint}
              </p>
            ) : (
              <p className="font-scripture text-warm-brown text-center leading-relaxed">{current.text}</p>
            )}
            <p className="text-[10px] text-warm-brown-light/50 mt-3">Tap to {flipped ? "hide" : "reveal"}</p>
          </div>
        )}

        {mode === "fill-blank" && (
          <div className="text-center w-full" onClick={() => setFlipped(!flipped)}>
            {!flipped ? (
              <p className="font-scripture text-warm-brown text-center leading-relaxed">{fillBlank}</p>
            ) : (
              <p className="font-scripture text-warm-brown text-center leading-relaxed">{current.text}</p>
            )}
            <p className="text-[10px] text-warm-brown-light/50 mt-3">Tap to {flipped ? "hide" : "reveal"}</p>
          </div>
        )}

        {mode === "type-it" && (
          <div className="w-full">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type the verse from memory..."
              className="w-full h-24 bg-cream rounded-lg px-3 py-2 text-sm text-warm-brown placeholder-warm-brown-light/40 resize-none focus:outline-none focus:ring-2 focus:ring-gold/30 font-scripture"
            />
            {!flipped ? (
              <button
                onClick={() => setFlipped(true)}
                className="w-full mt-2 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors"
              >
                Check Answer
              </button>
            ) : (
              <div className="mt-2 bg-cream rounded-lg p-3">
                <p className="text-[10px] font-medium text-warm-brown-light uppercase mb-1">Correct verse:</p>
                <p className="font-scripture text-sm text-warm-brown leading-relaxed">{current.text}</p>
                {userInput.trim() && (
                  <p className="text-[10px] mt-2 text-warm-brown-light">
                    Similarity: {Math.round(similarity(userInput.trim(), current.text) * 100)}%
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons (show when flipped or in type mode after check) */}
      {flipped && (
        <div className="mt-4">
          <p className="text-xs text-warm-brown-light text-center mb-3">How well did you remember?</p>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => handleRate(1)} className="py-3 rounded-xl text-sm font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Again</button>
            <button onClick={() => handleRate(2)} className="py-3 rounded-xl text-sm font-medium bg-orange-50 text-orange-500 hover:bg-orange-100 transition-colors">Hard</button>
            <button onClick={() => handleRate(3)} className="py-3 rounded-xl text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors">Good</button>
            <button onClick={() => handleRate(5)} className="py-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">Easy</button>
          </div>
        </div>
      )}

      {/* Share sheet */}
      {shareData && (
        <ShareSheet content={shareData.content} reference={shareData.reference} onClose={() => setShareData(null)} />
      )}
    </div>
  );
}

// Simple text similarity (Jaccard on words)
function similarity(a, b) {
  const wordsA = new Set(a.toLowerCase().replace(/[.,;:!?'"]/g, "").split(/\s+/));
  const wordsB = new Set(b.toLowerCase().replace(/[.,;:!?'"]/g, "").split(/\s+/));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}
