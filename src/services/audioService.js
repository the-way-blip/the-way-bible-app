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

/** { url, start, end, verses: [startSec…], reader } for a chapter, or null if not narrated. */
export async function getChapterAudio(book, chapter) {
  const usfm = USFM_BOOK_IDS[book];
  if (!usfm) return null;
  const [timings, sections, readers] = await Promise.all([
    getJSON(`/data/audio/kjv/${usfm}.json`), getJSON("/data/audio/kjv/sections.json"), getJSON("/data/audio/kjv/readers.json"),
  ]);
  const t = timings?.[String(chapter)];
  if (!t || !sections) return null;
  const [si, start, end, verses] = t;
  return { url: sections[si], start, end, verses, reader: readers?.[si] || NARRATION.reader };
}

// archive.org's storage node can take 20–30 s to answer the first request for
// a file it hasn't served lately, then answers in well under a second. Touch
// the chapter's recording (2 bytes) when the chapter opens so it's awake by the
// time the reader taps Listen.
const warmed = new Set();
export async function warmChapterAudio(book, chapter) {
  const data = await getChapterAudio(book, chapter).catch(() => null);
  if (!data || warmed.has(data.url)) return;
  warmed.add(data.url);
  fetch(data.url, { headers: { Range: "bytes=0-1" }, mode: "cors" }).catch(() => warmed.delete(data.url));
}
