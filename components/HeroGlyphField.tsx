"use client";

import { useEffect, useRef } from "react";
import HebrewWatermark from "@/components/HebrewWatermark";

/**
 * Interactive shell around the shared Hebrew watermark, used by the hero
 * and again by the closing section at the foot of the homepage.
 * The watermark itself lives in HebrewWatermark (identical to the copy
 * inside the scripture intro overlay, including the per-row CSS drift).
 *
 * Adds, for the hero only:
 *  - word-level cursor repulsion (drift-aware: word centres account for
 *    each row's current drift offset),
 *  - a proximity glow: words near the cursor brighten with a soft halo,
 *  - the sequential shimmer: one word at a time, its characters cycling
 *    through a travelling highlight wave; when it finishes, another word
 *    somewhere else takes over — a continuous loop, one region at a time,
 *  - a scroll-linked fade-out of the whole layer past the hero. The
 *    closing section keeps its field up instead: it is the last thing on
 *    the page, so there is nothing to fade out of the way of.
 *
 * Reduced motion: static watermark — no repulsion, glow or shimmer (the
 * drift is disabled in CSS); the positional scroll fade is kept.
 */

const RADIUS = 150; // px repulsion field
const PUSH = 40; // px max displacement
const GLOW_RADIUS = 150; // px proximity glow — a tight pool around the cursor
const FADE_DISTANCE = 0.55; // of viewport height scrolled → fully faded

const CHAR_WAVE_MS = 620; // keep in sync with .shimmer-ch duration
const CHAR_STAGGER_MS = 60;

/* Irregular cadence: mostly quick hand-offs, occasionally a longer
   breath, so the sequence never reads as mechanical. */
const nextWordGap = () => {
  const r = Math.random();
  if (r < 0.12) return 700 + Math.random() * 900; // occasional pause
  return 30 + Math.random() * 320; // usually quick
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function HeroGlyphField({
  variant = "hero",
}: {
  /** "closing" keeps the field up and drops the hero's bottom fade. */
  variant?: "hero" | "closing";
} = {}) {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current!;
    const isHero = variant === "hero";
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const cleanups: (() => void)[] = [];

    /* The closing field fades in on its own as the section arrives.
       Without this it was at full strength the moment it mounted, so the
       verses were already burning through behind the tail of the Contact
       section, which reads as two backgrounds fighting. The ramp is
       deliberately long: nothing is visible until the section's top has
       climbed most of the way up the viewport, and it only reaches full
       strength once the section owns the screen. */
    if (!isHero) {
      let inRaf = 0;
      const applyIn = () => {
        inRaf = 0;
        const vh = window.innerHeight;
        const top = field.getBoundingClientRect().top;
        // The window ends short of the viewport top because this is the
        // last section on the page: it can never scroll higher than the
        // gap the nav bar leaves, so a ramp aimed at top = 0 would stop
        // at roughly four fifths and never finish.
        const o = Math.max(0, Math.min(1, (vh * 0.72 - top) / (vh * 0.52)));
        field.style.opacity = o.toFixed(3);
        field.style.visibility = o === 0 ? "hidden" : "visible";
      };
      const onScroll = () => {
        if (!inRaf) inRaf = requestAnimationFrame(applyIn);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      applyIn();
      cleanups.push(
        () => window.removeEventListener("scroll", onScroll),
        () => {
          if (inRaf) cancelAnimationFrame(inRaf);
        },
      );
    }

    /* Scroll-linked fade-out of the whole layer — hero only. */
    if (isHero) {
      let fadeRaf = 0;
      const applyFade = () => {
        fadeRaf = 0;
        const o = Math.max(
          0,
          Math.min(1, 1 - window.scrollY / (window.innerHeight * FADE_DISTANCE)),
        );
        field.style.opacity = String(o);
        field.style.visibility = o === 0 ? "hidden" : "visible";
      };
      const onScroll = () => {
        if (!fadeRaf) fadeRaf = requestAnimationFrame(applyFade);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      applyFade();
      cleanups.push(
        () => window.removeEventListener("scroll", onScroll),
        () => {
          if (fadeRaf) cancelAnimationFrame(fadeRaf);
        },
      );
    }

    if (!reduced) {
      const rows = Array.from(field.querySelectorAll<HTMLElement>(".wm-row"));
      const words = Array.from(
        field.querySelectorAll<HTMLElement>(".glyph-item"),
      );
      const wordRow = words.map((el) =>
        rows.indexOf(el.parentElement as HTMLElement),
      );

      /* --- Repulsion + proximity glow -------------------------------- */
      let centers: { x: number; y: number }[] = [];
      const measure = () => {
        // The rows carry a transform (the drift animation), which makes
        // each row the words' offsetParent — so a word's offsetTop is
        // relative to its ROW, not the field. Compose field coordinates
        // from row.offsetTop + the word's in-row offsets. (Rows are
        // left-anchored at x=0, so in-row offsetLeft is already field-x.)
        centers = words.map((el, i) => {
          const row = rows[wordRow[i]];
          return {
            x: el.offsetLeft + el.offsetWidth / 2,
            y: row.offsetTop + el.offsetTop + el.offsetHeight / 2,
          };
        });
      };
      measure();
      document.fonts?.ready.then(measure);
      window.addEventListener("resize", measure);
      cleanups.push(() => window.removeEventListener("resize", measure));

      let moveRaf = 0;
      let pointer: { x: number; y: number } | null = null;
      let anyActive = false;

      const apply = () => {
        moveRaf = 0;
        const rect = field.getBoundingClientRect();
        const px = pointer ? pointer.x - rect.left : Number.NEGATIVE_INFINITY;
        const py = pointer ? pointer.y - rect.top : Number.NEGATIVE_INFINITY;
        // Rows drift via CSS animation; fold their live offset into the
        // word centres so the field tracks the moving text.
        const rowShift = rows.map((row) => {
          const t = getComputedStyle(row).transform;
          return t === "none" ? 0 : new DOMMatrixReadOnly(t).m41;
        });
        let active = false;
        for (let i = 0; i < words.length; i++) {
          const dx = centers[i].x + rowShift[wordRow[i]] - px;
          const dy = centers[i].y - py;
          const d = Math.hypot(dx, dy);
          const el = words[i];
          if (d < RADIUS && d > 0.01) {
            const f = (1 - d / RADIUS) ** 2 * PUSH;
            el.style.transform = `translate(${(dx / d) * f}px, ${(dy / d) * f}px)`;
            active = true;
          } else if (anyActive) {
            el.style.transform = "";
          }
          if (d < GLOW_RADIUS) {
            const g = 1 - d / GLOW_RADIUS;
            el.style.color = `color-mix(in srgb, var(--scripture) ${Math.round(6 + 30 * g)}%, transparent)`;
            el.style.textShadow = `0 0 ${Math.round(16 * g)}px rgba(243, 232, 179, ${(0.38 * g).toFixed(2)})`;
            active = true;
          } else if (anyActive && el.style.color) {
            el.style.color = "";
            el.style.textShadow = "";
          }
        }
        anyActive = active;
      };

      // Whether this field is on screen, asked of the field itself. It
      // used to be a hero-specific scroll test, which left the closing
      // section's copy permanently inert.
      const offScreen = () => {
        const r = field.getBoundingClientRect();
        return r.bottom < 0 || r.top > window.innerHeight;
      };

      const onMove = (e: PointerEvent) => {
        if (offScreen()) return;
        pointer = { x: e.clientX, y: e.clientY };
      };
      const onLeave = () => {
        pointer = null;
      };
      // `pointerover` fires when the cursor is already resting over the page
      // at load; without it the field stays dark until the user happens to
      // move the mouse.
      window.addEventListener("pointerover", onMove);
      window.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("pointerleave", onLeave);

      // The rows drift continuously, so the glow has to be recomputed every
      // frame — recomputing only on pointermove left the highlighted pool
      // frozen against moving text until the user jiggled the cursor.
      const tick = () => {
        moveRaf = requestAnimationFrame(tick);
        if (!pointer && !anyActive) return;
        if (offScreen()) return;
        apply();
      };
      moveRaf = requestAnimationFrame(tick);

      cleanups.push(() => {
        window.removeEventListener("pointerover", onMove);
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        if (moveRaf) cancelAnimationFrame(moveRaf);
      });

      // Re-measure once the intro hands over to the hero: the field is laid
      // out behind the overlay, and anything that shifts during the
      // handover would otherwise leave the centres stale until a resize.
      const onHandover = new MutationObserver(() => {
        if (!document.documentElement.classList.contains("intro-active")) {
          measure();
          onHandover.disconnect();
        }
      });
      onHandover.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      cleanups.push(() => onHandover.disconnect());

      /* --- Sequential word shimmer ----------------------------------- */
      // One word at a time: split it into characters, run a staggered
      // highlight wave across them, restore, then move to another word
      // scattered elsewhere. Loops for the life of the hero.
      let alive = true;
      (async () => {
        await sleep(600);
        while (alive) {
          const el = words[Math.floor(Math.random() * words.length)];
          const text = el.textContent ?? "";
          if (!text) continue;
          el.textContent = "";
          const chars = Array.from(text);
          chars.forEach((ch, k) => {
            const span = document.createElement("span");
            span.className = "shimmer-ch";
            span.textContent = ch;
            span.style.animationDelay = `${k * CHAR_STAGGER_MS}ms`;
            el.appendChild(span);
          });
          await sleep(CHAR_WAVE_MS + chars.length * CHAR_STAGGER_MS + 60);
          el.textContent = text;
          await sleep(nextWordGap());
        }
      })();
      cleanups.push(() => {
        alive = false;
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [variant]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none"
    >
      <div
        ref={fieldRef}
        className={`absolute inset-0 overflow-hidden ${
          variant === "hero" ? "hebrew-mask-fade" : ""
        }`}
      >
        <HebrewWatermark />
      </div>
    </div>
  );
}
