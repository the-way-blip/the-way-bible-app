import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Shows a small toast when a new app version has been installed
 * by the service worker. Tapping it reloads the page so the new
 * bundle is used.
 */
export default function UpdatePrompt() {
  const [show, setShow] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Re-check for updates every 60 minutes while the tab stays open
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError() {},
  });

  useEffect(() => {
    if (needRefresh) {
      // Small delay so it doesn't pop while user is mid-action
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, [needRefresh]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-slide-up"
    >
      <div className="bg-warm-brown text-cream rounded-2xl shadow-2xl border border-warm-brown/20 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gold-light">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold leading-tight">New version available</p>
          <p className="text-cream/70 text-xs leading-tight mt-0.5">Tap to update — keeps your data intact.</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-gold text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-gold/90 transition-colors shrink-0"
        >
          Update
        </button>
        <button
          onClick={() => { setShow(false); setNeedRefresh(false); }}
          aria-label="Dismiss"
          className="text-cream/50 hover:text-cream p-1 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
