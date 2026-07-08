"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * One shared, subtle fade-up for any element marked `data-reveal`, so
 * sections that would otherwise hard-cut into view share the site's
 * entrance language instead of each inventing its own. CSS does the
 * motion; this only toggles `.is-in`.
 *
 * The hidden initial state is gated on `html.reveal-ready`, which is
 * added here only when JS runs and motion is allowed — so no-JS and
 * reduced-motion visitors always see the content (nothing stays at
 * opacity 0). Re-scans on route change since the layout persists.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    els.forEach((el) => {
      // Anything already in view on load reveals immediately (no flash-in
      // of above-the-fold content on navigation).
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.classList.add("is-in");
      } else {
        io.observe(el);
      }
    });

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
