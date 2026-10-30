import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSitemap, diffSitemap, inspectionRow, SITES, DAILY_INSPECTIONS } from '../seo/crawl.js';

test('reads sitemap indexes and url sets, unescaping locations', () => {
  const idx = parseSitemap('<?xml version="1.0"?><sitemapindex><sitemap><loc>https://a.test/s1.xml</loc></sitemap><sitemap><loc>https://a.test/s2.xml</loc><lastmod>2026-10-01</lastmod></sitemap></sitemapindex>');
  assert.equal(idx.kind, 'index');
  assert.deepEqual(idx.entries, [{ loc: 'https://a.test/s1.xml', lastmod: null }, { loc: 'https://a.test/s2.xml', lastmod: '2026-10-01' }]);
  const set = parseSitemap('<urlset>\n<url><loc> https://a.test/x?a=1&amp;b=2 </loc><lastmod>2026-10-23</lastmod></url><url><lastmod>x</lastmod></url></urlset>');
  assert.equal(set.kind, 'urlset');
  assert.deepEqual(set.entries, [{ loc: 'https://a.test/x?a=1&b=2', lastmod: '2026-10-23' }]);
});

test('only new URLs and URLs whose lastmod moved are resent', () => {
  const stored = new Map([['https://a.test/1', { lastmod: '2026-10-01' }], ['https://a.test/2', { lastmod: null }]]);
  const now = [
    { loc: 'https://a.test/1', lastmod: '2026-10-01' },
    { loc: 'https://a.test/2', lastmod: null },
    { loc: 'https://a.test/3', lastmod: null },
    { loc: 'https://a.test/1b', lastmod: '2026-10-05' },
  ];
  stored.set('https://a.test/1b', { lastmod: '2026-10-02' });
  assert.deepEqual(diffSitemap(now, stored).map((u) => u.loc), ['https://a.test/3', 'https://a.test/1b']);
});

test('inspection results map to stored columns', () => {
  const row = inspectionRow({ inspectionResult: { indexStatusResult: { verdict: 'NEUTRAL', coverageState: 'Discovered - currently not indexed', robotsTxtState: 'ALLOWED' } } });
  assert.equal(row.verdict, 'NEUTRAL');
  assert.equal(row.coverage_state, 'Discovered - currently not indexed');
  assert.equal(row.last_crawl, null);
  assert.deepEqual(inspectionRow({}), { verdict: null, coverage_state: null, last_crawl: null, google_canonical: null, robots_state: null, fetch_state: null });
});

test('stays under Google’s 2,000 inspections a day per property, and every site has a key', () => {
  assert.ok(DAILY_INSPECTIONS <= 2000);
  for (const s of SITES) { assert.match(s.indexnowKey, /^[0-9a-f]{32}$/); assert.match(s.sitemap, /^https:\/\/[^/]+\/sitemap\.xml$/); }
});
