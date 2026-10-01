"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide smooth scrolling. The live instance is shared through
 * `getLenis()` so in-page anchors (e.g. the /work sidebar) can hand their
 * scroll to Lenis instead of fighting it — a native `scrollTo` would be
 * overridden on the next Lenis frame.
 *
 * Driven by GSAP's own ticker rather than a separate requestAnimationFrame
 * loop, with Lenis's scroll pushed straight into ScrollTrigger.update.
 * This used to run its own independent rAF calling lenis.raf(time), with
 * nothing telling ScrollTrigger a scroll had even happened — two
 * unsynchronised loops, each reading/writing scroll position in whatever
 * order the browser happened to schedule them that frame. A plain
 * fade-on-scroll never showed it, but every PINNED, scrubbed timeline
 * (WorkSequence's pills/folder, Skills) depends on ScrollTrigger seeing
 * this frame's Lenis position, not last frame's. This is GSAP's own
 * documented Lenis integration, not a workaround — see
 * gsap.com/resources/Lenis.
 */
let instance: Lenis | null = null;
export const getLenis = () => instance;

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Native scrolling for users who prefer reduced motion (CLAUDE.md §9).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Desktop Safari runs on native scroll; everything else keeps Lenis.
       Confirmed by testing `?lenis=off` against the shipped build: the
       Contact-to-closing scroll that this project spent a long time
       chasing is smooth on native and is not on Lenis. Lenis's own
       maintainers document the Safari limits behind that (it caps at
       60fps there, and position:fixed lags on macOS pre-M1) — on WebKit,
       fighting native scroll costs more than working with it.

       DESKTOP Safari specifically, not WebKit generally. `wk` is stamped
       pre-paint in layout.tsx from navigator.vendor, which is true of
       every iOS browser as well as macOS Safari — too broad on its own.
       maxTouchPoints splits them: macOS Safari reports 0, iOS and
       iPadOS report 5 (iPadOS reports a desktop UA, so a UA test would
       get that one wrong). And it would be pointless there anyway —
       Lenis is constructed with its default syncTouch:false, so it never
       intercepts touch; verified live that touchmove is not cancelled
       and touch-action stays auto. Touch scrolling is ALREADY native on
       every phone, so this changes nothing for them.

       Safe to turn off: every getLenis() consumer already has a native
       branch (section-nav's jump/smoothToTop, ScrollReset, WorkIndex's
       goTo, ProjectPeek's optional-chained stop/start), built for the
       reduced-motion path above. ScrollTrigger falls back to its own
       native scroll listening with no change needed.

       The real loss, and it is a design loss rather than a perf dial:
       ScrollPacing bails when there is no Lenis to mutate, so on desktop
       Safari the per-section dwell AND the Contact "together" near-pause
       both go quiet. That was the accepted trade for the scroll itself
       being smooth.

       Both directions stay forceable for tracing: `?lenis=off` anywhere,
       `?lenis=on` to put Lenis back on desktop Safari. */
    const lenisParam = new URLSearchParams(window.location.search).get(
      "lenis",
    );
    const desktopSafari =
      document.documentElement.classList.contains("wk") &&
      navigator.maxTouchPoints === 0;
    if (lenisParam === "off" || (desktopSafari && lenisParam !== "on")) {
      document.documentElement.dataset.scroll = "native";
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    instance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // GSAP ticker time is seconds since it started; Lenis just needs a
    // monotonically increasing millisecond-scale clock to derive its own
    // delta from, so the *1000 doesn't need to be wall-clock accurate.
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    // Lenis already smooths scroll; GSAP's own catch-up-after-a-stall
    // smoothing fighting it on top was the other half of this.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return <>{children}</>;
}
