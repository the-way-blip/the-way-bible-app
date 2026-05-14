// Native platform utilities — uses Capacitor when running in iOS/Android,
// falls back to web APIs otherwise.

import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

// Haptic feedback — light tap for UI interactions
export async function hapticTap() {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

// Haptic feedback — medium for confirmations
export async function hapticConfirm() {
  if (!isNative) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
}

// Native share — falls back to Web Share API, then clipboard
export async function nativeShare({ title, text, url }) {
  if (isNative) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, url, dialogTitle: "Share" });
      return true;
    } catch {}
  }

  // Web Share API fallback
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {}
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(text || url || "");
    return "copied";
  } catch {}

  return false;
}
