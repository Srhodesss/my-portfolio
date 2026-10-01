"use client";

import { useEffect } from "react";

/**
 * Pauses decorative infinite animations in sections that are out of view.
 *
 * Measured with a Safari Timeline trace, parked on the bottom hero with
 * zero scroll input: Composite fired steadily and CPU sat pegged near
 * 24% indefinitely, with no Scroll or Layout records anywhere in the
 * recording. The cost was never the Contact-to-closing transition — that
 * only added to a permanent baseline and made it noticeable. The
 * baseline is 67 concurrent infinite CSS animations, 30 of them running
 * on content that is not on screen: the hero's 12 watermark rows and all
 * 18 skill shines, still holding composited layers and still ticking
 * from the bottom of the page.
 *
 * Gated by SECTION, deliberately, not by per-element visibility. The
 * closing section carries two watermark stacks — the resting one and the
 * torch's lit copy — as independent DOM subtrees running separate CSS
 * timelines that stay aligned only because they started together. The
 * lit copy sits at opacity 0 until the cursor lights it, so a "pause
 * what you can't see" gate would happily pause it alone, and it would
 * fall behind the resting copy by exactly the paused duration: at the
 * measured 15-26px/s drift, half a minute out of view is 450-780px of
 * offset, and the torch would reveal an obvious double image. Sharing a
 * section means both copies pause and resume together and their relative
 * phase is preserved by construction.
 *
 * animation-play-state, NOT animation: none — paused freezes in place
 * and resumes from the same point, where none resets to the start and
 * would visibly pop on re-entry. The rootMargin resumes a section before
 * it is on screen, so a frozen frame is never visible either.
 */
export default function AnimationGate() {
  useEffect(() => {
    // Reduced motion already disables every animation this would gate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = document.querySelectorAll<HTMLElement>("section");
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("anim-idle", !entry.isIntersecting);
        }
      },
      { rootMargin: "300px 0px" },
    );
    sections.forEach((section) => io.observe(section));

    return () => {
      io.disconnect();
      sections.forEach((section) => section.classList.remove("anim-idle"));
    };
  }, []);

  return null;
}
