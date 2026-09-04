/**
 * Turns the atlas's data (historical territories, journeys) into Mapbox
 * sources and layers, and keeps them in sync as the era, the enabled layers,
 * or the selected journey change.
 *
 * All of it is additive: layers are inserted above the satellite imagery and
 * below the map's own labels where possible, and every function is safe to
 * call repeatedly with the same map.
 */

import { territoriesToGeoJSON } from "../data/historicalGeography";
import { getPlaceByName } from "./biblePlaces";

const TERRITORY_SOURCE = "atlas-territories";
const TERRITORY_FILL = "atlas-territories-fill";
const TERRITORY_LINE = "atlas-territories-line";
const TERRITORY_LABEL = "atlas-territories-label";

const ROUTE_SOURCE = "atlas-route";
const ROUTE_CASING = "atlas-route-casing";
const ROUTE_LINE = "atlas-route-line";
const ROUTE_PROGRESS = "atlas-route-progress";

const STOP_SOURCE = "atlas-route-stops";
const STOP_CIRCLE = "atlas-route-stops-circle";
const STOP_LABEL = "atlas-route-stops-label";

const EMPTY_FC = { type: "FeatureCollection", features: [] };

/** Mapbox throws if you touch a style that isn't there yet. */
function styleReady(map) {
  try {
    return Boolean(map && map.getStyle && map.getStyle());
  } catch {
    return false;
  }
}

// ─── Historical territories ─────────────────────────────────────────────────

export function syncTerritories(map, territories) {
  if (!styleReady(map)) return;
  const data = territoriesToGeoJSON(territories || []);

  const existing = map.getSource(TERRITORY_SOURCE);
  if (existing) {
    existing.setData(data);
    return;
  }

  map.addSource(TERRITORY_SOURCE, { type: "geojson", data });

  map.addLayer({
    id: TERRITORY_FILL,
    type: "fill",
    source: TERRITORY_SOURCE,
    paint: {
      "fill-color": ["get", "color"],
      // Tuned against satellite imagery, which is far busier than a flat
      // basemap — anything under ~0.3 simply disappears into the terrain.
      // Empires cover half the screen, so they still sit lighter than a tribe.
      "fill-opacity": [
        "match", ["get", "kind"],
        "empire", 0.2,
        "province", 0.3,
        "kingdom", 0.32,
        0.36,
      ],
    },
  });

  map.addLayer({
    id: TERRITORY_LINE,
    type: "line",
    source: TERRITORY_SOURCE,
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["match", ["get", "kind"], "empire", 1.8, 2.4],
      "line-opacity": 0.95,
      // Dashed, because none of these borders were ever really lines
      "line-dasharray": [2, 1.6],
    },
  });

  map.addLayer({
    id: TERRITORY_LABEL,
    type: "symbol",
    source: TERRITORY_SOURCE,
    layout: {
      "text-field": ["get", "name"],
      "text-size": ["match", ["get", "kind"], "empire", 15, 12],
      "text-letter-spacing": 0.16,
      "text-transform": "uppercase",
      "text-allow-overlap": false,
      "text-padding": 6,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(0,0,0,0.75)",
      "text-halo-width": 1.4,
      "text-opacity": 0.9,
    },
  });
}

export function setTerritoriesVisible(map, visible) {
  if (!styleReady(map)) return;
  const value = visible ? "visible" : "none";
  for (const id of [TERRITORY_FILL, TERRITORY_LINE, TERRITORY_LABEL]) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", value);
  }
}

// ─── Journey routes ─────────────────────────────────────────────────────────

/**
 * Resolve a journey's waypoints against the geocoded dataset.
 * Returns the stops that could be placed, in order, each with coordinates.
 */
export function resolveJourney(journey) {
  if (!journey) return [];
  return journey.waypoints
    .map((waypoint, index) => {
      const place = getPlaceByName(waypoint.place);
      if (!place) return null;
      return {
        index,
        id: `${journey.id}-${index}`,
        place,
        name: waypoint.label || place.name,
        verse: waypoint.verse,
        note: waypoint.note,
        lon: place.lon,
        lat: place.lat,
      };
    })
    .filter(Boolean);
}

function routeFeature(stops) {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: stops.map((s) => [s.lon, s.lat]) },
  };
}

function stopsFeatures(stops) {
  return {
    type: "FeatureCollection",
    features: stops.map((stop) => ({
      type: "Feature",
      properties: { name: stop.name, order: stop.index + 1 },
      geometry: { type: "Point", coordinates: [stop.lon, stop.lat] },
    })),
  };
}

export function syncRoute(map, stops, accent = "#c9a84c") {
  if (!styleReady(map)) return;
  const hasRoute = stops && stops.length >= 2;
  const line = hasRoute ? routeFeature(stops) : EMPTY_FC;
  const points = hasRoute ? stopsFeatures(stops) : EMPTY_FC;

  if (map.getSource(ROUTE_SOURCE)) {
    map.getSource(ROUTE_SOURCE).setData(line);
    map.getSource(STOP_SOURCE).setData(points);
    if (map.getLayer(ROUTE_LINE)) map.setPaintProperty(ROUTE_LINE, "line-color", accent);
    if (map.getLayer(ROUTE_PROGRESS)) map.setPaintProperty(ROUTE_PROGRESS, "line-color", accent);
    return;
  }

  map.addSource(ROUTE_SOURCE, { type: "geojson", data: line, lineMetrics: true });
  map.addSource(STOP_SOURCE, { type: "geojson", data: points });

  // Dark casing underneath keeps the route readable over bright desert
  map.addLayer({
    id: ROUTE_CASING,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "rgba(0,0,0,0.55)", "line-width": 7, "line-blur": 1 },
  });

  // The full route, drawn faintly — where the journey is going
  map.addLayer({
    id: ROUTE_LINE,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": accent,
      "line-width": 3,
      "line-opacity": 0.35,
      "line-dasharray": [1.5, 1.5],
    },
  });

  // The travelled portion, revealed as the journey plays
  map.addLayer({
    id: ROUTE_PROGRESS,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": accent,
      "line-width": 4,
      "line-opacity": 0.95,
      "line-gradient": [
        "interpolate", ["linear"], ["line-progress"],
        0, accent,
        1, accent,
      ],
    },
  });

  map.addLayer({
    id: STOP_CIRCLE,
    type: "circle",
    source: STOP_SOURCE,
    paint: {
      "circle-radius": 5,
      "circle-color": "#fdfbf7",
      "circle-stroke-color": accent,
      "circle-stroke-width": 2.5,
    },
  });

  map.addLayer({
    id: STOP_LABEL,
    type: "symbol",
    source: STOP_SOURCE,
    layout: {
      "text-field": ["concat", ["to-string", ["get", "order"]], ". ", ["get", "name"]],
      "text-size": 11,
      "text-offset": [0, 1.3],
      "text-anchor": "top",
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(0,0,0,0.8)",
      "text-halo-width": 1.3,
    },
  });
}

/**
 * Reveal the route up to `fraction` (0–1) of its total length. Uses the
 * line-gradient stop position rather than re-slicing geometry, so it stays
 * smooth during playback.
 */
export function setRouteProgress(map, fraction) {
  if (!styleReady(map) || !map.getLayer(ROUTE_PROGRESS)) return;
  const clamped = Math.max(0, Math.min(1, fraction));
  const accent = map.getPaintProperty(ROUTE_PROGRESS, "line-color") || "#c9a84c";
  // A hard cut between the drawn colour and transparent, moved along the line
  const edge = Math.min(0.999, Math.max(0.001, clamped));
  map.setPaintProperty(ROUTE_PROGRESS, "line-gradient", [
    "interpolate", ["linear"], ["line-progress"],
    0, accent,
    edge, accent,
    Math.min(1, edge + 0.001), "rgba(0,0,0,0)",
    1, "rgba(0,0,0,0)",
  ]);
}

export function setRouteVisible(map, visible) {
  if (!styleReady(map)) return;
  const value = visible ? "visible" : "none";
  for (const id of [ROUTE_CASING, ROUTE_LINE, ROUTE_PROGRESS, STOP_CIRCLE, STOP_LABEL]) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", value);
  }
}

/** Bounds covering every stop, so the whole journey can be framed. */
export function boundsForStops(mapboxgl, stops) {
  if (!stops?.length) return null;
  const bounds = new mapboxgl.LngLatBounds();
  for (const stop of stops) bounds.extend([stop.lon, stop.lat]);
  return bounds;
}
