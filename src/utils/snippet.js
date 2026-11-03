// Text snippets for search results: ~maxLen characters around the first word
// accepted by `isHit` (a function of the lowercased word).
export function makeSnippet(text, isHit, maxLen = 240, phrases = []) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  let pos = -1;
  // A quoted phrase wins over a lone word
  const lowerClean = clean.toLowerCase();
  for (const p of phrases) {
    const i = p ? lowerClean.indexOf(p) : -1;
    if (i !== -1 && (pos === -1 || i < pos)) pos = i;
  }
  const re = /[\p{L}\p{N}'-]+/gu;
  let m;
  while (pos === -1 && (m = re.exec(clean)) !== null) {
    if (isHit(m[0].toLowerCase())) { pos = m.index; break; }
  }
  if (pos === -1) return clean.slice(0, maxLen).replace(/\s\S*$/, "") + "…";
  let start = Math.max(0, pos - Math.floor(maxLen / 3));
  if (start > 0) start = clean.indexOf(" ", start) + 1 || start;
  let end = Math.min(clean.length, start + maxLen);
  if (end < clean.length) {
    const sp = clean.lastIndexOf(" ", end);
    if (sp > pos) end = sp;
  }
  return `${start > 0 ? "…" : ""}${clean.slice(start, end)}${end < clean.length ? "…" : ""}`;
}

/** Split text into [string | {hit: string}] parts using `isHit` per word and phrase spans. */
export function markParts(text, isHit, phrases = []) {
  const s = String(text || "");
  const lower = s.toLowerCase();
  const spans = [];
  for (const p of phrases) {
    if (!p) continue;
    let i = lower.indexOf(p);
    while (i !== -1) { spans.push([i, i + p.length]); i = lower.indexOf(p, i + 1); }
  }
  const inSpan = (i) => spans.some(([a, b]) => i >= a && i < b);
  const parts = [];
  const re = /[\p{L}\p{N}][\p{L}\p{N}'-]*|[^\p{L}\p{N}]+/gu;
  let m;
  while ((m = re.exec(s)) !== null) {
    const w = m[0];
    const isWord = /^[\p{L}\p{N}]/u.test(w);
    if (isWord && (inSpan(m.index) || isHit(w.toLowerCase().replace(/[’']s$/, "")))) parts.push({ hit: w, at: m.index });
    else parts.push(w);
  }
  return parts;
}
