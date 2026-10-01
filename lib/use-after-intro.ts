"use client";

import { useLayoutEffect, useState } from "react";

/** Safari has historically shipped no requestIdleCallback; fall back to a
 *  short timeout so the flip still lands off the current tick everywhere. */
const idle: (fn: () => void) => void =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (fn) => window.requestIdleCallback(fn, { timeout: 800 })
    : (fn) => window.setTimeout(fn, 50);

/**
 * True once it's safe for a section's heavy client JS — GSAP timelines,
 * ScrollTrigger pin measurement, big tween construction — to actually
 * run.
 *
 * This used to flip the moment `intro-active` was REMOVED from <html> —
 * which is the exact moment a reader taps "Enter Site" and, typically,
 * the exact moment they start scrolling. Concentrating every deferred
 * section's setup into that one instant didn't remove the main-thread
 * contention this hook exists to avoid, it just relocated it from during
 * the intro's character reveal to during the reader's first scroll —
 * traded one reported bug (a stalled reveal) for three more (juddery
 * scroll leaving the hero, About arriving late, Projects stuttering).
 *
 * It now listens for `intro-settled`, dispatched once the character
 * reveal has actually finished and the "Enter Site" CTA is just sitting
 * there waiting for a tap (see ScriptureIntro) — the one point in the
 * whole sequence where the main thread has nothing else to do and the
 * reader hasn't acted yet. `intro-active` being removed is kept only as
 * a fallback for paths that skip the settle event entirely (a soft nav
 * back to "/", or if the intro were ever dismissed before it fires).
 *
 * The actual flip is additionally handed to the browser's own idle
 * queue rather than fired synchronously the instant either signal
 * lands, so independent consumers (WorkSequence, Skills, HeroGlyphField)
 * naturally spread across whatever idle time is actually available
 * frame to frame, instead of every one of them racing to do their setup
 * in the same tick.
 *
 * On desktop this is true immediately — always was, no problem reported
 * there — and the flip happens in a layout effect, before the first
 * paint, so desktop never sees so much as a frame's difference.
 */
export function useAfterIntro(): boolean {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (
      !window.matchMedia("(max-width: 767px)").matches ||
      !document.documentElement.classList.contains("intro-active")
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      idle(() => setReady(true));
    };

    window.addEventListener("intro-settled", settle);
    const obs = new MutationObserver(() => {
      if (!document.documentElement.classList.contains("intro-active")) {
        settle();
        obs.disconnect();
      }
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("intro-settled", settle);
      obs.disconnect();
    };
  }, []);

  return ready;
}
