"use client";

import { useEffect, useRef } from "react";
import HebrewWatermark from "@/components/HebrewWatermark";

/**
 * Interactive shell around the shared Hebrew watermark in the hero.
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
 *  - scroll-linked fade-out of the whole layer past the hero.
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
const WORD_GAP_MS = 70;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function HeroGlyphField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current!;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /* Scroll-linked fade-out of the whole layer. */
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

    const cleanups: (() => void)[] = [
      () => window.removeEventListener("scroll", onScroll),
      () => {
        if (fadeRaf) cancelAnimationFrame(fadeRaf);
      },
    ];

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

      const onMove = (e: PointerEvent) => {
        if (window.scrollY > window.innerHeight) return; // hero out of view
        pointer = { x: e.clientX, y: e.clientY };
        if (!moveRaf) moveRaf = requestAnimationFrame(apply);
      };
      const onLeave = () => {
        pointer = null;
        if (!moveRaf) moveRaf = requestAnimationFrame(apply);
      };
      window.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        if (moveRaf) cancelAnimationFrame(moveRaf);
      });

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
          await sleep(WORD_GAP_MS);
        }
      })();
      cleanups.push(() => {
        alive = false;
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none"
    >
      <div
        ref={fieldRef}
        className="hebrew-mask absolute inset-0 overflow-hidden"
      >
        <HebrewWatermark />
      </div>
    </div>
  );
}
