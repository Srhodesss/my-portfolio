"use client";

import { useEffect, useRef, useState } from "react";
import {
  crossFadeTo,
  sectionTarget,
  SECTION_IDS,
  PILLS_END,
  PIN_VIEWPORTS,
} from "@/lib/section-nav";

/**
 * Right-edge scroll index.
 *
 * A thin vertical rail carrying one segment per section, each sized in
 * proportion to how much of the page that section actually occupies, so
 * the rail is a map of the document rather than a plain percentage. The
 * segment you are inside fills top-down as you move through it, and its
 * name rides alongside at the fill point.
 *
 * Segments are clickable and route through the same cross-fade the nav
 * uses, so the rail is navigation as well as position.
 *
 * The rail covers the page from the About section onward: it appears once
 * the hero is behind you, since a timeline of a page you have not started
 * reading has nothing to say.
 *
 * Section bounds are not simply "one id to the next". The pinned work
 * sequence opens on the roles pills, which read as the tail of About, so
 * the About segment runs into the pin and Projects begins where the pills
 * hand over to the folder.
 *
 * Reduced motion: no transitions, but the rail still tracks position.
 */

const LABELS: Record<string, string> = {
  about: "About",
  work: "Projects",
  skills: "Skills",
  contact: "Contact",
};

const GAP = 6; // px between segments

type Seg = { id: string; label: string; start: number; end: number };

export default function ScrollTimeline() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [segs, setSegs] = useState<Seg[]>([]);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const measure = () => {
      const tops = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : null;
      });
      if (tops.some((t) => t === null)) return;
      // Bounds are scroll positions, not document positions. Ending the
      // last segment at the document height meant it could never fill:
      // the reader tops out a viewport short of that, so the final
      // segment sat permanently part-drawn at the bottom of the page.
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      // Where the pills stop being About and the folder becomes Projects.
      const workTop = tops[SECTION_IDS.indexOf("work")] as number;
      const pillsEnd =
        workTop + PILLS_END * PIN_VIEWPORTS * window.innerHeight;

      const bounds = SECTION_IDS.map((id, i) => {
        const start = id === "work" ? pillsEnd : (tops[i] as number);
        const end =
          id === "about"
            ? pillsEnd
            : i + 1 < tops.length
              ? (tops[i + 1] as number)
              : maxScroll;
        return { id, label: LABELS[id] ?? id, start, end };
      });
      const next: Seg[] = bounds.filter((s) => s.end > s.start);
      setSegs(next);
    };
    measure();
    window.addEventListener("resize", measure);
    // The pinned sequences size their spacers after mount, which moves
    // every section below them.
    const settle = window.setTimeout(measure, 700);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(settle);
    };
  }, []);

  useEffect(() => {
    if (!segs.length) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const first = segs[0].start;
      setShown(window.scrollY > first - window.innerHeight * 0.6);

      let current = -1;
      segs.forEach((s, i) => {
        const p = Math.min(1, Math.max(0, (y - s.start) / (s.end - s.start)));
        const el = fillRefs.current[i];
        if (el) el.style.transform = `scaleY(${p.toFixed(4)})`;
        if (p > 0 && p < 1) current = i;
        else if (p === 1 && current < i) current = i;
      });

      const label = labelRef.current;
      if (label) {
        const seg = segs[current];
        if (seg) {
          if (label.textContent !== seg.label) label.textContent = seg.label;
          // Ride the fill point, expressed as a share of the whole rail.
          const total = segs[segs.length - 1].end - segs[0].start;
          const at = Math.min(
            1,
            Math.max(0, (y - segs[0].start) / total),
          );
          label.style.top = `${(at * 100).toFixed(2)}%`;
          label.style.opacity = "1";
        } else {
          label.style.opacity = "0";
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [segs]);

  const total = segs.length
    ? segs[segs.length - 1].end - segs[0].start
    : 1;

  return (
    <div
      ref={rootRef}
      className={`scroll-timeline ${shown ? "is-shown" : ""}`}
      aria-hidden
    >
      <span ref={labelRef} className="st-label" />
      <div className="st-bar">
        {segs.map((s, i) => (
          <button
            key={s.id}
            type="button"
            tabIndex={-1}
            title={s.label}
            className="st-seg"
            style={{
              flexBasis: `calc(${(((s.end - s.start) / total) * 100).toFixed(3)}% - ${GAP}px)`,
            }}
            onClick={() => {
              const t = sectionTarget(s.id);
              if (t !== null) crossFadeTo(t);
            }}
          >
            <span
              ref={(el) => {
                fillRefs.current[i] = el;
              }}
              className="st-seg-fill"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
