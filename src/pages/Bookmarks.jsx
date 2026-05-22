import { Link } from "react-router-dom";
import useBookmarks from "../hooks/useBookmarks";
import useDocumentTitle from "../hooks/useDocumentTitle";
import SkeletonList from "../components/SkeletonList";
import { useToast } from "../components/Toast";

export default function Bookmarks() {
  useDocumentTitle("Bookmarks");
  const { bookmarks, loading, removeBookmark } = useBookmarks();
  const showToast = useToast();

  const handleRemove = async (b) => {
    await removeBookmark(b.book, b.chapter, b.verse);
    showToast(`Bookmark removed`, { icon: "🔖" });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-warm-brown mb-1">Bookmarks</h1>
      <p className="text-sm text-warm-brown-light mb-6">Saved chapters and verses to return to.</p>

      {loading ? (
        <SkeletonList count={4} />
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gold">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-bold text-warm-brown mb-2">Save chapters for later</h2>
          <p className="text-warm-brown-light text-sm mb-1 max-w-xs mx-auto leading-relaxed">
            Found a chapter you want to come back to? Tap the bookmark icon while reading to save it here.
          </p>
          <p className="text-xs text-warm-brown-light/70 mb-6">
            Bookmarks sync across your devices.
          </p>
          <Link
            to="/read/Genesis/1"
            className="inline-block bg-gold text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20"
          >
            Open a chapter
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((b) => (
            <li key={b.id} className="bg-white rounded-xl border border-cream-dark p-3 flex items-center justify-between gap-3 hover:border-gold/30 transition-colors">
              <Link
                to={`/read/${encodeURIComponent(b.book)}/${b.chapter}${b.verse ? `#v${b.verse}` : ""}`}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-warm-brown truncate">
                  {b.book} {b.chapter}{b.verse ? `:${b.verse}` : ""}
                </p>
                {b.label && (
                  <p className="text-xs text-warm-brown-light truncate">{b.label}</p>
                )}
                <p className="text-[10px] text-warm-brown-light/60 mt-0.5">
                  {new Date(b.createdAt).toLocaleDateString()}
                </p>
              </Link>
              <button
                onClick={() => handleRemove(b)}
                aria-label={`Remove bookmark for ${b.book} ${b.chapter}`}
                className="p-2 text-warm-brown-light/40 hover:text-red-500 transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
