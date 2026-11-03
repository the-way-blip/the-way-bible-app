// The reader's highlight colours (VerseActions picker, VerseList backgrounds).
// Shared so other screens (Search → Highlights) offer exactly the same set.
// Mirrors COLORS in VerseActions.jsx / HIGHLIGHT_COLORS in VerseList.jsx (left
// in place there to avoid colliding with the highlight-labels change) — keep in sync.
export const HIGHLIGHT_PALETTE = [
  { name: "yellow", bg: "bg-highlight-yellow", border: "border-yellow-400" },
  { name: "green", bg: "bg-highlight-green", border: "border-green-400" },
  { name: "blue", bg: "bg-highlight-blue", border: "border-blue-400" },
  { name: "pink", bg: "bg-highlight-pink", border: "border-pink-400" },
];
