export default async function handler(req, res) {
  const path = req.query.path?.join("/") || "";
  const url = `https://historicalchristian.faith/${path}`;

  try {
    const response = await fetch(url);
    const html = await response.text();

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(response.status).send(html);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch commentary" });
  }
}
