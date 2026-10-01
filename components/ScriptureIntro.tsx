"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import HebrewWatermark from "@/components/HebrewWatermark";
import RippleText from "@/components/RippleText";

/* The verse is set on exactly two lines (manual break; each line is a
   nowrap block from md up, wrapping naturally only on small screens). */
const VERSE_LINES = [
  "“I have filled him with the Spirit of God, with ability and intelligence,",
  "with knowledge and all craftsmanship, to devise artistic designs.”",
];
const VERSE = VERSE_LINES.join(" ");

/* Per-line words with each word's starting character offset, so every
   glyph gets a global position in the write sequence. */
const LINES = (() => {
  let offset = 0;
  return VERSE_LINES.map((line) =>
    line.split(" ").map((word) => {
      const start = offset;
      offset += word.length;
      return { word, start };
    }),
  );
})();
const TOTAL_CHARS = VERSE.replace(/ /g, "").length;

/* Timeline (derived): glyph count × 40ms write, each glyph settling from
   warm to white over 1.6s behind the pen; attribution fades in as the
   write ends; fade to hero once the last glyph turns white. */
const CHAR_STAGGER = 0.04;
const WRITE_START = 0.4;
const CHAR_SETTLE_MS = 1600; // keep in sync with .intro-char duration
const WRITE_END_MS = (WRITE_START + TOTAL_CHARS * CHAR_STAGGER) * 1000;
const FADE_START_MS = Math.round(WRITE_END_MS + CHAR_SETTLE_MS + 200);
const FADE_MS = 700;
const ATTRIBUTION_DELAY_S = WRITE_END_MS / 1000 + 0.3;

/* A tap on the CTA both fires onClick AND triggers its own hover/focus
   ripple — the "Enter Site" wave (RippleText, 10 chars × 26ms stagger +
   360ms transition, the arrow one step further out) and the hairline
   underline (.intro-rule::after, 500ms flat). Calling proceed() straight
   from that same click cut the crossfade in on top of whichever of those
   was still travelling. This is the slower of the two (the arrow, at
   10*26 + 360 = 620ms) plus a small buffer, so the tap's own feedback
   always finishes before the veil starts lifting. */
const PROCEED_DELAY_MS = 650;

// Ideal size from the existing clamp(), read back once mounted rather
// than assumed, so a later resize recovers the true ceiling instead of
// ratcheting down from whatever this effect last applied — same reason
// About.tsx's quote-fit reads its ceiling from a formula, not from a
// previous run's own output.
const VERSE_MIN_PX = 24;
const VERSE_MAX_PX = 42;
const VERSE_VW = 3;
const verseIdealPx = (viewportWidth: number) =>
  Math.min(VERSE_MAX_PX, Math.max(VERSE_MIN_PX, (viewportWidth * VERSE_VW) / 100));

export default function ScriptureIntro() {
  const [phase, setPhase] = useState<"writing" | "leaving" | "done">("writing");
  const [ready, setReady] = useState(false);
  const [verseSize, setVerseSize] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // phase stays "writing" through the tap's own PROCEED_DELAY_MS hold, so
  // this is what stops a second tap or Enter press in that window from
  // scheduling a second transition.
  const proceedingRef = useRef(false);

  /* Both lines share one font-size (the clamp() below), fixed to nowrap
     at md+ so the verse holds its authored two-line break. Confirmed live
     in Safari (not Chrome, same window): the longer line (line 1) can
     render wide enough there to overflow the figure — .scripture-intro
     is overflow-y:auto, which the CSS spec computes overflow-x to auto
     too rather than leaving it visible, so an overflowing nowrap line is
     pushed out of view rather than visibly spilling, reading as the verse
     cutting off mid-sentence. Same canvas-measured fit as About.tsx's
     quote: shrink the shared size only as far as the wider of the two
     lines actually needs, so this still hits the full clamp() ceiling
     everywhere it already fit. */
  useEffect(() => {
    const figure = document.querySelector<HTMLElement>(".scripture-intro figure");
    if (!figure) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const fit = () => {
      const p = figure.querySelector<HTMLElement>(".scripture-verse");
      if (!p) return;
      const ideal = verseIdealPx(window.innerWidth);
      if (!ideal) return;
      // Below md, each line already wraps naturally (the nowrap class on
      // .block above is md: and up) — nothing here can overflow, so the
      // shrink this effect exists for would only needlessly undersize the
      // clamp() ceiling on a phone that was never at risk.
      if (!window.matchMedia("(min-width: 768px)").matches) {
        setVerseSize(ideal);
        return;
      }
      const cs = getComputedStyle(p);
      // px-8 either side is part of the box being measured against
      // (clientWidth already excludes padding), so no separate margin
      // needed here.
      const containerWidth = figure.clientWidth;
      if (!containerWidth) return;

      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${ideal}px ${cs.fontFamily}`;
      const widest = Math.max(
        ...VERSE_LINES.map((line) => ctx.measureText(line).width),
      );
      setVerseSize(
        widest > containerWidth ? (ideal * containerWidth * 0.98) / widest : ideal,
      );
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(figure);
    document.fonts?.ready?.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // The layout script only sets .intro-active when motion is allowed.
    // Without it (reduced motion) the overlay is already display:none via
    // the CSS guards, so leave it inert — no timers, no state changes.
    if (!document.documentElement.classList.contains("intro-active")) {
      return;
    }
    // Hand visibility control to React; the CSS no-JS guard steps aside.
    rootRef.current?.setAttribute("data-mounted", "");

    // The verse no longer times out into the hero. Once it has finished
    // writing, a CTA fades in and the intro simply waits — the reader
    // decides when to move on.
    //
    // This moment — the char-by-char reveal already done, the CTA just
    // sitting there waiting for a tap — is also the best point on the
    // whole page for anything else heavy to quietly initialize: the
    // reveal that needed the main thread to itself is finished, and the
    // reader hasn't dismissed yet, so nothing is competing with whatever
    // runs here. See lib/use-after-intro, which every below-the-fold
    // section's own GSAP setup waits on — it used to wait for
    // intro-active to be REMOVED instead, which is the moment the reader
    // taps through and immediately starts scrolling: the single worst
    // time to run it, not the best.
    const arm = setTimeout(() => {
      setReady(true);
      window.dispatchEvent(new Event("intro-settled"));
    }, FADE_START_MS);

    return () => {
      clearTimeout(arm);
      document.documentElement.classList.remove("intro-active");
    };
  }, []);

  /* Hand over to the hero: unlock scroll and fire the hero's staggered
     rise in the same frame the veil starts lifting — held off by
     PROCEED_DELAY_MS so the tap's own ripple/hairline feedback finishes
     first instead of being cut off by the crossfade starting underneath
     it (see PROCEED_DELAY_MS above). */
  const proceed = useCallback(() => {
    if (phase !== "writing" || proceedingRef.current) return;
    proceedingRef.current = true;
    window.setTimeout(() => {
      const root = document.documentElement;
      root.classList.remove("intro-active");
      root.classList.add("hero-revealing");
      setPhase("leaving");
      window.setTimeout(() => setPhase("done"), FADE_MS);
    }, PROCEED_DELAY_MS);
  }, [phase]);

  /* Enter/Space work as well as the click, and Escape skips ahead. */
  useEffect(() => {
    if (!ready || phase !== "writing") return;
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", " ", "Escape"].includes(e.key)) {
        e.preventDefault();
        proceed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, phase, proceed]);

  if (phase === "done") return null;

  return (
    <div
      ref={rootRef}
      className={`scripture-intro fixed inset-0 z-50 flex items-center justify-center bg-bg transition-opacity duration-700 ease-out ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Same watermark component and geometry as the hero background, so
          the overlay fade is a pixel-invariant crossfade (see
          HebrewWatermark). */}
      <div
        aria-hidden
        className="absolute inset-0 select-none overflow-hidden"
      >
        <HebrewWatermark />
      </div>

      <figure className="relative mx-auto max-w-none px-8 text-center">
        <blockquote>
          <p
            className="scripture-verse"
            style={{
              fontSize:
                verseSize != null
                  ? `${verseSize}px`
                  : `clamp(${VERSE_MIN_PX}px, ${VERSE_VW}vw, ${VERSE_MAX_PX}px)`,
              lineHeight: 1.45,
            }}
          >
            <span className="sr-only">{VERSE}</span>
            <span aria-hidden>
              {LINES.map((words, li) => (
                <span key={li} className="block md:whitespace-nowrap">
                  {words.map(({ word, start }, wi) => (
                    <Fragment key={wi}>
                      <span className="intro-word">
                        {Array.from(word).map((char, ci) => (
                          <span
                            key={ci}
                            className="intro-char"
                            style={{
                              animationDelay: `${(
                                WRITE_START +
                                (start + ci) * CHAR_STAGGER
                              ).toFixed(3)}s`,
                            }}
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                      {wi < words.length - 1 && " "}
                    </Fragment>
                  ))}
                </span>
              ))}
            </span>
          </p>
        </blockquote>
        {/* The figcaption stays a block so it owns its own line; the
            blurred pill is the span inside it, sized to the text. Styling
            the figcaption itself as inline-block put it in the inline flow
            beside the button below, and the two sat side by side rather
            than stacked. */}
        <figcaption
          className="soft-fade mt-8 text-center font-semibold text-text-muted"
          style={{
            // Same face as the cursor labels: the display sans, semibold,
            // tight — rather than the reference serif it used to carry.
            fontSize: "clamp(12px, 1vw, 14px)",
            letterSpacing: "-0.01em",
            animationDelay: `${ATTRIBUTION_DELAY_S.toFixed(2)}s`,
          }}
        >
          <span className="attribution">Exodus 31:3–4</span>
        </figcaption>

        {/* Waits for the reader rather than timing out. Treated as a
            quiet typographic invitation rather than a UI button: the
            site's overline setting, a hairline that draws itself on
            hover, and the single orange accent the palette allows. */}
        <button
          type="button"
          onClick={proceed}
          className={`intro-cta group mx-auto mt-16 flex w-fit flex-col items-center transition-opacity duration-1000 ease-out ${
            ready
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          {/* The hairline is drawn on this wrapper rather than as a
              sibling below, so it can be measured against the label
              itself: at rest it stops short of the arrow and sits under
              the words alone; on hover it runs out to the arrow's edge. */}
          <span className="intro-rule flex items-baseline text-overline uppercase tracking-[0.22em] text-text-muted">
            <RippleText arrow="right">Enter Site</RippleText>
          </span>
          <span className="sr-only">Proceed to the main site</span>
        </button>

      </figure>
    </div>
  );
}
