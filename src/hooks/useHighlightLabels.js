import { useEffect, useState } from "react";
import { getHighlightLabels } from "../utils/highlights";

/** The reader's names for highlight colours, kept current across the app. */
export default function useHighlightLabels() {
  const [labels, setLabels] = useState(getHighlightLabels);
  useEffect(() => {
    const update = () => setLabels(getHighlightLabels());
    window.addEventListener("theway:highlight-labels", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("theway:highlight-labels", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return labels;
}
