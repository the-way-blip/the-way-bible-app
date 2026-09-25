import { useEffect, useRef, useState, useCallback } from "react";
import { getChapterAudio, NARRATION } from "../../services/audioService";

const SPEEDS = [1, 1.25, 1.5, 0.75];

/**
 * Mini player for the narrated KJV. Follows along verse by verse and keeps
 * playing into the next chapter (onChapterEnd navigates the reader there).
 */
export default function NarratedAudio({ book, chapter, startVerse, playToken, onChapterEnd, onClose }) {
  const audioRef = useRef(null);
  const [info, setInfo] = useState(null);         // chapter timings
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [verse, setVerse] = useState(null);
  const [speed, setSpeed] = useState(() => parseFloat(localStorage.getItem("audioSpeed")) || 1);
  const [follow, setFollow] = useState(() => localStorage.getItem("audioFollow") !== "false");
  const seekVerse = useRef(startVerse || null);   // explicit "play from verse N" request
  const infoRef = useRef(null);

  useEffect(() => { seekVerse.current = startVerse || null; }, [startVerse, playToken]);

  // Load timings whenever the chapter changes (or "play from verse" is requested)
  useEffect(() => {
    let cancelled = false;
    setMissing(false);
    getChapterAudio(book, chapter).then((data) => {
      if (cancelled) return;
      const a = audioRef.current;
      if (!data) { setMissing(true); setInfo(null); infoRef.current = null; a.pause(); return; }
      setInfo(data); infoRef.current = data;
      const sameFile = a.currentSrc === data.url || a.src === data.url;
      const continuing = sameFile && !a.paused && a.currentTime >= data.start - 3 && a.currentTime < data.end;
      const v = seekVerse.current;
      seekVerse.current = null;
      if (continuing && !v) return;               // rolled straight on from the previous chapter
      const from = v ? (data.verses[v - 1] ?? data.start) : data.start;
      const go = () => { a.currentTime = from; a.playbackRate = speed; a.play().catch(() => setPlaying(false)); };
      if (sameFile && a.readyState >= 1) go();
      else { a.src = data.url; a.addEventListener("loadedmetadata", go, { once: true }); }
      if ("mediaSession" in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new window.MediaMetadata({ title: `${book} ${chapter}`, artist: `${data.reader} · King James Version`, album: "TheWay Bible" });
      }
    });
    return () => { cancelled = true; };
  }, [book, chapter, playToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; localStorage.setItem("audioSpeed", String(speed)); }, [speed]);
  useEffect(() => { localStorage.setItem("audioFollow", String(follow)); }, [follow]);

  // Verse highlight
  useEffect(() => {
    const scope = document;
    scope.querySelectorAll(".verse-playing").forEach((el) => el.classList.remove("verse-playing"));
    if (!verse) return;
    const el = scope.querySelector(`[data-chapter-ref="${book}-${chapter}"] [data-verse="${verse}"]`) || scope.querySelector(`[data-verse="${verse}"]`);
    if (!el) return;
    el.classList.add("verse-playing");
    if (follow) {
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > window.innerHeight - 170) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [verse, book, chapter, follow]);
  useEffect(() => () => document.querySelectorAll(".verse-playing").forEach((el) => el.classList.remove("verse-playing")), []);

  const onTime = useCallback(() => {
    const a = audioRef.current, d = infoRef.current;
    if (!a || !d) return;
    const t = a.currentTime;
    let v = 1;
    for (let i = 0; i < d.verses.length; i++) if (d.verses[i] <= t + 0.15) v = i + 1;
    setVerse(t >= d.start ? v : null);
    if (t >= d.end - 0.1 && !a.paused) {
      infoRef.current = null;
      onChapterEnd?.();          // reader navigates; the load effect continues playback
    }
  }, [onChapterEnd]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !info) return;
    if (a.paused) { if (a.currentTime < info.start || a.currentTime > info.end) a.currentTime = info.start; a.play(); } else a.pause();
  };
  const skip = (s) => { const a = audioRef.current; if (a && info) a.currentTime = Math.max(info.start, Math.min(info.end - 0.5, a.currentTime + s)); };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(15));
    navigator.mediaSession.setActionHandler("nexttrack", () => onChapterEnd?.());
  });

  const close = () => { audioRef.current?.pause(); onClose(); };

  return (
    <div className="fixed left-0 right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-4 md:left-auto md:right-6 md:w-96 z-40 px-3 md:px-0">
      <audio ref={audioRef} preload="metadata" onTimeUpdate={onTime}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => onChapterEnd?.()} />
      <div className="bg-white border border-cream-dark shadow-xl shadow-warm-brown/10 rounded-2xl px-3 py-2.5 flex items-center gap-2">
        <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds" className="w-9 h-9 flex items-center justify-center text-warm-brown-light hover:text-warm-brown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" /></svg>
        </button>
        <button type="button" onClick={toggle} disabled={!info} aria-label={playing ? "Pause" : "Play"}
          className="w-11 h-11 rounded-full bg-gold text-white flex items-center justify-center shadow-md shadow-gold/20 disabled:opacity-40">
          {playing
            ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><polygon points="6 4 20 12 6 20 6 4" /></svg>}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-warm-brown truncate">
            {missing ? "Narration coming soon for this book" : `${book} ${chapter}${verse ? `:${verse}` : ""}`}
          </p>
          <p className="text-[10px] text-warm-brown-light truncate">KJV read by {info?.reader || NARRATION.reader} · LibriVox</p>
        </div>
        <button type="button" onClick={() => setFollow((f) => !f)} aria-pressed={follow} title="Follow along"
          className={`text-[10px] font-semibold px-1.5 py-1 rounded-md ${follow ? "text-gold bg-gold/10" : "text-warm-brown-light"}`}>Follow</button>
        <button type="button" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Playback speed"
          className="text-[11px] font-semibold text-warm-brown-light w-9">{speed}×</button>
        <button type="button" onClick={close} aria-label="Close player" className="w-8 h-8 flex items-center justify-center text-warm-brown-light hover:text-warm-brown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  );
}
