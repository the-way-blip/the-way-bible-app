/**
 * Serverless proxy for Unsplash search.
 * Requires UNSPLASH_ACCESS_KEY env var in Vercel.
 *
 * Usage: GET /api/unsplash?query=mountain&orientation=squarish
 * Returns: { results: [{ id, urls: { full, regular, small }, alt, author, authorUrl }] }
 */
export default async function handler(req, res) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(200).json({ results: [], error: "not_configured" });
  }

  const query = (req.query.query || "nature").toString();
  const orientation = (req.query.orientation || "landscape").toString();
  const perPage = Math.min(parseInt(req.query.per_page) || 20, 30);

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}&content_filter=high`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!r.ok) {
      return res.status(200).json({ results: [], error: "upstream_error", status: r.status });
    }

    const data = await r.json();
    const results = (data.results || []).map((p) => ({
      id: p.id,
      urls: {
        full: p.urls.full,
        regular: p.urls.regular, // 1080w
        small: p.urls.small,     // 400w (for preview)
      },
      alt: p.alt_description || p.description || query,
      author: p.user?.name || "Unsplash",
      authorUrl: p.user?.links?.html || "https://unsplash.com",
    }));

    // Cache aggressively — same query returns same set, so we can save quota
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ results });
  } catch {
    res.status(200).json({ results: [], error: "fetch_failed" });
  }
}
