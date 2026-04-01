import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useApp } from "../stores/AppContext";

const tabs = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: "/read/Genesis/1",
    label: "Read",
    matchPath: "/read",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    to: "/search",
    label: "Search",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: "More",
    isMenu: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
];

const moreLinks = [
  { to: "/memory", label: "Memory Verses", icon: "⭐" },
  { to: "/journal", label: "Journal", icon: "✏️" },
  { to: "/prayers", label: "Prayer List", icon: "🙏" },
  { to: "/plans", label: "Reading Plans", icon: "📅" },
  { to: "/progress", label: "Progress & Badges", icon: "📊" },
  { to: "/login", label: "Account", icon: "👤" },
];

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <>
      {/* More menu overlay */}
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream transition-colors"
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="text-sm text-warm-brown">{link.label}</span>
                </Link>
              ))}
              <div className="border-t border-cream-dark mt-1 pt-1">
                <button
                  onClick={() => { toggleDarkMode(); setShowMore(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cream transition-colors w-full"
                >
                  <span className="text-base">{darkMode ? "☀️" : "🌙"}</span>
                  <span className="text-sm text-warm-brown">{darkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-cream-dark z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab, i) => {
            if (tab.isMenu) {
              return (
                <button
                  key={i}
                  onClick={() => setShowMore(!showMore)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                    showMore ? "text-gold" : "text-warm-brown-light hover:text-warm-brown"
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => setShowMore(false)}
                className={({ isActive }) => {
                  const active = isActive || (tab.matchPath && location.pathname.startsWith(tab.matchPath));
                  return `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                    active ? "text-gold" : "text-warm-brown-light hover:text-warm-brown"
                  }`;
                }}
              >
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
