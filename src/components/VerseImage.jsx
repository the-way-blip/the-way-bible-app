import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────── Solid color themes (always free) ─────────────────── */
const COLOR_THEMES = [
  { id: "parchment", name: "Parchment", bg: "#faf7f2", text: "#5c4033", accent: "#c9a84c" },
  { id: "night",     name: "Night",     bg: "#1a1a2e", text: "#e8d8c4", accent: "#c9a84c" },
  { id: "forest",    name: "Forest",    bg: "#2d4a3e", text: "#e8f0ec", accent: "#a8d5ba" },
  { id: "leather",   name: "Leather",   bg: "#4a3728", text: "#f0e6d8", accent: "#d4a574" },
  { id: "royal",     name: "Royal",     bg: "#3a2d5c", text: "#f5f0ff", accent: "#c8b0e0" },
  { id: "ocean",     name: "Ocean",     bg: "#1e3a5c", text: "#e8f0f8", accent: "#a8c8e0" },
  { id: "ember",     name: "Ember",     bg: "#4a2818", text: "#f8e4d0", accent: "#e89a5c" },
  { id: "ink",       name: "Ink",       bg: "#0d0d0d", text: "#fafafa", accent: "#d4af37" },
];

/* ─────────────────── Photo background categories (Unsplash) ─────────────────── */
const PHOTO_CATEGORIES = [
  { id: "mountains",  label: "Mountains",   query: "mountain landscape majestic" },
  { id: "ocean",      label: "Ocean",       query: "ocean sea waves serene" },
  { id: "sunrise",    label: "Sunrise",     query: "sunrise golden hour sky" },
  { id: "sunset",     label: "Sunset",      query: "sunset clouds horizon" },
  { id: "forest",     label: "Forest",      query: "forest trees light" },
  { id: "desert",     label: "Desert",      query: "desert landscape sand dunes" },
  { id: "stars",      label: "Night Sky",   query: "stars night sky cosmos" },
  { id: "clouds",     label: "Clouds",      query: "clouds sky dramatic" },
  { id: "stained",    label: "Stained Glass", query: "stained glass cathedral church" },
  { id: "candles",    label: "Candlelight", query: "candle warm light flame" },
  { id: "marble",     label: "Marble",      query: "marble texture white minimal" },
  { id: "abstract",   label: "Abstract",    query: "abstract minimal soft texture" },
];

const SIZES = [
  { w: 1080, h: 1080, label: "Square",    desc: "Instagram / Facebook" },
  { w: 1080, h: 1920, label: "Story",     desc: "Instagram / TikTok Story" },
  { w: 1200, h: 630,  label: "Landscape", desc: "Facebook / X / LinkedIn" },
  { w: 1080, h: 1350, label: "Portrait",  desc: "Instagram Portrait" },
  { w: 1170, h: 2532, label: "iPhone",    desc: "Phone Wallpaper" },
  { w: 2560, h: 1440, label: "Desktop",   desc: "Desktop Wallpaper" },
];

const FONT_CHOICES = [
  { id: "georgia",     label: "Georgia",     family: "Georgia, serif" },
  { id: "palatino",    label: "Palatino",    family: "'Palatino Linotype', Palatino, serif" },
  { id: "didot",       label: "Didot",       family: "'Didot', 'Bodoni MT', Georgia, serif" },
  { id: "baskerville", label: "Baskerville", family: "'Baskerville', Georgia, serif" },
  { id: "sans",        label: "Modern Sans", family: "'Inter', system-ui, sans-serif" },
];

export default function VerseImage({ content, reference, onClose }) {
  // ─── State ───
  const [mode, setMode] = useState("color"); // "color" | "photo"
  const [themeIdx, setThemeIdx] = useState(0);
  const [photoCategory, setPhotoCategory] = useState("mountains");
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState(null);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [fontIdx, setFontIdx] = useState(0);
  const [overlay, setOverlay] = useState(50); // 0-100 darkening on photos
  const [downloading, setDownloading] = useState(false);

  const previewCanvasRef = useRef(null);

  const t = COLOR_THEMES[themeIdx];
  const size = SIZES[sizeIdx];
  const font = FONT_CHOICES[fontIdx];
  const photo = photos[photoIdx] || null;

  // ─── Fetch photos when category changes ───
  useEffect(() => {
    if (mode !== "photo") return;
    let cancelled = false;
    setPhotosLoading(true);
    setPhotosError(null);
    const cat = PHOTO_CATEGORIES.find((c) => c.id === photoCategory);
    fetch(`/api/photos?query=${encodeURIComponent(cat.query)}&orientation=square&per_page=20`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error === "not_configured") {
          setPhotosError("Photo backgrounds aren't set up yet.");
          setPhotos([]);
        } else if (!data.results?.length) {
          setPhotosError("No photos found. Try another category.");
          setPhotos([]);
        } else {
          setPhotos(data.results);
          setPhotoIdx(0);
          setPhotosError(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPhotosError("Couldn't load photos. Try again later.");
      })
      .finally(() => {
        if (!cancelled) setPhotosLoading(false);
      });
    return () => { cancelled = true; };
  }, [photoCategory, mode]);

  // ─── Helpers ───
  const wrapLines = useCallback((ctx, text, maxWidth) => {
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
    return lines;
  }, []);

  // ─── Draw to a given canvas (used for preview and download) ───
  const drawCanvas = useCallback(async (canvas, w, h) => {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const s = Math.min(w, h) / 1080;
    const pad = Math.round(40 * s);
    const innerPad = Math.round(100 * s);

    // ── Background ──
    if (mode === "photo" && photo) {
      // Draw the photo
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Cover-fit the image
          const ratio = Math.max(w / img.width, h / img.height);
          const drawW = img.width * ratio;
          const drawH = img.height * ratio;
          const dx = (w - drawW) / 2;
          const dy = (h - drawH) / 2;
          ctx.drawImage(img, dx, dy, drawW, drawH);
          resolve();
        };
        img.onerror = () => {
          // Fallback to solid color if photo fails
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, w, h);
          resolve();
        };
        img.src = photo.urls.regular;
      });

      // Dark overlay for readability
      ctx.fillStyle = `rgba(0, 0, 0, ${overlay / 100})`;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Solid color background
      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Colors for text overlay ──
    const textColor  = mode === "photo" ? "#ffffff" : t.text;
    const accentColor = mode === "photo" ? "#f1d272" : t.accent;

    // ── Decorative border (subtle) ──
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = mode === "photo" ? 0.7 : 1;
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.globalAlpha = 1;

    // ── Large decorative quote mark ──
    ctx.fillStyle = accentColor;
    const quoteSize = Math.round(180 * s);
    ctx.font = `${quoteSize}px ${font.family}`;
    ctx.globalAlpha = mode === "photo" ? 0.35 : 0.15;
    ctx.fillText("“", innerPad - Math.round(30 * s), pad + quoteSize + Math.round(30 * s));
    ctx.globalAlpha = 1;

    // ── Verse text — centered ──
    const fontSize = Math.round(42 * s);
    const lineHeight = Math.round(60 * s);
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${font.family}`;
    const maxWidth = w - innerPad * 2;
    const lines = wrapLines(ctx, content, maxWidth);

    const refSize = Math.round(30 * s);
    const refGap = Math.round(80 * s);
    const totalTextHeight = lines.length * lineHeight + refGap + refSize;
    const startY = Math.max(pad + quoteSize + Math.round(60 * s), (h - totalTextHeight) / 2);

    // Subtle text shadow on photos for legibility
    if (mode === "photo") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = Math.round(8 * s);
      ctx.shadowOffsetY = Math.round(2 * s);
    }
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], innerPad, startY + i * lineHeight);
    }
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // ── Reference ──
    ctx.fillStyle = accentColor;
    ctx.font = `italic ${refSize}px ${font.family}`;
    if (mode === "photo") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = Math.round(8 * s);
    }
    ctx.fillText("— " + reference, innerPad, startY + lines.length * lineHeight + refGap);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // ── Branding ──
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.5;
    ctx.font = `${Math.round(18 * s)}px system-ui`;
    ctx.fillText("thewaybible.app", innerPad, h - pad - Math.round(20 * s));

    // ── Photo credit ──
    if (mode === "photo" && photo) {
      ctx.textAlign = "right";
      ctx.font = `${Math.round(14 * s)}px system-ui`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(`Photo: ${photo.author} / ${photo.source || "Pexels"}`, w - innerPad, h - pad - Math.round(20 * s));
      ctx.textAlign = "left";
    }
    ctx.globalAlpha = 1;
  }, [mode, photo, overlay, t, font, content, reference, wrapLines]);

  // ─── Draw preview on changes ───
  useEffect(() => {
    if (previewCanvasRef.current) {
      // Render at preview resolution (scaled down for perf)
      const previewW = Math.min(size.w, 540);
      const previewH = previewW * (size.h / size.w);
      drawCanvas(previewCanvasRef.current, previewW, previewH);
    }
  }, [drawCanvas, size]);

  // ─── Download at full resolution ───
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      await drawCanvas(canvas, size.w, size.h);
      const link = document.createElement("a");
      link.download = `${reference.replace(/[\s:]/g, "_")}_${size.label.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  // ─── Render ───
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto animate-slide-up overflow-hidden max-h-[95vh] flex flex-col">

          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-cream-dark/60">
            <h3 className="text-sm font-semibold text-warm-brown">Share as Image</h3>
            <button onClick={onClose} className="text-warm-brown-light hover:text-warm-brown">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Preview */}
          <div className="px-5 pt-4 pb-2">
            <div className="rounded-xl overflow-hidden border border-cream-dark bg-cream-dark/30 mx-auto" style={{ maxWidth: 320 }}>
              <canvas ref={previewCanvasRef} className="w-full h-auto block" />
            </div>
          </div>

          {/* Scrollable controls */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">

            {/* Mode toggle: Color vs Photo */}
            <div className="grid grid-cols-2 gap-1.5 mb-4 bg-cream-dark/30 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMode("color")}
                className={`py-2 text-xs font-medium rounded-lg transition-colors ${mode === "color" ? "bg-white text-warm-brown shadow-sm" : "text-warm-brown-light"}`}
              >
                Color
              </button>
              <button
                type="button"
                onClick={() => setMode("photo")}
                className={`py-2 text-xs font-medium rounded-lg transition-colors ${mode === "photo" ? "bg-white text-warm-brown shadow-sm" : "text-warm-brown-light"}`}
              >
                Photo
              </button>
            </div>

            {/* Color theme picker */}
            {mode === "color" && (
              <div className="mb-4">
                <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Color theme</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_THEMES.map((th, i) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setThemeIdx(i)}
                      className={`flex flex-col items-center py-2 rounded-lg border-2 transition-colors ${themeIdx === i ? "border-gold" : "border-transparent hover:border-cream-dark"}`}
                      title={th.name}
                    >
                      <span className="block w-8 h-8 rounded-full border border-cream-dark mb-1" style={{ backgroundColor: th.bg }} />
                      <span className="text-[10px] text-warm-brown-light">{th.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo controls */}
            {mode === "photo" && (
              <div className="mb-4">
                <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Photo category</p>
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                  {PHOTO_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPhotoCategory(cat.id)}
                      className={`whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full transition-colors ${photoCategory === cat.id ? "bg-gold text-white" : "bg-cream text-warm-brown hover:bg-cream-dark"}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {photosLoading && (
                  <div className="flex items-center gap-2 text-xs text-warm-brown-light py-3 px-1">
                    <div className="w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    Loading photos…
                  </div>
                )}

                {photosError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">{photosError}</p>
                )}

                {!photosLoading && !photosError && photos.length > 0 && (
                  <>
                    <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Pick a photo</p>
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {photos.slice(0, 12).map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPhotoIdx(i)}
                          className={`relative rounded-lg overflow-hidden border-2 aspect-square transition-colors ${photoIdx === i ? "border-gold" : "border-transparent hover:border-cream-dark"}`}
                        >
                          <img src={p.urls.small} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Darken overlay</p>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      value={overlay}
                      onChange={(e) => setOverlay(parseInt(e.target.value))}
                      className="w-full accent-gold mb-1"
                    />
                  </>
                )}
              </div>
            )}

            {/* Font picker */}
            <div className="mb-4">
              <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Font</p>
              <div className="grid grid-cols-5 gap-1.5">
                {FONT_CHOICES.map((f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontIdx(i)}
                    className={`py-2 rounded-lg border text-[11px] transition-colors ${fontIdx === i ? "border-gold bg-gold/5 text-gold" : "border-cream-dark text-warm-brown-light hover:border-gold/30"}`}
                    style={{ fontFamily: f.family }}
                  >
                    Aa
                    <span className="block text-[9px] text-warm-brown-light/70 mt-0.5">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size picker */}
            <div>
              <p className="text-[10px] font-medium text-warm-brown-light uppercase tracking-wider mb-2">Size</p>
              <div className="grid grid-cols-3 gap-1.5">
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
            </div>
          </div>

          {/* Download */}
          <div className="px-5 py-4 border-t border-cream-dark/60">
            <button
              onClick={handleDownload}
              disabled={downloading || (mode === "photo" && (!photo || photosLoading))}
              className="w-full bg-gold text-white rounded-xl py-3 text-sm font-semibold hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {downloading ? "Generating…" : `Download ${size.label} (${size.w}×${size.h})`}
            </button>
            {mode === "photo" && photo && (
              <p className="text-[10px] text-warm-brown-light/70 text-center mt-2">
                Photo by{" "}
                <a href={photo.authorUrl} target="_blank" rel="noreferrer" className="underline">
                  {photo.author}
                </a>{" "}
                on {photo.source || "Pexels"}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
