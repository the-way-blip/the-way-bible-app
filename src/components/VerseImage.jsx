import { useRef, useState } from "react";

const THEMES = [
  { bg: "#faf7f2", text: "#5c4033", accent: "#c9a84c", name: "Parchment" },
  { bg: "#1a1a2e", text: "#e8d8c4", accent: "#c9a84c", name: "Night" },
  { bg: "#2d4a3e", text: "#e8f0ec", accent: "#a8d5ba", name: "Forest" },
  { bg: "#4a3728", text: "#f0e6d8", accent: "#d4a574", name: "Leather" },
  { bg: "#f5f0ff", text: "#3a2d5c", accent: "#7c5cbf", name: "Royal" },
];

export default function VerseImage({ text, reference, onClose }) {
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const t = THEMES[theme];

  const drawAndDownload = async () => {
    setDownloading(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative border
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1000, 1000);
    ctx.strokeRect(50, 50, 980, 980);

    // Quote marks
    ctx.fillStyle = t.accent;
    ctx.font = "120px Georgia";
    ctx.globalAlpha = 0.15;
    ctx.fillText("\u201C", 70, 200);
    ctx.globalAlpha = 1;

    // Verse text
    ctx.fillStyle = t.text;
    ctx.font = "36px Georgia";
    const words = text.split(" ");
    let line = "";
    let y = 260;
    const maxWidth = 880;

    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trim(), 100, y);
        line = word + " ";
        y += 52;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), 100, y);

    // Reference
    ctx.fillStyle = t.accent;
    ctx.font = "italic 28px Georgia";
    ctx.fillText("— " + reference + " (KJV)", 100, y + 80);

    // Branding
    ctx.fillStyle = t.text;
    ctx.globalAlpha = 0.3;
    ctx.font = "18px system-ui";
    ctx.fillText("In The Midst", 100, 980);
    ctx.globalAlpha = 1;

    // Download
    const link = document.createElement("a");
    link.download = `${reference.replace(/\s/g, "_")}.png`;
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
            <div className="p-6 aspect-square flex flex-col justify-center">
              <p className="text-3xl opacity-10 mb-2" style={{ color: t.accent }}>"</p>
              <p className="leading-relaxed mb-4" style={{ color: t.text, fontFamily: "Georgia", fontSize: "14px" }}>
                {text}
              </p>
              <p className="italic text-xs" style={{ color: t.accent }}>
                — {reference} (KJV)
              </p>
            </div>
          </div>

          {/* Theme picker */}
          <div className="px-5 py-3 flex items-center gap-2">
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

          {/* Download */}
          <div className="px-5 pb-5">
            <button
              onClick={drawAndDownload}
              disabled={downloading}
              className="w-full bg-gold text-white rounded-xl py-3 text-sm font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {downloading ? "Generating..." : "Download Image"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
