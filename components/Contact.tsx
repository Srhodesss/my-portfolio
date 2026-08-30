"use client";

import { useEffect, useRef } from "react";
import { splitText } from "animejs";
import RippleText from "@/components/RippleText";
import FlipLink from "@/components/FlipLink";
import { getLenis } from "@/components/SmoothScroll";

/**
 * Contact — one large confident heading, a single call to action.
 *
 * Reveal matches About: "Let's build something" splits into WORDS (each
 * fading in as a unit, staggered); "together." splits into CHARACTERS,
 * each fading in individually and sharpening from blurred as it lands.
 * The section keeps a short pin so it breathes rather than rushing past.
 *
 * Phone number and Portfolio PDF intentionally left out pending Sinai's
 * confirmation. LinkedIn URL and CV file are placeholders until supplied.
 * Reduced motion / no JS: fully visible, static, no pin.
 */

const LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/sinairhodes/" },
  // Served from public/cv.pdf, copied from raw-assets/Sinai Rhodes CV.pdf
  // by scripts/sync-cv.sh so the served copy stays a clean URL.
  { label: "CV", href: "/cv.pdf" },
];

const LEAD = "Let’s build something";
const WORD = "together.";

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const section = sectionRef.current!;
    const leadEl = section.querySelector<HTMLElement>(".contact-lead")!;
    const wordEl = section.querySelector<HTMLElement>(".contact-together")!;
    section.classList.add("contact-live");

    const leadSplit = splitText(leadEl, { words: true, chars: false });
    const charSplit = splitText(wordEl, { chars: true, words: false });

    // Hide the split pieces, then hand the parents back — the CSS gate
    // only exists to stop unsplit text flashing before the split runs.
    [...leadSplit.words, ...charSplit.chars].forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
    });
    leadEl.style.opacity = "1";
    wordEl.style.opacity = "1";

    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const smooth = (v: number) => {
      const c = clamp(v);
      return c * c * (3 - 2 * c);
    };

    const words = leadSplit.words as HTMLElement[];
    const chars = charSplit.chars as HTMLElement[];
    const cta = section.querySelector<HTMLElement>(".contact-cta");

    // Scroll-linked, so the reveal runs forward on the way down and
    // exactly backwards on the way up — words un-reveal in reverse, the
    // characters re-blur — rather than firing once and staying put.
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const vh = window.innerHeight;
      const r = section.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;

      // Starts only once the black veil has peaked (BlackTransition tops
      // out as this section's top crosses mid-viewport), so the heading
      // resolves out of black rather than over the outgoing section.
      // 0.52 rather than 0.45: the reveal now completes a little earlier
      // in the section's travel, which is what lets the nav land with the
      // "Contact" title at the same clearance as every other section
      // instead of being held back waiting for the CTA to arrive.
      const rp = clamp((vh * 0.52 - r.top) / (vh * 0.6));

      const wStep = words.length > 1 ? 0.22 / words.length : 0;
      words.forEach((el, i) => {
        const local = smooth((rp - i * wStep) / 0.3);
        el.style.opacity = String(local);
        el.style.transform = `translateY(${((1 - local) * 22).toFixed(2)}px)`;
      });

      // "Let's build something" finishes at ~0.36. "together." holds off
      // until 0.5, so there is a clear beat between the two rather than
      // one running into the other.
      const cStep = chars.length ? 0.24 / chars.length : 0;
      chars.forEach((el, j) => {
        const local = smooth((rp - 0.5 - j * cStep) / 0.24);
        el.style.opacity = String(local);
        el.style.transform = `translateY(${((1 - local) * 18).toFixed(2)}px)`;
        el.style.filter = `blur(${((1 - local) * 9).toFixed(2)}px)`;
      });

      if (cta) {
        const c = smooth((rp - 0.72) / 0.24);
        cta.style.opacity = String(c);
        cta.style.transform = `translateY(${((1 - c) * 20).toFixed(2)}px)`;
      }
    };
    raf = requestAnimationFrame(frame);

  return () => {
      cancelAnimationFrame(raf);
      leadSplit.revert();
      charSplit.revert();
      section.classList.remove("contact-live");
    };
  }, []);

  /* Opening the mail client blurs the window, and on the way back the
     browser and Lenis can disagree about where the page was: Lenis holds
     its own scroll target and re-syncs to it on focus, which nudges the
     page off the position the reader left. Pin the position at the
     moment the link is used and put it back if it has drifted.

     Harmless when nothing moves, which is the case whenever the mail
     client opens in another space or the click is cancelled. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let parked: number | null = null;

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("a");
      if (!el?.getAttribute("href")?.startsWith("mailto:")) return;
      parked = window.scrollY;
    };

    const restore = () => {
      if (parked === null) return;
      const want = parked;
      // Two frames: one for the browser to finish restoring focus, one
      // for Lenis to have applied whatever it thinks the position is.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - want) > 2) {
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(want, { immediate: true, force: true });
            else window.scrollTo(0, want);
          }
          parked = null;
        }),
      );
    };

    section.addEventListener("click", onClick);
    window.addEventListener("focus", restore);
    document.addEventListener("visibilitychange", restore);
    return () => {
      section.removeEventListener("click", onClick);
      window.removeEventListener("focus", restore);
      document.removeEventListener("visibilitychange", restore);
    };
  }, []);

  return (
    <section ref={sectionRef} id="contact" className="scroll-mt-12">
      <div
        ref={pinRef}
        className="flex min-h-svh flex-col justify-center px-6 py-28 md:px-12 md:py-40 lg:px-20"
      >
        <p className="section-label section-label-heading">
          Contact
        </p>

        <h2
          className="mt-12 max-w-[14ch] font-semibold leading-[1.02] tracking-[-0.02em]"
          style={{ fontSize: "clamp(44px, 7.5vw, 116px)" }}
        >
          <span className="contact-lead">{LEAD}</span>{" "}
          <span className="contact-together inline-block whitespace-nowrap font-display font-normal italic">
            {WORD}
          </span>
        </h2>

        <div className="contact-cta">
          <a
            href="mailto:hello@sinairhodes.com"
            className="group has-rule relative mt-14 inline-flex items-baseline text-body-l font-medium md:text-heading"
          >
            <RippleText arrow="right">Contact me</RippleText>
            <span aria-hidden className="hover-rule" />
          </a>

          {/* Same word-flip and drawn underline as the nav bar, so every
              standing link on the site behaves the same way. */}
          <ul className="mt-16 flex gap-10">
            {LINKS.map(({ label, href }) => (
              <li key={label}>
                <FlipLink
                  href={href}
                  label={label}
                  external
                  underline
                  className="inline-flex items-center py-3 text-overline uppercase tracking-[0.05em] text-text-muted"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
