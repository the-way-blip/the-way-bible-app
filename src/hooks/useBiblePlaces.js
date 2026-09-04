import { useEffect, useMemo, useState } from "react";
import { loadPlaces, isPlacesLoaded, getChapterPlaces } from "../services/biblePlaces";

/**
 * Geocoded biblical places referenced in a chapter.
 *
 * The 260 KB dataset is dynamically imported the first time any chapter asks
 * for it, so the very first render returns an empty list and the atlas
 * affordances appear a beat later. Every chapter after that resolves
 * synchronously from the in-memory index.
 *
 * The returned array is memoized, which also keeps the text-matching regex
 * cache in biblePlaces.js warm across re-renders.
 */
export default function useBiblePlaces(book, chapter) {
  const [ready, setReady] = useState(isPlacesLoaded);

  useEffect(() => {
    if (ready) return;
    let active = true;
    loadPlaces()
      .then(() => { if (active) setReady(true); })
      .catch(() => { /* atlas stays hidden; the reader is unaffected */ });
    return () => { active = false; };
  }, [ready]);

  const places = useMemo(
    () => (ready ? getChapterPlaces(book, chapter) : []),
    [ready, book, chapter]
  );

  return { places, loading: !ready };
}
