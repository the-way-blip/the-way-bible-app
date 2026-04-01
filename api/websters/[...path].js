export default async function handler(req, res) {
  const path = req.query.path?.join("/") || "";
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
