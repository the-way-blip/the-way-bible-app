import { useState, useEffect, useCallback } from "react";
import { dbGetByIndex, dbPut, dbDelete } from "./useDB";

export default function useHighlights(book, chapter) {
  const [highlights, setHighlights] = useState([]);

  const load = useCallback(async () => {
    if (!book || !chapter) return;
    const items = await dbGetByIndex("highlights", "byChapter", [book, chapter]);
    setHighlights(items);
  }, [book, chapter]);

  useEffect(() => { load(); }, [load]);

  const addHighlight = async (verseNumber, color) => {
    const id = `${book}-${chapter}-${verseNumber}`;
    const existing = highlights.find((h) => h.id === id);

    if (existing && existing.color === color) {
      await dbDelete("highlights", id);
    } else {
      await dbPut("highlights", {
        id,
        book,
        chapter,
        verseNumber,
        color,
        createdAt: Date.now(),
      });
    }
    await load();
  };

  const getHighlight = (verseNumber) => {
    return highlights.find((h) => h.verseNumber === verseNumber);
  };

  return { highlights, addHighlight, getHighlight };
}
