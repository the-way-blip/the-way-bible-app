import { createContext, useContext, useState, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { getNextChapter } from "../data/bibleBooks";

const NarratedAudio = lazy(() => import("../features/reader/NarratedAudio"));
const AudioContext = createContext(null);

/** Narrated-audio player that lives above the routes, so it keeps playing across chapters and pages. */
export function AudioProvider({ children }) {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null); // { book, chapter, verse, token }
  const playerRef = useRef(null);
  playerRef.current = player;

  const open = useCallback((book, chapter, verse = null) => setPlayer({ book, chapter, verse, token: Date.now() }), []);
  const close = useCallback(() => setPlayer(null), []);
  // Reader reports the chapter on screen; the player follows it without restarting if already there
  const follow = useCallback((book, chapter) => {
    setPlayer((p) => (p && (p.book !== book || p.chapter !== chapter) ? { ...p, book, chapter, verse: null } : p));
  }, []);
  const onChapterEnd = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const next = getNextChapter(p.book, p.chapter);
    if (!next) { setPlayer(null); return; }
    setPlayer({ ...p, book: next.book, chapter: next.chapter, verse: null });
    navigate(`/read/${encodeURIComponent(next.book)}/${next.chapter}`);
  }, [navigate]);

  return (
    <AudioContext.Provider value={{ player, open, close, follow }}>
      {children}
      {player && (
        <Suspense fallback={null}>
          <NarratedAudio book={player.book} chapter={player.chapter} startVerse={player.verse} playToken={player.token}
            onChapterEnd={onChapterEnd} onClose={close} />
        </Suspense>
      )}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
