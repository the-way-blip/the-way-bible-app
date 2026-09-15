/**
 * seo/indexnow.mjs — push URLs to IndexNow (Bing, Copilot/ChatGPT via Bing's
 * index, DuckDuckGo, Yandex, Naver, Seznam) instead of waiting to be crawled.
 *
 *   node seo/indexnow.mjs                 # every URL in the sitemap (all ~32k, batched)
 *   node seo/indexnow.mjs pages           # just sitemaps/pages.xml (hubs, topics, books, chapters)
 *   node seo/indexnow.mjs /verse-of-the-day /verses-about/christmas   # specific paths
 *
 * The key is self-issued (IndexNow spec) and proven by public/<key>.txt, which
 * Vercel serves at https://thewaybible.app/<key>.txt. Google does not use
 * IndexNow — Search Console's sitemap + Request Indexing cover Google.
 */
import { render, SITE } from "./render.js";

const KEY = "7c886aebbb2a11c8747017534fd721e9";
const HOST = new URL(SITE).host;
const ENDPOINT = "https://api.indexnow.org/indexnow";

function locs(xmlBody) {
  return [...xmlBody.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}
function sitemapUrls(which) {
  const index = locs(render({ kind: "sitemap-index" }).body);
  const files = which === "pages" ? index.filter((u) => u.endsWith("/pages.xml")) : index;
  const urls = [];
  for (const f of files) urls.push(...locs(render({ kind: "sitemap", file: f.split("/").pop() }).body));
  return urls;
}

async function submit(urlList) {
  const body = { host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList };
  const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
  return res.status; // 200 = OK, 202 = accepted (key not yet verified), 4xx = problem
}

const args = process.argv.slice(2);
let urls;
if (args.length === 0) urls = sitemapUrls("all");
else if (args[0] === "pages") urls = sitemapUrls("pages");
else urls = args.map((p) => (p.startsWith("http") ? p : SITE + p));

console.log(`submitting ${urls.length} URLs to IndexNow for ${HOST}`);
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const status = await submit(batch);
  console.log(`  batch ${i / 10000 + 1}: ${batch.length} urls → HTTP ${status}`);
  if (status >= 400) process.exit(1);
}
