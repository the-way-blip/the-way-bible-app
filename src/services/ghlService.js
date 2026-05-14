/**
 * GoHighLevel CRM integration via server-side proxy.
 *
 * Set GHL_WEBHOOK_URL (without VITE_ prefix) in Vercel environment variables.
 * The /api/ghl serverless function proxies all calls to that webhook so the
 * URL is never exposed to the client.
 *
 * Naming convention for `type`: snake-case verb-or-event names.
 *   sign-up | onboarding-complete | prayer-request | reading-milestone
 */

async function submitToGHL(data) {
  try {
    await fetch("/api/ghl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // Silently fail — CRM integration shouldn't block the user experience
  }
}

function splitName(name) {
  return {
    first_name: name?.split(" ")[0] || "",
    last_name: name?.split(" ").slice(1).join(" ") || "",
  };
}

export function submitSignUp({ email, name, subscribeToDevo = false }) {
  const tags = ["scripture-app-user"];
  if (subscribeToDevo) tags.push("daily-devotional");

  return submitToGHL({
    email,
    ...splitName(name),
    tags,
    type: "sign-up",
  });
}

export function submitPrayerRequest({ email, name, title, details }) {
  return submitToGHL({
    email,
    ...splitName(name),
    tags: ["scripture-app-user", "prayer-request"],
    type: "prayer-request",
    prayer_title: title,
    prayer_details: details,
  });
}

/**
 * Fired once when the user completes the onboarding survey.
 * Sends faith_stage, goals, topics as both structured fields and GHL tags
 * so workflows can segment campaigns by life stage and interests.
 */
export function submitOnboardingComplete({
  email,
  name,
  faithStage,
  goals = [],
  topics = [],
  readingPlan,
  suggestedBook,
}) {
  const tags = [
    "scripture-app-user",
    "onboarded",
    faithStage && `faith-stage:${faithStage}`,
    ...goals.map((g) => `goal:${g}`),
    ...topics.map((t) => `topic:${t}`),
  ].filter(Boolean);

  return submitToGHL({
    email,
    ...splitName(name),
    tags,
    type: "onboarding-complete",
    faith_stage: faithStage || null,
    goals,
    topics,
    reading_plan: readingPlan || null,
    suggested_book: suggestedBook || null,
  });
}

/**
 * Fired once per milestone — uses localStorage to deduplicate so the
 * same milestone never fires twice for the same user/device.
 *
 *   milestone: 'first-chapter' | 'book-complete:Genesis' | 'streak:7' | ...
 */
export function submitReadingMilestone({ email, name, milestone, detail = {} }) {
  if (!milestone) return Promise.resolve();

  // localStorage-based dedupe
  try {
    const key = "ghl_milestones_sent";
    const sent = JSON.parse(localStorage.getItem(key) || "[]");
    if (sent.includes(milestone)) return Promise.resolve();
    sent.push(milestone);
    localStorage.setItem(key, JSON.stringify(sent.slice(-200)));
  } catch {
    // If localStorage is unavailable, still fire once per page load — better
    // a possible duplicate than a missed milestone.
  }

  return submitToGHL({
    email,
    ...splitName(name),
    tags: ["scripture-app-user", "reading-milestone", `milestone:${milestone}`],
    type: "reading-milestone",
    milestone,
    ...detail,
  });
}
