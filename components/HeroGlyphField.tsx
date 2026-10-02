"use client";

import { useEffect, useRef } from "react";
import HebrewWatermark from "@/components/HebrewWatermark";
import { useAfterIntro } from "@/lib/use-after-intro";
import { useStableVh } from "@/lib/use-stable-vh";

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
 * Both variants carry the bottom fade, which clears a band for the nav
 * bar sitting at the foot of each of these sections. Only the scripture
 * intro goes without it, and that renders HebrewWatermark directly.
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
  const isHero = variant === "hero";

  /* The hero's copy of the watermark (rows repeated 8x each for the
     seamless drift loop — on the order of 800 DOM nodes) used to mount
     immediately and unconditionally, at the exact moment the scripture
     intro overlay is building an IDENTICAL second copy of its own, on top
     of ~130 individually-delayed character animations already running.
     On a phone's CPU that's enough simultaneous main-thread work to
     visibly stall mid-reveal: characters that should land one at a time
     catch up in a single jump once the thread frees up, and the "Enter
     Site" CTA's own setTimeout can be delayed well past where a reader
     is still waiting for it — confirmed live, not assumed, once it was
     reported. Holding the hero's copy back until the intro is actually
     gone means only one ~800-node watermark exists during the intro's
     critical first few seconds, on the device where that margin matters.
     The closing variant has no intro competing with it and stays ready
     immediately, same as it always has. Desktop never had this reported
     and the flip happens in a layout effect, before the first paint, so
     it never sees so much as a flash — this only changes what a phone
     waits for. See lib/use-after-intro — Skills and WorkSequence gate
     their own heavy setup on the exact same signal, for the same reason. */
  const afterIntro = useAfterIntro();
  const ready = !isHero || afterIntro;
  const vhRef = useStableVh();

  /* Sits the mask's fade exactly on the name's own baseline instead of a
     fixed distance from the section — the verses used to stop short,
     leaving a gap before "SINAI Rhodes" on some viewports and running
     past it on others, because a flat pixel guess can't track where the
     name actually lands as it reflows. Same technique the closing
     section already uses to align the mountain to the name's baseline
     (--ms-foot in MountSinai.tsx: canvas-measured, not assumed) — see
     .hebrew-mask-fade in globals.css for the matching fade shape, kept
     in sync with .ms-field .ms-hebrew's so both sections use the same
     rule rather than two independently-drifting guesses. */
  useEffect(() => {
    if (!isHero) return;
    const field = fieldRef.current;
    if (!field) return;
    const section = field.closest<HTMLElement>("#hero");
    const span = section?.querySelector<HTMLElement>("h1 span span");
    if (!section || !span) return;
    const placeFoot = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      const cs = getComputedStyle(span);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText("SINAI");
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
      const half =
        (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const baseline =
        span.getBoundingClientRect().top + half + m.fontBoundingBoxAscent;
      const foot = section.getBoundingClientRect().bottom - baseline;
      if (Number.isFinite(foot)) {
        field.style.setProperty("--hero-foot", `${Math.round(foot)}px`);
      }
    };
    placeFoot();
    document.fonts?.ready.then(placeFoot);
    window.addEventListener("resize", placeFoot);
    return () => window.removeEventListener("resize", placeFoot);
  }, [isHero]);

  useEffect(() => {
    if (!ready) return;
    const field = fieldRef.current!;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    // Repulsion, proximity glow and the sequential shimmer all exist to
    // read as alive under a cursor that, on touch, is never there — same
    // gate the custom cursor and the pill glow already use. Left ungated
    // here, the shimmer loop in particular runs indefinitely, building
    // and tearing down character spans word after word for as long as
    // the hero is mounted, whether or not anything is watching it.
    const fine = window.matchMedia("(pointer: fine)").matches;

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
        // Mobile reads a debounced height instead of the live one — see
        // lib/use-stable-vh: iOS Chrome/Safari's toolbar show/hide changes
        // window.innerHeight mid-gesture, right as this fade runs.
        const vh = isMobile ? vhRef.current : window.innerHeight;
        const o = Math.max(
          0,
          Math.min(1, 1 - window.scrollY / (vh * FADE_DISTANCE)),
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

    /* The repulsion runs with the eased return, and without the ~1,472
       will-change hints the old default shipped. A ?glyph= switch used to
       select between those variants while that was being measured; the
       question is settled, so the winner is simply what runs. */
    if (!reduced && fine) {
      // Marks this field as the one that actually gets transforms written
      // to its words, so .glyph-item's transition can be scoped to it —
      // see the rule in globals.css for why that matters (every other
      // watermark copy on the page carried the same styling for a
      // transform it never receives).
      field.classList.add("glyph-live");
      cleanups.push(() => field.classList.remove("glyph-live"));
      const rows = Array.from(field.querySelectorAll<HTMLElement>(".wm-row"));
      const words = Array.from(
        field.querySelectorAll<HTMLElement>(".glyph-item"),
      );
      // closest(), not parentElement: the words are no longer direct
      // children of the row. HebrewWatermark wraps each tiling repeat in
      // a .wm-unit span so surplus repeats can be dropped per breakpoint,
      // which put a level between the two — parentElement then returned
      // the unit, indexOf gave -1, and rows[-1].offsetTop threw during
      // measure(), taking the whole page down with it. Addressing the row
      // by what it IS rather than by depth survives the next wrapper too.
      const wordRow = words.map((el) =>
        rows.indexOf(el.closest(".wm-row") as HTMLElement),
      );
      // The row math below indexes rows[] by these, so a word that found
      // no row would reintroduce exactly the same crash.
      if (wordRow.some((i) => i < 0)) {
        console.warn("HeroGlyphField: glyph outside .wm-row; skipping field");
        return;
      }

      /* --- Repulsion + proximity glow -------------------------------- */
      let centers: { x: number; y: number }[] = [];
      // Word indices grouped by row, plus each row's vertical band, so a
      // frame can discard whole rows before touching any of their words —
      // see apply(). Measured here rather than per frame because both
      // only change when the layout does.
      let rowWords: number[][] = [];
      let rowBand: { top: number; bottom: number }[] = [];
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
        rowWords = rows.map(() => []);
        words.forEach((_, i) => rowWords[wordRow[i]]?.push(i));
        rowBand = rows.map((row) => ({
          top: row.offsetTop,
          bottom: row.offsetTop + row.offsetHeight,
        }));
      };
      measure();
      document.fonts?.ready.then(measure);
      window.addEventListener("resize", measure);
      cleanups.push(() => window.removeEventListener("resize", measure));

      let moveRaf = 0;
      let pointer: { x: number; y: number } | null = null;
      // Indices written to last frame. Replaces the old `anyActive` flag:
      // with rows now culled before their words are visited, "everything
      // not in range this frame" is no longer a set the loop walks, so
      // what was touched has to be remembered to be cleared.
      let touched = new Set<number>();

      /* Takes the field's rect rather than reading it: tick() already
         needs one for its own on-screen test, and this used to take a
         second reading of the same box in the same frame. */
      const apply = (rect: DOMRect) => {
        moveRaf = 0;
        const px = pointer ? pointer.x - rect.left : Number.NEGATIVE_INFINITY;
        const py = pointer ? pointer.y - rect.top : Number.NEGATIVE_INFINITY;
        const next = new Set<number>();

        for (let r = 0; r < rows.length; r++) {
          const band = rowBand[r];
          if (!band) continue;
          /* Vertical cull, the whole point of this restructure. Nothing
             in a row can be in reach if the row's own band is further
             than the larger radius from the pointer, so the row's words
             are never visited and — more to the point — its transform is
             never resolved. This loop used to run all ~1,470 words and
             call getComputedStyle on all 12 rows every single frame,
             regardless of where the cursor was; in practice two or three
             rows are ever in range. */
          const dyBand =
            py < band.top ? band.top - py : py > band.bottom ? py - band.bottom : 0;
          if (dyBand > GLOW_RADIUS) continue;

          // Rows drift via CSS animation; fold their live offset into the
          // word centres so the field tracks the moving text. Only for
          // rows that survived the cull.
          const t = getComputedStyle(rows[r]).transform;
          const shift = t === "none" ? 0 : new DOMMatrixReadOnly(t).m41;

          for (const i of rowWords[r]) {
            const dx = centers[i].x + shift - px;
            const dy = centers[i].y - py;
            const d = Math.hypot(dx, dy);
            const el = words[i];
            let used = false;
            if (d < RADIUS && d > 0.01) {
              const f = (1 - d / RADIUS) ** 2 * PUSH;
              el.style.transform = `translate(${(dx / d) * f}px, ${(dy / d) * f}px)`;
              used = true;
            }
            if (d < GLOW_RADIUS) {
              const g = 1 - d / GLOW_RADIUS;
              el.style.color = `color-mix(in srgb, var(--scripture) ${Math.round(6 + 30 * g)}%, transparent)`;
              el.style.textShadow = `0 0 ${Math.round(16 * g)}px rgba(243, 232, 179, ${(0.38 * g).toFixed(2)})`;
              used = true;
            }
            if (used) next.add(i);
          }
        }

        // Clear only what actually carries a style, instead of assigning
        // "" across every word the cursor is not near. color/textShadow
        // are paint properties, so those writes were never free.
        for (const i of touched) {
          if (next.has(i)) continue;
          const el = words[i];
          el.style.transform = "";
          if (el.style.color) {
            el.style.color = "";
            el.style.textShadow = "";
          }
        }
        touched = next;
      };

      const onMove = (e: PointerEvent) => {
        // No on-screen test here any more: it cost a getBoundingClientRect
        // on every pointermove (far more often than a frame), and tick()
        // already refuses to apply anything while the field is off screen.
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
        // Nothing to do with no pointer and nothing left needing clearing.
        if (!pointer && touched.size === 0) return;
        // One read, handed to apply() — this and apply() used to take a
        // separate reading of the same box in the same frame.
        const rect = field.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        apply(rect);
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
  }, [variant, isHero, ready, vhRef]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none"
    >
      <div
        ref={fieldRef}
        className="hebrew-mask-fade absolute inset-0 overflow-hidden"
      >
        {ready && <HebrewWatermark />}
      </div>
    </div>
  );
}
