import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useT from "../../hooks/useT";
import useAtlasTour from "../../hooks/useAtlasTour";
import { getDatasetMeta } from "../../services/biblePlaces";
import { resolveJourney } from "../../services/atlasLayers";
import { ERA_BY_ID, resolveEra } from "../../data/biblicalEras";
import { eraNameFor } from "../../data/placeEraNames";
import { kindsAvailableForEra, territoriesForEra, territoryContaining } from "../../data/historicalGeography";
import { journeysForChapter } from "../../data/biblicalJourneys";
import { LayerToggles, TimelineScrubber, TourPlayer, TourLaunchers } from "./AtlasControls";

const PlaceMap = lazy(() => import("./PlaceMap"));

/**
 * The atlas panel.
 *
 * Shows one place on 3D terrain, in the world of its own period: the
 * territories that existed then, the name the place went by at the time, a
 * colour grade for the era, and — where the passage traces one — a journey
 * you can play across the map.
 *
 * Bottom sheet on phones, right-docked drawer on desktop.
 */
export default function PlaceExplorer({
  place,
  places,
  book,
  chapter,
  onSelectPlace,
  onGoToVerse,
  onClose,
}) {
  const t = useT();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const mapRef = useRef(null);
  const [meta] = useState(() => getDatasetMeta());

  // ── Era ──────────────────────────────────────────────────────────────────
  const passageEra = useMemo(() => resolveEra(book, chapter), [book, chapter]);
  // The scrubber can move the map away from the passage's own period.
  // Snapping back when the passage changes is done during render rather than
  // in an effect, so the map never paints one frame with the old era.
  const [viewEraId, setViewEraId] = useState(passageEra.id);
  const [renderedEraId, setRenderedEraId] = useState(passageEra.id);
  if (passageEra.id !== renderedEraId) {
    setRenderedEraId(passageEra.id);
    setViewEraId(passageEra.id);
  }
  const era = ERA_BY_ID[viewEraId] || passageEra;

  // ── Historical layers ────────────────────────────────────────────────────
  const availableKinds = useMemo(() => kindsAvailableForEra(era.id), [era.id]);
  const [enabledKinds, setEnabledKinds] = useState(() => new Set(["tribe", "kingdom", "province"]));
  const territories = useMemo(
    () => territoriesForEra(era.id, enabledKinds),
    [era.id, enabledKinds]
  );
  const toggleKind = useCallback((kind) => {
    setEnabledKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  // ── Tours ────────────────────────────────────────────────────────────────
  const journeys = useMemo(() => journeysForChapter(book, chapter), [book, chapter]);
  const [tourSource, setTourSource] = useState(null);

  const tourStops = useMemo(() => {
    if (!tourSource) return null;
    if (tourSource.kind === "journey") return resolveJourney(tourSource.journey);
    // Story mode: the chapter's places, in the order the text names them
    return [...places]
      .filter((p) => p.verses.length > 0)
      .sort((a, b) => a.verses[0] - b.verses[0])
      .map((p, index) => ({
        index,
        id: `story-${p.id}`,
        place: p,
        name: p.name,
        verse: `${book} ${chapter}:${p.verses[0]}`,
        note: p.note,
        lon: p.lon,
        lat: p.lat,
      }));
  }, [tourSource, places, book, chapter]);

  const [routeProgress, setRouteProgress] = useState(0);
  const tour = useAtlasTour({ stops: tourStops, mapRef, onProgress: setRouteProgress });

  // A loaded tour shows its player straight away, sitting on stop 1, so the
  // route is framed and readable before you press play. `tour.active` only
  // tracks whether playback has begun, which is a different question.
  const inTour = Boolean(tourStops?.length);

  const startJourney = useCallback((journey) => {
    setTourSource({ kind: "journey", journey });
  }, []);
  const startStory = useCallback(() => setTourSource({ kind: "story" }), []);
  const exitTour = useCallback(() => { tour.exit(); setTourSource(null); }, [tour]);

  // Frame the whole route as soon as a tour is loaded but not yet playing, so
  // you see the shape of the journey before stepping into it. Derived rather
  // than stored — the memo keeps a stable identity, which is what stops the
  // map's camera effect from re-firing on every render.
  const cameraTarget = useMemo(
    () => (tourStops?.length >= 2 && !tour.active ? { kind: "fit", stops: tourStops } : null),
    [tourStops, tour.active]
  );

  const handleMapReady = useCallback((map) => { mapRef.current = map; }, []);

  // ── Panel behaviour ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [place?.id]);

  const others = useMemo(
    () => places.filter((candidate) => candidate.id !== place?.id),
    [places, place?.id]
  );

  // Which territory the place sat in during this era. At reading zoom you are
  // usually inside a single shape, so the fill alone tells you nothing —
  // naming it is what actually answers "whose land was this at the time".
  const territory = useMemo(
    () => (place ? territoryContaining(place.lon, place.lat, era.id, enabledKinds) : null),
    [place, era.id, enabledKinds]
  );

  // The place as it was known in the era being viewed
  const eraName = useMemo(
    () => (place ? eraNameFor(place.name, era.id) : null),
    [place, era.id]
  );

  // While a tour runs, the tour's current stop is the subject of the panel
  const subject = inTour && tour.stop ? tour.stop.place : place;
  const mapPlace = useMemo(
    () => (subject ? { ...subject, displayName: eraNameFor(subject.name, era.id)?.name || subject.name } : null),
    [subject, era.id]
  );

  if (!place || !mapPlace) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[55] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${place.name} — biblical atlas`}
        className="
          atlas-panel-enter fixed z-[60] bg-cream flex flex-col overflow-hidden shadow-2xl
          inset-x-0 bottom-0 h-[88svh] rounded-t-3xl
          md:inset-y-0 md:left-auto md:right-0 md:w-[440px]
          md:rounded-none md:rounded-l-3xl
        "
      >
        <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/50 z-20" />

        {/* ── Map hero ── */}
        <div className="relative shrink-0 h-[38svh] min-h-[220px] md:h-[300px] bg-[#0f1720]">
          <Suspense fallback={<MapSkeleton />}>
            <PlaceMap
              place={mapPlace}
              nearby={places}
              onSelectNearby={onSelectPlace}
              era={era}
              territories={territories}
              showTerritories={enabledKinds.size > 0}
              journeyStops={tourStops}
              journeyProgress={routeProgress}
              cameraTarget={tour.active ? null : cameraTarget}
              onReady={handleMapReady}
            />
          </Suspense>

          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm text-white/90 flex items-center justify-center hover:bg-black/65 transition-colors"
            aria-label={t("atlas.close", "Close atlas")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Era badge, over the imagery */}
          <div className="absolute top-3 right-1/2 translate-x-1/2 z-10 pointer-events-none text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
              {era.name}
            </p>
            <p className="text-[9px] font-mono text-white/50 mt-0.5">{era.range}</p>
          </div>
        </div>

        {/* ── Details ── */}
        <div ref={panelRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Tour player takes over the top of the panel while running */}
          {inTour && (
            <div className="px-4 pt-4">
              <TourPlayer
                title={tourSource?.kind === "journey" ? tourSource.journey.title : `${book} ${chapter}`}
                subtitle={
                  tourSource?.kind === "journey"
                    ? tourSource.journey.summary
                    : "Walking the chapter's places in order"
                }
                tour={tour}
                accent={era.visual.accent}
                onExit={exitTour}
              />
            </div>
          )}

          <header className="px-5 pt-5 pb-4 border-b border-cream-dark">
            <h2 className="font-serif text-[26px] leading-tight text-warm-brown">
              {eraName?.name || subject.name}
            </h2>
            {eraName && (
              <p className="mt-1 text-[11px] text-warm-brown-light">
                Later called <span className="font-medium text-warm-brown">{subject.name}</span>
                {eraName.note ? ` — ${eraName.note}` : ""}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {subject.modern && <Tag tone="gold">{t("atlas.today", "Today")}: {subject.modern}</Tag>}
              {subject.parent && !subject.modern && <Tag>{t("atlas.near", "Near")} {subject.parent}</Tag>}
              {subject.precision !== "exact" && (
                <Tag tone="muted">
                  {subject.precision === "approx" && t("atlas.approx", "Approximate site")}
                  {subject.precision === "within" && t("atlas.within", "Within the city")}
                  {subject.precision === "region" && t("atlas.region", "Region")}
                </Tag>
              )}
              <Tag tone="muted">
                {subject.mentionCount} {subject.mentionCount === 1
                  ? t("atlas.mention", "mention")
                  : t("atlas.mentions", "mentions")}
              </Tag>
            </div>

            {territory && (
              <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-warm-brown-light">
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: territory.color }}
                  aria-hidden="true"
                />
                {/* The era is already named over the map, so this only has to
                    answer "whose land" — keeping it to one short clause. */}
                Then part of{" "}
                <span className="font-medium text-warm-brown">{territory.name}</span>
                {territory.subtitle ? ` — ${territory.subtitle}` : ""}
              </p>
            )}
          </header>

          {/* Why it matters */}
          <div className="px-5 py-5">
            <SectionLabel>{t("atlas.whyItMatters", "Why this place matters")}</SectionLabel>
            <div className="mt-2.5 relative pl-4">
              <span
                className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                style={{ backgroundColor: era.visual.accent, opacity: 0.5 }}
                aria-hidden="true"
              />
              <p className="font-serif text-[15px] leading-[1.75] text-warm-brown">
                {subject.note}
              </p>
            </div>
            {subject.comment && !subject.curated && (
              <p className="mt-2 pl-4 text-[11px] text-warm-brown-light/80 italic">{subject.comment}</p>
            )}
          </div>

          {/* Journeys / story mode */}
          {!inTour && (
            <div className="px-5 pb-5">
              <SectionLabel>Explore</SectionLabel>
              <div className="mt-2.5">
                <TourLaunchers
                  journeys={journeys}
                  onStartJourney={startJourney}
                  onStartStory={startStory}
                  storyCount={places.filter((p) => p.verses.length > 0).length}
                  accent={era.visual.accent}
                />
              </div>
            </div>
          )}

          {/* Historical layers */}
          {availableKinds.length > 0 && (
            <div className="px-5 pb-5">
              <SectionLabel>Historical layers</SectionLabel>
              <p className="mt-1 mb-2.5 text-[10px] leading-relaxed text-warm-brown-light/70">
                Approximate territories of the period — ancient borders were frontiers, not lines.
              </p>
              <LayerToggles
                kinds={availableKinds}
                enabled={enabledKinds}
                onToggle={toggleKind}
                accent={era.visual.accent}
              />
            </div>
          )}

          {/* Timeline */}
          <div className="px-5 pb-5">
            <TimelineScrubber
              activeEraId={era.id}
              passageEraId={passageEra.id}
              onSelectEra={setViewEraId}
              onReset={() => setViewEraId(passageEra.id)}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-warm-brown-light">
              {era.blurb}
            </p>
          </div>

          {/* Where it's named in this chapter */}
          {!inTour && place.verses.length > 0 && (
            <div className="px-5 pb-5">
              <SectionLabel>
                {t("atlas.inThisChapter", "Named in")} {book} {chapter}
              </SectionLabel>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {place.verses.map((verse) => (
                  <button
                    key={verse}
                    type="button"
                    onClick={() => onGoToVerse?.(verse)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-cream-dark text-xs font-medium text-warm-brown hover:border-gold/50 hover:text-gold transition-colors"
                  >
                    {t("atlas.verse", "v.")}{verse}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* The rest of the chapter's geography */}
          {!inTour && others.length > 0 && (
            <div className="px-5 pb-5">
              <SectionLabel>
                {t("atlas.alsoHere", "Also in this chapter")}
                <span className="ml-1.5 text-warm-brown-light/60 font-normal normal-case tracking-normal">
                  {others.length}
                </span>
              </SectionLabel>
              <ul className="mt-2.5 space-y-1">
                {others.map((other) => {
                  const otherEraName = eraNameFor(other.name, era.id);
                  return (
                    <li key={other.id}>
                      <button
                        type="button"
                        onClick={() => onSelectPlace(other)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-cream-dark text-left hover:border-gold/50 transition-colors group"
                      >
                        <span
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/95 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: era.visual.accent }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-warm-brown truncate">
                            {otherEraName?.name || other.name}
                          </span>
                          <span className="block text-[11px] text-warm-brown-light truncate">
                            {other.verses.length > 0
                              ? `${t("atlas.verse", "v.")}${other.verses.join(", ")}`
                              : other.modern || ""}
                          </span>
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-warm-brown-light/40 shrink-0">
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <footer className="px-5 py-4 border-t border-cream-dark">
            <p className="text-[10px] leading-relaxed text-warm-brown-light/70">
              {t("atlas.coordinates", "Coordinates from")}{" "}
              <a
                href={meta?.sourceUrl || "https://www.openbible.info/geo/"}
                target="_blank"
                rel="noreferrer noopener"
                className="text-gold hover:underline"
              >
                OpenBible.info
              </a>{" "}
              ({meta?.license || "CC BY 4.0"}) · {t("atlas.imagery", "satellite imagery")} © Mapbox © Maxar.
              Territories and dates are approximate.
            </p>
          </footer>
        </div>
      </section>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
      {children}
    </h3>
  );
}

function Tag({ children, tone = "default" }) {
  const tones = {
    gold: "bg-gold/10 text-gold",
    muted: "bg-cream-dark text-warm-brown-light",
    default: "bg-cream-dark text-warm-brown",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0f1720]">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
