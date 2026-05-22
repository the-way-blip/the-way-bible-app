/**
 * Lightweight in-memory per-IP rate limiter for serverless functions.
 *
 * Notes / caveats:
 * - This is *per-instance* state, so on Vercel's edge / serverless,
 *   different function instances have separate counters. For tiny apps
 *   (most of our traffic), this still blunts simple abuse — and we
 *   prefer a no-dependency, no-external-store solution at this stage.
 * - Use a real store (Redis/Upstash) if you need precise distributed limits.
 *
 * Usage:
 *   import { rateLimit } from "./_rateLimit";
 *   const limited = rateLimit(req, { windowMs: 60_000, max: 20 });
 *   if (limited) return res.status(429).json({ error: "Too many requests" });
 */
const buckets = new Map(); // ip → { count, resetAt }

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

/**
 * Returns true if the request should be REJECTED (rate-limited).
 * windowMs: window length in milliseconds (default 60s)
 * max: max requests per window per IP
 */
export function rateLimit(req, { windowMs = 60_000, max = 30 } = {}) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = buckets.get(ip);

  if (!entry || now > entry.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > max) return true;
  return false;
}

/**
 * Check that the request came from our own origin (or Vercel preview deploys).
 * Returns true if OK, false if it should be rejected.
 */
const ALLOWED_ORIGINS = [
  "https://thewaybible.app",
  "https://www.thewaybible.app",
  /\.vercel\.app$/,                 // any *.vercel.app preview
  "http://localhost:5173",          // local dev
  "http://localhost:4173",          // local preview
];

export function checkOrigin(req) {
  const origin = req.headers.origin || req.headers.referer || "";
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = `${url.protocol}//${url.host}`;
    return ALLOWED_ORIGINS.some((allow) => {
      if (allow instanceof RegExp) return allow.test(url.hostname);
      return host === allow;
    });
  } catch {
    return false;
  }
}
