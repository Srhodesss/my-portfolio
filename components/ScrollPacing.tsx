"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/SmoothScroll";

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
// its own timing, so it is not listed here.
const SLOW_SECTIONS: Record<string, number> = {
  "#about": 0.38,
  "#skills": 0.26,
  "#contact": 0.32,
};

/**
 * Lenis applies the input multipliers inside its own VirtualScroll
 * instance, which keeps a private copy of the options — mutating
 * `lenis.options` alone has no effect. Set both so the change lands.
 */
type LenisLike = {
  options: { wheelMultiplier: number; touchMultiplier: number };
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
const NORMAL_WHEEL = 1;
const NORMAL_TOUCH = 1;

export default function ScrollPacing() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Object.entries(SLOW_SECTIONS)
      .map(([sel, speed]) => {
        const el = document.querySelector<HTMLElement>(sel);
        return el ? { el, speed } : null;
      })
      .filter((e): e is { el: HTMLElement; speed: number } => !!e);
    if (!els.length) return;

    let current: number | null = null;
    let raf = 0;

    const apply = () => {
      raf = 0;
      const lenis = getLenis();
      if (!lenis) return;
      const mid = window.innerHeight / 2;
      // Which slow section, if any, holds the middle of the viewport?
      const hit = els.find(({ el }) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      const speed = hit ? hit.speed : null;
      if (speed === current) return;
      current = speed;
      setMultipliers(
        lenis,
        speed ?? NORMAL_WHEEL,
        speed ?? NORMAL_TOUCH,
      );
      // Reflect the current pacing so it is inspectable and stylable.
      document.documentElement.dataset.pacing = speed ? "slow" : "normal";
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      const lenis = getLenis();
      if (lenis) setMultipliers(lenis, NORMAL_WHEEL, NORMAL_TOUCH);
      delete document.documentElement.dataset.pacing;
    };
  }, []);

  return null;
}
