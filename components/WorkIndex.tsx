"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import FlipLink from "@/components/FlipLink";
import RevealText from "@/components/RevealText";
import { animate, onScroll, stagger } from "animejs";
import { getLenis } from "@/components/SmoothScroll";
import { projects } from "@/lib/projects";
import { WORK_MEDIA, type WorkImage } from "@/lib/work-images";
import { WORK_META } from "@/lib/work-meta";
import { useProjectPeek, peekId } from "@/components/ProjectPeek";

/**
 * /work — an editorial index. A persistent left sidebar lists every
 * project; each entry anchors to its section on the same page and
 * highlights as that section becomes current. Each section leads with a
 * title and year, then three labelled fields side by side (Brief, Skills,
 * Role) and any live links, followed by the project's gallery.
 *
 * Visual language is ours, not the reference's: dark ground, orange
 * accent, Instrument Serif italic for accents, existing type scale, sharp
 * corners throughout.
 *
 * Anchor clicks hand off to Lenis so they don't fight smooth scrolling;
 * with reduced motion (Lenis disabled) they fall back to an instant jump.
 * Fields with no confirmed content render as marked TODO placeholders.
 */

/* Editorial column rhythm for gallery items, cycling. Literal strings so
   Tailwind's scanner sees them. */
const SPANS = [
  "md:col-span-12",
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-8",
  "md:col-span-4",
];

function Figure({
  image,
  alt,
  eager,
  layoutId,
}: {
  image: WorkImage;
  alt: string;
  eager?: boolean;
  /** Present on cards that morph into the peek panel. */
  layoutId?: string;
}) {
  return (
    <div
      data-reveal
      data-layout-id={layoutId}
      className={`relative w-full overflow-hidden border border-border ${
        layoutId ? "peek-card" : ""
      } ${image.alpha ? "bg-white" : "bg-black"}`}
      style={{ aspectRatio: `${image.w} / ${image.h}` }}
    >
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 76vw, 100vw"
        className={image.alpha ? "object-contain p-6 md:p-10" : "object-cover"}
        priority={eager}
      />
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  const missing = !children && !value;
  return (
    <div>
      <p className="text-overline uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>
      {missing ? (
        <p className="mt-3 border border-dashed border-text-muted/40 px-3 py-2 text-body-s text-text-muted">
          <span className="text-accent">TODO</span> — awaiting content
        </p>
      ) : (
        <div className="mt-3 text-body-s leading-relaxed text-text-secondary">
          {children ?? value}
        </div>
      )}
    </div>
  );
}

export default function WorkIndex() {
  const rootRef = useRef<HTMLDivElement>(null);
  const peek = useProjectPeek();
  const [active, setActive] = useState(projects[0]?.slug ?? "");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        // The section closest to the top of the viewport wins.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          );
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    rootRef.current
      ?.querySelectorAll<HTMLElement>("section[id]")
      .forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  /* A considered per-section entrance: the header settles first, then the
     fields, links and hero image follow in a short staggered sequence —
     so moving between projects reads as a composed transition rather than
     a cut. Reduced motion / no JS: everything is simply visible. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current!;
    root.classList.add("wi-live");
    const anims: { revert?: () => void }[] = [];

    root.querySelectorAll<HTMLElement>("section[id]").forEach((sec) => {
      const enter = "bottom-=8% top";
      const seq: [string, number][] = [
        [".wi-head", 0],
        [".wi-fields", 90],
        [".wi-links", 180],
      ];
      seq.forEach(([sel, delay]) => {
        const el = sec.querySelector<HTMLElement>(sel);
        if (!el) return;
        anims.push(
          animate(el, {
            opacity: [0, 1],
            y: [10, 0],
            duration: 460,
            delay: delay * 0.5,
            ease: "out(3)",
            autoplay: onScroll({ target: sec, enter, repeat: false }),
          }),
        );
      });

      const fields = sec.querySelectorAll<HTMLElement>(".wi-fields > div");
      if (fields.length) {
        anims.push(
          animate(fields, {
            opacity: [0, 1],
            y: [8, 0],
            duration: 420,
            delay: stagger(38, { start: 60 }),
            ease: "out(3)",
            autoplay: onScroll({ target: sec, enter, repeat: false }),
          }),
        );
      }

      const hero = sec.querySelector<HTMLElement>(".wi-hero");
      if (hero) {
        anims.push(
          animate(hero, {
            opacity: [0, 1],
            scale: [1.035, 1],
            duration: 900,
            delay: 220,
            ease: "out(3)",
            autoplay: onScroll({ target: sec, enter, repeat: false }),
          }),
        );
      }
    });

    return () => {
      anims.forEach((a) => a.revert?.());
      root.classList.remove("wi-live");
    };
  }, []);

  const goTo = (slug: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(slug);
    if (!el) return;
    setActive(slug);
    const lenis = getLenis();
    // Lenis already honours the section's scroll-margin — no extra offset.
    if (lenis) lenis.scrollTo(el, { duration: 1.1 });
    else el.scrollIntoView({ block: "start" });
    history.replaceState(null, "", `#${slug}`);
  };

  return (
    <div ref={rootRef} className="px-6 pb-32 pt-10 md:px-12 lg:px-20">
      <header className="flex items-baseline justify-between">
        <FlipLink
          href="/"
          label="← Home"
          className="text-overline uppercase tracking-[0.05em] text-text-muted"
        />
        <span className="text-overline uppercase tracking-[0.05em] text-text-muted">
          {projects.length} projects
        </span>
      </header>

      <RevealText
        as="h1"
        text="Projects."
        stagger={0.016}
        className="mt-16 block font-semibold leading-none tracking-[-0.03em]"
        style={{ fontSize: "clamp(56px, 11vw, 170px)" }}
      />

      <div className="mt-20 gap-16 lg:grid lg:grid-cols-[180px_1fr] lg:gap-20 xl:grid-cols-[220px_1fr]">
        {/* Persistent sidebar */}
        <nav aria-label="Projects" className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-overline uppercase tracking-[0.08em] text-text-muted">
              Index
            </p>
            <ul className="mt-5 space-y-1">
              {projects.map((p, i) => {
                const meta = WORK_META[p.slug];
                const isActive = active === p.slug;
                return (
                  <li key={p.slug}>
                    <a
                      href={`#${p.slug}`}
                      onClick={goTo(p.slug)}
                      aria-current={isActive ? "true" : undefined}
                      className={`flip-link group flex items-baseline gap-3 py-1.5 text-body-s transition-colors duration-200 ${
                        isActive
                          ? "text-accent"
                          : "text-text-muted hover:text-text"
                      }`}
                    >
                      <span className="text-overline tabular-nums opacity-60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="sr-only">
                        {meta?.navLabel ?? p.title}
                      </span>
                      <span className="flip-box" aria-hidden>
                        <span className="flip-roll">
                          <span className="flip-face">
                            {meta?.navLabel ?? p.title}
                          </span>
                          <span className="flip-face flip-face-alt">
                            {meta?.navLabel ?? p.title}
                          </span>
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Project sections */}
        <div className="space-y-28 md:space-y-40">
          {projects.map((project, i) => {
            const media = WORK_MEDIA[project.slug];
            const meta = WORK_META[project.slug];
            return (
              <section
                key={project.slug}
                id={project.slug}
                className="scroll-mt-24"
              >
                {/* Title + year */}
                <div className="wi-head flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-5">
                  <RevealText
                    as="h2"
                    text={project.title}
                    className="block font-semibold tracking-tight"
                    style={{ fontSize: "clamp(28px, 3.4vw, 48px)" }}
                  />
                  <span className="font-display text-body-l italic text-text-muted">
                    {meta?.year ?? (
                      <span className="text-accent">TODO</span>
                    )}
                  </span>
                </div>

                {meta?.module && (
                  <p className="mt-4 text-overline uppercase tracking-[0.05em] text-text-muted">
                    {meta.module}
                  </p>
                )}

                {/* Brief / Skills / Role, side by side */}
                <div className="wi-fields mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
                  <Field label="Brief" value={meta?.brief} />
                  <Field label="Skills">
                    {meta && meta.skills.length > 0 ? (
                      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                        {meta.skills.map((s) => (
                          <li key={s} className="after:ml-3 after:text-text-muted after:content-['·'] last:after:content-['']">
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : undefined}
                  </Field>
                  <Field label="Role" value={meta?.role} />
                </div>

                {/* Links */}
                {meta && meta.links.length > 0 && (
                  <div className="wi-links mt-8 flex flex-wrap gap-x-8 gap-y-3">
                    {meta.links.map((l) =>
                      l.external ? (
                        <a
                          key={l.label}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-baseline gap-2 text-body-s font-medium transition-colors hover:text-accent"
                        >
                          {l.label}
                          <span
                            aria-hidden
                            className="text-accent transition-transform duration-300 group-hover:translate-x-1"
                          >
                            ↗
                          </span>
                        </a>
                      ) : (
                        <Link
                          key={l.label}
                          href={l.href}
                          className="group inline-flex items-baseline gap-2 text-body-s font-medium transition-colors hover:text-accent"
                        >
                          {l.label}
                          <span
                            aria-hidden
                            className="text-accent transition-transform duration-300 group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </Link>
                      ),
                    )}
                  </div>
                )}

                {/* Gallery — hero then numbered collage, sharp corners */}
                {media && (
                  <div className="mt-12 space-y-4 md:mt-16 md:space-y-6">
                    {/* Plain click opens the peek, which morphs from this
                        card; the href stays real so modifier-clicks, middle
                        clicks and crawlers still reach the case study. */}
                    <Link
                      href={`/work/${project.slug}`}
                      className="wi-hero block"
                      aria-label={`${project.title} — quick look`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
                          return;
                        e.preventDefault();
                        peek.open(project.slug);
                      }}
                    >
                      <Figure
                        image={media.hero}
                        alt={project.cover.alt}
                        eager={i === 0}
                        layoutId={peekId(project.slug)}
                      />
                    </Link>
                    {media.collage.length > 0 && (
                      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12 md:gap-6">
                        {media.collage.map((image, j) => (
                          <div key={image.src} className={SPANS[j % SPANS.length]}>
                            <Figure
                              image={image}
                              alt={`${project.title} — image ${j + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
