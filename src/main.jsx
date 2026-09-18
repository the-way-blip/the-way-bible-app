import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.jsx";
import { gaEvent } from "./services/ga";

// ── Sentry error monitoring ───────────────────────────────────────────────
// Only enabled in production (no noise from local dev) and only when a DSN
// has been provided via env. Safe to ship even if the env var is missing.
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: Capacitor.isNativePlatform() ? "ios" : "web",
    // Attach IP + user email/identity to events — helps reproduce crashes
    // from real user reports. Disclosed in our privacy policy.
    sendDefaultPii: true,
    // Performance traces: sample 10% of sessions (free tier-friendly).
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
    // Skip noisy localhost events
    beforeSend(event) {
      if (window.location.hostname === "localhost") return null;
      return event;
    },
  });
}

// ── Native WebView cache recovery ─────────────────────────────────────────
// The native app bundles every asset locally, so a service worker gives no
// benefit and we never register one on native (see the web-only guard around
// <UpdatePrompt/> in App.jsx). But an OLDER build may have left a service
// worker + Cache Storage in the WebView's persistent data container, and that
// container survives App Store updates — so after an update a stale SW can
// serve mismatched JS chunks and render a blank screen (which is exactly the
// stale-cache blank we've seen). Tear all of it down on startup. If a leftover
// SW is actively controlling THIS load, reload once (guarded against a loop)
// so the page comes back from the fresh bundle instead of the cache.
let shouldRender = true;
if (Capacitor.isNativePlatform() && typeof navigator !== "undefined") {
  const clearNativeWebCaches = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch { /* best-effort */ }
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch { /* best-effort */ }
  };

  const controlledByStaleSW =
    "serviceWorker" in navigator && !!navigator.serviceWorker.controller;

  let alreadyRecovered = false;
  try { alreadyRecovered = !!sessionStorage.getItem("__theway_sw_recovered"); } catch { /* ignore */ }

  if (controlledByStaleSW && !alreadyRecovered) {
    // A leftover service worker is serving this page — clean up and reload
    // once so we boot from the fresh bundle. The flag prevents a reload loop.
    shouldRender = false;
    try { sessionStorage.setItem("__theway_sw_recovered", "1"); } catch { /* ignore */ }
    clearNativeWebCaches().finally(() => window.location.reload());
  } else {
    // Normal path (fresh install / no controlling SW): sweep up any leftovers
    // in the background without blocking the first render.
    clearNativeWebCaches();
  }
}

if (shouldRender) {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Native platform setup
if (Capacitor.isNativePlatform()) {
  import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark });
  }).catch(() => {});
  import("@capacitor/splash-screen").then(({ SplashScreen }) => {
    SplashScreen.hide();
  }).catch(() => {});
}

// PWA service worker is auto-registered by vite-plugin-pwa (web only)

// GA4 key event: fires when the user installs the PWA ("Add to Home Screen").
// The `appinstalled` event only fires on web browsers, not the native iOS app.
window.addEventListener("appinstalled", () => {
  gaEvent("pwa_install");
});
