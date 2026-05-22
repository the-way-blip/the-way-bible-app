import { useState } from "react";
import VerseImage from "./VerseImage";

export default function ShareSheet({ content, reference, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);

  const shareText = reference
    ? `"${content}"\n— ${reference} (KJV)`
    : content;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reference || "TheWay Bible App",
          text: shareText,
        });
      } catch {}
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const canNativeShare = typeof navigator.share === "function";

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-lg mx-auto w-full bg-white rounded-t-2xl shadow-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex justify-center pb-3">
            <div className="w-10 h-1 bg-cream-dark rounded-full" />
          </div>

          <h3 className="text-sm font-semibold text-warm-brown mb-3">Share</h3>

          {/* Preview */}
          <div className="bg-scripture-bg rounded-xl p-3 mb-4 border border-cream-dark">
            <p className="font-scripture text-sm text-warm-brown leading-relaxed line-clamp-4">
              "{content}"
            </p>
            {reference && (
              <p className="text-xs text-gold mt-2">{reference} KJV</p>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-1.5 py-3 bg-cream rounded-xl hover:bg-cream-dark transition-colors"
            >
              {copied ? (
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-500">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-warm-brown-light">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
              <span className="text-[10px] font-medium text-warm-brown-light">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>

            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-1.5 py-3 bg-cream rounded-xl hover:bg-cream-dark transition-colors"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-warm-brown-light">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span className="text-[10px] font-medium text-warm-brown-light">Share</span>
              </button>
            )}

            <button
              onClick={handleShareTwitter}
              className="flex flex-col items-center gap-1.5 py-3 bg-cream rounded-xl hover:bg-cream-dark transition-colors"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-warm-brown-light">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-[10px] font-medium text-warm-brown-light">Post</span>
            </button>

            <button
              onClick={() => setShowImageGen(true)}
              className="flex flex-col items-center gap-1.5 py-3 bg-cream rounded-xl hover:bg-cream-dark transition-colors"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-warm-brown-light">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-[10px] font-medium text-warm-brown-light">Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verse image generator modal */}
      {showImageGen && (
        <VerseImage content={content} reference={reference} onClose={() => setShowImageGen(false)} />
      )}
    </>
  );
}
