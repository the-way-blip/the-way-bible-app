import process from "node:process";
import { rateLimit, checkOrigin } from "./_rateLimit.js";

// Church directory submissions: emails Dillon and queues the row in Supabase (public.church_submissions).
// Resend is in test mode (sends only to the account owner) until a domain is verified at resend.com/domains; then set CHURCH_SUBMIT_FROM.
// Either channel succeeding counts as received.
const TO = process.env.CHURCH_SUBMIT_TO || "dillon@bigrapids.church";
const FROM = process.env.CHURCH_SUBMIT_FROM || "TheWay Bible <onboarding@resend.dev>";

const clip = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkOrigin(req)) return res.status(403).json({ error: "Forbidden" });
  if (rateLimit(req, { windowMs: 60_000, max: 5 })) return res.status(429).json({ error: "Too many requests" });

  const b = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  if (b.company) return res.status(200).json({ ok: true }); // honeypot: pretend success
  const row = {
    kind: ["add", "update", "remove"].includes(b.kind) ? b.kind : "add",
    church_slug: clip(b.slug, 120) || null,
    name: clip(b.name, 160),
    city: clip(b.city, 80) || null,
    state: clip(b.state, 40) || null,
    website: clip(b.website, 300) || null,
    address: clip(b.address, 240) || null,
    phone: clip(b.phone, 40) || null,
    pastor: clip(b.pastor, 120) || null,
    times: clip(b.times, 600) || null,
    notes: clip(b.notes, 1200) || null,
    contact_email: clip(b.email, 200) || null,
  };
  if (!row.name || !row.city) return res.status(400).json({ error: "Church name and city are required" });
  if (row.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email)) return res.status(400).json({ error: "That email doesn't look right" });

  const [queued, emailed] = await Promise.all([queue(row), email(row)]);
  if (!queued && !emailed) return res.status(502).json({ error: "Couldn't send right now. Please email hello@thewaybible.app." });
  return res.status(200).json({ ok: true });
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }

async function queue(row) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/church_submissions`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!r.ok) console.error("church-submit queue failed", r.status, (await r.text()).slice(0, 300));
    return r.ok;
  } catch (e) { console.error("church-submit queue error", e.message); return false; }
}

async function email(row) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const verb = { add: "New church", update: "Update", remove: "Removal request" }[row.kind];
  const lines = [["Church", row.name], ["City/State", [row.city, row.state].filter(Boolean).join(", ")], ["Website", row.website], ["Address", row.address], ["Phone", row.phone], ["Pastor", row.pastor], ["Service times", row.times], ["Notes", row.notes], ["Existing page", row.church_slug && `https://thewaybible.app/churches/${row.church_slug}`], ["Contact", row.contact_email]].filter(([, v]) => v);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: [TO], ...(row.contact_email ? { reply_to: row.contact_email } : {}),
        subject: `${verb}: ${row.name} (${row.city})`,
        html: `<p><b>${verb} submitted on thewaybible.app/churches</b></p><table cellpadding="4">${lines.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table><p>Review the queue in Supabase: church_submissions (status = pending).</p>`,
      }),
    });
    if (!r.ok) console.error("church-submit email failed", r.status, (await r.text()).slice(0, 300));
    return r.ok;
  } catch (e) { console.error("church-submit email error", e.message); return false; }
}
