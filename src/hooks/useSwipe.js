import { useRef, useCallback } from "react";

export default function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const minSwipeDistance = 80;

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) < minSwipeDistance) return;

    if (distance > 0) {
      onSwipeLeft?.(); // swipe left = next
    } else {
      onSwipeRight?.(); // swipe right = prev
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
