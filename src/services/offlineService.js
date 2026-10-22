// Download a book for offline use: the KJV text goes into the same
// IndexedDB chapter cache the reader already reads from, and the narration
// (one small file per chapter on R2) into a Cache API store that the audio
// service checks before going to the network.
import bibleBooks from "../data/bibleBooks";
import { dbPut } from "../hooks/useDB";
import { AUDIO_BASE } from "./audioService";
import { USFM_BOOK_IDS } from "../data/translations";
import { logEvent } from "./ga";

export const AUDIO_CACHE = "theway-audio-v1";
const KEY = "offlineBooks"; // { [book]: { text: true, audio: bool, at } }

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

export const offlineBooks = read;
export const chapterCount = (book) => bibleBooks.find((b) => b.name === book)?.chapters || 0;
const audioUrl = (book, chapter) => `${AUDIO_BASE}/kjv/${USFM_BOOK_IDS[book]}/${chapter}.mp3`;
export const hasAudioCache = () => typeof caches !== "undefined";

/** Roughly how big a book's narration is (all 1,189 chapters are 1.6 GB, about 1.35 MB each). */
export const estimateAudioMB = (book) => Math.max(1, Math.round(chapterCount(book) * 1.35));

/**
 * Save a book for offline reading (and optionally listening).
 * onProgress(done, total) is called as chapters land. Resolves to the saved entry.
 */
export async function downloadBook(book, { audio = false, onProgress, signal } = {}) {
  const n = chapterCount(book);
  if (!n) throw new Error(`Unknown book: ${book}`);
  const total = audio ? n * 2 : n;
  let done = 0;
  const tick = () => onProgress?.(++done, total);

  // One request per book, written into the reader's chapter cache in the format
  // getChapterCached/useBible use (key `${book}-${chapter}-KJV@2`).
  const res = await fetch(`/data/bibles/kjv/${USFM_BOOK_IDS[book]}.json`, { signal });
  if (!res.ok) throw new Error(`Text ${book}: HTTP ${res.status}`);
  const chapters = await res.json();
  for (let c = 1; c <= n; c++) {
    const verses = (chapters[String(c)] || []).map((text, i) => text && { book, chapter: c, verse: i + 1, text }).filter(Boolean);
    if (verses.length) {
      await dbPut("cachedChapters", { key: `${book}-${c}-KJV@2`, reference: `${book} ${c}`, book, chapter: c, verses, translationId: "KJV", fetchedAt: Date.now() });
    }
    tick();
  }
  if (audio && hasAudioCache() && AUDIO_BASE && USFM_BOOK_IDS[book]) {
    const cache = await caches.open(AUDIO_CACHE);
    const queue = Array.from({ length: n }, (_, i) => i + 1);
    const worker = async () => {
      for (let c; (c = queue.shift()); ) {
        if (signal?.aborted) return;
        const url = audioUrl(book, c);
        if (!(await cache.match(url))) {
          const res = await fetch(url, { signal });
          if (!res.ok) throw new Error(`Audio ${book} ${c}: HTTP ${res.status}`);
          await cache.put(url, res);
        }
        tick();
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  }
  const all = read();
  all[book] = { text: true, audio: audio || !!all[book]?.audio, at: Date.now() };
  write(all);
  logEvent("offline_download", { book, audio: audio ? 1 : 0 });
  return all[book];
}

/** Forget a book's offline audio (the text stays cached; it is small). */
export async function removeBook(book) {
  if (hasAudioCache()) {
    const cache = await caches.open(AUDIO_CACHE);
    await Promise.all(Array.from({ length: chapterCount(book) }, (_, i) => cache.delete(audioUrl(book, i + 1))));
  }
  const all = read();
  delete all[book];
  write(all);
}

/** Storage the browser reports for this site, in MB (null if unknown). */
export async function storageUsedMB() {
  try {
    const { usage } = await navigator.storage.estimate();
    return Math.round(usage / 1e6);
  } catch { return null; }
}

/**
 * A playable URL for a downloaded chapter's narration (blob: URL), or null.
 * Blob URLs are memoised so the same chapter keeps the same src (the player
 * compares src to decide whether it is still on the same file).
 */
const blobUrls = new Map();
export async function cachedAudioUrl(url) {
  if (!hasAudioCache()) return null;
  if (blobUrls.has(url)) return blobUrls.get(url);
  try {
    const res = await (await caches.open(AUDIO_CACHE)).match(url);
    if (!res) return null;
    const blobUrl = URL.createObjectURL(await res.blob());
    blobUrls.set(url, blobUrl);
    return blobUrl;
  } catch { return null; }
}
