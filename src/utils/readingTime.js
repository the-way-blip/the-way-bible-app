/**
 * Reading-time estimates for plan readings.
 *
 * Minutes = actual KJV word count of the passage ÷ the reader's words-per-minute.
 * Word counts are precomputed by scripts/build-reading-plans.mjs into
 * src/data/kjvWordCounts.json: { c: words per chapter, n: verses per chapter,
 * v: words per verse for chapters a plan reads only part of }.
 */
import { useEffect, useState } from "react";
import WC from "../data/kjvWordCounts.json";

export const WPM_ALOUD = 183;  // average adult reading aloud
export const WPM_SILENT = 238; // average adult silent reading
export const WPM_MIN = 70;
export const WPM_MAX = 400;
const KEY = "readingWpm";
const EVENT = "theway:wpm";

const clamp = (n) => Math.min(WPM_MAX, Math.max(WPM_MIN, Math.round(n)));

export function getWpm() {
  try {
    const n = parseInt(localStorage.getItem(KEY) || "", 10);
    return Number.isFinite(n) ? clamp(n) : WPM_ALOUD;
  } catch {
    return WPM_ALOUD;
  }
}

export function setWpm(n) {
  const v = clamp(n);
  try { localStorage.setItem(KEY, String(v)); } catch {}
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: v })); } catch {}
  return v;
}

/** Current words-per-minute, kept in sync with the Settings control. */
export function useReadingWpm() {
  const [wpm, setState] = useState(getWpm);
  useEffect(() => {
    const onChange = () => setState(getWpm());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return wpm;
}

/** Verses in a ref ({ book, chapter, from?, to? }). */
export function refVerses(r) {
  const n = WC.n[r.book]?.[r.chapter - 1] || 0;
  if (!r.from) return n;
  return Math.max(0, Math.min(r.to || n, n) - r.from + 1);
}

/** KJV words in a ref. */
export function refWords(r) {
  if (!r.from) return WC.c[r.book]?.[r.chapter - 1] || 0;
  const per = WC.v[r.book]?.[r.chapter];
  if (per) return per.slice(r.from - 1, r.to).reduce((a, b) => a + b, 0);
  // No per-verse data: prorate the chapter by verse share.
  const n = WC.n[r.book]?.[r.chapter - 1] || 1;
  return Math.round(((WC.c[r.book]?.[r.chapter - 1] || 0) * refVerses(r)) / n);
}

export const sumWords = (refs) => refs.reduce((a, r) => a + refWords(r), 0);
export const sumVerses = (refs) => refs.reduce((a, r) => a + refVerses(r), 0);
export const minutesFor = (words, wpm) => (words > 0 ? Math.max(1, Math.round(words / wpm)) : 0);

/** A day's readings as arrays of refs (plans without explicit readings: one per ref). */
export function dayReadings(day) {
  if (!day) return [];
  if (day.readings) return day.readings;
  return (day.refs || []).map((r) => ({ refs: [r] }));
}

/** Average words per day across a plan (memoised per plan object). */
const avgCache = new WeakMap();
export function planAverageWords(plan) {
  if (avgCache.has(plan)) return avgCache.get(plan);
  const days = plan.days || [];
  const total = days.reduce((a, d) => a + dayReadings(d).reduce((b, rd) => b + sumWords(rd.refs), 0), 0);
  const avg = days.length ? total / days.length : 0;
  avgCache.set(plan, avg);
  return avg;
}

/** "Genesis 9–10", "Exodus 11–12:21", "Psalm 119:1–24", "Luke 1:39–80", "Jeremiah 36, 45" */
export function readingLabel(refs) {
  if (!refs?.length) return "";
  const parts = [];
  let i = 0;
  while (i < refs.length) {
    const r = refs[i];
    const name = r.book === "Psalms" ? "Psalm" : r.book;
    const sameBook = parts.length && refs[i - 1].book === r.book;
    if (r.from) {
      const nx = refs[i + 1];
      if (nx && nx.book === r.book && nx.chapter === r.chapter + 1 && nx.from === 1 && r.to === (WC.n[r.book]?.[r.chapter - 1] || 0)) {
        parts.push({ book: r.book, text: `${sameBook ? "" : name + " "}${r.chapter}:${r.from}–${nx.chapter}:${nx.to}` });
        i += 2;
        continue;
      }
      parts.push({ book: r.book, text: `${sameBook ? "" : name + " "}${r.chapter}:${r.from}–${r.to}` });
      i++;
      continue;
    }
    // run of whole consecutive chapters, optionally ending in a partial chapter starting at v1
    let j = i;
    while (j + 1 < refs.length && refs[j + 1].book === r.book && refs[j + 1].chapter === refs[j].chapter + 1 && !refs[j + 1].from) j++;
    let end = refs[j].chapter > r.chapter ? `–${refs[j].chapter}` : "";
    const nx = refs[j + 1];
    if (nx && nx.book === r.book && nx.chapter === refs[j].chapter + 1 && nx.from === 1) {
      end = `–${nx.chapter}:${nx.to}`;
      j++;
    }
    const prefix = sameBook ? "" : (r.book === "Psalms" && end && !end.includes(":") ? "Psalms" : name) + " ";
    parts.push({ book: r.book, text: `${prefix}${r.chapter}${end}` });
    i = j + 1;
  }
  return parts.map((p, k) => (k === 0 ? p.text : (p.book === parts[k - 1].book ? ", " : "; ") + p.text)).join("");
}
