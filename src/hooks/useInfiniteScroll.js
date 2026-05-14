import { useState, useEffect, useRef, useCallback } from "react";
import { fetchChapter } from "../services/bibleApi";
import { dbGet, dbPut } from "./useDB";
import { getNextChapter, getPrevChapter } from "../data/bibleBooks";

/**
 * Manages loading additional chapters for infinite/continuous scroll.
 * Returns arrays of extra chapter data objects before and after the initial chapter.
 */
export default function useInfiniteScroll(initialBook, initialChapter) {
  const [extraChaptersAfter, setExtraChaptersAfter] = useState([]);
  const [extraChaptersBefore, setExtraChaptersBefore] = useState([]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const loadingNextRef = useRef(false);
  const loadingPrevRef = useRef(false);
  const extraAfterRef = useRef(extraChaptersAfter);
  const extraBeforeRef = useRef(extraChaptersBefore);
  extraAfterRef.current = extraChaptersAfter;
  extraBeforeRef.current = extraChaptersBefore;

  // Reset when the primary chapter changes (user navigated)
  useEffect(() => {
    setExtraChaptersAfter([]);
    setExtraChaptersBefore([]);
    extraAfterRef.current = [];
    extraBeforeRef.current = [];
    loadingNextRef.current = false;
    loadingPrevRef.current = false;
    setLoadingNext(false);
    setLoadingPrev(false);
  }, [initialBook, initialChapter]);

  const loadNextChapter = useCallback(async () => {
    if (loadingNextRef.current) return;

    const chapters = extraAfterRef.current;
    const lastLoaded = chapters.length > 0
      ? chapters[chapters.length - 1]
      : { book: initialBook, chapter: initialChapter };

    const next = getNextChapter(lastLoaded.book, lastLoaded.chapter);
    if (!next) return;

    loadingNextRef.current = true;
    setLoadingNext(true);

    try {
      const key = `${next.book}-${next.chapter}`;
      let data = await dbGet("cachedChapters", key);

      if (!data) {
        const result = await fetchChapter(next.book, next.chapter);
        data = { key, ...result, fetchedAt: Date.now() };
        await dbPut("cachedChapters", data);
      }

      setExtraChaptersAfter((prev) => [...prev, data]);
    } catch (err) {
      console.error("Failed to load next chapter:", err);
    } finally {
      loadingNextRef.current = false;
      setLoadingNext(false);
    }
  }, [initialBook, initialChapter]);

  const loadPrevChapter = useCallback(async () => {
    if (loadingPrevRef.current) return;

    const chapters = extraBeforeRef.current;
    const firstLoaded = chapters.length > 0
      ? chapters[0]
      : { book: initialBook, chapter: initialChapter };

    const prev = getPrevChapter(firstLoaded.book, firstLoaded.chapter);
    if (!prev) return;

    loadingPrevRef.current = true;
    setLoadingPrev(true);

    try {
      const key = `${prev.book}-${prev.chapter}`;
      let data = await dbGet("cachedChapters", key);

      if (!data) {
        const result = await fetchChapter(prev.book, prev.chapter);
        data = { key, ...result, fetchedAt: Date.now() };
        await dbPut("cachedChapters", data);
      }

      setExtraChaptersBefore((prev) => [data, ...prev]);
    } catch (err) {
      console.error("Failed to load prev chapter:", err);
    } finally {
      loadingPrevRef.current = false;
      setLoadingPrev(false);
    }
  }, [initialBook, initialChapter]);

  return {
    extraChapters: extraChaptersAfter,
    extraChaptersBefore,
    loadingNext,
    loadingPrev,
    loadNextChapter,
    loadPrevChapter,
  };
}
