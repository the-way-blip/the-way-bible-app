// In-app concordance — loaded from bundled data
// Returns all verses that use a given Strong's number

let concordanceCache = null;

async function getConcordance() {
  if (concordanceCache) return concordanceCache;
  const res = await fetch("/data/concordance.json");
  concordanceCache = await res.json();
  return concordanceCache;
}

export async function lookupConcordance(strongsNumber) {
  const data = await getConcordance();
  return data[strongsNumber] || [];
}

export async function lookupWebsters(word) {
  try {
    const res = await fetch(`/api/websters/${encodeURIComponent(word.toLowerCase())}`);
    if (!res.ok) return null;
    const html = await res.text();
    return parseWebstersHTML(html);
  } catch {
    return null;
  }
}

function parseWebstersHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  // Try to extract definition text from common patterns
  const defEl = doc.querySelector(".definition, .def, main p, article p, .content p");
  if (defEl) return defEl.textContent.trim().substring(0, 500);
  // Fallback: get body text
  const body = doc.body?.textContent?.trim();
  if (body && body.length > 50) return body.substring(0, 500);
  return null;
}
