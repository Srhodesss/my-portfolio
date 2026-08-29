"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { createLayout } from "animejs";
import { getLenis } from "@/components/SmoothScroll";
import { projects, type Project } from "@/lib/projects";
import RippleText from "@/components/RippleText";

/**
 * Shared-layout project peek — a clicked card morphs into its expanded
 * panel, using anime.js `createLayout` (the FLIP mechanism behind its
 * modal-dialog example).
 *
 * Any card that should morph carries `data-layout-id="peek-<slug>"` and
 * the class `peek-card`.
 *
 * How the morph is staged
 * -----------------------
 * The card itself is never moved: pulling a React-owned node out of its
 * tree breaks reconciliation. Instead a lightweight clone flies between
 * the two positions on a stage that React does not own, and
 * `createLayout` is scoped to that stage — so it records two nodes rather
 * than the whole document, and there is never a duplicate layout id in
 * play.
 *
 * The clone is positioned in *document* coordinates, not viewport ones:
 * anime's layout compensates FLIP for scroll position, so a `fixed` layer
 * would be thrown off by the page's scroll offset. The stage is also
 * split in two — an outer wrapper we own and toggle, and an inner track
 * that is anime's root — because anime writes inline styles onto its root
 * and would otherwise fight our show/hide.
 *
 *   record()  → old geometry (the card's rect)
 *   mutate    → set the clone's rect to the panel's media box
 *   animate() → anime interpolates the difference
 *
 * The panel adopts the card's aspect ratio, so the morph is a clean
 * uniform scale rather than a squash between two different shapes.
 *
 * Reduced motion: no flight, no stage — the panel simply appears.
 */

type PeekApi = { open: (slug: string) => void; close: () => void };

const PeekCtx = createContext<PeekApi | null>(null);

export function useProjectPeek() {
  const ctx = useContext(PeekCtx);
  if (!ctx) throw new Error("useProjectPeek must be used inside ProjectPeek");
  return ctx;
}

/** Put this on any card that should morph. */
export function peekId(slug: string) {
  return `peek-${slug}`;
}

const DURATION = 560;
const EASE = "outQuint";

type Rect = { left: number; top: number; width: number; height: number };

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

export default function ProjectPeek({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<Project | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const flightRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<ReturnType<typeof createLayout> | null>(null);
  const sourceRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const panelFocus = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<"open" | "close" | null>(null);

  const reduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** The stage the clone flies on, plus its anime layout. Built once. */
  const getStage = () => {
    if (!stageRef.current) {
      const stage = document.createElement("div");
      stage.className = "peek-stage";
      stage.setAttribute("aria-hidden", "true");

      const scrim = document.createElement("div");
      scrim.className = "peek-stage-scrim";

      const track = document.createElement("div");
      track.className = "peek-track";

      const flight = document.createElement("div");
      flight.className = "peek-flight";

      track.appendChild(flight);
      stage.append(scrim, track);
      document.body.appendChild(stage);

      stageRef.current = stage;
      trackRef.current = track;
      flightRef.current = flight;
      layoutRef.current = createLayout(track, {
        children: ".peek-flight",
        duration: DURATION,
        ease: EASE,
      });
    }
    return {
      stage: stageRef.current!,
      flight: flightRef.current!,
      layout: layoutRef.current!,
    };
  };

  /** Viewport rect -> document coordinates, which is anime's frame. */
  const placeFlight = (el: HTMLElement, r: Rect) => {
    el.style.left = `${r.left + window.scrollX}px`;
    el.style.top = `${r.top + window.scrollY}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
  };

  const open = useCallback((slug: string) => {
    const project = projects.find((p) => p.slug === slug);
    if (!project) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    getLenis()?.stop();

    const card = document.querySelector<HTMLElement>(
      `.peek-card[data-layout-id="${peekId(slug)}"]`,
    );

    if (reduced() || !card) {
      setAspect(null);
      setActive(project);
      return;
    }

    const from = rectOf(card);
    const { stage, flight } = getStage();
    flight.innerHTML = "";
    const img = document.createElement("img");
    img.src = project.cover.src;
    img.alt = "";
    img.className =
      project.cover.fit === "contain" ? "is-contain" : "is-cover";
    flight.appendChild(img);
    placeFlight(flight, from);
    stage.classList.add("is-active");
    stage.classList.remove("is-closing");
    stage.style.visibility = "visible";

    card.style.visibility = "hidden";
    sourceRef.current = card;
    pendingRef.current = "open";
    setAspect(from.width / from.height);
    setActive(project);
  }, []);

  const close = useCallback(() => {
    getLenis()?.start();
    const card = sourceRef.current;
    const media = mediaRef.current;

    if (reduced() || !card || !media) {
      sourceRef.current = null;
      if (card) card.style.visibility = "";
      setActive(null);
      openerRef.current?.focus?.();
      return;
    }

    const { stage, flight } = getStage();
    placeFlight(flight, rectOf(media));
    stage.classList.add("is-active", "is-closing");
    stage.style.visibility = "visible";
    pendingRef.current = "close";
    setActive(null);
  }, []);

  /* Second half of FLIP: the new DOM is committed but not yet painted, so
     the destination can be measured and the difference animated. */
  useLayoutEffect(() => {
    const phase = pendingRef.current;
    if (!phase) return;
    pendingRef.current = null;

    const { stage, flight, layout } = getStage();

    if (phase === "open") {
      const media = mediaRef.current;
      if (!media) return;
      media.style.opacity = "0";
      layout.record();
      placeFlight(flight, rectOf(media));
      layout.animate({
        onComplete: () => {
          media.style.opacity = "1";
          stage.style.visibility = "hidden";
          stage.classList.remove("is-active");
        },
      });
      return;
    }

    // Closing: fly back to the card, then hand it its visibility back.
    const card = sourceRef.current;
    sourceRef.current = null;
    if (!card) {
      stage.style.visibility = "hidden";
      stage.classList.remove("is-active", "is-closing");
      return;
    }
    layout.record();
    placeFlight(flight, rectOf(card));
    layout.animate({
      onComplete: () => {
        card.style.visibility = "";
        stage.style.visibility = "hidden";
        stage.classList.remove("is-active", "is-closing");
        flight.innerHTML = "";
        openerRef.current?.focus?.();
      },
    });
  }, [active]);

  /* Esc closes; focus moves into the panel when it opens. */
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    panelFocus.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);


  /* Never leave Lenis stopped, or the stage behind, if this unmounts. */
  useEffect(
    () => () => {
      getLenis()?.start();
      stageRef.current?.remove();
    },
    [],
  );

  return (
    <PeekCtx.Provider value={{ open, close }}>
      {children}
      {active &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="peek-scrim fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-label={`${active.title} — quick look`}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              ref={panelFocus}
              tabIndex={-1}
              className="peek-panel relative w-full max-w-3xl border border-border bg-bg outline-none"
            >
              <div
                ref={mediaRef}
                className="peek-media relative w-full overflow-hidden bg-black"
                style={{ aspectRatio: aspect ?? undefined }}
              >
                {/* Plain img: the flight clone is measured against this box,
                    and Next's optimiser adds wrappers that complicate that. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.cover.src}
                  alt={active.cover.alt}
                  className={`absolute inset-0 h-full w-full ${
                    active.cover.fit === "contain"
                      ? "object-contain p-6"
                      : "object-cover"
                  }`}
                />
              </div>

              <div className="peek-body p-7 md:p-10">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h2
                    className="font-semibold tracking-tight"
                    style={{ fontSize: "clamp(26px, 3vw, 40px)" }}
                  >
                    {active.title}
                  </h2>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-overline uppercase tracking-[0.05em] text-text-muted">
                    {active.tags.map((t) => (
                      <li
                        key={t}
                        className="after:ml-3 after:content-['·'] last:after:content-['']"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-5 max-w-2xl text-body-m leading-relaxed text-text-secondary">
                  {active.impact}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link
                    href={`/work/${active.slug}`}
                    onClick={() => getLenis()?.start()}
                    className="group inline-flex items-baseline text-body-s font-medium"
                  >
                    <RippleText arrow="right">Open case study</RippleText>
                  </Link>
                  <button
                    type="button"
                    onClick={close}
                    className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
                  >
                    Close (Esc)
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </PeekCtx.Provider>
  );
}
