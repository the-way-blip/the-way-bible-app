import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useMemoryVerses from "../hooks/useMemoryVerses";
import { dbPut } from "../hooks/useDB";
import { sm2, getDueVerses } from "../utils/spaced-repetition";

export default function Flashcard() {
  const { verses, reload } = useMemoryVerses();
  const [dueVerses, setDueVerses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    setDueVerses(getDueVerses(verses));
  }, [verses]);

  const current = dueVerses[currentIndex];

  const handleRate = async (quality) => {
    const updated = sm2(current, quality);
    await dbPut("memoryVerses", updated);
    setFlipped(false);
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
        <Link
          to="/memory"
          className="text-sm text-warm-brown-light hover:text-warm-brown flex items-center gap-1 mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Memory Verses
        </Link>

        <div className="text-center py-16">
          {completed > 0 ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-green-500">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-warm-brown mb-2">Session Complete</h2>
              <p className="text-sm text-warm-brown-light">
                You reviewed {completed} {completed === 1 ? "verse" : "verses"}.
              </p>
            </>
          ) : (
            <>
              <p className="text-warm-brown-light text-sm mb-2">
                No verses due for review right now.
              </p>
              <p className="text-warm-brown-light/60 text-xs">
                {verses.length > 0
                  ? "Check back later when your next review is due."
                  : "Save some memory verses first."}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/memory"
          className="text-sm text-warm-brown-light hover:text-warm-brown flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>
        <span className="text-xs text-warm-brown-light">
          {currentIndex + 1} of {dueVerses.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-cream-dark rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / dueVerses.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className="min-h-[300px] bg-white rounded-2xl border border-cream-dark shadow-sm flex flex-col items-center justify-center p-8 cursor-pointer"
      >
        {!flipped ? (
          <>
            <p className="text-gold font-medium text-sm mb-4">
              {current.book} {current.chapter}:{current.verseNumber}
            </p>
            <p className="text-warm-brown-light text-sm text-center">
              Tap to reveal the verse
            </p>
          </>
        ) : (
          <>
            <p className="text-gold font-medium text-sm mb-4">
              {current.book} {current.chapter}:{current.verseNumber}
            </p>
            <p className="font-scripture text-warm-brown text-center leading-relaxed">
              {current.text}
            </p>
          </>
        )}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="mt-4">
          <p className="text-xs text-warm-brown-light text-center mb-3">
            How well did you remember?
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRate(1)}
              className="py-3 rounded-xl text-sm font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Again
            </button>
            <button
              onClick={() => handleRate(2)}
              className="py-3 rounded-xl text-sm font-medium bg-orange-50 text-orange-500 hover:bg-orange-100 transition-colors"
            >
              Hard
            </button>
            <button
              onClick={() => handleRate(3)}
              className="py-3 rounded-xl text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            >
              Good
            </button>
            <button
              onClick={() => handleRate(5)}
              className="py-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
            >
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
