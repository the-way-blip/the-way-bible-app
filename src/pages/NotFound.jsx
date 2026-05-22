import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useAuth } from "../stores/AuthContext";

export default function NotFound() {
  useDocumentTitle("Page Not Found");
  const { isLoggedIn } = useAuth();

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-7xl font-serif text-gold/40 mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-warm-brown mb-3">Page not found</h1>
      <p className="text-sm text-warm-brown-light mb-8 leading-relaxed">
        The page you're looking for doesn't exist or has moved.
        Let's get you back to Scripture.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link
          to={isLoggedIn ? "/home" : "/"}
          className="bg-gold text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-gold/90 transition-colors"
        >
          {isLoggedIn ? "Back to Home" : "Back to Landing"}
        </Link>
        <Link
          to="/read/Genesis/1"
          className="border border-cream-dark rounded-full px-6 py-3 text-sm font-medium text-warm-brown hover:bg-cream-dark/40 transition-colors"
        >
          Open Genesis 1
        </Link>
      </div>
    </div>
  );
}
