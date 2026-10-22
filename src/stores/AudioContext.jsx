import { createContext, useContext, useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { getNextChapter } from "../data/bibleBooks";
import { logEvent } from "../services/ga";

const NarratedAudio = lazy(() => import("../features/reader/NarratedAudio"));
const AudioContext = createContext(null);

// A tenth of a second of silence. Playing it inside the tap that opens the
// player "unlocks" the audio element, so iOS lets it start the real narration
// later, once the chapter timings and the recording have loaded.
const SILENCE = "data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYzLjEuMTAxAAAAAAAAAAAAAAD/83DAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAABUwCdnZ2dnZ2dnZ2dnZ2dnZ2dsbGxsbGxsbGxsbGxsbGxsbHFxcXFxcXFxcXFxcXFxcXF2NjY2NjY2NjY2NjY2NjY2Njs7Ozs7Ozs7Ozs7Ozs7Ozs7P////////////////////8AAAAATGF2YzYzLjEuAAAAAAAAAAAAAAAAJAKjAAAAAAAAAVPHdMtAAAAAAAAAAAAAAAAAAP/zEMQAAAADSAAAAABMQU1FMy4xMDBVVVVV//MSxA0AAANIAAAAAFVVVVVVVVVVVVVVVVVV//MQxBsAAANIAAAAAFVVVVVVVVVVVVVVVVX/8xDEKAAAA0gAAAAAVVVVVVVVVVVVVVVVVf/zEMQ1AAADSAAAAABVVVVVVVVVVVVVVVVV//MQxEIAAANIAAAAAFVVVVVVVVVVVVVVVVU=";

/** Narrated-audio player that lives above the routes, so it keeps playing across chapters and pages. */
export function AudioProvider({ children }) {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null); // { book, chapter, verse, token, queue?, qi?, label? }
  // Sleep timer: null, { until: ms timestamp }, or { chapter: true } (stop at the end of this chapter)
  const [sleep, setSleep] = useState(null);
  const playerRef = useRef(null);
  const audioRef = useRef(null);
  playerRef.current = player;
  const sleepRef = useRef(null);
  sleepRef.current = sleep;

  // Timed sleep: fade out over the last 10 seconds, then pause
  useEffect(() => {
    if (!sleep?.until) return;
    const a = audioRef.current;
    let fade;
    const left = sleep.until - Date.now();
    const startFade = setTimeout(() => {
      fade = setInterval(() => {
        if (!a) return;
        const remaining = sleep.until - Date.now();
        if (remaining <= 0) { clearInterval(fade); a.pause(); a.volume = 1; setSleep(null); }
        else a.volume = Math.max(0, Math.min(1, remaining / 10000));
      }, 250);
    }, Math.max(0, left - 10000));
    return () => { clearTimeout(startFade); clearInterval(fade); if (a) a.volume = 1; };
  }, [sleep]);

  const unlock = () => {
    const a = audioRef.current;
    if (!a || !a.paused) return;
    a.src = SILENCE;
    a.play().catch(() => {});
  };

  const open = useCallback((book, chapter, verse = null) => {
    unlock(); // must run synchronously inside the tap
    logEvent("audio_play", { book, chapter, from_verse: verse || 0 });
    setPlayer({ book, chapter, verse, token: Date.now() });
  }, []);
  /** Play a list of chapters in order (e.g. today's reading-plan portion), then stop. */
  const openQueue = useCallback((refs, label = "") => {
    if (!refs?.length) return;
    unlock(); // must run synchronously inside the tap
    logEvent("audio_play", { book: refs[0].book, chapter: refs[0].chapter, from: "queue" });
    setPlayer({ book: refs[0].book, chapter: refs[0].chapter, verse: null, token: Date.now(), queue: refs, qi: 0, label });
    navigate(`/read/${encodeURIComponent(refs[0].book)}/${refs[0].chapter}`);
  }, [navigate]);
  const close = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); a.volume = 1; }
    setPlayer(null);
    setSleep(null);
  }, []);
  // Reader reports the chapter on screen; the player follows it without restarting if already there
  const follow = useCallback((book, chapter) => {
    setPlayer((p) => {
      if (!p || (p.book === book && p.chapter === chapter)) return p;
      // Reading on past the queue (or somewhere else) turns it back into ordinary playback
      const qi = p.queue?.findIndex((r) => r.book === book && r.chapter === chapter) ?? -1;
      return qi >= 0 ? { ...p, book, chapter, verse: null, qi } : { book, chapter, verse: null, token: p.token };
    });
  }, []);
  const onChapterEnd = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (sleepRef.current?.chapter) { audioRef.current?.pause(); setSleep(null); return; }
    let next;
    if (p.queue) {
      next = p.queue[p.qi + 1];
      if (!next) { audioRef.current?.pause(); setPlayer({ ...p, done: true }); return; } // plan portion finished
      setPlayer({ ...p, book: next.book, chapter: next.chapter, verse: null, qi: p.qi + 1 });
    } else {
      next = getNextChapter(p.book, p.chapter);
      if (!next) { close(); return; }
      setPlayer({ ...p, book: next.book, chapter: next.chapter, verse: null });
    }
    navigate(`/read/${encodeURIComponent(next.book)}/${next.chapter}`);
  }, [navigate, close]);

  return (
    <AudioContext.Provider value={{ player, open, openQueue, close, follow }}>
      {children}
      {/* Always mounted so the tap that opens the player can unlock it */}
      <audio ref={audioRef} preload="auto" playsInline className="hidden" />
      {player && (
        <Suspense fallback={null}>
          <NarratedAudio audioRef={audioRef} book={player.book} chapter={player.chapter} startVerse={player.verse} playToken={player.token}
            onChapterEnd={onChapterEnd} onClose={close}
            queue={player.queue ? { label: player.label, index: player.qi, total: player.queue.length, done: player.done } : null}
            sleep={sleep} onSleep={(v) => { setSleep(v); if (v) logEvent("sleep_timer", { minutes: v.chapter ? 0 : Math.round((v.until - Date.now()) / 60000) }); }} />
        </Suspense>
      )}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
