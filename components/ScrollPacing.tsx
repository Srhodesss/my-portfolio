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

const SLOW_SECTIONS = ["#about", "#work", "#skills"];

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
const SLOW = 0.28; // fraction of normal scroll speed inside those sections
const NORMAL_WHEEL = 1;
const NORMAL_TOUCH = 1;

export default function ScrollPacing() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = SLOW_SECTIONS.map((s) =>
      document.querySelector<HTMLElement>(s),
    ).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;

    let slowed = false;
    let raf = 0;

    const apply = () => {
      raf = 0;
      const lenis = getLenis();
      if (!lenis) return;
      const mid = window.innerHeight / 2;
      // Is the viewport's middle inside one of the slow sections?
      const inside = els.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      if (inside === slowed) return;
      slowed = inside;
      setMultipliers(lenis, inside ? SLOW : NORMAL_WHEEL, inside ? SLOW : NORMAL_TOUCH);
      // Reflect the current pacing so it is inspectable and stylable.
      document.documentElement.dataset.pacing = inside ? "slow" : "normal";
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
