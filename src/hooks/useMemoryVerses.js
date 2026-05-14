import { useState, useEffect, useCallback } from "react";
import { dbGetAll, dbPut, dbDelete } from "./useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { useAuth } from "../stores/AuthContext";

export default function useMemoryVerses() {
  const [verses, setVerses] = useState([]);
  const { user } = useAuth();

  const load = useCallback(async () => {
    const items = await dbGetAll("memoryVerses");
    setVerses(items);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addVerse = async (book, chapter, verseNumber, text) => {
    const id = `${book}-${chapter}-${verseNumber}`;
    const existing = verses.find((v) => v.id === id);
    if (existing) return;

    const record = {
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
    };
    await dbPut("memoryVerses", record);
    syncPush("memoryVerses", record, user?.id);
    await load();
  };

  const removeVerse = async (id) => {
    await dbDelete("memoryVerses", id);
    syncDelete("memoryVerses", id, user?.id);
    await load();
  };

  const updateVerse = async (verse) => {
    await dbPut("memoryVerses", verse);
    syncPush("memoryVerses", verse, user?.id);
    await load();
  };

  const isMemoryVerse = (book, chapter, verseNumber) => {
    return verses.some((v) => v.id === `${book}-${chapter}-${verseNumber}`);
  };

  return { verses, addVerse, removeVerse, updateVerse, isMemoryVerse, reload: load };
}
