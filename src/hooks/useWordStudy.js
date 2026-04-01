import { useState, useCallback } from "react";
import { dbGet, dbPut } from "./useDB";
import { getLocalWordStudy } from "../services/wordStudyLocal";

export default function useWordStudy() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wordData, setWordData] = useState(null);
  const [currentKey, setCurrentKey] = useState(null);

  const getWordStudy = useCallback(async (book, chapter, verseNumber, verseText) => {
    const key = `${book}-${chapter}-${verseNumber}`;
    if (key === currentKey && wordData) return wordData;

    setLoading(true);
    setError(null);

    try {
      // Check IndexedDB cache first
      const cached = await dbGet("cachedChapters", `ws-${key}`);
      if (cached) {
        setWordData(cached.words);
        setCurrentKey(key);
        setLoading(false);
        return cached.words;
      }

      // Use local bundled data (Strong's + KJV interlinear)
      const result = await getLocalWordStudy(book, chapter, verseNumber);

      if (result && result.words && result.words.length > 0) {
        await dbPut("cachedChapters", {
          key: `ws-${key}`,
          words: result.words,
          fetchedAt: Date.now(),
        });

        setWordData(result.words);
        setCurrentKey(key);
        setLoading(false);
        return result.words;
      }

      throw new Error("Word study data not available for this verse");
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [currentKey, wordData]);

  const clear = useCallback(() => {
    setWordData(null);
    setCurrentKey(null);
    setError(null);
  }, []);

  return { wordData, loading, error, getWordStudy, clear };
}
