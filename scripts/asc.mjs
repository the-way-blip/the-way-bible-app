// Minimal App Store Connect API client (ES256 JWT with the team API key).
import { createSign } from "crypto";
import { readFileSync } from "fs";
const KEY_ID = "LBW9GHQKX7", ISSUER = "eac6d3b0-9d24-4876-a49e-2ca3b9b8c4f3";
const KEY = readFileSync(`${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8`, "utf8");
function jwt() {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const msg = `${b({ alg: "ES256", kid: KEY_ID, typ: "JWT" })}.${b({ iss: ISSUER, iat, exp: iat + 600, aud: "appstoreconnect-v1" })}`;
  return `${msg}.${createSign("sha256").update(msg).sign({ key: KEY, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
}
export async function asc(path, method = "GET", body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method, headers: { Authorization: `Bearer ${jwt()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : null;
}
export const APP_ID = "6762105782";
