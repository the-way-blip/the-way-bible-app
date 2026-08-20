/**
 * Loads mapbox-gl on demand.
 *
 * mapbox-gl ships as an ES module, and Rolldown's output for it is rejected by
 * WKWebView (Capacitor iOS) with a SyntaxError at parse time — so the library
 * is vendored as a classic UMD script at public/mapbox-gl.js and read off the
 * window global instead of being imported.
 *
 * Injecting that script here rather than in index.html keeps the 1.8 MB
 * payload off every page load: the reader only pays for it when someone
 * actually opens the atlas. It is still a classic script, so WKWebView never
 * sees module syntax either way.
 */

const SCRIPT_SRC = "/mapbox-gl.js";
const STYLE_HREF = "/mapbox-gl.css";

let loadPromise = null;

function injectStylesheet() {
  if (document.querySelector(`link[href="${STYLE_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

/** Resolves with the mapboxgl global, or rejects if it can't be loaded. */
export function loadMapboxGl() {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    injectStylesheet();

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const script = existing || document.createElement("script");

    const onLoad = () => {
      if (window.mapboxgl) resolve(window.mapboxgl);
      else reject(new Error("mapbox-gl loaded but window.mapboxgl is undefined"));
    };
    const onError = () => {
      // Allow a later retry rather than caching the failure forever.
      loadPromise = null;
      script.remove();
      reject(new Error(`Failed to load ${SCRIPT_SRC}`));
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}
