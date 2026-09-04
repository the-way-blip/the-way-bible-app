/** Local preview of the SEO pages: `node seo/dev-server.mjs` then open http://localhost:4177/bible/john/3/16 */
import http from "node:http";
import { render } from "./render.js";

const ROUTES = [
  [/^\/sitemap\.xml$/, () => ({ kind: "sitemap-index" })],
  [/^\/sitemaps\/([^/]+)$/, (m) => ({ kind: "sitemap", file: m[1] })],
  [/^\/verses-about\/?$/, () => ({ kind: "topics" })],
  [/^\/verses-about\/([^/]+)\/?$/, (m) => ({ kind: "topic", topic: m[1] })],
  [/^\/bible\/?$/, () => ({ kind: "bible" })],
  [/^\/bible\/([^/]+)\/?$/, (m) => ({ kind: "book", book: m[1] })],
  [/^\/bible\/([^/]+)\/([^/]+)\/?$/, (m) => ({ kind: "chapter", book: m[1], chapter: m[2] })],
  [/^\/bible\/([^/]+)\/([^/]+)\/([^/]+)\/?$/, (m) => ({ kind: "verse", book: m[1], chapter: m[2], verse: m[3] })],
];
export function routeToQuery(pathname) {
  for (const [re, fn] of ROUTES) { const m = re.exec(pathname); if (m) return fn(m); }
  return null;
}
if (process.argv[1] && process.argv[1].endsWith("dev-server.mjs")) {
  const port = +(process.env.PORT || 4177);
  http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const q = routeToQuery(decodeURIComponent(url.pathname));
    const out = q ? render(q) : { status: 404, headers: { "Content-Type": "text/plain" }, body: "not an SEO route" };
    res.writeHead(out.status, out.headers); res.end(out.body);
  }).listen(port, () => console.log(`http://localhost:${port}/bible/john/3/16`));
}
