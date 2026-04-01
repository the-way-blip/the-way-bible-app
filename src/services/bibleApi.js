const BASE_URL = "https://bible-api.com";

export async function fetchChapter(bookName, chapter) {
  const ref = `${bookName} ${chapter}`;
  const url = `${BASE_URL}/${encodeURIComponent(ref)}?translation=kjv`;

  const res = await fetch(url);
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
