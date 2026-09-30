import process from "node:process";
import { rateLimit, checkOrigin } from "./_rateLimit.js";

import { devotionalPayload } from "./_devotionalConsent.js";

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

  const payload = devotionalPayload(req.body);
  if (!payload) return res.status(400).json({ error: "An explicit devotional subscription is required" });
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
