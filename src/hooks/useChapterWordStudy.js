import { useState, useEffect } from "react";
import { dbGet, dbPut } from "./useDB";
import { getLocalWordStudy } from "../services/wordStudyLocal";

// Loads word study data for ALL verses in a chapter at once
// Returns a map: { verseNumber: [wordObjects] }
export default function useChapterWordStudy(book, chapter, verses) {
  const [verseWords, setVerseWords] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!book || !chapter || !verses?.length) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const result = {};

      for (const v of verses) {
        if (cancelled) break;
        const key = `${book}-${chapter}-${v.verse}`;

        try {
          // Check cache
          const cached = await dbGet("cachedChapters", `ws-${key}`);
          if (cached) {
            result[v.verse] = cached.words;
            continue;
          }

          // Load from bundled data
          const data = await getLocalWordStudy(book, chapter, v.verse);
          if (data?.words?.length > 0) {
            result[v.verse] = data.words;
            // Cache it
            await dbPut("cachedChapters", {
              key: `ws-${key}`,
              words: data.words,
              fetchedAt: Date.now(),
            });
          }
        } catch {}
      }

      if (!cancelled) {
        setVerseWords(result);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [book, chapter, verses]);

  return { verseWords, loading };
}
