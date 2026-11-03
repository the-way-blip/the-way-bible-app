// Slide builders for Present mode (src/components/PresentMode.jsx).
// Slide shape: { kind: "title" | "text", title?, subtitle?, lines?, label?,
//   caption?, italic?, anchor?, anchorEnd? }
// lines are strings, or { text, sup } when a verse number should lead the line.
// Pure functions (no React) so they can be unit-tested with node --test.

const plain = (k, d) => d;

/**
 * Hymn → slides: a title slide, then each verse, with the refrain repeated
 * after every verse (the data stores the refrain once).
 */
export function hymnSlides(item, t = plain) {
  const verses = item?.verses || item?.stanzas || [];
  const refrain = item?.refrain?.length ? item.refrain.map((l) => l.trim()).filter(Boolean) : null;
  const year = item?.year ? String(item.year).replace(/\s*-\s*/, "–") : "";
  const slides = [{
    kind: "title",
    title: item?.title || "",
    subtitle: [item?.author, year].filter(Boolean).join(", "),
    label: t("present.titleSlide", "Title"),
  }];
  verses.forEach((v, i) => {
    slides.push({
      kind: "text",
      lines: v.map((l) => l.trim()).filter(Boolean),
      label: verses.length > 1 ? `${t("present.verse", "Verse")} ${i + 1}` : t("present.verse", "Verse"),
    });
    if (refrain) slides.push({ kind: "text", lines: refrain, italic: true, label: t("present.refrain", "Refrain") });
  });
  return slides;
}

/**
 * Chapter verses → slides. perSlide 1 = one verse per slide; 2 or 3 packs
 * consecutive verses together only while the slide stays short (maxChars),
 * so a long verse always gets a slide to itself.
 */
export function passageSlides(verses, { book, chapter, translation = "KJV", perSlide = 1, maxChars = 220 } = {}) {
  const groups = [];
  let cur = [];
  let len = 0;
  for (const v of verses || []) {
    const text = String(v.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (cur.length && (cur.length >= perSlide || len + text.length > maxChars)) {
      groups.push(cur);
      cur = [];
      len = 0;
    }
    cur.push({ verse: v.verse, text });
    len += text.length;
  }
  if (cur.length) groups.push(cur);

  return groups.map((g) => {
    const first = g[0].verse;
    const last = g[g.length - 1].verse;
    const ref = `${book} ${chapter}:${first}${last !== first ? `–${last}` : ""}`;
    return {
      kind: "text",
      lines: g.length > 1 ? g.map((v) => ({ text: v.text, sup: v.verse })) : [g[0].text],
      caption: `${ref} ${translation}`.trim(),
      label: ref,
      prose: true,
      anchor: first,
      anchorEnd: last,
    };
  });
}

/** Index of the slide that contains verse n (0 when not found). */
export function slideIndexForVerse(slides, n) {
  if (n == null) return 0;
  const i = slides.findIndex((s) => s.anchor != null && s.anchor <= n && n <= (s.anchorEnd ?? s.anchor));
  return i < 0 ? 0 : i;
}
