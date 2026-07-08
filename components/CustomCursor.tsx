"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Site-wide custom cursor: a small white dot locked to the pointer with a
 * thin accent ring easing behind it. Over interactive elements the ring
 * tightens and brightens while the dot shrinks. Over the /work cards the
 * whole thing yields to the "View" bubble.
 *
 * Fine pointers with motion allowed only — touch devices and
 * reduced-motion users keep the system cursor (the `cursor-on` class,
 * which hides the native pointer, is only ever added here).
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    document.documentElement.classList.add("cursor-on");
    gsap.set([dot, ring], { autoAlpha: 0 });

    const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

    let raf = 0;
    let px = 0;
    let py = 0;
    const applyDot = () => {
      raf = 0;
      dot.style.transform = `translate(${px}px, ${py}px)`;
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(applyDot);
      ringX(e.clientX);
      ringY(e.clientY);
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2, overwrite: "auto" });

      // e.target can be the window/document for synthetic events.
      const target = e.target instanceof Element ? e.target : null;
      const interactive = target?.closest(
        "a, button, [role='button'], input, textarea, select, label",
      );
      const yieldsToViewBubble = target?.closest(".work-panel a");
      dot.classList.toggle("cursor-hot", !!interactive);
      ring.classList.toggle("cursor-hot", !!interactive);
      dot.classList.toggle("cursor-suppressed", !!yieldsToViewBubble);
      ring.classList.toggle("cursor-suppressed", !!yieldsToViewBubble);
    };
    const onLeave = () => {
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.documentElement.classList.remove("cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      gsap.killTweensOf([dot, ring]);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} aria-hidden className="site-cursor-dot" />
      <div ref={ringRef} aria-hidden className="site-cursor-ring" />
    </>
  );
}
