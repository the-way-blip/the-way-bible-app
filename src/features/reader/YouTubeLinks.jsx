import { useState } from "react";
import { openUrl } from "../../utils/native";

/**
 * Video teachings section for each chapter.
 * YouTube deprecated the search embed (listType=search) — it no longer works
 * without an API key. Instead we show styled cards that open a YouTube search
 * in the device browser, giving users the real YouTube experience.
 */

const SECTIONS = [
  {
    key: "overview",
    title: "Book Overview",
    subtitle: "The Bible Project — themes & structure",
    accent: "text-red-500",
    accentBg: "bg-red-50",
    border: "border-red-100",
    icon: "tv",
    query: (book) => `${book} Bible Project overview`,
    channel: "thebibleproject",
  },
  {
    key: "chapter",
    title: "Chapter Teaching",
    subtitle: "Sermons, lessons, and expository commentary",
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    border: "border-amber-100",
    icon: "sermon",
    query: (book, chapter) => `${book} chapter ${chapter} Bible teaching sermon`,
  },
  {
    key: "verse",
    title: "Verse by Verse",
    subtitle: "In-depth walkthrough of every verse",
    accent: "text-blue-600",
    accentBg: "bg-blue-50",
    border: "border-blue-100",
    icon: "vxv",
    query: (book, chapter) => `${book} ${chapter} verse by verse Bible study`,
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
  if (name === "sermon") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    );
  }
  return <span className={`text-[10px] font-bold leading-none ${className}`}>V×V</span>;
}

function YouTubeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function VideoCard({ section, book, chapter }) {
  const query = section.query(book, chapter);
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  return (
    <div className={`rounded-xl border ${section.border} ${section.accentBg} overflow-hidden`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
          <SectionIcon name={section.icon} className={`w-4 h-4 ${section.accent}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-warm-brown leading-tight">
            {section.key === "overview"
              ? `${book} — ${section.title}`
              : section.key === "chapter"
              ? `${book} ${chapter} — ${section.title}`
              : `${section.title}: ${book} ${chapter}`}
          </p>
          <p className="text-[10px] text-warm-brown-light mt-0.5">{section.subtitle}</p>
        </div>
      </div>

      {/* Search query preview */}
      <div className="px-4 pb-2">
        <p className="text-[10px] text-warm-brown-light/60 font-mono truncate">
          🔍 {query}
        </p>
      </div>

      {/* Action button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => openUrl(youtubeUrl)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-red-200"
        >
          <YouTubeIcon className="w-4 h-4" />
          Watch on YouTube
        </button>
      </div>
    </div>
  );
}

export default function YouTubeLinks({ book, chapter }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-cream-dark text-sm hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-warm-brown-light">
          <YouTubeIcon className="w-4 h-4 text-red-500" />
          Video Teachings
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-warm-brown-light transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {SECTIONS.map((section) => (
            <VideoCard key={section.key} section={section} book={book} chapter={chapter} />
          ))}
          <p className="text-[10px] text-warm-brown-light/50 text-center py-1">
            Opens YouTube in your browser
          </p>
        </div>
      )}
    </div>
  );
}
