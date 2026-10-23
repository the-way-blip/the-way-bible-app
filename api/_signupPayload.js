/**
 * Every new account goes to the CRM (tag scripture-app-user, which starts the
 * welcome series). Only people who tick the box get daily-devotional, the tag
 * the daily verse email is sent to. Allowlist the outbound payload; never
 * forward arbitrary caller fields.
 */
export function signupPayload(body) {
  if (body?.type !== "sign-up") return null;
  if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return null;
  const subscribeToDevo = body.subscribeToDevo === true;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const [first_name = "", ...rest] = name.split(/\s+/);
  return {
    source: "The Way App", type: "sign-up", email: body.email, first_name, last_name: rest.join(" "), subscribeToDevo,
    tags: subscribeToDevo ? ["scripture-app-user", "daily-devotional"] : ["scripture-app-user"],
  };
}
