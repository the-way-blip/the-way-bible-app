import { useState, useEffect, useCallback } from "react";
import { dbGetByIndex, dbPut, dbDelete, dbGet } from "./useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { useAuth } from "../stores/AuthContext";

export default function useNotes(book, chapter) {
  const [notes, setNotes] = useState([]);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!book || !chapter) return;
    const items = await dbGetByIndex("notes", "byChapter", [book, chapter]);
    setNotes(items);
  }, [book, chapter]);

  useEffect(() => { load(); }, [load]);

  const saveNote = async (verseNumber, text, tags = []) => {
    const id = `${book}-${chapter}-${verseNumber}`;
    const existing = await dbGet("notes", id);
    const record = {
      id,
      book,
      chapter,
      verseNumber,
      text,
      tags,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await dbPut("notes", record);
    syncPush("notes", record, user?.id);
    await load();
  };

  const deleteNote = async (verseNumber) => {
    const id = `${book}-${chapter}-${verseNumber}`;
    await dbDelete("notes", id);
    syncDelete("notes", id, user?.id);
    await load();
  };

  const getNote = (verseNumber) => {
    return notes.find((n) => n.verseNumber === verseNumber);
  };

  return { notes, saveNote, deleteNote, getNote };
}
