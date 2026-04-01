import { useState } from "react";
import { getBookLocations } from "../../data/bibleMaps";

// Bible place coordinates (approximate lat/lng for key locations)
const PLACE_COORDS = {
  "Eden": { lat: 31.0, lng: 47.0, note: "Traditionally placed near Mesopotamia" },
  "Ur of the Chaldees": { lat: 30.96, lng: 46.10, note: "Abraham's birthplace in modern Iraq" },
  "Haran": { lat: 36.87, lng: 39.03, note: "Abraham's stopping point on the way to Canaan" },
  "Canaan": { lat: 31.5, lng: 35.0, note: "The Promised Land" },
  "Egypt": { lat: 30.0, lng: 31.2, note: "Land of bondage and the Exodus" },
  "Bethel": { lat: 31.93, lng: 35.23, note: "Where Jacob saw the ladder to heaven" },
  "Shechem": { lat: 32.21, lng: 35.28, note: "Abraham's first stop in Canaan" },
  "Hebron": { lat: 31.53, lng: 35.10, note: "Burial place of the patriarchs" },
  "Beersheba": { lat: 31.25, lng: 34.79, note: "Southern boundary of Israel" },
  "Sodom": { lat: 31.1, lng: 35.4, note: "Destroyed for its wickedness" },
  "Gomorrah": { lat: 31.05, lng: 35.4, note: "Destroyed alongside Sodom" },
  "Jerusalem": { lat: 31.77, lng: 35.23, note: "Holy city, location of the Temple" },
  "Bethlehem": { lat: 31.70, lng: 35.20, note: "Birthplace of Jesus and David" },
  "Nazareth": { lat: 32.70, lng: 35.30, note: "Where Jesus grew up" },
  "Capernaum": { lat: 32.88, lng: 35.57, note: "Jesus' base of ministry in Galilee" },
  "Sea of Galilee": { lat: 32.83, lng: 35.58, note: "Scene of many miracles" },
  "Jordan River": { lat: 31.76, lng: 35.55, note: "Where Jesus was baptized" },
  "Jericho": { lat: 31.87, lng: 35.44, note: "First city conquered in Canaan" },
  "Mount Sinai": { lat: 28.54, lng: 33.97, note: "Where Moses received the Law" },
  "Red Sea": { lat: 28.0, lng: 33.5, note: "Crossed during the Exodus" },
  "Bethany": { lat: 31.77, lng: 35.26, note: "Home of Mary, Martha, Lazarus" },
  "Golgotha": { lat: 31.78, lng: 35.23, note: "Place of Jesus' crucifixion" },
  "Gethsemane": { lat: 31.78, lng: 35.24, note: "Where Jesus prayed before arrest" },
  "Antioch": { lat: 36.20, lng: 36.16, note: "First called Christians here" },
  "Ephesus": { lat: 37.94, lng: 27.34, note: "Major church in Asia Minor" },
  "Corinth": { lat: 37.91, lng: 22.88, note: "Recipient of Paul's letters" },
  "Rome": { lat: 41.90, lng: 12.50, note: "Capital of the Roman Empire" },
  "Athens": { lat: 37.97, lng: 23.73, note: "Paul's Mars Hill sermon" },
  "Philippi": { lat: 41.01, lng: 24.29, note: "First European church" },
  "Thessalonica": { lat: 40.63, lng: 22.95, note: "Paul's letters to this church" },
  "Cyprus": { lat: 35.13, lng: 33.43, note: "Paul's first missionary journey" },
  "Malta": { lat: 35.90, lng: 14.51, note: "Paul shipwrecked here" },
  "Patmos": { lat: 37.32, lng: 26.55, note: "Where John wrote Revelation" },
  "Smyrna": { lat: 38.42, lng: 27.14, note: "One of the seven churches" },
  "Pergamos": { lat: 39.12, lng: 27.18, note: "Where Satan's seat is" },
  "Thyatira": { lat: 38.92, lng: 27.84, note: "One of the seven churches" },
  "Sardis": { lat: 38.49, lng: 28.04, note: "Church told to wake up" },
  "Philadelphia": { lat: 38.35, lng: 28.52, note: "Faithful church, open door" },
  "Laodicea": { lat: 37.84, lng: 29.11, note: "Neither hot nor cold" },
  "Cana": { lat: 32.75, lng: 35.34, note: "First miracle — water to wine" },
  "Nain": { lat: 32.63, lng: 35.35, note: "Jesus raised the widow's son" },
  "Emmaus": { lat: 31.84, lng: 34.99, note: "Road where risen Jesus appeared" },
  "Goshen": { lat: 30.78, lng: 31.75, note: "Where Israelites lived in Egypt" },
  "Shiloh": { lat: 32.06, lng: 35.29, note: "Location of the Tabernacle" },
  "Damascus": { lat: 33.51, lng: 36.29, note: "Paul's conversion on this road" },
};

// Simple SVG map renderer — plots places on a Mediterranean-centered projection
function SimpleMap({ places, highlighted }) {
  // Map bounds: lat 27-43, lng 10-50
  const minLat = 27, maxLat = 43, minLng = 10, maxLng = 50;
  const width = 400, height = 250;

  const toX = (lng) => ((lng - minLng) / (maxLng - minLng)) * width;
  const toY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * height;

  const plotPlaces = places
    .map((name) => ({ name, ...(PLACE_COORDS[name] || {}) }))
    .filter((p) => p.lat);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-lg bg-blue-50/50 border border-cream-dark">
      {/* Simplified coastline/land masses */}
      <path d="M0,80 Q60,70 80,90 Q100,110 120,100 Q140,90 160,95 Q180,85 200,90 Q220,100 230,120 Q240,140 235,160 Q230,180 220,200 Q210,220 190,230 L0,250 Z"
        fill="#e8dcc8" stroke="#d4c5b0" strokeWidth="0.5" opacity="0.6" />
      <path d="M240,0 Q260,20 270,50 Q280,80 290,100 Q300,120 310,110 Q320,100 330,90 Q340,80 350,85 Q360,90 370,100 Q380,110 390,120 L400,120 L400,0 Z"
        fill="#e8dcc8" stroke="#d4c5b0" strokeWidth="0.5" opacity="0.6" />
      <path d="M270,80 Q290,75 310,80 Q330,85 340,100 Q350,120 340,140 Q330,160 310,170 Q290,180 270,175 Q260,170 255,160 Q250,150 260,130 Q270,110 270,100 Z"
        fill="#e8dcc8" stroke="#d4c5b0" strokeWidth="0.5" opacity="0.6" />

      {/* Plot places */}
      {plotPlaces.map((p, i) => {
        const x = toX(p.lng);
        const y = toY(p.lat);
        const isHighlighted = highlighted === p.name;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={isHighlighted ? 5 : 3} fill={isHighlighted ? "#c9a84c" : "#8b6f5e"} stroke="white" strokeWidth="1" />
            <text x={x + 6} y={y + 3} fontSize="7" fill={isHighlighted ? "#5c4033" : "#8b6f5e"} fontWeight={isHighlighted ? "bold" : "normal"}>
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function BibleMaps({ book }) {
  const [expanded, setExpanded] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const locations = getBookLocations(book);

  if (!locations) return null;

  return (
    <div className="mx-4 mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Maps & Places
          <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">{locations.places.length}</span>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark overflow-hidden">
          {/* Region */}
          <div className="px-4 py-2 border-b border-cream-dark bg-cream/50">
            <p className="text-[10px] text-gold font-semibold uppercase tracking-wider">{locations.region}</p>
          </div>

          {/* Interactive map */}
          <div className="p-3">
            <SimpleMap places={locations.places} highlighted={highlighted} />
          </div>

          {/* Place list */}
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {locations.places.map((place, i) => {
                const coords = PLACE_COORDS[place];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHighlighted(highlighted === place ? null : place)}
                    className={`text-xs px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                      highlighted === place
                        ? "bg-gold text-white"
                        : "bg-cream hover:bg-cream-dark text-warm-brown"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {place}
                  </button>
                );
              })}
            </div>
            {/* Show note when place is highlighted */}
            {highlighted && PLACE_COORDS[highlighted]?.note && (
              <div className="mt-2 bg-cream rounded-lg p-2.5">
                <p className="text-xs font-medium text-warm-brown">{highlighted}</p>
                <p className="text-[10px] text-warm-brown-light">{PLACE_COORDS[highlighted].note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
