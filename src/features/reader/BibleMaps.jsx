import { useState } from "react";
import { getBookLocations, getMapUrl, getPlaceSearchUrl } from "../../data/bibleMaps";

export default function BibleMaps({ book }) {
  const [expanded, setExpanded] = useState(false);
  const locations = getBookLocations(book);

  if (!locations) return null;

  const mapUrl = getMapUrl(book);

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Maps & Places
          <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">
            {locations.places.length}
          </span>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark overflow-hidden">
          {/* Region header */}
          <div className="px-4 py-3 border-b border-cream-dark">
            <p className="text-xs font-semibold text-gold uppercase tracking-wider">{locations.region}</p>
          </div>

          {/* Places grid */}
          <div className="p-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {locations.places.map((place, i) => (
                <a
                  key={i}
                  href={getPlaceSearchUrl(place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-cream hover:bg-cream-dark px-3 py-1.5 rounded-full text-warm-brown transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-gold">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {place}
                </a>
              ))}
            </div>

            {/* Map link */}
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-cream rounded-lg p-3 hover:bg-cream-dark transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-600">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-warm-brown">View Historical Map</p>
                <p className="text-[10px] text-warm-brown-light">Bible History atlas for {book}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light/50 ml-auto">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
