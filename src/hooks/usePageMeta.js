import { useEffect } from "react";

/**
 * Set per-page <meta> tags (description + Open Graph title/desc).
 * Restores previous values on unmount so the next page's setMeta hook can take over.
 */
export default function usePageMeta({ title, description, ogTitle, ogDescription }) {
  useEffect(() => {
    const setOrCreate = (selector, attr, value) => {
      let el = document.querySelector(selector);
      const prev = el?.getAttribute(attr);
      if (!el) {
        el = document.createElement("meta");
        const [, key, prop] = selector.match(/\[([^=]+)="([^"]+)"\]/) || [];
        if (key && prop) el.setAttribute(key, prop);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
      return prev;
    };

    const restore = [];

    if (description) {
      restore.push(["meta[name=\"description\"]", "content", setOrCreate("meta[name=\"description\"]", "content", description)]);
    }
    if (ogTitle || title) {
      restore.push(["meta[property=\"og:title\"]", "content", setOrCreate("meta[property=\"og:title\"]", "content", ogTitle || title)]);
      restore.push(["meta[name=\"twitter:title\"]", "content", setOrCreate("meta[name=\"twitter:title\"]", "content", ogTitle || title)]);
    }
    if (ogDescription || description) {
      restore.push(["meta[property=\"og:description\"]", "content", setOrCreate("meta[property=\"og:description\"]", "content", ogDescription || description)]);
      restore.push(["meta[name=\"twitter:description\"]", "content", setOrCreate("meta[name=\"twitter:description\"]", "content", ogDescription || description)]);
    }

    return () => {
      for (const [sel, attr, val] of restore) {
        const el = document.querySelector(sel);
        if (el && val) el.setAttribute(attr, val);
      }
    };
  }, [title, description, ogTitle, ogDescription]);
}
