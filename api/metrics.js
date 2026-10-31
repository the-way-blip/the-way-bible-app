/**
 * /api/metrics — one read-only JSON feed for the TheWay Metrics dashboard.
 *
 * Returns COUNTS ONLY (no names, emails or ids) for:
 *   - accounts: sign-ups in the shared Supabase project (TheWay Bible + Scroll)
 *   - email:    GoHighLevel list size, new contacts, broadcast delivery
 *   - ga:       GA4 for bigrapids.church, TheWay Bible app, Scroll, and /lamp
 *   - gsc:      Search Console for bigrapids.church, thewaybible.app, scroll
 *
 * Guarded by METRICS_KEY (?key=...). Each source fails on its own: a broken
 * source shows up in `errors` and the rest still return.
 *
 * Env: METRICS_KEY, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL,
 *      GHL_PIT_TOKEN, GHL_LOCATION_ID, GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY.
 * The Google service account is metrics-reader@theway-metrics.iam.gserviceaccount.com
 * (GA4 Viewer on account 366412890, Restricted user on the three GSC sites).
 *
 * Query: ?key=...&days=7|28|90 (default 28)
 */
import process from "node:process";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GA_PROPERTIES = {
  church: "502642659",
  bible: "548364027",
  scroll: "548463325",
  people: "544008154", // Of, For & By the People (offorandbythepeople.com, buildmyballot.com redirects there)
  library: process.env.GA_LIBRARY_PROPERTY || null, // TheWay Library (thewaylibrary.com, tag G-H4R6DGEL5N)
};
const GSC_SITES = {
  church: "sc-domain:bigrapids.church",
  bible: "sc-domain:thewaybible.app",
  scroll: "sc-domain:scroll.thewaybible.app",
  people: "sc-domain:offorandbythepeople.com",
  library: "https://thewaylibrary.com/",
};
const GHL_API = "https://services.leadconnectorhq.com";

/* ---------------- dates ---------------- */
const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
function window_(days) {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - DAY); // yesterday
  const start = new Date(end.getTime() - (days - 1) * DAY);
  const prevEnd = new Date(start.getTime() - DAY);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * DAY);
  return { days, start: iso(start), end: iso(end), prevStart: iso(prevStart), prevEnd: iso(prevEnd) };
}

/* ---------------- Supabase accounts ---------------- */
async function accounts(w) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  async function ids(table, col) {
    const out = new Set();
    for (let from = 0; from < 1e6; from += 1000) {
      const { data, error } = await db.from(table).select(col).range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      data.forEach((r) => out.add(r[col]));
      if (data.length < 1000) break;
    }
    return out;
  }
  // Which app an account has used: TheWay Bible writes `profiles`, Scroll writes `user_state`.
  const [profiles, scroll] = await Promise.all([
    ids("profiles", "id").catch(() => null),
    ids("user_state", "user_id").catch(() => null),
  ]);
  // Last activity per account: reading (TheWay Bible), Scroll state, or sign-in.
  async function stamps(table, idCol, tsCol) {
    const out = new Map();
    for (let from = 0; from < 1e6; from += 1000) {
      const { data, error } = await db.from(table).select(`${idCol},${tsCol}`).range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      data.forEach((r) => { if (r[tsCol]) out.set(r[idCol], r[tsCol]); });
      if (data.length < 1000) break;
    }
    return out;
  }
  const [readAt, scrollAt] = await Promise.all([
    stamps("reading_progress", "user_id", "updated_at").catch(() => new Map()),
    stamps("user_state", "user_id", "updated_at").catch(() => new Map()),
  ]);
  const created = new Map(); // id -> YYYY-MM-DD
  const signIn = new Map();
  for (let page = 1; page < 100; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    data.users.forEach((u) => { created.set(u.id, (u.created_at || "").slice(0, 10)); if (u.last_sign_in_at) signIn.set(u.id, u.last_sign_in_at); });
    if (data.users.length < 1000) break;
  }
  const daily = {};
  let inRange = 0, inPrev = 0, bibleNew = 0, scrollNew = 0;
  for (const [id, d] of created) {
    if (d >= w.start && d <= w.end) {
      inRange++; daily[d] = (daily[d] || 0) + 1;
      if (profiles && profiles.has(id)) bibleNew++;
      if (scroll && scroll.has(id)) scrollNew++;
    } else if (d >= w.prevStart && d <= w.prevEnd) inPrev++;
  }
  // Active = read in TheWay Bible, used Scroll, or signed in, inside the window.
  const now = Date.now();
  const lastAct = new Map();
  for (const id of created.keys()) {
    const t = Math.max(Date.parse(readAt.get(id) || 0) || 0, Date.parse(scrollAt.get(id) || 0) || 0, Date.parse(signIn.get(id) || 0) || 0);
    if (t) lastAct.set(id, t);
  }
  const activeSince = (ms) => [...lastAct.values()].filter((t) => t >= now - ms).length;
  const readersSince = (ms) => [...readAt.values()].filter((t) => Date.parse(t) >= now - ms).length;
  const scrollSince = (ms) => [...scrollAt.values()].filter((t) => Date.parse(t) >= now - ms).length;
  // Weekly sign-up cohorts (Monday weeks, last 8): how many are still active in the last 7 days.
  const monday = (d) => { const x = new Date(d + "T00:00:00Z"); const k = (x.getUTCDay() + 6) % 7; return iso(new Date(x.getTime() - k * DAY)); };
  const cohorts = {};
  for (const [id, d] of created) {
    if (!d) continue;
    const wk = monday(d);
    if (Date.parse(wk) < now - 8 * 7 * DAY) continue;
    cohorts[wk] = cohorts[wk] || { week: wk, signups: 0, activeLast7: 0 };
    cohorts[wk].signups++;
    if ((lastAct.get(id) || 0) >= now - 7 * DAY) cohorts[wk].activeLast7++;
  }
  return {
    active: { last7: activeSince(7 * DAY), last28: activeSince(28 * DAY), readers7: readersSince(7 * DAY), readers28: readersSince(28 * DAY), scroll7: scrollSince(7 * DAY), scroll28: scrollSince(28 * DAY) },
    cohorts: Object.values(cohorts).sort((a, b) => a.week.localeCompare(b.week)),
    total: created.size,
    newInRange: inRange,
    newPrevRange: inPrev,
    daily: fillDays(w, daily),
    bible: profiles ? { total: profiles.size, newInRange: bibleNew } : null,
    scroll: scroll ? { total: scroll.size, newInRange: scrollNew } : null,
  };
}
function fillDays(w, map) {
  const out = [];
  for (let t = Date.parse(w.start); t <= Date.parse(w.end); t += DAY) {
    const d = iso(new Date(t));
    out.push({ date: d, value: map[d] || 0 });
  }
  return out;
}

/* ---------------- GoHighLevel ---------------- */
async function ghl(path, opts = {}) {
  const r = await fetch(GHL_API + path, {
    method: opts.method || "GET",
    headers: {
      Authorization: `Bearer ${process.env.GHL_PIT_TOKEN}`,
      Version: "2021-07-28",
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) throw new Error(`GHL ${path.split("?")[0]} ${r.status}`);
  return r.json();
}
const dayOf = (v) => {
  if (v == null || v === "") return null;
  const d = new Date(typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v);
  return isNaN(d) ? null : iso(d);
};
async function email(w) {
  const loc = process.env.GHL_LOCATION_ID;
  if (!process.env.GHL_PIT_TOKEN || !loc) throw new Error("GHL env missing");
  const out = { contacts: null, newContacts: null, newContactsPrev: null, broadcasts: [] };

  const c = await ghl(`/contacts/?locationId=${loc}&limit=1`);
  out.contacts = c?.meta?.total ?? null;

  async function addedBetween(a, b) {
    const body = {
      locationId: loc, pageLimit: 1,
      filters: [{ field: "dateAdded", operator: "range", value: { gte: `${a}T00:00:00Z`, lte: `${b}T23:59:59Z` } }],
    };
    const r = await ghl(`/contacts/search`, { method: "POST", body });
    return r?.total ?? null;
  }
  try {
    [out.newContacts, out.newContactsPrev] = await Promise.all([addedBetween(w.start, w.end), addedBetween(w.prevStart, w.prevEnd)]);
  } catch (e) { out.newContactsError = String(e.message || e); }

  async function tagCount(tag, a, b) {
    const filters = [{ field: "tags", operator: "contains", value: [tag] }];
    if (a) filters.push({ field: "dateAdded", operator: "range", value: { gte: `${a}T00:00:00Z`, lte: `${b}T23:59:59Z` } });
    const r = await ghl(`/contacts/search`, { method: "POST", body: { locationId: loc, pageLimit: 1, filters } });
    return r?.total ?? null;
  }
  try {
    const [dTot, dNew, iTot, iNew, iPrev] = await Promise.all([
      tagCount("daily-devotional"), tagCount("daily-devotional", w.start, w.end),
      tagCount("interest-list"), tagCount("interest-list", w.start, w.end), tagCount("interest-list", w.prevStart, w.prevEnd),
    ]);
    out.devotional = { total: dTot, newInRange: dNew };
    out.interestList = { total: iTot, newInRange: iNew, newPrevRange: iPrev };
  } catch (e) { out.tagError = String(e.message || e); }

  // Broadcasts: GHL reports delivered counts; a "resend to unopened" child is
  // sent only to people who had NOT opened, so delivered − resend ≈ opened.
  const s = await ghl(`/emails/schedule?locationId=${loc}&limit=60`);
  const list = (s.schedules || []).filter((x) => !x.deleted && x.status !== "draft");
  const resends = new Map();
  list.filter((x) => / resend-unopened$/.test(x.name || "")).forEach((x) => resends.set(x.name.replace(/ resend-unopened$/, ""), x));
  out.broadcasts = list
    .filter((x) => !/ resend-unopened$/.test(x.name || ""))
    .slice(0, 12)
    .map((x) => {
      const rs = resends.get(x.name);
      const delivered = x.successCount ?? null;
      const openedBeforeResend = rs && delivered != null && rs.totalCount != null ? Math.max(0, delivered - rs.totalCount) : null;
      return {
        name: x.name, sentAt: dayOf(x.dateScheduled || x.createdAt), status: x.status,
        audience: x.totalCount ?? null, delivered,
        openedBeforeResend,
        resendDelivered: rs ? rs.successCount ?? null : null,
      };
    });
  return out;
}

/* ---------------- App Store ratings (public lookup) ---------------- */
async function ratings() {
  const ids = { bible: "6762105782", scroll: "6801303519", lamp: "6822149430" };
  const r = await fetch(`https://itunes.apple.com/lookup?id=${Object.values(ids).join(",")}&country=us`);
  if (!r.ok) throw new Error(`iTunes lookup ${r.status}`);
  const j = await r.json();
  const out = {};
  for (const [k, id] of Object.entries(ids)) {
    const a = (j.results || []).find((x) => String(x.trackId) === id);
    out[k] = a ? { rating: a.averageUserRating ?? null, count: a.userRatingCount ?? 0, version: a.version || null, live: true } : { live: false };
  }
  return out;
}

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
    scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
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
async function gpost(url, body) {
  const t = await googleToken();
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
  return j;
}

/* GA4 */
const rowsOf = (rep) => (rep.rows || []).map((r) => ({
  d: (r.dimensionValues || []).map((v) => v.value),
  m: (r.metricValues || []).map((v) => Number(v.value)),
}));
async function ga4(propertyId, w, pathPrefix) {
  const ranges = [{ startDate: w.start, endDate: w.end }, { startDate: w.prevStart, endDate: w.prevEnd }];
  const cur = [{ startDate: w.start, endDate: w.end }];
  const filter = pathPrefix
    ? { dimensionFilter: { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: pathPrefix } } } }
    : {};
  const totalsM = ["activeUsers", "newUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration", "engagedSessions"].map((name) => ({ name }));
  const requests = [
    { dateRanges: ranges, metrics: totalsM, ...filter },
    { dateRanges: cur, dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "engagedSessions" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 400, ...filter },
    { dateRanges: cur, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 7, ...filter },
    { dateRanges: ranges, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 60, ...filter },
    { dateRanges: cur, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 8, ...filter },
  ];
  const j = await gpost(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`, { requests });
  const [tot, daily, chan, ev, pages] = j.reports;

  // With two date ranges GA adds a "dateRange" dimension (date_range_0 / _1) at the end.
  const t = { cur: {}, prev: {} };
  rowsOf(tot).forEach((r) => {
    const which = r.d[r.d.length - 1] === "date_range_1" ? "prev" : "cur";
    totalsM.forEach((m, i) => { t[which][m.name] = r.m[i]; });
  });
  const dailyMap = {}, dailySess = {}, dailyEng = {};
  rowsOf(daily).forEach((r) => {
    const d = `${r.d[0].slice(0, 4)}-${r.d[0].slice(4, 6)}-${r.d[0].slice(6, 8)}`;
    dailyMap[d] = r.m[0]; dailySess[d] = r.m[1]; dailyEng[d] = r.m[2];
  });
  const events = {};
  rowsOf(ev).forEach((r) => {
    const name = r.d[0]; const which = r.d[r.d.length - 1] === "date_range_1" ? "prev" : "cur";
    events[name] = events[name] || { cur: 0, prev: 0 };
    events[name][which] = r.m[0];
  });
  return {
    totals: t.cur, prev: t.prev,
    daily: fillDays(w, dailyMap).map((x) => ({ ...x, sessions: dailySess[x.date] || 0, engaged: dailyEng[x.date] || 0 })),
    channels: rowsOf(chan).map((r) => ({ name: r.d[0], sessions: r.m[0] })),
    events,
    pages: rowsOf(pages).map((r) => ({ path: r.d[0], views: r.m[0] })),
  };
}

/* Search Console */
async function gsc(site, w) {
  // GSC data lags ~2-3 days; the range still ends yesterday and the last days fill in later.
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const [tot, prev, daily, queries, pages] = await Promise.all([
    gpost(base, { startDate: w.start, endDate: w.end }),
    gpost(base, { startDate: w.prevStart, endDate: w.prevEnd }),
    gpost(base, { startDate: w.start, endDate: w.end, dimensions: ["date"], rowLimit: 400 }),
    gpost(base, { startDate: w.start, endDate: w.end, dimensions: ["query"], rowLimit: 10 }),
    gpost(base, { startDate: w.start, endDate: w.end, dimensions: ["page"], rowLimit: 8 }),
  ]);
  const one = (j) => { const r = (j.rows || [])[0] || {}; return { clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || null }; };
  const dm = {}, di = {};
  (daily.rows || []).forEach((r) => { dm[r.keys[0]] = r.clicks; di[r.keys[0]] = r.impressions; });
  return {
    totals: one(tot), prev: one(prev),
    daily: fillDays(w, dm).map((x) => ({ ...x, impressions: di[x.date] || 0 })),
    queries: (queries.rows || []).map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
    pages: (pages.rows || []).map((r) => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
  };
}

/* ---------------- handler ---------------- */
const memo = new Map(); // warm-instance cache: days -> {at, body}

export default async function handler(req, res) {
  const want = process.env.METRICS_KEY;
  const got = String(req.query.key || req.headers["x-metrics-key"] || "");
  if (!want || got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const days = [7, 28, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 28;
  const fresh = req.query.fresh === "1";
  const hit = memo.get(days);
  if (!fresh && hit && Date.now() - hit.at < 10 * 60000) return res.status(200).json(hit.body);

  const w = window_(days);
  const errors = {};
  const safe = (name, p) => p.catch((e) => { errors[name] = String(e?.message || e); return null; });

  const [rate, acc, mail, gaChurch, gaBible, gaScroll, gaLamp, gscChurch, gscBible, gscScroll, gaPeople, gaLibrary, gscPeople, gscLibrary] = await Promise.all([
    safe("ratings", ratings()),
    safe("accounts", accounts(w)),
    safe("email", email(w)),
    safe("ga.church", ga4(GA_PROPERTIES.church, w)),
    safe("ga.bible", ga4(GA_PROPERTIES.bible, w)),
    safe("ga.scroll", ga4(GA_PROPERTIES.scroll, w)),
    safe("ga.lamp", ga4(GA_PROPERTIES.bible, w, "/lamp")),
    safe("gsc.church", gsc(GSC_SITES.church, w)),
    safe("gsc.bible", gsc(GSC_SITES.bible, w)),
    safe("gsc.scroll", gsc(GSC_SITES.scroll, w)),
    safe("ga.people", ga4(GA_PROPERTIES.people, w)),
    GA_PROPERTIES.library ? safe("ga.library", ga4(GA_PROPERTIES.library, w)) : Promise.resolve(null),
    safe("gsc.people", gsc(GSC_SITES.people, w)),
    safe("gsc.library", gsc(GSC_SITES.library, w)),
  ]);

  const body = {
    generatedAt: new Date().toISOString(),
    range: w,
    accounts: acc,
    ratings: rate,
    email: mail,
    ga: { church: gaChurch, bible: gaBible, scroll: gaScroll, lamp: gaLamp, people: gaPeople, library: gaLibrary },
    gsc: { church: gscChurch, bible: gscBible, scroll: gscScroll, people: gscPeople, library: gscLibrary },
    errors,
  };
  memo.set(days, { at: Date.now(), body });
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json(body);
}
