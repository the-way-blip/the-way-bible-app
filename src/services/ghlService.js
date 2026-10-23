/**
 * Every new account is added to the CRM for the welcome series; the daily
 * devotional email only goes to people who tick the box (see api/_signupPayload.js).
 */
export async function submitSignUp({ email, name, subscribeToDevo = false }) {
  try {
    await fetch("/api/ghl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sign-up", email, name, subscribeToDevo: subscribeToDevo === true }),
    });
  } catch {
    // Account creation never depends on the CRM.
  }
}
