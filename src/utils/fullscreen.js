// Fullscreen API helpers for Present mode. Every call is best-effort: iPhone
// Safari / WKWebView has no element fullscreen, so the overlay just fills the
// viewport there. Call enterFullscreen() straight from the click handler that
// opens Present mode so the browser sees the user gesture.

export function fullscreenElement() {
  if (typeof document === "undefined") return null;
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

export function enterFullscreen(el = typeof document !== "undefined" ? document.documentElement : null) {
  if (!el || fullscreenElement()) return;
  try {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    const p = req?.call(el, { navigationUI: "hide" });
    p?.catch?.(() => {});
  } catch { /* not allowed or not supported: the fixed overlay still covers the screen */ }
}

export function exitFullscreen() {
  if (!fullscreenElement()) return;
  try {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    const p = exit?.call(document);
    p?.catch?.(() => {});
  } catch { /* ignore */ }
}
