import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import useT from "../../hooks/useT";
import { getDatasetMeta } from "../../services/biblePlaces";

const PlaceMap = lazy(() => import("./PlaceMap"));

/**
 * The atlas panel: a 3D terrain map of one biblical place, why the place
 * matters, where it's named in the current chapter, and the other places the
 * chapter travels through.
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
  const [meta] = useState(() => getDatasetMeta());

  // Esc to close, and move focus into the panel when it opens.
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

  // Scroll back to the top whenever a different place is selected.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [place?.id]);

  const others = useMemo(
    () => places.filter((candidate) => candidate.id !== place?.id),
    [places, place?.id]
  );

  if (!place) return null;

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
          md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[440px]
          md:rounded-none md:rounded-l-3xl
        "
      >
        {/* Drag affordance (mobile) */}
        <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/50 z-20" />

        {/* ── Map hero ── */}
        <div className="relative shrink-0 h-[38svh] min-h-[220px] md:h-[300px] bg-[#0f1720]">
          <Suspense fallback={<MapSkeleton />}>
            <PlaceMap place={place} nearby={places} onSelectNearby={onSelectPlace} />
          </Suspense>

          {/* Gradient scrim so the overlaid controls stay legible on any imagery */}
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

          <p className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 pointer-events-none">
            {t("atlas.title", "Biblical Atlas")}
          </p>
        </div>

        {/* ── Details ── */}
        <div ref={panelRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <header className="px-5 pt-5 pb-4 border-b border-cream-dark">
            <h2 className="font-serif text-[26px] leading-tight text-warm-brown">
              {place.name}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {place.modern && <Tag tone="gold">{t("atlas.today", "Today")}: {place.modern}</Tag>}
              {place.parent && !place.modern && <Tag>{t("atlas.near", "Near")} {place.parent}</Tag>}
              {place.precision !== "exact" && (
                <Tag tone="muted">
                  {place.precision === "approx" && t("atlas.approx", "Approximate site")}
                  {place.precision === "within" && t("atlas.within", "Within the city")}
                  {place.precision === "region" && t("atlas.region", "Region")}
                </Tag>
              )}
              <Tag tone="muted">
                {place.mentionCount} {place.mentionCount === 1
                  ? t("atlas.mention", "mention")
                  : t("atlas.mentions", "mentions")}
              </Tag>
            </div>
          </header>

          {/* Why it matters */}
          <div className="px-5 py-5">
            <SectionLabel>{t("atlas.whyItMatters", "Why this place matters")}</SectionLabel>
            <div className="mt-2.5 relative pl-4">
              <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-gold/40" aria-hidden="true" />
              <p className="font-serif text-[15px] leading-[1.75] text-warm-brown">
                {place.note}
              </p>
            </div>
            {place.comment && !place.curated && (
              <p className="mt-2 pl-4 text-[11px] text-warm-brown-light/80 italic">{place.comment}</p>
            )}
          </div>

          {/* Where it's named in this chapter */}
          {place.verses.length > 0 && (
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
          {others.length > 0 && (
            <div className="px-5 pb-5">
              <SectionLabel>
                {t("atlas.alsoHere", "Also in this chapter")}
                <span className="ml-1.5 text-warm-brown-light/60 font-normal normal-case tracking-normal">
                  {others.length}
                </span>
              </SectionLabel>
              <ul className="mt-2.5 space-y-1">
                {others.map((other) => (
                  <li key={other.id}>
                    <button
                      type="button"
                      onClick={() => onSelectPlace(other)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-cream-dark text-left hover:border-gold/50 transition-colors group"
                    >
                      <span className="shrink-0 w-7 h-7 rounded-full bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-warm-brown truncate">
                          {other.name}
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
                ))}
              </ul>
            </div>
          )}

          {/* Attribution — required by the dataset's CC BY licence */}
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
              ({meta?.license || "CC BY 4.0"}) · {t("atlas.imagery", "satellite imagery")} © Mapbox © Maxar
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
