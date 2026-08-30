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
      // One page per drag: a gesture past the threshold snaps to the
      // neighbouring page instead of coasting through several.
      skipSnaps: false,
      duration: 26,
      dragThreshold: 12,
      // Not drag-free: the drag is constrained to the carousel's own
      // snap points, so releasing past the threshold advances exactly
      // one page and releasing short of it springs back.
      dragFree: false,
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

  /* The gesture guard is attached on mount and reads the carousel from
     here. Binding it to the embla instance meant no guard existed until
     Embla had initialised — on a client-side navigation the page appears
     instantly while PDF.js is still starting, so a swipe in that window
     reached the browser and navigated back. That is the window this
     closes. */
  const emblaRef2 = useRef<ReturnType<typeof useEmblaCarousel>[1]>(undefined);
  useEffect(() => {
    emblaRef2.current = embla;
  }, [embla]);

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

  /* macOS turns a two-finger swipe right into browser back navigation
     whenever the page cannot scroll that way, and it claims the gesture
     from the first event, before this deck's own threshold has been met.
     preventDefault on the wheel handler is therefore too late to help:
     the fix is overscroll-behavior, which tells the browser there is no
     horizontal overscroll to act on. It is set on the root for as long as
     a deck is mounted and lifted again on the way out, so the gesture
     still works normally everywhere else on the site. */
  /* Two-finger trackpad swipe.

     Two earlier attempts at this failed for different reasons. The first
     latched one page per gesture and cleared the latch on a quiet timer,
     which macOS momentum kept resetting, so the swipe fired once and
     never again. The second called preventDefault, but only on events
     that reached the carousel element — so a swipe with the pointer over
     the header, the arrows, or the page margins was never claimed, and
     Chrome took it as a back-navigation.

     This binds the whole window in the capture phase for as long as a
     deck is mounted, and claims every horizontal wheel event wherever it
     lands on the page. Capture matters: it runs before anything else can
     see the event, so nothing downstream can let it through.

     Distance then accumulates and a page turns every STEP pixels, so a
     light flick moves one page and a hard one carries several. Reversing
     direction mid-gesture zeroes the accumulator, so both directions
     work and keep working. */
  useEffect(() => {
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
      // Axis is decided per event where one clearly dominates, and the
      // previous decision is kept only when the two are close — which is
      // what a momentum tail looks like. A hard lock held for the whole
      // gesture leaked in both directions: a scroll just after a swipe
      // was claimed as horizontal, and a swipe just after a scroll was
      // not claimed at all.
      const dx = Math.abs(e.deltaX);
      const dy = Math.abs(e.deltaY);
      const setAxis = (next: "x" | "y") => {
        if (axis === next) return;
        axis = next;
        travel = 0;
        pages = 0;
      };
      if (dx > dy * 1.5) setAxis("x");
      else if (dy > dx * 1.5) setAxis("y");
      else if (axis === null) axis = dx >= dy ? "x" : "y";

      const horizontal = axis === "x" || e.shiftKey;

      // Claim the whole horizontal gesture, anywhere on the page: the
      // sub-threshold events, the momentum tail, all of it. A single
      // unclaimed event is enough for Chrome to start navigating back.
      if (horizontal && e.cancelable) e.preventDefault();

      window.clearTimeout(quiet);
      quiet = window.setTimeout(endGesture, QUIET_MS);

      const delta = axis === "x" ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!delta) return;

      if (travel !== 0 && Math.sign(delta) !== Math.sign(travel)) {
        travel = 0;
        pages = 0;
      }
      travel += delta;

      // Read the carousel at gesture time. Before it exists the gesture
      // is still claimed above — it simply does not move any pages yet.
      const api = emblaRef2.current;
      if (!api) return;

      const want = Math.min(MAX_PAGES, Math.floor(Math.abs(travel) / STEP));
      const forward = travel > 0;
      while (pages < want) {
        if (forward ? !api.canScrollNext() : !api.canScrollPrev()) {
          pages = want;
          break;
        }
        if (forward) api.scrollNext();
        else api.scrollPrev();
        pages += 1;
      }
    };

    // Safari fires its own pinch/swipe gesture events alongside wheel;
    // they are inert on Chrome and harmless to claim here.
    const swallow = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };

    const opts = { passive: false, capture: true } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("gesturestart", swallow, opts);
    window.addEventListener("gesturechange", swallow, opts);
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("gesturestart", swallow, opts);
      window.removeEventListener("gesturechange", swallow, opts);
      window.clearTimeout(quiet);
    };
  }, []);

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
        {/* The slug is recorded on the way out. Returning to the index
            used to rely on the URL hash, but the App Router writes the
            hash a frame after the route commits and scrolls the new route
            to the top in between, so the anchor was undone every time.
            A handoff value is not subject to that ordering. */}
        <FlipLink
          href={`/work#${slug}`}
          label="Projects"
          underline
          backArrow
          onClick={() => {
            try {
              sessionStorage.setItem("work-return", slug);
            } catch {
              /* private mode — the hash fallback still applies */
            }
          }}
          className="text-overline uppercase tracking-[0.05em] text-text-muted"
        />
        {/* The deck IS the case study for these projects, so this is the
            page's document heading, not a caption. It stays styled as an
            overline. */}
        {/* Set like the project titles on the index, so a deck reads as
            that project rather than as a document viewer. The document
            type is already obvious from the pages themselves. */}
        <h1
          className="font-semibold tracking-tight text-text"
          style={{ fontSize: "clamp(18px, 1.7vw, 26px)" }}
        >
          {title}
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
              <div
                className="embla__slide h-full"
                key={i}
                // Marked so a wide page can claim the extra width it needs
                // to render at the same height as its portrait neighbours.
                data-landscape={
                  deck.landscape?.includes(i + 1) ? "true" : undefined
                }
              >
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
