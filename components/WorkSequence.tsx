"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/lib/projects";
import { useProjectPeek, peekId } from "@/components/ProjectPeek";

/**
 * Work sequence — the pills and the Projects folder as ONE continuous
 * pinned scroll region, rather than two separate scroll areas.
 *
 * A single ScrollTrigger pins one viewport-sized stage; a scrubbed master
 * timeline carries the user through, in one motion:
 *   1. "I am a…" heading and the six descriptor rows reveal.
 *   2. The rows hold and drift (an autonomous marquee).
 *   3. The pills lift away as the Projects folder rises and resolves in
 *      their place — the same scroll that ends the pills begins the folder.
 *   4. The folder holds, fully revealed and interactive.
 *   5. The whole stage fades to black before the pin releases into Skills.
 *
 * Layered interactions survive the merge: cursor-proximity glow and
 * drag-out on the pills; spring hover and the shared-layout peek on the
 * folder sheets.
 *
 * Reduced motion / no JS: no pin, no timeline — the pills rows and the
 * folder simply sit in normal flow, static and visible (the `seq-live`
 * class that makes the stages overlap is only added by JS when motion is
 * allowed).
 */

/* ---- pills data ---------------------------------------------------- */
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
const ROWS = [SET_A, SET_B, SET_C, SET_A, SET_B, SET_C];

/* Short definitions shown on the reverse of each pill. Deliberately terse
   so the flip barely changes the pill's width and the row keeps its shape. */
const DEFINITIONS: Record<string, string> = {
  engineer: "makes it actually work",
  designer: "gives form to intent",
  "product manager": "decides what ships, and why",
  "design engineer": "designs it and builds it",
  "UX/UI specialist": "shapes how it feels to use",
  "user researcher": "finds out what people need",
  creative: "makes what wasn't there",
  "product specialist": "knows the product end to end",
  "product designer": "designs the whole experience",
  "industrial designer": "designs objects for manufacture",
  "UX designer": "designs the path through",
  "computational designer": "designs with code and geometry",
  craftsman: "cares how it is made",
  "creative technologist": "prototypes the not-yet-possible",
  "systems thinker": "sees how the parts connect",
  "problem solver": "finds the real problem first",
  prototyper: "builds to learn, fast",
  "product strategist": "aims the work at value",
  "CAD modeller": "draws it to be built",
  "data analyst": "turns numbers into decisions",
};

/* How long a flipped pill stays open before it turns back. */
/* The flip runs as three stages: widen, turn, hold — then the same in
   reverse. Each has its own duration so the sequence can be composed
   without the parts overlapping. Keep FLIP_WIDEN_MS and FLIP_TURN_MS in
   step with the .pill transition durations in globals.css. */
const FLIP_WIDEN_MS = 380;
const FLIP_TURN_MS = 620;
const FLIP_HOLD_MS = 2000;
const GLOW_RADIUS = 260;

/* ---- folder data --------------------------------------------------- */
const DOC_PROJECTS = projects;
const SPRING_IN = { duration: 0.42, ease: "back.out(2.2)" } as const;
const SPRING_OUT = { duration: 0.34, ease: "back.out(1.3)" } as const;
const PRESS = { duration: 0.12, ease: "power2.out" } as const;
const REST_DOC_Y = [3, 0, -3, -6, -9, -12];
const HOVER_DOC_Y = [-14, -19, -24, -29, -34, -39];

export default function WorkSequence() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const peek = useProjectPeek();
  const marqueeRef = useRef<gsap.core.Tween[]>([]);

  /* ---- master pinned timeline -------------------------------------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current!;
    root.classList.add("seq-live");
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const pillsStage = root.querySelector<HTMLElement>(".pills-stage")!;
      const projStage = root.querySelector<HTMLElement>(".projects-stage")!;
      const blackout = root.querySelector<HTMLElement>(".seq-blackout")!;
      const heading = root.querySelector<HTMLElement>(".pills-heading")!;
      const rows = gsap.utils.toArray<HTMLElement>(".pill-row");
      const word = root.querySelector<HTMLElement>(".work-bg-word")!;
      const folder = root.querySelector<HTMLElement>(".work-folder")!;
      const caption = root.querySelector<HTMLElement>(".seq-caption")!;

      // Starting states for the second half.
      gsap.set(projStage, { autoAlpha: 0 });
      gsap.set(folder, { scale: 0.9, y: 40 });
      gsap.set(caption, { autoAlpha: 0, y: 12 });
      gsap.set(blackout, { autoAlpha: 0 });
      gsap.set(word, { color: "rgba(160,160,160,0.10)" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: "+=420%",
          scrub: true,
          pin: pinRef.current,
          anticipatePin: 1,
        },
      });

      // 1 — pills reveal
      tl.fromTo(heading, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 10, ease: "power2.out" }, 0);
      rows.forEach((row, i) => {
        tl.fromTo(
          row,
          { autoAlpha: 0, y: 80 },
          { autoAlpha: 1, y: 0, duration: 16, ease: "power2.out" },
          8 + i * 7,
        );
      });

      // 2 — hold while the marquee drifts
      tl.to({}, { duration: 34 }, 100);

      // 3 — the pills fade ALL the way out to black first (ending at 166),
      // the stage rests on black, and only then does Projects begin. The
      // two stages never overlap.
      tl.to(pillsStage, { autoAlpha: 0, y: -50, duration: 34, ease: "power1.in" }, 132);

      // A beat of pure black between the two stages.
      tl.to({}, { duration: 12 }, 166);

      // 4 — Projects resolves out of the black
      tl.to(projStage, { autoAlpha: 1, duration: 34, ease: "power1.out" }, 178);
      tl.to(folder, { scale: 1, y: 0, duration: 50, ease: "power2.out" }, 178);
      tl.to(word, { color: "rgba(255,107,53,0.30)", duration: 64 }, 178);
      tl.to(caption, { autoAlpha: 1, y: 0, duration: 26, ease: "power1.out" }, 220);

      // 5 — hold the folder, fully revealed
      tl.to({}, { duration: 46 }, 246);

      // 6 — fade the whole stage to black before releasing into Skills.
      // The Projects stage itself is taken to zero as well, so nothing of
      // it is still rendered when Skills starts arriving underneath.
      tl.to(blackout, { autoAlpha: 1, duration: 36, ease: "power1.inOut" }, 296);
      tl.to(projStage, { autoAlpha: 0, duration: 30, ease: "power1.in" }, 300);
    }, rootRef);

    return () => {
      ctx.revert();
      root.classList.remove("seq-live");
    };
  }, []);

  /* ---- autonomous marquee (independent of scroll) ------------------ */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const SPEED = 42; // px / second
      marqueeRef.current = [];
      gsap.utils.toArray<HTMLElement>(".pill-row").forEach((row, i) => {
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
        const shift = (row.scrollWidth + gap) / 2;
        marqueeRef.current.push(
          gsap.fromTo(
            row,
            { x: i % 2 ? -shift : 0 },
            {
              x: i % 2 ? 0 : -shift,
              duration: shift / SPEED,
              ease: "none",
              repeat: -1,
            },
          ),
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* ---- proximity glow ---------------------------------------------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current!;
    let raf = 0;
    let px = -1e9;
    let py = -1e9;
    const paint = () => {
      raf = 0;
      root.querySelectorAll<HTMLElement>(".pill").forEach((pill) => {
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

  /* ---- click a pill to flip it, pausing the rows ------------------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current!;
    const cleanups: (() => void)[] = [];
    let openPill: HTMLElement | null = null;

    // The marquee tweens are registered on mount; pausing them holds the
    // rows still for long enough to read the definition.
    const setPaused = (paused: boolean) => {
      marqueeRef.current.forEach((tw) => (paused ? tw.pause() : tw.play()));
    };

    /* The open/close sequence runs in stages rather than all at once:
       the pill widens to fit its definition, THEN turns; on the way back
       it turns first and only then shrinks. Doing both together made the
       pill appear to grow sideways mid-rotation, which read as one
       muddled movement instead of two clear ones. */
    const timers: number[] = [];
    const after = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };
    const clearStages = () => {
      timers.splice(0).forEach((id) => window.clearTimeout(id));
    };

    /* The definition is out of flow so it cannot stretch the resting
       pill, which means the pill has to be told how wide to become when
       it turns. Measuring the back face directly keeps the two in step
       whatever the definition says. */
    const targetWidth = (pill: HTMLElement) => {
      const back = pill.querySelector<HTMLElement>(".pill-face-back");
      if (!back) return null;
      const cs = getComputedStyle(pill);
      const pad =
        parseFloat(cs.paddingLeft) +
        parseFloat(cs.paddingRight) +
        parseFloat(cs.borderLeftWidth) +
        parseFloat(cs.borderRightWidth);
      return Math.ceil(back.scrollWidth + pad);
    };

    /* Reverse of the opening sequence: turn back, then shrink. The
       resting width is pinned in pixels first, because a transition from
       a pixel width to `auto` does not animate — it would snap. */
    const close = () => {
      const pill = openPill;
      if (!pill) return;
      clearStages();
      openPill = null;
      pill.classList.remove("pill-flipped");
      after(FLIP_TURN_MS, () => {
        const rest = pill.dataset.restWidth;
        if (rest) pill.style.width = `${rest}px`;
        after(FLIP_WIDEN_MS + 40, () => {
          pill.style.width = "";
          delete pill.dataset.restWidth;
        });
      });
      setPaused(false);
    };

    const open = (pill: HTMLElement) => {
      openPill = pill;
      setPaused(true);
      // Pin the resting width so the return leg has something to
      // animate back to.
      pill.dataset.restWidth = String(
        Math.ceil(pill.getBoundingClientRect().width),
      );
      const wide = targetWidth(pill);
      if (wide) pill.style.width = `${wide}px`;
      // Widen first, turn once the width has arrived.
      after(FLIP_WIDEN_MS, () => {
        pill.classList.add("pill-flipped");
        after(FLIP_TURN_MS + FLIP_HOLD_MS, close);
      });
    };

    root.querySelectorAll<HTMLElement>(".pill").forEach((pill) => {
      const onClick = () => {
        if (openPill === pill) {
          close();
          return;
        }
        if (openPill) close();
        open(pill);
      };
      pill.addEventListener("click", onClick);
      cleanups.push(() => pill.removeEventListener("click", onClick));
    });

    return () => {
      clearStages();
      cleanups.forEach((fn) => fn());
      setPaused(false);
    };
  }, []);

  /* ---- folder spring hover ----------------------------------------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current!;
    const folder = root.querySelector<HTMLElement>(".work-folder")!;
    const front = root.querySelector<HTMLElement>(".folder-front")!;
    const docs = Array.from(root.querySelectorAll<HTMLElement>(".folder-doc"));
    const caption = root.querySelector<HTMLElement>(".seq-caption");
    let pressed = false;

    const settle = (hovered: boolean) => {
      gsap.to(folder, {
        scale: hovered ? 1.035 : 1,
        // Drop the folder as the stack lifts, so the raised sheets keep
        // clear of the top of the viewport instead of running off it.
        y: hovered ? 46 : 0,
        ...(hovered ? SPRING_IN : SPRING_OUT),
        overwrite: "auto",
      });
      // The caption sits under the folder; when the folder drops and the
      // sheets fan out it has to move too, or the open stack lands on it.
      if (caption) {
        gsap.to(caption, {
          y: hovered ? 58 : 0,
          ...(hovered ? SPRING_IN : SPRING_OUT),
          overwrite: "auto",
        });
      }
      gsap.to(front, {
        rotateX: hovered ? -13 : 0,
        ...(hovered ? SPRING_IN : SPRING_OUT),
        overwrite: "auto",
      });
      docs.forEach((doc, i) => {
        gsap.to(doc, {
          yPercent: hovered ? HOVER_DOC_Y[i] : REST_DOC_Y[i],
          ...(hovered ? SPRING_IN : SPRING_OUT),
          delay: hovered ? i * 0.028 : 0,
          overwrite: "auto",
        });
      });
    };
    const onEnter = () => settle(true);
    const onLeave = () => {
      pressed = false;
      settle(false);
    };
    const onDown = () => {
      pressed = true;
      gsap.to(folder, { scale: 0.985, y: -2, ...PRESS, overwrite: "auto" });
    };
    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      settle(true);
    };
    folder.addEventListener("pointerenter", onEnter);
    folder.addEventListener("pointerleave", onLeave);
    folder.addEventListener("pointerdown", onDown);
    folder.addEventListener("pointerup", onUp);

    return () => {
      folder.removeEventListener("pointerenter", onEnter);
      folder.removeEventListener("pointerleave", onLeave);
      folder.removeEventListener("pointerdown", onDown);
      folder.removeEventListener("pointerup", onUp);
      gsap.killTweensOf([folder, front, ...docs, ...(caption ? [caption] : [])]);
    };
  }, []);

  return (
    <section ref={rootRef} id="work" aria-label="Roles and projects">
      <div ref={pinRef} className="seq-pin relative min-h-svh overflow-hidden">
        {/* Stage 1 — pills */}
        <div className="pills-stage flex min-h-svh flex-col justify-center px-6 py-16 md:px-12 lg:px-20">
          <p
            className="pills-heading font-semibold leading-none tracking-[-0.03em] text-text-secondary"
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
                    <button type="button" className="pill" aria-label={label}>
                      <span className="pill-inner">
                        <span className="pill-face">{label}</span>
                      </span>
                      {/* Sibling of .pill-inner, not a child of it.
                          .pill-inner carries transform-style: preserve-3d,
                          which makes it a containing block for absolutely
                          positioned descendants — so from inside it the
                          definition centred on the label's box rather than
                          on the pill, and drifted the moment the pill
                          resized to fit the definition. */}
                      <span className="pill-face pill-face-back">
                        {DEFINITIONS[label] ?? label}
                      </span>
                    </button>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stage 2 — Projects folder */}
        <div className="projects-stage flex min-h-svh flex-col items-center justify-center px-6 md:px-12 lg:px-20">
          <h2
            aria-hidden
            className="work-bg-word pointer-events-none absolute left-0 top-1/2 z-0 w-full -translate-y-1/2 select-none whitespace-nowrap text-center font-semibold leading-none tracking-[-0.04em]"
            style={{ fontSize: "23vw" }}
          >
            Projects
          </h2>
          <span className="sr-only">Projects</span>

          <div className="relative z-10 flex flex-col items-center">
            <div className="work-folder">
              <span aria-hidden className="folder-back" />
              <span className="folder-docs">
                {DOC_PROJECTS.map((p, i) => (
                  <button
                    key={p.slug}
                    type="button"
                    className="folder-doc"
                    data-i={i}
                    aria-label={`${p.title} — quick look`}
                    onClick={(e) => {
                      e.stopPropagation();
                      peek.open(p.slug);
                    }}
                  >
                    <span
                      className="folder-doc-inner peek-card"
                      data-layout-id={peekId(p.slug)}
                    >
                      {/* Only the top band of each sheet clears the folder
                          front, and these covers are landscape with their
                          subject centred — unzoomed, the sliver on show is
                          just empty backdrop (Interax read as a blank white
                          sheet). Scaling about a point below centre lifts
                          each cover's subject into the visible band. */}
                      <Image
                        src={p.cover.src}
                        alt=""
                        fill
                        sizes="300px"
                        className="object-cover"
                        style={{
                          transform: "scale(1.45)",
                          transformOrigin: "50% 58%",
                        }}
                      />
                    </span>
                  </button>
                ))}
              </span>
              <Link
                href="/work"
                aria-label="View all projects"
                className="folder-front outline-offset-8"
              >
                <span className="folder-label">Sinai&rsquo;s Work</span>
              </Link>
            </div>

            <p className="seq-caption mt-12 text-body-s text-text-muted">
              Curious? Click the folder.
            </p>
          </div>
        </div>

        {/* Final fade-to-black overlay */}
        <div className="seq-blackout pointer-events-none absolute inset-0 bg-bg" />
      </div>
    </section>
  );
}
