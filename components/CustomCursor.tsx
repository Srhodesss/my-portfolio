"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { isOverMountainPixel } from "@/lib/mountain-hit-test";
import { smoothToTop } from "@/lib/section-nav";

/**
 * Site-wide custom cursor: a thin accent ring with a white dot at its
 * centre. The dot is a CHILD of the ring, so the two share one position
 * and can never drift apart — previously the dot was written instantly
 * while the ring eased behind it, and the gap between them was visible on
 * every fast move.
 *
 * Over interactive elements the palette inverts: the dot turns orange and
 * the ring turns white. Over the folder the ring carries an "Open" label.
 * Over the /work cards the whole thing yields to the "View" bubble. And
 * over the summit of the closing section's mountain it offers "Top" for
 * two seconds.
 *
 * Fine pointers with motion allowed only — touch devices and
 * reduced-motion users keep the system cursor (the `cursor-off` opt-out,
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
      // The CSS hides the native cursor by default for a fine pointer with
      // motion allowed. If that no longer holds by the time this runs (a
      // coarse pointer attached, motion preference flipped), opt back out
      // rather than leaving the reader with no cursor at all. This is the
      // ONLY place anything re-adds cursor-off.
      document.documentElement.classList.add("cursor-off");
      return;
    }
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;
    // NOTE: cursor-off is deliberately NOT cleared here. Mount is not the
    // moment the custom cursor becomes visible — the ring sits at
    // autoAlpha 0 until the first pointermove tells it where to draw.
    // Clearing it here suppressed the native cursor while nothing had
    // replaced it. setCursorShown below is the only thing that may clear
    // it, and only at the moment the ring is actually drawn.
    gsap.set(ring, { autoAlpha: 0 });

    /* ONE suppression, tied to one fact: is the custom cursor actually
       drawn right now. Every visual state (hint, hot, open, top) is a
       class on `ring` and layers on top of this — none of them touch the
       native cursor, and none ever did.
       What did leave a gap was the ring's own visibility having a
       separate lifecycle from the suppression. The ring starts at
       autoAlpha 0 and only becomes visible on the first pointermove, and
       onLeave drops it back to 0 — so between load and the first move,
       and between the pointer leaving the window and moving again inside
       it, the native cursor was suppressed while nothing was drawn in its
       place. Zero cursors in state, and on WebKit the OS arrow drawn
       anyway because it had never been redrawn. Both windows now hand the
       real cursor back instead. */
    let cursorShown = false;
    const setCursorShown = (shown: boolean) => {
      if (shown === cursorShown) return;
      cursorShown = shown;
      document.documentElement.classList.toggle("cursor-off", !shown);
    };

    /* Self-healing, so suppression never depends on having enumerated
       every way it can be released. Wired to scroll and pointerover
       below (both already fire for the WebKit redraw nudge): if the
       pointer is demonstrably inside the document, assert suppression
       again rather than waiting for a mouse move that may never come
       while the reader is only scrolling. */
    const reassertIfInside = () => {
      if (cursorShown) return;
      if (!document.documentElement.matches(":hover")) return;
      setCursorShown(true);
      gsap.to(ring, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
    };

    // Confirmed WebKit bug (bugs.webkit.org #14344/#53341/#101857):
    // Safari doesn't redraw the native cursor icon on a CSS `cursor`
    // change alone — only an actual pointer move does, unlike Chromium,
    // which re-evaluates immediately. The CSS rule is a real,
    // synchronous, unconditional style change the instant this effect
    // runs, but on Safari the native cursor set at PAGE LOAD (before this
    // ever ran) stays drawn on top of the now-hidden one until the reader
    // actually moves the mouse — which can be well after this mounts, if
    // they read the scripture intro without moving it and only interact
    // by clicking "Enter Site". A synthetic mousemove forces the redraw
    // without needing a real one. Plain MouseEvent, not PointerEvent: the
    // ring's own onMove listener below only listens for pointermove, so
    // this doesn't also flash the ring at a fake position before the
    // reader's real cursor location is known. Deferred a frame so the
    // class above has actually been style-recalculated by the time
    // WebKit re-evaluates, rather than racing the two in the same task.
    requestAnimationFrame(() => {
      document.dispatchEvent(new MouseEvent("mousemove"));
    });

    /* The same WebKit redraw problem, but on scroll. Scrolling slides a
       different element under a stationary pointer, WebKit re-evaluates
       the cursor for it and draws the native arrow again, so the OS
       cursor reappeared the moment the page started moving and stayed
       until the reader jogged the mouse. Nudging it with the same
       synthetic move keeps cursor:none honoured through the scroll.

       Coalesced to one dispatch per frame, and WebKit-only: Chromium
       re-evaluates the cursor on its own and would just be paying for a
       pointless event. MouseEvent, not PointerEvent - onMove below
       listens for pointermove, so this cannot move the ring to a fake
       position. No layout is read or written here, which matters because
       this is a scroll path. */
    let cursorNudge = 0;
    const keepCursorHidden = () => {
      if (cursorNudge) return;
      cursorNudge = requestAnimationFrame(() => {
        cursorNudge = 0;
        document.dispatchEvent(new MouseEvent("mousemove"));
      });
    };
    const isWebKit = document.documentElement.classList.contains("wk");
    if (isWebKit) {
      window.addEventListener("scroll", keepCursorHidden, { passive: true });
      window.addEventListener("scroll", reassertIfInside, { passive: true });
      document.addEventListener("pointerover", reassertIfInside, {
        passive: true,
      });
      /* Scroll is only one way the element under a stationary pointer
         changes. A route change, an overlay opening, a pinned section
         releasing, or any reflow does it too — and each one is another
         moment WebKit re-evaluates the cursor and draws the native arrow
         back. pointerover is the signal for exactly that event, whatever
         caused it, so it catches the cases an enumerated list would miss.
         Dispatching a mousemove does not itself fire pointerover, so this
         cannot feed itself. */
      document.addEventListener("pointerover", keepCursorHidden, {
        passive: true,
      });
    }

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
      setCursorShown(true);
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

    /* The label is built from per-character spans so it can carry the
       same travelling wave the CTAs use on hover: each character takes a
       delay stepped by index, so the lift runs through the word rather
       than the whole label bobbing as one. Rebuilt only when the text
       actually changes, so the animation is not restarted every frame. */
    const CH_STEP_MS = 60;
    let labelText = "";
    const setLabel = (text: string) => {
      if (text === labelText) return;
      labelText = text;
      label.textContent = "";
      Array.from(text).forEach((ch, i) => {
        const span = document.createElement("span");
        span.className = "cursor-ch";
        span.textContent = ch;
        span.style.animationDelay = `${i * CH_STEP_MS}ms`;
        label.appendChild(span);
      });
    };

    /* "Top" is an offer, not a fixture. It used to sit on the cursor for
       as long as the reader was anywhere in the closing section, which
       said the same thing over and over while they were still reading.
       Now it belongs to one place: the summit — the cursor shows it for
       exactly as long as the pointer is inside the zone MountSinai
       defines (`.ms-peak`, the peak down to roughly the middle of the
       mountain — see placePeak there), and drops it the instant the
       pointer leaves, whichever direction that happens in.

       This used to also cap the offer at two seconds even while the
       cursor sat still on the peak, on the reasoning that a nag reads
       worse than an early withdrawal — but a timer with no relationship
       to where the cursor actually is is exactly what a "temperamental"
       bug report describes: it vanishes on someone who is still reading
       it, then (since leaving resets the clock) reappears the moment
       they move, so it looks like it's flickering on its own rather than
       responding to them. The zone itself is the whole guarantee now:
       reading topOffered as a plain, un-timed overPeak() means "showing"
       and "inside the zone" are the same fact, not two things that can
       drift apart.

       MountSinai owns where the peak is (`.ms-peak`, placed through the
       same object-fit arithmetic the browser lays the picture out with),
       so this only has to ask. */

    /* The peak's rect, cached rather than read fresh on every call: this
       used to re-query the DOM and force a synchronous layout on every
       single animation frame of syncState below — unconditionally,
       everywhere on the site, not only near the mountain — stacked on
       top of MountSinai's own per-frame tracking work doing the same
       kind of read for its torch. Two independent per-frame layout reads
       fighting over the same element is exactly what shows up as
       stutter. The peak only actually moves on scroll (its position is
       fixed relative to the section, which itself scrolls with the
       page) or resize, both listened for below, so a cached rect is
       correct in between — cheap arithmetic against it is all overPeak
       needs to do every frame. */
    let peakEl: Element | null = null;
    let peakRect: DOMRect | null = null;
    const refreshPeakRect = () => {
      if (!peakEl) peakEl = document.querySelector(".ms-peak");
      peakRect = peakEl ? peakEl.getBoundingClientRect() : null;
    };
    refreshPeakRect();
    let peakRaf = 0;
    // Scroll position the cached rect was taken at. .ms-peak is fixed in
    // the document, so its viewport rect is a pure function of where the
    // page is: an event at an unchanged position can only re-read the
    // same numbers. That is the state at the very bottom of the page,
    // where the position is clamped at its maximum while momentum and
    // rubber-banding keep firing scroll events — this refresh and the
    // section read below it were the last 2 forced layout reads per
    // event measured there. Resize clears it, since the rect can move
    // with the page standing still; so does the ms-peak-updated event,
    // which is MountSinai saying it has repositioned the element.
    let peakY = Number.NaN;
    const onPeakGeometryChange = () => {
      if (peakRaf) return;
      // The position guard may not suppress a refresh while the cached
      // rect is unusable, or a bad reading taken at one offset would
      // survive every future visit to that same offset.
      const usable = !!peakRect && !!peakRect.width && !!peakRect.height;
      if (usable && window.scrollY === peakY) return;
      peakRaf = requestAnimationFrame(() => {
        peakRaf = 0;
        peakY = window.scrollY;
        refreshPeakRect();
      });
    };
    const onPeakGeometryInvalidated = () => {
      peakY = Number.NaN;
      onPeakGeometryChange();
    };
    window.addEventListener("scroll", onPeakGeometryChange, { passive: true });
    window.addEventListener("resize", onPeakGeometryInvalidated);
    // The authoritative signal: MountSinai dispatches this the instant it
    // actually repositions/resizes .ms-peak (mount, resize, AND the
    // mountain image's own "load" — the case scroll/resize above can't
    // cover, since decoding isn't tied to either). Read immediately, not
    // rAF-deferred like the two above: this fires at most a few times
    // total, never on a hot path, so there's no thrash to guard against.
    window.addEventListener("ms-peak-updated", onPeakGeometryInvalidated);

    // Two checks, not one: peakRect (a plain axis-aligned box — placePeak
    // sizes .ms-peak to exactly the mountain's own measured bounding box,
    // full width, summit to vertical midpoint) is a cheap pre-filter, but
    // the mountain narrows toward its own peak, so a good deal of that
    // box's upper corners sit over transparent sky rather than rock. A
    // rectangle test alone offered "Top" there too, which is the actual
    // "triggers when the cursor isn't over the mountain" bug — the fix
    // is the real pixel data, not a smaller or differently-shaped box.
    // isOverMountainPixel reads the same alpha data and transform
    // MountSinai pushes to mountain-hit-test on every reposition, so
    // this always agrees with wherever the picture actually is.
    const overPeak = () => {
      if (px < 0) return false;
      // Self-heal from an UNUSABLE rect, not merely a missing one. This
      // used to test `!peakRect`, so it recovered when MountSinai had not
      // mounted yet but never when a zero-sized rect had been cached —
      // and that is a state this actually reaches: .ms-peak measures 0x0
      // whenever the closing field is hidden (visibility:hidden at the
      // top of the page) or placePeak has not run because .ms-live is not
      // applied. Caching one left peakRect non-null but useless, so the
      // heal never fired and "Top" stayed dead. Combined with the
      // scroll-position guard on the refresh below, returning to the same
      // scroll offset the bad rect was cached at meant it never refreshed
      // either — which is "works once, then never again".
      if (!peakRect || !peakRect.width || !peakRect.height) refreshPeakRect();
      if (!peakRect || !peakRect.width || !peakRect.height) return false;
      return (
        px >= peakRect.left &&
        px <= peakRect.right &&
        py >= peakRect.top &&
        py <= peakRect.bottom &&
        isOverMountainPixel(px, py)
      );
    };

    // No timer, no latched "was it just shown" state: whether "Top" is
    // offered is exactly whether the cursor is in the zone this frame,
    // full stop. See the comment above for why a timer used to make this
    // feel unreliable.
    const topOffered = overPeak;

    let stateRaf = 0;
    const syncState = () => {
      stateRaf = requestAnimationFrame(syncState);
      if (px < 0) return;
      const target = document.elementFromPoint(px, py);
      const interactive = target?.closest(
        "a, button, [role='button'], input, textarea, select, label",
      );
      const folder = target?.closest(".work-folder");

      // Anything genuinely clickable outranks the hint. Hovering a nav
      // link while the hint was up kept showing "Scroll" over a control,
      // which read as though the link did nothing. Falling through here
      // gives the link its own cursor, and moving back onto the hero
      // brings the hint straight back because `hinting` is untouched.
      if (hinting && !folder && !interactive) {
        ring.classList.add("cursor-hint");
        ring.classList.remove("cursor-hot", "cursor-open");
        dot.classList.remove("cursor-hot");
        setLabel("Scroll");
        return;
      }
      ring.classList.remove("cursor-hint");

      // Only while the offer stands, and never over something genuinely
      // clickable (the nav keeps its own cursor).
      const closing = !interactive && topOffered();


      ring.classList.toggle("cursor-hot", !!interactive && !folder);
      dot.classList.toggle("cursor-hot", !!interactive && !folder);
      ring.classList.toggle("cursor-open", !!folder);
      ring.classList.toggle("cursor-top", closing);
      setLabel(folder ? "Open" : closing ? "Top" : "");
    };
    stateRaf = requestAnimationFrame(syncState);

    /* Only a GENUINE exit from the window may hand the native cursor
       back. pointerleave on the root also fires while the pointer is
       still inside the document whenever the element under it is removed
       or replaced — which is what a route change, an overlay opening and
       scrolling content past a stationary pointer all do. Releasing
       suppression on those drew the OS arrow and left it there until the
       next real mouse move, which is why this reappeared "at
       unpredictable moments" and specifically on scroll.
       A real exit has no relatedTarget (the pointer went to browser
       chrome or off-screen) and leaves the root no longer matching
       :hover. Either one still pointing inside means stay suppressed. */
    const pointerStillInside = (e: PointerEvent) =>
      !!e.relatedTarget || document.documentElement.matches(":hover");
    const onLeave = (e: PointerEvent) => {
      if (pointerStillInside(e)) return;
      gsap.to(ring, { autoAlpha: 0, duration: 0.25 });
      setCursorShown(false);
    };


    // Click to travel back to the top — but only while the cursor is
    // actually showing "Top". This used to also fire on any click
    // anywhere in the closing section's ground, a leftover from before
    // the peak-hover affordance existed: it meant clicking the section
    // away from the summit — where the cursor shows nothing, or "Scroll"
    // — silently jumped to the top anyway, disagreeing with what was on
    // screen. The affordance and the action must never disagree: the
    // indicator is the only thing promising this click does something,
    // so it is the only thing allowed to authorise it.
    // This one scrolls the whole way rather than cross-fading: the
    // reader is at the end of the page and watching it rewind is the
    // point.
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("a, button, [role='button']")) return;
      if (!topOffered()) return;
      smoothToTop();
    };
    document.addEventListener("click", onClick);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.documentElement.classList.add("cursor-off");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("click", onClick);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", keepCursorHidden);
      window.removeEventListener("scroll", reassertIfInside);
      document.removeEventListener("pointerover", reassertIfInside);
      document.removeEventListener("pointerover", keepCursorHidden);
      cancelAnimationFrame(cursorNudge);
      window.removeEventListener("scroll", onScrolled);
      window.removeEventListener("scroll", onPeakGeometryChange);
      window.removeEventListener("resize", onPeakGeometryInvalidated);
      window.removeEventListener("ms-peak-updated", onPeakGeometryInvalidated);
      cancelAnimationFrame(peakRaf);
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
