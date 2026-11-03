// Highlight colours, styles and the names a reader gives them ("Promises").
// A highlight record is { color, style? } — style "fill" (default), "underline",
// "dashed" or "dotted". Names live in localStorage "highlightLabels" and on the
// account (user_metadata.highlightLabels) so they follow the reader to other devices.
import { getSupabase } from "../services/supabase";

export const HIGHLIGHT_COLORS = [
  { name: "yellow", fill: "bg-highlight-yellow", ring: "border-yellow-400", line: "#d4a514" },
  { name: "green", fill: "bg-highlight-green", ring: "border-green-400", line: "#3f9a3a" },
  { name: "blue", fill: "bg-highlight-blue", ring: "border-blue-400", line: "#3b7fc4" },
  { name: "pink", fill: "bg-highlight-pink", ring: "border-pink-400", line: "#c8458b" },
];
export const HIGHLIGHT_STYLES = ["fill", "underline", "dashed", "dotted"];

const byName = Object.fromEntries(HIGHLIGHT_COLORS.map((c) => [c.name, c]));

/** className + style for a highlighted verse span. */
export function highlightLook(h) {
  const c = h && byName[h.color];
  if (!c) return { className: "", style: undefined };
  if (!h.style || h.style === "fill") return { className: c.fill, style: undefined };
  return {
    className: "",
    style: {
      textDecorationLine: "underline",
      textDecorationStyle: h.style === "underline" ? "solid" : h.style,
      textDecorationColor: c.line,
      textDecorationThickness: "2px",
      textUnderlineOffset: "5px",
      textDecorationSkipInk: "none",
    },
  };
}

const KEY = "highlightLabels";

/** { yellow: "Promises", ... } */
export function getHighlightLabels() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; }
}

/** Save names locally and on the account (when signed in). */
export async function saveHighlightLabels(labels, user) {
  const clean = Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, String(v || "").trim().slice(0, 24)]).filter(([, v]) => v));
  try { localStorage.setItem(KEY, JSON.stringify(clean)); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event("theway:highlight-labels"));
  if (user?.id) {
    const sb = await getSupabase().catch(() => null);
    await sb?.auth.updateUser({ data: { highlightLabels: clean } }).catch(() => {});
  }
  return clean;
}

/** On sign-in, adopt names saved on the account if this device has none. */
export function adoptAccountLabels(user) {
  const remote = user?.user_metadata?.highlightLabels;
  if (!remote || Object.keys(getHighlightLabels()).length) return;
  try { localStorage.setItem(KEY, JSON.stringify(remote)); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event("theway:highlight-labels"));
}
