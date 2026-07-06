"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Pinned descriptor-pill section (replaces the outline-word reveal, same
 * scroll mechanic). Six large serif-italic pill rows fill the viewport
 * under an "I am a..." heading; rows reveal sequentially on scroll,
 * drift marquee-style (odd left, even right, scrubbed), then everything
 * fades out before the pin releases into whatever follows.
 *
 * Reduced motion: no pin, no GSAP — rows sit static and visible.
 */

const SET_A = [
  "engineer",
  "designer",
  "product manager",
  "design engineer",
  "UX/UI specialist",
  "user researcher",
  "creative",
];
const SET_B = [
  "product specialist",
  "product designer",
  "industrial designer",
  "UX designer",
  "computational designer",
  "craftsman",
  "creative technologist",
];
const SET_C = [
  "systems thinker",
  "problem solver",
  "prototyper",
  "product strategist",
  "CAD modeller",
  "data analyst",
];

/* Each set loops to fill its row; sets alternate down the six rows. */
const ROWS = [SET_A, SET_B, SET_C, SET_A, SET_B, SET_C];

export default function RolePills() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".pill-row");
      // Durations are in "percent of one viewport of scroll" (end matches
      // the timeline total), so the post-reveal pause below is one full
      // viewport of dwell — a breath before release.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=405%",
          scrub: true,
          // Pin the inner wrapper (not the section) so GSAP's pin-spacer
          // stays inside this component's DOM, clear of React's
          // reconciliation of <main>'s children.
          pin: pinRef.current,
        },
      });

      tl.fromTo(
        ".pills-heading",
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 40, ease: "none" },
        0,
      );
      rows.forEach((row, i) => {
        tl.fromTo(
          row,
          { autoAlpha: 0, y: 90 },
          { autoAlpha: 1, y: 0, duration: 55, ease: "none" },
          40 + i * 30,
        );
      });

      // Autonomous marquee: constant slow speed, alternating direction,
      // looping seamlessly — decoupled from scroll entirely. Row content
      // is doubled, so translating by one copy's width (plus one gap)
      // loops without a visible seam.
      const SPEED = 42; // px per second
      rows.forEach((row, i) => {
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
        const shift = (row.scrollWidth + gap) / 2;
        gsap.fromTo(
          row,
          { x: i % 2 ? -shift : 0 },
          {
            x: i % 2 ? 0 : -shift,
            duration: shift / SPEED,
            ease: "none",
            repeat: -1,
          },
        );
      });

      // A viewport-height pause on the finished field, then fade out
      // before the pin releases.
      tl.to({}, { duration: 100 }, 245);
      tl.to(
        [".pills-heading", ...rows],
        { autoAlpha: 0, duration: 60, ease: "none" },
        345,
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} aria-label="Roles">
      <div
        ref={pinRef}
        className="flex min-h-svh flex-col justify-center overflow-hidden px-6 py-12 md:px-12 lg:px-20"
      >
        <p
          className="pills-heading font-normal tracking-[-0.01em] text-text-secondary"
          style={{ fontSize: "clamp(28px, 4vw, 56px)" }}
        >
          I am a...
        </p>
        <div className="mt-8 flex flex-1 flex-col justify-between gap-3 md:mt-10 md:gap-4">
          {ROWS.map((set, ri) => (
            <div key={ri} className="pill-row flex w-max items-center gap-4 md:gap-6">
              {[...set, ...set].map((label, i) => (
                <span key={i} className="pill">
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
