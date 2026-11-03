import { useState, useEffect, useCallback } from "react";
import { dbGetByIndex, dbPut, dbDelete } from "./useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { useAuth } from "../stores/AuthContext";
import { logEvent } from "../services/ga";

export default function useHighlights(book, chapter) {
  const [highlights, setHighlights] = useState([]);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!book || !chapter) return;
    const items = await dbGetByIndex("highlights", "byChapter", [book, chapter]);
    setHighlights(items);
  }, [book, chapter]);

  useEffect(() => { load(); }, [load]);
  // Reload when a background sync brings in changes from another device
  useEffect(() => {
    const reload = () => { load().catch?.(() => {}); };
    window.addEventListener("theway:synced", reload);
    return () => window.removeEventListener("theway:synced", reload);
  }, [load]);

  // style: "fill" (default) | "underline" | "dashed" | "dotted" — see utils/highlights.js.
  // Tapping the colour a verse already has (in the same style) removes it.
  const addHighlight = async (verseNumber, color, style = "fill") => {
    logEvent("highlight_add", { color });
    const id = `${book}-${chapter}-${verseNumber}`;
    const existing = highlights.find((h) => h.id === id);

    if (color == null || (existing && existing.color === color && (existing.style || "fill") === style)) {
      await dbDelete("highlights", id);
      syncDelete("highlights", id, user?.id);
    } else {
      const record = {
        id,
        book,
        chapter,
        verseNumber,
        color,
        style: style === "fill" ? undefined : style,
        createdAt: Date.now(),
      };
      await dbPut("highlights", record);
      syncPush("highlights", record, user?.id);
    }
    await load();
  };

  const getHighlight = (verseNumber) => {
    return highlights.find((h) => h.verseNumber === verseNumber);
  };

  return { highlights, addHighlight, getHighlight };
}
