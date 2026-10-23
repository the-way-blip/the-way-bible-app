import { useState } from "react";
import { getSupabase } from "../services/supabase";
import { submitSignUp } from "../services/ghlService";
import { logEvent } from "../services/ga";

// Accounts made after this were sent to GHL at signup (commit aa93c72). Older
// accounts were told their email only went to the CRM if they asked for the
// devotional, so they are asked once here instead of being added silently.
const CUTOFF = "2026-10-23T02:05:00Z";
const KEY = "emailInvite"; // "welcome" | "devotional" | "no"

function answered(user) {
  if (user.user_metadata?.[KEY]) return true;
  try { return !!localStorage.getItem(`${KEY}:${user.id}`); } catch { return false; }
}

/** One-time card on Home asking pre-change accounts whether they want our emails. */
export default function EmailInvite({ user }) {
  const [state, setState] = useState("ask"); // ask | sending | done | hidden
  const eligible = user?.email && user.created_at && user.created_at < CUTOFF && !answered(user);
  if (!eligible || state === "hidden") return null;

  async function choose(choice) {
    setState(choice === "no" ? "hidden" : "sending");
    try { localStorage.setItem(`${KEY}:${user.id}`, choice); } catch { /* private mode */ }
    if (choice !== "no") {
      await submitSignUp({ email: user.email, name: user.user_metadata?.name || "", subscribeToDevo: choice === "devotional" });
    }
    logEvent("email_invite", { method: choice });
    // Remember on the account so other devices don't ask again.
    getSupabase().then((sb) => sb.auth.updateUser({ data: { [KEY]: choice } })).catch(() => {});
    if (choice !== "no") setState("done");
  }

  if (state === "done") {
    return (
      <div className="bg-white rounded-2xl p-4 mb-4 border border-cream-dark flex items-start justify-between gap-3">
        <p className="text-sm text-warm-brown">You're in. Look for our first email soon. You can unsubscribe from any email.</p>
        <button type="button" onClick={() => setState("hidden")} className="text-xs text-gold font-medium shrink-0 min-h-[44px] -my-3">Close</button>
      </div>
    );
  }

  const busy = state === "sending";
  return (
    <section aria-label="Email updates" className="bg-white rounded-2xl p-4 mb-4 border border-cream-dark">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gold mb-1">New</p>
      <h2 className="font-serif font-bold text-warm-brown text-lg leading-snug">Get the most out of TheWay</h2>
      <p className="text-sm text-warm-brown-light mt-1 leading-relaxed">
        We can email you a short welcome series with tips for studying with the app. You can also get a verse each morning.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <button type="button" disabled={busy} onClick={() => choose("devotional")}
          className="w-full bg-gold text-white text-sm font-semibold rounded-full px-4 py-2.5 hover:bg-gold/90 disabled:opacity-50">
          Welcome series + daily verse
        </button>
        <button type="button" disabled={busy} onClick={() => choose("welcome")}
          className="w-full bg-gold/10 text-gold text-sm font-semibold rounded-full px-4 py-2.5 hover:bg-gold/15 disabled:opacity-50">
          Just the welcome series
        </button>
        <button type="button" disabled={busy} onClick={() => choose("no")}
          className="w-full text-xs text-warm-brown-light min-h-[44px] hover:text-warm-brown">
          No thanks
        </button>
      </div>
      <p className="text-[10px] text-warm-brown-light/70 mt-1">Sent to {user.email}. Unsubscribe anytime.</p>
    </section>
  );
}
