"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * About — pinned, scroll-scrubbed reveal. Each phrase eases from blurred
 * and left-shifted to sharp and settled (a slight rightward drift);
 * "forward." carries extra travel to underline the word. Scrub means the
 * whole thing reverses naturally when scrolling back up, and the pin
 * (+150% scroll) gives the section a comfortable dwell before release.
 *
 * Copy is verbatim from CLAUDE.md §6, split into phrase spans only.
 * Reduced motion / no JS: everything fully visible and static.
 */

type Seg = { text: string; emph?: boolean };

const QUOTE: Seg[] = [
  { text: "Engineering products" },
  { text: "that move people" },
  { text: "forward.", emph: true },
];

const PARA_1: Seg[] = [
  { text: "I’m a creative problem solver," },
  { text: "rooted in faith," },
  { text: "making things that excite and help" },
  { text: "the people around me." },
  { text: "My work sits between hardware," },
  { text: "software and human behaviour," },
  { text: "combining research, prototyping," },
  { text: "CAD, UX, data and product thinking" },
  { text: "to build things that move people" },
  { text: "forward.", emph: true },
];

const PARA_2: Seg[] = [
  { text: "My faith shapes how I approach craft:" },
  { text: "with intention, stewardship" },
  { text: "and a desire to build things" },
  { text: "that serve people well." },
];

function Segments({ segs }: { segs: Seg[] }) {
  return (
    <>
      {segs.map((seg, i) => (
        <Fragment key={i}>
          <span
            className="about-seg inline-block"
            data-emph={seg.emph ? "" : undefined}
          >
            {seg.text}
          </span>
          {i < segs.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Durations are in "percent of one viewport of scroll" — the
      // ScrollTrigger end matches the timeline total, so a 100-unit pause
      // is one full viewport of dwell.
      const quoteSegs = gsap.utils.toArray<HTMLElement>(
        ".about-quote .about-seg",
      );
      const paraSegs = gsap.utils
        .toArray<HTMLElement>(".about-seg")
        .filter((s) => !quoteSegs.includes(s));

      const reveal = (seg: HTMLElement) => {
        const emph = seg.hasAttribute("data-emph");
        return [
          { autoAlpha: 0, x: emph ? -60 : -18, filter: "blur(10px)" },
          {
            autoAlpha: 1,
            x: 0,
            filter: "blur(0px)",
            duration: emph ? 34 : 22,
            ease: "none" as const,
          },
        ];
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=320%",
          scrub: true,
          // Inner pin: GSAP's pin-spacer stays inside this component's
          // DOM, clear of React's reconciliation of <main>'s children.
          pin: pinRef.current,
        },
      });

      // Pull quote reveals, then a breath on that line alone.
      quoteSegs.forEach((seg, i) => {
        const [from, to] = reveal(seg);
        tl.fromTo(seg, from, to, i * 14);
      });
      tl.to({}, { duration: 60 }, 62); // pause 1

      // Paragraph copy.
      paraSegs.forEach((seg, i) => {
        const [from, to] = reveal(seg);
        tl.fromTo(seg, from, { ...to, duration: i === 9 ? 28 : 18 }, 122 + i * 9);
      });

      tl.to({}, { duration: 55 }, 265); // pause 2

      // The drift and focus run on their own catch-up scrub (scrub: 1.8):
      // GSAP eases toward the scroll position rather than locking 1:1, so
      // the portrait keeps drifting and resolving for a beat after the
      // user stops, settling softly. The copy column shares the same
      // lagged timing so text and image travel together.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=320%",
            scrub: 1.8,
          },
        })
        .fromTo(
          ".about-img",
          { filter: "blur(9px)", scale: 1.04, y: 90 },
          {
            filter: "blur(0px)",
            scale: 1,
            y: -60,
            duration: 160,
            ease: "none",
          },
          100,
        )
        .fromTo(
          ".about-copy",
          { y: 40 },
          { y: -40, duration: 160, ease: "none" },
          100,
        )
        .to({}, { duration: 55 }, 265); // keep total length in sync
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="scroll-mt-12 overflow-x-clip"
    >
      <div
        ref={pinRef}
        className="flex min-h-svh flex-col justify-center px-6 py-16 md:px-12 lg:px-20"
      >
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          About
        </p>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
          <div className="about-copy">
            <p
              className="about-quote font-display italic leading-snug"
              style={{ fontSize: "clamp(28px, 3.2vw, 44px)" }}
            >
              <Segments segs={QUOTE} />
            </p>
            <p className="mt-8 max-w-[60ch] text-body-m leading-relaxed text-text-secondary">
              <Segments segs={PARA_1} />
            </p>
            <p className="mt-5 max-w-[60ch] text-body-m leading-relaxed text-text-secondary">
              <Segments segs={PARA_2} />
            </p>
          </div>

          {/* Just under half the viewport wide, rounded on the left
              corners only, bleeding off the right viewport edge (section
              clips the overflow). Blurred by default under motion,
              sharpening across the section's scroll — static and sharp
              under reduced motion / no JS. */}
          <div className="about-img relative -mr-10 aspect-[4/5] w-[86%] justify-self-end overflow-hidden rounded-l-[36px] border border-border bg-black md:-mr-16 lg:-mr-[6vw] lg:w-[46vw]">
            <Image
              src="/about/portrait.jpg"
              alt="Portrait of Sinai Rhodes"
              fill
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 100%" }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
