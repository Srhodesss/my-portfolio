"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Pinned descriptor-pill section. Six marquee rows fill the viewport
 * under an "I am a..." heading; rows reveal in sequence, drift
 * continuously (odd left, even right), then fade before the pin releases.
 *
 * Two interactions layer on top:
 *  - Proximity glow: the nearer the cursor, the brighter each pill's
 *    edge, in the same warm yellow-white as the Hebrew watermark glow.
 *  - Drag: grab a pill and it lifts out of the row (re-parented to the
 *    body so the row's own transform can't trap it). Its slot collapses
 *    so the row closes the gap while still marqueeing; releasing flies
 *    the pill back to wherever its slot has drifted to and drops it in.
 *
 * Reduced motion: no pin, no drift, no glow, no drag — static rows.
 */

const SET_A = [
  "engineer",
  "designer",
  "product manager",
  "design engineer",
  "UX/UI specialist",
  "user researcher",
  "creative",
];
const SET_B = [
  "product specialist",
  "product designer",
  "industrial designer",
  "UX designer",
  "computational designer",
  "craftsman",
  "creative technologist",
];
const SET_C = [
  "systems thinker",
  "problem solver",
  "prototyper",
  "product strategist",
  "CAD modeller",
  "data analyst",
];

/* Each set loops to fill its row; sets alternate down the six rows. */
const ROWS = [SET_A, SET_B, SET_C, SET_A, SET_B, SET_C];

const GLOW_RADIUS = 260; // px — how far the cursor's influence reaches

export default function RolePills() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  /* ---- reveal, marquee, pin (unchanged mechanics) ------------------ */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".pill-row");
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=290%",
          scrub: true,
          pin: pinRef.current,
        },
      });

      tl.fromTo(
        ".pills-heading",
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 40, ease: "none" },
        0,
      );
      rows.forEach((row, i) => {
        tl.fromTo(
          row,
          { autoAlpha: 0, y: 90 },
          { autoAlpha: 1, y: 0, duration: 50, ease: "none" },
          30 + i * 24,
        );
      });

      // Autonomous marquee: constant slow speed, alternating direction.
      const SPEED = 42; // px per second
      rows.forEach((row, i) => {
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
        const shift = (row.scrollWidth + gap) / 2;
        gsap.fromTo(
          row,
          { x: i % 2 ? -shift : 0 },
          {
            x: i % 2 ? 0 : -shift,
            duration: shift / SPEED,
            ease: "none",
            repeat: -1,
          },
        );
      });

      tl.to({}, { duration: 55 }, 200);
      tl.to(
        [".pills-heading", ...rows],
        { autoAlpha: 0, duration: 35, ease: "none" },
        255,
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* ---- proximity glow ---------------------------------------------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current!;
    let raf = 0;
    let px = -1e9;
    let py = -1e9;

    const paint = () => {
      raf = 0;
      const pills = section.querySelectorAll<HTMLElement>(".pill");
      pills.forEach((pill) => {
        const r = pill.getBoundingClientRect();
        const dx = r.left + r.width / 2 - px;
        const dy = r.top + r.height / 2 - py;
        const d = Math.hypot(dx, dy);
        const g = d > GLOW_RADIUS ? 0 : (1 - d / GLOW_RADIUS) ** 2;
        pill.style.setProperty("--glow", g.toFixed(3));
      });
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      px = py = -1e9;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ---- drag out, gap-close, snap back ------------------------------ */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current!;
    const cleanups: (() => void)[] = [];

    section.querySelectorAll<HTMLElement>(".pill").forEach((pill) => {
      const slot = pill.parentElement as HTMLElement; // .pill-slot
      let dragging = false;
      let grabX = 0;
      let grabY = 0;
      let startRect: DOMRect | null = null;

      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        dragging = true;
        pill.setPointerCapture(e.pointerId);
        startRect = pill.getBoundingClientRect();
        // Respect where it was grabbed, not the element's centre.
        grabX = e.clientX - startRect.left;
        grabY = e.clientY - startRect.top;

        // Freeze the slot's current size, then collapse it so the row
        // closes the gap while the marquee keeps running.
        slot.style.width = `${startRect.width}px`;
        slot.style.flex = "0 0 auto";

        // Lift out: re-parent to the body so the row's transform (which
        // would otherwise become the containing block) can't trap it.
        document.body.appendChild(pill);
        pill.classList.add("pill-dragging");
        Object.assign(pill.style, {
          position: "fixed",
          left: `${startRect.left}px`,
          top: `${startRect.top}px`,
          width: `${startRect.width}px`,
          margin: "0",
          zIndex: "80",
        });
        gsap.to(pill, { scale: 1.06, duration: 0.22, ease: "back.out(2)" });
        gsap.to(slot, {
          width: 0,
          marginRight: 0,
          duration: 0.32,
          ease: "power3.out",
        });
      };

      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        pill.style.left = `${e.clientX - grabX}px`;
        pill.style.top = `${e.clientY - grabY}px`;
      };

      const finish = () => {
        if (!dragging) return;
        dragging = false;
        // Re-open the slot, then fly the pill to wherever that slot has
        // drifted to and drop it back into the flow.
        gsap.to(slot, {
          width: startRect ? startRect.width : "auto",
          duration: 0.34,
          ease: "power3.out",
          onComplete: () => {
            const target = slot.getBoundingClientRect();
            gsap.to(pill, {
              left: target.left,
              top: target.top,
              scale: 1,
              duration: 0.42,
              ease: "back.out(1.6)",
              onComplete: () => {
                pill.classList.remove("pill-dragging");
                pill.removeAttribute("style");
                slot.removeAttribute("style");
                slot.appendChild(pill);
              },
            });
          },
        });
      };

      pill.addEventListener("pointerdown", onDown);
      pill.addEventListener("pointermove", onMove);
      pill.addEventListener("pointerup", finish);
      pill.addEventListener("pointercancel", finish);
      cleanups.push(() => {
        pill.removeEventListener("pointerdown", onDown);
        pill.removeEventListener("pointermove", onMove);
        pill.removeEventListener("pointerup", finish);
        pill.removeEventListener("pointercancel", finish);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section ref={sectionRef} aria-label="Roles">
      <div
        ref={pinRef}
        className="flex min-h-svh flex-col justify-center overflow-hidden px-6 py-16 md:px-12 lg:px-20"
      >
        <p
          className="pills-heading font-normal tracking-[-0.01em] text-text-secondary"
          style={{ fontSize: "clamp(28px, 4vw, 56px)" }}
        >
          I am a...
        </p>
        <div className="mt-8 flex flex-1 flex-col justify-between gap-3 md:mt-10 md:gap-4">
          {ROWS.map((set, ri) => (
            <div
              key={ri}
              className="pill-row flex w-max items-center gap-4 md:gap-6"
            >
              {[...set, ...set].map((label, i) => (
                <span key={i} className="pill-slot inline-flex">
                  <span className="pill">{label}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
