/** Allowlist the outbound payload; never forward arbitrary caller fields. */
export function devotionalPayload(body) {
  if (body?.type !== "sign-up" || body.subscribeToDevo !== true) return null;
  if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return null;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const [first_name = "", ...rest] = name.split(/\s+/);
  return { source: "The Way App", type: "sign-up", email: body.email, first_name, last_name: rest.join(" "), subscribeToDevo: true, tags: ["scripture-app-user", "daily-devotional"] };
}
