import { useParams, Link } from "react-router-dom";

export default function WordStudy() {
  const { strongsId } = useParams();

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link
        to="/"
        className="text-sm text-warm-brown-light hover:text-warm-brown flex items-center gap-1 mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </Link>

      <div className="text-center py-16">
        <p className="text-warm-brown-light text-sm">
          Word study for <span className="font-medium text-gold">{strongsId}</span> coming soon.
        </p>
        <p className="text-warm-brown-light/60 text-xs mt-2">
          This will include Strong's definitions, Greek/Hebrew text, etymology, and cross-references.
        </p>
      </div>
    </div>
  );
}
