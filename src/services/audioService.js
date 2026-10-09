// Human-narrated KJV: LibriVox "Bible (KJV), Complete" read by Michael Armenta
// (public domain, hosted on archive.org). Chapter/verse timings come from
// scripts/align-librivox-kjv.py → public/data/audio/kjv/<USFM>.json.
import { USFM_BOOK_IDS } from "../data/translations";

export const NARRATION = {
  reader: "Michael Armenta",
  source: "LibriVox — Bible (KJV), Complete",
  url: "https://librivox.org/bible-complete-king-james-version/",
};

const cache = new Map();
const getJSON = (url) => {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => { cache.delete(url); return null; }));
  return cache.get(url);
};

// Self-hosted per-chapter files (Cloudflare R2, cut by scripts/split-audio-chapters.mjs).
// When set, each chapter is its own small file; archive.org stays as the fallback.
export const AUDIO_BASE = import.meta.env.VITE_AUDIO_BASE ?? "https://pub-1541785c8887401689de6ae7fcc4dac0.r2.dev"; // Cloudflare R2 bucket theway-audio

/**
 * { url, start, end, verses: [startSec…], reader, fallback? } for a chapter, or null if not narrated.
 * `fallback` is the same chapter inside the full archive.org recording.
 */
export async function getChapterAudio(book, chapter) {
  const usfm = USFM_BOOK_IDS[book];
  if (!usfm) return null;
  const [timings, sections, readers, own] = await Promise.all([
    getJSON(`/data/audio/kjv/${usfm}.json`), getJSON("/data/audio/kjv/sections.json"), getJSON("/data/audio/kjv/readers.json"),
    AUDIO_BASE ? getJSON(`/data/audio/kjv-chapters/${usfm}.json`) : null,
  ]);
  const t = timings?.[String(chapter)];
  if (!t || !sections) return null;
  const [si, start, end, verses] = t;
  const reader = readers?.[si] || NARRATION.reader;
  const archive = { url: sections[si], start, end, verses, reader };
  const mine = own?.[String(chapter)];
  if (!mine) return archive;
  const [duration, starts] = mine;
  return { url: `${AUDIO_BASE}/kjv/${usfm}/${chapter}.mp3`, start: 0, end: duration, verses: starts, reader, fallback: archive };
}

// archive.org's storage node can take 20–30 s to answer the first request for
// a file it hasn't served lately, then answers in well under a second. Touch
// the chapter's recording (2 bytes) when the chapter opens so it's awake by the
// time the reader taps Listen.
const warmed = new Set();
export async function warmChapterAudio(book, chapter) {
  const data = await getChapterAudio(book, chapter).catch(() => null);
  if (data?.fallback) return; // self-hosted files don't need waking

  if (!data || warmed.has(data.url)) return;
  warmed.add(data.url);
  fetch(data.url, { headers: { Range: "bytes=0-1" }, mode: "cors" }).catch(() => warmed.delete(data.url));
}
