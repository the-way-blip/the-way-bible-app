import { useApp } from "../stores/AppContext";
import strings from "../i18n/strings";

/**
 * Returns a translation function t(key, fallback?) scoped to the current UI language.
 *
 * Usage:
 *   const t = useT();
 *   <span>{t("nav.home")}</span>
 *
 * If the key is missing from the active language, falls back to English, then
 * to the optional second argument, then to the key itself.
 */
export default function useT() {
  const { language } = useApp();
  const lang = language || "en";

  return function t(key, fallback) {
    return (
      strings[lang]?.[key] ??
      strings["en"]?.[key] ??
      fallback ??
      key
    );
  };
}
