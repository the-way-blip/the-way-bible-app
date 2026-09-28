// iOS keeps TheWay's web view alive for days, so a resumed app can be running
// an old build. On resume, compare with the live /version.json and reload if
// it changed — but never mid-playback or while the user is typing.
/* global __BUILD_ID__ */
let lastCheck = 0;

function busy() {
  const audio = document.querySelector("audio");
  if (audio && !audio.paused) return true;
  const el = document.activeElement;
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return true;
  return /^\/journal\//.test(window.location.pathname);
}

export async function reloadIfOutdated() {
  if (Date.now() - lastCheck < 60_000) return;
  lastCheck = Date.now();
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const { build } = await res.json();
    if (build && build !== __BUILD_ID__ && !busy()) window.location.reload();
  } catch {
    // offline — keep running the current build
  }
}
