"use client";

import { useEffect, useRef, useState } from "react";
import { getPdf } from "@/lib/pdf";

/**
 * One PDF page, rendered to a canvas by PDF.js and fit inside its parent
 * box (contain), so the page is crisp at any size and never overflows the
 * slot. Rendering is deferred until `active` is true — the deck only
 * activates the current slide and its immediate neighbours, so a long
 * document never renders every page at once.
 *
 * The backing store is sized to the displayed box × devicePixelRatio
 * (capped), which is what makes it sharp on retina where the old fixed
 * 1400px JPEGs went soft. A single render runs per activation/resize: the
 * previous render is cancelled before a new one starts, so two renders
 * never share the canvas (which PDF.js forbids), and a not-yet-laid-out
 * box is waited on rather than skipped.
 */
export default function PdfPage({
  url,
  page,
  active,
  label,
  className = "",
}: {
  url: string;
  page: number;
  active: boolean;
  label?: string;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [rev, setRev] = useState(0);

  // Re-render when the box actually changes size (e.g. window resize),
  // coalesced to one bump per frame.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    let last = 0;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const w = box.clientWidth;
        if (w && Math.abs(w - last) > 1) {
          last = w;
          setRev((n) => n + 1);
        }
      });
    });
    ro.observe(box);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;

    const run = async () => {
      // Wait for the box to be laid out rather than giving up on a
      // zero-size measurement during a transition.
      let tries = 0;
      while (
        (box.clientWidth === 0 || box.clientHeight === 0) &&
        tries++ < 40 &&
        !cancelled
      ) {
        await new Promise((r) => requestAnimationFrame(r));
      }
      if (cancelled || box.clientWidth === 0 || box.clientHeight === 0) return;

      const doc = await getPdf(url);
      if (cancelled) return;
      const pg = await doc.getPage(page);
      if (cancelled) return;

      const base = pg.getViewport({ scale: 1 });
      const fit = Math.min(
        box.clientWidth / base.width,
        box.clientHeight / base.height,
      );
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const vp = pg.getViewport({ scale: fit * dpr });

      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = `${Math.round(base.width * fit)}px`;
      canvas.style.height = `${Math.round(base.height * fit)}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      task = pg.render({ canvas, canvasContext: ctx, viewport: vp });
      try {
        await task.promise;
        if (!cancelled) setReady(true);
      } catch {
        /* render cancelled/superseded — ignore */
      }
    };

    run();
    return () => {
      cancelled = true;
      try {
        task?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [url, page, active, rev]);

  return (
    <div
      ref={boxRef}
      className={`flex h-full w-full items-center justify-center ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-label={label}
        role="img"
        className={`max-h-full max-w-full border border-border bg-black transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
