"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";
import PdfPage from "@/components/PdfPage";
import type { CaseDeck as Deck } from "@/lib/case-decks";
import FlipLink from "@/components/FlipLink";

/**
 * Thumbnail-strip variant of the deck: one main PDF.js slide with a
 * scrollable row of clickable thumbnails beneath. Selection syncs both
 * ways — the strip follows the main carousel, and clicking a thumbnail
 * drives it. Thumbnails render lazily (only those near the selection) so
 * a long deck never renders every page at once.
 *
 * Built as an alternative to the plain deck so the two can be compared.
 */
export default function CaseDeckThumbs({
  title,
  slug,
  deck,
}: {
  title: string;
  /** Used so "back" returns to this project's row in the index. */
  slug: string;
  deck: Deck;
}) {
  const [mainRef, main] = useEmblaCarousel({ align: "center", duration: 22 }, [
    ClassNames({ snapped: "is-selected" }),
  ]);
  const [thumbRef, thumbs] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });
  const [page, setPage] = useState(1);

  const onSelect = useCallback(() => {
    if (!main || !thumbs) return;
    const i = main.selectedScrollSnap();
    setPage(i + 1);
    thumbs.scrollTo(i);
  }, [main, thumbs]);

  useEffect(() => {
    if (!main) return;
    main.on("select", onSelect).on("reInit", onSelect);
    return () => {
      main.off("select", onSelect).off("reInit", onSelect);
    };
  }, [main, onSelect]);

  const sectionTitle = deck.titles?.[page - 1] ?? null;
  const pct = (page / deck.pages) * 100;

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
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          {title} · {deck.label} · Thumbnail variant
        </p>
      </header>

      {/* Main slide */}
      <div className="flex min-h-0 flex-1 items-center py-4">
        <div className="embla h-full w-full overflow-hidden" ref={mainRef}>
          <div className="embla__container flex h-full touch-pan-y">
            {Array.from({ length: deck.pages }, (_, i) => (
              <div className="embla__slide h-full" key={i}>
                <PdfPage
                  url={deck.pdf}
                  page={i + 1}
                  active={Math.abs(i + 1 - page) <= 1}
                  label={`${title} — page ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="shrink-0 px-6 md:px-12 lg:px-20">
        <div className="embla-thumbs overflow-hidden" ref={thumbRef}>
          <div className="flex gap-3">
            {Array.from({ length: deck.pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => main?.scrollTo(i)}
                aria-label={deck.titles?.[i] ?? `Page ${i + 1}`}
                aria-current={i + 1 === page ? "true" : undefined}
                className={`embla-thumb relative h-16 shrink-0 overflow-hidden border transition-all duration-300 ${
                  i + 1 === page
                    ? "border-accent opacity-100"
                    : "border-border opacity-45 hover:opacity-80"
                }`}
                style={{ width: 92 }}
              >
                <PdfPage
                  url={deck.pdf}
                  page={i + 1}
                  active={Math.abs(i + 1 - page) <= 8}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="shrink-0 px-6 pb-6 pt-4 md:px-12 lg:px-20">
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          {sectionTitle ? (
            <>
              <span className="text-text">{sectionTitle}</span>
              <span className="mx-2 opacity-50">·</span>
            </>
          ) : null}
          Page {page} / {deck.pages}
        </p>
        <div
          className="mt-3 h-px w-full bg-white/12"
          role="progressbar"
          aria-valuenow={page}
          aria-valuemin={1}
          aria-valuemax={deck.pages}
          aria-label={sectionTitle ?? `Page ${page} of ${deck.pages}`}
        >
          <div
            className="h-px bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
