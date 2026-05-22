import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { track } from "@vercel/analytics";
import { useAuth } from "../stores/AuthContext";
import { submitSignUp } from "../services/ghlService";
import { getSupabase } from "../services/supabase";
import useDocumentTitle from "../hooks/useDocumentTitle";
import usePageMeta from "../hooks/usePageMeta";
import { Capacitor } from "@capacitor/core";
import Logo from "../components/Logo";

/**
 * Returns true if the given userId already has a profile row in Supabase,
 * which means they completed onboarding on a previous device/session.
 * Also backfills localStorage so future checks on this device are instant.
 */
async function hasExistingProfile(userId) {
  if (!userId) return !!localStorage.getItem("onboardingComplete");
  try {
    const sb = await getSupabase();
    if (!sb) return !!localStorage.getItem("onboardingComplete");
    const { data } = await sb.from("profiles").select("id").eq("id", userId).single();
    if (data) {
      localStorage.setItem("onboardingComplete", "true");
      localStorage.setItem("hasSeenTour", "true");
      return true;
    }
  } catch {}
  return !!localStorage.getItem("onboardingComplete");
}

// Production web URL — emails always link to the public site so universal
// links can bounce back into the native app.
const REDIRECT_BASE = Capacitor.isNativePlatform()
  ? "https://thewaybible.app"
  : (typeof window !== "undefined" ? window.location.origin : "https://thewaybible.app");

export default function Login() {
  // Default to Sign Up unless URL says ?mode=signin (e.g. landing page "Sign in" link)
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") !== "signin");
  useDocumentTitle(isSignUp ? "Sign Up" : "Sign In");
  usePageMeta({
    description: isSignUp
      ? "Create your free TheWay Bible App account. Sync highlights, notes, journal, and prayer requests across devices."
      : "Sign in to TheWay Bible App and pick up where you left off.",
    ogTitle: isSignUp ? "Sign up free — TheWay Bible App" : "Sign in — TheWay Bible App",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [subscribeToDevo, setSubscribeToDevo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password, name)
      : await signIn(email, password);

    setLoading(false);

    if (result.error) {
      track(isSignUp ? "signup_failed" : "signin_failed", {
        source: "login_page",
        reason: result.error.message,
      });
      setError(result.error.message);
    } else if (isSignUp) {
      track("signup_completed", { source: "login_page", subscribed_to_devo: subscribeToDevo });
      submitSignUp({ email, name, subscribeToDevo });
      if (result.data?.session) {
        // Brand-new sign-up with immediate session — always go to onboarding
        navigate("/onboarding");
      } else {
        setSuccess("Check your email to confirm your account, then sign in.");
      }
    } else {
      track("signin_completed");
      // Check Supabase profile to determine if this user has already onboarded.
      // Don't rely on localStorage alone — it's device-specific.
      const onboarded = await hasExistingProfile(result.data?.session?.user?.id);
      navigate(onboarded ? "/" : "/onboarding");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage(null);
    setResetLoading(true);

    const sb = await getSupabase();
    const { error: resetError } = await sb.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${REDIRECT_BASE}/reset-password`,
    });

    setResetLoading(false);

    if (resetError) {
      setResetMessage({ type: "error", text: resetError.message });
    } else {
      setResetMessage({ type: "success", text: "Check your email for a reset link" });
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="flex justify-center"><Logo className="h-28 sm:h-36" /><span className="sr-only">TheWay Bible App</span></h1>
        <p className="text-sm text-warm-brown-light mt-1">
          {isSignUp ? "Create your account" : "Welcome back"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="login-name" className="sr-only">Your name</label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="sr-only">Email address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoComplete="email"
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="relative">
          <label htmlFor="login-password" className="sr-only">Password</label>
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 pr-12 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-brown-light/50 hover:text-warm-brown-light"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {isSignUp && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribeToDevo}
              onChange={(e) => setSubscribeToDevo(e.target.checked)}
              className="w-4 h-4 rounded border-cream-dark text-gold focus:ring-gold/30"
            />
            <span className="text-xs text-warm-brown-light">Subscribe to daily devotionals</span>
          </label>
        )}

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-600 text-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-white rounded-xl py-3 text-sm font-semibold hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
              {isSignUp ? "Creating..." : "Signing in..."}
            </span>
          ) : isSignUp ? "Create Account" : "Sign In"}
        </button>
        {!isSignUp && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(!showForgotPassword);
                setResetMessage(null);
                setResetEmail(email);
              }}
              className="text-xs text-warm-brown-light hover:text-warm-brown"
            >
              Forgot password?
            </button>
          </div>
        )}

        {showForgotPassword && !isSignUp && (
          <div className="bg-cream/50 border border-cream-dark rounded-xl p-4 space-y-3">
            <div>
              <label htmlFor="reset-email" className="sr-only">Reset email address</label>
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Email address"
                required
                autoComplete="email"
                className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading || !resetEmail}
              className="w-full bg-warm-brown text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-warm-brown/90 disabled:opacity-50 transition-colors"
            >
              {resetLoading ? "..." : "Send Reset Link"}
            </button>
            {resetMessage && (
              <p className={`text-xs text-center ${resetMessage.type === "success" ? "text-green-600" : "text-red-500"}`}>
                {resetMessage.text}
              </p>
            )}
          </div>
        )}
      </form>

      <p className="text-xs text-warm-brown-light/60 text-center mt-6 px-2">
        Sign in to sync your reading progress, memory verses, and settings across devices.
      </p>

      <div className="text-center mt-6">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          className="text-sm text-warm-brown-light hover:text-warm-brown"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>

      <Link
        to="/home"
        className="block text-center text-xs text-warm-brown-light/50 mt-4 hover:text-warm-brown-light"
      >
        Continue without an account
      </Link>
    </div>
  );
}
