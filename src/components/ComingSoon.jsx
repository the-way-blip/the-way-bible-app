import { Link } from "react-router-dom";

export default function ComingSoon({ title, description }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gold">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-warm-brown mb-2">{title}</h1>
      <p className="text-sm text-warm-brown-light mb-8 max-w-xs mx-auto">
        {description || "This feature is coming soon. We're working hard to bring it to you."}
      </p>
      <Link
        to="/home"
        className="inline-flex items-center gap-2 bg-gold text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gold/90 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
