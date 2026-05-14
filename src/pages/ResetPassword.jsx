import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../services/supabase";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function ResetPassword() {
  useDocumentTitle("Reset Password");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase sends a PASSWORD_RECOVERY event when the user arrives via reset link
    let sub;
    getSupabase().then((sb) => {
      if (!sb) return;
      const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });
      sub = subscription;
    });
    // Also mark ready if we already have a session (user clicked link and landed here)
    getSupabase().then(async (sb) => {
      if (!sb) return;
      const { data: { session } } = await sb.auth.getSession();
      if (session) setReady(true);
    });
    return () => sub?.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const sb = await getSupabase();
    const { error: updateError } = await sb.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
  };

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-warm-brown-light">Verifying reset link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-warm-brown mb-2">Password Updated</h1>
        <p className="text-sm text-warm-brown-light">Redirecting you to the app...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-warm-brown">Reset Password</h1>
        <p className="text-sm text-warm-brown-light mt-1">Enter your new password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="sr-only">New password</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="sr-only">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-base text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-white rounded-xl py-3 text-sm font-semibold hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
