/** Sanity checks: every topic ref resolves, sample pages render, sitemap counts. `node seo/check.mjs` */
import { render, parseRef, books } from "./render.js";
import { TOPICS } from "./topics.js";
import { routeToQuery } from "./dev-server.mjs";

let bad = 0;
for (const t of TOPICS) for (const ref of t.verses) if (!parseRef(ref)) { console.log(`UNRESOLVED ${t.name}: ${ref}`); bad++; }
console.log(`topics: ${TOPICS.length}, refs: ${TOPICS.reduce((n, t) => n + t.verses.length, 0)}, unresolved: ${bad}`);

const paths = ["/bible", "/bible/john", "/bible/john/3", "/bible/john/3/16", "/bible/john/3/16-18", "/bible/psalms/23/1", "/bible/psalm/23", "/bible/1-john/4/8", "/bible/1john/4/8",
  "/bible/genesis/1/1", "/bible/revelation/22/21", "/bible/jude/1/24", "/verses-about", "/verses-about/fear-and-anxiety", "/verses-about/anxiety", "/verses-about/nope", "/bible/john/99", "/bible/john/3/999", "/sitemap.xml", "/sitemaps/pages.xml", "/sitemaps/verses-john.xml"];
for (const p of paths) {
  const t0 = Date.now();
  const out = render(routeToQuery(p));
  const title = /<title>(.*?)<\/title>/.exec(out.body)?.[1] || out.headers.Location || "";
  const n = (out.body.match(/<url>/g) || []).length;
  console.log(`${String(out.status).padEnd(4)} ${String(Date.now() - t0).padStart(4)}ms ${p.padEnd(36)} ${(out.body.length / 1024).toFixed(1).padStart(6)}kB  ${title}${n ? ` (${n} urls)` : ""}`);
}
const total = books().reduce((n, b) => n + b.chapters.reduce((m, c) => m + c.length, 0), 0);
console.log(`verse pages: ${total}, chapter pages: ${books().reduce((n, b) => n + b.chapters.length, 0)}, book pages: ${books().length}`);
