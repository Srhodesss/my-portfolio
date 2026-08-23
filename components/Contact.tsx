"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate, onScroll, splitText, stagger } from "animejs";

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
  // TODO: real LinkedIn profile URL from Sinai
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  // TODO: drop the real CV at public/cv.pdf
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

    const enter = "bottom-=15% top";

    const a1 = animate(leadSplit.words, {
      opacity: [0, 1],
      y: [22, 0],
      duration: 720,
      delay: stagger(62),
      ease: "out(3)",
      autoplay: onScroll({ target: section, enter, repeat: false }),
    });

    // Characters arrive individually, sharpening from blur as they land.
    const a2 = animate(charSplit.chars, {
      opacity: [0, 1],
      y: [18, 0],
      filter: ["blur(9px)", "blur(0px)"],
      duration: 700,
      delay: stagger(42, { start: 380 }),
      ease: "out(3)",
      autoplay: onScroll({ target: section, enter, repeat: false }),
    });

    const a3 = animate(".contact-cta", {
      opacity: [0, 1],
      y: [20, 0],
      duration: 760,
      ease: "out(3)",
      autoplay: onScroll({ target: section, enter: "bottom-=30% top", repeat: false }),
    });

    // A short hold so the section breathes.
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=70%",
        pin: pinRef.current,
      });
    }, section);

    return () => {
      [a1, a2, a3].forEach((a) => a?.revert?.());
      leadSplit.revert();
      charSplit.revert();
      ctx.revert();
      section.classList.remove("contact-live");
    };
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
          <span className="contact-lead">{LEAD}</span>{" "}
          <span className="contact-together inline-block whitespace-nowrap font-display font-normal italic">
            {WORD}
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
