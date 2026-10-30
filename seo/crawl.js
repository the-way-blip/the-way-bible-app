/**
 * The sites /api/seo-crawl looks after, and the pure helpers it uses (kept here
 * so tests can run them without the network).
 *
 * Each site lists its Search Console property, its sitemap, and the IndexNow
 * key its host serves at /<key>.txt. A site whose property the service account
 * cannot read is skipped with an error in the run's report, so a site can be
 * listed here before its access is granted.
 */
export const SITES = [
  { id: "bible", property: "sc-domain:thewaybible.app", sitemap: "https://thewaybible.app/sitemap.xml", indexnowKey: "7c886aebbb2a11c8747017534fd721e9" },
  { id: "people", property: "sc-domain:offorandbythepeople.com", sitemap: "https://www.offorandbythepeople.com/sitemap.xml", indexnowKey: "918bdf7071ace4fbcc2a8df1008b7705" },
  { id: "library", property: "sc-domain:thewaylibrary.com", sitemap: "https://thewaylibrary.com/sitemap.xml", indexnowKey: "7c886aebbb2a11c8747017534fd721e9" },
  { id: "church", property: "sc-domain:bigrapids.church", sitemap: "https://bigrapids.church/sitemap.xml", indexnowKey: "7c886aebbb2a11c8747017534fd721e9" },
  { id: "scroll", property: "sc-domain:scroll.thewaybible.app", sitemap: "https://scroll.thewaybible.app/sitemap.xml", indexnowKey: "7c886aebbb2a11c8747017534fd721e9" },
];

/** Google allows 2,000 URL inspections a day per property; this leaves headroom. */
export const DAILY_INSPECTIONS = 1900;

const unxml = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");

/** Reads a sitemap or sitemap index: { kind: "index"|"urlset", entries: [{ loc, lastmod }] }. */
export function parseSitemap(xml) {
  const kind = /<sitemapindex[\s>]/.test(xml) ? "index" : "urlset";
  const tag = kind === "index" ? "sitemap" : "url";
  const entries = [];
  for (const m of xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))) {
    const loc = /<loc>\s*([^<]+?)\s*<\/loc>/.exec(m[1]);
    if (!loc) continue;
    const lastmod = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/.exec(m[1]);
    entries.push({ loc: unxml(loc[1]), lastmod: lastmod ? lastmod[1] : null });
  }
  return { kind, entries };
}

/**
 * Compares what the sitemap lists now with what was stored last time.
 * Returns the rows to upsert (new URLs, and URLs whose lastmod moved) and the
 * URLs to send to IndexNow (the same set: IndexNow is for added or changed
 * pages, never for resending unchanged ones).
 */
export function diffSitemap(current, stored) {
  const changed = [];
  for (const u of current) {
    const was = stored.get(u.loc);
    if (!was || (u.lastmod && was.lastmod !== u.lastmod)) changed.push(u);
  }
  return changed;
}

/** Turns a URL Inspection API result into the columns stored per URL. */
export function inspectionRow(result) {
  const r = result?.inspectionResult?.indexStatusResult || {};
  return {
    verdict: r.verdict || null,                 // PASS, NEUTRAL, FAIL, PARTIAL, VERDICT_UNSPECIFIED
    coverage_state: r.coverageState || null,    // e.g. "Submitted and indexed", "Discovered - currently not indexed"
    last_crawl: r.lastCrawlTime || null,
    google_canonical: r.googleCanonical || null,
    robots_state: r.robotsTxtState || null,
    fetch_state: r.pageFetchState || null,
  };
}

/** Splits a list into chunks of n. */
export const chunks = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));
