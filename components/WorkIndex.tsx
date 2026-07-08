"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/lib/projects";
import { WORK_MEDIA, type WorkImage } from "@/lib/work-images";

/**
 * /work — editorial project index (juanmora work.html spirit): sharp
 * corners throughout, each project a navigable section. Per project: the
 * Hero image first (linked to the case study), then the curated collage
 * of numeric-prefixed images from raw-assets in their numeric order.
 * Images with real transparency sit in white boxes so cutouts read
 * cleanly on the dark page. Figures clip-reveal as they enter.
 *
 * Reduced motion / no JS: everything visible and static.
 */

/* Editorial column rhythm for collage items, cycling. Literal class
   strings so Tailwind's scanner sees them. */
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
}: {
  image: WorkImage;
  alt: string;
  eager?: boolean;
}) {
  return (
    <div
      className={`wi-figure relative w-full overflow-hidden border border-border ${
        image.alpha ? "bg-white p-6 md:p-10" : "bg-black"
      }`}
      style={{ aspectRatio: `${image.w} / ${image.h}` }}
    >
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 88vw, 100vw"
        className={image.alpha ? "object-contain p-6 md:p-10" : "object-cover"}
        priority={eager}
      />
    </div>
  );
}

export default function WorkIndex() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".wi-figure").forEach((figure) => {
        gsap.fromTo(
          figure,
          { autoAlpha: 0, y: 70, clipPath: "inset(12% 0% 12% 0%)" },
          {
            autoAlpha: 1,
            y: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: figure,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    }, rootRef);

    /* Magnetic hover + morphing cursor on the linked heroes. */
    let teardowns: (() => void)[] = [];
    if (window.matchMedia("(pointer: fine)").matches) {
      const cursor = cursorRef.current!;
      root.classList.add("magnetic-on");
      gsap.set(cursor, { autoAlpha: 0, scale: 0.4 });
      const xTo = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3.out" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3.out" });
      teardowns = gsap.utils
        .toArray<HTMLElement>(".work-panel a")
        .map((card) => {
          const onEnter = () => {
            gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: 0.3 });
            gsap.to(card, { scale: 1.02, duration: 0.45, ease: "power3.out" });
          };
          const onMove = (e: PointerEvent) => {
            xTo(e.clientX);
            yTo(e.clientY);
            const r = card.getBoundingClientRect();
            const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
            const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
            gsap.to(card, {
              x: nx * 12,
              y: ny * 8,
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
    }

    return () => {
      root.classList.remove("magnetic-on");
      teardowns.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="px-6 pb-32 pt-10 md:px-12 lg:px-20">
      <header className="flex items-baseline justify-between">
        <Link
          href="/"
          className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
        >
          ← Home
        </Link>
        <nav aria-label="Projects on this page">
          <ul className="hidden gap-6 md:flex">
            {projects.map((p, i) => (
              <li key={p.slug}>
                <a
                  href={`#${p.slug}`}
                  className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
                >
                  {String(i + 1).padStart(2, "0")}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <h1
        className="mt-16 font-semibold leading-none tracking-[-0.03em]"
        style={{ fontSize: "clamp(56px, 11vw, 170px)" }}
      >
        Work<span className="font-display font-normal italic">.</span>
      </h1>

      <div className="mt-24 space-y-32 md:mt-32 md:space-y-48">
        {projects.map((project, i) => {
          const media = WORK_MEDIA[project.slug];
          return (
            <section
              key={project.slug}
              id={project.slug}
              className="work-panel scroll-mt-16"
            >
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <h2 className="text-heading font-semibold tracking-tight">
                  {project.title}
                </h2>
                <span className="text-overline tracking-[0.05em] text-text-muted">
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {String(projects.length).padStart(2, "0")}
                </span>
              </div>

              <Link href={`/work/${project.slug}`} className="group block">
                <Figure
                  image={media.hero}
                  alt={project.cover.alt}
                  eager={i === 0}
                />
                <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4">
                  <p className="max-w-2xl text-body-s text-text-secondary">
                    {project.impact}
                  </p>
                  <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
                    {project.tags.join(" · ")}
                  </p>
                </div>
              </Link>

              {media.collage.length > 0 && (
                <div className="mt-8 grid grid-cols-1 items-end gap-4 md:mt-10 md:grid-cols-12 md:gap-6">
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
            </section>
          );
        })}
      </div>

      {/* Morphing cursor for the linked heroes */}
      <div ref={cursorRef} aria-hidden className="work-cursor">
        View
      </div>
    </div>
  );
}
