/**
 * /api/bible-verse
 * Returns a single verse's text from API.Bible.
 * Used by the Compare tab in the study panel.
 *
 * Query params:
 *   bibleId  — API.Bible bible UUID
 *   book     — USFM book code (e.g. "JHN")
 *   chapter  — chapter number
 *   verse    — verse number
 */

import { checkOrigin } from "./_rateLimit.js";

export default async function handler(req, res) {
  if (!checkOrigin(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { bibleId, book, chapter, verse } = req.query;
  if (!bibleId || !book || !chapter || !verse) {
    return res.status(400).json({ error: "Missing required params: bibleId, book, chapter, verse" });
  }

  const verseId = `${book}.${chapter}.${verse}`;
  const url = new URL(`https://rest.api.bible/v1/bibles/${bibleId}/verses/${verseId}`);
  url.searchParams.set("content-type", "text");
  url.searchParams.set("include-notes", "false");
  url.searchParams.set("include-titles", "false");
  url.searchParams.set("include-verse-numbers", "false");
  url.searchParams.set("include-verse-spans", "false");

  try {
    const apiBibleRes = await fetch(url.toString(), {
      headers: { "api-key": process.env.API_BIBLE_KEY },
    });

    if (!apiBibleRes.ok) {
      return res.status(apiBibleRes.status).json({ error: "Verse not found" });
    }

    const json = await apiBibleRes.json();
    const text = (json?.data?.content || "").trim();

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach API.Bible" });
  }
}
