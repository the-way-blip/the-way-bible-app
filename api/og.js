/**
 * /api/og?ref=John%203:16  → 1200×630 PNG share card for a verse (or range).
 * Used as og:image on /bible/<book>/<chapter>/<verse> pages and by the
 * "Share image" button. Node runtime — satori (SVG layout) + @resvg/resvg-js
 * (SVG→PNG), NOT @vercel/og: that package's edge build fetches its fallback
 * font via `new URL("./noto-sans-....ttf", import.meta.url)`, which Vercel's
 * bundler can't resolve into a static asset outside a Next.js project, so
 * every deploy failed with "referencing unsupported modules". satori itself
 * has no such fallback-font fetch, so bypassing @vercel/og avoids the bug.
 * Verse text comes from /api/bible-page?kind=text so no filesystem access
 * is needed here.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const T = { cream: "#faf7f2", paper: "#fdfbf7", brown: "#5c4033", brownLight: "#806252", gold: "#c9a84c", goldDark: "#a8862f", line: "#e6dfd3" };

let fontsPromise;
function loadFonts() {
  if (!fontsPromise) {
    const css = (fam) => fetch(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Satori)" } }).then((r) => r.text());
    const urlOf = (t) => (t.match(/src: url\((.+?)\)/) || [])[1];
    const get = (u) => fetch(u).then((r) => r.arrayBuffer());
    fontsPromise = Promise.all([css("Lora:wght@600").then(urlOf).then(get), css("Inter:wght@600").then(urlOf).then(get)])
      .then(([serif, sans]) => [
        { name: "Lora", data: serif, weight: 600, style: "normal" },
        { name: "Inter", data: sans, weight: 600, style: "normal" },
      ])
      .catch((e) => { fontsPromise = null; throw e; });
  }
  return fontsPromise;
}

const el = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });

export default async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${req.headers.host}`;
  const ref = (req.query && req.query.ref) || "John 3:16";
  const fallback = () => res.redirect(302, `${origin}/og-image.png`);
  try {
    const r = await fetch(`${origin}/api/bible-page?kind=text&ref=${encodeURIComponent(ref)}`);
    if (!r.ok) {
      res.status(404).setHeader("Content-Type", "text/plain").send("Unknown reference");
      return;
    }
    const { label, text } = await r.json();
    const size = text.length > 320 ? 30 : text.length > 220 ? 36 : text.length > 120 ? 42 : 50;
    const body = text.length > 520 ? text.slice(0, 500).replace(/\s+\S*$/, "") + "…" : text;

    const tree = el("div", { width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: `linear-gradient(160deg, ${T.paper} 0%, ${T.cream} 100%)`, color: T.brown, fontFamily: "Lora" }, [
      el("div", { display: "flex", alignItems: "center", fontFamily: "Inter", fontSize: 22, color: T.goldDark, letterSpacing: 2 }, [
        el("div", { width: 14, height: 14, borderRadius: 7, background: T.gold, marginRight: 14 }, null),
        el("div", { display: "flex" }, "KING JAMES VERSION"),
      ]),
      el("div", { display: "flex", fontSize: size, lineHeight: 1.35, letterSpacing: -0.5 }, `“${body}”`),
      el("div", { display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `2px solid ${T.line}`, paddingTop: 24 }, [
        el("div", { display: "flex", fontSize: 34, color: T.brown }, label),
        el("div", { display: "flex", fontFamily: "Inter", fontSize: 22, color: T.brownLight }, "thewaybible.app"),
      ]),
    ]);
    const fonts = await loadFonts();
    const svg = await satori(tree, { width: 1200, height: 630, fonts });
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable");
    res.status(200).send(png);
  } catch (err) {
    console.error("og render failed", err);
    fallback();
  }
}
