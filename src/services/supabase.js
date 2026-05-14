let _supabase = null;
let _initPromise = null;

// Defensively trim — Vercel env vars pasted with a trailing newline will
// produce URLs like "https://...supabase.co\n" which break header validation
// in some fetch paths. We saw this in production at runtime.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseKey);
}

// Lazily initialize Supabase client on first use
export async function getSupabase() {
  if (_supabase) return _supabase;
  if (!isSupabaseConfigured()) return null;

  if (!_initPromise) {
    _initPromise = import("@supabase/supabase-js").then(({ createClient }) => {
      _supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          // Persist the session in localStorage on web; on iOS Capacitor
          // localStorage is also available inside the WKWebView.
          persistSession: true,
          autoRefreshToken: true,
          // Critical: parse #access_token=... fragments left by Supabase
          // email confirmation / password recovery links and exchange them
          // for a session automatically. Default is true on browsers, but
          // we set it explicitly to make the intent obvious.
          detectSessionInUrl: true,
          // Implicit flow uses URL fragments (what our email templates and
          // AASA universal links rely on). Do NOT switch to PKCE without
          // also reworking the iOS appUrlOpen handler.
          flowType: "implicit",
        },
      });
      // Expose on window in dev so we can poke at it from the console.
      if (typeof window !== "undefined") {
        window.supabase = _supabase;
      }
      return _supabase;
    });
  }

  return _initPromise;
}

// Synchronous getter (returns null until getSupabase resolves)
export function getSupabaseSync() {
  return _supabase;
}

// Re-export for backward compat — callers that need sync access
// should migrate to getSupabase() async pattern
export { _supabase as supabase };
