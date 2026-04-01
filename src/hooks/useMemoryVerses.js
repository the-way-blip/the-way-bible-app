import { useState, useEffect, useCallback } from "react";
import { dbGetAll, dbPut, dbDelete } from "./useDB";

export default function useMemoryVerses() {
  const [verses, setVerses] = useState([]);

  const load = useCallback(async () => {
    const items = await dbGetAll("memoryVerses");
    setVerses(items);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addVerse = async (book, chapter, verseNumber, text) => {
    const id = `${book}-${chapter}-${verseNumber}`;
    const existing = verses.find((v) => v.id === id);
    if (existing) return;

    await dbPut("memoryVerses", {
      id,
      book,
      chapter,
      verseNumber,
      text,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: Date.now(),
      status: "learning",
      practiceCount: 0,
      topics: [],
      createdAt: Date.now(),
    });
    await load();
  };

  const removeVerse = async (id) => {
    await dbDelete("memoryVerses", id);
    await load();
  };

  const isMemoryVerse = (book, chapter, verseNumber) => {
    return verses.some((v) => v.id === `${book}-${chapter}-${verseNumber}`);
  };

  return { verses, addVerse, removeVerse, isMemoryVerse, reload: load };
}
