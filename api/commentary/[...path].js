/**
 * /api/commentary/{commentaryId}/{usfmBook}/{chapter}
 * Proxies HelloAO's free Bible commentary API (bible.helloao.org).
 * No API key required. Public domain / CC licensed content.
 *
 * Example: /api/commentary/matthew-henry/JHN/3
 *   → https://bible.helloao.org/api/c/matthew-henry/JHN/3.json
 */

export default async function handler(req, res) {
  const path = req.query.path?.join("/") || "";
  // path = "{commentaryId}/{book}/{chapter}"
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
