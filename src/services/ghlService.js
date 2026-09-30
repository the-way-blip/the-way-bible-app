/** Only explicitly requested devotional subscriptions go to the marketing service. */
export async function submitSignUp({ email, name, subscribeToDevo = false }) {
  if (subscribeToDevo !== true) return;
  try {
    await fetch("/api/ghl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sign-up", email, name, subscribeToDevo: true }),
    });
  } catch {
    // Account creation remains independent of the optional email subscription.
  }
}
