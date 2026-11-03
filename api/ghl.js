import process from "node:process";
import { rateLimit, checkOrigin } from "./_rateLimit.js";

import { signupPayload } from "./_signupPayload.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Reject requests from any origin other than ours
  if (!checkOrigin(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Throttle: max 10 POSTs per IP per minute (well above normal usage,
  // prevents signup flooding)
  if (rateLimit(req, { windowMs: 60_000, max: 10 })) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const payload = signupPayload(req.body);
  if (!payload) return res.status(400).json({ error: "A sign-up with a valid email is required" });
  // Optional: create the contact through the GHL API (private integration token)
  // instead of the inbound webhook. Off until GHL_SIGNUP_VIA=api is set, because
  // the webhook's workflow may do more than add the tags.
  if (process.env.GHL_SIGNUP_VIA === "api" && process.env.GHL_PIT_TOKEN && process.env.GHL_LOCATION_ID) {
    try {
      await saveViaApi(payload);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("GHL API signup failed", e.message);
      return res.status(502).json({ error: "Subscription unavailable" });
    }
  }

  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) return res.status(200).json({ ok: true });
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return res.status(502).json({ error: "Subscription unavailable" });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "Subscription unavailable" });
  }
}

const GHL = "https://services.leadconnectorhq.com";

// Upsert WITHOUT tags, then add tags: tags sent on an upsert can replace a
// returning contact's existing tags. Adding scripture-app-user fires the
// "Contact Tag Added" trigger that starts the welcome series.
async function saveViaApi(p) {
  const headers = {
    Authorization: `Bearer ${process.env.GHL_PIT_TOKEN}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const contact = { locationId: process.env.GHL_LOCATION_ID, email: p.email, source: "thewaybible.app" };
  if (p.first_name) contact.firstName = p.first_name;
  if (p.last_name) contact.lastName = p.last_name;
  const r = await fetch(`${GHL}/contacts/upsert`, { method: "POST", headers, body: JSON.stringify(contact) });
  if (!r.ok) throw new Error(`upsert ${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`);
  const id = (await r.json().catch(() => ({})))?.contact?.id;
  if (!id) throw new Error("upsert returned no contact id");
  const t = await fetch(`${GHL}/contacts/${id}/tags`, { method: "POST", headers, body: JSON.stringify({ tags: ["thewaybible-app", ...p.tags] }) });
  if (!t.ok) throw new Error(`tags ${t.status} ${(await t.text().catch(() => "")).slice(0, 200)}`);
}
