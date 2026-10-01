"use client";

import { useEffect, useRef } from "react";

/**
 * A `window.innerHeight` that only updates on a settled resize, not the
 * live value while the browser's own chrome (iOS Safari/Chrome's address
 * bar and bottom toolbar) is animating open or closed mid-scroll. Reading
 * the live value directly, per frame, feeds that chrome animation straight
 * into scroll-linked reveal math — visible as extra jitter specifically on
 * iOS Chrome, whose toolbar timing differs from Safari's for the same
 * gesture. Mobile-only by convention of its callers; desktop has no such
 * chrome and should keep reading `window.innerHeight` directly.
 *
 * Returns a ref, not state — callers read it inside their own rAF loop
 * and don't need a re-render when it settles.
 */
export function useStableVh() {
  const vh = useRef(typeof window !== "undefined" ? window.innerHeight : 0);

  useEffect(() => {
    vh.current = window.innerHeight;
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        vh.current = window.innerHeight;
      }, 200);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return vh;
}
