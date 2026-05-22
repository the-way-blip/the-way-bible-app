import { Link } from "react-router-dom";

const UPCOMING_FEATURES = [
  {
    name: "Meditation",
    description: "Guided scripture meditation to dwell deeply in God's Word.",
    icon: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    name: "Reading Plans",
    description: "Structured plans to guide you through Scripture.",
    icon: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    name: "Commentary Library",
    description: "Read alongside the Church Fathers and classic commentators.",
    icon: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    name: "Progress & Badges",
    description: "Track your reading milestones and earn badges.",
    icon: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    name: "Study Groups",
    description: "Share insights and pray together with your community.",
    icon: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function ComingSoonAll() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-gold">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-warm-brown mb-2">Coming Soon</h1>
        <p className="text-sm text-warm-brown-light">
          These features are being built with care and will be available soon.
        </p>
      </div>

      <div className="space-y-3">
        {UPCOMING_FEATURES.map((feature) => (
          <div
            key={feature.name}
            className="bg-white border border-cream-dark rounded-xl p-4 flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center shrink-0 text-gold">
              {feature.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-warm-brown">{feature.name}</h3>
              <p className="text-xs text-warm-brown-light mt-0.5">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/home"
        className="block text-center text-sm text-gold hover:text-gold/80 mt-8"
      >
        Back to Home
      </Link>
    </div>
  );
}
