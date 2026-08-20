import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Plays a guided tour across the map.
 *
 * Two things use this. A *journey* tour walks the waypoints of a route the
 * passage traces (the Exodus, Paul's voyage to Rome). A *story* tour walks the
 * places of a chapter in verse order. Both are just an ordered list of stops,
 * so they share one player.
 *
 * Each stop gets a dwell — long enough to read its note — then the camera
 * eases to the next while the drawn portion of the route catches up. The map
 * does the camera interpolation; this only animates route progress and
 * advances the index.
 */

const DWELL_MS = 3400;
const TRAVEL_MS = 2600;

export default function useAtlasTour({ stops, mapRef, onProgress }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(false);

  const frameRef = useRef(null);
  const phaseRef = useRef({ kind: "dwell", startedAt: 0, from: 0, to: 0 });
  const onProgressRef = useRef(onProgress);

  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);

  const count = stops?.length || 0;

  /** Fraction of the whole route each stop sits at, weighted by distance. */
  const fractions = useRef([]);
  useEffect(() => {
    if (!count) { fractions.current = []; return; }
    const legs = [];
    let total = 0;
    for (let i = 1; i < count; i++) {
      const dx = stops[i].lon - stops[i - 1].lon;
      const dy = stops[i].lat - stops[i - 1].lat;
      const d = Math.hypot(dx, dy) || 0.0001;
      legs.push(d);
      total += d;
    }
    const out = [0];
    let acc = 0;
    for (const leg of legs) { acc += leg; out.push(acc / total); }
    fractions.current = out;
  }, [stops, count]);

  const cancelFrame = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  const emitProgress = useCallback((value) => {
    onProgressRef.current?.(value);
  }, []);

  /** Move the camera to a stop without animating route progress. */
  const focusStop = useCallback((i, { animate = true } = {}) => {
    const map = mapRef?.current;
    const stop = stops?.[i];
    if (!map || !stop) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.easeTo({
      center: [stop.lon, stop.lat],
      zoom: stop.place?.precision === "region" ? 8.6 : 11.4,
      pitch: reduce ? 0 : 58,
      bearing: reduce ? 0 : -14,
      duration: animate && !reduce ? 1400 : 0,
      essential: true,
    });
  }, [mapRef, stops]);

  const goTo = useCallback((i) => {
    const clamped = Math.max(0, Math.min(count - 1, i));
    cancelFrame();
    setIndex(clamped);
    setActive(true);
    emitProgress(fractions.current[clamped] ?? 0);
    focusStop(clamped);
    phaseRef.current = { kind: "dwell", startedAt: performance.now(), from: clamped, to: clamped };
  }, [count, emitProgress, focusStop]);

  const start = useCallback(() => {
    setActive(true);
    setIndex(0);
    emitProgress(0);
    focusStop(0);
    phaseRef.current = { kind: "dwell", startedAt: performance.now(), from: 0, to: 0 };
    setPlaying(true);
  }, [emitProgress, focusStop]);

  const stopTour = useCallback(() => {
    cancelFrame();
    setPlaying(false);
    setActive(false);
    setIndex(0);
    emitProgress(0);
  }, [emitProgress]);

  const pause = useCallback(() => { cancelFrame(); setPlaying(false); }, []);

  const play = useCallback(() => {
    if (!count) return;
    setActive(true);
    // Restart from the top if the tour already ran to the end
    if (index >= count - 1) {
      setIndex(0);
      emitProgress(0);
      focusStop(0);
      phaseRef.current = { kind: "dwell", startedAt: performance.now(), from: 0, to: 0 };
    } else {
      // First press comes from the wide "whole route" framing, so dive to the
      // current stop before the dwell starts — otherwise stop one is never
      // seen up close and the first leg jumps in from nowhere.
      if (!active) focusStop(index);
      phaseRef.current = { kind: "dwell", startedAt: performance.now(), from: index, to: index };
    }
    setPlaying(true);
  }, [count, index, active, emitProgress, focusStop]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // ── Playback loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !count) return;
    const map = mapRef?.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const travelMs = reduce ? 0 : TRAVEL_MS;

    const tick = (now) => {
      const phase = phaseRef.current;

      if (phase.kind === "dwell") {
        if (now - phase.startedAt >= DWELL_MS) {
          const nextIndex = phase.from + 1;
          if (nextIndex >= count) { setPlaying(false); return; }
          phaseRef.current = { kind: "travel", startedAt: now, from: phase.from, to: nextIndex };
          const target = stops[nextIndex];
          map?.easeTo({
            center: [target.lon, target.lat],
            zoom: target.place?.precision === "region" ? 8.6 : 11.4,
            pitch: reduce ? 0 : 58,
            bearing: reduce ? 0 : -14,
            duration: travelMs,
            essential: true,
          });
        }
      } else {
        const elapsed = now - phase.startedAt;
        const t = travelMs === 0 ? 1 : Math.min(1, elapsed / travelMs);
        const from = fractions.current[phase.from] ?? 0;
        const to = fractions.current[phase.to] ?? 1;
        emitProgress(from + (to - from) * easeInOut(t));
        if (t >= 1) {
          setIndex(phase.to);
          phaseRef.current = { kind: "dwell", startedAt: now, from: phase.to, to: phase.to };
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return cancelFrame;
  }, [playing, count, stops, mapRef, emitProgress]);

  // Reset whenever the tour's content changes underneath us. Adjusted during
  // render rather than in an effect so the new stops never get a frame with
  // the previous tour's index; the playback effect below depends on `stops`,
  // so its cleanup cancels any in-flight animation frame.
  const [renderedStops, setRenderedStops] = useState(stops);
  if (stops !== renderedStops) {
    setRenderedStops(stops);
    setPlaying(false);
    setActive(false);
    setIndex(0);
  }

  useEffect(() => cancelFrame, []);

  return {
    active,
    playing,
    index,
    count,
    stop: stops?.[index] || null,
    atEnd: count > 0 && index >= count - 1,
    start,
    play,
    pause,
    next,
    prev,
    goTo,
    exit: stopTour,
  };
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
