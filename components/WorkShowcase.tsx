"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/lib/projects";

/**
 * Work on the homepage: the embossed orange folder, now a straight link
 * through to /work (no on-page gallery). Hover keeps the spring bounce;
 * a light pin (+60%) holds the section briefly as it passes. Documents
 * sit in thin white-bordered cards like papers in a real folder — the
 * first three projects plus Verdure so the newest work shows too.
 */

const DOC_PROJECTS = [...projects.slice(0, 3), projects[5]].filter(Boolean);

export default function WorkShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current!;
    const folder = section.querySelector<HTMLElement>(".work-folder")!;
    section.classList.add("spring-on");

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Light pin: a brief hold on the folder as the section passes.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=60%",
        pin: pinRef.current,
      });
    }, sectionRef);

    const onEnter = () => {
      gsap.to(folder, {
        scale: 1.05,
        duration: 0.85,
        ease: "elastic.out(1, 0.45)",
      });
      gsap.to(".folder-front", {
        rotateX: -14,
        duration: 0.85,
        ease: "elastic.out(1, 0.45)",
      });
      gsap.utils.toArray<HTMLElement>(".folder-doc").forEach((doc, i) => {
        gsap.to(doc, {
          yPercent: [-2, -12, -21, -29][i],
          duration: 0.9,
          delay: i * 0.04,
          ease: "back.out(2.4)",
        });
      });
    };
    const onLeave = () => {
      gsap.to(folder, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" });
      gsap.to(".folder-front", {
        rotateX: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.5)",
      });
      gsap.utils.toArray<HTMLElement>(".folder-doc").forEach((doc, i) => {
        gsap.to(doc, {
          yPercent: [8, -2, -11, -19][i],
          duration: 0.7,
          delay: i * 0.03,
          ease: "back.out(2)",
        });
      });
    };
    folder.addEventListener("pointerenter", onEnter);
    folder.addEventListener("pointerleave", onLeave);
    return () => {
      section.classList.remove("spring-on");
      folder.removeEventListener("pointerenter", onEnter);
      folder.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([folder, ".folder-front", ".folder-doc"]);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="work" className="scroll-mt-12">
      <div
        ref={pinRef}
        className="flex min-h-svh flex-col justify-center px-6 py-16 md:px-12 lg:px-20"
      >
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          Work
        </p>

        <div className="mt-12 flex flex-col items-center pb-6">
          <p className="mb-10 text-body-m text-text-secondary">
            Curious? Check out my work.
          </p>

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
              <span className="folder-label">Projects</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
