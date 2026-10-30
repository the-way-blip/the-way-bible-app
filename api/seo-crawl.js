/**
 * /api/seo-crawl — keeps Google and Bing up to date on every TheWay site and
 * Of, For & By the People (the list is SITES in seo/crawl.js).
 *
 * What it can and can't do. Google has no API that makes it index ordinary
 * pages: the Indexing API is only for job postings and livestreams, and the old
 * sitemap ping is gone. What Google does offer, and what this uses:
 *   - Sitemaps API: checks each site's sitemap is submitted, and submits it if
 *     not (needs the service account to have Full permission on the property).
 *   - URL Inspection API: reports whether each URL is indexed and why not.
 *     Read-only, 2,000 a day per property. Run hourly, each run checks
 *     DAILY_INSPECTIONS / 24 URLs per site: never-checked URLs first (in
 *     sitemap order, so the main pages go first), then URLs that weren't
 *     indexed when last checked, then indexed URLs not checked for 30 days.
 * Bing, Yandex and others take IndexNow, which does ask them to crawl: once a
 * day the sitemaps are read, and new URLs and URLs whose lastmod moved are
 * sent. Unchanged URLs are never resent.
 *
 * State is in Supabase (supabase-migration-seo.sql): seo_urls has one row per
 * URL with its last inspection, seo_runs one row per run, and the view
 * seo_coverage counts URLs by Google's coverage state per site.
 *
 * Runs from Vercel Cron (hourly, vercel.json) with CRON_SECRET. With the same
 * bearer: ?sync=1 forces the daily sitemap and IndexNow step, ?dry=1 inspects
 * and submits nothing, and ?report=1 returns the coverage counts (also open
 * with ?key=METRICS_KEY, for the metrics dashboard).
 *
 * Env: CRON_SECRET, METRICS_KEY, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL,
 *      GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY.
 */
import process from "node:process";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { createClient } from "@supabase/supabase-js";
import { SITES, DAILY_INSPECTIONS, parseSitemap, diffSitemap, inspectionRow, chunks } from "../seo/crawl.js";

const DAY = 86400000;
const SYNC_HOUR_UTC = 6;
const PER_RUN = Math.floor(DAILY_INSPECTIONS / 24);
const INDEXNOW_PER_DAY = 10000; // one IndexNow request's limit, per host per day

/* ---------------- Google (service account JWT) ---------------- */
let tokenCache = null;
async function googleToken() {
  if (tokenCache && tokenCache.exp > Date.now() + 60000) return tokenCache.token;
  const emailAddr = process.env.GOOGLE_SA_EMAIL;
  let pk = process.env.GOOGLE_SA_PRIVATE_KEY;
  if (!emailAddr || !pk) throw new Error("Google service account env missing");
  pk = pk.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: emailAddr,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(pk).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google token: ${j.error_description || j.error || r.status}`);
  tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}
async function google(method, url, body) {
  const t = await googleToken();
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${t}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j?.error?.message || `HTTP ${r.status}`), { status: r.status });
  return j;
}
const WM = "https://www.googleapis.com/webmasters/v3/sites/";

/* ---------------- sitemaps ---------------- */
async function readSitemap(url) {
  const r = await fetch(url, { headers: { "User-Agent": "TheWay-SEO-Crawl/1.0" } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const { kind, entries } = parseSitemap(await r.text());
  if (kind === "urlset") return entries.map((e) => ({ ...e, priority: 0 }));
  const out = [];
  for (const [i, child] of entries.entries()) {
    const r2 = await fetch(child.loc, { headers: { "User-Agent": "TheWay-SEO-Crawl/1.0" } });
    if (!r2.ok) throw new Error(`${child.loc}: HTTP ${r2.status}`);
    out.push(...parseSitemap(await r2.text()).entries.map((e) => ({ ...e, priority: i })));
  }
  return out;
}

/** Makes sure Google has the sitemap; returns what Google reports about it. */
async function checkSubmitted(site, dry) {
  const list = await google("GET", `${WM}${encodeURIComponent(site.property)}/sitemaps`);
  const found = (list.sitemap || []).find((s) => s.path === site.sitemap);
  if (found) return { submitted: true, lastDownloaded: found.lastDownloaded || null, errors: Number(found.errors || 0), warnings: Number(found.warnings || 0), urls: (found.contents || []).reduce((n, c) => n + Number(c.submitted || 0), 0) };
  if (dry) return { submitted: false, wouldSubmit: true };
  try {
    await google("PUT", `${WM}${encodeURIComponent(site.property)}/sitemaps/${encodeURIComponent(site.sitemap)}`);
    return { submitted: true, justSubmitted: true };
  } catch (e) {
    return { submitted: false, error: e.status === 403 ? "needs Full permission on the property to submit" : e.message };
  }
}

/* ---------------- Supabase ---------------- */
function db() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function upsert(sb, rows) {
  for (const part of chunks(rows, 500)) {
    const { error } = await sb.from("seo_urls").upsert(part, { onConflict: "site,url" });
    if (error) throw new Error(`seo_urls: ${error.message}`);
  }
}
async function storedUrls(sb, site) {
  const out = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("seo_urls").select("url,lastmod").eq("site", site).order("url").range(from, from + 999);
    if (error) throw new Error(`seo_urls: ${error.message}`);
    data.forEach((r) => out.set(r.url, r));
    if (data.length < 1000) return out;
  }
}

/* ---------------- daily: sitemap sync + IndexNow ---------------- */
async function sync(sb, site, dry) {
  const current = await readSitemap(site.sitemap);
  const changed = diffSitemap(current, await storedUrls(sb, site.id));
  if (!dry && changed.length) {
    await upsert(sb, changed.map((u) => ({ site: site.id, url: u.loc, lastmod: u.lastmod, priority: u.priority, indexnow_at: null, in_sitemap: true })));
  }
  // Send everything not yet accepted by IndexNow (new, changed, or failed before).
  const { data: pending, error } = await sb.from("seo_urls").select("url").eq("site", site.id).is("indexnow_at", null).limit(INDEXNOW_PER_DAY);
  if (error) throw new Error(`seo_urls: ${error.message}`);
  let indexnow = { sent: 0 };
  if (pending.length && !dry) {
    const host = new URL(site.sitemap).host;
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: site.indexnowKey, keyLocation: `https://${host}/${site.indexnowKey}.txt`, urlList: pending.map((p) => p.url) }),
    });
    indexnow = { sent: pending.length, status: r.status };
    if (r.ok) {
      const at = new Date().toISOString();
      await upsert(sb, pending.map((p) => ({ site: site.id, url: p.url, indexnow_at: at })));
    }
  } else if (dry) indexnow = { wouldSend: pending.length };
  return { sitemapUrls: current.length, newOrChanged: changed.length, indexnow, google: await checkSubmitted(site, dry) };
}

/* ---------------- hourly: URL inspection ---------------- */
async function pickUrls(sb, site, n) {
  const picked = [];
  const take = async (q) => {
    if (picked.length >= n) return;
    const { data, error } = await q.limit(n - picked.length);
    if (error) throw new Error(`seo_urls: ${error.message}`);
    picked.push(...data.map((r) => r.url));
  };
  const base = () => sb.from("seo_urls").select("url").eq("site", site.id).eq("in_sitemap", true);
  await take(base().is("checked_at", null).order("priority").order("url"));
  await take(base().neq("verdict", "PASS").lt("checked_at", new Date(Date.now() - 7 * DAY).toISOString()).order("checked_at"));
  await take(base().lt("checked_at", new Date(Date.now() - 30 * DAY).toISOString()).order("checked_at"));
  return picked;
}
async function inspect(sb, site, dry) {
  const urls = await pickUrls(sb, site, PER_RUN);
  if (dry) return { wouldInspect: urls.length };
  const rows = [];
  let failed = 0;
  for (const group of chunks(urls, 5)) {
    await Promise.all(group.map(async (url) => {
      try {
        const res = await google("POST", "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { inspectionUrl: url, siteUrl: site.property });
        rows.push({ site: site.id, url, checked_at: new Date().toISOString(), ...inspectionRow(res) });
      } catch (e) {
        failed++;
        if (e.status === 403 || e.status === 429) throw e; // no access, or out of quota: stop this site
      }
    }));
  }
  await upsert(sb, rows);
  const indexed = rows.filter((r) => r.verdict === "PASS").length;
  return { inspected: rows.length, indexed, notIndexed: rows.length - indexed, failed };
}

/* ---------------- handler ---------------- */
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: "CRON_SECRET is not configured" });
  const bearer = req.headers.authorization === `Bearer ${secret}`;
  const reportKey = process.env.METRICS_KEY && req.query?.key === process.env.METRICS_KEY;
  const report = req.query?.report === "1";
  if (!bearer && !(report && reportKey)) return res.status(401).json({ error: "Unauthorized" });

  const sb = db();
  if (report) {
    const { data, error } = await sb.from("seo_coverage").select("*");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ coverage: data });
  }

  const dry = req.query?.dry === "1";
  const daily = req.query?.sync === "1" || new Date().getUTCHours() === SYNC_HOUR_UTC;
  const out = {};
  for (const site of SITES) {
    out[site.id] = {};
    if (daily) {
      try { out[site.id].sync = await sync(sb, site, dry); } catch (e) { out[site.id].syncError = e.message; }
    }
    try { out[site.id].inspection = await inspect(sb, site, dry); } catch (e) {
      out[site.id].inspectionError = e.status === 403 ? "service account has no access to this property" : e.message;
    }
  }
  if (!dry) await sb.from("seo_runs").insert({ daily, result: out });
  return res.status(200).json({ daily, dry, result: out });
}
