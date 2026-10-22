import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getChrono, formatYear } from "../../services/libraryService";

const REGION_ORDER = ["ne", "eg", "med", "as", "wo"];
const approx = (y) => (y < -1000 ? "c. " : "");
const span = (a, b) => (a === b ? formatYear(a) : a <= 0 && b <= 0 ? `${1 - a}–${1 - b} BC` : `${formatYear(a)} – ${formatYear(b)}`);

/**
 * "In history" card at the end of a chapter: when it happened (KJV margin
 * chronology), which Bible people were living, the world powers of the day,
 * and on chapter 1, who wrote the book and when. Links to the timeline.
 */
export default function InHistory({ book, chapter }) {
  const [chrono, setChrono] = useState(null);
  useEffect(() => { getChrono().then(setChrono); }, []);
  if (!chrono) return null;

  const year = chrono.chapters?.[book]?.[chapter - 1];
  if (year == null) return null;
  const info = chrono.books.find((b) => b.n === book);
  const isLetter = info && info.c[0] === info.w[0] && info.c[1] === info.w[1] && year >= 40;
  const alive = chrono.people.filter(([, , s, e]) => s <= year && e >= year);
  const powers = chrono.world
    .filter((w) => w.k === "power" && w.s <= year && w.e >= year)
    .sort((a, b) => REGION_ORDER.indexOf(a.r) - REGION_ORDER.indexOf(b.r))
    .slice(0, 3);

  return (
    <section aria-label="This chapter in history" className="mx-6 mt-6 rounded-2xl border border-cream-dark bg-white px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-gold">
          {isLetter ? "Written" : "In history"} · {approx(year)}{formatYear(year)}
        </p>
        <Link to={`/timeline?ref=${encodeURIComponent(`${book} ${chapter}`)}`} className="text-xs font-medium text-gold hover:underline shrink-0">
          See the timeline →
        </Link>
      </div>
      {alive.length > 0 && (
        <p className="text-xs text-warm-brown mt-2 leading-relaxed">
          <span className="text-warm-brown-light">Living then: </span>
          {alive.slice(0, 5).map(([slug, name], i) => (
            <span key={slug}>{i > 0 && ", "}<Link to={`/people/${slug}`} className="hover:text-gold">{name}</Link></span>
          ))}
          {alive.length > 5 && <span className="text-warm-brown-light"> +{alive.length - 5} more</span>}
        </p>
      )}
      {powers.length > 0 && (
        <p className="text-xs text-warm-brown mt-1 leading-relaxed">
          <span className="text-warm-brown-light">World powers: </span>{powers.map((w) => w.t).join(" · ")}
        </p>
      )}
      {chapter === 1 && info && (
        <p className="text-xs text-warm-brown-light mt-2 pt-2 border-t border-cream-dark leading-relaxed">
          <span className="font-semibold text-warm-brown">{book}</span> was written by {info.a}, {approx(info.w[0])}{span(info.w[0], info.w[1])}
          {!isLetter && <>, and tells of events from {approx(info.c[0])}{span(info.c[0], info.c[1])}</>}.
        </p>
      )}
    </section>
  );
}
