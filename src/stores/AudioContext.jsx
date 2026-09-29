import { createContext, useContext, useState, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { getNextChapter } from "../data/bibleBooks";

const NarratedAudio = lazy(() => import("../features/reader/NarratedAudio"));
const AudioContext = createContext(null);

// A tenth of a second of silence. Playing it inside the tap that opens the
// player "unlocks" the audio element, so iOS lets it start the real narration
// later, once the chapter timings and the recording have loaded.
const SILENCE = "data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYzLjEuMTAxAAAAAAAAAAAAAAD/83DAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAABUwCdnZ2dnZ2dnZ2dnZ2dnZ2dsbGxsbGxsbGxsbGxsbGxsbHFxcXFxcXFxcXFxcXFxcXF2NjY2NjY2NjY2NjY2NjY2Njs7Ozs7Ozs7Ozs7Ozs7Ozs7P////////////////////8AAAAATGF2YzYzLjEuAAAAAAAAAAAAAAAAJAKjAAAAAAAAAVPHdMtAAAAAAAAAAAAAAAAAAP/zEMQAAAADSAAAAABMQU1FMy4xMDBVVVVV//MSxA0AAANIAAAAAFVVVVVVVVVVVVVVVVVV//MQxBsAAANIAAAAAFVVVVVVVVVVVVVVVVX/8xDEKAAAA0gAAAAAVVVVVVVVVVVVVVVVVf/zEMQ1AAADSAAAAABVVVVVVVVVVVVVVVVV//MQxEIAAANIAAAAAFVVVVVVVVVVVVVVVVU=";

/** Narrated-audio player that lives above the routes, so it keeps playing across chapters and pages. */
export function AudioProvider({ children }) {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null); // { book, chapter, verse, token }
  const playerRef = useRef(null);
  const audioRef = useRef(null);
  playerRef.current = player;

  const unlock = () => {
    const a = audioRef.current;
    if (!a || !a.paused) return;
    a.src = SILENCE;
    a.play().catch(() => {});
  };

  const open = useCallback((book, chapter, verse = null) => {
    unlock(); // must run synchronously inside the tap
    setPlayer({ book, chapter, verse, token: Date.now() });
  }, []);
  const close = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
    setPlayer(null);
  }, []);
  // Reader reports the chapter on screen; the player follows it without restarting if already there
  const follow = useCallback((book, chapter) => {
    setPlayer((p) => (p && (p.book !== book || p.chapter !== chapter) ? { ...p, book, chapter, verse: null } : p));
  }, []);
  const onChapterEnd = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const next = getNextChapter(p.book, p.chapter);
    if (!next) { close(); return; }
    setPlayer({ ...p, book: next.book, chapter: next.chapter, verse: null });
    navigate(`/read/${encodeURIComponent(next.book)}/${next.chapter}`);
  }, [navigate, close]);

  return (
    <AudioContext.Provider value={{ player, open, close, follow }}>
      {children}
      {/* Always mounted so the tap that opens the player can unlock it */}
      <audio ref={audioRef} preload="auto" playsInline className="hidden" />
      {player && (
        <Suspense fallback={null}>
          <NarratedAudio audioRef={audioRef} book={player.book} chapter={player.chapter} startVerse={player.verse} playToken={player.token}
            onChapterEnd={onChapterEnd} onClose={close} />
        </Suspense>
      )}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
