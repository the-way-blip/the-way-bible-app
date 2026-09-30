import { useEffect, useRef } from "react";

export default function useMobileDialog(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(max-width: 767px)");
    let release = () => {};
    const sync = () => {
      release();
      release = () => {};
      if (!media.matches || !ref.current) return;
      const dialog = ref.current;
      const previous = document.activeElement;
      const root = document.getElementById("root");
      const wasInert = root?.inert;
      if (root) root.inert = true;
      const controls = () => [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')].filter((el) => !el.disabled && el.getClientRects().length);
      (controls()[0] || dialog).focus();
      const keydown = (event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
        if (event.key !== "Tab") return;
        const items = controls();
        const first = items[0] || dialog;
        const last = items.at(-1) || dialog;
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      };
      dialog.addEventListener("keydown", keydown);
      release = () => {
        dialog.removeEventListener("keydown", keydown);
        if (root) root.inert = wasInert;
        if (previous?.isConnected) previous.focus({ preventScroll: true });
      };
    };
    sync();
    media.addEventListener("change", sync);
    return () => { media.removeEventListener("change", sync); release(); };
  }, [open, onClose]);
  return ref;
}
