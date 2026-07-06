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
          end: "+=470%",
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
      tl.to({}, { duration: 100 }, 62); // pause 1 — one viewport

      // Paragraph copy.
      paraSegs.forEach((seg, i) => {
        const [from, to] = reveal(seg);
        tl.fromTo(seg, from, { ...to, duration: i === 9 ? 32 : 20 }, 162 + i * 11);
      });

      // Portrait sharpens gradually across most of the section's scroll
      // while drifting upward toward the top of the viewport, fully
      // resolved and settled as the section completes.
      tl.fromTo(
        ".about-img",
        { filter: "blur(9px)", scale: 1.04, y: 90 },
        { filter: "blur(0px)", scale: 1, y: -60, duration: 210, ease: "none" },
        160,
      );

      tl.to({}, { duration: 100 }, 370); // pause 2 — one viewport
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="scroll-mt-12">
      <div
        ref={pinRef}
        className="flex min-h-svh flex-col justify-center px-6 py-16 md:px-12 lg:px-20"
      >
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          About
        </p>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
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

          {/* Flush against the right viewport edge (negative margins undo
              the section padding); rounded on the left corners only.
              Blurred by default under motion, sharpening at the end of
              the section's scroll — static and sharp under reduced
              motion / no JS. */}
          <div className="about-img relative -mr-6 aspect-[4/5] overflow-hidden rounded-[36px] border border-border bg-black md:-mr-12 lg:-mr-20 lg:w-[94%] lg:justify-self-end">
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
