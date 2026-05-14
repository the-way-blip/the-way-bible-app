import { useState } from "react";

const THEMES = [
  { bg: "#faf7f2", text: "#5c4033", accent: "#c9a84c", name: "Parchment" },
  { bg: "#1a1a2e", text: "#e8d8c4", accent: "#c9a84c", name: "Night" },
  { bg: "#2d4a3e", text: "#e8f0ec", accent: "#a8d5ba", name: "Forest" },
  { bg: "#4a3728", text: "#f0e6d8", accent: "#d4a574", name: "Leather" },
  { bg: "#f5f0ff", text: "#3a2d5c", accent: "#7c5cbf", name: "Royal" },
];

const SIZES = [
  { w: 1080, h: 1080, label: "Square", desc: "Instagram / Facebook", icon: "1:1" },
  { w: 1080, h: 1920, label: "Story", desc: "Instagram / TikTok Story", icon: "9:16" },
  { w: 1200, h: 630, label: "Landscape", desc: "Facebook / Twitter / LinkedIn", icon: "16:9" },
  { w: 1080, h: 1350, label: "Portrait", desc: "Instagram Portrait", icon: "4:5" },
  { w: 1170, h: 2532, label: "iPhone", desc: "Phone Wallpaper", icon: "phone" },
  { w: 2560, h: 1440, label: "Desktop", desc: "Desktop Wallpaper", icon: "monitor" },
];

export default function VerseImage({ content, reference, onClose }) {
  const text = content;
  const [theme, setTheme] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const t = THEMES[theme];
  const size = SIZES[sizeIdx];

  const drawAndDownload = async () => {
    setDownloading(true);
    const { w, h } = size;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Scale factor relative to 1080 base
    const s = Math.min(w, h) / 1080;
    const pad = Math.round(40 * s);
    const innerPad = Math.round(100 * s);

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, w, h);

    // Decorative border
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.strokeRect(pad + Math.round(10 * s), pad + Math.round(10 * s), w - (pad + Math.round(10 * s)) * 2, h - (pad + Math.round(10 * s)) * 2);

    // Quote marks
    ctx.fillStyle = t.accent;
    const quoteSize = Math.round(120 * s);
    ctx.font = `${quoteSize}px Georgia`;
    ctx.globalAlpha = 0.15;
    ctx.fillText("\u201C", innerPad - Math.round(20 * s), pad + quoteSize + Math.round(40 * s));
    ctx.globalAlpha = 1;

    // Verse text — centered vertically
    const fontSize = Math.round(36 * s);
    const lineHeight = Math.round(52 * s);
    ctx.fillStyle = t.text;
    ctx.font = `${fontSize}px Georgia`;
    const maxWidth = w - innerPad * 2;

    // Pre-calculate lines for vertical centering
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = test;
      }
    }
    if (line.trim()) lines.push(line.trim());

    // Total block height: lines + ref + branding
    const refSize = Math.round(28 * s);
    const refGap = Math.round(80 * s);
    const totalTextHeight = lines.length * lineHeight + refGap + refSize;
    const startY = Math.max(pad + quoteSize + Math.round(60 * s), (h - totalTextHeight) / 2);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], innerPad, startY + i * lineHeight);
    }

    // Reference
    ctx.fillStyle = t.accent;
    ctx.font = `italic ${refSize}px Georgia`;
    ctx.fillText("— " + reference + " (KJV)", innerPad, startY + lines.length * lineHeight + refGap);

    // Branding
    ctx.fillStyle = t.text;
    ctx.globalAlpha = 0.3;
    const brandSize = Math.round(18 * s);
    ctx.font = `${brandSize}px system-ui`;
    ctx.fillText("The Way", innerPad, h - pad - Math.round(20 * s));
    ctx.globalAlpha = 1;

    // Download
    const link = document.createElement("a");
    link.download = `${reference.replace(/\s/g, "_")}_${size.label.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    setDownloading(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-slide-up overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-warm-brown">Share as Image</h3>
            <button onClick={onClose} className="text-warm-brown-light hover:text-warm-brown">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Preview */}
          <div className="mx-5 rounded-xl overflow-hidden border border-cream-dark" style={{ backgroundColor: t.bg }}>
            <div
              className="p-6 flex flex-col justify-center"
              style={{ aspectRatio: `${size.w} / ${size.h}`, maxHeight: "280px" }}
            >
              <p className="text-3xl opacity-10 mb-2" style={{ color: t.accent }}>"</p>
              <p className="leading-relaxed mb-4" style={{ color: t.text, fontFamily: "Georgia", fontSize: "14px" }}>
                {text}
              </p>
              <p className="italic text-xs" style={{ color: t.accent }}>
                — {reference} (KJV)
              </p>
            </div>
          </div>

          <div className="px-5 pt-3 max-h-[220px] overflow-y-auto">
            {/* Size picker */}
            <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Size</p>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {SIZES.map((sz, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSizeIdx(i)}
                  className={`px-2 py-2 rounded-lg border text-left transition-colors ${sizeIdx === i ? "border-gold bg-gold/5" : "border-cream-dark hover:border-gold/30"}`}
                >
                  <span className={`text-xs font-medium block ${sizeIdx === i ? "text-gold" : "text-warm-brown"}`}>
                    {sz.label}
                  </span>
                  <span className="text-[10px] text-warm-brown-light leading-tight block">{sz.desc}</span>
                </button>
              ))}
            </div>

            {/* Theme picker */}
            <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Theme</p>
            <div className="flex items-center gap-2 mb-1">
              {THEMES.map((th, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTheme(i)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${theme === i ? "border-gold scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: th.bg }}
                  title={th.name}
                />
              ))}
            </div>
          </div>

          {/* Download */}
          <div className="px-5 py-4">
            <button
              onClick={drawAndDownload}
              disabled={downloading}
              className="w-full bg-gold text-white rounded-xl py-3 text-sm font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {downloading ? "Generating..." : `Download ${size.label} (${size.w}×${size.h})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
