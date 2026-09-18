import { rateLimit, checkOrigin } from "./_rateLimit.js";

// GHL's inbound webhook trigger doesn't auto-map city/state to contact fields,
// so we also call the Contacts upsert API directly to ensure they land.
async function upsertCityState(pitToken, locationId, email, city, state) {
  if (!email || (!city && !state)) return;
  await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pitToken}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locationId,
      email,
      ...(city && { city }),
      ...(state && { state }),
    }),
  });
}

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

  const { email, city, state } = req.body;

  try {
    const pitToken = process.env.GHL_PIT_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;

    await Promise.all([
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "The Way App", ...req.body }),
      }),
      pitToken && locationId
        ? upsertCityState(pitToken, locationId, email, city, state).catch(() => {})
        : Promise.resolve(),
    ]);

    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: true }); // Don't expose CRM errors to client
  }
}
