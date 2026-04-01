import { useState, useEffect } from "react";
import { fetchChapter } from "../services/bibleApi";
import { dbGet, dbPut } from "./useDB";

export default function useBible(bookName, chapter) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookName || !chapter) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const key = `${bookName}-${chapter}`;

    (async () => {
      try {
        const cached = await dbGet("cachedChapters", key);
        if (cached && !cancelled) {
          setData(cached);
          setLoading(false);
          return;
        }

        const result = await fetchChapter(bookName, chapter);
        const record = { key, ...result, fetchedAt: Date.now() };

        await dbPut("cachedChapters", record);

        if (!cancelled) {
          setData(record);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [bookName, chapter]);

  return { data, loading, error };
}
