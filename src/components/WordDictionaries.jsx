import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRenderingEntries } from "../services/libraryService";
import DictionaryArticle from "./DictionaryArticle";
import useT from "../hooks/useT";

/** Bible-dictionary and topical-index entries for a word's common KJV renderings. */
export default function WordDictionaries({ renderings }) {
  const t = useT();
  const [entries, setEntries] = useState(null);
  const sig = renderings.map(([w, n]) => `${w}:${n}`).join("|");

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    getRenderingEntries(renderings).then((e) => { if (!cancelled) setEntries(e); }).catch(() => { if (!cancelled) setEntries([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  if (!entries) {
    return (
      <div className="bg-white rounded-xl border border-cream-dark p-4">
        <h3 className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-2">{t("wordStudy.bibleDictionaries")}</h3>
        <p className="text-sm text-warm-brown-light italic">{t("general.loading")}</p>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="bg-white rounded-xl border border-cream-dark p-4">
        <h3 className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-2">{t("wordStudy.bibleDictionaries")}</h3>
        <p className="text-sm text-warm-brown-light italic">{t("wordStudy.noDictEntries")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-warm-brown-light px-1">{t("wordStudy.dictNote")}</p>
      {entries.map((e, n) => {
        const meaning = e.articles.find((a) => a.meta.kind === "names");
        const articles = e.articles.filter((a) => a.meta.kind !== "names");
        return (
          <section key={e.headword}>
            <div className="flex items-baseline justify-between gap-3 mb-2 px-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="font-serif text-lg font-bold text-warm-brown">{e.headword}</h3>
                <span className="text-[10px] text-warm-brown-light">
                  {t("wordStudy.kjvRendering").replace("{w}", e.rendering).replace("{n}", e.count)}
                </span>
              </div>
              <Link to={`/dictionary/${encodeURIComponent(e.headword)}`} className="text-[11px] font-medium text-gold hover:text-gold/80 shrink-0">
                {t("wordStudy.openInDictionary")} →
              </Link>
            </div>
            {meaning && <p className="text-xs text-warm-brown-light italic mb-2 px-1">{meaning.text}</p>}
            <div className="space-y-2">
              {articles.map((a, i) => <DictionaryArticle key={a.id} article={a} defaultOpen={n === 0 && i === 0} />)}
            </div>
          </section>
        );
      })}
      <p className="text-[10px] text-warm-brown-light/60 px-1">{t("wordStudy.dictCredit")}</p>
    </div>
  );
}
