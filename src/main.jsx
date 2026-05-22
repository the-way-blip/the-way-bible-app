import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.jsx";

// ── Sentry error monitoring ───────────────────────────────────────────────
// Only enabled in production (no noise from local dev) and only when a DSN
// has been provided via env. Safe to ship even if the env var is missing.
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: Capacitor.isNativePlatform() ? "ios" : "web",
    // Performance traces: sample 10% of sessions (free tier-friendly).
    tracesSampleRate: 0.1,
    // Capture last 5 console messages with each error for context.
    integrations: [Sentry.browserTracingIntegration()],
    // Don't capture in dev / on localhost just in case
    beforeSend(event) {
      if (window.location.hostname === "localhost") return null;
      return event;
    },
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

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
