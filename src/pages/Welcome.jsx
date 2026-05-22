import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../stores/AuthContext";
import { submitSignUp } from "../services/ghlService";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Logo from "../components/Logo";

/**
 * Landing page built on the StoryBrand 7-part framework.
 * Sections: Header → Hero → Stakes → Value Stack → Guide → Plan
 *           → Explanatory → Feature Grid → Final CTA → Footer
 */
export default function Welcome() {
  useDocumentTitle("TheWay Bible App — Read Scripture. Study at any depth. Walk with Jesus daily.");
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // If a logged-in user lands here, send them to the app
  useEffect(() => {
    if (isLoggedIn) navigate("/", { replace: true });
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-cream text-warm-brown overflow-x-hidden">
      <Header />
      <Hero />
      <Stakes />
      <ValueStack />
      <Guide />
      <Plan />
      <Explanatory />
      <FeatureGrid />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ───────────────────────────── Header ───────────────────────────── */
function Header() {
  return (
    <header className="sticky top-0 z-40 bg-cream/95 dark:bg-[#1a1a1a]/95 backdrop-blur border-b border-cream-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="TheWay Bible App home">
          <Logo className="h-28 sm:h-36" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <a href="#features" className="hidden sm:inline text-sm text-warm-brown-light hover:text-warm-brown">Features</a>
          <a href="#plan" className="hidden sm:inline text-sm text-warm-brown-light hover:text-warm-brown">How it works</a>
          <Link to="/login?mode=signin" className="text-sm text-warm-brown-light hover:text-warm-brown px-2">Sign in</Link>
          <a href="#signup" className="bg-gold text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-gold/90 transition-colors">
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ────────────────────────────── Hero ────────────────────────────── */
function Hero() {
  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-base font-bold text-gold dark:text-gold-light uppercase tracking-widest mb-4">A new way to study Scripture</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-warm-brown leading-tight">
            Read Scripture.<br />
            <span className="text-gold">Study at any depth.</span><br />
            Walk with Jesus daily.
          </h1>
          <p className="text-lg text-warm-brown-light mt-6 max-w-lg leading-relaxed">
            TheWay Bible App is built for anyone, at any level of spiritual maturity. Read, study, grow, and follow Jesus at the depth you choose — first-time readers and lifelong scholars alike.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#signup"
              className="bg-gold text-white font-semibold px-6 py-3.5 rounded-full hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20"
            >
              Get Started Free
            </a>
            {/* App Store-style badge — dark in both modes, looks like a real button */}
            <span className="inline-flex items-center gap-2.5 bg-black text-white px-5 py-3 rounded-xl select-none">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 shrink-0">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-80">Coming soon to the</span>
                <span className="text-lg font-semibold -mt-0.5">App Store</span>
              </span>
            </span>
          </div>
          <p className="text-xs text-warm-brown-light/60 mt-4">Free forever · No credit card required</p>
        </div>

        {/* Hero visual — iPad mockup of reader */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent rounded-3xl blur-3xl" />
          <div className="relative bg-white rounded-3xl shadow-2xl shadow-warm-brown/10 border border-cream-dark overflow-hidden">
            <img
              src="/landing/02_reader.png"
              alt="TheWay Bible App reader interface showing Scripture with study tools"
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Stakes ───────────────────────────── */
function Stakes() {
  const stakes = [
    {
      title: "Scripture without context feels hollow",
      body: "You read the words, but the depth slips away. What does this word mean in the original? Why does it matter today?",
    },
    {
      title: "Plans that don't fit your pace get abandoned",
      body: "Rigid reading plans, generic devotionals, apps stuffed with ads. The friction wins and the habit dies.",
    },
    {
      title: "What you read fades by next week",
      body: "No place to record what God's teaching you. No memory work. No way to pray through what you've just read.",
    },
  ];
  return (
    <section className="bg-cream-dark/40 border-y border-cream-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-base font-bold text-gold dark:text-gold-light uppercase tracking-widest mb-4">The challenge</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-warm-brown">
            Daily time in the Word shouldn't feel like a chore.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {stakes.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-cream-dark p-6">
              <div className="w-10 h-10 rounded-full bg-warm-brown/5 text-warm-brown-light flex items-center justify-center mb-4">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="font-serif font-bold text-warm-brown text-lg mb-2">{s.title}</h3>
              <p className="text-warm-brown-light text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Value Stack ─────────────────────────── */
function ValueStack() {
  const values = [
    {
      title: "Read at your pace",
      body: "Open any chapter, follow a plan, or just pick up where you left off. Daily streaks and gentle nudges — no guilt, no spam.",
      icon: (
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      ),
    },
    {
      title: "Study at any depth",
      body: "Tap any word for Greek and Hebrew definitions, cross-references, commentary, and historical context — explore at your own pace.",
      icon: (
        <>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </>
      ),
    },
    {
      title: "Remember what you read",
      body: "Memorize verses with spaced repetition. Journal your insights. Track prayer requests and answered prayers — see God's faithfulness over time.",
      icon: (
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      ),
    },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl mb-12">
        <p className="text-base font-bold text-gold dark:text-gold-light uppercase tracking-widest mb-4">Imagine instead</p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-warm-brown">
          Scripture that finally sticks.
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {values.map((v) => (
          <div key={v.title} className="text-center md:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold/10 text-gold mb-4">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                {v.icon}
              </svg>
            </div>
            <h3 className="font-serif font-bold text-warm-brown text-xl mb-2">{v.title}</h3>
            <p className="text-warm-brown-light leading-relaxed">{v.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────── Guide ────────────────────────────── */
function Guide() {
  return (
    // Use explicit colors here so this stays a dark band in BOTH light AND
    // dark mode (rather than inverting via the warm-brown theme variable).
    <section className="bg-[#3a2820] dark:bg-[#0f0a07] text-[#faf7f2]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <p className="text-base font-bold text-gold-light uppercase tracking-widest mb-4">Our purpose</p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6 text-[#faf7f2]">
          A tool for every step of the journey.
        </h2>
        <p className="text-lg leading-relaxed text-[#faf7f2]/85 max-w-2xl mx-auto">
          TheWay Bible App exists to put a thoughtful, beautiful tool in the hands of every believer — wherever they are. Whether you're opening Scripture for the first time or you've walked with Jesus for decades, you'll find a place to read, study, grow, and follow Him at the depth you choose.
        </p>
        <p className="text-lg leading-relaxed text-[#faf7f2]/85 max-w-2xl mx-auto mt-6">
          We've built it to honor the Word, welcome the seeker, and serve the scholar — all in one place, free of distraction, available wherever life happens.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────────── Plan ─────────────────────────────── */
function Plan() {
  const steps = [
    { num: "1", title: "Sign up free", body: "Email and a password. No credit card, no commitment." },
    { num: "2", title: "Pick a plan or open anywhere", body: "Follow a reading plan, or just open Genesis 1. The app meets you where you are." },
    { num: "3", title: "Read, study, and grow", body: "Tap words for definitions, save verses, journal what God shows you. Build a daily walk that lasts." },
  ];
  return (
    <section id="plan" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl mb-12">
        <p className="text-base font-bold text-gold dark:text-gold-light uppercase tracking-widest mb-4">How it works</p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-warm-brown">Three steps to start.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connector line on desktop */}
        <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gold/30" aria-hidden="true" />
        {steps.map((step) => (
          <div key={step.num} className="relative bg-white border border-cream-dark rounded-2xl p-6 z-10">
            <div className="absolute -top-5 left-6 w-10 h-10 rounded-full bg-gold text-white font-serif font-bold text-lg flex items-center justify-center shadow-lg shadow-gold/30">
              {step.num}
            </div>
            <h3 className="font-serif font-bold text-warm-brown text-xl mt-4 mb-2">{step.title}</h3>
            <p className="text-warm-brown-light leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────── Explanatory ─────────────────────────── */
function Explanatory() {
  return (
    <section className="bg-cream-dark/40 border-y border-cream-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-warm-brown">
        <p className="text-base font-bold text-gold dark:text-gold-light uppercase tracking-widest mb-4">Frequently asked</p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-8">A few honest answers.</h2>
        <div className="space-y-6">
          <FAQ q="Is my data private?">
            Yes. Your reading progress, highlights, notes, journal entries, and prayer requests are yours. We never sell user data and never serve ads. Read our <Link to="/privacy" className="text-gold underline">privacy policy</Link>.
          </FAQ>
          <FAQ q="How much does it cost?">
            Free forever for the core reading, study, memory, journal, and prayer tools. If we ever charge for advanced features, it'll be optional — and clearly explained.
          </FAQ>
          <FAQ q="Will there be an iOS app?">
            Yes — coming soon to the App Store. The web app works on every device today, and an iOS app is in active development.
          </FAQ>
          <FAQ q="What's coming next?">
            Group studies, shared journals, audio reading, expanded commentary library, and tools for pastors and small group leaders. We build alongside our users — your feedback shapes the roadmap.
          </FAQ>
        </div>
      </div>
    </section>
  );
}

function FAQ({ q, children }) {
  return (
    <div className="border-l-2 border-gold pl-5">
      <h3 className="font-serif font-bold text-warm-brown text-lg mb-1">{q}</h3>
      <p className="text-warm-brown-light leading-relaxed">{children}</p>
    </div>
  );
}

/* ────────────────────────── Feature Grid ────────────────────────── */
function FeatureGrid() {
  const features = [
    { img: "/landing/02_reader.png", title: "Daily Reading", body: "Clean, distraction-free reader with adjustable text size, dark mode, and swipe-to-navigate." },
    { img: "/landing/03_study_mode.png", title: "Study Mode", body: "Tap any word for Greek/Hebrew, cross-references, and commentary — without leaving the verse." },
    { img: "/landing/04_topics.png", title: "Topics & Themes", body: "Explore Scripture by theme — faith, prayer, forgiveness, suffering, hope, and more." },
    { img: "/landing/05_search.png", title: "Keyword Search", body: "Find any verse, word, or phrase across all 66 books in seconds." },
    { img: "/landing/06_memory_verses.png", title: "Memory Verses", body: "Memorize Scripture with spaced repetition. Build a personal verse library you'll never forget." },
    { img: "/landing/07_prayer_list.png", title: "Prayer & Journal", body: "Track requests, mark answered prayers, journal what God is teaching you. See His faithfulness." },
  ];
  return (
    <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl mb-12">
        <p className="text-base font-bold text-gold dark:text-gold-light uppercase tracking-widest mb-4">Built-in tools</p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-warm-brown">Everything in one place.</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => (
          <div key={f.title}>
            <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm mb-4">
              <img src={f.img} alt={f.title} className="w-full h-48 object-cover object-top" loading="lazy" />
            </div>
            <h3 className="font-serif font-bold text-warm-brown text-lg mb-1">{f.title}</h3>
            <p className="text-warm-brown-light text-sm leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Final CTA ──────────────────────────── */
function FinalCTA() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signUp(email, password, name);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    submitSignUp({ email, name, subscribeToDevo: subscribe });
    if (result.data?.session) {
      navigate("/onboarding");
    } else {
      // mailer_autoconfirm is on, so session should exist — but just in case
      navigate("/login");
    }
  };

  return (
    <section id="signup" className="bg-gradient-to-b from-cream to-cream-dark/40 dark:from-[#1a1a1a] dark:to-[#252525] border-t border-cream-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <p className="text-base font-bold text-gold dark:text-gold-light uppercase tracking-widest mb-4">Start today</p>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-warm-brown mb-4">
          Begin your daily walk.
        </h2>
        <p className="text-lg text-warm-brown-light max-w-xl mx-auto mb-10">
          Sign up free in under a minute. Open Scripture today and let the Word shape your tomorrow.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 text-left">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoComplete="email"
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <label className="flex items-center gap-2 text-sm text-warm-brown-light">
            <input
              type="checkbox"
              checked={subscribe}
              onChange={(e) => setSubscribe(e.target.checked)}
              className="w-4 h-4 rounded border-cream-dark text-gold focus:ring-gold/30"
            />
            Send me weekly devotionals
          </label>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-white font-semibold px-6 py-3.5 rounded-full hover:bg-gold/90 disabled:opacity-50 transition-colors shadow-lg shadow-gold/20"
          >
            {loading ? "Creating your account..." : "Create Free Account"}
          </button>
          <p className="text-xs text-warm-brown-light/60 text-center">
            By signing up, you agree to our <Link to="/privacy" className="underline">Privacy Policy</Link>.<br />
            Already have an account? <Link to="/login" className="text-gold underline">Sign in</Link>.
          </p>
        </form>
      </div>
    </section>
  );
}

/* ──────────────────────────── Footer ────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#3a2820] dark:bg-[#0f0a07] text-[#faf7f2]/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8 text-sm">
        <div>
          <img src="/Logo%20White.png" alt="TheWay Bible App" className="h-28 sm:h-36 w-auto mb-4" />
          <p className="leading-relaxed">TheWay Bible App — a tool to read, study, grow, and follow Jesus at the depth you choose.</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#faf7f2] mb-3">Product</h4>
          <ul className="space-y-2">
            <li><a href="#features" className="hover:text-[#faf7f2]">Features</a></li>
            <li><a href="#plan" className="hover:text-[#faf7f2]">How it works</a></li>
            <li><Link to="/login" className="hover:text-[#faf7f2]">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-[#faf7f2] mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="hover:text-[#faf7f2]">Privacy Policy</Link></li>
            <li><a href="mailto:hello@thewaybible.app" className="hover:text-[#faf7f2]">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#faf7f2]/10">
        <p className="text-center text-xs text-[#faf7f2]/40 py-4">
          © {new Date().getFullYear()} TheWay Bible App. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
