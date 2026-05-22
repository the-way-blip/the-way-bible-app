import { useState, useEffect } from "react";
import { fetchChapterByTranslation } from "../services/bibleApi";
import { dbGet, dbPut } from "./useDB";

export default function useBible(bookName, chapter, translationId = "KJV") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookName || !chapter) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    // Cache key includes translation so different translations are stored separately
    const key = `${bookName}-${chapter}-${translationId}`;

    (async () => {
      try {
        const cached = await dbGet("cachedChapters", key);
        if (cached && !cancelled) {
          setData(cached);
          setLoading(false);
          return;
        }

        const result = await fetchChapterByTranslation(bookName, chapter, translationId);
        const record = { key, ...result, translationId, fetchedAt: Date.now() };

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
  }, [bookName, chapter, translationId]);

  return { data, loading, error };
}
