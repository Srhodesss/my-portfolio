"use client";

import { useEffect, useRef, useState } from "react";
import {
  crossFadeTo,
  sectionTarget,
  SECTION_IDS,
  PILLS_END,
  PIN_VIEWPORTS,
  PROJECTS_END_VIEWPORTS,
  HANDOFF_OUT,
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
 * reading has nothing to say, and it steps back out once the closing
 * section takes the screen — there is no more page left to index.
 *
 * Section bounds are not simply "one id to the next" — that lagged the
 * screen badly, because both of these sections fade to black well before
 * the next section's element starts. Projects went black 904px before the
 * index admitted it, and Skills 452px before. Each boundary is therefore
 * placed at the measured moment the outgoing section finishes fading out:
 *
 *   About    → runs into the pin, ending where the pills hand over.
 *   Projects → ends with the pinned travel, where its blackout completes.
 *   Skills   → ends 0.54vh before Contact's top, where SectionHandoff has
 *              finished fading it out.
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

/* How much of the closing section has to be on screen before the rail
   steps aside. The Contact segment ends at exactly this point, so the
   rail completes as it goes rather than vanishing part-drawn. */
const CLOSING_HIDE = 0.5;

type Seg = { id: string; label: string; start: number; end: number };

export default function ScrollTimeline() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [segs, setSegs] = useState<Seg[]>([]);
  const [shown, setShown] = useState(false);

  /* The native scrollbar and this rail say the same thing in the same
     place, so the native one steps aside wherever the rail lives.

     Scoped to the component being mounted rather than to `is-shown`: a
     classic, space-taking scrollbar (Windows, or macOS set to always
     show) would shift the whole page sideways each time the rail faded
     in and out, which is worse than the overlap. Overlay scrollbars take
     no width, so nothing moves either way. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("rail-on");
    return () => root.classList.remove("rail-on");
  }, []);

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

      const vh = window.innerHeight;
      const workTop = tops[SECTION_IDS.indexOf("work")] as number;
      const contactTop = tops[SECTION_IDS.indexOf("contact")] as number;

      // Where the pills stop being About and the folder becomes Projects.
      const pillsEnd = workTop + PILLS_END * PIN_VIEWPORTS * vh;
      // Where the folder has finished fading to black.
      const projectsEnd = workTop + PROJECTS_END_VIEWPORTS * vh;
      // Where Skills has finished fading to black.
      const skillsEnd = contactTop - vh + HANDOFF_OUT * vh;

      // Contact ends at the exact point the rail steps aside for the
      // closing section — the same threshold the visibility check uses.
      // Running it to the foot of the document instead left the last
      // segment part-drawn (0.68) at the moment it disappeared.
      const closing = document.querySelector<HTMLElement>("[data-closing]");
      const contactEnd = closing
        ? Math.min(
            maxScroll,
            closing.getBoundingClientRect().top +
              window.scrollY -
              window.innerHeight * CLOSING_HIDE,
          )
        : maxScroll;

      const EDGES: Record<string, { start: number; end: number }> = {
        about: { start: tops[0] as number, end: pillsEnd },
        work: { start: pillsEnd, end: projectsEnd },
        skills: { start: projectsEnd, end: skillsEnd },
        contact: { start: skillsEnd, end: contactEnd },
      };

      const next: Seg[] = SECTION_IDS.map((id) => ({
        id,
        label: LABELS[id] ?? id,
        ...EDGES[id],
      })).filter((s) => s.end > s.start);
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
      // Appear as the hero clears, which is where About begins. The rail
      // used to fade in 0.6vh earlier and sat there unlabelled until the
      // reader crossed into About proper.
      const first = segs[0].start;
      const closing = document.querySelector<HTMLElement>("[data-closing]");
      const atClosing = closing
        ? closing.getBoundingClientRect().top < window.innerHeight * CLOSING_HIDE
        : false;
      setShown(
        window.scrollY > first - window.innerHeight * 0.12 && !atClosing,
      );

      // The current segment is simply the last one whose start has been
      // passed. The old test keyed off the fill fraction and had a hole
      // at exactly p === 0: clicking "About" on the rail lands precisely
      // on that segment's start, so nothing matched and the label went
      // blank on the one interaction most likely to be tried. Before the
      // first segment begins the rail is already up, so it names the
      // first one rather than showing a bare rail.
      let current = 0;
      segs.forEach((s, i) => {
        const p = Math.min(1, Math.max(0, (y - s.start) / (s.end - s.start)));
        const el = fillRefs.current[i];
        if (el) el.style.transform = `scaleY(${p.toFixed(4)})`;
        if (y >= s.start) current = i;
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
