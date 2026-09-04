/**
 * /api/bible-page — server-rendered Bible pages (verse / chapter / book / topic / sitemaps).
 * Reached only through the rewrites in vercel.json; see seo/render.js for routes.
 */
import { render } from "../seo/render.js";

export default async function handler(req, res) {
  let out;
  try {
    out = render(req.query || {});
  } catch (err) {
    console.error("bible-page render failed", err);
    res.status(500).setHeader("Content-Type", "text/plain").send("Something went wrong rendering this page.");
    return;
  }
  for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
  res.status(out.status).send(out.body);
}
