/**
 * /api/daily-verse — pushes today's verse into GoHighLevel each morning.
 *
 * The split of work: we decide the verse and write the words; GoHighLevel owns
 * the list, the sending, the unsubscribe link and the deliverability. That is
 * what it is for, and it is already where /api/ghl puts everyone who signs up.
 *
 * How it reaches an email. A GHL inbound webhook acts on one contact, so it
 * cannot drive a broadcast. Location custom values can: this writes today's
 * verse into them, and a scheduled workflow in GHL sends to everyone tagged
 * daily-devotional using {{custom_values.daily_verse_ref}} and the rest. The
 * workflow must run AFTER this does — this is scheduled at 05:00 UTC in
 * vercel.json, so anything from about 10:00 UTC onwards is safe.
 *
 * The verse is the same one /verse-of-the-day shows, because both call
 * votdRef() — a function of the UTC date, so the email and the site never
 * disagree.
 *
 * Setting it up in GHL, once:
 *   1. Settings → Custom Values: the four keys below are created by the first
 *      successful run, so run it once and they will be there.
 *   2. Build a workflow on a Daily schedule, filtered to the tag
 *      daily-devotional, with an email step using those custom values.
 *
 * Needs CRON_SECRET, GHL_PIT_TOKEN and GHL_LOCATION_ID in the environment. A
 * GET with ?dry=1 and the secret returns what WOULD be pushed without writing,
 * which is the way to check it before pointing a workflow at it.
 */
import process from "node:process";
import { votdRef } from "../seo/votd.js";
import { parseRef, plain, SITE } from "../seo/render.js";
import { VERSE_MEANINGS } from "../seo/meanings.js";

const API = "https://services.leadconnectorhq.com";
const KEYS = {
  daily_verse_ref: "ref",
  daily_verse_text: "text",
  daily_verse_note: "note",
  daily_verse_url: "url",
};

/** The reference, the words, a short note where we have written one, and a link. */
export function todaysVerse(date = new Date()) {
  const ref = votdRef(date);
  const r = parseRef(ref);
  if (!r) return null;
  const text = plain(r.book.chapters[r.chapter - 1].slice(r.from - 1, r.to).join(" "));
  const slug = r.book.slug;
  const url = `${SITE}/bible/${slug}/${r.chapter}/${r.from}${r.to !== r.from ? `-${r.to}` : ""}`;
  // Not every verse in the pool has one of ours; the email reads fine without it.
  const note = VERSE_MEANINGS[ref] || "";
  return { ref, text, note, url };
}

async function ghl(path, init) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GHL_PIT_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init && init.headers),
    },
  });
  const body = await res.text();
  let json = null;
  try { json = body ? JSON.parse(body) : null; } catch { /* GHL sometimes answers with plain text */ }
  return { ok: res.ok, status: res.status, json, body };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Vercel Cron sends this header when CRON_SECRET is set. Without the check the
  // endpoint would let anyone rewrite what goes out to the whole list.
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: "CRON_SECRET is not configured" });
  if (req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized" });

  const verse = todaysVerse();
  if (!verse) return res.status(500).json({ error: "Could not resolve today's verse" });
  if (req.query && req.query.dry) return res.status(200).json({ dry: true, verse });

  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId || !process.env.GHL_PIT_TOKEN) {
    return res.status(500).json({ error: "GHL_LOCATION_ID or GHL_PIT_TOKEN is not configured" });
  }

  const existing = await ghl(`/locations/${locationId}/customValues`, { method: "GET" });
  if (!existing.ok) {
    console.error("daily-verse: could not list custom values", existing.status, existing.body.slice(0, 300));
    return res.status(502).json({ error: "Could not read custom values from GoHighLevel" });
  }
  const byName = new Map((existing.json?.customValues || []).map((c) => [c.name, c.id]));

  const results = {};
  for (const [name, field] of Object.entries(KEYS)) {
    const value = String(verse[field] ?? "");
    const id = byName.get(name);
    const out = id
      ? await ghl(`/locations/${locationId}/customValues/${id}`, { method: "PUT", body: JSON.stringify({ name, value }) })
      : await ghl(`/locations/${locationId}/customValues`, { method: "POST", body: JSON.stringify({ name, value }) });
    results[name] = out.ok ? (id ? "updated" : "created") : `failed ${out.status}`;
    if (!out.ok) console.error(`daily-verse: ${name} ${out.status}`, out.body.slice(0, 300));
  }

  const failed = Object.values(results).filter((r) => r.startsWith("failed"));
  // A partial write would send an email quoting one verse and linking another,
  // so say plainly that it failed rather than reporting success.
  if (failed.length) return res.status(502).json({ error: "Some custom values did not update", verse, results });
  return res.status(200).json({ ok: true, verse, results });
}
