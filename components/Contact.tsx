"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Contact — lukebaffait-style: one large confident heading with
 * "together." revealing letter by letter, a single "Contact me" call to
 * action, minimal supporting links. The section pins (+180%) so it
 * breathes instead of rushing past, matching the site's other pauses.
 *
 * Phone number and Portfolio PDF intentionally left out pending Sinai's
 * confirmation. LinkedIn URL and CV file are placeholders until supplied.
 * Reduced motion / no JS: fully visible, static, no pin.
 */

const LINKS = [
  // TODO: real LinkedIn profile URL from Sinai
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  // TODO: drop the real CV at public/cv.pdf
  { label: "CV", href: "/cv.pdf" },
];

const WORD = "together.";

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // The lead fades in as the section scrolls up into view — before
      // the pin engages — and reverses on the way back out.
      gsap.fromTo(
        ".contact-lead",
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            end: "top 30%",
            scrub: true,
          },
        },
      );

      // Durations in "percent of one viewport of scroll"; end matches the
      // timeline total so the hold reads as a real breath.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=140%",
          scrub: true,
          pin: pinRef.current,
        },
      });
      gsap.utils.toArray<HTMLElement>(".tg-ch").forEach((ch, i) => {
        tl.fromTo(
          ch,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 14, ease: "power3.out" },
          4 + i * 6,
        );
      });
      tl.fromTo(
        ".contact-cta",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 20, ease: "none" },
        72,
      );
      tl.to({}, { duration: 48 }, 92); // hold before release
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="contact" className="scroll-mt-12">
      <div
        ref={pinRef}
        className="flex min-h-svh flex-col justify-center px-6 py-16 md:px-12 lg:px-20"
      >
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          Contact
        </p>

        <h2
          className="mt-12 max-w-[14ch] font-semibold leading-[1.02] tracking-[-0.02em]"
          style={{ fontSize: "clamp(44px, 7.5vw, 116px)" }}
        >
          <span className="contact-lead">Let&rsquo;s build something </span>
          <span className="inline-block whitespace-nowrap font-display font-normal italic">
            {Array.from(WORD).map((ch, i) => (
              <span key={i} className="tg-ch inline-block">
                {ch}
              </span>
            ))}
          </span>
        </h2>

        <div className="contact-cta">
          <a
            href="mailto:sinai.r@icloud.com"
            className="group mt-14 inline-flex items-baseline gap-4 text-body-l font-medium transition-colors hover:text-accent md:text-heading"
          >
            Contact me
            <span
              aria-hidden
              className="inline-block text-accent transition-transform duration-300 group-hover:translate-x-2"
            >
              →
            </span>
          </a>

          <ul className="mt-16 flex gap-10">
            {LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
