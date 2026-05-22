import { useState, useEffect, useCallback } from "react";
import { dbGetAll, dbPut, dbDelete, dbGet } from "./useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { useAuth } from "../stores/AuthContext";

/**
 * Tracks the user's active reading plan + completed days.
 * Stored in IndexedDB "readingPlanProgress" store and synced to Supabase.
 *
 * One record per plan:
 *   {
 *     id: planId,                     // primary key
 *     startedAt: <timestamp>,
 *     completedDays: { 1: <ts>, 2: <ts>, ... },
 *     isActive: boolean,              // only one plan can be active at a time
 *     updatedAt: <ts>
 *   }
 */
export default function useReadingPlanProgress() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      const items = await dbGetAll("readingPlanProgress");
      setRecords(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeRecord = records.find((r) => r.isActive) || null;

  const startPlan = useCallback(async (planId) => {
    // Deactivate any previously active plan
    const all = await dbGetAll("readingPlanProgress");
    for (const r of all) {
      if (r.isActive && r.id !== planId) {
        const updated = { ...r, isActive: false, updatedAt: Date.now() };
        await dbPut("readingPlanProgress", updated);
        syncPush("readingPlanProgress", updated, user?.id);
      }
    }
    // Find or create the plan's record
    const existing = await dbGet("readingPlanProgress", planId);
    const record = existing
      ? { ...existing, isActive: true, updatedAt: Date.now() }
      : {
          id: planId,
          startedAt: Date.now(),
          completedDays: {},
          isActive: true,
          updatedAt: Date.now(),
        };
    await dbPut("readingPlanProgress", record);
    syncPush("readingPlanProgress", record, user?.id);
    await load();
    return record;
  }, [user?.id, load]);

  const markDayComplete = useCallback(async (planId, dayNum) => {
    const existing = await dbGet("readingPlanProgress", planId);
    if (!existing) return;
    const completedDays = { ...(existing.completedDays || {}) };
    if (completedDays[dayNum]) {
      delete completedDays[dayNum];
    } else {
      completedDays[dayNum] = Date.now();
    }
    const record = { ...existing, completedDays, updatedAt: Date.now() };
    await dbPut("readingPlanProgress", record);
    syncPush("readingPlanProgress", record, user?.id);
    await load();
  }, [user?.id, load]);

  const stopPlan = useCallback(async (planId) => {
    const existing = await dbGet("readingPlanProgress", planId);
    if (!existing) return;
    const record = { ...existing, isActive: false, updatedAt: Date.now() };
    await dbPut("readingPlanProgress", record);
    syncPush("readingPlanProgress", record, user?.id);
    await load();
  }, [user?.id, load]);

  const resetPlan = useCallback(async (planId) => {
    await dbDelete("readingPlanProgress", planId);
    syncDelete("readingPlanProgress", planId, user?.id);
    await load();
  }, [user?.id, load]);

  return {
    records,
    activeRecord,
    loading,
    startPlan,
    markDayComplete,
    stopPlan,
    resetPlan,
    reload: load,
  };
}
