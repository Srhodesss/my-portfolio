"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";
import type { CaseDeck as Deck } from "@/lib/case-decks";

/**
 * Thumbnail-strip variant of the deck: one main slide with a scrollable
 * row of clickable thumbnails beneath. Selection syncs both ways — the
 * strip follows the main carousel, and clicking a thumbnail drives it.
 *
 * Built as an alternative to the plain deck so the two can be compared
 * before deciding where each belongs (see /work/[slug]/deck/thumbs).
 */
export default function CaseDeckThumbs({
  title,
  deck,
}: {
  title: string;
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
    thumbs.scrollTo(i); // keep the active thumbnail in view
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
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="flex items-baseline justify-between px-6 pt-8 md:px-12 lg:px-20">
        <Link
          href="/work"
          className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
        >
          ← Projects
        </Link>
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          {title} · {deck.label} · Thumbnail variant
        </p>
      </header>

      {/* Main slide */}
      <div className="flex flex-1 items-center py-6">
        <div className="embla w-full overflow-hidden" ref={mainRef}>
          <div className="embla__container flex touch-pan-y">
            {Array.from({ length: deck.pages }, (_, i) => (
              <div className="embla__slide" key={i}>
                <Image
                  src={`${deck.dir}/p${i + 1}.jpg`}
                  alt={`${title} — page ${i + 1}`}
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

      {/* Thumbnail strip */}
      <div className="px-6 md:px-12 lg:px-20">
        <div className="embla-thumbs overflow-hidden" ref={thumbRef}>
          <div className="flex gap-3">
            {Array.from({ length: deck.pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => main?.scrollTo(i)}
                aria-label={deck.titles?.[i] ?? `Page ${i + 1}`}
                aria-current={i + 1 === page ? "true" : undefined}
                className={`embla-thumb relative shrink-0 border transition-all duration-300 ${
                  i + 1 === page
                    ? "border-accent opacity-100"
                    : "border-border opacity-45 hover:opacity-80"
                }`}
                style={{ width: 92 }}
              >
                <Image
                  src={`${deck.dir}/p${i + 1}.jpg`}
                  alt=""
                  width={184}
                  height={130}
                  className="h-auto w-full bg-black object-contain"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="px-6 pb-8 pt-5 md:px-12 lg:px-20">
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
