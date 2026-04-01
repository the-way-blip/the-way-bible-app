import { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../services/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Fallback to localStorage-only mode
      const stored = localStorage.getItem("localUser");
      if (stored) {
        setUser(JSON.parse(stored));
        loadLocalProfile();
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    if (!isSupabaseConfigured()) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("localUser");
    setUser(null);
    setProfile(null);
  }

  async function saveProfile(profileData) {
    setProfile(profileData);
    localStorage.setItem("userProfile", JSON.stringify(profileData));
    localStorage.setItem("onboardingComplete", "true");

    if (isSupabaseConfigured() && user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        ...profileData,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return (
    <AuthContext.Provider value={{
      user, loading, profile,
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
