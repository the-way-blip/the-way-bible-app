import { track } from "@vercel/analytics";

// Lightweight Google Analytics (GA4 / gtag.js) event helper.
//
// The gtag.js library and `window.gtag` are loaded globally via the snippet
// in index.html. This wrapper fires a GA4 event only when gtag is present, so
// it's a no-op during SSR/build, in tests, or if the tag is blocked. Runs
// alongside the app's existing Vercel Analytics `track()` calls — the two are
// independent analytics destinations.
export function gaEvent(name, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/**
 * Feature usage: one call reaches both GA4 and Vercel Analytics, so we can
 * see which features people actually use before building more.
 * Params stay small and non-personal (book/chapter, ids, counts — never text).
 */
export function logEvent(name, params = {}) {
  gaEvent(name, params);
  try { track(name, params); } catch { /* analytics must never break the app */ }
}
