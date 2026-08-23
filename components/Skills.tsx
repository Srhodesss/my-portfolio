"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RevealText from "@/components/RevealText";

/**
 * Skills — three discipline categories, each listing its software plainly
 * (no cycling animation). Category headings keep the thin line drawn in
 * sync with scroll. Reduced motion / no JS: lines drawn, static.
 */

const GROUPS: { title: string; tools: string[] }[] = [
  {
    title: "Design",
    tools: ["Figma", "InDesign", "Illustrator", "Photoshop", "Procreate"],
  },
  {
    title: "Engineering & CAD",
    tools: ["SolidWorks", "Fusion 360", "Rhino", "Blender", "ANSYS"],
  },
  {
    title: "Data & Code",
    tools: ["Python", "MATLAB"],
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

      <div className="mt-12 space-y-16 md:space-y-20">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="skill-row grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-20"
          >
            <div>
              <RevealText
                as="h3"
                text={group.title}
                className="block text-heading font-semibold tracking-tight"
              />
              <div className="mt-5 h-px w-full bg-white/10">
                <div className="skill-line-fill h-px origin-left bg-text-secondary" />
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-10 gap-y-3 self-center">
              {group.tools.map((tool) => (
                <li
                  key={tool}
                  className="text-body-l leading-relaxed text-text-secondary"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
