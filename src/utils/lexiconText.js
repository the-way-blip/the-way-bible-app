export function firstMeaningfulText(...values) {
  return values.find((value) => typeof value === "string" && /[\p{L}\p{N}]/u.test(value))?.trim() || "";
}
export function translationList(word) {
  const entries = Array.isArray(word.kjv_translation_list) ? word.kjv_translation_list.filter((item) => typeof item === "string" && item.trim()) : [];
  return (entries.length ? entries : (word.kjv_def || "").split(",")).map((item) => item.trim()).filter(Boolean);
}
