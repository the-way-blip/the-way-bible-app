import { Link } from "react-router-dom";
import { parseReference } from "../services/bibleSearch";

// "Ro 5:8", "Joh 3:16", "1 Cor. 13:4-7", "Ex. 6:20" → tappable links when they parse
const REF_IN_TEXT = /\b(Song of Solomon|Song of Songs|(?:[1-3]\s?)?[A-Z][a-z]{1,13}\.?)\s(\d{1,3}):(\d{1,3})(?:[-–](\d{1,3}))?/g;

export function linkifyRefs(text) {
  const out = [];
  let last = 0;
  let book = null;
  for (const m of text.matchAll(REF_IN_TEXT)) {
    const ref = parseReference(`${m[1].replace(/\.$/, "")} ${m[2]}:${m[3]}`);
    if (!ref?.chapter) continue;
    book = ref.book;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <Link key={m.index} to={`/read/${encodeURIComponent(ref.book)}/${ref.chapter}?v=${ref.verse}`}
        className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold">{m[0]}</Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return book === null ? text : out;
}

export default function RefText({ text, className = "" }) {
  return <p className={`whitespace-pre-wrap ${className}`}>{linkifyRefs(text)}</p>;
}
