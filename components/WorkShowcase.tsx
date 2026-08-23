"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { animate, onScroll } from "animejs";
import { projects } from "@/lib/projects";

/**
 * Work — a large "Work." wordmark sits behind, and the Projects folder
 * sits fully in front of it (explicit z-layers, never interleaved), so
 * the folder is unambiguously the focal point.
 *
 * The folder is treated as a small physical object: matte orange finish
 * (diffuse, no specular gloss), layered elevation shadows, and snappy
 * spring physics — quick overshoot and settle rather than a slow bounce.
 * Per apple-design: feedback fires on pointer-down, not on release, and
 * every tween starts from the element's live value so an interrupted
 * hover redirects instead of jumping.
 *
 * Reduced motion: no tweens; the folder rests in its static state.
 */

/* Every project gets a card in the folder. */
const DOC_PROJECTS = projects;

/* Snappy overshoot-and-settle. Short response, small overshoot. */
const SPRING_IN = { duration: 0.42, ease: "back.out(2.2)" } as const;
const SPRING_OUT = { duration: 0.34, ease: "back.out(1.3)" } as const;
const PRESS = { duration: 0.12, ease: "power2.out" } as const;

/* At rest the cards sit tucked in, only a sliver above the folder's
   top edge; hover lifts the stack clear. */
const REST_DOC_Y = [3, 0, -3, -6, -9, -12];
const HOVER_DOC_Y = [-14, -19, -24, -29, -34, -39];

export default function WorkShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const section = sectionRef.current!;
    const folder = section.querySelector<HTMLElement>(".work-folder")!;
    const front = section.querySelector<HTMLElement>(".folder-front")!;
    const docs = Array.from(section.querySelectorAll<HTMLElement>(".folder-doc"));
    section.classList.add("spring-on");

    // Wordmark colour: transparent grey -> transparent orange, tied to
    // scroll position through the section.
    const word = section.querySelector<HTMLElement>(".work-bg-word");
    const colourAnim = word
      ? animate(word, {
          color: ["rgba(160,160,160,0.10)", "rgba(255,107,53,0.30)"],
          ease: "linear",
          autoplay: onScroll({
            target: section,
            enter: "bottom top",
            leave: "top bottom",
            sync: true,
          }),
        })
      : null;

    let pressed = false;

    const settle = (hovered: boolean) => {
      gsap.to(folder, {
        scale: hovered ? 1.035 : 1,
        y: hovered ? -6 : 0,
        ...(hovered ? SPRING_IN : SPRING_OUT),
        overwrite: "auto",
      });
      gsap.to(front, {
        rotateX: hovered ? -13 : 0,
        ...(hovered ? SPRING_IN : SPRING_OUT),
        overwrite: "auto",
      });
      docs.forEach((doc, i) => {
        gsap.to(doc, {
          yPercent: hovered ? HOVER_DOC_Y[i] : REST_DOC_Y[i],
          ...(hovered ? SPRING_IN : SPRING_OUT),
          delay: hovered ? i * 0.028 : 0,
          overwrite: "auto",
        });
      });
    };

    const onEnter = () => settle(true);
    const onLeave = () => {
      pressed = false;
      settle(false);
    };
    // Feedback on pointer-down, not on release.
    const onDown = () => {
      pressed = true;
      gsap.to(folder, { scale: 0.985, y: -2, ...PRESS, overwrite: "auto" });
    };
    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      settle(true);
    };

    folder.addEventListener("pointerenter", onEnter);
    folder.addEventListener("pointerleave", onLeave);
    folder.addEventListener("pointerdown", onDown);
    folder.addEventListener("pointerup", onUp);
    folder.addEventListener("focus", onEnter);
    folder.addEventListener("blur", onLeave);

    return () => {
      section.classList.remove("spring-on");
      folder.removeEventListener("pointerenter", onEnter);
      folder.removeEventListener("pointerleave", onLeave);
      folder.removeEventListener("pointerdown", onDown);
      folder.removeEventListener("pointerup", onUp);
      folder.removeEventListener("focus", onEnter);
      folder.removeEventListener("blur", onLeave);
      colourAnim?.revert?.();
      gsap.killTweensOf([folder, front, ...docs]);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="work"
      className="relative scroll-mt-12 overflow-hidden px-6 py-28 md:px-12 md:py-40 lg:px-20"
    >
      {/* Background wordmark — explicitly behind (z-0), spanning the full
          page width. Its colour scrubs from transparent grey to
          transparent orange as the section moves through the viewport. */}
      <h2
        aria-hidden
        className="work-bg-word pointer-events-none absolute left-0 top-1/2 z-0 w-full -translate-y-1/2 select-none whitespace-nowrap text-center font-semibold leading-none tracking-[-0.04em]"
        style={{ fontSize: "17.1vw" }}
      >
        Projects
      </h2>
      <span className="sr-only">Projects</span>

      {/* Folder — explicitly in front (z-10). */}
      <div className="relative z-10 flex flex-col items-center">
        <Link
          href="/work"
          aria-label="View all projects"
          className="work-folder block outline-offset-8"
        >
          <span aria-hidden className="folder-back" />
          <span aria-hidden className="folder-docs">
            {DOC_PROJECTS.map((p, i) => (
              <span key={p.slug} className="folder-doc" data-i={i}>
                <span className="folder-doc-inner">
                  <Image
                    src={p.cover.src}
                    alt=""
                    fill
                    sizes="300px"
                    className="object-cover"
                    priority={i === 0}
                  />
                </span>
              </span>
            ))}
          </span>
          <span aria-hidden className="folder-front">
            <span className="folder-label">SR&rsquo;s Stuff</span>
          </span>
        </Link>

        <p className="mt-12 text-body-s text-text-muted">
          Curious? Check out my work.
        </p>
      </div>
    </section>
  );
}
