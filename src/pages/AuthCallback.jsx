import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../services/supabase";

/**
 * Pass-through page for Supabase email-confirmation links.
 *
 * Supabase appends the access_token / refresh_token / type to the URL
 * fragment (e.g. /auth/callback#access_token=...&refresh_token=...&type=signup).
 * The supabase-js client picks those tokens up automatically because
 * `detectSessionInUrl` is enabled on the client. We just wait for the
 * SIGNED_IN / PASSWORD_RECOVERY event (or a session that was already
 * established before this component mounted) and route the user to the
 * appropriate next screen.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let subscription;

    const route = async (session, type) => {
      if (cancelled) return;
      if (type === "recovery") {
        navigate("/reset-password", { replace: true });
        return;
      }
      if (session?.user) {
        // Check Supabase profile — source of truth for onboarding status
        // across devices. Falls back to localStorage if Supabase is unreachable.
        let onboarded = !!localStorage.getItem("onboardingComplete");
        try {
          const sb = await getSupabase();
          if (sb) {
            const { data } = await sb.from("profiles").select("id").eq("id", session.user.id).single();
            if (data) {
              onboarded = true;
              localStorage.setItem("onboardingComplete", "true");
              localStorage.setItem("hasSeenTour", "true");
            }
          }
        } catch {}
        navigate(onboarded ? "/" : "/onboarding", { replace: true });
      } else {
        // No session ever materialized — push to /login with a hint.
        navigate("/login", { replace: true });
      }
    };

    // Read `type` from the hash up-front so PASSWORD_RECOVERY is detected
    // even on the initial render (supabase-js will clear the hash after
    // it parses the tokens).
    const hash = (typeof window !== "undefined" && window.location.hash) || "";
    const initialType = new URLSearchParams(
      hash.startsWith("#") ? hash.slice(1) : hash
    ).get("type");

    getSupabase().then(async (sb) => {
      if (!sb) {
        setError("Supabase is not configured. Open the app and sign in manually.");
        return;
      }

      // Subscribe first so we don't miss the SIGNED_IN event fired by
      // detectSessionInUrl as it consumes the hash.
      const { data: { subscription: sub } } = sb.auth.onAuthStateChange(
        (event, session) => {
          if (event === "PASSWORD_RECOVERY") {
            route(session, "recovery");
          } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
            route(session, initialType);
          }
        }
      );
      subscription = sub;

      // Catch the case where the session was already established before
      // we got here (e.g. user reloaded /auth/callback after success).
      const { data: { session } } = await sb.auth.getSession();
      if (session) route(session, initialType);

      // Fallback: if nothing happens within ~6s, send the user back to /login.
      setTimeout(() => {
        if (cancelled) return;
        sb.auth.getSession().then(({ data: { session: s } }) => {
          if (!s) {
            setError(
              "We couldn't sign you in from that link. It may have expired — please request a new one."
            );
          }
        });
      }, 6000);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe?.();
    };
  }, [navigate]);

  return (
    <div className="max-w-sm mx-auto px-4 py-12 text-center">
      {!error ? (
        <>
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-warm-brown-light">Finishing sign in...</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-warm-brown mb-2">Sign-in link expired</h1>
          <p className="text-sm text-warm-brown-light">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors"
          >
            Back to sign in
          </button>
        </>
      )}
    </div>
  );
}
