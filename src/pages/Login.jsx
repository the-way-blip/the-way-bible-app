import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../stores/AuthContext";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password, name)
      : await signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      const onboarded = localStorage.getItem("onboardingComplete");
      navigate(onboarded ? "/" : "/onboarding");
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-warm-brown">In The Midst</h1>
        <p className="text-sm text-warm-brown-light mt-1">
          {isSignUp ? "Create your account" : "Welcome back"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          className="w-full bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
        />

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-white rounded-xl py-3 text-sm font-semibold hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          className="text-sm text-warm-brown-light hover:text-warm-brown"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>

      <Link
        to="/"
        className="block text-center text-xs text-warm-brown-light/50 mt-4 hover:text-warm-brown-light"
      >
        Continue without an account
      </Link>
    </div>
  );
}
