"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Site-wide custom cursor: a thin accent ring with a white dot at its
 * centre. The dot is a CHILD of the ring, so the two share one position
 * and can never drift apart — previously the dot was written instantly
 * while the ring eased behind it, and the gap between them was visible on
 * every fast move.
 *
 * Over interactive elements the palette inverts: the dot turns orange and
 * the ring turns white. Over the folder the ring carries an "Open" label.
 * Over the /work cards the whole thing yields to the "View" bubble.
 *
 * Fine pointers with motion allowed only — touch devices and
 * reduced-motion users keep the system cursor (the `cursor-on` class,
 * which hides the native pointer, is only ever added here).
 */
/* The opening "Scroll" hint has no timeout. It stays up, nudging every
   three seconds, until the reader actually scrolls. */

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;
    document.documentElement.classList.add("cursor-on");
    gsap.set(ring, { autoAlpha: 0 });

    // One eased position drives the whole cursor. Short duration so it
    // still feels attached to the hand, but the dot and ring are the same
    // element tree and therefore always concentric.
    const toX = gsap.quickTo(ring, "x", { duration: 0.13, ease: "power3.out" });
    const toY = gsap.quickTo(ring, "y", { duration: 0.13, ease: "power3.out" });

    // The pointer position is tracked on move, but the hover STATE is
    // recomputed every frame from the element under the cursor. Deriving
    // it from the move event alone meant the folder only lit up once the
    // pointer wiggled, and stayed lit when the page scrolled out from
    // under a stationary cursor.
    let px = -1;
    let py = -1;

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      toX(px);
      toY(py);
      gsap.to(ring, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
    };

    // Opening hint: the cursor says what to do — but only once the
    // scripture intro has handed over to the hero. Showing it during the
    // intro told the reader to scroll a screen that isn't scrollable yet,
    // and stepped on the opening moment. The intro sets .intro-active on
    // <html> and drops it when it finishes, so wait for that; if it was
    // never set (reduced motion, a soft nav back to the homepage) the
    // hero is already up and the hint can start immediately.
    let hinting = false;
    let introWatch: MutationObserver | null = null;

    // The hint ends on the reader's first real scroll rather than on a
    // clock: a timeout either nags someone who has already understood or
    // gives up on someone still reading the hero. `startY` is the page
    // position when the hint appears, so an already-scrolled page or a
    // browser's restored scroll position does not count as movement.
    let startY = 0;
    const endHint = () => {
      if (!hinting) return;
      hinting = false;
      ring.classList.remove("cursor-hint");
      window.removeEventListener("scroll", onScrolled);
    };
    const onScrolled = () => {
      if (Math.abs(window.scrollY - startY) > 8) endHint();
    };

    const startHint = () => {
      if (window.location.pathname !== "/") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // If the reader has already started moving down the page they have
      // clearly worked out how to scroll — don't tell them to.
      if (window.scrollY > window.innerHeight * 0.25) return;
      hinting = true;
      startY = window.scrollY;
      window.addEventListener("scroll", onScrolled, { passive: true });
    };

    if (document.documentElement.classList.contains("intro-active")) {
      introWatch = new MutationObserver(() => {
        if (!document.documentElement.classList.contains("intro-active")) {
          introWatch?.disconnect();
          introWatch = null;
          startHint();
        }
      });
      introWatch.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    } else {
      startHint();
    }

    let stateRaf = 0;
    const syncState = () => {
      stateRaf = requestAnimationFrame(syncState);
      if (px < 0) return;
      const target = document.elementFromPoint(px, py);
      const interactive = target?.closest(
        "a, button, [role='button'], input, textarea, select, label",
      );
      const folder = target?.closest(".work-folder");

      if (hinting && !folder) {
        ring.classList.add("cursor-hint");
        ring.classList.remove("cursor-hot", "cursor-open");
        dot.classList.remove("cursor-hot");
        if (label.textContent !== "Scroll") label.textContent = "Scroll";
        return;
      }
      ring.classList.remove("cursor-hint");
      const yieldsToViewBubble = target?.closest(".work-panel a");

      ring.classList.toggle("cursor-hot", !!interactive && !folder);
      dot.classList.toggle("cursor-hot", !!interactive && !folder);
      ring.classList.toggle("cursor-open", !!folder);
      const want = folder ? "Open" : "";
      if (label.textContent !== want) label.textContent = want;
      ring.classList.toggle("cursor-suppressed", !!yieldsToViewBubble);
    };
    stateRaf = requestAnimationFrame(syncState);

    const onLeave = () => {
      gsap.to(ring, { autoAlpha: 0, duration: 0.25 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.documentElement.classList.remove("cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScrolled);
      introWatch?.disconnect();
      cancelAnimationFrame(stateRaf);
      gsap.killTweensOf(ring);
    };
  }, []);

  return (
    <div ref={ringRef} aria-hidden className="site-cursor-ring">
      <div ref={dotRef} className="site-cursor-dot" />
      <span ref={labelRef} className="site-cursor-label" />
    </div>
  );
}
