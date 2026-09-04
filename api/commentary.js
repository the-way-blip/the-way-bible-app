/**
 * /api/commentary?p={commentaryId}/{usfmBook}/{chapter}
 * Proxies HelloAO's free Bible commentary API (bible.helloao.org).
 * No API key required. Public domain / CC licensed content.
 *
 * Example: /api/commentary?p=matthew-henry/JHN/3
 *   → https://bible.helloao.org/api/c/matthew-henry/JHN/3.json
 *
 * Note: Using a flat file + query param instead of api/commentary/[...path].js
 * because Vercel's catch-all routing in subdirectories only matches one path
 * segment for non-Next.js projects.
 */

export default async function handler(req, res) {
  const path = req.query.p || "";
  if (!path) {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  const url = `https://bible.helloao.org/api/c/${path}.json`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Commentary not found" });
    }

    const data = await response.json();

    // Cache aggressively — commentary text never changes
    res.setHeader("Cache-Control", "s-maxage=604800, stale-while-revalidate=2592000");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch commentary" });
  }
}
