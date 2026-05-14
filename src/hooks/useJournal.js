import { useState, useEffect, useCallback } from "react";
import { dbGetAll, dbPut, dbDelete, dbGet } from "./useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { useAuth } from "../stores/AuthContext";

export default function useJournal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    const items = await dbGetAll("journal");
    setEntries(items.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveEntry = async (entry) => {
    const id = entry.id || `journal-${Date.now()}`;
    const existing = await dbGet("journal", id);
    const record = {
      ...entry,
      id,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await dbPut("journal", record);
    syncPush("journal", record, user?.id);
    await load();
    return id;
  };

  const deleteEntry = async (id) => {
    await dbDelete("journal", id);
    syncDelete("journal", id, user?.id);
    await load();
  };

  const getEntry = async (id) => {
    return dbGet("journal", id);
  };

  return { entries, loading, saveEntry, deleteEntry, getEntry, reload: load };
}
