/**
 * Historical territories, drawn over the terrain for the era of the passage.
 *
 * These are SCHEMATIC. Ancient borders were frontiers rather than lines, they
 * moved constantly, and for most periods the evidence supports a region far
 * better than an outline. Each shape is a coarse, recognisable approximation
 * meant to answer "roughly where, and next to whom" — not to assert a
 * surveyed boundary. The atlas labels them as approximate for that reason.
 *
 * Rings are [longitude, latitude] and must be closed by the builder, not here.
 * `kind` groups them for the layer toggles; `eras` lists the era ids in which
 * the territory is drawn.
 */

const T = (id, name, kind, eras, color, ring, extra = {}) => ({
  id, name, kind, eras, color, ring, ...extra,
});

// ── Tribal allotments (conquest and judges) ─────────────────────────────────
const TRIBES = [
  T("tribe-asher", "Asher", "tribe", ["conquest", "judges"], "#7fae8f",
    [[35.07, 32.92], [35.32, 33.10], [35.45, 33.30], [35.20, 33.27], [35.02, 33.05], [34.98, 32.95]]),
  // Reaches down the north-west shore of Galilee so Capernaum, Chorazin and
  // Bethsaida fall inside it, as Joshua 19 describes
  T("tribe-naphtali", "Naphtali", "tribe", ["conquest", "judges"], "#6f9fb5",
    [[35.40, 32.78], [35.74, 32.86], [35.78, 33.28], [35.45, 33.34], [35.31, 33.06], [35.34, 32.86]]),
  T("tribe-zebulun", "Zebulun", "tribe", ["conquest", "judges"], "#b79a5e",
    [[35.06, 32.62], [35.44, 32.66], [35.46, 32.90], [35.10, 32.92], [35.00, 32.78]]),
  // Northern edge held below Nazareth, which belonged to Zebulun
  T("tribe-issachar", "Issachar", "tribe", ["conquest", "judges"], "#c08a63",
    [[35.15, 32.48], [35.58, 32.50], [35.60, 32.66], [35.20, 32.64], [35.10, 32.58]]),
  T("tribe-manasseh-w", "Manasseh (west)", "tribe", ["conquest", "judges"], "#9a86b5",
    [[34.92, 32.18], [35.45, 32.20], [35.52, 32.50], [35.12, 32.52], [34.90, 32.40]]),
  T("tribe-manasseh-e", "Manasseh (east)", "tribe", ["conquest", "judges"], "#8f7bab",
    [[35.68, 32.52], [36.35, 32.60], [36.30, 33.10], [35.72, 33.00], [35.62, 32.72]]),
  T("tribe-ephraim", "Ephraim", "tribe", ["conquest", "judges"], "#c9a84c",
    [[34.95, 31.96], [35.42, 31.98], [35.48, 32.18], [34.98, 32.16], [34.92, 32.05]]),
  T("tribe-dan", "Dan", "tribe", ["conquest", "judges"], "#6fa8a0",
    [[34.72, 31.88], [35.02, 31.90], [35.04, 32.08], [34.76, 32.06], [34.70, 31.96]]),
  T("tribe-benjamin", "Benjamin", "tribe", ["conquest", "judges"], "#b5687a",
    [[35.06, 31.76], [35.44, 31.78], [35.46, 31.94], [35.08, 31.94]]),
  T("tribe-judah", "Judah", "tribe", ["conquest", "judges"], "#c07a5a",
    [[34.72, 31.06], [35.44, 31.10], [35.50, 31.76], [35.02, 31.76], [34.68, 31.42]]),
  T("tribe-simeon", "Simeon", "tribe", ["conquest", "judges"], "#d0a06e",
    [[34.48, 31.02], [34.94, 31.06], [34.92, 31.34], [34.54, 31.30]]),
  T("tribe-reuben", "Reuben", "tribe", ["conquest", "judges"], "#7e97c4",
    [[35.58, 31.26], [36.02, 31.30], [36.00, 31.80], [35.56, 31.78]]),
  T("tribe-gad", "Gad", "tribe", ["conquest", "judges"], "#84b07e",
    [[35.58, 31.84], [36.06, 31.88], [36.04, 32.48], [35.60, 32.44]]),
];

// ── Kingdoms and neighbours ────────────────────────────────────────────────
const CANAAN_RING = [
  [34.48, 31.02], [34.72, 31.60], [34.90, 32.20], [35.10, 32.90], [35.45, 33.30],
  [35.90, 33.20], [36.20, 32.70], [36.05, 31.80], [35.80, 31.10], [35.20, 30.90],
];

const KINGDOMS = [
  T("canaan", "Canaan", "kingdom", ["primeval", "patriarchs", "egypt-exodus"], "#c9a84c", CANAAN_RING,
    { subtitle: "The land promised to Abraham" }),

  T("israel-united", "Kingdom of Israel", "kingdom", ["united-monarchy"], "#d9b757",
    [[34.48, 31.00], [34.75, 31.70], [35.00, 32.50], [35.45, 33.32], [36.10, 33.20],
     [36.40, 32.40], [36.10, 31.40], [35.60, 30.80], [34.90, 30.85]],
    { subtitle: "United under David and Solomon" }),

  T("israel-north", "Israel (Northern Kingdom)", "kingdom", ["divided-kingdom"], "#b5687a",
    [[34.92, 32.10], [35.20, 32.60], [35.45, 33.28], [36.10, 33.10], [36.30, 32.50],
     [35.90, 31.95], [35.30, 31.92]],
    { subtitle: "Ten tribes, capital at Samaria" }),

  T("judah-south", "Judah (Southern Kingdom)", "kingdom",
    ["divided-kingdom", "judah-alone"], "#c07a5a",
    [[34.55, 31.02], [34.78, 31.60], [35.02, 31.92], [35.50, 31.90], [35.58, 31.30],
     [35.20, 30.92], [34.80, 30.95]],
    { subtitle: "Two tribes, capital at Jerusalem" }),

  T("yehud", "Yehud", "kingdom", ["exile", "return"], "#b9c48a",
    [[34.90, 31.30], [35.02, 31.90], [35.42, 31.95], [35.52, 31.40], [35.18, 31.20]],
    { subtitle: "Judah as a Persian province" }),

  T("philistia", "Philistia", "kingdom",
    ["conquest", "judges", "united-monarchy", "divided-kingdom", "judah-alone"], "#8a8f9e",
    [[34.28, 31.32], [34.48, 31.30], [34.82, 31.75], [34.90, 32.05], [34.62, 32.00], [34.30, 31.60]],
    { subtitle: "Five cities of the sea peoples" }),

  T("phoenicia", "Phoenicia", "kingdom",
    ["conquest", "judges", "united-monarchy", "divided-kingdom", "judah-alone"], "#6f9fb5",
    [[35.02, 33.00], [35.20, 33.28], [35.40, 33.60], [35.62, 34.10], [35.42, 34.15],
     [35.20, 33.62], [34.98, 33.20]],
    { subtitle: "Tyre and Sidon, traders of the sea" }),

  T("aram", "Aram (Syria)", "kingdom",
    ["united-monarchy", "divided-kingdom", "judah-alone"], "#a08fbe",
    [[35.90, 33.10], [36.40, 33.20], [37.40, 33.80], [37.20, 34.80], [36.20, 34.40], [35.80, 33.70]],
    { subtitle: "Damascus, Israel's northern rival" }),

  T("ammon", "Ammon", "kingdom",
    ["conquest", "judges", "united-monarchy", "divided-kingdom", "judah-alone"], "#8fae7e",
    [[35.85, 31.85], [36.30, 31.90], [36.35, 32.30], [35.90, 32.30]]),

  T("moab", "Moab", "kingdom",
    ["egypt-exodus", "conquest", "judges", "united-monarchy", "divided-kingdom", "judah-alone"], "#b58a5e",
    [[35.55, 31.00], [36.05, 31.05], [36.05, 31.75], [35.55, 31.72]]),

  T("edom", "Edom", "kingdom",
    ["egypt-exodus", "conquest", "judges", "united-monarchy", "divided-kingdom", "judah-alone", "exile"], "#a86a52",
    [[35.05, 29.55], [35.70, 29.60], [35.95, 30.95], [35.35, 31.00], [35.00, 30.30]],
    { subtitle: "Esau's descendants in the red hills of Seir" }),

  T("midian", "Midian", "kingdom", ["patriarchs", "egypt-exodus"], "#c2996b",
    [[35.10, 27.60], [36.60, 27.90], [36.40, 29.60], [35.00, 29.40]]),
];

// ── Empires ────────────────────────────────────────────────────────────────
const EMPIRES = [
  T("egypt", "Egypt", "empire",
    ["primeval", "patriarchs", "egypt-exodus", "conquest", "judges", "united-monarchy",
     "divided-kingdom", "judah-alone", "exile", "return", "gospels", "apostolic"], "#d8a44a",
    [[29.60, 31.60], [32.30, 31.40], [32.60, 30.20], [33.10, 27.80], [33.00, 24.20],
     [32.00, 22.00], [30.60, 22.10], [30.80, 25.00], [30.20, 28.50], [29.40, 30.90]],
    { subtitle: "The Nile, the house of bondage" }),

  T("assyria", "Assyrian Empire", "empire", ["divided-kingdom", "judah-alone"], "#8c5a4a",
    [[34.60, 31.00], [38.00, 34.20], [42.00, 37.50], [46.50, 37.00], [48.00, 33.00],
     [45.00, 30.00], [40.00, 30.50], [35.00, 29.80]],
    { subtitle: "At its height under Sennacherib" }),

  T("babylon", "Babylonian Empire", "empire", ["judah-alone", "exile"], "#6a6f96",
    [[34.40, 30.80], [37.50, 34.00], [41.50, 36.80], [46.50, 35.00], [48.00, 30.50],
     [44.00, 29.00], [38.00, 30.00], [34.80, 29.60]],
    { subtitle: "Nebuchadnezzar's empire" }),

  T("persia", "Persian Empire", "empire", ["return"], "#7f9e73",
    [[26.00, 36.00], [33.00, 42.00], [46.00, 42.00], [60.00, 38.00], [70.00, 32.00],
     [66.00, 25.00], [52.00, 24.00], [43.00, 27.00], [32.00, 22.00], [25.00, 30.00]],
    { subtitle: "Cyrus to Artaxerxes — Egypt to India" }),

  T("rome", "Roman Empire", "empire", ["gospels", "apostolic"], "#7794a8",
    [[-9.00, 36.00], [-5.00, 43.50], [4.00, 50.00], [16.00, 48.50], [28.00, 46.00],
     [36.00, 42.00], [42.00, 36.00], [36.00, 31.00], [32.00, 24.00], [20.00, 30.00],
     [10.00, 33.50], [-2.00, 35.00]],
    { subtitle: "The world the gospel travelled" }),
];

// ── Roman-era provinces and tetrarchies ────────────────────────────────────
const PROVINCES = [
  T("galilee", "Galilee", "province", ["gospels", "apostolic"], "#7fae8f",
    [[35.05, 32.60], [35.62, 32.68], [35.70, 33.15], [35.15, 33.05], [34.98, 32.80]],
    { subtitle: "Herod Antipas's tetrarchy" }),
  T("samaria-prov", "Samaria", "province", ["gospels", "apostolic"], "#b79a5e",
    [[34.92, 32.10], [35.52, 32.15], [35.55, 32.55], [35.02, 32.58]]),
  T("judea-prov", "Judea", "province", ["gospels", "apostolic"], "#c07a5a",
    [[34.72, 31.20], [34.98, 31.95], [35.50, 31.98], [35.55, 31.30], [35.10, 31.12]],
    { subtitle: "Under a Roman prefect from AD 6" }),
  T("perea", "Perea", "province", ["gospels", "apostolic"], "#8fae7e",
    [[35.55, 31.30], [36.00, 31.35], [35.98, 32.30], [35.58, 32.25]],
    { subtitle: "'Beyond the Jordan'" }),
  T("decapolis", "Decapolis", "province", ["gospels", "apostolic"], "#9a86b5",
    [[35.60, 32.30], [36.40, 32.35], [36.45, 33.00], [35.65, 32.95]],
    { subtitle: "Ten Greek cities east of Galilee" }),
  T("idumea", "Idumea", "province", ["gospels", "apostolic"], "#a86a52",
    [[34.55, 30.60], [35.30, 30.65], [35.35, 31.25], [34.70, 31.20]]),
  T("nabatea", "Nabatea", "province", ["gospels", "apostolic"], "#c2996b",
    [[35.00, 29.40], [36.80, 29.60], [37.00, 31.40], [35.90, 31.30], [35.10, 30.20]],
    { subtitle: "Petra and the caravan roads" }),
  T("syria-prov", "Syria", "province", ["gospels", "apostolic"], "#a08fbe",
    [[35.60, 33.20], [37.40, 33.60], [37.60, 36.40], [35.70, 36.10], [35.30, 34.20]],
    { subtitle: "Governed from Antioch" }),
  T("asia-prov", "Asia", "province", ["apostolic"], "#8fc0d0",
    [[26.20, 37.00], [30.50, 37.40], [31.00, 40.00], [26.40, 40.20]],
    { subtitle: "Ephesus and the seven churches" }),
  T("galatia-prov", "Galatia", "province", ["apostolic"], "#b5a06e",
    [[30.80, 37.20], [35.00, 37.60], [35.20, 40.40], [31.00, 40.20]]),
  T("macedonia-prov", "Macedonia", "province", ["apostolic"], "#7e97c4",
    [[20.40, 39.80], [25.00, 40.20], [25.20, 41.60], [20.60, 41.40]],
    { subtitle: "Philippi, Thessalonica, Berea" }),
  T("achaia-prov", "Achaia", "province", ["apostolic"], "#c9a84c",
    [[20.80, 36.60], [24.20, 36.80], [24.40, 39.60], [20.90, 39.40]],
    { subtitle: "Athens and Corinth" }),
];

export const TERRITORIES = [...TRIBES, ...KINGDOMS, ...EMPIRES, ...PROVINCES];

/** Human labels for the layer toggles, in display order. */
export const TERRITORY_KINDS = [
  { id: "tribe", label: "Tribes", hint: "The twelve allotments under Joshua" },
  { id: "kingdom", label: "Kingdoms", hint: "Israel, Judah, and their neighbours" },
  { id: "province", label: "Provinces", hint: "Roman provinces and tetrarchies" },
  { id: "empire", label: "Empires", hint: "The great powers of the age" },
];

/** Territories drawn for an era, optionally filtered to enabled kinds. */
export function territoriesForEra(eraId, enabledKinds) {
  return TERRITORIES.filter(
    (t) => t.eras.includes(eraId) && (!enabledKinds || enabledKinds.has(t.kind))
  );
}

/** Which kinds actually have something to show in this era. */
export function kindsAvailableForEra(eraId) {
  const present = new Set(
    TERRITORIES.filter((t) => t.eras.includes(eraId)).map((t) => t.kind)
  );
  return TERRITORY_KINDS.filter((kind) => present.has(kind.id));
}

/** GeoJSON FeatureCollection for the map source. */
export function territoriesToGeoJSON(territories) {
  return {
    type: "FeatureCollection",
    features: territories.map((t) => ({
      type: "Feature",
      id: t.id,
      properties: {
        id: t.id,
        name: t.name,
        kind: t.kind,
        color: t.color,
        subtitle: t.subtitle || "",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[...t.ring, t.ring[0]]],
      },
    })),
  };
}

/**
 * Which territory a point falls inside, for the era being viewed.
 *
 * At reading zoom you are usually *inside* one territory, so the fill alone
 * reads as nothing — naming it in the panel is what actually delivers the
 * "where was this, politically, at the time" answer. Smaller shapes win over
 * larger ones so a town resolves to its tribe rather than to the empire that
 * happened to contain it.
 */
export function territoryContaining(lon, lat, eraId, enabledKinds) {
  const candidates = territoriesForEra(eraId, enabledKinds).filter((t) =>
    pointInRing(lon, lat, t.ring)
  );
  if (!candidates.length) return null;
  return candidates.sort((a, b) => ringArea(a.ring) - ringArea(b.ring))[0];
}

/** Standard ray-casting test. Rings here are simple polygons. */
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Shoelace area, in degrees² — only ever used to compare sizes. */
function ringArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(sum / 2);
}
