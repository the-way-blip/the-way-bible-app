import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Audio Bible using the browser's Speech Synthesis API.
 *
 * No external API key needed — works immediately on every modern browser.
 * Voice quality varies by platform:
 *   - macOS / iOS: Siri voices (excellent)
 *   - Windows: Microsoft Mark/Zira (good)
 *   - Android / Linux: usually decent
 *
 * When we add a higher-quality narrated audio source (e.g. Faith Comes By
 * Hearing / Bible Brain API), this component can be swapped or the source
 * picker extended to add the human-narrated option as the default.
 */
export default function AudioBible({ book, chapter }) {
  const [expanded, setExpanded] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState([]);
  const [voiceIdx, setVoiceIdx] = useState(() => parseInt(localStorage.getItem("audioBibleVoiceIdx")) || 0);
  const [rate, setRate] = useState(() => parseFloat(localStorage.getItem("audioBibleRate")) || 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [loading, setLoading] = useState(false);
  const versesRef = useRef([]);
  const queueRef = useRef([]);

  // Detect support
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      // Prefer English voices
      const englishVoices = all.filter((v) => v.lang?.toLowerCase().startsWith("en"));
      setVoices(englishVoices.length ? englishVoices : all);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Persist preferences
  useEffect(() => { localStorage.setItem("audioBibleVoiceIdx", String(voiceIdx)); }, [voiceIdx]);
  useEffect(() => { localStorage.setItem("audioBibleRate", String(rate)); }, [rate]);

  // Cleanup on unmount / chapter change
  const stop = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    queueRef.current = [];
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentVerse(0);
  }, []);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => { stop(); }, [book, chapter, stop]);

  const fetchVerses = async () => {
    if (versesRef.current.length) return versesRef.current;
    setLoading(true);
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=kjv`);
      const data = await res.json();
      const verses = (data.verses || []).map((v) => ({
        num: v.verse,
        text: v.text.trim().replace(/\s+/g, " "),
      }));
      versesRef.current = verses;
      return verses;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  };

  const speakVerse = useCallback((verses, index) => {
    if (index >= verses.length) {
      stop();
      return;
    }
    setCurrentVerse(verses[index].num);
    const utter = new SpeechSynthesisUtterance(`Verse ${verses[index].num}. ${verses[index].text}`);
    if (voices[voiceIdx]) utter.voice = voices[voiceIdx];
    utter.rate = rate;
    utter.pitch = 1;
    utter.onend = () => {
      if (!queueRef.current.cancelled) speakVerse(verses, index + 1);
    };
    utter.onerror = () => stop();
    window.speechSynthesis.speak(utter);
  }, [voices, voiceIdx, rate, stop]);

  const play = async () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    const verses = await fetchVerses();
    if (!verses.length) return;
    queueRef.current = { cancelled: false };
    setIsPlaying(true);
    setIsPaused(false);
    speakVerse(verses, 0);
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  if (!supported) return null;

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gold">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          Listen to this chapter
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark p-4 space-y-3">
          {/* Player controls */}
          <div className="flex items-center justify-center gap-3">
            {!isPlaying ? (
              <button
                onClick={play}
                disabled={loading}
                aria-label="Play chapter"
                className="w-14 h-14 rounded-full bg-gold text-white flex items-center justify-center shadow-lg shadow-gold/20 hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
            ) : (
              <button
                onClick={pause}
                aria-label="Pause"
                className="w-14 h-14 rounded-full bg-gold text-white flex items-center justify-center shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </button>
            )}
            {(isPlaying || isPaused) && (
              <button
                onClick={stop}
                aria-label="Stop"
                className="w-10 h-10 rounded-full border border-cream-dark text-warm-brown-light hover:text-warm-brown hover:bg-cream-dark/40 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            )}
          </div>

          {currentVerse > 0 && (isPlaying || isPaused) && (
            <p className="text-center text-xs text-warm-brown-light">
              Now reading: <span className="font-medium text-warm-brown">{book} {chapter}:{currentVerse}</span>
            </p>
          )}

          {/* Settings */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-cream-dark/60">
            <div>
              <label htmlFor="audio-voice" className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-1 block">Voice</label>
              <select
                id="audio-voice"
                value={voiceIdx}
                onChange={(e) => setVoiceIdx(parseInt(e.target.value))}
                className="w-full bg-cream border border-cream-dark rounded-lg px-2 py-1.5 text-xs text-warm-brown focus:outline-none focus:border-gold/30"
              >
                {voices.map((v, i) => (
                  <option key={`${v.name}-${i}`} value={i}>
                    {v.name}{v.localService ? "" : " (online)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="audio-rate" className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-1 block">Speed: {rate.toFixed(1)}×</label>
              <input
                id="audio-rate"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-gold"
              />
            </div>
          </div>

          <p className="text-[10px] text-warm-brown-light/60 text-center pt-1">
            Powered by your device's text-to-speech. Human-narrated audio coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
