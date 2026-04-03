import { useState, useEffect, useRef, useCallback } from "react";
import { fetchChapter } from "../services/bibleApi";
import { dbGet, dbPut } from "./useDB";
import { getNextChapter } from "../data/bibleBooks";

/**
 * Manages loading additional chapters for infinite/continuous scroll.
 * Returns an array of extra chapter data objects beyond the initial chapter.
 */
export default function useInfiniteScroll(initialBook, initialChapter) {
  const [extraChapters, setExtraChapters] = useState([]);
  const [loadingNext, setLoadingNext] = useState(false);
  const loadingRef = useRef(false);
  const extraChaptersRef = useRef(extraChapters);
  extraChaptersRef.current = extraChapters;

  // Reset when the primary chapter changes (user navigated)
  useEffect(() => {
    setExtraChapters([]);
    extraChaptersRef.current = [];
    loadingRef.current = false;
    setLoadingNext(false);
  }, [initialBook, initialChapter]);

  // Stable callback — reads extraChapters from ref to avoid re-creating the observer
  const loadNextChapter = useCallback(async () => {
    if (loadingRef.current) return;

    const chapters = extraChaptersRef.current;
    const lastLoaded = chapters.length > 0
      ? chapters[chapters.length - 1]
      : { book: initialBook, chapter: initialChapter };

    const next = getNextChapter(lastLoaded.book, lastLoaded.chapter);
    if (!next) return; // End of Bible

    loadingRef.current = true;
    setLoadingNext(true);

    try {
      const key = `${next.book}-${next.chapter}`;
      let data = await dbGet("cachedChapters", key);

      if (!data) {
        const result = await fetchChapter(next.book, next.chapter);
        data = { key, ...result, fetchedAt: Date.now() };
        await dbPut("cachedChapters", data);
      }

      setExtraChapters((prev) => [...prev, data]);
    } catch (err) {
      console.error("Failed to load next chapter:", err);
    } finally {
      loadingRef.current = false;
      setLoadingNext(false);
    }
  }, [initialBook, initialChapter]);

  return { extraChapters, loadingNext, loadNextChapter };
}
