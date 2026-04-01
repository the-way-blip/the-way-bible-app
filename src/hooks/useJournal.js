import { useState, useEffect, useCallback } from "react";
import { dbGetAll, dbPut, dbDelete, dbGet } from "./useDB";

export default function useJournal() {
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => {
    const items = await dbGetAll("journal");
    setEntries(items.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveEntry = async (entry) => {
    const id = entry.id || `journal-${Date.now()}`;
    const existing = await dbGet("journal", id);
    await dbPut("journal", {
      ...entry,
      id,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
    await load();
    return id;
  };

  const deleteEntry = async (id) => {
    await dbDelete("journal", id);
    await load();
  };

  const getEntry = async (id) => {
    return dbGet("journal", id);
  };

  return { entries, saveEntry, deleteEntry, getEntry, reload: load };
}
