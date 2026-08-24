"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";
import type { CaseDeck as Deck } from "@/lib/case-decks";

/**
 * Page-by-page slideshow of a project's source document, built on Embla.
 * Pages are pre-rasterised images (the source PDFs are 31–161MB, far too
 * large to hand a browser — see scripts/build-case-decks.sh).
 *
 * The ClassNames plugin tags slides so CSS can style the active one
 * against its neighbours (snapped -> `.is-selected`, `.is-in-view`),
 * rather than
 * tracking selection state in React just to paint styles.
 *
 * The progress bar is labelled with the real section title extracted from
 * the PDF for the current page where one was detectable
 * (scripts/extract-deck-titles.py); pages without one show the number.
 */
export default function CaseDeck({
  title,
  deck,
}: {
  title: string;
  deck: Deck;
}) {
  const [emblaRef, embla] = useEmblaCarousel(
    { loop: false, align: "center", skipSnaps: false, duration: 22 },
    [ClassNames({ snapped: "is-selected", inView: "is-in-view" })],
  );
  const [page, setPage] = useState(1);

  const onSelect = useCallback(() => {
    if (embla) setPage(embla.selectedScrollSnap() + 1);
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    // Subscribe first; Embla emits `reInit` on mount, which syncs the
    // initial page without a synchronous setState in the effect body.
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);

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

  const pct = (page / deck.pages) * 100;
  const sectionTitle = deck.titles?.[page - 1] ?? null;

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="flex items-baseline justify-between px-6 pt-8 md:px-12 lg:px-20">
        <Link
          href="/work"
          className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
        >
          ← Projects
        </Link>
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          {title} · {deck.label}
        </p>
      </header>

      <div className="relative flex flex-1 items-center py-8">
        <div className="embla w-full overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex touch-pan-y">
            {Array.from({ length: deck.pages }, (_, i) => (
              <div className="embla__slide" key={i}>
                <Image
                  src={`${deck.dir}/p${i + 1}.jpg`}
                  alt={`${title} — page ${i + 1} of ${deck.pages}`}
                  width={1400}
                  height={990}
                  className="h-auto w-full border border-border bg-black object-contain"
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="px-6 pb-8 md:px-12 lg:px-20">
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
              className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => embla?.scrollNext()}
              className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
            >
              Next →
            </button>
          </div>
        </div>

        <div
          className="mt-3 h-px w-full bg-white/12"
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
          <div
            className="h-px bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Section markers: every page that carries a detected title gets a
            tick, so the bar reads as document structure, not just length. */}
        {deck.titles?.some(Boolean) && (
          <div className="relative mt-2 h-3">
            {deck.titles.map((t, i) =>
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
