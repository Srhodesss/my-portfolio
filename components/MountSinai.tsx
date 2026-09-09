"use client";

import { useEffect, useRef } from "react";
import HebrewWatermark from "@/components/HebrewWatermark";
import {
  isOverMountainPixel,
  setMountainAlpha,
  setMountainTransform,
} from "@/lib/mountain-hit-test";

/**
 * Mount Sinai — the base visual of the closing section.
 *
 * The illustration sits at full bleed behind the closing glyph field and
 * name mark, and it is nearly black except for the lit summit, so its
 * edges dissolve into the page rather than reading as a photograph
 * dropped onto the section.
 *
 * At rest the whole image is held back to 66% brightness. A soft
 * circular pool follows the cursor with lerped, eased tracking and
 * restores the image to full strength inside it — light finding the
 * mountain, not a spotlight sitting on top of it.
 *
 * How the torch is built, and why this way rather than an overlay:
 * the pool is a second copy of the same image (a cache hit, not a second
 * download) with its shadows lifted, clipped by a soft radial mask.
 * Because the lift is a curve through the origin, the torch does nothing
 * to the black sky — so no disc is ever visible floating in empty space.
 * It only resolves where there is actually mountain to find. An additive
 * `screen` or `soft-light` overlay would instead paint a grey circle
 * across the sky.
 *
 * The lift is a transfer curve rather than CSS `brightness()`. Brightness
 * is a straight multiply, so by the time it is strong enough to pull the
 * dark flanks out it has driven the already-lit summit to flat white. The
 * curve bends the low end hard and leaves 1.0 fixed, so the flanks come
 * up and the summit cannot clip by construction — and it is pinned to
 * identity at the sky's own value, so the pool stays invisible over
 * empty sky instead of hanging a grey disc there.
 *
 * Across the illustration lie the favourite verses — the same watermark
 * the hero uses, drifting at the same slow pace. What it does NOT do here
 * is react to the cursor: no repulsion, no proximity glow, no shimmer. It
 * keeps its own motion and is only ever found by the light.
 *
 * The verses are a backdrop and the mountain stands in front of them,
 * opaquely. The image carries its own alpha channel for this — see
 * scripts/build-mountain-matte.mjs — so there is no blend mode anywhere
 * in the stack. The sky is absent rather than blended away, and every
 * pixel of the mountain hides what is behind it.
 *
 * This replaced a `lighten` composite, which disappeared the sky
 * correctly but did it by letting the brighter layer win pixel for
 * pixel. Since 80% of the artwork — including most of the mountain's
 * lower body — is painted at exactly the page's #0a0a0a, the writing
 * read straight through the dark rock while staying hidden behind the
 * lit snow. Alpha separates the two concerns: the sky's disappearance
 * and the mountain's opacity are no longer the same mechanism.
 *
 * Inside the pool the mountain's own shadows are lifted, so the light
 * uncovers the picture; the verses are uncovered only out in the open
 * sky, where there is no mountain in front of them.
 *
 * Both stacks render their own copy, and both drift. They stay in phase
 * because they mount together and share the keyframes and per-row
 * durations, so the copy inside the pool always sits exactly over the
 * copy outside it. The mountain is composited over it with
 * `mix-blend-mode: lighten`, which is what lets the verses read through
 * the black sky: the illustration's black measures #0a0a0a, exactly the
 * page's --bg, so `lighten` leaves the sky untouched and the mountain
 * wins only where it is genuinely brighter. (`screen` would have lifted
 * that same sky to #131313 — brighter than the page, and a visible
 * rectangle.)
 *
 * So there are two identical stacks: a resting one, and a lit one clipped
 * to the pool. They differ only in how hard each layer is lit, which is
 * what makes the torch read as light falling on one picture rather than
 * two effects happening at once.
 *
 * The pool is moved by transform alone: the clipped wrapper translates to
 * the cursor while the stack inside it counter-translates by the same
 * amount, so the picture stays pinned to the section while the window
 * over it moves. No layout, no background-position, nothing repainted
 * outside the pool's own box.
 *
 * The layer fades in on the closing section's shared scroll ramp, and the
 * mountain then arrives on a second, later and longer one of its own,
 * climbing as it comes. The verses are in place before it settles, so the
 * section resolves in two moves rather than one.
 *
 * Touch or no JS: the illustration is shown at its dimmed rest state
 * with no torch and no pointer tracking. Reduced motion additionally
 * takes it back to full brightness, since there is then no reveal
 * coming that the dim would be holding something back for.
 */

const SRC = "/bottom-hero/mount-sinai.webp";

/* "Hover to reveal", pre-split into per-character spans (each carrying
   the index its ripple delay is keyed to) — computed once at module
   scope since the text never changes, rather than re-splitting it on
   every render. The space characters are split out like any other char
   and rendered the same way, so inter-word spacing is just whatever the
   font's own space glyph is — normal tracking, not a deliberate gap. */
const HINT_CHARS: { ch: string; delay: number }[] = Array.from(
  "Hover to reveal",
).map((ch, i) => ({ ch, delay: i * 60 }));

/* The lift applied inside the pool, as a transfer curve sampled every
 * 0.04 of input. It is pinned to identity through the first two samples
 * on purpose: the illustration's sky is #0a0a0a, so input 0.04 must come
 * out as 0.04 or the pool lifts the empty sky along with the rock and
 * leaves a grey disc hanging in it. Above that it climbs hard, so the
 * dark flanks resolve while the summit still cannot clip. */
const LIFT_TABLE = "0.0000 0.0400 0.2239 0.3037 0.3656 0.4181 0.4646 0.5069 0.5458 0.5822 0.6165 0.6489 0.6799 0.7095 0.7379 0.7654 0.7918 0.8175 0.8424 0.8666 0.8902 0.9132 0.9356 0.9575 0.9790 1.0000";

const EASE = 0.085; // per-frame approach of the pool toward the cursor
const LIT_EASE = 0.055; // per-frame approach of the pool's strength
const IDLE = 0.05; // px below which tracking is considered settled

/* The nav bar sits in the section's last 62px. The glow starts giving way
   a good margin above it so it dissolves on approach rather than parking
   against an invisible line. `.ms-torch`'s mask is the hard guarantee. */
/* Both measured from the section's foot. The nav is 62px tall, so these
   only have to clear that — set far larger they suppressed the glow
   across the mountain's whole base, leaving the peak the only part the
   torch could uncover. */
const NAV_ZONE = 78; // glow fully out
const NAV_FADE = 170; // glow starts giving way

/* The mountain arrives on its own clock, later and slower than the layer
   it sits in, and climbs as it comes. The verses are already there when
   it does, so the section resolves in two moves rather than one. */
/* Both numbers are in viewport heights, measured against the section's
   top edge. It begins later than the shared ramp (0.72) and runs longer
   than it (0.52), so it is still settling once the verses are up.
   START must not be smaller than SPAN: this is the last section on the
   page, so its top never climbs past the gap the nav leaves, and a ramp
   that only completes at top = 0 would stall at about four fifths and
   never arrive. START - SPAN is where it finishes: keep it just above 0. */
const MTN_START = 0.6;
const MTN_SPAN = 0.58;
const MTN_RISE = 54; // px it travels up on the way in

/* Where the summit sits in the artwork, as a fraction of the file — the
   topmost opaque pixel, read straight off the cutout's alpha channel.
   (It moved when the source became a cutout: the old 0.261 was measured
   on the glowing version, where the topmost *lit* pixel was up in the
   halo rather than on the mountain.) CustomCursor reads the element this
   places to decide where the "Top" affordance is offered. */
const PEAK_U = 0.5082;
const PEAK_V = 0.3892;
const PEAK_R = 0.11; // hotspot radius as a fraction of the rendered width
// Fallback only, for the one instant placePeak can run before the pixel
// scan behind getMountainBBox exists: a natural-pixel drop from the
// summit's tip, which is itself just a few px of anti-aliased edge
// (~6px wide at the very apex on the current crop) — too thin to sit
// text on with any margin either side. Superseded the moment the bbox
// is ready, same call, so this only ever shows for a single frame at
// most.
const PEAK_LABEL_DY = 40;
// Where "Hover to reveal" sits between the bbox's top (the summit) and
// bottom (the foot), as a fraction of that span — 0.5 is dead centre;
// this is pulled up from there, closer to the peak, while staying well
// clear of the apex's few anti-aliased px (by this fraction down, the
// silhouette has long since widened past anything the label could
// overhang).
const HINT_V_FRACTION = 0.35;

export default function MountSinai() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const torchRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const hfadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const torch = torchRef.current!;
    const mover = moverRef.current!;
    const inner = innerRef.current!;
    const hint = hintRef.current!;
    const hfade = hfadeRef.current!;

    const cleanups: (() => void)[] = [];

    /* Shared with the torch's own pointer tracking below, which used to
       call wrap.getBoundingClientRect() itself on every single
       pointermove — a forced synchronous layout on top of whatever
       CustomCursor's own per-frame reads (the peak hotspot's rect,
       elementFromPoint) were already doing that frame, and pointermove
       fires far more often than requestAnimationFrame does. wrap only
       actually moves on scroll or resize, both already handled below, so
       one read there is enough; the tracking loop can just read this. */
    let wrapRect = wrap.getBoundingClientRect();
    // "Hover to reveal"'s own rect, for the hover-to-dismiss check further
    // down — declared up here (rather than alongside the rest of that
    // logic, which only exists on the gated, desktop-and-motion-allowed
    // path below) purely so applyIn, which runs unconditionally and
    // earlier, can keep it fresh across scroll without a forward
    // reference. Stays null, and this stays a no-op, on every path where
    // the hint itself never runs.
    let hintRect: DOMRect | null = null;
    // The "Top" zone's own rect (the same box CustomCursor reads off
    // .ms-peak itself) — kept here too so the hint can dismiss the
    // moment the cursor enters that zone (see the dismiss-on-hover check
    // below), without re-deriving the geometry a third time or reaching
    // into CustomCursor's own state.
    let peakZoneRect: DOMRect | null = null;

    // Same forward-reference problem, same fix: placePeak (defined much
    // further down, closed over baseImg/peak/hint which don't exist yet
    // at this point in the effect) needs calling from applyIn below,
    // which both runs earlier in the file AND fires its first call
    // synchronously before placePeak is ever assigned. A ref that starts
    // as a no-op and gets pointed at the real function once it exists
    // sidesteps the ordering rather than fighting it — see why applyIn
    // needs it at all just below (--ms-rise).
    let placePeakFn: (() => void) | null = null;
    // Same story, same fix, for the per-row horizontal fade: it reads
    // the mountain image's current position too (to work out which
    // natural-image row each line of verse text corresponds to), and
    // had the identical bug — computed once at mount/resize/image-load
    // and never again, so it was quietly measuring against wherever the
    // mountain was before the entrance rise settled, not where it
    // actually ended up. See applyIn below for the measured proof.
    let updateHorizontalFadeFn: (() => void) | null = null;

    /* --- Scroll-linked fade-in ---------------------------------------
       Same ramp as HeroGlyphField's closing variant: nothing shows until
       the section's top has climbed most of the way up the viewport, and
       it only reaches full strength once the section owns the screen.
       The window ends short of the viewport top because this is the last
       section on the page and can never scroll higher than the gap the
       nav bar leaves. */
    const ease = (v: number) => {
      const c = Math.max(0, Math.min(1, v));
      return c * c * (3 - 2 * c);
    };

    let inRaf = 0;
    const applyIn = () => {
      inRaf = 0;
      const vh = window.innerHeight;
      wrapRect = wrap.getBoundingClientRect();
      if (hintRect) hintRect = hint.getBoundingClientRect();
      const top = wrapRect.top;
      const o = Math.max(0, Math.min(1, (vh * 0.72 - top) / (vh * 0.52)));
      wrap.style.opacity = o.toFixed(3);
      wrap.style.visibility = o === 0 ? "hidden" : "visible";

      // The mountain's own ramp: starts later and runs longer, so it is
      // still settling after the verses have arrived. Both copies read
      // the same two variables, so the lit stack can never drift out of
      // register with the resting one.
      const m = ease((vh * MTN_START - top) / (vh * MTN_SPAN));
      wrap.style.setProperty("--ms-in", m.toFixed(3));
      wrap.style.setProperty("--ms-rise", `${((1 - m) * MTN_RISE).toFixed(1)}px`);

      // --ms-rise above is a CSS transform on the image itself (see
      // .ms-base/.ms-torch-img), so the mountain keeps visibly sliding
      // into its resting position for as long as m is still climbing —
      // up to MTN_RISE (54px) of travel. placePeak reads the image's
      // *current* getBoundingClientRect(), transform included, but used
      // to only ever run once at mount/resize/image-load — so the "Top"
      // zone and the hint were measured against wherever the mountain
      // happened to be at that one instant, then never moved again while
      // the picture kept rising underneath them. Measured live: a 54px
      // gap between the zone's top and the mountain's actual top,
      // exactly MTN_RISE — this is that bug, not a rounding error.
      // Calling it here settles the geometry in step with the same
      // scroll-driven animation that moves the picture.
      placePeakFn?.();
      // Same fix for the per-row fade, same reason: measured live at
      // rest (--ms-rise settled to 0) against a fresh recomputation, two
      // separate rows disagreed with what was actually on screen — one
      // the code had marked "outside the image, nothing to fade toward"
      // that a fresh read placed squarely inside the mountain's vertical
      // span (so it never got a gradient at all), another still carrying
      // a gradient computed for a row height that had since scrolled
      // past the image's bottom edge entirely (so it was fading toward
      // the wrong edge position, sampled from a natural-image row that
      // is no longer where this line of text actually falls). Both are
      // exactly what "reported as fixed, still not visible" looks like:
      // not too subtle to see, actually wrong for those rows.
      updateHorizontalFadeFn?.();
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

    /* Sit the illustration's bottom edge on the baseline of "SINAI".
       The source is cropped so the mountain's foot IS the file's bottom
       edge, so aligning the two is just a matter of ending the image's box
       there and anchoring the picture to the bottom of it.
       The baseline, not the glyph box: the box carries a quarter of an em
       of descender space below the capitals, which would leave the
       mountain floating that far under the type. */
    const placeFoot = () => {
      const sec = wrap.closest<HTMLElement>("[data-closing]");
      const span = sec?.querySelector<HTMLElement>("p[data-reveal] span span");
      if (!sec || !span) return;
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
      const foot = sec.getBoundingClientRect().bottom - baseline;
      if (Number.isFinite(foot)) {
        wrap.style.setProperty("--ms-foot", `${Math.round(foot)}px`);
      }
    };

    placeFoot();
    document.fonts?.ready.then(placeFoot); // the baseline moves with the font
    window.addEventListener("resize", placeFoot);
    cleanups.push(() => window.removeEventListener("resize", placeFoot));

    /* The torch needs a mouse to have a position to be near, and needs
       motion to be allowed. Without either, leave the image alone at
       full brightness. Same gate the custom cursor and the pill glow
       already use.
       Below the lg breakpoint the mountain itself is hidden entirely
       (see .ms-base's own rule) rather than scaled down further, so the
       torch has nothing to reveal there — same breakpoint as the rest of
       the site's desktop-vs-mobile split (About's quote column, Skills'
       tool grid), not a new one invented for this. Gating it out here
       too, not just visually hiding the image, means a narrow-but-mouse
       viewport never wires up pointer tracking or offers "Top" for a
       summit that isn't on screen. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reduced || !fine || !desktop) return () => cleanups.forEach((fn) => fn());

    wrap.classList.add("ms-live");

    /* "Hover to reveal" — a one-time nudge that the mountain is worth
       lighting up, not just a dim picture. Runs only once, from the
       moment the section actually enters view rather than from mount:
       this component is present from the very first paint at the top of
       the page, so timing off mount would have the whole sequence over
       and gone long before anyone scrolls this far down. An
       IntersectionObserver catches the real moment and disconnects
       itself immediately after, so scrolling away and back never
       replays it. */
    /* Showing it requires two things to both be true — the section is in
       view, AND the mountain image has actually decoded — not just the
       first. placePeak() only has real coordinates to give the label
       once baseImg.naturalWidth/Height (and, past that, the pixel scan
       behind getMountainBBox) exist; asked to show before that, the
       label has nothing but its CSS default (top-left of the section) to
       sit at. On a warm cache the image is normally decoded well before
       anyone scrolls this far, so the ordering issue rarely shows — but
       "rarely" is exactly what made it read as the hint vanishing after
       a reload rather than a full, silent, position-only failure: same
       fade-in, same dismissal, just pinned to the wrong corner of a
       thousand-pixel-tall section throughout, i.e. nowhere anyone was
       looking. Both conditions set a flag rather than firing the show
       directly, so whichever finishes second is the one that actually
       triggers it.

       Dismissal used to be a flat 3s timeout — now it stays up until the
       reader's cursor actually crosses the label's own text, which is
       the real signal that the invitation landed (they found it and are
       about to act on it), not just that a clock ran out on someone who
       may still be reading. hintRect (declared up with wrapRect, see
       above) is that hit-test's rect, cached rather than read fresh on
       every pointermove for the same reason wrapRect and CustomCursor's
       peakRect are: it only actually moves on scroll or resize (both
       refresh it, here and in applyIn above), so a plain point-in-rect
       check against a cached box is all the torch's own pointermove
       handler needs to do every time to ask "is this the label". */
    let sectionInView = false;
    let mountainReady = false;
    let hintShown = false;
    let hintDismissed = false;
    const dismissHint = () => {
      if (hintDismissed) return;
      hintDismissed = true;
      hint.classList.add("ms-hint-out");
    };
    const tryShowHint = () => {
      if (hintShown || !sectionInView || !mountainReady) return;
      hintShown = true;
      hint.classList.add("ms-hint-in");
      hintRect = hint.getBoundingClientRect();
    };
    const hintObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        hintObserver.disconnect();
        sectionInView = true;
        tryShowHint();
      },
      { threshold: 0.4 },
    );
    hintObserver.observe(wrap);
    cleanups.push(() => hintObserver.disconnect());

    /* Both stacks drift, and they must drift as one: the copy inside the
       pool sits directly over the copy outside it, so any phase
       difference shows as a doubled, sheared edge where the pool ends —
       and at the strengths these two copies render at (7% vs 46%), that
       edge reads as two separate, slightly offset layers of text rather
       than one. The lit stack is display:none until this class lands,
       and a CSS animation on a display:none element has not started — so
       it begins roughly half a second behind its twin (measured: 21.7px
       of skew) once it does.

       This used to sync on a single requestAnimationFrame a tick after
       the class landed, gambling that the browser had already run style
       recalc for the newly-displayed rows and started their animations
       by then — genuinely a race, not a fixed delay, so it only
       sometimes lost: `getAnimations()[0]` came back empty for a lit row
       whose animation had not actually started yet, silently skipping
       that row's sync and leaving it to drift out of phase with its
       twin for good, on whichever page loads happened to lose the race.
       `animationstart` fires exactly once per row (the animation loops
       via `animation-iteration-count: infinite`, not restarts, so this
       is not a per-loop cost) at the moment it is genuinely true, which
       removes the guess entirely. */
    const restRows = wrap.querySelectorAll<HTMLElement>(".ms-plate .wm-row");
    const litRows = wrap.querySelectorAll<HTMLElement>(".ms-hebrew-lit .wm-row");
    const syncRow = (i: number) => {
      const a = restRows[i]?.getAnimations()[0];
      const b = litRows[i]?.getAnimations()[0];
      if (a && b) b.currentTime = a.currentTime;
    };
    const litStartHandlers: (() => void)[] = [];
    litRows.forEach((row, i) => {
      // In case it has, against the odds, already started by the time
      // this effect runs (e.g. a fast remount): sync it immediately too,
      // harmlessly redundant with the listener below if it has not.
      syncRow(i);
      const onStart = () => syncRow(i);
      row.addEventListener("animationstart", onStart);
      litStartHandlers.push(() => row.removeEventListener("animationstart", onStart));
    });
    cleanups.push(() => litStartHandlers.forEach((fn) => fn()));

    /* --- Geometry ------------------------------------------------------
       The pool's radius scales with the section so it stays a pool rather
       than a pinhole on a large display or a wash on a small one. Kept
       deliberately tight — a torch picking out one part of the face, not
       a general lift of the whole picture. The
       torch copy is sized in pixels to the section, because its own
       parent is only the pool's box. */
    let R = 0;
    const peak = wrap.querySelector<HTMLElement>(".ms-peak")!;
    const baseImg = wrap.querySelector<HTMLImageElement>(".ms-base")!;

    /* Put the peak hotspot where the summit actually lands on screen.
       The image is `cover` on desktop and `contain` on a phone, so the
       mapping is read from the element rather than assumed — same
       arithmetic the browser uses to lay the picture out. */
    const placePeak = () => {
      const nw = baseImg.naturalWidth;
      const nh = baseImg.naturalHeight;
      if (!nw || !nh) return;
      const f = wrap.getBoundingClientRect();
      const ir = baseImg.getBoundingClientRect();
      const cs = getComputedStyle(baseImg);
      const [posX, posY] = cs.objectPosition.split(" ").map(parseFloat);
      const fit =
        cs.objectFit === "contain"
          ? Math.min(ir.width / nw, ir.height / nh)
          : Math.max(ir.width / nw, ir.height / nh);
      const rw = nw * fit;
      const rh = nh * fit;
      const ox = (ir.width - rw) * (posX / 100);
      const oy = (ir.height - rh) * (posY / 100);
      const cx = ir.left - f.left + ox + PEAK_U * rw;
      const cy = ir.top - f.top + oy + PEAK_V * rh;

      // "Top" hotspot — the cursor's "back to top" hit-zone, read by
      // CustomCursor via this element's own rect (a plain axis-aligned
      // box; CustomCursor's overPeak does a straight rectangle test
      // against it, not a circle or ellipse). This has been re-shaped
      // twice now on guesses about what would feel right (a fixed
      // radius, then an ellipse sized off one sampled row) — this pass
      // instead sets it to exactly what was actually specified: the
      // mountain's own measured bounding box (getMountainBBox, the same
      // pixel scan the horizontal verse-fade and the hint centring
      // already read), full width, from its top (the summit) down to
      // its true vertical midpoint. No sampling, no padding, no
      // clamping — left/right/top are the bbox's own min/max run through
      // the same object-fit math as everywhere else in this file, and
      // bottom is the plain average of top and the bbox's own max. If
      // this still doesn't feel right, the fix is a different zone
      // definition, not a fudge factor on this one — it now matches
      // exactly what it's specified to match. Falls back to the old
      // fixed circle for the single frame this can run before the pixel
      // scan (getMountainBBox) exists; placePeak reruns once it does,
      // via the "load" listener further below.
      const bbox = getMountainBBox();
      if (bbox) {
        const leftRender = ir.left - f.left + ox + bbox.minX * fit;
        const rightRender = ir.left - f.left + ox + bbox.maxX * fit;
        const topRender = ir.top - f.top + oy + bbox.minY * fit;
        const bottomRender =
          ir.top - f.top + oy + ((bbox.minY + bbox.maxY) / 2) * fit;
        peak.style.left = `${Math.round(leftRender)}px`;
        peak.style.top = `${Math.round(topRender)}px`;
        peak.style.width = `${Math.round(rightRender - leftRender)}px`;
        peak.style.height = `${Math.round(bottomRender - topRender)}px`;
        peakZoneRect = peak.getBoundingClientRect();

        // The rectangle above is a bounding region, not the silhouette
        // itself — the mountain narrows toward its own peak, so a good
        // deal of the box's own top corners sit over transparent sky,
        // not rock. isOverMountainPixel (below and in CustomCursor) is
        // what actually restricts "Top" to the real pixels; this pushes
        // the current alpha data and object-fit transform to that shared
        // module every time this box changes, so both readers always
        // agree with the same picture at the same moment.
        setMountainAlpha(getAlphaData());
        setMountainTransform({ imgLeft: ir.left, imgTop: ir.top, ox, oy, fit });
      } else {
        const rad = Math.min(Math.max(rw * PEAK_R, 140), 300);
        peak.style.width = `${Math.round(rad * 2)}px`;
        peak.style.height = `${Math.round(rad * 2)}px`;
        peak.style.left = `${Math.round(cx - rad)}px`;
        peak.style.top = `${Math.round(cy - rad)}px`;
      }

      // "Hover to reveal" centres in the mountain's visible area — the
      // full silhouette's bounding box, not the peak's — on both axes.
      // Falls back to the peak-adjacent spot (the pre-bbox behaviour) if
      // the pixel scan isn't available yet (asset not decoded this
      // instant); placePeak reruns once it is, via the same "load"
      // listener that already exists below for it.
      if (bbox) {
        const midX = (bbox.minX + bbox.maxX) / 2;
        const midY = bbox.minY + (bbox.maxY - bbox.minY) * HINT_V_FRACTION;
        hint.style.left = `${Math.round(ir.left - f.left + ox + midX * fit)}px`;
        hint.style.top = `${Math.round(ir.top - f.top + oy + midY * fit)}px`;
      } else {
        hint.style.left = `${Math.round(cx)}px`;
        hint.style.top = `${Math.round(cy + PEAK_LABEL_DY * fit)}px`;
      }
      // Resize/reflow can reposition an already-shown label — keep the
      // hover-to-dismiss hit-test (further down) pointed at where it
      // actually is, not where it used to be.
      if (hintRect) hintRect = hint.getBoundingClientRect();

      // CustomCursor caches .ms-peak's rect rather than reading it fresh
      // every frame (see its own comment), refreshed on scroll/resize —
      // but placePeak can also run on the mountain image's own "load"
      // event, which is neither: land on the page already scrolled to
      // the bottom, before the asset has decoded, and nothing would ever
      // tell the cursor the zone it cached at mount (sized from the
      // pre-bbox fallback) had since been replaced with the real one.
      // Same story on resize, racing two independent listeners rather
      // than one order-dependent on the other. This event is the one
      // signal that is actually true exactly when the geometry changes,
      // in both cases.
      window.dispatchEvent(new Event("ms-peak-updated"));
    };
    placePeakFn = placePeak;

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      wrapRect = r; // resize is the other thing that moves/resizes wrap
      inner.style.width = `${Math.round(r.width)}px`;
      inner.style.height = `${Math.round(r.height)}px`;
      R = Math.round(
        Math.min(Math.max(Math.min(r.width, r.height) * 0.17, 105), 185),
      );
      wrap.style.setProperty("--ms-r", `${R}px`);
      placePeak();
    };
    /* --- Horizontal fade where verse rows pass behind the silhouette ---
       The mountain is opaque, so text drifting into it is already
       hidden — the problem was HOW: a hard, instant cut the moment a
       glyph's pixels cross into opaque rock, no warning on either side.
       This dims each row to the page background approaching the
       silhouette from whichever side it drifts in from, and eases it
       back once clear on the other. Reuses placePeak's own object-fit
       math to find the mountain's real edge at each row's height,
       sampled from the actual asset — the silhouette narrows toward the
       peak and widens at the base, so no single width is right for
       every row. Resting copy only: the torch's whole purpose is
       revealing text inside this exact zone, so it must not be masked
       here too. Recomputed on resize; the sampled pixel data itself is
       cached since the asset never changes underneath it. */
    let alphaData: { data: Uint8ClampedArray; w: number; h: number } | null =
      null;
    const getAlphaData = () => {
      if (alphaData) return alphaData;
      const nw = baseImg.naturalWidth;
      const nh = baseImg.naturalHeight;
      if (!nw || !nh) return null;
      const canvas = document.createElement("canvas");
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(baseImg, 0, 0, nw, nh);
      const { data } = ctx.getImageData(0, 0, nw, nh);
      alphaData = { data, w: nw, h: nh };
      return alphaData;
    };

    /* Full silhouette bounding box (every opaque pixel, not one row's
       worth) — this is "the mountain's visible area" that "Hover to
       reveal" centres in, both axes. A one-off scan over the whole
       image, cached alongside the pixel data it reads: cheap next to the
       getImageData call that already happened for it, and it never has
       to run again for this asset. */
    let mountainBBox: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    } | null = null;
    const getMountainBBox = () => {
      if (mountainBBox) return mountainBBox;
      const alpha = getAlphaData();
      if (!alpha) return null;
      const { data, w, h } = alpha;
      let minX = w;
      let maxX = -1;
      let minY = h;
      let maxY = -1;
      for (let y = 0; y < h; y++) {
        const rowOffset = y * w * 4;
        for (let x = 0; x < w; x++) {
          if (data[rowOffset + x * 4 + 3] > 20) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX === -1) return null;
      mountainBBox = { minX, maxX, minY, maxY };
      return mountainBBox;
    };

    // px either side of the real silhouette edge. Widened from an earlier,
    // narrower pass: at the watermark's own resting strength (a few percent
    // opacity — a texture meant to be felt, not read) a short ramp reads as
    // a hard cut regardless of how correct the underlying gradient is,
    // since there just isn't much opacity range to show a transition
    // across. A longer approach gives the eye more drift-time to register
    // the dimming as gradual rather than sudden.
    const FADE_MARGIN = 140;

    const updateHorizontalFade = () => {
      const alpha = getAlphaData();
      if (!alpha) return;
      const nw = baseImg.naturalWidth;
      const nh = baseImg.naturalHeight;
      const f = wrap.getBoundingClientRect();
      const ir = baseImg.getBoundingClientRect();
      const cs = getComputedStyle(baseImg);
      const [posX, posY] = cs.objectPosition.split(" ").map(parseFloat);
      const fit =
        cs.objectFit === "contain"
          ? Math.min(ir.width / nw, ir.height / nh)
          : Math.max(ir.width / nw, ir.height / nh);
      const rw = nw * fit;
      const rh = nh * fit;
      const ox = ir.left - f.left + (ir.width - rw) * (posX / 100);
      const oy = ir.top - f.top + (ir.height - rh) * (posY / 100);

      const rows = wrap.querySelectorAll<HTMLElement>(".ms-plate .wm-row");
      while (hfade.children.length < rows.length) {
        hfade.appendChild(document.createElement("div"));
      }
      while (hfade.children.length > rows.length) {
        hfade.removeChild(hfade.lastElementChild!);
      }

      rows.forEach((row, i) => {
        const overlay = hfade.children[i] as HTMLElement;
        const rr = row.getBoundingClientRect();
        overlay.style.position = "absolute";
        overlay.style.left = "0";
        overlay.style.right = "0";
        overlay.style.top = `${Math.round(rr.top - f.top)}px`;
        overlay.style.height = `${Math.round(rr.height)}px`;

        // Row's vertical centre, in the source image's own pixel space
        // — which natural-image row this line of glyphs actually lands
        // on, so the sample matches what's rendered at that height.
        const localY = rr.top + rr.height / 2 - f.top - oy;
        const v = localY / rh;
        if (v < 0 || v > 1) {
          // Outside the rendered image entirely — open sky, nothing to
          // hide toward.
          overlay.style.background = "none";
          return;
        }
        const naturalY = Math.min(nh - 1, Math.max(0, Math.round(v * nh)));
        const rowOffset = naturalY * nw * 4;
        let minX = -1;
        let maxX = -1;
        for (let x = 0; x < nw; x++) {
          if (alpha.data[rowOffset + x * 4 + 3] > 20) {
            if (minX === -1) minX = x;
            maxX = x;
          }
        }
        if (minX === -1) {
          overlay.style.background = "none";
          return;
        }
        const leftEdge = ox + minX * fit;
        const rightEdge = ox + maxX * fit;
        // Eased, not linear, over that span — the same smoothstep-style
        // curve (four intermediate stops rather than a straight ramp)
        // already used for the vertical fade near the section's foot.
        // A straight 0-to-1 ramp spends equal distance at every opacity,
        // including the near-invisible tail end where a linear ramp and a
        // hard cut already look almost identical; easing spreads more of
        // the ramp's distance across the portion that is still visible at
        // all, which is what actually reads as "gradual" against a cut.
        const l0 = leftEdge - FADE_MARGIN;
        const l1 = leftEdge - FADE_MARGIN * 0.6;
        const l2 = leftEdge - FADE_MARGIN * 0.3;
        const l3 = leftEdge - FADE_MARGIN * 0.1;
        const r0 = rightEdge + FADE_MARGIN * 0.1;
        const r1 = rightEdge + FADE_MARGIN * 0.3;
        const r2 = rightEdge + FADE_MARGIN * 0.6;
        const r3 = rightEdge + FADE_MARGIN;
        overlay.style.background = `linear-gradient(to right,
          transparent 0,
          transparent ${Math.round(l0)}px,
          rgba(10, 10, 10, 0.15) ${Math.round(l1)}px,
          rgba(10, 10, 10, 0.5) ${Math.round(l2)}px,
          rgba(10, 10, 10, 0.85) ${Math.round(l3)}px,
          var(--bg) ${Math.round(leftEdge)}px,
          var(--bg) ${Math.round(rightEdge)}px,
          rgba(10, 10, 10, 0.85) ${Math.round(r0)}px,
          rgba(10, 10, 10, 0.5) ${Math.round(r1)}px,
          rgba(10, 10, 10, 0.15) ${Math.round(r2)}px,
          transparent ${Math.round(r3)}px,
          transparent 100%)`;
      });
    };
    updateHorizontalFadeFn = updateHorizontalFade;

    measure();
    updateHorizontalFade();
    if (baseImg.complete) {
      placePeak();
      updateHorizontalFade();
      mountainReady = true;
      tryShowHint();
    } else {
      baseImg.addEventListener(
        "load",
        () => {
          placePeak();
          updateHorizontalFade();
          mountainReady = true;
          tryShowHint();
        },
        { once: true },
      );
    }
    const onResize = () => {
      measure();
      updateHorizontalFade();
    };
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));

    /* --- Eased tracking ----------------------------------------------- */
    let tx = 0;
    let ty = 0; // where the cursor is
    let cx = 0;
    let cy = 0; // where the pool has got to
    let placed = false; // first sighting snaps, so it never streaks in
    let litTarget = 0;
    let lit = 0;

    const onMove = (e: PointerEvent) => {
      // Cached (see wrapRect above), not read fresh here: this fires on
      // every pointermove, far more often than the rect can actually
      // have changed, and applyIn/measure already keep it current for
      // the two things that do change it (scroll, resize).
      const r = wrapRect;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      // Ease the glow out over the nav bar's approach, so descending into
      // the links puts the torch away instead of dragging it down there.
      const fromFoot = r.height - y;
      const nav = Math.max(
        0,
        Math.min(1, (fromFoot - NAV_ZONE) / (NAV_FADE - NAV_ZONE)),
      );
      litTarget = inside ? nav : 0;
      if (!inside) return;
      // Cursor actually over the label's own text (not just near it, and
      // not on any timer) is what dismisses it now — see hintRect/
      // dismissHint above.
      if (
        hintRect &&
        e.clientX >= hintRect.left &&
        e.clientX <= hintRect.right &&
        e.clientY >= hintRect.top &&
        e.clientY <= hintRect.bottom
      ) {
        dismissHint();
      }
      // Also dismiss the moment "Top" itself would be offered — the same
      // pixel-accurate zone CustomCursor checks (peakZoneRect's box, and
      // only actually opaque pixels within it — see mountain-hit-test).
      // Once that's showing, "Hover to reveal" sitting there too is the
      // exact overlap it exists to avoid: the reader has already found
      // the thing it was pointing at.
      if (
        peakZoneRect &&
        e.clientX >= peakZoneRect.left &&
        e.clientX <= peakZoneRect.right &&
        e.clientY >= peakZoneRect.top &&
        e.clientY <= peakZoneRect.bottom &&
        isOverMountainPixel(e.clientX, e.clientY)
      ) {
        dismissHint();
      }
      tx = x;
      ty = y;
      if (!placed) {
        cx = x;
        cy = y;
        placed = true;
      }
    };
    const onLeave = () => {
      litTarget = 0;
    };

    // `pointerover` as well as `pointermove`, so a cursor already resting
    // over the section when it scrolls in does not wait for a jiggle.
    window.addEventListener("pointerover", onMove);
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dx = tx - cx;
      const dy = ty - cy;
      const dl = litTarget - lit;
      if (Math.abs(dx) < IDLE && Math.abs(dy) < IDLE && Math.abs(dl) < 0.001) {
        return;
      }
      cx += dx * EASE;
      cy += dy * EASE;
      lit += dl * LIT_EASE;
      /* Snap the pool to whole device pixels. The two stacks stay in
         perfect register either way — the mover and the counter-transform
         always sum to R — but on a fractional offset the lit copy is
         rasterised on a different subpixel phase from the resting copy
         beneath it. Identical text, two antialiasing phases, blended
         together wherever the pool is semi-transparent: it reads as a
         doubled, shimmering ghost of the verses following the cursor. */
      const grid = window.devicePixelRatio || 1;
      const sx = Math.round(cx * grid) / grid;
      const sy = Math.round(cy * grid) / grid;
      mover.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
      inner.style.transform = `translate3d(${R - sx}px, ${R - sy}px, 0)`;
      torch.style.opacity = lit.toFixed(3);
    };
    raf = requestAnimationFrame(tick);

    cleanups.push(() => {
      window.removeEventListener("pointerover", onMove);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      wrap.classList.remove("ms-live");
      setMountainAlpha(null);
      setMountainTransform(null);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="ms-field pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
    >
      {/* sRGB, not the linearRGB default — the curve is chosen against the
          values as authored, and linear light would wash the midtones. */}
      <svg className="absolute h-0 w-0" aria-hidden focusable="false">
        <filter id="ms-lift" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="table" tableValues={LIFT_TABLE} />
            <feFuncG type="table" tableValues={LIFT_TABLE} />
            <feFuncB type="table" tableValues={LIFT_TABLE} />
          </feComponentTransfer>
        </filter>
      </svg>
      {/* Resting stack: verses barely there, mountain held back. */}
      <div className="ms-plate">
        {/* Not hebrew-mask-fade: that class's fixed-pixel fade exists for
            the hero's bottom nav specifically (see its rule in
            globals.css). This section's own boundary — the mountain's
            foot, not a fixed distance from the section's — is the
            `.ms-field .ms-hebrew` rule below it, which higher specificity
            already made the effective one; carrying the unused class
            here just left a dead, misleading pairing between the two. */}
        <div className="ms-hebrew">
          <HebrewWatermark />
        </div>
        {/* Stationary scrims, one per verse row, painted between the text
            and the mountain — see updateHorizontalFade in the effect
            above for why they can't just be a mask on the rows
            themselves (the rows translate for the drift; a mask on a
            translating element translates with it, so it could never
            stay pinned to the stationary silhouette). Populated and
            positioned entirely from JS; nothing here is static. */}
        <div ref={hfadeRef} className="ms-hfade" aria-hidden />
        {/* Plain <img>, not next/image: the file is already emitted at the
            exact width it is displayed at, by scripts/optimize-images.sh,
            and tuned to hold its shadow detail under the torch's lift.
            Passing it through the optimiser would re-encode it at the
            default quality and undo precisely that. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SRC} alt="" className="ms-base" draggable={false} />
      </div>

      {/* Where the summit lands. Nothing is drawn here — it exists so the
          cursor can ask where the peak is without repeating the
          object-fit arithmetic. Placed by placePeak(). */}
      <div className="ms-peak" />

      {/* Nudge that the dark shape is worth lighting up. Shown and
          dismissed from the effect above (hover-to-dismiss, not a
          timer); CSS only handles what each class looks like.
          Positioned by placePeak(), in the mountain's own visible area.
          Split into per-character spans (HINT_CHARS, module scope) so it
          can carry the same travelling wave as the cursor's own
          "Scroll" hint (CustomCursor's CH_STEP_MS) — except the spaces,
          left as plain text rather than their own span: an
          inline-block whose only content is whitespace collapses to
          zero width (confirmed live: every space span measured 0px),
          which is what was actually gluing the three words together
          rather than any spacing rule. Nothing to ripple on a space
          either way. */}
      <p ref={hintRef} className="ms-hint" aria-hidden>
        {HINT_CHARS.map(({ ch, delay }, i) =>
          ch === " " ? (
            " "
          ) : (
            <span
              key={i}
              className="cursor-ch"
              style={{ animationDelay: `${delay}ms` }}
            >
              {ch}
            </span>
          ),
        )}
        {/* Same shine sweep as the skill icons (.skill-shine): a second
            copy of the text, laid exactly over the first via inset:0,
            clipped to its own glyphs with background-clip so the
            highlight only ever crosses actual letterforms — the text
            equivalent of the icons' mask-image: url(icon), which has no
            meaning for type. Re-timed to 3s rather than the icons' own
            3.4s so it shares cursor-ch-wave's own cycle length: both
            start the instant .ms-hint-in lands, so the sweep and the
            ripple always begin together rather than drifting in and out
            of phase against each other. */}
        <span className="ms-hint-shine" aria-hidden>
          Hover to reveal
        </span>
      </p>

      {/* Lit stack: same two layers, clipped to the pool. */}
      <div ref={torchRef} className="ms-torch">
        <div ref={moverRef} className="ms-torch-mover">
          <div ref={innerRef} className="ms-torch-inner">
            <div className="ms-hebrew ms-hebrew-lit">
              <HebrewWatermark />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SRC} alt="" className="ms-torch-img" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
