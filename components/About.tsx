"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

// Single source of truth for the quote's un-shrunk "ideal" size, read by
// both the JSX fallback below and the fit calculation — computing the
// ceiling straight from this formula (not from the DOM) matters: once the
// fit effect has shrunk the font for a narrow viewport, the applied
// font-size becomes a literal px value, and re-deriving "ideal" from that
// on a later, wider resize would ratchet it down forever instead of
// growing back to the true clamp() ceiling.
//
// Sized as a fixed multiple of the paragraph's own clamp() (--text-body-m:
// 17px / 1.4vw / 22px) rather than three independently-chosen numbers.
// The old 26/2.5/40 floated between 1.53x the paragraph at the floor and
// 1.82x at the ceiling — the pairing visibly loosened and tightened as
// the viewport changed size, which read as the two sizes not quite
// belonging together. A constant 1.7x holds the same relationship at
// every width instead.
const BODY_M_MIN_PX = 17;
const BODY_M_VW = 1.4;
const BODY_M_MAX_PX = 22;
const QUOTE_TO_BODY_RATIO = 1.7;
const QUOTE_MIN_PX = BODY_M_MIN_PX * QUOTE_TO_BODY_RATIO;
const QUOTE_MAX_PX = BODY_M_MAX_PX * QUOTE_TO_BODY_RATIO;
const QUOTE_VW = BODY_M_VW * QUOTE_TO_BODY_RATIO;
const quoteIdealPx = (viewportWidth: number) =>
  Math.min(QUOTE_MAX_PX, Math.max(QUOTE_MIN_PX, (viewportWidth * QUOTE_VW) / 100));

const PARA_1 =
  "My name is Sinai. I\u2019m a final year Design Engineering student at Imperial, working at the intersection of creativity and technical expertise, where good ideas meet practical solutions. With a keen eye for detail and a relentless drive for perfection, I strive to push the boundaries of design and engineering.";

const PARA_2 =
  "I believe design has the power to make an impact, not just in how something looks, but in how well it works and who it serves.";

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const [quoteSize, setQuoteSize] = useState<number | null>(null);

  /**
   * Force the quote onto a single line at every viewport width by shrinking
   * its font size to fit, measured rather than guessed. The old approach
   * was a hand-tuned mobile-only clamp() good for exactly the three phone
   * widths it was measured against (375/390/428) — it never covered
   * 768–1023px (no mobile override, desktop clamp floors at 26px) or,
   * worse, roughly 1024–1400px: the moment the `lg:` two-column grid
   * lands, the quote's column width roughly halves while the clamp's own
   * value barely moves, so real laptop widths (1024, 1280, 1366) wrapped
   * to two lines. Canvas-measuring the actual string against the actual
   * container holds at any width, including ones nobody thought to check.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const quoteEl = section.querySelector<HTMLElement>(".about-quote");
    if (!quoteEl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const fullText = `${QUOTE_WORDS} ${QUOTE_CHARS}`;

    const fit = () => {
      const cs = getComputedStyle(quoteEl);
      // The ceiling comes from the formula, not from cs.fontSize — that
      // would read back whatever this same effect last applied, ratcheting
      // the size down on every resize instead of recovering it on a wider
      // one. clientWidth still has to come from the DOM (only the browser
      // knows the container's real box after the grid breakpoint lands).
      const ideal = quoteIdealPx(window.innerWidth);
      const containerWidth = quoteEl.clientWidth;
      if (!ideal || !containerWidth) return;

      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${ideal}px ${cs.fontFamily}`;
      try {
        ctx.letterSpacing = cs.letterSpacing;
      } catch {
        /* Safari < 17 has no letterSpacing on canvas context; this
           heading's -0.02em tracking doesn't move the measurement enough
           to matter without it. */
      }
      const natural = ctx.measureText(fullText).width;
      // A small safety margin so sub-pixel rounding between the canvas
      // measurement and actual layout is never the difference between one
      // line and two.
      setQuoteSize(
        natural > containerWidth
          ? (ideal * containerWidth * 0.985) / natural
          : ideal,
      );
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(quoteEl);
    document.fonts?.ready?.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, []);

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
        <p className="section-label section-label-heading px-6 md:px-12 lg:px-20">
          About
        </p>

        {/* Heading and copy share the left column and are centred against
            the portrait, so the line sits at the middle-left of the
            image's vertical range rather than above it. */}
        <div className="mt-8 grid items-center gap-12 px-6 md:px-12 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-20">
          <div>
            <p
              className="about-quote whitespace-nowrap font-display italic leading-[1.08] tracking-[-0.02em]"
              style={{
                fontSize:
                  quoteSize != null
                    ? `${quoteSize}px`
                    : `clamp(${QUOTE_MIN_PX}px, ${QUOTE_VW}vw, ${QUOTE_MAX_PX}px)`,
              }}
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
