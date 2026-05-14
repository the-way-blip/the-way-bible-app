import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "./index.css";
import App from "./App.jsx";

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
