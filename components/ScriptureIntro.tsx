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

export default function ScriptureIntro() {
  const [phase, setPhase] = useState<"writing" | "leaving" | "done">("writing");
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
    const arm = setTimeout(() => setReady(true), FADE_START_MS);

    return () => {
      clearTimeout(arm);
      document.documentElement.classList.remove("intro-active");
    };
  }, []);

  /* Hand over to the hero: unlock scroll and fire the hero's staggered
     rise in the same frame the veil starts lifting. */
  const proceed = useCallback(() => {
    if (phase !== "writing") return;
    const root = document.documentElement;
    root.classList.remove("intro-active");
    root.classList.add("hero-revealing");
    setPhase("leaving");
    window.setTimeout(() => setPhase("done"), FADE_MS);
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
            style={{ fontSize: "clamp(24px, 3vw, 42px)", lineHeight: 1.45 }}
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
        <figcaption
          className="soft-fade mt-8 font-semibold text-text-muted"
          style={{
            // Same face as the cursor labels: the display sans, semibold,
            // tight — rather than the reference serif it used to carry.
            fontSize: "clamp(12px, 1vw, 14px)",
            letterSpacing: "-0.01em",
            animationDelay: `${ATTRIBUTION_DELAY_S.toFixed(2)}s`,
          }}
        >
          Exodus 31:3–4
        </figcaption>

        {/* Waits for the reader rather than timing out. Treated as a
            quiet typographic invitation rather than a UI button: the
            site's overline setting, a hairline that draws itself on
            hover, and the single orange accent the palette allows. */}
        <button
          type="button"
          onClick={proceed}
          className={`intro-cta group mt-16 inline-flex flex-col items-center gap-3 transition-opacity duration-1000 ease-out ${
            ready
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <span className="flex items-baseline text-overline uppercase tracking-[0.22em] text-text-muted">
            <RippleText arrow="right">Enter</RippleText>
          </span>
          {/* Hairline that draws out from the centre on hover. */}
          <span
            aria-hidden
            className="block h-px w-16 origin-center scale-x-100 bg-text-muted/35 transition-all duration-500 ease-out group-hover:w-24 group-hover:bg-accent"
          />
          <span className="sr-only">Proceed to the main site</span>
        </button>

      </figure>
    </div>
  );
}
