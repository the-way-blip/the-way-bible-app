import { useEffect, useRef, useState } from "react";
import { MAPBOX_TOKEN } from "../../services/mapboxConfig";

/**
 * 3D satellite terrain map for a single biblical place.
 *
 * mapbox-gl is a heavy dependency (~250 KB gzipped) so it is imported
 * dynamically the first time a map is actually opened — the reader itself
 * never pays for it. Without a token the component renders an elevation-style
 * placeholder instead of failing.
 */
export default function PlaceMap({ place, nearby = [], onSelectNearby }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const nearbyMarkersRef = useRef([]);
  const glRef = useRef(null);
  const onSelectNearbyRef = useRef(onSelectNearby);
  // The map is created once with wherever we started; later selections are
  // handled by flyTo, so the creation effect must not depend on `place`.
  const initialPlaceRef = useRef(place);

  const [status, setStatus] = useState(MAPBOX_TOKEN ? "loading" : "no-token");

  useEffect(() => {
    onSelectNearbyRef.current = onSelectNearby;
  }, [onSelectNearby]);

  // ── Create the map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    let cancelled = false;
    const resizeTimers = [];

    (async () => {
      try {
        const [{ default: mapboxgl }] = await Promise.all([
          import("mapbox-gl"),
          import("mapbox-gl/dist/mapbox-gl.css"),
        ]);
        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;
        glRef.current = mapboxgl;

        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const start = initialPlaceRef.current;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [start.lon, start.lat],
          zoom: zoomFor(start),
          pitch: reduceMotion ? 0 : 62,
          bearing: reduceMotion ? 0 : -18,
          antialias: true,
          attributionControl: true,
          cooperativeGestures: false,
        });
        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");
        map.scrollZoom.setWheelZoomRate(1 / 600);

        map.on("style.load", () => {
          if (cancelled) return;
          // Real elevation — this is what makes Galilee's hills and the Jordan
          // rift read as terrain rather than as a flat photo.
          if (!map.getSource("mapbox-dem")) {
            map.addSource("mapbox-dem", {
              type: "raster-dem",
              url: "mapbox://mapbox.mapbox-terrain-dem-v1",
              tileSize: 512,
              maxzoom: 14,
            });
          }
          map.setTerrain({ source: "mapbox-dem", exaggeration: 1.6 });
          if (!map.getLayer("sky")) {
            map.addLayer({
              id: "sky",
              type: "sky",
              paint: {
                "sky-type": "atmosphere",
                "sky-atmosphere-sun": [0, 0],
                "sky-atmosphere-sun-intensity": 12,
              },
            });
          }
          // The panel slides in with a transform while the map initializes,
          // which can leave the GL drawing buffer sized against a mid-animation
          // box. Re-measure once the entry animation has settled.
          const settle = setTimeout(() => map.resize(), 320);
          resizeTimers.push(settle);

          // Ready as soon as the style is parsed and painting has begun.
          // Deliberately not the "load" event: on satellite-streets-v12,
          // isStyleLoaded() can stay false indefinitely (an iconset request
          // that never resolves), so "load" never fires even though the map
          // is rendering fine. Tiles stream in behind this, as maps do.
          if (!cancelled) setStatus("ready");
        });

        // Redundant trigger for styles where "load" does fire first.
        map.on("load", () => {
          if (!cancelled) setStatus("ready");
        });

        map.on("error", (event) => {
          // A tile 401/403 means the token is present but not authorized.
          const message = String(event?.error?.message || "");
          if (/401|403|access token|Unauthorized/i.test(message)) {
            if (!cancelled) setStatus("bad-token");
          }
        });
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      resizeTimers.forEach(clearTimeout);
      nearbyMarkersRef.current.forEach((marker) => marker.remove());
      nearbyMarkersRef.current = [];
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Fly to the selected place + drop its pin ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = glRef.current;
    if (!map || !mapboxgl || status !== "ready") return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.flyTo({
      center: [place.lon, place.lat],
      zoom: zoomFor(place),
      pitch: reduceMotion ? 0 : 62,
      bearing: reduceMotion ? 0 : -18,
      duration: reduceMotion ? 0 : 2200,
      essential: true,
    });

    markerRef.current?.remove();
    markerRef.current = new mapboxgl.Marker({ element: buildPin(place.name), anchor: "bottom" })
      .setLngLat([place.lon, place.lat])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, [place, status]);

  // ── Secondary pins for the other places in this chapter ──────────────────
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = glRef.current;
    if (!map || !mapboxgl || status !== "ready") return;

    nearbyMarkersRef.current.forEach((marker) => marker.remove());
    nearbyMarkersRef.current = nearby
      .filter((other) => other.id !== place.id)
      .map((other) => {
        const element = buildDot(other.name);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectNearbyRef.current?.(other);
        });
        return new mapboxgl.Marker({ element, anchor: "center" })
          .setLngLat([other.lon, other.lat])
          .addTo(map);
      });

    return () => {
      nearbyMarkersRef.current.forEach((marker) => marker.remove());
      nearbyMarkersRef.current = [];
    };
  }, [nearby, place.id, status]);

  if (status === "no-token" || status === "bad-token" || status === "error") {
    return <MapFallback place={place} status={status} />;
  }

  return (
    <div className="relative w-full h-full bg-[#0f1720]">
      {/* Sized with w/h rather than `absolute inset-0`: mapbox-gl.css sets
          `.mapboxgl-map { position: relative }` and loads after Tailwind, so
          an absolutely-positioned container collapses to zero height and its
          own `overflow: hidden` then clips the canvas and markers away. */}
      <div ref={containerRef} className="w-full h-full" />

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f1720]">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] tracking-wide text-white/50 uppercase">Rendering terrain</p>
        </div>
      )}

      {/* Coordinate readout — small, factual, sits over the imagery */}
      <div className="absolute left-3 bottom-3 pointer-events-none">
        <p className="text-[10px] font-mono text-white/70 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
          {formatCoord(place.lat, "NS")} · {formatCoord(place.lon, "EW")}
          {place.precision !== "exact" && (
            <span className="ml-1.5 text-gold-light/80">{PRECISION_LABEL[place.precision]}</span>
          )}
        </p>
      </div>
    </div>
  );
}

const PRECISION_LABEL = {
  approx: "approximate",
  within: "within city",
  region: "regional",
};

/** Wide view for regions, tight view for a single town. */
function zoomFor(place) {
  if (place.precision === "region") return 8.2;
  if (place.mentionCount > 100) return 11.5;
  return 12.6;
}

function formatCoord(value, axis) {
  const hemisphere = value >= 0 ? axis[0] : axis[1];
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutes = ((abs - degrees) * 60).toFixed(1);
  return `${degrees}°${minutes}'${hemisphere}`;
}

/** Gold teardrop pin with the place name, built as a DOM node for Mapbox. */
function buildPin(name) {
  const wrapper = document.createElement("div");
  wrapper.className = "atlas-pin";
  wrapper.innerHTML = `
    <div class="atlas-pin__label">${escapeHtml(name)}</div>
    <svg viewBox="0 0 24 32" class="atlas-pin__marker" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20c0-6.6-5.4-12-12-12z" fill="#c9a84c"/>
      <circle cx="12" cy="12" r="4.5" fill="#fdfbf7"/>
    </svg>
    <div class="atlas-pin__pulse"></div>
  `;
  wrapper.setAttribute("aria-label", name);
  return wrapper;
}

/** Small marker for the other places named in the same chapter. */
function buildDot(name) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "atlas-dot";
  element.title = name;
  element.setAttribute("aria-label", `Show ${name}`);
  element.innerHTML = `<span class="atlas-dot__label">${escapeHtml(name)}</span>`;
  return element;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
}

// ─── Fallback when Mapbox can't render ──────────────────────────────────────

function MapFallback({ place, status }) {
  const message = {
    "no-token": {
      title: "Add a Mapbox token to see the terrain",
      body: "The 3D satellite map needs a free Mapbox access token. Create one at mapbox.com, then set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local and restart the dev server.",
    },
    "bad-token": {
      title: "Mapbox rejected this token",
      body: "The token in NEXT_PUBLIC_MAPBOX_TOKEN was refused. Check that it's a public token (starts with pk.) and that its URL restrictions allow this origin.",
    },
    error: {
      title: "The map couldn't load",
      body: "3D terrain needs WebGL. If you're on an older device or have hardware acceleration disabled, the location details below still work.",
    },
  }[status];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#12181f]">
      {/* Contour-style stand-in so the panel still reads as a map */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.35]" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="atlas-fallback-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill="url(#atlas-fallback-glow)" />
        {Array.from({ length: 9 }, (_, i) => (
          <ellipse
            key={i}
            cx="200"
            cy="150"
            rx={26 + i * 22}
            ry={16 + i * 14}
            fill="none"
            stroke="#c9a84c"
            strokeWidth="0.6"
            opacity={0.5 - i * 0.045}
          />
        ))}
      </svg>

      <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
        <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" className="w-8 h-8 mb-3">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <p className="text-sm font-semibold text-white/90">{message.title}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-white/55 max-w-xs">{message.body}</p>
        <p className="mt-4 text-[10px] font-mono text-white/40">
          {place.name} · {formatCoord(place.lat, "NS")} {formatCoord(place.lon, "EW")}
        </p>
      </div>
    </div>
  );
}
