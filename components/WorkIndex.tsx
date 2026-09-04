"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FlipLink from "@/components/FlipLink";
import RevealText from "@/components/RevealText";
import { animate, onScroll, stagger } from "animejs";
import { getLenis } from "@/components/SmoothScroll";
import { projects } from "@/lib/projects";
import { WORK_MEDIA, type WorkImage } from "@/lib/work-images";
import { WORK_META } from "@/lib/work-meta";
import RippleText from "@/components/RippleText";

/**
 * /work — an editorial index. A persistent left sidebar lists every
 * project; each entry anchors to its section on the same page and
 * highlights as that section becomes current. Each section leads with a
 * title and year, then three labelled fields side by side (Summary, Skills,
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
/* Explicit spans, as literal strings so Tailwind's scanner sees them. */
const SPAN_CLASS: Record<number, string> = {
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  12: "md:col-span-12",
};

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
      className={`relative w-full overflow-hidden ${
        // UI / screen captures read as their own artefact and are shot on
        // white; product renders keep the dark ground. The white sits
        // directly behind the artwork — no frame, no inset — so the image
        // renders at its own full size.
        image.light
          ? image.beige
            ? "bg-cutout-warm"
            : "bg-cutout"
          : "border border-border bg-black"
      } ${layoutId ? "peek-card" : ""}`}
      style={{
        aspectRatio: `${image.w} / ${image.h}`,
        // Written inline rather than as an arbitrary Tailwind class: a
        // clamped border-width does not survive the class scanner.
        // Top and bottom only: the artwork already runs to the left and
        // right edges of its white ground, so side borders read as extra
        // margin rather than a frame.
        ...(image.bordered
          ? {
              borderTop: "clamp(10px, 1.3vw, 20px) solid #ffffff",
              borderBottom: "clamp(10px, 1.3vw, 20px) solid #ffffff",
              boxSizing: "border-box" as const,
            }
          : null),
      }}
    >
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 76vw, 100vw"
        className={`${
          image.alpha || image.light ? "object-contain" : "object-cover"
        } ${image.padded ? "p-5" : ""}`}
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
  /* Returning from a case study lands on that project's row.

     This reads a value the deck writes on its way out rather than the
     URL hash: the App Router commits the route, scrolls it to the top,
     and only then writes the hash, so hash-based positioning was undone
     on every single project. The hash is still honoured as a fallback
     for someone arriving on a /work#slug link directly.

     The paint is held until the row's offset stops moving, because the
     page mounts progressively and positioning early lands short. */
  useLayoutEffect(() => {
    let slug = "";
    try {
      slug = sessionStorage.getItem("work-return") ?? "";
    } catch {
      /* private mode */
    }
    if (!slug) slug = decodeURIComponent(window.location.hash.slice(1));
    if (!slug) return;

    const root = document.documentElement;
    root.style.visibility = "hidden";

    let done = false;
    let last = Number.NaN;
    let stable = 0;
    const started = performance.now();

    const finish = (el: HTMLElement | null) => {
      if (done) return;
      done = true;
      if (el) {
        const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
        // Lenis caches the document height. Arriving from a deck page,
        // which is exactly one viewport tall with no scrolling, it still
        // believed the page could not scroll and silently clamped every
        // target to 0 — the scroll position never moved at all. Re-measure
        // before asking it to go anywhere.
        const lenis = getLenis() as {
          resize?: () => void;
          scrollTo: (t: number, o?: Record<string, unknown>) => void;
        } | null;
        lenis?.resize?.();
        lenis?.scrollTo(top, { immediate: true, force: true });
        // Belt and braces: if Lenis still refuses, drive the window.
        if (Math.abs(window.scrollY - top) > 4) window.scrollTo(0, top);
      }
      // Cleared only now: ScrollReset reads this to know it should keep
      // its hands off the scroll position while a return is in flight.
      try {
        sessionStorage.removeItem("work-return");
      } catch {
        /* private mode */
      }
      root.style.visibility = "";
    };

    const settle = () => {
      if (done) return;
      const el = document.getElementById(slug);
      const off = el ? Math.round(el.offsetTop) : Number.NaN;
      stable = off === last ? stable + 1 : 0;
      last = off;
      if (el && stable >= 2) return finish(el);
      if (performance.now() - started > 1500) return finish(el);
      requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);

    return () => {
      done = true;
      root.style.visibility = "";
    };
  }, []);

  const rootRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
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

  /* The pinned Home link sits over the big "Projects" title on load.
     Fade it out while the two overlap, and back in once past it. */
  useEffect(() => {
    const home = homeRef.current;
    const title = document.querySelector<HTMLElement>(".work-title");
    if (!home || !title) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const h = home.getBoundingClientRect();
      const t = title.getBoundingClientRect();
      const overlapping = t.top < h.bottom + 8 && t.bottom > h.top - 8;
      home.style.opacity = overlapping ? "0" : "1";
      home.style.pointerEvents = overlapping ? "none" : "";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
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
      {/* On a phone the project headers stick to the very top, directly
          under the Home link — the two sat on top of each other as each
          title scrolled up. The headers now stop below it (see .wi-head in
          globals.css) and this strip fills the band they used to occupy,
          so content scrolls behind an opaque bar rather than through the
          Home link. Desktop is untouched: there the headers begin well to
          the right of it and never collide. */}
      <div className="wi-topbar" aria-hidden />

      {/* Home stays put: pinned top-left, above the index, at any scroll
          position on this page. */}
      <div
        ref={homeRef}
        className="fixed left-6 top-6 z-50 transition-opacity duration-300 md:left-12 lg:left-20"
      >
        <FlipLink
          href="/"
          label="Home"
          underline
          backArrow
          className="text-overline uppercase tracking-[0.05em] text-text-muted"
        />
      </div>

      <RevealText
        as="h1"
        text="Projects"
        stagger={0.016}
        className="work-title mt-16 block font-semibold leading-none tracking-[-0.03em]"
        style={{ fontSize: "clamp(56px, 11vw, 170px)" }}
      />

      <div className="mt-20 gap-16 lg:grid lg:grid-cols-[180px_1fr] lg:gap-20 xl:grid-cols-[220px_1fr]">
        {/* Persistent sidebar */}
        <nav aria-label="Projects" className="hidden lg:block">
          <div className="sticky top-28">
            {/* No "Index" heading: the numbered list under it is
                self-evidently one, and the page already carries its own
                title. */}
            <ul className="space-y-1">
              {projects.map((p, i) => {
                const meta = WORK_META[p.slug];
                const isActive = active === p.slug;
                return (
                  <li key={p.slug}>
                    <a
                      href={`#${p.slug}`}
                      onClick={goTo(p.slug)}
                      aria-current={isActive ? "true" : undefined}
                      className={`wi-nav flip-link group flex items-baseline gap-3 py-1.5 text-body-s ${
                        isActive
                          ? "wi-nav-active text-accent"
                          : "text-text-muted hover:text-text"
                      }`}
                    >
                      {/* Slides in as this project becomes current. */}
                      <span aria-hidden className="wi-nav-mark" />
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
                // No scroll-margin: the header is sticky at top 0, and any gap here
                // leaves the descender of "Projects" peeking in above it.
                className="wi-section scroll-mt-0"
              >
                {/* Title + year */}
                {/* Sticky while its own images scroll past; the next project's
                    header pushes it out as it arrives. */}
                <div className="wi-head sticky top-0 z-30 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border bg-bg pb-5 pt-6">
                  <RevealText
                    as="h2"
                    text={project.title}
                    className="block font-semibold tracking-tight"
                    style={{ fontSize: "clamp(28px, 3.4vw, 48px)" }}
                  />
                  <span className="font-display text-body-l italic text-accent">
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

                {/* Summary / Skills / Role, side by side */}
                <div className="wi-fields mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
                  <Field label="Summary" value={meta?.summary} />
                  <Field label="Skills">
                    {meta && meta.skills.length > 0 ? (
                      <>
                        <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                          {meta.skills.map((s) => (
                            <li key={s} className="after:ml-3 after:text-text-muted after:content-['·'] last:after:content-['']">
                              {s}
                            </li>
                          ))}
                        </ul>
                        {/* Named software sits under the disciplines, so
                            the two are never read as one list. Each mark
                            comes from the same set the Skills section
                            uses. */}
                        {/* Spread across the full width of the column
                            rather than clustered in the middle, so the
                            marks read as a set belonging to the whole
                            Skills field. space-between with a minimum gap
                            keeps a two-mark row from flying apart. */}
                        {meta.tools.length > 0 && (
                          <ul className="mt-7 flex w-full flex-wrap items-center justify-between gap-x-5 gap-y-4 pr-2">
                            {meta.tools.map((tool) => (
                              <li key={tool.name} title={tool.name}>
                                <Image
                                  src={tool.icon}
                                  alt={tool.name}
                                  width={64}
                                  height={64}
                                  className="h-16 w-16 object-contain"
                                />
                              </li>
                            ))}
                            {/* A pair spread edge to edge reads as two
                                unrelated marks. An empty third slot makes
                                space-between place them at the left and
                                the centre, matching the rhythm of the
                                three-tool rows. */}
                            {meta.tools.length === 2 && (
                              <li aria-hidden className="h-16 w-16" />
                            )}
                          </ul>
                        )}
                      </>
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
                          className="group inline-flex items-baseline text-body-s font-medium"
                        >
                          <RippleText arrow="diagonal">{l.label}</RippleText>
                        </a>
                      ) : (
                        <Link
                          key={l.label}
                          href={l.href}
                          className="group inline-flex items-baseline text-body-s font-medium"
                        >
                          <RippleText arrow="right">{l.label}</RippleText>
                        </Link>
                      ),
                    )}
                  </div>
                )}

                {/* Gallery — hero then numbered collage, sharp corners */}
                {media && (
                  <div className="mt-12 space-y-4 md:mt-16 md:space-y-6">
                    {/* Not a link. The cover used to open a quick-look
                        peek on click; the row's own "View case study"
                        link is the way in now, so this is just the
                        project's opening image. */}
                    <div className="wi-hero block">
                      <Figure
                        image={media.hero}
                        alt={project.cover.alt}
                        eager={i === 0}
                      />
                    </div>
                    {media.collage.length > 0 && (
                      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12 md:gap-6">
                        {media.collage.map((image, j) => (
                          <div
                            key={image.src}
                            className={`${
                              image.full
                                ? "md:col-span-12"
                                : image.span
                                  ? SPAN_CLASS[image.span]
                                  : SPANS[j % SPANS.length]
                            }${image.centred ? " md:col-start-4" : ""}`}
                          >
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
