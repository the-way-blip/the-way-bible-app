import { useState, useEffect, useCallback } from "react";
import { dbGetAll, dbPut, dbDelete } from "./useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { useAuth } from "../stores/AuthContext";

/**
 * Bookmarks: save a chapter (or a specific verse) to return to later.
 * Backed by IndexedDB "bookmarks" store and synced to Supabase.
 *
 * Shape: { id, book, chapter, verse?, label?, createdAt, updatedAt }
 *   - Chapter bookmark id: "Book-Chapter"          (e.g., "Romans-8")
 *   - Verse bookmark id:   "Book-Chapter-Verse"    (e.g., "Romans-8-28")
 */
export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      const items = await dbGetAll("bookmarks");
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setBookmarks(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const buildId = (book, chapter, verse) =>
    verse ? `${book}-${chapter}-${verse}` : `${book}-${chapter}`;

  const addBookmark = useCallback(async ({ book, chapter, verse = null, label = "" }) => {
    const id = buildId(book, chapter, verse);
    const record = {
      id,
      book,
      chapter: Number(chapter),
      verse: verse ? Number(verse) : null,
      label,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbPut("bookmarks", record);
    syncPush("bookmarks", record, user?.id);
    await load();
    return record;
  }, [user?.id, load]);

  const removeBookmark = useCallback(async (book, chapter, verse = null) => {
    const id = buildId(book, chapter, verse);
    await dbDelete("bookmarks", id);
    syncDelete("bookmarks", id, user?.id);
    await load();
  }, [user?.id, load]);

  const isBookmarked = useCallback((book, chapter, verse = null) => {
    const id = buildId(book, chapter, verse);
    return bookmarks.some((b) => b.id === id);
  }, [bookmarks]);

  const toggleBookmark = useCallback(async (args) => {
    const id = buildId(args.book, args.chapter, args.verse);
    if (bookmarks.some((b) => b.id === id)) {
      await removeBookmark(args.book, args.chapter, args.verse);
      return false;
    }
    await addBookmark(args);
    return true;
  }, [bookmarks, addBookmark, removeBookmark]);

  return { bookmarks, loading, addBookmark, removeBookmark, isBookmarked, toggleBookmark, reload: load };
}
