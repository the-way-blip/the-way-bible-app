import { checkOrigin, rateLimit } from "../_rateLimit.js";

export default async function handler(req, res) {
  if (!checkOrigin(req)) return res.status(403).json({ error: "Forbidden" });
  if (rateLimit(req, { windowMs: 60_000, max: 60 })) return res.status(429).json({ error: "Too many requests" });

  // Vercel doesn't hand plain (non-Next) functions the catch-all as an array in
  // req.query.path, so read the word from the URL itself.
  const word = decodeURIComponent((req.url || "").split("?")[0].replace(/^\/api\/websters\/?/, ""));
  const path = encodeURIComponent(word.replace(/[^A-Za-z' -]/g, "").trim().toLowerCase());
  if (!path) return res.status(400).json({ error: "Missing word" });
  const url = `https://webstersdictionary1828.com/Dictionary/${path}`;

  try {
    const response = await fetch(url);
    const html = await response.text();

    res.setHeader("Cache-Control", "s-maxage=2592000, stale-while-revalidate=2592000");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(response.status).send(html);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch definition" });
  }
}
