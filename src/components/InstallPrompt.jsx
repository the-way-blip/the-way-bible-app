import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("pwaInstallDismissed") === "true"
  );
  const [ready, setReady] = useState(false);

  // Don't show if already installed as standalone
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    if (isStandalone) return;

    // Track visit count — only show after 3 visits
    const visits = parseInt(localStorage.getItem("pwaVisitCount") || "0", 10) + 1;
    localStorage.setItem("pwaVisitCount", String(visits));
    if (visits >= 3) setReady(true);
  }, [isStandalone]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || !deferredPrompt || dismissed || !ready) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwaInstallDismissed", "true");
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 max-w-lg mx-auto animate-slide-up md:bottom-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-cream-dark p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center shrink-0">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warm-brown">Install The Way</p>
          <p className="text-xs text-warm-brown-light">Add to home screen for offline access</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-gold text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-gold/90 transition-colors shrink-0"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-warm-brown-light hover:text-warm-brown p-1 shrink-0"
          aria-label="Dismiss"
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
