"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/lib/projects";

/**
 * Work, as a two-part experience.
 *
 * 1. A folder graphic with a prompt. Click (not hover — deliberate,
 *    touch-friendly, keyboard-operable) tips the flap open, the project
 *    cards peek out, and the gallery expands below and scrolls into view.
 *    Arriving at /#work (e.g. a case study's back link) opens it
 *    automatically.
 *
 * 2. The gallery: one large project image at a time, crossfading with a
 *    gentle scale/rise between projects as the user scrolls through a
 *    pinned viewport — no static grid. Project data and case-study links
 *    come straight from lib/projects.ts.
 *
 * Progressive enhancement: by default (no JS having run its course, or
 * reduced motion) the gallery is a plain vertical stack of large images;
 * the pinned crossfade layout is only applied when motion is allowed.
 */
export default function WorkShowcase() {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Magnetic hover on the gallery cards + morphing custom cursor
  // (fine pointers, motion allowed). The magnet targets the inner link,
  // never the panel itself — the pinned crossfade timeline owns the
  // panel's transform and the two must not fight.
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }
    const section = sectionRef.current!;
    const cursor = cursorRef.current!;
    section.classList.add("magnetic-on");
    gsap.set(cursor, { autoAlpha: 0, scale: 0.4 });
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3.out" });

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>(".work-panel a"),
    );
    const teardowns = cards.map((card) => {
      const onEnter = () => {
        gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: 0.3 });
        gsap.to(card, { scale: 1.025, duration: 0.45, ease: "power3.out" });
      };
      const onMove = (e: PointerEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
        const r = card.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        gsap.to(card, {
          x: nx * 14,
          y: ny * 10,
          duration: 0.5,
          ease: "power3.out",
        });
      };
      const onLeave = () => {
        gsap.to(cursor, { autoAlpha: 0, scale: 0.4, duration: 0.3 });
        gsap.to(card, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
        });
      };
      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(card);
      };
    });

    return () => {
      section.classList.remove("magnetic-on");
      teardowns.forEach((fn) => fn());
      gsap.killTweensOf(cursor);
    };
  }, []);

  // A case-study back link lands on /#work — open the folder for it.
  // (Deferred to a task so hydration completes before state changes.)
  useEffect(() => {
    if (window.location.hash !== "#work") return;
    const t = window.setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Bring the gallery into view once the flap has started opening.
    const scrollTimer = window.setTimeout(() => {
      galleryRef.current?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }, 350);

    if (reduced) return () => clearTimeout(scrollTimer);

    gsap.registerPlugin(ScrollTrigger);
    const gallery = galleryRef.current!;
    const ctx = gsap.context(() => {
      gallery.classList.add("gallery-pinned");
      const panels = gsap.utils.toArray<HTMLElement>(".work-panel");
      gsap.set(panels.slice(1), { autoAlpha: 0 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: gallery,
          start: "top top",
          end: `+=${(panels.length - 1) * 90}%`,
          scrub: true,
          // Inner pin keeps GSAP's pin-spacer out of React's child lists.
          pin: pinRef.current,
        },
      });
      panels.forEach((panel, i) => {
        if (i === 0) return;
        tl.to({}, { duration: 0.55 }); // dwell on the current project
        tl.to(panels[i - 1], {
          autoAlpha: 0,
          scale: 0.965,
          duration: 0.4,
          ease: "none",
        });
        tl.fromTo(
          panel,
          { autoAlpha: 0, y: 56, scale: 1.02 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "none" },
          "<0.15",
        );
      });
      tl.to({}, { duration: 0.6 }); // dwell on the last project
      ScrollTrigger.refresh();
    }, sectionRef);

    return () => {
      clearTimeout(scrollTimer);
      gallery.classList.remove("gallery-pinned");
      ctx.revert();
    };
  }, [open]);

  return (
    <section
      ref={sectionRef}
      id="work"
      className="scroll-mt-12 px-6 py-24 md:px-12 md:py-36 lg:px-20"
    >
      <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
        Work
      </p>

      {/* The folder — prompt above, folder centred */}
      <div className="mt-16 flex flex-col items-center">
        <p
          className="mb-10 text-body-m text-text-secondary transition-opacity duration-500"
          style={{ opacity: open ? 0 : 1 }}
          aria-hidden={open}
        >
          Curious? Check out my work.
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-label="Open featured work"
          onClick={() => setOpen(true)}
          className={`work-folder outline-offset-8 ${open ? "is-open" : ""}`}
        >
          <span aria-hidden className="folder-back" />
          <span aria-hidden className="folder-docs">
            {projects.slice(0, 3).map((p, i) => (
              <span key={p.slug} className="folder-doc" data-i={i}>
                <Image
                  src={p.cover.src}
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              </span>
            ))}
          </span>
          <span aria-hidden className="folder-front" />
        </button>
      </div>

      {/* The gallery */}
      <div ref={galleryRef} className={open ? "" : "hidden"}>
        <div
          ref={pinRef}
          className="work-pin flex min-h-svh flex-col justify-center py-8"
        >
          <div className="work-stack relative">
            {projects.map((project, i) => (
              <article key={project.slug} className="work-panel">
                <Link href={`/work/${project.slug}`} className="group block">
                  <div
                    className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
                    style={{ height: "62vh" }}
                  >
                    <Image
                      src={project.cover.src}
                      alt={project.cover.alt}
                      fill
                      sizes="(min-width: 1024px) 85vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      priority={i === 0}
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h3 className="text-heading font-semibold tracking-tight">
                      {project.title}
                      <span
                        aria-hidden
                        className="ml-3 inline-block text-accent opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                      >
                        →
                      </span>
                    </h3>
                    <span className="text-overline tracking-[0.05em] text-text-muted">
                      {String(i + 1).padStart(2, "0")} /{" "}
                      {String(projects.length).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-body-s text-text-secondary">
                    {project.impact}
                  </p>
                  <p className="mt-2 text-overline uppercase tracking-[0.05em] text-text-muted">
                    {project.tags.join(" · ")}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Morphing cursor for the gallery cards */}
      <div ref={cursorRef} aria-hidden className="work-cursor">
        View
      </div>

      <noscript>
        <ul className="mt-12 space-y-3">
          {projects.map((p) => (
            <li key={p.slug}>
              <a href={`/work/${p.slug}`} className="text-body-m underline">
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      </noscript>
    </section>
  );
}
