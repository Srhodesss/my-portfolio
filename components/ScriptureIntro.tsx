"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import HebrewWatermark from "@/components/HebrewWatermark";

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

    const fade = setTimeout(() => {
      // Swap classes in one frame: unlock scroll + fire the hero's staggered
      // rise so it lands as the veil lifts.
      const root = document.documentElement;
      root.classList.remove("intro-active");
      root.classList.add("hero-revealing");
      setPhase("leaving");
    }, FADE_START_MS);
    const unmount = setTimeout(() => setPhase("done"), FADE_START_MS + FADE_MS);

    return () => {
      clearTimeout(fade);
      clearTimeout(unmount);
      document.documentElement.classList.remove("intro-active");
    };
  }, []);

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
        className="hebrew-mask absolute inset-0 select-none overflow-hidden"
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
          className="scripture-ref soft-fade mt-8 font-medium text-text-muted"
          style={{
            fontSize: "clamp(12px, 1vw, 14px)",
            letterSpacing: "0.18em",
            animationDelay: `${ATTRIBUTION_DELAY_S.toFixed(2)}s`,
          }}
        >
          Exodus 31:3–4
        </figcaption>
      </figure>
    </div>
  );
}
