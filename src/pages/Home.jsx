import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useMemoryVerses from "../hooks/useMemoryVerses";
import { useAuth } from "../stores/AuthContext";
import { getUnlockedBadges, getNextBadge } from "../data/badges";
import { getHeaderQuote } from "../data/headerQuotes";
import { getDueVerses } from "../utils/spaced-repetition";
import ShareSheet from "../components/ShareSheet";
import Logo from "../components/Logo";
import useDocumentTitle from "../hooks/useDocumentTitle";


const DAILY_VERSES = [
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", book: "Psalms", chapter: 119, verse: 105 },
  { ref: "Proverbs 3:5-6", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.", book: "Proverbs", chapter: 3, verse: 5 },
  { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me.", book: "Philippians", chapter: 4, verse: 13 },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", book: "Romans", chapter: 8, verse: 28 },
  { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", book: "Isaiah", chapter: 41, verse: 10 },
  { ref: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", book: "Jeremiah", chapter: 29, verse: 11 },
  { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", book: "Joshua", chapter: 1, verse: 9 },
  { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want.", book: "Psalms", chapter: 23, verse: 1 },
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", book: "John", chapter: 3, verse: 16 },
  { ref: "Romans 12:2", text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.", book: "Romans", chapter: 12, verse: 2 },
];

function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

export default function Home() {
  useDocumentTitle("Home");
  const { verses } = useMemoryVerses();
  const { user, isLoggedIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [shareData, setShareData] = useState(null);
  const dailyVerse = getDailyVerse();
  const headerQuote = getHeaderQuote();

  // Auto-redirect first-time users to onboarding
  useEffect(() => {
    if (!localStorage.getItem("onboardingComplete") && !localStorage.getItem("readingProgress")) {
      navigate("/onboarding", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("readingProgress") || "{}");
      setProgress(p);
    } catch {}
  }, []);

  const unlockedBadges = getUnlockedBadges(progress, verses.length);
  const nextBadge = getNextBadge(progress, verses.length);

  // Recently read chapters (from completed chapters, most recent books first)
  const recentlyRead = (() => {
    const chapters = progress.completedChapters || {};
    const recent = [];
    for (const [bookName, chs] of Object.entries(chapters)) {
      for (const ch of chs.slice(-3)) {
        recent.push({ book: bookName, chapter: ch });
      }
    }
    return recent.slice(-5).reverse();
  })();

  // Streak calendar — last 7 days
  const streakDays = (() => {
    const days = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const lastRead = progress.lastReadDate || "";
    const streak = progress.streak || 0;

    // Calculate which dates are covered by the streak.
    // The streak ends on lastReadDate and extends backwards.
    const lastReadTime = lastRead ? new Date(lastRead + "T12:00:00").getTime() : 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayTime = new Date(dateStr + "T12:00:00").getTime();

      // A day is "read" if it falls within the streak window ending at lastReadDate
      const daysBeforeLastRead = Math.round((lastReadTime - dayTime) / 86400000);
      const isRead = lastRead && streak > 0
        && daysBeforeLastRead >= 0
        && daysBeforeLastRead < streak;

      days.push({
        label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
        isToday: i === 0,
        isRead,
      });
    }
    return days;
  })();

  const copyVerse = () => {
    navigator.clipboard?.writeText(`${dailyVerse.text} — ${dailyVerse.ref} KJV`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Greeting + Account */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1><Logo className="h-24 sm:h-28" /><span className="sr-only">TheWay Bible App</span></h1>
          <p className="text-sm text-warm-brown-light mt-1">
            {progress.streak > 0
              ? `${progress.streak} day reading streak${progress.lastReadDate !== new Date().toISOString().split("T")[0] ? " — read today!" : ""}`
              : "Start your reading today"}
          </p>
        </div>
        {isLoggedIn ? (
          <AccountMenu user={user} onSignOut={signOut} />
        ) : (
          <Link
            to="/login"
            className="text-xs text-gold hover:text-gold/80 bg-gold/10 rounded-full px-3 py-1.5 font-medium"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Header quote */}
      <p className="text-[11px] text-warm-brown-light/50 italic mb-5 leading-relaxed">
        "{headerQuote.text}" — {headerQuote.ref}
      </p>

      {/* Streak Calendar */}
      {progress.streak > 0 && (
        <div className="bg-white rounded-2xl p-4 mb-4 border border-cream-dark">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider">This Week</p>
            <p className="text-xs text-gold font-semibold">{progress.streak} day streak</p>
          </div>
          <div className="flex justify-between">
            {streakDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-warm-brown-light">{day.label}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  day.isRead
                    ? "bg-gold text-white"
                    : day.isToday
                      ? "border-2 border-gold text-gold"
                      : "bg-cream-dark text-warm-brown-light/50"
                }`}>
                  {day.isRead ? "✓" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Verse — interactive */}
      <Link
        to={`/read/${encodeURIComponent(dailyVerse.book)}/${dailyVerse.chapter}`}
        className="block bg-scripture-bg rounded-2xl p-5 mb-4 border border-cream-dark relative hover:border-gold/30 transition-colors"
      >
        <h2 className="text-xs font-medium text-gold uppercase tracking-wider mb-2">
          Verse of the Day
        </h2>
        <p className="font-scripture text-warm-brown text-base leading-relaxed">
          "{dailyVerse.text}"
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-warm-brown-light">{dailyVerse.ref} KJV</p>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyVerse(); }}
              className="w-[44px] h-[44px] -m-2 flex items-center justify-center text-warm-brown-light/50 hover:text-gold transition-colors"
              aria-label="Copy verse"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareData({ content: dailyVerse.text, reference: dailyVerse.ref }); }}
              className="w-[44px] h-[44px] -m-2 flex items-center justify-center text-warm-brown-light/50 hover:text-gold transition-colors"
              aria-label="Share verse of the day"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </Link>

      {/* Continue Reading */}
      {progress.lastRead && (
        <Link
          to={`/read/${encodeURIComponent(progress.lastRead.book)}/${progress.lastRead.chapter}`}
          className="block bg-white rounded-2xl p-4 mb-4 border border-cream-dark hover:border-gold/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider">
                Continue Reading
              </p>
              <p className="text-warm-brown font-semibold mt-1">
                {progress.lastRead.book} {progress.lastRead.chapter}
              </p>
            </div>
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gold">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </div>
        </Link>
      )}

      {/* Recently Read */}
      {recentlyRead.length > 1 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-2">Recently Read</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {recentlyRead.map((r, i) => (
              <Link
                key={i}
                to={`/read/${encodeURIComponent(r.book)}/${r.chapter}`}
                className="shrink-0 bg-white border border-cream-dark rounded-xl px-3 py-2 text-xs text-warm-brown hover:border-gold/30 transition-colors"
              >
                {r.book} {r.chapter}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats — Memory Verses */}
      <section aria-label="Memory verses" className="mb-4">
        <Link
          to="/memory"
          className="flex items-center justify-between bg-white rounded-2xl p-4 border border-cream-dark hover:border-gold/30 transition-colors"
        >
          <div>
            <p className="text-2xl font-bold text-gold">{verses.length}</p>
            <p className="text-xs text-warm-brown-light mt-1">Memory Verses</p>
          </div>
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5 text-gold"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </Link>
      </section>

      {/* Due for Review */}
      {getDueVerses(verses).length > 0 && (
        <Link
          to="/memory/practice"
          className="block bg-gold/10 border border-gold/30 rounded-2xl p-4 mb-4 hover:bg-gold/15 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gold">
                {getDueVerses(verses).length} {getDueVerses(verses).length === 1 ? "verse" : "verses"} to review
              </p>
              <p className="text-xs text-warm-brown-light mt-0.5">Keep your memory fresh</p>
            </div>
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gold">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </div>
        </Link>
      )}

      {/* Progress Badges — show in a grid with locked badges */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-cream-dark">
        <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">
          Badges
        </p>
        <div className="grid grid-cols-4 gap-2">
          {unlockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center gap-1 p-2 bg-gold/5 rounded-xl"
              title={badge.desc}
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="text-[9px] font-medium text-gold text-center leading-tight">{badge.name}</span>
            </div>
          ))}
          {nextBadge && (
            <div
              className="flex flex-col items-center gap-1 p-2 bg-cream-dark/50 rounded-xl opacity-40"
              title={nextBadge.desc}
            >
              <span className="text-xl grayscale">{nextBadge.icon}</span>
              <span className="text-[9px] font-medium text-warm-brown-light text-center leading-tight">{nextBadge.desc}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Start */}
      {!progress.lastRead && (
        <div className="space-y-3">
          {localStorage.getItem("onboardingComplete") ? (
            <Link
              to="/read/Genesis/1"
              className="block bg-gold text-white rounded-2xl p-4 text-center font-semibold hover:bg-gold/90 transition-colors"
            >
              Read the Word
            </Link>
          ) : (
            <>
              <Link
                to="/onboarding"
                className="block bg-gold text-white rounded-2xl p-4 text-center font-semibold hover:bg-gold/90 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/read/Genesis/1"
                className="block text-center text-sm text-warm-brown-light hover:text-warm-brown"
              >
                or jump straight to reading
              </Link>
            </>
          )}
        </div>
      )}

      {/* Share sheet */}
      {shareData && (
        <ShareSheet
          content={shareData.content}
          reference={shareData.reference}
          onClose={() => setShareData(null)}
        />
      )}
    </div>
  );
}

function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setConfirmSignOut(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-warm-brown-light hover:text-warm-brown bg-cream-dark rounded-full px-3 py-1.5 flex items-center gap-1.5"
      >
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        {user?.email?.split("@")[0] || "Account"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-cream-dark z-50 py-1 animate-slide-up">
          <div className="px-3 py-2 border-b border-cream-dark">
            <p className="text-xs font-medium text-warm-brown truncate">{user?.email}</p>
          </div>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm text-warm-brown hover:bg-cream transition-colors"
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09" />
            </svg>
            Settings
          </Link>
          <div className="border-t border-cream-dark mt-1 pt-1">
            {confirmSignOut ? (
              <div className="px-3 py-2">
                <p className="text-xs text-warm-brown-light mb-2">Sign out of your account?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onSignOut(); setOpen(false); }}
                    className="flex-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg py-1.5 hover:bg-red-100 transition-colors"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={() => setConfirmSignOut(false)}
                    className="flex-1 text-xs text-warm-brown-light bg-cream-dark rounded-lg py-1.5 hover:bg-cream transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmSignOut(true)}
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm text-red-500 hover:bg-red-50 transition-colors w-full"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
