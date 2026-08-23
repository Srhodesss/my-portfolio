"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animate, onScroll, splitText, stagger } from "animejs";

/**
 * About — static layout (no pin, no parallax, no scroll-lag pairing with
 * the portrait). Reveals fire once on scroll into view, using Anime.js
 * text splitting:
 *
 *  - "Engineering products that move people" splits into WORDS, each
 *    fading in as a unit with a stagger.
 *  - "forward." splits into CHARACTERS, each fading in individually.
 *  - The supporting paragraph fades in as one block, no stagger.
 *
 * Reduced motion / no JS: nothing is split or hidden — plain static copy.
 */

const QUOTE_WORDS = "Engineering products that move people";
const QUOTE_CHARS = "forward.";

const PARA_1 =
  "I’m a creative problem solver, rooted in faith, making things that excite and help the people around me. My work sits between hardware, software and human behaviour, combining research, prototyping, CAD, UX, data and product thinking to build things that move people forward.";

const PARA_2 =
  "My faith shapes how I approach craft: with intention, stewardship and a desire to build things that serve people well.";

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const section = sectionRef.current!;
    const wordsEl = section.querySelector<HTMLElement>(".about-q-words")!;
    const charsEl = section.querySelector<HTMLElement>(".about-q-chars")!;
    const copyEl = section.querySelector<HTMLElement>(".about-copy")!;
    const imgEl = section.querySelector<HTMLElement>(".about-img")!;

    section.classList.add("about-live");

    // Word split for the opening clause.
    const wordSplit = splitText(wordsEl, { words: true, chars: false });
    // Character split for "forward."
    const charSplit = splitText(charsEl, { chars: true, words: false });

    // The CSS gate hides the PARENT so unsplit text never flashes. Once
    // the split exists, hide the pieces and hand the parent back — the
    // animations below drive the pieces. (Leaving the parent hidden is
    // what made this copy vanish entirely.)
    [...wordSplit.words, ...charSplit.chars].forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
    });
    wordsEl.style.opacity = "1";
    charsEl.style.opacity = "1";

    const enter = "bottom-=12% top";

    const wordAnim = animate(wordSplit.words, {
      opacity: [0, 1],
      y: [18, 0],
      duration: 720,
      delay: stagger(58),
      ease: "out(3)",
      autoplay: onScroll({ target: section, enter, repeat: false }),
    });

    const charAnim = animate(charSplit.chars, {
      opacity: [0, 1],
      y: [14, 0],
      duration: 560,
      // Begins as the word run is finishing.
      delay: stagger(34, { start: 520 }),
      ease: "out(3)",
      autoplay: onScroll({ target: section, enter, repeat: false }),
    });

    // Supporting copy: one block, all at once.
    // Opacity only — the drift effect below owns `transform`, so both
    // writing it each frame would fight.
    const copyAnim = animate(copyEl, {
      opacity: [0, 1],
      duration: 800,
      ease: "out(3)",
      autoplay: onScroll({
        target: copyEl,
        enter: "bottom-=8% top",
        repeat: false,
      }),
    });

    const imgAnim = animate(imgEl, {
      opacity: [0, 1],
      duration: 900,
      ease: "out(3)",
      autoplay: onScroll({ target: imgEl, enter: "bottom-=10% top", repeat: false }),
    });

    return () => {
      [wordAnim, charAnim, copyAnim, imgAnim].forEach((a) => a?.revert?.());
      wordSplit.revert();
      charSplit.revert();
      section.classList.remove("about-live");
    };
  }, []);

  /* Differential drift + focus. Everything rises as the section passes,
     but at different rates — heading slowest, copy a little quicker, the
     portrait quicker still — so the block reads with depth rather than
     moving as one slab. The portrait also resolves from soft to sharp.
     (Page scroll speed itself is handled by ScrollPacing.) */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current!;
    const head = section.querySelector<HTMLElement>(".about-quote")!;
    const copy = section.querySelector<HTMLElement>(".about-copy")!;
    const img = section.querySelector<HTMLElement>(".about-img")!;

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;
      // 0 as the section enters the bottom, 1 as it leaves the top.
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const t = p - 0.5;
      head.style.transform = `translate3d(0, ${(-t * 34).toFixed(2)}px, 0)`;
      copy.style.transform = `translate3d(0, ${(-t * 76).toFixed(2)}px, 0)`;
      img.style.transform = `translate3d(0, ${(-t * 128).toFixed(2)}px, 0)`;
      // Soft -> sharp across the first two-thirds of the pass.
      const focus = Math.min(1, Math.max(0, (p - 0.1) / 0.45));
      img.style.filter = `blur(${((1 - focus) * 10).toFixed(2)}px)`;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      [head, copy, img].forEach((el) => {
        el.style.transform = "";
        el.style.filter = "";
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="scroll-mt-12 overflow-x-clip py-28 md:py-40"
    >
      <p className="px-6 text-overline uppercase tracking-[0.05em] text-text-muted md:px-12 lg:px-20">
        About
      </p>

      {/* Single line from md up: sized in vw so the ratio of text width to
          container width is fixed — if it fits at one width it fits at
          every width. Wraps only on small screens. */}
      <p
        className="about-quote mt-10 px-6 font-display italic leading-[1.08] tracking-[-0.02em] md:whitespace-nowrap md:px-12 lg:px-20"
        style={{ fontSize: "clamp(26px, 3.15vw, 46px)" }}
      >
        <span className="about-q-words">{QUOTE_WORDS}</span>{" "}
        <span className="about-q-chars">{QUOTE_CHARS}</span>
      </p>

      <div className="mt-16 grid items-center gap-12 px-6 md:mt-20 md:px-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:px-20">
        <div className="about-copy">
          <p className="max-w-[54ch] text-body-m leading-relaxed text-text-secondary">
            {PARA_1}
          </p>
          <p className="mt-5 max-w-[54ch] text-body-m leading-relaxed text-text-secondary">
            {PARA_2}
          </p>
        </div>

        {/* Just under half the viewport, rounded on the left corners only,
            bleeding off the right edge (section clips overflow). */}
        <div className="about-img relative -mr-10 aspect-[4/5] w-[86%] justify-self-end overflow-hidden rounded-l-[36px] border border-border bg-black md:-mr-16 lg:-mr-[6vw] lg:w-[46vw]">
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
    </section>
  );
}
