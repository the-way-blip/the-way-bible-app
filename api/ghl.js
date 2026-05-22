import { rateLimit, checkOrigin } from "./_rateLimit.js";

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

  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) {
    // Silently succeed — CRM integration is optional
    return res.status(200).json({ ok: true });
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "The Way App",
        ...req.body,
      }),
    });
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: true }); // Don't expose CRM errors to client
  }
}
