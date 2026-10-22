// Daily reminders in the iOS app (local notifications; no server needed).
// We schedule the next 30 days at once, each with that day's verse, and
// top the window back up whenever the app is opened, so the reminder keeps
// going and "pick up where you left off" points at the latest chapter read.
import { Capacitor } from "@capacitor/core";
import { getSmartDailyVerse } from "../data/dailyVerses";
import { logEvent } from "./ga";

const KEY = "dailyReminder"; // { enabled, time: "HH:MM", kind: "verse" | "reading" }
const FIRST_ID = 1000, DAYS = 30;
export const remindersSupported = () => Capacitor.isNativePlatform();

export function getReminder() {
  try { return { enabled: false, time: "07:00", kind: "verse", ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return { enabled: false, time: "07:00", kind: "verse" }; }
}

const lastReading = () => {
  try {
    const m = (localStorage.getItem("lastReaderPath") || "").match(/^\/read\/([^/]+)\/(\d+)/);
    return m ? { book: decodeURIComponent(m[1]), chapter: Number(m[2]) } : null;
  } catch { return null; }
};
const profileTopics = () => { try { return JSON.parse(localStorage.getItem("userProfile") || "{}")?.topics || []; } catch { return []; } };
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

async function plugin() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

/** Cancel and re-create the next 30 days of reminders from the saved settings. */
export async function scheduleReminders(settings = getReminder()) {
  if (!remindersSupported()) return false;
  const LN = await plugin();
  await LN.cancel({ notifications: Array.from({ length: DAYS }, (_, i) => ({ id: FIRST_ID + i })) }).catch(() => {});
  if (!settings.enabled) return true;
  const { display } = await LN.checkPermissions();
  if (display !== "granted") return false;

  const [h, m] = settings.time.split(":").map(Number);
  const reading = lastReading();
  const topics = profileTopics();
  const now = new Date();
  const notifications = [];
  for (let d = 0; notifications.length < DAYS && d <= DAYS; d++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, m, 0);
    if (at <= now) continue;
    const verse = getSmartDailyVerse({ topics, lastReadBook: reading?.book, date: at });
    const continueReading = settings.kind === "reading" && reading;
    notifications.push({
      id: FIRST_ID + notifications.length,
      title: continueReading ? `Pick up in ${reading.book} ${reading.chapter}` : `Verse of the day · ${verse.ref}`,
      body: continueReading ? `Today's verse: “${clip(verse.text, 110)}” — ${verse.ref}` : clip(verse.text, 180),
      schedule: { at, allowWhileIdle: true },
      extra: { url: continueReading ? `/read/${encodeURIComponent(reading.book)}/${reading.chapter}` : `/read/${encodeURIComponent(verse.book)}/${verse.chapter}?verse=${verse.verse}` },
    });
  }
  await LN.schedule({ notifications });
  return true;
}

/** Save settings, asking for notification permission when turning on. Returns the effective settings. */
export async function setReminder(next) {
  const settings = { ...getReminder(), ...next };
  if (settings.enabled && remindersSupported()) {
    const LN = await plugin();
    let { display } = await LN.checkPermissions();
    if (display !== "granted") ({ display } = await LN.requestPermissions());
    if (display !== "granted") settings.enabled = false;
  }
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  await scheduleReminders(settings);
  logEvent("reminder_set", { on: settings.enabled ? 1 : 0, kind: settings.kind, time: settings.time });
  return settings;
}

/** Call once at startup (inside the router): keeps the window full and opens the right chapter on tap
 *  (from a reminder or the home-screen widget). */
export async function initReminders(navigate) {
  if (!remindersSupported()) return () => {};
  const LN = await plugin();
  const { App } = await import("@capacitor/app");
  const tap = await LN.addListener("localNotificationActionPerformed", (e) => {
    const url = e.notification?.extra?.url;
    if (url) { logEvent("reminder_open", { kind: getReminder().kind }); navigate(url); }
  });
  // The home-screen widget opens https://thewaybible.app/read/... in the app
  const opened = await App.addListener("appUrlOpen", ({ url }) => {
    try {
      const u = new URL(url);
      if (u.hostname.endsWith("thewaybible.app") && u.pathname.startsWith("/read/")) { logEvent("widget_open"); navigate(u.pathname + u.search); }
    } catch { /* not a URL we route */ }
  });
  const resume = await App.addListener("appStateChange", ({ isActive }) => { if (isActive && getReminder().enabled) scheduleReminders(); });
  if (getReminder().enabled) scheduleReminders();
  return () => { tap.remove(); resume.remove(); opened.remove(); };
}
