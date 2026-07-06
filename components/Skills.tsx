"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Skills — replaces the old Capabilities anchor (the nav's Skills link
 * points here). The twelve capabilities from CLAUDE.md §6, grouped.
 * Each category heading carries a thin line that draws in, scrubbed to
 * scroll while its row moves through the active band of the viewport.
 * Reduced motion / no JS: lines drawn, everything static.
 */

const GROUPS: { title: string; skills: string[] }[] = [
  {
    title: "Design",
    skills: ["Product Design", "Industrial Design", "UX/UI"],
  },
  {
    title: "Engineering & Craft",
    skills: ["Design Engineering", "CAD & Prototyping", "Computational Design"],
  },
  {
    title: "Research & Insight",
    skills: ["User Research", "Data Analysis"],
  },
  {
    title: "Product & Systems",
    skills: [
      "Product Strategy",
      "Product Management",
      "Workflow Optimisation",
      "Systems Thinking",
    ],
  },
];

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".skill-row").forEach((row) => {
        gsap.fromTo(
          row.querySelector(".skill-line-fill"),
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top 78%",
              end: "top 38%",
              scrub: true,
            },
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="scroll-mt-12 px-6 py-24 md:px-12 md:py-36 lg:px-20"
    >
      <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
        Skills
      </p>

      <div className="mt-14 space-y-16 md:space-y-20">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="skill-row grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20"
          >
            <div>
              <h3 className="text-heading font-semibold tracking-tight">
                {group.title}
              </h3>
              <div className="mt-5 h-px w-full bg-white/10">
                <div className="skill-line-fill h-px origin-left bg-text-secondary" />
              </div>
            </div>
            <ul className="space-y-2">
              {group.skills.map((skill) => (
                <li
                  key={skill}
                  className="text-body-l leading-relaxed text-text-secondary"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
