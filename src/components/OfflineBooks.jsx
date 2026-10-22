import { useEffect, useRef, useState } from "react";
import bibleBooks from "../data/bibleBooks";
import { offlineBooks, downloadBook, removeBook, estimateAudioMB, hasAudioCache, storageUsedMB } from "../services/offlineService";

/** Settings → Offline Bible: save books (text, or text + narration) to read and listen without a connection. */
export default function OfflineBooks() {
  const [saved, setSaved] = useState(offlineBooks);
  const [job, setJob] = useState(null); // { book, audio, done, total }
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);
  const audioOK = hasAudioCache();

  useEffect(() => { storageUsedMB().then(setUsage); }, [saved]);

  const run = async (books, audio) => {
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      for (const book of books) {
        setJob({ book, audio, done: 0, total: 1, many: books.length > 1 });
        await downloadBook(book, { audio, signal: ctrl.signal, onProgress: (done, total) => setJob((j) => j && { ...j, done, total }) });
        setSaved(offlineBooks());
      }
    } catch (e) {
      if (e?.name !== "AbortError") setError(`Couldn't finish downloading. Check your connection and try again.`);
    } finally {
      setJob(null);
      setSaved(offlineBooks());
    }
  };
  const remove = async (book) => { await removeBook(book); setSaved(offlineBooks()); };
  const allText = bibleBooks.every((b) => saved[b.name]?.text);

  return (
    <div className="bg-white border border-cream-dark rounded-xl p-4">
      <p className="text-sm font-semibold text-warm-brown">Offline Bible</p>
      <p className="text-xs text-warm-brown-light mt-0.5">
        Save books to read{audioOK ? " and listen" : ""} without a connection — on a plane, at camp, or where the signal drops.
        {usage != null && ` Using about ${usage} MB on this device.`}
      </p>

      {job ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-warm-brown mb-1">
            <span>Saving {job.book}{job.audio ? " with narration" : ""}…</span>
            <button type="button" onClick={() => abortRef.current?.abort()} className="text-gold font-medium">Cancel</button>
          </div>
          <div className="h-1.5 rounded-full bg-cream-dark overflow-hidden">
            <div className="h-full bg-gold transition-[width]" style={{ width: `${Math.round((job.done / job.total) * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => run(bibleBooks.map((b) => b.name), false)} disabled={allText}
            className="flex-1 bg-gold text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
            {allText ? "Whole Bible text saved ✓" : "Save the whole Bible text (5 MB)"}
          </button>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
            className="px-3 border border-cream-dark rounded-lg text-sm text-warm-brown">{open ? "Hide books" : "By book"}</button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {open && (
        <ul className="mt-3 divide-y divide-cream-dark max-h-96 overflow-y-auto -mx-1">
          {bibleBooks.map(({ name }) => {
            const s = saved[name];
            return (
              <li key={name} className="flex items-center justify-between gap-2 px-1 py-2">
                <span className="text-sm text-warm-brown min-w-0 truncate">
                  {name}
                  {s && <span className="ml-1.5 text-[10px] text-gold font-semibold">{s.audio ? "TEXT + AUDIO" : "TEXT"}</span>}
                </span>
                <span className="flex gap-1.5 shrink-0">
                  {audioOK && !s?.audio && (
                    <button type="button" disabled={!!job} onClick={() => run([name], true)}
                      className="text-xs px-2 py-1 rounded-md bg-gold/10 text-gold disabled:opacity-40">+ Audio {estimateAudioMB(name)} MB</button>
                  )}
                  {!s && (
                    <button type="button" disabled={!!job} onClick={() => run([name], false)}
                      className="text-xs px-2 py-1 rounded-md border border-cream-dark text-warm-brown disabled:opacity-40">Text</button>
                  )}
                  {s?.audio && (
                    <button type="button" disabled={!!job} onClick={() => remove(name)}
                      className="text-xs px-2 py-1 rounded-md text-warm-brown-light hover:text-red-600 disabled:opacity-40">Remove audio</button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
