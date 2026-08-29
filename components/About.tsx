"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { splitText } from "animejs";

/**
 * About — reveals are scroll-scrubbed, not fire-once. One Anime.js
 * timeline holds the whole sequence and its progress is linked directly
 * to scroll position (onScroll sync), so scrolling down reveals and
 * scrolling back up un-reveals, each in reverse order:
 *
 *  - "Engineering products that move people" splits into WORDS, rising in
 *    sequence.
 *  - "forward." splits into CHARACTERS, appearing one by one after them.
 *  - The supporting paragraph fades as one block.
 *  - The portrait resolves from blurred to sharp (and blurs back out on
 *    the way up).
 *
 * A separate rAF adds the differential drift (heading slowest, copy
 * quicker, portrait quicker still) so the block reads with depth.
 *
 * Reduced motion / no JS: nothing is split or hidden — plain static copy.
 */

const QUOTE_WORDS = "Engineering products that move people";
const QUOTE_CHARS = "forward.";

const PARA_1 =
  "I’m a creative problem solver, rooted in faith, and I make things that excite and help the people around me. My work sits between hardware, software and human behaviour. Research, prototyping, CAD, UX and data all feed the same thing, which is building products that move people forward.";

const PARA_2 =
  "My faith shapes how I approach craft. It means treating the work as something entrusted to me, and building things that actually serve the people who use them.";

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

    // Split the opening clause into words and "forward." into characters.
    const wordSplit = splitText(wordsEl, { words: true, chars: false });
    const charSplit = splitText(charsEl, { chars: true, words: false });

    // The CSS gate hides the PARENT so unsplit text never flashes. Hand the
    // parents back and hide the pieces — the rAF below drives each piece.
    [...wordSplit.words, ...charSplit.chars].forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
      (el as HTMLElement).style.willChange = "opacity, transform";
    });
    wordsEl.style.opacity = "1";
    charsEl.style.opacity = "1";

    const head = section.querySelector<HTMLElement>(".about-quote")!;
    // If the split ever yields nothing (a font/layout edge case, or a
    // future anime change), drive the parent spans directly instead of
    // silently animating an empty list and leaving the line blank.
    const words = (wordSplit.words as HTMLElement[]).length
      ? (wordSplit.words as HTMLElement[])
      : [wordsEl];
    const chars = (charSplit.chars as HTMLElement[]).length
      ? (charSplit.chars as HTMLElement[])
      : [charsEl];

    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    // Smoothstep, so each piece eases in/out of its own sub-window rather
    // than moving linearly.
    const smooth = (v: number) => {
      const c = clamp(v);
      return c * c * (3 - 2 * c);
    };

    // One scroll-linked loop owns everything: the differential drift
    // (heading slowest, copy quicker, portrait quicker still) AND the
    // reveal itself. Because every value is derived from the live scroll
    // position, scrolling down reveals and scrolling back up un-reveals —
    // each word/char/element in exact reverse — with no fixed-duration
    // triggers. #about is slowed by ScrollPacing, so it reads as heavy,
    // directly-controlled scroll.
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const vh = window.innerHeight;
      const r = section.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;

      const ib = imgEl.getBoundingClientRect();
      const inner = section.querySelector<HTMLElement>(".about-inner")!;

      // Everything is keyed to how far the portrait's centre still is from
      // the centre of the viewport, in viewport units. dNorm = 0 is the
      // moment the image is exactly vertically centred — equal black above
      // and below.
      const dNorm = (ib.top + ib.height / 2 - vh / 2) / vh;

      // Portrait: reaches full opacity and zero blur exactly at dNorm = 0.
      const ip = smooth(1 - dNorm / 0.55);
      imgEl.style.opacity = String(ip);
      imgEl.style.filter = `blur(${((1 - ip) * 12).toFixed(2)}px)`;

      // Text is keyed to ITS OWN position, not the portrait's. Deriving it
      // from the image meant the reveal depended on the portrait's height
      // relative to the viewport — so on some screens the text could sit
      // outside its window while the blur, reading the same value from the
      // other side, worked perfectly. That coupling was the bug.
      const qb = head.getBoundingClientRect();
      const rp = smooth((vh * 0.92 - qb.top) / (vh * 0.5));

      // Differential drift. Each element is offset vertically by its own
      // fraction of how far the block still is from its resting position,
      // so the heading lags, the paragraph runs a little ahead of it and
      // the portrait leads — the three planes separate as you scroll and
      // close back up as the block settles. Because the offset is a pure
      // function of the live scroll position (not a played animation), it
      // unwinds in exact reverse on the way back up.
      const drift = (ib.top + ib.height / 2 - vh / 2) / vh;
      head.style.transform = `translate3d(0, ${(drift * 34).toFixed(2)}px, 0)`;
      copyEl.style.transform = `translate3d(0, ${(drift * 58).toFixed(2)}px, 0)`;
      imgEl.style.transform = `translate3d(0, ${(drift * -26).toFixed(2)}px, 0)`;

      const HEAD_END = 0.55;
      const wSpan = HEAD_END * 0.6;
      const wStep = words.length > 1 ? wSpan / words.length : 0;
      words.forEach((el, i) => {
        const local = smooth((rp - i * wStep) / (HEAD_END - wSpan));
        el.style.opacity = String(local);
        el.style.transform = `translateY(${((1 - local) * 26).toFixed(2)}px)`;
      });
      const cStart = HEAD_END * 0.6;
      const cStep = chars.length ? (HEAD_END - cStart) * 0.5 / chars.length : 0;
      chars.forEach((el, j) => {
        const local = smooth(
          (rp - cStart - j * cStep) /
            (HEAD_END - cStart - cStep * chars.length),
        );
        el.style.opacity = String(local);
        el.style.transform = `translateY(${((1 - local) * 16).toFixed(2)}px)`;
      });

      // Paragraph follows the heading, still finishing before the portrait.
      copyEl.style.opacity = String(smooth((rp - 0.58) / 0.34));

      // Safety net. The reveal is finished by rp = 0.6; if any piece is
      // still dark past that point the driver has been out-run by
      // something in the environment, so pin it open rather than leaving
      // the reader with an invisible line.
      if (rp > 0.75) {
        for (const el of words) {
          if (+el.style.opacity < 1) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0px)";
          }
        }
        for (const el of chars) {
          if (+el.style.opacity < 1) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0px)";
          }
        }
        if (+copyEl.style.opacity < 1) copyEl.style.opacity = "1";
      }

      // Once the portrait has passed centre the whole block fades away, so
      // About is gone before the pills stage arrives.
      inner.style.opacity = String(smooth(1 + (dNorm + 0.12) / 0.5));
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      wordSplit.revert();
      charSplit.revert();
      [head, copyEl, imgEl].forEach((el) => {
        el.style.transform = "";
        el.style.filter = "";
        el.style.opacity = "";
      });
      section.classList.remove("about-live");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="flex min-h-svh scroll-mt-12 flex-col justify-center overflow-x-clip py-20"
    >
      <div className="about-inner">
        <p className="px-6 text-overline uppercase tracking-[0.05em] text-text-muted md:px-12 lg:px-20">
          About
        </p>

        {/* Heading and copy share the left column and are centred against
            the portrait, so the line sits at the middle-left of the
            image's vertical range rather than above it. */}
        <div className="mt-8 grid items-center gap-12 px-6 md:px-12 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-20">
          <div>
            <p
              className="about-quote font-display italic leading-[1.08] tracking-[-0.02em]"
              style={{ fontSize: "clamp(26px, 2.5vw, 40px)" }}
            >
              <span className="about-q-words">{QUOTE_WORDS}</span>{" "}
              <span className="about-q-chars">{QUOTE_CHARS}</span>
            </p>

            <div className="about-copy mt-8">
              <p className="max-w-[52ch] text-body-m leading-relaxed text-text-secondary">
                {PARA_1}
              </p>
              <p className="mt-5 max-w-[52ch] text-body-m leading-relaxed text-text-secondary">
                {PARA_2}
              </p>
            </div>
          </div>

          <div className="about-img relative -mr-10 aspect-[4/5] w-[76%] justify-self-end overflow-hidden rounded-l-[28px] border border-border bg-black md:-mr-16 lg:-mr-[5vw] lg:aspect-[6/5] lg:w-[47vw]">
            <Image
              src="/about/portrait.jpg"
              alt="Portrait of Sinai Rhodes"
              fill
              sizes="(min-width: 1024px) 47vw, 76vw"
              className="object-cover"
              style={{ objectPosition: "50% 28%" }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
