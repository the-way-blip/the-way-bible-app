import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useT from "../hooks/useT";
import { enterFullscreen, exitFullscreen, fullscreenElement } from "../utils/fullscreen";
import { slideIndexForVerse } from "../utils/presentSlides";

/**
 * Present mode: one slide at a time, full screen, for projecting hymns and
 * passages on a church screen. Slides come from src/utils/presentSlides.js.
 *
 * Controls: right half / → / Space / PageDown = next; left half / ← / PageUp =
 * previous; Home / End; Esc or ✕ = exit; B toggles a black screen; swipe on
 * touch. The counter and label fade after 2s without input.
 *
 * Fullscreen is requested where the browser allows it (call enterFullscreen()
 * in the opening click handler too). On iPhone Safari / WKWebView it is simply
 * a fixed overlay covering the viewport. Nothing is stored, nothing fetched.
 *
 * density (optional): { value, options: [1, 2, 3], onChange, label } shows a
 * small "per slide" switch, used by passages.
 */
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const IDLE_MS = 2000;
const MIN_FONT = 10;

export default function PresentMode({ slides, startIndex = 0, onClose, title, density }) {
  const t = useT();
  const rootRef = useRef(null);
  const boxRef = useRef(null);
  const fitRef = useRef(null);
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, slides.length - 1)));
  const [blackout, setBlackout] = useState(false);
  const [chrome, setChrome] = useState(true);
  const idleTimer = useRef(null);
  const touch = useRef(null);
  const lastSwipe = useRef(0);
  const prevSlides = useRef(slides);

  const total = slides.length;
  const slide = slides[Math.min(index, total - 1)] || null;

  // When the slide list is rebuilt (e.g. verses per slide changed), stay on
  // the same verse instead of jumping.
  useEffect(() => {
    if (prevSlides.current === slides) return;
    const old = prevSlides.current[index];
    prevSlides.current = slides;
    setIndex(old?.anchor != null ? slideIndexForVerse(slides, old.anchor) : Math.min(index, slides.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const wake = useCallback(() => {
    setChrome(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setChrome(false), IDLE_MS);
  }, []);

  const go = useCallback((delta) => {
    wake();
    if (blackout) { setBlackout(false); return; } // first press only lifts the black screen
    setIndex((i) => Math.min(Math.max(0, i + delta), total - 1));
  }, [blackout, total, wake]);

  const close = useCallback(() => { onClose?.(); }, [onClose]);

  // Open: fullscreen, lock page scroll, move focus in; restore all on close.
  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus({ preventScroll: true });
    enterFullscreen();
    wake();
    return () => {
      clearTimeout(idleTimer.current);
      document.body.style.overflow = overflow;
      exitFullscreen();
      if (opener && typeof opener.focus === "function") opener.focus({ preventScroll: true });
    };
  }, [wake]);

  // Leaving fullscreen with the browser's own Esc ends the presentation too.
  useEffect(() => {
    let wasFull = !!fullscreenElement();
    const onChange = () => {
      if (fullscreenElement()) wasFull = true;
      else if (wasFull) close();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [close]);

  // Keyboard (works with presentation clickers, which send PageUp/PageDown).
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.stopPropagation(); // the page underneath (reader shortcuts etc.) must not react
      const onButton = e.target instanceof Element && e.target.closest("button");
      const k = e.key;
      if (k === "Tab") {
        const els = [...(rootRef.current?.querySelectorAll(FOCUSABLE) || [])];
        wake();
        if (!els.length) { e.preventDefault(); return; }
        const first = els[0], last = els[els.length - 1];
        const at = document.activeElement;
        if (e.shiftKey && (at === first || !rootRef.current.contains(at) || at === rootRef.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (at === last || !rootRef.current.contains(at))) { e.preventDefault(); first.focus(); }
        return;
      }
      if ((k === " " || k === "Enter") && onButton) return; // let the focused button act
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " ") { e.preventDefault(); go(1); }
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { e.preventDefault(); go(-1); }
      else if (k === "Home") { e.preventDefault(); wake(); setBlackout(false); setIndex(0); }
      else if (k === "End") { e.preventDefault(); wake(); setBlackout(false); setIndex(total - 1); }
      else if (k === "Escape") { e.preventDefault(); close(); }
      else if (k === "b" || k === "B" || k === ".") { e.preventDefault(); setBlackout((b) => !b); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, close, total, wake]);

  // Fit text: start from the CSS clamp() ceiling, then binary-search the
  // largest font size at which the slide's content fits the box (no scroll).
  useLayoutEffect(() => {
    const box = boxRef.current, el = fitRef.current;
    if (!box || !el) return undefined;
    let frame = 0;
    const fits = () => el.scrollHeight <= box.clientHeight + 1 && el.scrollWidth <= box.clientWidth + 1;
    const largest = (ceiling) => {
      el.style.fontSize = `${ceiling}px`;
      if (fits()) return ceiling;
      let lo = MIN_FONT, hi = ceiling;
      for (let i = 0; i < 12 && hi - lo > 0.5; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (fits()) lo = mid; else hi = mid;
      }
      return Math.floor(lo);
    };
    const fit = () => {
      el.style.fontSize = "";
      el.classList.remove("is-nowrap");
      const ceiling = parseFloat(getComputedStyle(el).fontSize) || 48;
      const wrapped = largest(ceiling);
      // Hymn lines read best unbroken, one printed line per row. Keep them
      // whole when that costs little size; otherwise let them wrap.
      if (el.dataset.lines === "verse") {
        el.classList.add("is-nowrap");
        const whole = largest(ceiling);
        if (whole >= wrapped * 0.72) { el.style.fontSize = `${whole}px`; return; }
        el.classList.remove("is-nowrap");
      }
      el.style.fontSize = `${wrapped}px`;
    };
    fit();
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); })
      : null;
    ro?.observe(box);
    let live = true;
    document.fonts?.ready?.then(() => { if (live) fit(); });
    return () => { live = false; ro?.disconnect(); cancelAnimationFrame(frame); };
  }, [slide]);

  const onClick = (e) => {
    if (e.target instanceof Element && e.target.closest("button")) return;
    if (Date.now() - lastSwipe.current < 500) return;
    const rect = rootRef.current.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
  };
  const onTouchStart = (e) => {
    const p = e.touches[0];
    touch.current = p ? { x: p.clientX, y: p.clientY } : null;
  };
  const onTouchEnd = (e) => {
    const s = touch.current, p = e.changedTouches[0];
    touch.current = null;
    if (!s || !p) return;
    const dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      lastSwipe.current = Date.now();
      go(dx < 0 ? 1 : -1);
    }
  };

  if (!slide) return null;
  const counter = `${index + 1} / ${total}`;
  const announce = `${t("present.slide", "Slide")} ${index + 1} ${t("present.of", "of")} ${total}${slide.label ? `, ${slide.label}` : ""}`;
  const chromeClass = `present-chrome ${chrome && !blackout ? "opacity-100" : "opacity-0 pointer-events-none focus-within:opacity-100 focus-within:pointer-events-auto"}`;

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${t("present.dialog", "Presentation")}: ${title}` : t("present.dialog", "Presentation")}
      tabIndex={-1}
      className={`present-stage fixed inset-0 z-[1000] overflow-hidden ${chrome ? "" : "cursor-none"}`}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onPointerMove={wake}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {blackout ? t("present.blackedOut", "Screen blacked out. Press B to show it again.") : announce}
      </p>

      {/* Stage */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          paddingTop: "max(7vh, calc(env(safe-area-inset-top) + 48px))",
          paddingBottom: "max(7vh, calc(env(safe-area-inset-bottom) + 48px))",
          paddingLeft: "max(6vw, calc(env(safe-area-inset-left) + 16px))",
          paddingRight: "max(6vw, calc(env(safe-area-inset-right) + 16px))",
        }}
        aria-hidden={blackout || undefined}
      >
        <div ref={boxRef} className="flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
          <div key={`${index}-${total}`} ref={fitRef} data-lines={slide.kind === "text" && !slide.prose ? "verse" : undefined} className={`present-fit present-slide-in text-center ${slide.kind === "title" ? "is-title" : ""}`}>
            {slide.kind === "title" ? (
              <>
                <h2 className="present-line font-bold">{slide.title}</h2>
                {slide.subtitle && <p className="present-line mt-[0.7em] text-[0.4em] tracking-wide" style={{ color: "#c9a84c" }}>{slide.subtitle}</p>}
              </>
            ) : (
              <div className={slide.italic ? "italic" : undefined}>
                {(slide.lines || []).map((l, i) => (
                  <p key={i} className={`${slide.prose ? "present-prose" : "present-line"} ${i ? (slide.prose ? "mt-[0.45em]" : "mt-[0.12em]") : ""}`}>
                    {typeof l === "string" ? l : (
                      <>
                        {l.sup != null && <sup className="text-[0.5em] mr-[0.25em] align-super" style={{ color: "#c9a84c" }}>{l.sup}</sup>}
                        {l.text}
                      </>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        {slide.caption && <p className="present-caption text-center mt-[2.5vh] shrink-0">{slide.caption}</p>}
      </div>

      {/* Black-out screen */}
      {blackout && <div className="absolute inset-0 bg-black" aria-hidden="true" />}

      {/* Top chrome: label, verses-per-slide (passages), exit */}
      <div className={`absolute top-0 inset-x-0 flex items-center justify-between gap-3 ${chromeClass}`}
        style={{ padding: "max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 0 max(12px, env(safe-area-inset-left))" }}>
        <p className="text-[13px] tracking-wide truncate min-w-0" aria-hidden="true">{slide.label}</p>
        <div className="flex items-center gap-2 shrink-0">
          {density && (
            <div role="group" aria-label={density.label} className="flex items-center gap-1">
              <span className="text-[12px] mr-1 hidden sm:inline" aria-hidden="true">{density.label}</span>
              {density.options.map((n) => (
                <button key={n} type="button" className="present-btn" style={{ padding: 0 }} aria-pressed={density.value === n}
                  onClick={() => { wake(); density.onChange(n); }}>{n}</button>
              ))}
            </div>
          )}
          <button type="button" className="present-btn" onClick={close} aria-label={t("present.exit", "Exit presentation")}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom chrome: prev / counter / next, black-out */}
      <div className={`absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 ${chromeClass}`}
        style={{ padding: "0 max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))" }}>
        <div className="flex items-center gap-2">
          <button type="button" className="present-btn" onClick={() => go(-1)} disabled={index === 0 && !blackout} aria-label={t("present.prev", "Previous slide")}>‹</button>
          <span className="text-[13px] tabular-nums min-w-[3.5em] text-center" aria-hidden="true">{counter}</span>
          <button type="button" className="present-btn" onClick={() => go(1)} disabled={index === total - 1 && !blackout} aria-label={t("present.next", "Next slide")}>›</button>
        </div>
        <button type="button" className="present-btn" aria-pressed={blackout}
          onClick={() => { wake(); setBlackout((b) => !b); }}
          title={t("present.blackoutHint", "Black screen (B)")}>
          {t("present.blackout", "Black screen")}
        </button>
      </div>
    </div>,
    document.body
  );
}
