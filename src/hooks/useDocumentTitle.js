import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — TheWay Bible App` : "TheWay Bible App";
    return () => { document.title = prev; };
  }, [title]);
}
