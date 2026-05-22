import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured, getSupabase } from "../services/supabase";
import { syncAll } from "../services/supabaseSync";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

const AuthContext = createContext();

// Always use the production web URL for email redirects so links open the
// universal-link-enabled site (which then bounces back to the native app via
// the Associated Domain).
const PROD_REDIRECT_BASE = "https://thewaybible.app";

function getEmailRedirectBase() {
  if (Capacitor.isNativePlatform()) return PROD_REDIRECT_BASE;
  return typeof window !== "undefined" ? window.location.origin : PROD_REDIRECT_BASE;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const handleUserLogin = useCallback(async (authUser) => {
    setUser(authUser);
    if (authUser) {
      loadProfile(authUser.id);
      setSyncing(true);
      try {
        await syncAll(authUser.id);
      } finally {
        setSyncing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem("localUser");
      if (stored) {
        setUser(JSON.parse(stored));
        loadLocalProfile();
      }
      setLoading(false);
      return;
    }

    let subscription;

    getSupabase().then((sb) => {
      if (!sb) { setLoading(false); return; }

      sb.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) handleUserLogin(session.user);
        setLoading(false);
      });

      const { data: { subscription: sub } } = sb.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          handleUserLogin(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      });
      subscription = sub;
    });

    // Listen for universal-link opens (e.g. email confirmation / password reset)
    let urlListener;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("appUrlOpen", async ({ url }) => {
        try {
          const sb = await getSupabase();
          if (!sb) return;
          const u = new URL(url);
          // Supabase puts tokens in the URL hash: #access_token=...&refresh_token=...
          const hash = u.hash?.startsWith("#") ? u.hash.slice(1) : u.hash || "";
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          const type = params.get("type");

          if (access_token && refresh_token) {
            await sb.auth.setSession({ access_token, refresh_token });
          }
          // Route the in-app navigation based on link type
          if (type === "recovery") {
            window.location.hash = "#/reset-password";
          } else if (u.pathname.includes("/reset-password")) {
            window.location.hash = "#/reset-password";
          }
        } catch {
          // Silent — fall through to normal app load
        }
      }).then((handle) => { urlListener = handle; });
    }

    return () => {
      subscription?.unsubscribe();
      urlListener?.remove?.();
    };
  }, [handleUserLogin]);

  async function loadProfile(userId) {
    const sb = await getSupabase();
    if (!sb) return;
    const { data } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data);
      // Backfill localStorage so any device that hasn't seen this user's
      // profile before doesn't send them through onboarding again.
      localStorage.setItem("onboardingComplete", "true");
      localStorage.setItem("hasSeenTour", "true");
    }
  }

  function loadLocalProfile() {
    const p = localStorage.getItem("userProfile");
    if (p) setProfile(JSON.parse(p));
  }

  async function signUp(email, password, name) {
    if (!isSupabaseConfigured()) {
      const localUser = { id: "local", email, name };
      localStorage.setItem("localUser", JSON.stringify(localUser));
      setUser(localUser);
      return { error: null };
    }
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${getEmailRedirectBase()}/auth/callback`,
      },
    });
    return { data, error };
  }

  async function signIn(email, password) {
    if (!isSupabaseConfigured()) {
      const localUser = { id: "local", email };
      localStorage.setItem("localUser", JSON.stringify(localUser));
      setUser(localUser);
      loadLocalProfile();
      return { error: null };
    }
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    if (isSupabaseConfigured()) {
      const sb = await getSupabase();
      if (sb) await sb.auth.signOut();
    }
    localStorage.removeItem("localUser");
    setUser(null);
    setProfile(null);
  }

  // Maps the camelCase profile shape used by the app to the snake_case
  // columns in public.profiles. Any unknown keys are dropped to avoid
  // PostgREST 400s ("column X does not exist").
  function profileToRow(profileData, userId) {
    const COLUMN_MAP = {
      faithStage: "faith_stage",
      readingPlan: "reading_plan",
      suggestedBook: "suggested_book",
      // Direct passthrough for columns whose names match
      name: "name",
      email: "email",
      goals: "goals",
      topics: "topics",
    };
    const row = { id: userId, updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(profileData || {})) {
      const dbKey = COLUMN_MAP[key];
      if (dbKey) row[dbKey] = value;
    }
    return row;
  }

  async function saveProfile(profileData) {
    setProfile(profileData);
    localStorage.setItem("userProfile", JSON.stringify(profileData));
    localStorage.setItem("onboardingComplete", "true");

    if (isSupabaseConfigured() && user) {
      const sb = await getSupabase();
      if (sb) {
        const row = profileToRow(profileData, user.id);
        const { error } = await sb.from("profiles").upsert(row);
        if (error) {
          // Surface for debugging — previously these were swallowed silently
          // and the cloud copy of the profile silently fell out of sync.
          // eslint-disable-next-line no-console
          console.error("[saveProfile] upsert failed:", error.message, row);
        }
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user, loading, syncing, profile,
      signUp, signIn, signOut, saveProfile,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
