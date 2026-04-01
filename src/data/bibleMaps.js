// Bible geography data — maps key locations mentioned in each book
// Links to free public domain Bible maps

const bookLocations = {
  "Genesis": {
    region: "Ancient Near East",
    places: ["Eden", "Ur of the Chaldees", "Haran", "Canaan", "Egypt", "Bethel", "Shechem", "Hebron", "Beersheba", "Sodom", "Gomorrah"],
    mapUrl: "https://www.bible-history.com/maps/genesis-maps.html",
  },
  "Exodus": {
    region: "Egypt to Sinai",
    places: ["Goshen", "Egypt", "Red Sea", "Mount Sinai", "Kadesh Barnea", "Wilderness of Sin", "Rephidim", "Marah", "Elim"],
    mapUrl: "https://www.bible-history.com/maps/exodus-route.html",
  },
  "Joshua": {
    region: "Canaan",
    places: ["Jericho", "Ai", "Gibeon", "Shiloh", "Shechem", "Hazor", "Jordan River"],
    mapUrl: "https://www.bible-history.com/maps/conquest-of-canaan.html",
  },
  "1 Samuel": {
    region: "Israel",
    places: ["Ramah", "Shiloh", "Bethlehem", "Gibeah", "Mizpah", "Gilgal", "En-gedi"],
  },
  "Matthew": {
    region: "Palestine in Jesus' Time",
    places: ["Bethlehem", "Nazareth", "Capernaum", "Jerusalem", "Sea of Galilee", "Jordan River", "Judea", "Samaria", "Galilee"],
    mapUrl: "https://www.bible-history.com/maps/palestine-in-jesus-time.html",
  },
  "Mark": {
    region: "Galilee & Judea",
    places: ["Capernaum", "Sea of Galilee", "Bethsaida", "Caesarea Philippi", "Jericho", "Jerusalem", "Gethsemane", "Golgotha"],
  },
  "Luke": {
    region: "Palestine & Beyond",
    places: ["Nazareth", "Bethlehem", "Jerusalem", "Emmaus", "Jericho", "Samaria", "Nain", "Bethany"],
  },
  "John": {
    region: "Palestine",
    places: ["Bethany beyond Jordan", "Cana", "Capernaum", "Sychar", "Bethesda", "Siloam", "Bethany", "Jerusalem", "Golgotha"],
  },
  "Acts": {
    region: "Mediterranean World",
    places: ["Jerusalem", "Antioch", "Cyprus", "Philippi", "Thessalonica", "Athens", "Corinth", "Ephesus", "Rome", "Malta"],
    mapUrl: "https://www.bible-history.com/maps/pauls-missionary-journeys.html",
  },
  "Romans": {
    region: "Rome",
    places: ["Rome"],
  },
  "1 Corinthians": { region: "Corinth", places: ["Corinth", "Achaia"] },
  "2 Corinthians": { region: "Corinth", places: ["Corinth", "Macedonia"] },
  "Galatians": { region: "Galatia", places: ["Galatia", "Antioch", "Jerusalem"] },
  "Ephesians": { region: "Ephesus", places: ["Ephesus", "Asia Minor"] },
  "Philippians": { region: "Philippi", places: ["Philippi", "Macedonia"] },
  "Colossians": { region: "Colossae", places: ["Colossae", "Laodicea", "Hierapolis"] },
  "Revelation": {
    region: "Asia Minor & Beyond",
    places: ["Patmos", "Ephesus", "Smyrna", "Pergamos", "Thyatira", "Sardis", "Philadelphia", "Laodicea"],
    mapUrl: "https://www.bible-history.com/maps/seven-churches.html",
  },
};

export function getBookLocations(book) {
  return bookLocations[book] || null;
}

// Free Bible atlas map URLs by region
export function getMapUrl(book) {
  const loc = bookLocations[book];
  if (loc?.mapUrl) return loc.mapUrl;
  // Generic Bible atlas
  return "https://www.bible-history.com/maps/";
}

export function getPlaceSearchUrl(place) {
  return `https://www.bibleplaces.com/search/?q=${encodeURIComponent(place)}`;
}

export default bookLocations;
