"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";
import PdfPage from "@/components/PdfPage";
import type { CaseDeck as Deck } from "@/lib/case-decks";
import FlipLink from "@/components/FlipLink";

/**
 * Page-by-page slideshow of a project's source document, built on Embla.
 *
 * Pages are rendered from the actual (compressed) PDF by PDF.js — vector
 * text stays crisp and zoom-sharp at any size, instead of the old
 * downscaled 1400px JPEGs. Only the current slide and its immediate
 * neighbours are activated, so a long deck never renders every page.
 *
 * The whole viewer is one viewport tall: header, a flex slide area that
 * takes the remaining height, and the footer/progress bar — so a page and
 * its progress bar are always fully visible with no vertical scrolling.
 *
 * The ClassNames plugin tags the snapped slide (`.is-selected`) so
 * neighbours can recede in CSS. The progress bar is labelled with the real
 * section title extracted from the PDF where one was detectable.
 */
export default function CaseDeck({
  title,
  slug,
  deck,
  perView = 1,
}: {
  title: string;
  /** Used so "back" returns to this project's row in the index. */
  slug: string;
  deck: Deck;
  /** Slides visible at once. Long documents read better several-up. */
  perView?: number;
}) {
  const [emblaRef, embla] = useEmblaCarousel(
    {
      loop: false,
      align: "center",
      slidesToScroll: 1,
      // Without this, a multi-up deck stops snapping two pages early: the
      // final snap centres the second-to-last group, so the last pages can
      // never be reached and the bar never fills.
      containScroll: false,
      skipSnaps: false,
      duration: 22,
      // Drag-free-snap: the drag itself is unconstrained and carries its
      // momentum, and only once that momentum settles does the deck ease
      // onto the nearest page. A flick can therefore cross several pages
      // and still come to rest squarely on one.
      dragFree: true,
    },
    [ClassNames({ snapped: "is-selected", inView: "is-in-view" })],
  );
  /* A multi-up deck is only readable while each page still has room. At
     three-up on a phone every page came out about 130px wide, which is
     no longer a document. The requested count is therefore a ceiling,
     narrowed by the viewport, and Embla is re-initialised whenever it
     changes so the snap positions match what is on screen. */
  const [perViewNow, setPerViewNow] = useState(perView);
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const n = w < 640 ? 1 : w < 1024 ? Math.min(perView, 2) : perView;
      setPerViewNow((prev) => (prev === n ? prev : n));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [perView]);
  useEffect(() => {
    embla?.reInit();
  }, [embla, perViewNow]);

  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setPage(embla.selectedScrollSnap() + 1);
    // Only dim the controls at the true ends of the document.
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  const onProgress = useCallback(() => {
    if (embla) setProgress(Math.min(1, Math.max(0, embla.scrollProgress())));
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect).on("reInit", onSelect);
    embla.on("scroll", onProgress).on("reInit", onProgress);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
      embla.off("scroll", onProgress).off("reInit", onProgress);
    };
  }, [embla, onSelect, onProgress]);

  /* Draggable scrollbar. Embla ships this as a pattern rather than a
     plugin, so it is wired straight to the API: the thumb reflects
     scrollProgress, and dragging maps the pointer back onto a slide. */
  useEffect(() => {
    if (!embla) return;
    const bar = barRef.current;
    if (!bar) return;

    const seek = (clientX: number) => {
      const r = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const snaps = embla.scrollSnapList().length;
      embla.scrollTo(Math.round(ratio * (snaps - 1)));
    };
    const down = (e: PointerEvent) => {
      draggingRef.current = true;
      bar.setPointerCapture(e.pointerId);
      seek(e.clientX);
    };
    const move = (e: PointerEvent) => {
      if (draggingRef.current) seek(e.clientX);
    };
    const up = (e: PointerEvent) => {
      draggingRef.current = false;
      try {
        bar.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    };
    bar.addEventListener("pointerdown", down);
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
    bar.addEventListener("pointercancel", up);
    return () => {
      bar.removeEventListener("pointerdown", down);
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", up);
      bar.removeEventListener("pointercancel", up);
    };
  }, [embla]);

  /* Drag-free-snap, second half: dragFree lets the momentum run, and
     when Embla reports the motion settled we ease onto whichever page is
     closest. The guard stops that corrective scroll from settling into
     another correction. */
  useEffect(() => {
    if (!embla) return;
    let correcting = false;
    const onSettle = () => {
      if (correcting) {
        correcting = false;
        return;
      }
      const progress = Math.min(1, Math.max(0, embla.scrollProgress()));
      const snaps = embla.scrollSnapList();
      if (snaps.length < 2) return;
      let closest = 0;
      let best = Infinity;
      snaps.forEach((s, i) => {
        const d = Math.abs(s - progress);
        if (d < best) {
          best = d;
          closest = i;
        }
      });
      if (closest === embla.selectedScrollSnap() && best < 0.001) return;
      correcting = true;
      embla.scrollTo(closest);
    };
    embla.on("settle", onSettle);
    return () => {
      embla.off("settle", onSettle);
    };
  }, [embla]);

  /* macOS turns a two-finger swipe right into browser back navigation
     whenever the page cannot scroll that way, and it claims the gesture
     from the first event, before this deck's own threshold has been met.
     preventDefault on the wheel handler is therefore too late to help:
     the fix is overscroll-behavior, which tells the browser there is no
     horizontal overscroll to act on. It is set on the root for as long as
     a deck is mounted and lifted again on the way out, so the gesture
     still works normally everywhere else on the site. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("deck-open");
    return () => root.classList.remove("deck-open");
  }, []);

  /* Two-finger trackpad swipe.

     A horizontal trackpad gesture arrives as a long stream of small
     deltaX events, and on macOS the stream keeps running as momentum for
     well over a second after the fingers lift. The first version latched
     "one page per gesture" and cleared the latch on a quiet timer, which
     the momentum tail kept resetting: the latch never released, so the
     swipe worked exactly once and only in the direction that happened to
     fire first.

     This version has no latch. Distance is accumulated and a page turns
     every STEP pixels, so the count follows the force of the swipe by
     itself: a light flick travels one step and moves one page, a hard
     flick carries its momentum across several. Reversing direction
     mid-gesture zeroes the accumulator, so back and forth both work and
     keep working. The axis is locked when the gesture starts, so a swipe
     that begins horizontally is not stolen by a stray vertical delta. */
  useEffect(() => {
    if (!embla) return;
    const node = embla.rootNode();

    const STEP = 55; // px of travel per page
    const QUIET_MS = 140; // silence that ends a gesture
    const MAX_PAGES = 14; // ceiling on one momentum tail

    let travel = 0;
    let pages = 0;
    let axis: "x" | "y" | null = null;
    let quiet = 0;

    const endGesture = () => {
      travel = 0;
      pages = 0;
      axis = null;
    };

    const onWheel = (e: WheelEvent) => {
      // Lock the axis on the first event of a gesture and keep it for the
      // whole stream, momentum included.
      if (axis === null) {
        axis = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? "x" : "y";
      }
      const delta = axis === "x" ? e.deltaX : e.shiftKey ? e.deltaY : 0;

      // Claim every event of a horizontal gesture, including the ones
      // below the page-turn threshold and the momentum tail. Claiming
      // only the ones that turn a page left gaps the browser could read
      // as an unhandled sideways swipe.
      if (axis === "x" || e.shiftKey) e.preventDefault();

      window.clearTimeout(quiet);
      quiet = window.setTimeout(endGesture, QUIET_MS);
      if (!delta) return;

      // A reversal is a new intent, not a continuation.
      if (travel !== 0 && Math.sign(delta) !== Math.sign(travel)) {
        travel = 0;
        pages = 0;
      }
      travel += delta;

      const want = Math.min(MAX_PAGES, Math.floor(Math.abs(travel) / STEP));
      const forward = travel > 0;
      while (pages < want) {
        if (forward ? !embla.canScrollNext() : !embla.canScrollPrev()) {
          pages = want;
          break;
        }
        if (forward) embla.scrollNext();
        else embla.scrollPrev();
        pages += 1;
      }
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
      window.clearTimeout(quiet);
    };
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        embla.scrollNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        embla.scrollPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embla]);

  // Thumb width = the share of the document on screen at once.
  const thumbPct = Math.min(100, (100 / deck.pages) * perViewNow);

  // The index marks numbered sections only — one entry per section, at the
  // page it opens on, rather than a tick for every sub-page. The label
  // carries the section forward across its pages.
  const sections = deck.sections ?? [];
  const hasSections = sections.some(Boolean);
  const currentSection = hasSections
    ? (sections.slice(0, page).filter(Boolean).pop() ?? null)
    : (deck.titles?.[page - 1] ?? null);
  const sectionTitle = currentSection;

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-bg">
      <header className="flex shrink-0 items-baseline justify-between px-6 pt-6 md:px-12 lg:px-20">
        <FlipLink
          href={`/work#${slug}`}
          label="Projects"
          underline
          backArrow
          className="text-overline uppercase tracking-[0.05em] text-text-muted"
        />
        {/* The deck IS the case study for these projects, so this is the
            page's document heading, not a caption. It stays styled as an
            overline. */}
        <h1 className="text-overline uppercase tracking-[0.05em] text-text-muted">
          {title} · {deck.label}
        </h1>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center py-4">
        {/* Edge arrows. Large, quiet targets pinned to the sides of the
            page area, so turning a page never depends on knowing that the
            deck can be dragged. They dim out at the ends of the document
            rather than disappearing, so the control never shifts. */}
        <button
          type="button"
          onClick={() => embla?.scrollPrev()}
          disabled={!canPrev}
          aria-label="Previous page"
          className={`deck-arrow deck-arrow-prev ${canPrev ? "" : "is-off"}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path
              d="M15 5 8 12l7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => embla?.scrollNext()}
          disabled={!canNext}
          aria-label="Next page"
          className={`deck-arrow deck-arrow-next ${canNext ? "" : "is-off"}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path
              d="m9 5 7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className="embla h-full w-full overflow-hidden"
          data-multi={perViewNow > 1 ? "true" : undefined}
          style={{ ["--slides" as string]: perViewNow }}
          ref={emblaRef}
        >
          <div className="embla__container flex h-full touch-pan-y">
            {Array.from({ length: deck.pages }, (_, i) => (
              <div className="embla__slide h-full" key={i}>
                <PdfPage
                  url={deck.pdf}
                  page={i + 1}
                  active={Math.abs(i + 1 - page) <= perViewNow}
                  label={`${title} — page ${i + 1} of ${deck.pages}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="shrink-0 px-6 pb-6 md:px-12 lg:px-20">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
            {sectionTitle ? (
              <>
                <span className="text-text">{sectionTitle}</span>
                <span className="mx-2 opacity-50">·</span>
              </>
            ) : null}
            Page {page} / {deck.pages}
          </p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => embla?.scrollPrev()}
              disabled={!canPrev}
              className={`text-overline uppercase tracking-[0.05em] transition-colors ${
                canPrev
                  ? "text-text-muted hover:text-accent"
                  : "cursor-default text-text-muted/25"
              }`}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => embla?.scrollNext()}
              disabled={!canNext}
              className={`text-overline uppercase tracking-[0.05em] transition-colors ${
                canNext
                  ? "text-text-muted hover:text-accent"
                  : "cursor-default text-text-muted/25"
              }`}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Scrollbar and progress in one control: the track fills orange
            behind the thumb to show how far through the document you are,
            so no separate progress line is needed. */}
        <div
          ref={barRef}
          className="deck-scrollbar relative mt-3 h-2 w-full cursor-grab touch-none overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={page}
          aria-valuemin={1}
          aria-valuemax={deck.pages}
          aria-label={
            sectionTitle
              ? `${sectionTitle} — page ${page} of ${deck.pages}`
              : `Page ${page} of ${deck.pages}`
          }
        >
          {/* Fill runs to the thumb's trailing edge, so the orange and
              the handle can never disagree — both come from one value. */}
          <div
            className="absolute inset-y-0 left-0 bg-accent/70"
            style={{ width: `${thumbPct + progress * (100 - thumbPct)}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/70"
            style={{
              width: `${thumbPct}%`,
              // translateX is a share of the THUMB's width, so the travel
              // distance has to be expressed relative to it.
              transform: `translateX(${
                thumbPct > 0
                  ? (progress * (100 - thumbPct) * 100) / thumbPct
                  : 0
              }%)`,
            }}
          />
        </div>

        {(hasSections ? sections : (deck.titles ?? [])).some(Boolean) && (
          <div className="relative mt-2 h-3">
            {(hasSections ? sections : (deck.titles ?? [])).map((t, i) =>
              t ? (
                <button
                  key={i}
                  type="button"
                  title={t}
                  aria-label={`Jump to ${t}`}
                  onClick={() => embla?.scrollTo(i)}
                  className={`absolute top-0 h-3 w-px transition-colors ${
                    i + 1 === page ? "bg-accent" : "bg-white/25 hover:bg-white/60"
                  }`}
                  style={{ left: `${(i / (deck.pages - 1)) * 100}%` }}
                />
              ) : null,
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
