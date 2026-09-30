/** Canonical v wins over the legacy verse parameter, including when invalid. */
export function requestedVerse(search, verses) {
  const params = new URLSearchParams(search);
  const raw = params.has("v") ? params.get("v") : params.get("verse");
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isSafeInteger(number) && verses?.some((verse) => verse.verse === number) ? number : null;
}
