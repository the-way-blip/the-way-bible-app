import { useState, useEffect, useCallback } from "react";
import { dbGetByIndex, dbPut, dbDelete, dbGet } from "./useDB";

export default function useNotes(book, chapter) {
  const [notes, setNotes] = useState([]);

  const load = useCallback(async () => {
    if (!book || !chapter) return;
    const items = await dbGetByIndex("notes", "byChapter", [book, chapter]);
    setNotes(items);
  }, [book, chapter]);

  useEffect(() => { load(); }, [load]);

  const saveNote = async (verseNumber, text, tags = []) => {
    const id = `${book}-${chapter}-${verseNumber}`;
    const existing = await dbGet("notes", id);
    await dbPut("notes", {
      id,
      book,
      chapter,
      verseNumber,
      text,
      tags,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
    await load();
  };

  const deleteNote = async (verseNumber) => {
    const id = `${book}-${chapter}-${verseNumber}`;
    await dbDelete("notes", id);
    await load();
  };

  const getNote = (verseNumber) => {
    return notes.find((n) => n.verseNumber === verseNumber);
  };

  return { notes, saveNote, deleteNote, getNote };
}
