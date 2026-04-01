import { Link } from "react-router-dom";

export default function WordPopover({ wordInfo, onClose }) {
  if (!wordInfo) return null;

  const isAdded = wordInfo.added;

  return (
    <div className="fixed bottom-20 left-2 right-2 z-40">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-cream-dark overflow-hidden max-h-[60vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-cream-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-warm-brown">
              {wordInfo.word}
            </span>
            {wordInfo.strongs && (
              <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-mono">
                {wordInfo.strongs}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-warm-brown-light hover:text-warm-brown p-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isAdded ? (
          <div className="px-4 py-4 text-sm text-warm-brown-light">
            <p className="italic">
              This word was added by the KJV translators for clarity and does not
              correspond to a word in the original text.
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-3">
            {/* Original language */}
            {(wordInfo.greek || wordInfo.hebrew) && (
              <div>
                <p className="text-xl text-center text-warm-brown mb-1">
                  {wordInfo.greek || wordInfo.hebrew}
                </p>
                <p className="text-sm text-center text-warm-brown-light">
                  {wordInfo.transliteration}
                  {wordInfo.pronunciation && (
                    <span className="ml-2 text-xs text-warm-brown-light/70">
                      /{wordInfo.pronunciation}/
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Strong's Definition */}
            {wordInfo.strongs_def && (
              <Section title="Strong's Definition">
                {wordInfo.strongs_def}
              </Section>
            )}

            {/* Etymology */}
            {wordInfo.etymology && (
              <Section title="Etymology">
                {wordInfo.etymology}
              </Section>
            )}

            {/* Lexical Range */}
            {wordInfo.lexical_range && (
              <Section title="Lexical Range">
                {wordInfo.lexical_range}
              </Section>
            )}

            {/* Vine's */}
            {wordInfo.vines && (
              <Section title="Vine's Expository Dictionary">
                {wordInfo.vines}
              </Section>
            )}

            {/* Webster's 1828 */}
            {wordInfo.websters_1828 && (
              <Section title="Webster's 1828">
                {wordInfo.websters_1828}
              </Section>
            )}

            {/* Alternate Renderings */}
            {wordInfo.alternate_renderings?.length > 0 && (
              <Section title="Alternate Renderings">
                <div className="flex flex-wrap gap-1.5">
                  {wordInfo.alternate_renderings.map((r, i) => (
                    <span
                      key={i}
                      className="text-xs bg-cream-dark px-2 py-1 rounded-full text-warm-brown"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Translator Note */}
            {wordInfo.translator_note && (
              <Section title="Translator's Note">
                <p className="italic">{wordInfo.translator_note}</p>
              </Section>
            )}

            {/* Cross References */}
            {wordInfo.cross_references?.length > 0 && (
              <Section title="Cross References">
                <div className="flex flex-wrap gap-1.5">
                  {wordInfo.cross_references.map((ref, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gold/10 text-gold px-2 py-1 rounded-full"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">
        {title}
      </h4>
      <div className="text-sm text-warm-brown leading-relaxed">
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
    </div>
  );
}
