import { useEffect, useRef, useState, useCallback } from "react";
import { getChapterAudio, NARRATION } from "../../services/audioService";


/**
 * Mini player for the narrated KJV. Follows along verse by verse and keeps
 * playing into the next chapter (onChapterEnd navigates the reader there).
 */
// archive.org storage can stall on the first request for a file; retry, then offer a manual retry
const STALL_MS = 9000;
const RETRIES = 3;

const SLEEP_OPTIONS = [[15, "15 min"], [30, "30 min"], [45, "45 min"], [60, "1 hour"]];

export default function NarratedAudio({ audioRef, book, chapter, startVerse, playToken, onChapterEnd, onClose, queue, sleep, onSleep }) {
  const [sleepMenu, setSleepMenu] = useState(false);
  const [, tick] = useState(0); // re-render the sleep countdown
  useEffect(() => {
    if (!sleep?.until) return;
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, [sleep]);
  const sleepLeft = sleep?.until ? Math.max(1, Math.ceil((sleep.until - Date.now()) / 60000)) : null;
  const [info, setInfo] = useState(null);         // chapter timings
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [retry, setRetry] = useState(0);
  const [verse, setVerse] = useState(null);
  const [speed, setSpeed] = useState(() => parseFloat(localStorage.getItem("audioSpeed")) || 1);
  const [follow, setFollow] = useState(() => localStorage.getItem("audioFollow") !== "false");
  const seekVerse = useRef(startVerse || null);   // explicit "play from verse N" request
  const infoRef = useRef(null);

  useEffect(() => { seekVerse.current = startVerse || null; }, [startVerse, playToken]);

  // Load timings whenever the chapter changes (or "play from verse" is requested)
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const a = audioRef.current;
    setMissing(false);
    getChapterAudio(book, chapter).then((first) => {
      if (cancelled || !a) return;
      if (!first) { setMissing(true); setInfo(null); infoRef.current = null; setStatus("ready"); a.pause(); return; }
      let data = first;
      const v = seekVerse.current;
      seekVerse.current = null;
      const adopt = (d) => { data = d; setInfo(d); infoRef.current = d; };
      adopt(first);
      const sameFile = a.currentSrc === data.url || a.src === data.url;
      const continuing = sameFile && !a.paused && a.currentTime >= data.start - 3 && a.currentTime < data.end;
      if (continuing && !v) return;               // rolled straight on from the previous chapter
      const from = () => (v ? (data.verses[v - 1] ?? data.start) : data.start);
      const go = () => {
        clearTimeout(timer);
        a.currentTime = from();
        a.playbackRate = speed;
        a.play().catch(() => { setPlaying(false); setStatus("ready"); }); // blocked: the play button still works
      };
      if (sameFile && a.readyState >= 1) go();
      else {
        setStatus("loading");
        let attempts = 0;
        const load = () => {
          const failed = () => {
            clearTimeout(timer);
            a.removeEventListener("loadedmetadata", go);
            a.removeEventListener("error", failed);
            if (cancelled || a.readyState >= 1) return;
            if (data.fallback) { adopt(data.fallback); load(); return; } // our host failed: use archive.org
            if (++attempts < RETRIES) load(); // a stalled first request usually succeeds on the next try
            else setStatus("error");
          };
          a.src = data.url;
          a.addEventListener("loadedmetadata", go, { once: true });
          a.addEventListener("error", failed, { once: true });
          a.play().catch(() => {}); // start fetching while still close to the tap; go() seeks once metadata arrives
          timer = setTimeout(failed, STALL_MS);
        };
        load();
      }
      if ("mediaSession" in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new window.MediaMetadata({ title: `${book} ${chapter}`, artist: `${data.reader} · King James Version`, album: "TheWay Bible" });
      }
    });
    return () => { cancelled = true; clearTimeout(timer); };
  }, [book, chapter, playToken, retry]); // eslint-disable-line react-hooks/exhaustive-deps


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

  // Moving on must happen once per chapter, and since self-hosting there are
  // two triggers for it. An archive.org file holds many chapters, so the end of
  // one is spotted by watching currentTime; a per-chapter file also raises
  // `ended` a tenth of a second later. Both firing skipped a chapter.
  const advance = useCallback(() => {
    if (!infoRef.current) return;   // already advanced for this chapter
    infoRef.current = null;
    onChapterEnd?.();               // reader navigates; the load effect continues playback
  }, [onChapterEnd]);

  const onTime = useCallback(() => {
    const a = audioRef.current, d = infoRef.current;
    if (!a || !d) return;
    const t = a.currentTime;
    let v = 1;
    for (let i = 0; i < d.verses.length; i++) if (d.verses[i] <= t + 0.15) v = i + 1;
    setVerse(t >= d.start ? v : null);
    if (t >= d.end - 0.1 && !a.paused) advance();
  }, [advance, audioRef]);

  // Element events (the <audio> lives in AudioProvider)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const on = {
      timeupdate: () => onTime(),
      play: () => setPlaying(true),
      playing: () => { setPlaying(true); setStatus("ready"); },
      pause: () => setPlaying(false),
      waiting: () => setStatus((s) => (s === "error" ? s : "loading")),
      canplay: () => setStatus((s) => (s === "loading" ? "ready" : s)),
      ended: () => advance(),
      // A failure after the file is already playing — the network dropping
      // mid-chapter — is not covered by the loader's own error handling.
      error: () => { if (infoRef.current && a.readyState < 1) setStatus("error"); },
    };
    for (const [k, f] of Object.entries(on)) a.addEventListener(k, f);
    return () => { for (const [k, f] of Object.entries(on)) a.removeEventListener(k, f); };
  }); // re-bind each render so handlers see current props

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !info) return;
    if (status === "error") { setRetry((n) => n + 1); return; }
    if (!a.paused) { a.pause(); return; }
    if (a.src !== info.url) { setRetry((n) => n + 1); return; }
    if (a.readyState >= 1 && (a.currentTime < info.start || a.currentTime > info.end)) a.currentTime = info.start;
    a.play().catch(() => setStatus("error"));
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

  const close = () => onClose();

  return (
    <div className="fixed left-0 right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-4 md:left-auto md:right-6 md:w-96 z-40 px-3 md:px-0">
      <div className="bg-white border border-cream-dark shadow-xl shadow-warm-brown/10 rounded-2xl px-3 py-2.5 flex items-center gap-2">
        <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds" className="w-9 h-9 flex items-center justify-center text-warm-brown-light hover:text-warm-brown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" /></svg>
        </button>
        <button type="button" onClick={toggle} disabled={!info && !missing} aria-label={status === "error" ? "Retry" : playing ? "Pause" : "Play"}
          className="w-11 h-11 rounded-full bg-gold text-white flex items-center justify-center shadow-md shadow-gold/20 disabled:opacity-40">
          {status === "loading" && !missing
            ? <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
            : status === "error"
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><polyline points="21 3 21 8 16 8" /></svg>
              : playing
                ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><polygon points="6 4 20 12 6 20 6 4" /></svg>}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-warm-brown truncate">
            {missing ? "Narration coming soon for this book" : `${book} ${chapter}${verse ? `:${verse}` : ""}`}
          </p>
          <p className="text-[10px] text-warm-brown-light truncate">
            {status === "error" ? "Couldn't reach the audio server. Tap to retry."
              : status === "loading" && !missing ? "Loading narration…"
              : queue?.done ? `${queue.label || "Reading"} finished`
              : queue ? `${queue.label ? `${queue.label} · ` : ""}${queue.index + 1} of ${queue.total}`
              : `KJV read by ${info?.reader || NARRATION.reader} · LibriVox`}
          </p>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setSleepMenu((o) => !o)} aria-label="Player options: speed, follow along, sleep timer" aria-expanded={sleepMenu}
            className={`h-9 min-w-9 px-1.5 flex items-center justify-center gap-1 rounded-lg text-[10px] font-semibold ${sleep || speed !== 1 ? "text-gold bg-gold/10" : "text-warm-brown-light hover:text-warm-brown"}`}>
            {sleep
              ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>{sleepLeft ? `${sleepLeft}m` : "Ch"}</>
              : speed !== 1
                ? <span className="text-[11px]">{speed}×</span>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>}
          </button>
          {sleepMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSleepMenu(false)} aria-hidden="true" />
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl border border-cream-dark shadow-xl p-1.5 z-50">
                <p className="px-2 pt-1 pb-1.5 text-[10px] uppercase tracking-wider font-semibold text-warm-brown-light">Speed</p>
                <div className="flex gap-1 px-1 pb-2" role="group" aria-label="Playback speed">
                  {[0.75, 1, 1.25, 1.5].map((v) => (
                    <button key={v} type="button" onClick={() => setSpeed(v)} aria-pressed={speed === v}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${speed === v ? "bg-gold text-white" : "bg-cream-dark/60 text-warm-brown"}`}>{v}×</button>
                  ))}
                </div>
                <button type="button" onClick={() => setFollow((f) => !f)} role="switch" aria-checked={follow}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm text-warm-brown hover:bg-cream-dark/50">
                  <span>Follow along in the text</span>
                  <span className={`w-9 h-5 rounded-full relative transition-colors ${follow ? "bg-gold" : "bg-cream-dark"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${follow ? "left-[18px]" : "left-0.5"}`} />
                  </span>
                </button>
                <p className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-warm-brown-light border-t border-cream-dark mt-1">Sleep timer{sleep ? ` · ${sleepLeft ? `${sleepLeft} min left` : "end of chapter"}` : ""}</p>
                <div className="grid grid-cols-2 gap-1 px-1 pb-1" role="menu">
                  {SLEEP_OPTIONS.map(([m, label]) => (
                    <button key={m} type="button" role="menuitem" onClick={() => { onSleep({ until: Date.now() + m * 60000 }); setSleepMenu(false); }}
                      className="py-1.5 rounded-lg text-xs text-warm-brown bg-cream-dark/60 hover:bg-cream-dark">{label}</button>
                  ))}
                  <button type="button" role="menuitem" onClick={() => { onSleep({ chapter: true }); setSleepMenu(false); }}
                    className="col-span-2 py-1.5 rounded-lg text-xs text-warm-brown bg-cream-dark/60 hover:bg-cream-dark">End of this chapter</button>
                  {sleep && (
                    <button type="button" role="menuitem" onClick={() => { onSleep(null); setSleepMenu(false); }}
                      className="col-span-2 py-1.5 rounded-lg text-xs font-semibold text-gold hover:bg-gold/10">Turn off sleep timer</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <button type="button" onClick={close} aria-label="Close player" className="w-8 h-8 flex items-center justify-center text-warm-brown-light hover:text-warm-brown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  );
}
