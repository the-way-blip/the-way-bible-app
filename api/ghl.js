export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
