// "By book" and "Found with" sections for the word study Usage tab.
// Data: scripts/build-word-usage.mjs → /data/word-usage/*.json (see wordUsageService).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWordUsage, getKjvVerses } from "../services/wordUsageService";
import { getLexicon, getStrongs } from "../services/wordStudyLocal";
import useT from "../hooks/useT";

const PAGE = 60;

// Render with key={strongsId} so state resets when the word changes.
export default function WordUsage({ strongsId }) {
  const t = useT();
  const [usage, setUsage] = useState(undefined); // undefined = loading, null = none
  const [names, setNames] = useState({});
  const [allBooks, setAllBooks] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getWordUsage(strongsId)
      .then(async (u) => {
        if (cancelled) return;
        setUsage(u);
        if (!u?.foundWith.length) return;
        // Both are promise-cached and already loaded by the page header.
        const [lex, os] = await Promise.all([getLexicon(), getStrongs(strongsId.startsWith("G") ? "greek" : "hebrew")]);
        if (cancelled) return;
        const out = {};
        for (const { id } of u.foundWith) {
          const l = lex?.[id], o = os?.[id];
          out[id] = {
            lemma: l?.Gk_word || l?.Hb_word || l?.lemma || o?.lemma || "",
            xlit: l?.transliteration || o?.translit || o?.xlit || "",
          };
        }
        setNames(out);
      })
      .catch(() => { if (!cancelled) setUsage(null); });
    return () => { cancelled = true; };
  }, [strongsId]);

  if (usage === undefined) {
    return (
      <Section title={t("wordStudy.byBook", "By book")}>
        <p className="text-sm text-warm-brown-light italic">{t("general.loading")}</p>
      </Section>
    );
  }
  if (!usage) return null;

  const used = usage.books.filter((b) => b.count > 0);
  const rows = allBooks ? usage.books : used;
  const max = Math.max(1, ...used.map((b) => b.count));
  const hasFlags = usage.books.some((b) => b.flag);

  return (
    <>
      <Section title={t("wordStudy.byBook", "By book")}>
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <p className="text-xs text-warm-brown">
            {t("wordStudy.byBookSummary", "{n} tagged uses in {b} books")
              .replace("{n}", usage.total.toLocaleString())
              .replace("{b}", used.length)}
          </p>
          <button
            onClick={() => setAllBooks((v) => !v)}
            aria-pressed={allBooks}
            className="text-[11px] text-gold font-medium shrink-0 hover:text-gold/80"
          >
            {allBooks ? t("wordStudy.booksWithWord", "Only books that use it") : t("wordStudy.allBooks", "All books")}
          </button>
        </div>
        <p className="text-[10px] text-warm-brown-light/70 mb-3">
          {hasFlags && <>{t("wordStudy.byBookNote", "More/fewer mean beyond chance, not simply above or below average.")} </>}
          {t("wordStudy.tapBook", "Tap a book to see its verses.")}
        </p>
        <ul className="space-y-0.5">
          {rows.map((b) => (
            <li key={b.index}>
              <BookRow
                book={b}
                max={max}
                active={selected === b.index}
                onClick={() => b.count > 0 && setSelected(selected === b.index ? null : b.index)}
                t={t}
              />
              {selected === b.index && (
                <BookVerses key={`${strongsId}-${b.index}`} book={b} refs={usage.verses[b.index] || []} onClose={() => setSelected(null)} t={t} />
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("wordStudy.foundWith", "Found with")}>
        <p className="text-[10px] text-warm-brown-light/70 mb-3">
          {t("wordStudy.foundWithNote", "Words that share a verse with this one more often than chance would suggest.")}
        </p>
        {usage.foundWith.length === 0 ? (
          <p className="text-sm text-warm-brown-light italic">{t("wordStudy.foundWithNone", "Not enough shared verses to rank.")}</p>
        ) : (
          <ul className="space-y-1.5">
            {usage.foundWith.map((w) => (
              <li key={w.id}>
                <Link
                  to={`/word/${w.id}`}
                  className="flex items-center gap-3 bg-cream rounded-lg px-3 py-2 hover:bg-gold/10 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-warm-brown truncate">
                      <span className="font-medium">{names[w.id]?.lemma || w.id}</span>
                      {names[w.id]?.xlit && <span className="text-warm-brown-light ml-1.5 text-xs">{names[w.id].xlit}</span>}
                    </p>
                    {w.gloss && <p className="text-xs text-warm-brown-light truncate">{w.gloss}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-gold tabular-nums">
                      {t("wordStudy.sharedVerses", "{n} verses").replace("{n}", w.shared)}
                    </p>
                    <p className="text-[10px] text-warm-brown-light/60 font-mono">{w.id}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-cream-dark p-4">
      <h3 className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function BookRow({ book, max, active, onClick, t }) {
  const flagText = book.flag > 0
    ? t("wordStudy.moreThanExpected", "More than expected")
    : book.flag < 0 ? t("wordStudy.fewerThanExpected", "Fewer than expected") : null;
  const expected = book.expected != null
    ? t("wordStudy.expectedAbout", "about {e} expected").replace("{e}", book.expected.toLocaleString())
    : null;
  const pct = book.count ? Math.max(2, (book.count / max) * 100) : 0;
  return (
    <button
      onClick={onClick}
      disabled={!book.count}
      aria-expanded={book.count ? active : undefined}
      className={`w-full text-left rounded-lg px-2 py-1.5 transition-colors ${active ? "bg-gold/10" : book.count ? "hover:bg-cream" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-24 shrink-0 truncate text-xs ${book.count ? "text-warm-brown" : "text-warm-brown-light/50"}`}>{book.name}</span>
        <span className="flex-1 h-2 bg-cream rounded-full overflow-hidden" aria-hidden="true">
          <span className="block h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
        </span>
        <span className={`w-10 shrink-0 text-right text-xs tabular-nums ${book.count ? "text-warm-brown font-medium" : "text-warm-brown-light/50"}`}>
          {book.count.toLocaleString()}
        </span>
      </div>
      {flagText && (
        <p className={`text-[10px] mt-0.5 ${book.flag > 0 ? "text-gold font-medium" : "text-warm-brown-light"}`}>
          {book.flag > 0 ? "▲" : "▼"} {flagText}
          {expected && <span className="text-warm-brown-light/60 font-normal"> · {expected}</span>}
        </p>
      )}
    </button>
  );
}

function BookVerses({ book, refs, onClose, t }) {
  const [verses, setVerses] = useState(null);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let cancelled = false;
    getKjvVerses(book.name, refs)
      .then((v) => { if (!cancelled) setVerses(v); })
      .catch(() => { if (!cancelled) setVerses(refs.map((r) => ({ ...r, text: "" }))); });
    return () => { cancelled = true; };
  }, [book.name, refs]);

  return (
    <div className="mt-1 mb-2 ml-2 border-l-2 border-gold/30 pl-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gold">
          {t("wordStudy.versesIn", "Verses in")} {book.name}{" "}
          <span className="text-warm-brown-light font-normal">({t("wordStudy.sharedVerses", "{n} verses").replace("{n}", refs.length)})</span>
        </h4>
        <button onClick={onClose} className="text-[10px] text-warm-brown-light hover:text-warm-brown">{t("general.close")}</button>
      </div>
      {!verses ? (
        <div className="flex items-center gap-2 py-3 justify-center">
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {verses.slice(0, shown).map((v) => (
            <Link
              key={`${v.chapter}:${v.verse}`}
              to={`/read/${encodeURIComponent(book.name)}/${v.chapter}?v=${v.verse}`}
              className="block bg-cream rounded-lg p-2.5 hover:bg-gold/10 transition-colors"
            >
              <p className="text-[10px] font-medium text-gold mb-0.5">{book.name} {v.chapter}:{v.verse}</p>
              {v.text && <p className="text-xs text-warm-brown leading-relaxed line-clamp-2">{v.text}</p>}
            </Link>
          ))}
          {verses.length > shown && (
            <button onClick={() => setShown((s) => s + PAGE)} className="w-full text-[11px] text-gold font-medium py-1.5 hover:text-gold/80">
              {t("wordStudy.showMore", "Show more")} ({verses.length - shown})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
