import { useState, useEffect, useCallback } from "react";
import { dbGetAll, dbPut, dbDelete } from "./useDB";

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);

  const load = useCallback(async () => {
    const all = await dbGetAll("journal");
    setBookmarks(
      all
        .filter((e) => e.id.startsWith("bookmark-"))
        .sort((a, b) => b.createdAt - a.createdAt)
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const addBookmark = async (book, chapter, verse, text) => {
    const id = `bookmark-${book}-${chapter}-${verse}`;
    await dbPut("journal", {
      id,
      title: `${book} ${chapter}:${verse}`,
      content: text,
      book,
      chapter,
      verseNumber: verse,
      tags: ["bookmark"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await load();
  };

  const removeBookmark = async (book, chapter, verse) => {
    const id = `bookmark-${book}-${chapter}-${verse}`;
    await dbDelete("journal", id);
    await load();
  };

  const isBookmarked = (book, chapter, verse) => {
    return bookmarks.some((b) => b.id === `bookmark-${book}-${chapter}-${verse}`);
  };

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, reload: load };
}
