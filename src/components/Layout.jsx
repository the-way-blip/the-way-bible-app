import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";
import WelcomeTour from "./WelcomeTour";

export default function Layout() {
  const [showTour, setShowTour] = useState(
    () => !localStorage.getItem("hasSeenTour")
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <main className="flex-1 pb-20 max-w-[1440px] w-full mx-auto">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <footer className="text-center text-[10px] text-warm-brown-light/40 pb-24 pt-4 px-4">
        <p>In The Midst &middot; KJV Bible Study &middot; <a href="/settings" className="hover:text-warm-brown-light">Settings</a></p>
      </footer>
      <BottomNav />
      {showTour && <WelcomeTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}
