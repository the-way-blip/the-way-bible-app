// Cross-reference data from Treasury of Scripture Knowledge (OpenBible.info, CC-BY)
// Loaded lazily and cached in memory

let data = null;
let loading = null;

async function loadData() {
  if (data) return data;
  if (loading) return loading;
  loading = fetch("/data/cross-references.json")
    .then((r) => r.json())
    .then((d) => { data = d; return d; });
  return loading;
}

/**
 * Get cross-references for a specific verse
 * @returns {Promise<Array<{r: string, b: string, c: number, v: number}>>}
 */
export async function getCrossReferences(book, chapter, verse) {
  const d = await loadData();
  const key = `${book}-${chapter}`;
  return d[key]?.[verse] || [];
}

/**
 * Get all cross-references for a chapter (keyed by verse number)
 * @returns {Promise<Record<string, Array>>}
 */
export async function getChapterCrossReferences(book, chapter) {
  const d = await loadData();
  return d[`${book}-${chapter}`] || {};
}
