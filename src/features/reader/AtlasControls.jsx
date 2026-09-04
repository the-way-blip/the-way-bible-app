import { ERAS, formatYear } from "../../data/biblicalEras";

/**
 * The atlas's chrome: which historical layers are drawn, where in biblical
 * history the map is set, and the player for a guided journey.
 *
 * These are presentational — all state lives in PlaceExplorer.
 */

// ─── Layer toggles ──────────────────────────────────────────────────────────

export function LayerToggles({ kinds, enabled, onToggle, accent }) {
  if (!kinds.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {kinds.map((kind) => {
        const on = enabled.has(kind.id);
        return (
          <button
            key={kind.id}
            type="button"
            onClick={() => onToggle(kind.id)}
            title={kind.hint}
            aria-pressed={on}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              on
                ? "text-white border-transparent"
                : "bg-transparent text-warm-brown-light border-cream-dark hover:border-gold/40"
            }`}
            style={on ? { backgroundColor: accent } : undefined}
          >
            {kind.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Timeline scrubber ──────────────────────────────────────────────────────

/**
 * A band of eras you can move through. Selecting one re-draws the map's
 * territories and re-grades it for that period, independently of the passage —
 * so you can read Genesis and still look at the world under Rome.
 */
export function TimelineScrubber({ activeEraId, passageEraId, onSelectEra, onReset }) {
  const activeIndex = ERAS.findIndex((era) => era.id === activeEraId);
  const drifted = activeEraId !== passageEraId;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
          Timeline
        </h3>
        {drifted && (
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] font-medium text-warm-brown-light hover:text-gold transition-colors"
          >
            Back to the passage
          </button>
        )}
      </div>

      {/* Era band — proportional widths would make the exile invisible, so
          every era gets equal room and the dates carry the real scale. */}
      <div
        className="flex rounded-lg overflow-hidden border border-cream-dark"
        role="group"
        aria-label="Biblical era"
      >
        {ERAS.map((era, i) => {
          const isActive = i === activeIndex;
          const isPassage = era.id === passageEraId;
          return (
            <button
              key={era.id}
              type="button"
              onClick={() => onSelectEra(era.id)}
              title={`${era.name} · ${era.range}`}
              aria-label={`${era.name}, ${era.range}`}
              aria-current={isActive ? "true" : undefined}
              className="group relative flex-1 h-8 transition-colors"
              style={{
                backgroundColor: isActive ? era.visual.accent : "transparent",
                opacity: isActive ? 1 : 0.55,
              }}
            >
              <span
                className="absolute inset-x-0 bottom-0 h-1 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: era.visual.accent, opacity: isActive ? 0 : 0.75 }}
              />
              {isPassage && !isActive && (
                <span
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-warm-brown-light"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-warm-brown-light/70">
        <span>{formatYear(ERAS[0].start)}</span>
        <span className="font-medium text-warm-brown">
          {ERAS[activeIndex]?.name} · {ERAS[activeIndex]?.range}
        </span>
        <span>{formatYear(ERAS[ERAS.length - 1].end)}</span>
      </div>
    </div>
  );
}

// ─── Tour player ────────────────────────────────────────────────────────────

export function TourPlayer({ title, subtitle, tour, accent, onExit }) {
  const { index, count, stop, playing, play, pause, next, prev, atEnd } = tour;
  if (!count) return null;

  return (
    <div className="rounded-2xl border border-cream-dark bg-white overflow-hidden">
      <div className="px-4 pt-3 pb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-warm-brown truncate">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-warm-brown-light truncate">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 text-[11px] text-warm-brown-light hover:text-gold transition-colors"
        >
          Done
        </button>
      </div>

      {/* Current stop */}
      {stop && (
        <div className="px-4 pb-3">
          <div className="flex items-baseline gap-2">
            <span
              className="shrink-0 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ backgroundColor: accent }}
            >
              {index + 1}
            </span>
            <span className="font-serif text-[17px] text-warm-brown leading-tight">
              {stop.name}
            </span>
            {stop.verse && (
              <span className="ml-auto text-[10px] font-medium text-gold shrink-0">
                {stop.verse}
              </span>
            )}
          </div>
          {stop.note && (
            <p className="mt-1.5 pl-7 text-[12px] leading-relaxed text-warm-brown-light">
              {stop.note}
            </p>
          )}
        </div>
      )}

      {/* Segmented progress — each stop is a tick you can jump to */}
      <div className="px-4 pb-2 flex gap-1">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tour.goTo(i)}
            aria-label={`Go to stop ${i + 1}`}
            className="flex-1 h-1 rounded-full transition-colors"
            style={{ backgroundColor: i <= index ? accent : "var(--color-cream-dark)" }}
          />
        ))}
      </div>

      <div className="px-3 pb-3 flex items-center gap-1">
        <PlayerButton onClick={prev} disabled={index === 0} label="Previous stop">
          <polyline points="15 18 9 12 15 6" />
        </PlayerButton>

        <button
          type="button"
          onClick={playing ? pause : play}
          className="flex-1 h-9 rounded-full text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          {playing ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M8 5v14l11-7z" />
              </svg>
              {atEnd ? "Replay" : "Play"}
            </>
          )}
        </button>

        <PlayerButton onClick={next} disabled={atEnd} label="Next stop">
          <polyline points="9 6 15 12 9 18" />
        </PlayerButton>
      </div>
    </div>
  );
}

function PlayerButton({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center text-warm-brown-light hover:text-gold disabled:opacity-30 disabled:hover:text-warm-brown-light transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        {children}
      </svg>
    </button>
  );
}

// ─── Tour launcher ──────────────────────────────────────────────────────────

export function TourLaunchers({ journeys, onStartJourney, onStartStory, storyCount, accent }) {
  const hasStory = storyCount >= 2;
  if (!journeys.length && !hasStory) return null;

  return (
    <div className="space-y-1.5">
      {journeys.map((journey) => (
        <button
          key={journey.id}
          type="button"
          onClick={() => onStartJourney(journey)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-cream-dark bg-white text-left hover:border-gold/50 transition-colors group"
        >
          <span
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: accent }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-warm-brown truncate">
              {journey.title}
            </span>
            <span className="block text-[11px] text-warm-brown-light truncate">
              {journey.waypoints.length} stops · {journey.summary}
            </span>
          </span>
        </button>
      ))}

      {hasStory && (
        <button
          type="button"
          onClick={onStartStory}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-cream-dark bg-white text-left hover:border-gold/50 transition-colors"
        >
          <span className="shrink-0 w-7 h-7 rounded-full bg-cream-dark text-warm-brown-light flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-warm-brown">Walk the chapter</span>
            <span className="block text-[11px] text-warm-brown-light">
              Visit all {storyCount} places in the order they're named
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
