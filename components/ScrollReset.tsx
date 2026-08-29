"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { getLenis } from "@/components/SmoothScroll";

/**
 * Start every route at the top. Next scrolls the window to 0 on
 * navigation, but Lenis keeps its own scroll value and paints it back on
 * the next frame — so without this, moving between the homepage and the
 * Projects page (either direction) resumes the previous scroll position.
 *
 * We switch off the browser's automatic scroll restoration and, on every
 * pathname change, snap both the window and Lenis to the top. In-page
 * anchor links (#about, #skills, …) don't change the pathname, so their
 * smooth scrolling is untouched.
 */
export default function ScrollReset() {
  const pathname = usePathname();

  // Layout effect: the hash target is positioned BEFORE paint, so the new
  // route never renders a frame at the top on its way to the section.
  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    const hash = window.location.hash.slice(1);

    // With a hash the navigation is aimed at a section — coming back from a
    // case study to its own row in the index. Never touch scroll position
    // in that case until the target exists, otherwise the page visibly
    // snaps to the top first and then re-routes down to the section.
    if (hash) {
      // On a client-side navigation the arriving page renders
      // progressively, so the target's offset is still growing on the
      // first frames. Positioning immediately lands short and then visibly
      // drifts down as the rest mounts. Instead: hold the paint, wait for
      // the offset to stop changing, position once, then reveal — the
      // page never shows an intermediate scroll position.
      const root = document.documentElement;
      root.style.visibility = "hidden";

      let done = false;
      let last = Number.NaN;
      let stable = 0;
      const started = performance.now();

      const reveal = (el: HTMLElement | null) => {
        if (done) return;
        done = true;
        if (el) {
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(el, { immediate: true, force: true });
          else el.scrollIntoView({ block: "start" });
        }
        root.style.visibility = "";
      };

      const settle = () => {
        if (done) return;
        const el = document.getElementById(hash);
        const off = el ? Math.round(el.offsetTop) : Number.NaN;
        stable = off === last ? stable + 1 : 0;
        last = off;
        // Two identical frames is enough to know the layout has landed.
        if (el && stable >= 2) return reveal(el);
        if (performance.now() - started > 1200) return reveal(el);
        requestAnimationFrame(settle);
      };
      requestAnimationFrame(settle);

      return () => {
        done = true;
        root.style.visibility = "";
      };
    }

    const toTop = () => {
      window.scrollTo(0, 0);
      getLenis()?.scrollTo(0, { immediate: true, force: true });
    };
    toTop();
    const raf = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
