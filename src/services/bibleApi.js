const BASE_URL = "https://bible-api.com";

// Single-chapter books: bible-api.com interprets "Jude 1" as "Jude verse 1"
// so we must request the full verse range instead
const SINGLE_CHAPTER_VERSES = {
  Obadiah: 21,
  Philemon: 25,
  "2 John": 13,
  "3 John": 14,
  Jude: 25,
};

export async function fetchChapter(bookName, chapter) {
  const verseCount = SINGLE_CHAPTER_VERSES[bookName];
  const ref = verseCount
    ? `${bookName} ${chapter}:1-${verseCount}`
    : `${bookName} ${chapter}`;
  const url = `${BASE_URL}/${encodeURIComponent(ref)}?translation=kjv`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw new Error(navigator.onLine ? "Failed to reach the Bible text server." : "You're offline. Previously read chapters are available offline.");
  }
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${ref}: ${res.status}`);
  }

  const data = await res.json();

  const verses = data.verses.map((v) => ({
    book: bookName,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text.trim(),
  }));

  return {
    reference: data.reference,
    book: bookName,
    chapter,
    verses,
  };
}
