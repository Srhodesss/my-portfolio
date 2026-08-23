"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";

/**
 * About — no pin. Everything is driven continuously by the section's
 * scroll progress (anime.js `onScroll` style: progress-linked, not
 * enter/exit triggers), so scrubbing up or down responds frame by frame.
 *
 * Motion:
 *  - Copy and portrait share one transform, so they travel upward at the
 *    same pace. The travel curve is y = a·t + b·t³ (t = progress − 0.5),
 *    whose slope is smallest at the centre of the viewport and steepest
 *    at the edges — it slows through the middle without ever stopping.
 *  - The applied value is lerped toward the scroll-derived target each
 *    frame, so it eases to scroll position rather than locking to it.
 *  - Each phrase resolves continuously across its own slice of progress:
 *    opacity, blur, offset and weight all interpolate (Instrument Sans is
 *    a variable font, so weight animates smoothly).
 *
 * Copy is verbatim from CLAUDE.md §6, split into phrase spans only.
 * Reduced motion / no JS: everything visible, sharp and static.
 */

type Seg = { text: string; emph?: boolean };

const QUOTE_LINE = "Engineering products that move people forward.";

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

/* Shared travel curve: gentle through the centre, quicker at the edges. */
const TRAVEL = 118; // px of total drift across the section
const travelAt = (p: number) => {
  const t = Math.min(1, Math.max(0, p)) - 0.5;
  return -(0.45 * t + 2.2 * t * t * t) * TRAVEL * 2;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

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
  const driftRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const section = sectionRef.current!;
    const drift = driftRef.current!;
    const img = imgRef.current!;
    const segs = Array.from(
      section.querySelectorAll<HTMLElement>(".about-seg"),
    );
    const quote = section.querySelector<HTMLElement>(".about-quote");

    section.classList.add("about-live");

    let raf = 0;
    let eased = -1; // lerped progress; -1 = uninitialised

    const frame = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the section's top reaches the bottom of the viewport,
      // 1 as its bottom leaves the top.
      const target = clamp01(
        (vh - rect.top) / (vh + rect.height) || 0,
      );

      // Ease toward the scroll position rather than snapping to it.
      eased = eased < 0 ? target : eased + (target - eased) * 0.14;

      drift.style.transform = `translate3d(0, ${travelAt(eased).toFixed(2)}px, 0)`;

      // Portrait resolves from soft to sharp across the first two-thirds.
      const focus = clamp01((eased - 0.12) / 0.5);
      img.style.filter = `blur(${((1 - focus) * 9).toFixed(2)}px)`;
      img.style.transform = `scale(${(1 + (1 - focus) * 0.035).toFixed(4)})`;

      // Per-phrase continuous resolve across staggered windows.
      const span = 0.5 / Math.max(1, segs.length);
      segs.forEach((el, i) => {
        const start = 0.1 + i * span * 0.85;
        const p = clamp01((eased - start) / 0.16);
        el.style.opacity = String(p);
        el.style.filter = `blur(${((1 - p) * 7).toFixed(2)}px)`;
        const shift = el.hasAttribute("data-emph") ? 42 : 14;
        el.style.transform = `translate3d(${(-(1 - p) * shift).toFixed(2)}px,0,0)`;
      });

      if (quote) {
        const q = clamp01((eased - 0.04) / 0.22);
        quote.style.opacity = String(0.25 + q * 0.75);
        quote.style.fontVariationSettings = `"wght" ${(360 + q * 80).toFixed(0)}`;
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      section.classList.remove("about-live");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="scroll-mt-12 overflow-x-clip py-28 md:py-40"
    >
      <div ref={driftRef} className="will-change-transform">
        <p className="px-6 text-overline uppercase tracking-[0.05em] text-text-muted md:px-12 lg:px-20">
          About
        </p>

        {/* Single line from md up: the size is set in vw so the ratio of
            text width to container width is fixed — if it fits at one
            width it fits at every width. Wraps only on small screens. */}
        <p
          className="about-quote mt-10 px-6 font-display italic leading-[1.08] tracking-[-0.02em] md:whitespace-nowrap md:px-12 lg:px-20"
          style={{ fontSize: "clamp(26px, 3.15vw, 46px)" }}
        >
          {QUOTE_LINE}
        </p>

        <div className="mt-16 grid items-center gap-12 px-6 md:mt-20 md:px-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:px-20">
          <div className="about-copy">
            <p className="max-w-[54ch] text-body-m leading-relaxed text-text-secondary">
              <Segments segs={PARA_1} />
            </p>
            <p className="mt-5 max-w-[54ch] text-body-m leading-relaxed text-text-secondary">
              <Segments segs={PARA_2} />
            </p>
          </div>

          {/* Just under half the viewport, rounded on the left corners
              only, bleeding off the right edge (section clips overflow). */}
          <div
            ref={imgRef}
            className="about-img relative -mr-10 aspect-[4/5] w-[86%] justify-self-end overflow-hidden rounded-l-[36px] border border-border bg-black will-change-transform md:-mr-16 lg:-mr-[6vw] lg:w-[46vw]"
          >
            <Image
              src="/about/portrait.jpg"
              alt="Portrait of Sinai Rhodes"
              fill
              sizes="(min-width: 1024px) 46vw, 100vw"
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
