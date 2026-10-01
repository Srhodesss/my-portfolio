"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/SmoothScroll";
import { useStableVh } from "@/lib/use-stable-vh";

/**
 * Slows scrolling through the sections that deserve dwell — About,
 * Projects and Skills — without pinning them. While one of those
 * sections occupies the middle of the viewport, Lenis' input multipliers
 * are dialled down, so the same gesture advances the page much less: it
 * reads as heavy resistance, close to a pause, but the user is never
 * locked and can always keep moving.
 *
 * Reduced motion runs without Lenis, so this is inert there.
 */

// Per-section scroll multipliers: the lower the number, the more the
// section resists the same gesture. #work is a pinned sequence that owns
// its own timing on desktop, so it's excluded there — but on mobile the
// pills/folder sequence was reported as moving through too fast, so it
// gets the same dwell treatment there, added below mobile-only.
const SLOW_SECTIONS: Record<string, number> = {
  "#about": 0.38,
  "#skills": 0.26,
  "#contact": 0.32,
};

// Mobile-only overrides and additions, merged over SLOW_SECTIONS above —
// desktop's values are untouched either way. #skills/#contact were still
// reported as moving too fast on mobile even at the base values, so this
// lowers those two further there specifically; #work has no desktop
// value to override at all (see the comment above).
const MOBILE_SLOW_SECTIONS: Record<string, number> = {
  "#skills": 0.18,
  "#contact": 0.22,
  "#work": 0.32,
};

/**
 * Lenis applies the input multipliers inside its own VirtualScroll
 * instance, which keeps a private copy of the options — mutating
 * `lenis.options` alone has no effect. Set both so the change lands.
 */
type LenisLike = {
  options: { wheelMultiplier: number; touchMultiplier: number; lerp?: number };
  virtualScroll?: {
    options?: { wheelMultiplier: number; touchMultiplier: number };
  };
};

function setMultipliers(lenis: unknown, wheel: number, touch: number) {
  const l = lenis as LenisLike;
  l.options.wheelMultiplier = wheel;
  l.options.touchMultiplier = touch;
  if (l.virtualScroll?.options) {
    l.virtualScroll.options.wheelMultiplier = wheel;
    l.virtualScroll.options.touchMultiplier = touch;
  }
}

/* WebKit only, and only across the pinned Projects scrub: raise Lenis's
   lerp so it interpolates less and tracks the real scroll position more
   directly. Reported as Lenis helping generally but costing something in
   this one section specifically — which fits, since it is the only place
   where Lenis's own smoothing and a pinned scrubbed timeline are both
   trying to decide where the page is on the same frame. Lighter config
   rather than lenis.stop(): stopping would halt scrolling outright, and
   turning it off wholesale is what the ?lenis=off switch is for.

   Lerp only — the input multipliers are left alone so ScrollPacing's
   dwell values still mean what they say. Mutated here rather than from
   WorkSequence's own ScrollTrigger callbacks to keep one owner of Lenis's
   options, per the note above.

   UNVERIFIED, and weaker-founded than the rest: whether Lenis re-reads
   options.lerp per frame rather than caching it is not something reading
   this file settles. `?pinlerp=off` opts out for a trace. */
function setLerp(lenis: unknown, lerp: number) {
  (lenis as LenisLike).options.lerp = lerp;
}
const NORMAL_WHEEL = 1;
const NORMAL_TOUCH = 1;
const NORMAL_LERP = 0.1; // Lenis's own default
const PIN_LERP = 0.35;

// Contact's own reveal exposes its live progress as --contact-rp (see
// Contact.tsx) — this reads it directly rather than recomputing an
// independent proxy for the same value, so there's one authoritative
// place mutating Lenis's multipliers, not two that could disagree.
// "together." animates in across rp 0.5–0.74 there; that window gets a
// near-stop instead of the section's flat dwell multiplier, both
// platforms — a deliberate single moment of stillness, not a general
// slowdown.
const CONTACT_TOGETHER_WINDOW: readonly [number, number] = [0.5, 0.74];
const CONTACT_NEAR_PAUSE = 0.05;

/**
 * Mobile-only: the fraction of the remaining gap closed per frame while
 * easing into/out of a slow zone, instead of snapping instantly.
 *
 * On touch, Lenis applies `touchMultiplier` directly to raw touchmove
 * delta, so an instant multiplier change lands mid-gesture: the same
 * ongoing swipe suddenly produces very different scroll distance, which
 * reads as a snag right at the section boundary (reported as juddering
 * leaving the hero, and About "taking a moment" to arrive — the same
 * swipe was moving the page much less than expected). Desktop wheel
 * input is already discrete tick-by-tick, so the instant snap there
 * isn't felt the same way and is left as-is.
 */
const EASE = 0.15;
const EASE_DONE = 0.002;

export default function ScrollPacing() {
  const vhRef = useStableVh();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    const sections = isMobile
      ? { ...SLOW_SECTIONS, ...MOBILE_SLOW_SECTIONS }
      : SLOW_SECTIONS;

    const els = Object.entries(sections)
      .map(([sel, speed]) => {
        const el = document.querySelector<HTMLElement>(sel);
        return el ? { el, speed } : null;
      })
      .filter((e): e is { el: HTMLElement; speed: number } => !!e);
    if (!els.length) return;

    let current: number | null = null;
    let liveWheel = NORMAL_WHEEL;
    let liveTouch = NORMAL_TOUCH;
    let raf = 0;

    // See setLerp above. #work is not in the desktop slow-section list, so
    // it needs its own handle rather than riding on the `hit` below.
    const pinLerp =
      document.documentElement.classList.contains("wk") &&
      new URLSearchParams(window.location.search).get("pinlerp") !== "off";
    const workEl = pinLerp
      ? document.querySelector<HTMLElement>("#work")
      : null;
    let liveLerp: number | null = null;

    // Scroll position this last ran for. Every quantity below is derived
    // from where the page is, so an event at an unchanged position can
    // only recompute the answer it already has — and that is exactly what
    // happens at the very bottom of the page, where the position is
    // clamped at its maximum while events keep arriving from momentum and
    // rubber-banding. Measured there: 8 forced layout reads per scroll
    // event, 2 of them this function's own section scan (the els.find
    // below stops at the first hit, and at the foot of the page nothing
    // holds the middle, so it walks the whole list every time).
    // -1 so the first call always runs; resize clears it below, since
    // geometry can change with the position standing still.
    let lastY = -1;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      if (y === lastY) return;
      lastY = y;
      const lenis = getLenis();
      if (!lenis) return;
      // Mobile reads a debounced height instead of the live one — see
      // lib/use-stable-vh: iOS Chrome/Safari's toolbar show/hide changes
      // window.innerHeight mid-gesture, which was shifting this zone
      // boundary out from under an in-progress scroll.
      const mid = (isMobile ? vhRef.current : window.innerHeight) / 2;

      // #work spans its own pin spacer, so "holds the middle" is true for
      // the whole pinned scrub — exactly the range this is scoped to.
      if (workEl) {
        const wr = workEl.getBoundingClientRect();
        const want = wr.top <= mid && wr.bottom >= mid ? PIN_LERP : NORMAL_LERP;
        if (want !== liveLerp) {
          liveLerp = want;
          setLerp(lenis, want);
        }
      }

      // Which slow section, if any, holds the middle of the viewport?
      const hit = els.find(({ el }) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      let speed = hit ? hit.speed : null;
      // Mobile only. This near-stop shipped ungated and was dropping the
      // desktop multiplier to 0.05 through the whole "together." reveal —
      // a wheel barely moving the page, which is not a dwell, it reads as
      // the scroll having broken. Desktop keeps #contact's own 0.32 dwell
      // across the section either way; what it no longer gets is the
      // extra near-pause on top of it.
      if (isMobile && hit?.el.id === "contact") {
        const rp = parseFloat(
          getComputedStyle(hit.el).getPropertyValue("--contact-rp"),
        );
        if (
          Number.isFinite(rp) &&
          rp >= CONTACT_TOGETHER_WINDOW[0] &&
          rp <= CONTACT_TOGETHER_WINDOW[1]
        ) {
          speed = CONTACT_NEAR_PAUSE;
        }
      }
      const targetWheel = speed ?? NORMAL_WHEEL;
      const targetTouch = speed ?? NORMAL_TOUCH;

      if (!isMobile) {
        if (speed === current) return;
        current = speed;
        setMultipliers(lenis, targetWheel, targetTouch);
        // Reflect the current pacing so it is inspectable and stylable.
        document.documentElement.dataset.pacing = speed ? "slow" : "normal";
        return;
      }

      liveWheel += (targetWheel - liveWheel) * EASE;
      liveTouch += (targetTouch - liveTouch) * EASE;
      setMultipliers(lenis, liveWheel, liveTouch);
      document.documentElement.dataset.pacing = speed ? "slow" : "normal";
      if (
        Math.abs(targetWheel - liveWheel) > EASE_DONE ||
        Math.abs(targetTouch - liveTouch) > EASE_DONE
      ) {
        raf = requestAnimationFrame(apply);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    // Geometry moves without the position moving, so the guard above has
    // to be cleared here or a resize would be ignored until the next
    // actual scroll.
    const onResize = () => {
      lastY = -1;
      onScroll();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      const lenis = getLenis();
      if (lenis) setMultipliers(lenis, NORMAL_WHEEL, NORMAL_TOUCH);
      delete document.documentElement.dataset.pacing;
    };
  }, [vhRef]);

  return null;
}
