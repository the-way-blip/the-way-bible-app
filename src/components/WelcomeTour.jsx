import { useState, useRef, useEffect } from "react";

const slides = [
  {
    title: "Read the Word",
    description:
      "A clean, distraction-free reading experience. Immerse yourself in Scripture with a beautiful interface designed for focus and reverence.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        {/* Open book */}
        <path
          d="M60 30C60 30 45 22 25 22C18 22 12 24 12 24V90C12 90 18 88 25 88C45 88 60 96 60 96C60 96 75 88 95 88C102 88 108 90 108 90V24C108 24 102 22 95 22C75 22 60 30 60 30Z"
          fill="#faf7f2"
          stroke="#c9a84c"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="60" y1="30" x2="60" y2="96" stroke="#c9a84c" strokeWidth="2" strokeDasharray="4 3" />
        {/* Text lines left page */}
        <line x1="24" y1="40" x2="50" y2="40" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="24" y1="48" x2="48" y2="48" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="24" y1="56" x2="52" y2="56" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="24" y1="64" x2="46" y2="64" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="24" y1="72" x2="50" y2="72" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        {/* Text lines right page */}
        <line x1="70" y1="40" x2="96" y2="40" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="70" y1="48" x2="94" y2="48" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="70" y1="56" x2="98" y2="56" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="70" y1="64" x2="92" y2="64" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="70" y1="72" x2="96" y2="72" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        {/* Subtle glow */}
        <circle cx="60" cy="60" r="50" fill="url(#bookGlow)" opacity="0.15" />
        <defs>
          <radialGradient id="bookGlow"><stop stopColor="#c9a84c" /><stop offset="1" stopColor="transparent" /></radialGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: "Study Deeper",
    description:
      "Tap any word to explore Strong's concordance, original Greek and Hebrew definitions, and cross-references that illuminate the text.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        {/* Magnifying glass */}
        <circle cx="52" cy="52" r="28" stroke="#c9a84c" strokeWidth="3" fill="#faf7f2" />
        <line x1="72" y1="72" x2="100" y2="100" stroke="#c9a84c" strokeWidth="4" strokeLinecap="round" />
        {/* Hebrew-like characters inside lens */}
        <text x="38" y="48" fontFamily="serif" fontSize="14" fill="#5c4033" opacity="0.7">ab</text>
        <text x="38" y="64" fontFamily="serif" fontSize="11" fill="#8b6f5e" opacity="0.5">Strongs</text>
        {/* Small sparkle */}
        <path d="M88 20L90 26L96 28L90 30L88 36L86 30L80 28L86 26Z" fill="#c9a84c" opacity="0.6" />
        <path d="M28 90L29.5 94L33.5 95.5L29.5 97L28 101L26.5 97L22.5 95.5L26.5 94Z" fill="#c9a84c" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: "Memorize Scripture",
    description:
      "Build a lasting treasure of God's Word with flashcards powered by spaced repetition. Track your progress and review at the perfect time.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        {/* Stacked cards */}
        <rect x="22" y="32" width="64" height="44" rx="6" fill="#f0ebe3" stroke="#8b6f5e" strokeWidth="1.5" transform="rotate(-4 22 32)" />
        <rect x="26" y="28" width="64" height="44" rx="6" fill="#faf7f2" stroke="#8b6f5e" strokeWidth="1.5" transform="rotate(-1 26 28)" />
        <rect x="30" y="24" width="64" height="44" rx="6" fill="white" stroke="#c9a84c" strokeWidth="2" />
        {/* Text on top card */}
        <line x1="40" y1="38" x2="82" y2="38" stroke="#5c4033" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="40" y1="46" x2="78" y2="46" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="40" y1="54" x2="74" y2="54" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        {/* Brain / refresh icon */}
        <path d="M76 78C76 78 84 82 88 78C92 74 88 68 84 68C80 68 78 72 82 74" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M92 76L88 78L90 82" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Small check marks */}
        <path d="M20 82L24 86L30 78" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 92L24 96L30 88" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: "Track Your Journey",
    description:
      "Highlight verses, write notes, and keep a journal of what God is teaching you. Watch your reading streaks and progress grow over time.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        {/* Journal / notebook */}
        <rect x="30" y="16" width="60" height="78" rx="4" fill="#faf7f2" stroke="#c9a84c" strokeWidth="2" />
        <rect x="30" y="16" width="10" height="78" rx="2" fill="#c9a84c" opacity="0.2" />
        {/* Lines inside */}
        <line x1="46" y1="32" x2="80" y2="32" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="46" y1="42" x2="78" y2="42" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="46" y1="52" x2="76" y2="52" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        {/* Highlight bar */}
        <rect x="46" y="59" width="30" height="8" rx="2" fill="#fff3b0" opacity="0.7" />
        <line x1="46" y1="63" x2="76" y2="63" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="46" y1="72" x2="72" y2="72" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        {/* Pencil */}
        <g transform="translate(74, 74) rotate(-45)">
          <rect x="0" y="0" width="6" height="30" rx="1" fill="#c9a84c" />
          <polygon points="0,30 3,38 6,30" fill="#5c4033" />
          <rect x="0" y="0" width="6" height="4" rx="1" fill="#e8d48b" />
        </g>
        {/* Small star */}
        <path d="M86 20L88 26L94 26L89 30L91 36L86 32L81 36L83 30L78 26L84 26Z" fill="#c9a84c" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Begin Your Journey",
    description:
      "Your path through Scripture starts here. Read at your own pace, study with powerful tools, and let the Word dwell in you richly.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
        {/* Sunrise / path */}
        <path d="M10 90C10 90 30 60 60 60C90 60 110 90 110 90" stroke="#c9a84c" strokeWidth="2" fill="none" />
        {/* Sun */}
        <circle cx="60" cy="50" r="16" fill="#c9a84c" opacity="0.2" />
        <circle cx="60" cy="50" r="10" fill="#c9a84c" opacity="0.4" />
        <circle cx="60" cy="50" r="5" fill="#c9a84c" />
        {/* Rays */}
        <line x1="60" y1="28" x2="60" y2="22" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
        <line x1="74" y1="36" x2="78" y2="32" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
        <line x1="46" y1="36" x2="42" y2="32" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
        <line x1="80" y1="50" x2="86" y2="50" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="50" x2="34" y2="50" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
        {/* Ground */}
        <line x1="10" y1="90" x2="110" y2="90" stroke="#8b6f5e" strokeWidth="2" strokeLinecap="round" />
        {/* Cross on horizon */}
        <line x1="60" y1="70" x2="60" y2="88" stroke="#5c4033" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="53" y1="76" x2="67" y2="76" stroke="#5c4033" strokeWidth="2.5" strokeLinecap="round" />
        {/* Small birds */}
        <path d="M30 35C32 33 34 35 36 33" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
        <path d="M82 28C84 26 86 28 88 26" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      </svg>
    ),
    isFinal: true,
  },
];

export default function WelcomeTour({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 left, 1 right
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(null);
  const containerRef = useRef(null);

  const goTo = (index) => {
    if (isAnimating || index === current) return;
    setDirection(index > current ? 1 : -1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setIsAnimating(false);
    }, 300);
  };

  const next = () => {
    if (current < slides.length - 1) goTo(current + 1);
  };

  const prev = () => {
    if (current > 0) goTo(current - 1);
  };

  const dismiss = () => {
    localStorage.setItem("hasSeenTour", "true");
    onComplete();
  };

  // Swipe handling
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < slides.length - 1) next();
      else if (diff < 0 && current > 0) prev();
    }
    touchStartX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current]);

  const slide = slides[current];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: "var(--color-cream)", height: "100svh", width: "100vw" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {/* Skip button */}
      {!slide.isFinal && (
        <div className="flex justify-end p-4">
          <button
            onClick={dismiss}
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{ color: "var(--color-warm-brown-light)" }}
          >
            Skip
          </button>
        </div>
      )}
      {slide.isFinal && <div className="p-4 h-10" />}

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <div
          className="flex flex-col items-center text-center max-w-sm transition-all duration-300 ease-out"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating
              ? `translateX(${direction * -60}px)`
              : "translateX(0)",
          }}
        >
          {/* Icon */}
          <div className="mb-8">{slide.icon}</div>

          {/* Title */}
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: "var(--color-warm-brown)" }}
          >
            {slide.title}
          </h2>

          {/* Description */}
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-warm-brown-light)" }}
          >
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pb-10 px-8">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                backgroundColor:
                  i === current
                    ? "var(--color-gold)"
                    : "var(--color-cream-dark)",
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          {/* Back arrow */}
          <button
            onClick={prev}
            disabled={current === 0}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              opacity: current === 0 ? 0.3 : 1,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              style={{ color: "var(--color-warm-brown)" }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* CTA / Next button */}
          {slide.isFinal ? (
            <button
              onClick={dismiss}
              className="flex-1 py-3.5 rounded-2xl text-white font-semibold text-base transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--color-gold)" }}
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={next}
              className="flex-1 py-3.5 rounded-2xl text-white font-semibold text-base transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--color-gold)" }}
            >
              Next
            </button>
          )}

          {/* Forward arrow */}
          <button
            onClick={next}
            disabled={current === slides.length - 1}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              opacity: current === slides.length - 1 ? 0.3 : 1,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              style={{ color: "var(--color-warm-brown)" }}
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
