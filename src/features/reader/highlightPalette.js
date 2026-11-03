// The reader's highlight colours, in the shape Search → Highlights uses.
// Derived from utils/highlights.js so every screen offers exactly the same set.
import { HIGHLIGHT_COLORS } from "../../utils/highlights";

export const HIGHLIGHT_PALETTE = HIGHLIGHT_COLORS.map((c) => ({ name: c.name, bg: c.fill, border: c.ring }));
