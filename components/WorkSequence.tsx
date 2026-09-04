"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
const SETS = [SET_A, SET_B, SET_C];

/* Vertical rhythm of the pills stage, in multiples of the pill's own size
   so it holds its proportions across viewports (see the --pill-size
   variable in globals.css). The row COUNT is what absorbs a taller screen,
   not the spacing — previously six rows were centred in whatever space
   there was, so the gap under the heading drifted from 40px at 1512 to
   281px at 2560. */
/* Mirrors the multipliers on .pill-stack in globals.css. The margins are
   read back from the DOM (they resolve to px); these are only needed to
   recover the pill size and the base row gap from them. Keep in sync. */
const BOTTOM_MULT = 1.6;
const GAP_MULT = 1.09;
/* How far the row gap may stretch from that base to swallow the leftover
   space. An integer number of rows almost never divides the available
   height exactly, and the remainder has to go somewhere: spread across
   the gaps it is a few percent and invisible, but left at the foot it was
   showing up as a bottom margin three times the intended one. */
const GAP_TOLERANCE = 0.14;
const MIN_ROWS = 3;
const MAX_ROWS = 9;
/* Ceiling on how far the pills may be scaled up to fill a screen the row
   cap has left short. Past this they stop reading as chips. */
const MAX_PILL = 72;

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
const FOLDER_DROP = 46; // px the folder sinks as the stack lifts
const FOLDER_SCALE = 0.035; // how much it swells, at full lift
const CAPTION_DROP = 58; // px the caption moves to stay clear of it

const MIN_LIFT = 0.08; // a hint of opening even where there is no room at all
const MAX_LIFT = 3.4; // backstop; the px cap below is what normally binds

/* How far the stack travels, as a proportion of the FOLDER's own height —
   not of the space above it. Driving it from the gap to the top of the
   viewport made the reveal wildly inconsistent: 0.075 of the folder on a
   phone, 0.46 on a tablet, 0.12 on a short laptop window. This is the
   ratio measured on a 16" MacBook Pro (folder 466px, travel 195px), so
   that display is unchanged and everything smaller scales down with its
   own folder. MAX_RISE is the same measurement as an absolute ceiling, so
   nothing larger ever exceeds it either. */
/* Reference is what was actually live on sinairhodes.com (the last
   deployed commit, 919d007) before the proportional-reveal work started —
   measured directly by checking that commit out and running it: a
   constant 110px rise, ratio 0.236 of the folder's own height, at every
   height tested (1728x1117, 1512x945, 1512x982). A prior pass here had
   drifted the reference up to 195px / 0.418 through several rounds of
   recalibration; this restores the actually-correct amount as the cap
   while keeping the scaling mechanism (16" MBP cap, proportional
   mobile scaling) built around it. */
const RISE_RATIO = 0.236;
const MAX_RISE = 110;
/* Purely a safety: an unusually short window can put the folder nearer
   the top than the proportional travel would clear, and the top sheet
   must not leave the screen. Only binds on those. */
const MIN_CLEARANCE = 40;

export default function WorkSequence() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const peek = useProjectPeek();
  const marqueeRef = useRef<gsap.core.Tween[]>([]);

  /* How many times each row's set is repeated. The marquee slides by
     exactly one set and loops, so at the end of a cycle the content only
     reaches (copies - 1) sets from the row's origin — anything less than
     the viewport width and the tail of the row runs out mid-screen and a
     gap opens. Two copies was enough at 1512 (one set spans 1.26 screens)
     but not at 2560, where a set covers 0.75 of the screen and the wrap
     showed a 628px hole. Measured rather than guessed, because the set
     widths differ and the pills scale with the viewport. */
  const [copies, setCopies] = useState(2);

  /* How many rows the stage has room for, so the gap above the first row
     and below the last stay put and the extra height goes into more rows.
     More rows is also fewer repeats on screen at once, which pushes the
     marquee's repetition further out of sight. */
  const [rowCount, setRowCount] = useState(6);

  useLayoutEffect(() => {
    const measure = () => {
      const stage = document.querySelector<HTMLElement>(".pills-stage");
      const heading = document.querySelector<HTMLElement>(".pills-heading");
      const row = document.querySelector<HTMLElement>(".pill-row");
      const stack = document.querySelector<HTMLElement>(".pill-stack");
      if (!stage || !heading || !row || !stack) return;

      /* Read the gaps off the stack's resolved margins, NOT off
         --pill-size: getPropertyValue returns a custom property's
         *specified* token, so it comes back as the literal string
         "clamp(20px, 2.6vw, 40px)" and parseFloat gives NaN. The margins
         are declared in terms of that variable and do resolve to px. */
      /* Always measure against the UNSCALED pill size. The branch below may
         have grown it on a previous pass, and reading that back would make
         nine rows look like a natural fit, which removes the growth, which
         makes ten rows fit again — it oscillates. Drop the override first
         and read the base the stylesheet specifies. */
      stage.style.removeProperty("--pill-size");
      const stackCS = getComputedStyle(stack);
      const topGap = parseFloat(stackCS.marginTop) || 0;
      const bottomGap = parseFloat(stackCS.marginBottom) || 0;
      const rowH = row.getBoundingClientRect().height;
      if (!rowH || !bottomGap) return;

      // rowGap is written back below, so the base has to come from a value
      // this effect never touches: the margin, which is the same multiple
      // of --pill-size.
      const pillSize = bottomGap / BOTTOM_MULT;
      const baseGap = pillSize * GAP_MULT;

      const padTop = parseFloat(getComputedStyle(stage).paddingTop) || 0;
      const headH = heading.getBoundingClientRect().height;
      const free = window.innerHeight - padTop - headH - topGap - bottomGap;

      // Nearest, not floor: it halves the worst-case leftover before the
      // gaps have to take it up.
      const n = Math.round((free + baseGap) / (rowH + baseGap));
      if (!Number.isFinite(n)) return;
      const next = Math.max(MIN_ROWS, Math.min(MAX_ROWS, n));

      /* Past the cap there is more height than nine rows of this size can
         fill, so grow the pills instead of adding a tenth row. Everything
         in the stage is a multiple of --pill-size — the row height, the
         gaps between rows, and the clearances above and below — so the
         whole column can be solved for in one step:
             available = P * (TOP + BOTTOM + n*rowRatio + (n-1)*GAP_MULT)
         with rowRatio measured rather than assumed, since the pill's own
         padding and border are part of its height. */
      if (n > MAX_ROWS) {
        const rowRatio = rowH / pillSize;
        const available = window.innerHeight - padTop - headH;
        const denom =
          1 + BOTTOM_MULT + next * rowRatio + (next - 1) * GAP_MULT;
        const grown = Math.min(MAX_PILL, available / denom);
        if (grown > pillSize + 0.5) {
          stage.style.setProperty("--pill-size", `${grown.toFixed(2)}px`);
        }
      }

      // Share the remainder across the gaps, within tolerance.
      if (next > 1) {
        const exact = (free - next * rowH) / (next - 1);
        const lo = baseGap * (1 - GAP_TOLERANCE);
        const hi = baseGap * (1 + GAP_TOLERANCE);
        stack.style.rowGap = `${Math.max(lo, Math.min(hi, exact)).toFixed(2)}px`;
      }
      if (next !== rowCount) setRowCount(next);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [rowCount, copies]);

  const rows = Array.from(
    { length: rowCount },
    (_, i) => SETS[i % SETS.length],
  );

  useLayoutEffect(() => {
    const measure = () => {
      const rows = Array.from(
        document.querySelectorAll<HTMLElement>(".pill-row"),
      );
      if (!rows.length) return;
      let needed = 2;
      for (const row of rows) {
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
        // The row is mid-marquee, so read the laid-out width, not the box.
        const unit = (row.scrollWidth + gap) / copies;
        // Cover the viewport plus a cushion. Sized exactly, the margin can
        // land near zero when the viewport is just under a whole number of
        // sets — 1728 came out with 10px to spare, which a sub-pixel
        // rounding or a resize mid-cycle could still open.
        if (unit > 0) {
          needed = Math.max(
            needed,
            Math.ceil((window.innerWidth + 160) / unit) + 1,
          );
        }
      }
      // A ceiling purely as a guard against a pathological measurement;
      // 6 copies covers a 5 x set-width viewport.
      needed = Math.min(needed, 6);
      if (needed !== copies) setCopies(needed);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [rowCount, copies]);

  /* Growing or shrinking the pill stack changes this section's height,
     and every ScrollTrigger below it — the Skills/Contact handoff above
     all — has already measured its start and end against the old page.
     Without this the handoff sat permanently at its end state on any
     viewport where the row count moved off the server-rendered six, which
     left the whole Skills section stuck at opacity 0 on phones. */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [rowCount, copies]);

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
          /* This pin inserts ~3500px of spacer, so every trigger below it
             depends on it having been measured first. ScrollTrigger
             refreshes in creation order by default, and because this
             timeline is rebuilt whenever the row count changes it ends up
             recreated AFTER the section handoffs — which then computed
             their positions as if the spacer were not there, collapsing
             them by exactly the pin's length. The Skills/Contact handoff
             landed permanently past its end, so Skills sat at opacity 0
             for the whole section on any viewport where the row count
             moved off six. A higher priority refreshes this one first,
             whatever order things were created in. */
          refreshPriority: 1,
        },
      });

      // 1 — pills reveal
      tl.fromTo(heading, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 10, ease: "power2.out" }, 0);
      // The stagger closes up as rows are added, so the whole reveal still
      // lands inside the same window whatever the row count.
      const step = Math.min(7, 56 / Math.max(1, rows.length - 1));
      rows.forEach((row, i) => {
        tl.fromTo(
          row,
          { autoAlpha: 0, y: 80 },
          { autoAlpha: 1, y: 0, duration: 16, ease: "power2.out" },
          8 + i * step,
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
  }, [rowCount, copies]);

  /* ---- autonomous marquee (independent of scroll) ------------------ */
  /* Depends on rowCount as well as copies. It used to list only copies,
     so when the measured row count rose from the server-rendered 6 to
     whatever fits, the rows added afterwards never got a tween — every
     row past the sixth simply sat still. That looked like a viewport
     condition on small screens, but it was the dependency list. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const SPEED = 42; // px / second
      marqueeRef.current = [];
      gsap.utils.toArray<HTMLElement>(".pill-row").forEach((row, i) => {
        /* The loop distance is the distance between a pill and the copy of
           itself one set later — measured, not derived. Computing it as
           (scrollWidth + gap) / copies looks equivalent but scrollWidth is
           an integer while the true period is fractional, and the error
           does not divide out: the seven-pill rows were wrapping 9.4px
           short of their own content, which is a visible snap on every
           cycle. Reading two slots directly is exact. */
        const slots = row.querySelectorAll<HTMLElement>(".pill-slot");
        const setLen = slots.length / copies;
        if (!slots.length || !Number.isInteger(setLen)) return;
        const shift =
          slots[setLen].getBoundingClientRect().left -
          slots[0].getBoundingClientRect().left;
        if (!(shift > 0)) return;
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
  }, [rowCount, copies]);

  /* ---- proximity glow ---------------------------------------------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Mouse only. A touch device has no hover position to be near, and
    // pointermove still fires there on every tap and scroll gesture — so
    // this was measuring every pill on the page to light nothing. Same
    // gate the custom cursor already uses.
    if (!window.matchMedia("(pointer: fine)").matches) return;
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
      const rest = pill.dataset.restWidth;
      const clear = () => {
        pill.style.width = "";
        delete pill.dataset.restWidth;
      };

      if (pill.dataset.shrinks === "true") {
        // Mirror of the opening order: give the width back first, so the
        // pill is its full size again before it turns.
        if (rest) pill.style.width = `${rest}px`;
        after(FLIP_WIDEN_MS, () => {
          pill.classList.remove("pill-flipped");
          after(FLIP_TURN_MS + 40, clear);
        });
      } else {
        pill.classList.remove("pill-flipped");
        after(FLIP_TURN_MS, () => {
          if (rest) pill.style.width = `${rest}px`;
          after(FLIP_WIDEN_MS + 40, clear);
        });
      }
      setPaused(false);
    };

    const open = (pill: HTMLElement) => {
      openPill = pill;
      setPaused(true);
      /* Pin the resting width in pixels FIRST, flush it, and only then
         set the target.

         The expand used to snap while the return eased, despite both
         using the same curve: opening went from `width: auto` to a pixel
         value, and a transition cannot interpolate from `auto` — the
         browser jumps straight to the end. Closing was px to px, which
         is why only that half looked right. Giving the open leg a
         concrete start value makes the two symmetrical. */
      const rest = Math.ceil(pill.getBoundingClientRect().width);
      pill.dataset.restWidth = String(rest);
      pill.style.width = `${rest}px`;
      // Force the pinned width to be committed before changing it, so
      // the two values land in separate style recalculations.
      void pill.offsetWidth;

      /* Order depends on which way the pill is about to resize.

         Most definitions are longer than their label, so the pill widens
         to make room and then turns. A few are SHORTER — "computational
         designer" is the clear case, a 339px label against a 276px
         definition — and for those the same order read backwards: the
         pill contracted before there was anything to explain why. Those
         turn first, then close the gap. */
      const wide = targetWidth(pill);
      const shrinks = wide !== null && wide < rest;
      pill.dataset.shrinks = shrinks ? "true" : "false";

      if (shrinks) {
        pill.classList.add("pill-flipped");
        after(FLIP_TURN_MS, () => {
          if (wide) pill.style.width = `${wide}px`;
          after(FLIP_WIDEN_MS + FLIP_HOLD_MS, close);
        });
      } else {
        if (wide) pill.style.width = `${wide}px`;
        after(FLIP_WIDEN_MS, () => {
          pill.classList.add("pill-flipped");
          after(FLIP_TURN_MS + FLIP_HOLD_MS, close);
        });
      }
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

    /* The CSS already stacks the sheets with `translate(-50%, -12%)` and
       friends, which is what a no-JS or reduced-motion visitor sees. GSAP
       parses that percentage into its `y` (px) channel, and `yPercent` is
       then a SEPARATE channel added on top — so every offset was being
       applied twice the moment the first hover tween touched a sheet, and
       the stack opened about twice as far as the numbers here say. Zero
       the px channel once and let yPercent own the axis outright. */
    gsap.set(docs, { y: 0, yPercent: (i: number) => REST_DOC_Y[i] });

    /* One factor scales the entire reveal — sheet fan, folder drop and
       caption drop together — chosen so the topmost sheet lands
       the proportional distance above. Measured at rest rather
       than assumed, because the folder is centred in the stage and so its
       resting height above the fold changes with the viewport. */
    let lift = 1;
    let calibratedAt = "";

    /* Choose the lift by measuring, not by arithmetic. The sheets are each
       scaled differently, GSAP's yPercent resolves against the element's
       own box, and the folder's own scale-up moves the top edge as well —
       two attempts at a closed form for "where does the top sheet end up"
       came out 2x and then 20% wrong. Bisection needs none of that: the
       top edge falls monotonically as the lift grows, so eight probes land
       within a pixel. Each probe is a synchronous set-and-read; everything
       is put back before the tween is built, so nothing is painted mid
       measurement, and it only runs when the viewport size has changed. */
    const calibrate = () => {
      const key = `${window.innerWidth}x${window.innerHeight}`;
      if (key === calibratedAt || !docs.length) return;

      const topOf = () =>
        Math.min(...docs.map((d) => d.getBoundingClientRect().top));
      const apply = (k: number) => {
        gsap.set(folder, { y: FOLDER_DROP * k, scale: 1 + FOLDER_SCALE * k });
        gsap.set(docs, {
          yPercent: (i: number) =>
            REST_DOC_Y[i] + (HOVER_DOC_Y[i] - REST_DOC_Y[i]) * k,
        });
        return topOf();
      };

      const restTop = topOf();
      const folderH = folder.getBoundingClientRect().height;
      // Proportional first, capped at the reference, then held back only
      // if the screen is too short to fit that much travel.
      const wanted = Math.min(RISE_RATIO * folderH, MAX_RISE);
      const affordable = Math.max(0, restTop - MIN_CLEARANCE);
      const target = restTop - Math.min(wanted, affordable);

      let lo = 0;
      let hi = MAX_LIFT;
      if (apply(hi) > target) {
        lift = hi; // even fully open it never reaches the line
      } else {
        for (let n = 0; n < 8; n++) {
          const mid = (lo + hi) / 2;
          if (apply(mid) > target) lo = mid;
          else hi = mid;
        }
        lift = Math.max(MIN_LIFT, (lo + hi) / 2);
      }

      gsap.set(folder, { y: 0, scale: 1 });
      gsap.set(docs, { yPercent: (i: number) => REST_DOC_Y[i] });
      calibratedAt = key;
    };

    const settle = (hovered: boolean) => {
      gsap.to(folder, {
        // Scaled by the same factor as the rest of the gesture. Left at a
        // flat 1.035 it lifted the top sheet ~59px on its own, which put a
        // floor under the reveal that no amount of easing off the fan
        // could get below — on a 650px screen the sheet still cleared the
        // top of the viewport.
        scale: hovered ? 1 + FOLDER_SCALE * lift : 1,
        // Drop the folder as the stack lifts, so the raised sheets keep
        // clear of the top of the viewport instead of running off it.
        y: hovered ? FOLDER_DROP * lift : 0,
        ...(hovered ? SPRING_IN : SPRING_OUT),
        overwrite: "auto",
      });
      // The caption sits under the folder; when the folder drops and the
      // sheets fan out it has to move too, or the open stack lands on it.
      if (caption) {
        gsap.to(caption, {
          y: hovered ? CAPTION_DROP * lift : 0,
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
          yPercent: hovered
            ? REST_DOC_Y[i] + (HOVER_DOC_Y[i] - REST_DOC_Y[i]) * lift
            : REST_DOC_Y[i],
          ...(hovered ? SPRING_IN : SPRING_OUT),
          delay: hovered ? i * 0.028 : 0,
          overwrite: "auto",
        });
      });
    };
    const onEnter = () => {
      calibrate(); // the folder is at rest here, so the reading is valid
      settle(true);
    };
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
        <div className="pills-stage flex min-h-svh flex-col justify-start px-6 py-16 md:px-12 lg:px-20">
          <p
            className="pills-heading font-semibold leading-none tracking-[-0.03em] text-text-secondary"
            style={{ fontSize: "clamp(28px, 4vw, 56px)" }}
          >
            I am a...
          </p>
          <div className="pill-stack flex flex-col justify-start">
            {rows.map((set, ri) => (
              <div
                key={ri}
                className="pill-row flex w-max items-center"
              >
                {Array.from({ length: copies }, () => set)
                  .flat()
                  .map((label, i) => (
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
                        /* The sheet renders ~650px wide and is then
                           magnified 1.45x by the transform below, so the
                           browser paints roughly 950 CSS px of image — and
                           twice that on a retina display. The old 300px
                           hint had Next serving a 640px file (384px at 1x)
                           into that, which is where the softness came
                           from. */
                        sizes="(max-width: 767px) 92vw, 950px"
                        quality={90}
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
                <span className="folder-label">My Work</span>
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
