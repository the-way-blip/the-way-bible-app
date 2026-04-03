import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useApp } from "../stores/AppContext";

// Outline SVG icon helper
const Icon = ({ d, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const tabs = [
  {
    to: "/", label: "Home",
    icon: <Icon d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>} />,
  },
  {
    to: "/read/Genesis/1", label: "Read", matchPath: "/read",
    icon: <Icon d={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>} />,
  },
  {
    to: "/search", label: "Search",
    icon: <Icon d={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />,
  },
  {
    label: "More", isMenu: true,
    icon: <Icon d={<><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>} />,
  },
];

const moreLinks = [
  { to: "/memory", label: "Memory Verses",
    icon: <Icon d={<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>} className="w-4.5 h-4.5" /> },
  { to: "/journal", label: "Journal",
    icon: <Icon d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>} className="w-4.5 h-4.5" /> },
  { to: "/prayers", label: "Prayer List",
    icon: <Icon d={<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></>} className="w-4.5 h-4.5" /> },
  { to: "/plans", label: "Reading Plans",
    icon: <Icon d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} className="w-4.5 h-4.5" /> },
  { to: "/topics", label: "Topics",
    icon: <Icon d={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>} className="w-4.5 h-4.5" /> },
  { to: "/commentaries", label: "Commentary Library",
    icon: <Icon d={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>} className="w-4.5 h-4.5" /> },
  { to: "/progress", label: "Progress & Badges",
    icon: <Icon d={<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>} className="w-4.5 h-4.5" /> },
  { to: "/settings", label: "Settings",
    icon: <Icon d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>} className="w-4.5 h-4.5" /> },
  { to: "/login", label: "Account",
    icon: <Icon d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} className="w-4.5 h-4.5" /> },
];

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <>
      {showMore && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-16 left-2 right-2 z-50 max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-cream-dark p-2 animate-slide-up">
              {moreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-xl hover:bg-cream transition-colors text-warm-brown-light"
                >
                  {link.icon}
                  <span className="text-sm text-warm-brown">{link.label}</span>
                </Link>
              ))}
              <div className="border-t border-cream-dark mt-1 pt-1">
                <button
                  onClick={() => { toggleDarkMode(); setShowMore(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-xl hover:bg-cream transition-colors w-full text-warm-brown-light"
                >
                  {darkMode ? (
                    <Icon d={<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>} className="w-4.5 h-4.5" />
                  ) : (
                    <Icon d={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />} className="w-4.5 h-4.5" />
                  )}
                  <span className="text-sm text-warm-brown">{darkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-cream-dark z-50" aria-label="Main navigation">
        <div className="max-w-lg mx-auto flex justify-around items-center pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab, i) => {
            if (tab.isMenu) {
              return (
                <button key={i} onClick={() => setShowMore(!showMore)}
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] px-2 rounded-lg transition-colors ${showMore ? "text-gold" : "text-warm-brown-light hover:text-warm-brown"}`}>
                  {tab.icon}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            }
            return (
              <NavLink key={tab.to} to={tab.to} onClick={() => setShowMore(false)}
                className={({ isActive }) => {
                  const active = isActive || (tab.matchPath && location.pathname.startsWith(tab.matchPath));
                  return `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] px-2 rounded-lg transition-colors ${active ? "text-gold" : "text-warm-brown-light hover:text-warm-brown"}`;
                }}>
                {tab.icon}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
