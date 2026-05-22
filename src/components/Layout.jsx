import { useState, useMemo } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";
import WelcomeTour from "./WelcomeTour";
import InstallPrompt from "./InstallPrompt";
import Logo from "./Logo";

const sidebarLinks = [
  { to: "/home", label: "Home", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", end: true },
  { to: "/read/Genesis/1", label: "Read", matchPrefix: "/read", icon: null, bookIcon: true },
  { to: "/search", label: "Search", icon: null, searchIcon: true },
  { to: "/memory", label: "Memory Verses", icon: null, starIcon: true },
  { to: "/journal", label: "Journal", icon: null, penIcon: true },
  { to: "/prayers", label: "Prayer List", icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
  { to: "/topics", label: "Topics", icon: null, tagIcon: true },
  { to: "/settings", label: "Settings", icon: null, gearIcon: true },
];

function SidebarIcon({ link }) {
  const cls = "w-5 h-5";
  if (link.icon) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d={link.icon} />
      </svg>
    );
  }
  if (link.starIcon) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (link.bookIcon) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  if (link.searchIcon) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );
  }
  if (link.penIcon) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    );
  }
  if (link.tagIcon) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    );
  }
  if (link.gearIcon) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09" />
      </svg>
    );
  }
  return null;
}

function DesktopSidebar() {
  const location = useLocation();

  const readPath = useMemo(() => {
    try {
      const p = JSON.parse(localStorage.getItem("readingProgress") || "{}");
      if (p.lastRead) return `/read/${encodeURIComponent(p.lastRead.book)}/${p.lastRead.chapter}`;
    } catch {}
    return "/read/Genesis/1";
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-cream-dark bg-white/50 py-6 px-3">
      <Link to="/home" className="px-3 mb-6 inline-flex" aria-label="The Way home">
        <Logo className="h-8" />
      </Link>
      <nav className="space-y-1" aria-label="Desktop navigation">
        {sidebarLinks.map((link) => {
          const to = link.matchPrefix ? readPath : link.to;
          const isActive = link.end
            ? location.pathname === link.to
            : link.matchPrefix
              ? location.pathname.startsWith(link.matchPrefix)
              : location.pathname === link.to || location.pathname.startsWith(link.to + "/");

          return (
            <Link
              key={link.label}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-gold/10 text-gold font-medium"
                  : "text-warm-brown-light hover:bg-cream hover:text-warm-brown"
              }`}
            >
              <SidebarIcon link={link} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function Layout() {
  const location = useLocation();
  const [showTour, setShowTour] = useState(
    () => !localStorage.getItem("hasSeenTour")
  );
  const showTourOnRoute = location.pathname === "/" || location.pathname === "/onboarding";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop sidebar — hidden on mobile */}
        <DesktopSidebar />
        <main id="main-content" className="flex-1 pb-16 md:pb-4 min-w-0">
          <PageTransition>
            <Outlet />
          </PageTransition>
          <footer className="text-center text-[10px] text-warm-brown-light/40 pt-4 px-4 pb-4">
            <p>The Way &middot; KJV Bible Study &middot; <a href="/settings" className="hover:text-warm-brown-light inline-flex items-center min-h-[44px]">Settings</a></p>
          </footer>
        </main>
      </div>
      {/* Bottom nav — hidden on desktop */}
      <BottomNav />
      <InstallPrompt />
      {showTour && showTourOnRoute && <WelcomeTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}
