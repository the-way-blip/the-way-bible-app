import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — The Way` : "The Way";
    return () => { document.title = prev; };
  }, [title]);
}
