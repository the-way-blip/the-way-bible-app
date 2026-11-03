import { Fragment } from "react";
import { linkifyRefs } from "./RefText";

/**
 * A note's text with light markdown: # headings, **bold**, *italic*, "- " and
 * "1. " lists, "> " quotes and blank-line paragraphs. Bible references become
 * links. Built as React elements (never HTML), so a note can't inject markup.
 */
export default function NoteText({ text, className = "" }) {
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      if (!list || list.kind !== kind) { flush(); list = { kind, items: [] }; }
      list.items.push((bullet || numbered)[1]);
      continue;
    }
    flush();
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) blocks.push({ kind: "h", level: h[1].length, text: h[2] });
    else if (/^>\s?/.test(line)) blocks.push({ kind: "quote", text: line.replace(/^>\s?/, "") });
    else if (!line.trim()) blocks.push({ kind: "gap" });
    else blocks.push({ kind: "p", text: line });
  }
  flush();

  return (
    <div className={`space-y-1.5 ${className}`}>
      {blocks.map((b, i) => {
        if (b.kind === "gap") return <div key={i} className="h-1" aria-hidden="true" />;
        if (b.kind === "h") return <p key={i} className={`font-semibold text-warm-brown ${b.level === 1 ? "text-base" : "text-sm"}`}>{inline(b.text)}</p>;
        if (b.kind === "quote") return <p key={i} className="pl-3 border-l-2 border-gold/40 italic">{inline(b.text)}</p>;
        if (b.kind === "ul" || b.kind === "ol") {
          const List = b.kind;
          return <List key={i} className={`pl-5 space-y-0.5 ${b.kind === "ul" ? "list-disc" : "list-decimal"}`}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</List>;
        }
        return <p key={i}>{inline(b.text)}</p>;
      })}
    </div>
  );
}

/** **bold** and *italic* (or _italic_), with Bible references linked inside each run. */
function inline(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|\*(?!\s)(.+?)\*|_(?!\s)(.+?)_/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={parts.length}>{linkifyRefs(text.slice(last, m.index))}</Fragment>);
    if (m[1]) parts.push(<strong key={parts.length} className="font-semibold">{linkifyRefs(m[1])}</strong>);
    else parts.push(<em key={parts.length}>{linkifyRefs(m[2] || m[3])}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(<Fragment key={parts.length}>{linkifyRefs(text.slice(last))}</Fragment>);
  return parts;
}
