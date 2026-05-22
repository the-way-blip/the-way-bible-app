/**
 * Shared font list used in Settings and Onboarding.
 * All fonts are either system-installed on modern OSes, web fonts already
 * loaded by the app (Inter via @fontsource), or graceful fallbacks.
 */
const FONT_OPTIONS = [
  // ── Serif ─────────────────────────────────────────────
  {
    value: "Georgia, 'Times New Roman', serif",
    label: "Georgia",
    desc: "Classic, balanced reading serif",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'Iowan Old Style', 'Hoefler Text', Georgia, serif",
    label: "Iowan Old Style",
    desc: "Warm, book-like (Apple devices)",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'New York', 'Hoefler Text', Georgia, serif",
    label: "New York",
    desc: "Apple's system serif",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'Palatino Linotype', Palatino, 'URW Palladio L', serif",
    label: "Palatino",
    desc: "Elegant, calligraphic feel",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'Book Antiqua', Palatino, Georgia, serif",
    label: "Book Antiqua",
    desc: "Traditional book typography",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'Baskerville', 'Libre Baskerville', Georgia, serif",
    label: "Baskerville",
    desc: "Refined, high-contrast classic",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "Garamond, 'EB Garamond', Georgia, serif",
    label: "Garamond",
    desc: "Slim, refined Renaissance serif",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'Hoefler Text', 'Iowan Old Style', Georgia, serif",
    label: "Hoefler Text",
    desc: "Sophisticated literary serif",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "Cambria, Georgia, serif",
    label: "Cambria",
    desc: "Modern, screen-optimized serif",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'Times New Roman', Times, serif",
    label: "Times New Roman",
    desc: "Standard newspaper serif",
    sample: "In the beginning God created the heaven and the earth.",
  },
  // ── Sans-serif ────────────────────────────────────────
  {
    value: "'Inter', system-ui, -apple-system, sans-serif",
    label: "Inter",
    desc: "Modern, highly readable sans",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    label: "System Sans-Serif",
    desc: "Native OS sans (San Francisco / Segoe)",
    sample: "In the beginning God created the heaven and the earth.",
  },
  {
    value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    label: "Helvetica",
    desc: "Crisp, neutral sans",
    sample: "In the beginning God created the heaven and the earth.",
  },
  // ── Monospace ─────────────────────────────────────────
  {
    value: "'SF Mono', 'JetBrains Mono', 'Courier New', monospace",
    label: "Monospace",
    desc: "Fixed-width — clean & technical",
    sample: "In the beginning God created the heaven and the earth.",
  },
];

export default FONT_OPTIONS;
