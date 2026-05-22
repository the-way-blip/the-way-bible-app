import { useState } from "react";

/**
 * Embedded video teachings for a chapter.
 * Uses YouTube's embed search player (listType=search&list=...) so we don't need
 * an API key. Each section lazy-loads its iframe only when the user expands it,
 * keeping initial page weight low.
 */

const SECTIONS = [
  {
    key: "overview",
    title: "Book Overview",
    subtitle: "The Bible Project — themes & structure",
    accent: "text-red-500",
    bg: "bg-red-100",
    icon: "tv",
    query: (book) => `${book} Bible Project overview`,
  },
  {
    key: "chapter",
    title: "Chapter Teachings",
    subtitle: "Sermons, lessons, and commentary",
    accent: "text-amber-600",
    bg: "bg-amber-100",
    icon: "search",
    query: (book, chapter) => `${book} ${chapter} Bible study`,
  },
  {
    key: "verse",
    title: "Verse by Verse",
    subtitle: "In-depth chapter walkthrough",
    accent: "text-blue-600",
    bg: "bg-blue-100",
    icon: "vxv",
    query: (book, chapter) => `${book} chapter ${chapter} verse by verse`,
  },
];

function SectionIcon({ name, className }) {
  if (name === "tv") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );
  }
  return <span className={`text-[10px] font-bold ${className}`}>V×V</span>;
}

function VideoEmbed({ query }) {
  // YouTube's embed search player — shows a small playlist of matching videos
  const src = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&rel=0&modestbranding=1`;
  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={src}
        title={`Videos: ${query}`}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

export default function YouTubeLinks({ book, chapter }) {
  const [expanded, setExpanded] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          Video Teachings
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-cream-dark p-3 space-y-3">
          {SECTIONS.map((section) => {
            const isOpen = openSection === section.key;
            const query = section.query(book, chapter);
            return (
              <div key={section.key} className="bg-cream rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : section.key)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-cream-dark/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className={`w-9 h-9 ${section.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <SectionIcon name={section.icon} className={`w-4 h-4 ${section.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-warm-brown">
                      {section.key === "overview" ? `${section.title}: ${book}` : section.key === "chapter" ? `${book} ${chapter} — ${section.title}` : section.title}
                    </p>
                    <p className="text-[10px] text-warm-brown-light">{section.subtitle}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light/60 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="p-3 pt-0">
                    <VideoEmbed query={query} />
                    <p className="text-[10px] text-warm-brown-light/60 mt-2 text-center">
                      Powered by YouTube. <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="underline hover:text-gold"
                      >Open on YouTube</a>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
