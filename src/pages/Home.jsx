import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useMemoryVerses from "../hooks/useMemoryVerses";
import { useAuth } from "../stores/AuthContext";
import { getUnlockedBadges, getNextBadge } from "../data/badges";
import { getHeaderQuote } from "../data/headerQuotes";
import { getDueVerses } from "../utils/spaced-repetition";
import { PLANS, getTodaysReading } from "../data/readingPlanData";
import ShareSheet from "../components/ShareSheet";


const DAILY_VERSES = [
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { ref: "Proverbs 3:5-6", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths." },
  { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness." },
  { ref: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end." },
  { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest." },
  { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want." },
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { ref: "Romans 12:2", text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God." },
];

function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

export default function Home() {
  const { verses } = useMemoryVerses();
  const { user, isLoggedIn, signOut } = useAuth();
  const [progress, setProgress] = useState({});
  const [shareData, setShareData] = useState(null);
  const dailyVerse = getDailyVerse();
  const headerQuote = getHeaderQuote();

  // Active reading plan
  const [planState, setPlanState] = useState(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("activePlan");
      if (stored) setPlanState(JSON.parse(stored));
    } catch {}
  }, []);
  const activePlan = planState ? PLANS.find((p) => p.id === planState.planId) : null;
  const todaysReading = planState ? getTodaysReading(planState.planId, planState.startDate) : null;

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("readingProgress") || "{}");
      setProgress(p);
    } catch {}
  }, []);

  const totalChaptersRead = Object.values(progress.completedChapters || {}).reduce(
    (sum, chs) => sum + chs.length,
    0
  );

  const unlockedBadges = getUnlockedBadges(progress, verses.length);
  const nextBadge = getNextBadge(progress, verses.length);


  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Greeting + Account */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-warm-brown">In The Midst</h1>
          <p className="text-sm text-warm-brown-light mt-1">
            {progress.streak > 0
              ? `${progress.streak} day reading streak${progress.lastReadDate !== new Date().toISOString().split("T")[0] ? " — read today!" : ""}`
              : "Start your reading today"}
          </p>
        </div>
        {isLoggedIn ? (
          <button
            onClick={signOut}
            className="text-xs text-warm-brown-light hover:text-warm-brown bg-cream-dark rounded-full px-3 py-1.5"
          >
            {user?.email?.split("@")[0] || "Account"}
          </button>
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

      {/* Daily Verse */}
      <section className="bg-scripture-bg rounded-2xl p-5 mb-4 border border-cream-dark relative" aria-label="Verse of the Day">
        <h2 className="text-xs font-medium text-gold uppercase tracking-wider mb-2">
          Verse of the Day
        </h2>
        <p className="font-scripture text-warm-brown text-base leading-relaxed">
          "{dailyVerse.text}"
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-warm-brown-light">{dailyVerse.ref} KJV</p>
          <button
            onClick={() => setShareData({ content: dailyVerse.text, reference: dailyVerse.ref })}
            className="w-[44px] h-[44px] -m-2 flex items-center justify-center text-warm-brown-light/50 hover:text-gold transition-colors"
            aria-label="Share verse of the day"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </section>

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gold">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </div>
        </Link>
      )}

      {/* Today's Reading Plan */}
      {activePlan && todaysReading && (
        <Link
          to="/plans"
          className="block bg-white rounded-2xl p-4 mb-4 border border-cream-dark hover:border-gold/30 transition-colors"
        >
          <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider">
            {activePlan.name}
          </p>
          <p className="text-warm-brown font-semibold mt-1">
            Today: {todaysReading.readings.map((c) => `${c.book} ${c.chapter}`).join(", ")}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${Math.round((todaysReading.day / todaysReading.totalDays) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-warm-brown-light">
              Day {todaysReading.day}/{todaysReading.totalDays}
            </span>
          </div>
        </Link>
      )}

      {/* Quick Stats */}
      <section aria-label="Reading statistics" className="grid grid-cols-2 gap-3 mb-4">
        <Link to="/progress" className="bg-white rounded-2xl p-4 border border-cream-dark hover:border-gold/30 transition-colors">
          <p className="text-2xl font-bold text-gold">{totalChaptersRead}</p>
          <p className="text-xs text-warm-brown-light mt-1">Chapters Read</p>
        </Link>
        <Link to="/memory" className="bg-white rounded-2xl p-4 border border-cream-dark hover:border-gold/30 transition-colors">
          <p className="text-2xl font-bold text-gold">{verses.length}</p>
          <p className="text-xs text-warm-brown-light mt-1">Memory Verses</p>
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gold">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </div>
        </Link>
      )}

      {/* Progress Badges */}
      {(unlockedBadges.length > 0 || nextBadge) && (
        <div className="bg-white rounded-2xl p-4 mb-4 border border-cream-dark">
          <p className="text-xs font-medium text-warm-brown-light uppercase tracking-wider mb-3">
            Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-1.5 bg-gold/10 rounded-full px-3 py-1.5"
                title={badge.desc}
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="text-[11px] font-medium text-gold">{badge.name}</span>
              </div>
            ))}
            {nextBadge && (
              <div
                className="flex items-center gap-1.5 bg-cream-dark rounded-full px-3 py-1.5 opacity-50"
                title={nextBadge.desc}
              >
                <span className="text-sm grayscale">{nextBadge.icon}</span>
                <span className="text-[11px] font-medium text-warm-brown-light">{nextBadge.desc}</span>
              </div>
            )}
          </div>
        </div>
      )}

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
