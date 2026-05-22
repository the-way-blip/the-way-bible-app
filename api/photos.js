/**
 * Stock photo proxy. Tries Pexels first, falls back to Unsplash if configured.
 * Both keys live in Vercel env vars:
 *   - PEXELS_API_KEY    (https://www.pexels.com/api/)
 *   - UNSPLASH_ACCESS_KEY (https://unsplash.com/developers)
 *
 * Usage: GET /api/photos?query=mountain&orientation=square
 * Returns: { results: [{ id, urls: { full, regular, small }, alt, author, authorUrl, source }] }
 */
export default async function handler(req, res) {
  const query = (req.query.query || "nature").toString();
  const orientation = (req.query.orientation || "square").toString();
  const perPage = Math.min(parseInt(req.query.per_page) || 20, 30);

  const pexelsKey = process.env.PEXELS_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  // ─── Try Pexels first ───
  if (pexelsKey) {
    try {
      // Pexels uses "square" / "landscape" / "portrait" orientation
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}`;
      const r = await fetch(url, { headers: { Authorization: pexelsKey } });
      if (r.ok) {
        const data = await r.json();
        const results = (data.photos || []).map((p) => ({
          id: String(p.id),
          urls: {
            full: p.src.original,
            regular: p.src.large2x || p.src.large, // ~1880w / ~940w
            small: p.src.medium,                   // ~350w
          },
          alt: p.alt || query,
          author: p.photographer,
          authorUrl: p.photographer_url || "https://pexels.com",
          source: "Pexels",
        }));
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json({ results });
      }
    } catch {
      // Fall through to Unsplash
    }
  }

  // ─── Fallback: Unsplash ───
  if (unsplashKey) {
    try {
      const u_orient = orientation === "square" ? "squarish" : orientation;
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${u_orient}&per_page=${perPage}&content_filter=high`;
      const r = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${unsplashKey}`,
          "Accept-Version": "v1",
        },
      });
      if (r.ok) {
        const data = await r.json();
        const results = (data.results || []).map((p) => ({
          id: p.id,
          urls: {
            full: p.urls.full,
            regular: p.urls.regular,
            small: p.urls.small,
          },
          alt: p.alt_description || p.description || query,
          author: p.user?.name || "Unsplash",
          authorUrl: p.user?.links?.html || "https://unsplash.com",
          source: "Unsplash",
        }));
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json({ results });
      }
    } catch {
      // Fall through to error
    }
  }

  return res.status(200).json({ results: [], error: "not_configured" });
}
