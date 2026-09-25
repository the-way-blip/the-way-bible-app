import { useState, useEffect } from "react";
import { dbGet, dbPut } from "./useDB";
import { getLocalWordStudy, alignWordsToText } from "../services/wordStudyLocal";

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
          // Check cache (ws3: bump when parser or lexicon cleaning changes)
          const cached = await dbGet("cachedChapters", `ws3-${key}`);
          if (cached) {
            result[v.verse] = alignWordsToText(cached.words, v.text);
            continue;
          }

          // Load from bundled data
          const data = await getLocalWordStudy(book, chapter, v.verse);
          if (data?.words?.length > 0) {
            result[v.verse] = alignWordsToText(data.words, v.text);
            // Cache it
            await dbPut("cachedChapters", {
              key: `ws3-${key}`,
              words: data.words,
              fetchedAt: Date.now(),
            });
          }
        } catch (err) {
          console.warn(`[WordStudy] Failed to load ${key}:`, err);
        }
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
