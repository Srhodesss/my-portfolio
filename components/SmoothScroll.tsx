"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Site-wide smooth scrolling. The live instance is shared through
 * `getLenis()` so in-page anchors (e.g. the /work sidebar) can hand their
 * scroll to Lenis instead of fighting it — a native `scrollTo` would be
 * overridden on the next Lenis frame.
 */
let instance: Lenis | null = null;
export const getLenis = () => instance;

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Native scrolling for users who prefer reduced motion (CLAUDE.md §9).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis();
    instance = lenis;

    let rafId = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return <>{children}</>;
}
