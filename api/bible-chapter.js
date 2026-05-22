/**
 * /api/bible-chapter
 * Serverless proxy for API.Bible — keeps the API key server-side.
 *
 * Query params:
 *   bibleId  — API.Bible bible UUID (e.g. "a556c5305ee15c3f-01" for CSB)
 *   book     — USFM book code (e.g. "JHN", "GEN", "1CO")
 *   chapter  — chapter number as a string (e.g. "3")
 *
 * Returns:
 *   { verses: [{ verse: number, text: string }], bookId: string, chapter: number }
 */

import { checkOrigin } from "./_rateLimit.js";

export default async function handler(req, res) {
  if (!checkOrigin(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { bibleId, book, chapter } = req.query;

  if (!bibleId || !book || !chapter) {
    return res.status(400).json({ error: "Missing required params: bibleId, book, chapter" });
  }

  const chapterId = `${book}.${chapter}`;
  const url = new URL(`https://rest.api.bible/v1/bibles/${bibleId}/chapters/${chapterId}`);
  url.searchParams.set("content-type", "text");
  url.searchParams.set("include-notes", "false");
  url.searchParams.set("include-titles", "false");
  url.searchParams.set("include-chapter-numbers", "false");
  url.searchParams.set("include-verse-numbers", "true");
  url.searchParams.set("include-verse-spans", "false");

  let apiBibleRes;
  try {
    apiBibleRes = await fetch(url.toString(), {
      headers: { "api-key": process.env.API_BIBLE_KEY },
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach API.Bible", detail: err.message });
  }

  if (!apiBibleRes.ok) {
    const text = await apiBibleRes.text().catch(() => "");
    return res.status(apiBibleRes.status).json({
      error: `API.Bible returned ${apiBibleRes.status}`,
      detail: text.slice(0, 200),
    });
  }

  const json = await apiBibleRes.json();
  const content = (json?.data?.content || "").trim();

  // API.Bible text format embeds verse numbers as [N] or [ N ]
  // Split on the verse-number markers and reconstruct verse array.
  // Pattern: optional whitespace, then [digits], then the verse text until the next marker.
  const verses = [];
  const parts = content.split(/\s*\[(\d+)\]\s*/);
  // parts[0] is any leading text before the first verse marker (usually empty / chapter heading)
  // then alternating: verseNumber(string), verseText, verseNumber, verseText, ...
  for (let i = 1; i < parts.length; i += 2) {
    const verseNum = parseInt(parts[i], 10);
    const text = (parts[i + 1] || "").trim();
    if (!isNaN(verseNum) && text) {
      verses.push({ verse: verseNum, text });
    }
  }

  // Cache-control: chapters don't change; cache at edge for 24 h
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
  return res.status(200).json({
    verses,
    bookId: book,
    chapter: parseInt(chapter, 10),
  });
}
