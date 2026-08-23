"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CaseDeck as Deck } from "@/lib/case-decks";

/**
 * Page-by-page slideshow of a project's source document, rendered from
 * pre-rasterised page images (the source PDFs are 31–161MB, far too large
 * to hand a browser — see scripts/build-case-decks.sh).
 *
 * Click the right half to advance, the left half to go back; arrow keys
 * and Space work too. A progress bar along the bottom shows position
 * through the document.
 */
export default function CaseDeck({
  title,
  slug,
  deck,
}: {
  title: string;
  slug: string;
  deck: Deck;
}) {
  const [page, setPage] = useState(1);

  const go = useCallback(
    (delta: number) =>
      setPage((p) => Math.min(deck.pages, Math.max(1, p + delta))),
    [deck.pages],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

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
          {title} · {deck.label}
        </p>
      </header>

      {/* Page stage */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-8 md:px-12">
        <div className="relative w-full max-w-6xl">
          <Image
            key={page}
            src={`${deck.dir}/p${page}.jpg`}
            alt={`${title} — page ${page} of ${deck.pages}`}
            width={1400}
            height={990}
            className="h-auto w-full border border-border bg-black object-contain"
            priority={page === 1}
          />

          {/* Click zones: left = back, right = forward */}
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => go(-1)}
            disabled={page === 1}
            className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize disabled:cursor-default"
          />
          <button
            type="button"
            aria-label="Next page"
            onClick={() => go(1)}
            disabled={page === deck.pages}
            className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize disabled:cursor-default"
          />
        </div>
      </div>

      {/* Progress */}
      <footer className="px-6 pb-8 md:px-12 lg:px-20">
        <div className="flex items-baseline justify-between">
          <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
            Page {page} / {deck.pages}
          </p>
          <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
            Click or use ← →
          </p>
        </div>
        <div
          className="mt-3 h-px w-full bg-white/12"
          role="progressbar"
          aria-valuenow={page}
          aria-valuemin={1}
          aria-valuemax={deck.pages}
          aria-label={`Position in ${title} ${deck.label}`}
        >
          <div
            className="h-px bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Preload the neighbouring pages so paging feels instant. */}
        <div className="hidden">
          {[page + 1, page - 1]
            .filter((n) => n >= 1 && n <= deck.pages)
            .map((n) => (
              <Image
                key={`${slug}-pre-${n}`}
                src={`${deck.dir}/p${n}.jpg`}
                alt=""
                width={40}
                height={28}
              />
            ))}
        </div>
      </footer>
    </div>
  );
}
