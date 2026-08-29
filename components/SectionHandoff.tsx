"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Hands one section over to the next the same way the pills hand over to
 * the Projects folder: the outgoing section fades completely out to the
 * page's black ground, the view rests on black for a beat, and only then
 * does the incoming section begin to fade in. The two never overlap, and
 * the outgoing section does not fade back in behind the new one.
 *
 * Both sections are driven directly — no veil layered on top — so black is
 * simply what is left when neither is showing.
 *
 * Reduced motion / no JS: both sections stay fully visible.
 */
export default function SectionHandoff({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const outgoing = document.querySelector<HTMLElement>(from);
    const incoming = document.querySelector<HTMLElement>(to);
    if (!outgoing || !incoming) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: incoming,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        })
        // 0 → 46%: the outgoing section clears out entirely.
        .fromTo(
          outgoing,
          { opacity: 1 },
          { opacity: 0, duration: 46, ease: "power2.in" },
          0,
        )
        // A short beat of black — long enough to register as a cut,
        // short enough not to read as dead scroll.
        .to({}, { duration: 6 }, 46)
        // 55 → 100%: the incoming section resolves out of that black.
        .fromTo(
          incoming,
          { opacity: 0 },
          { opacity: 1, duration: 48, ease: "power2.out" },
          52,
        );
    });

    return () => ctx.revert();
  }, [from, to]);

  return null;
}
