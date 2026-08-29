"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Skills — three discipline categories, each listing its software plainly.
 *
 * The reveal is scroll-scrubbed and deliberately slow, so each category
 * reads clearly as it arrives: its heading rises word by word, the thin
 * rule draws across, and the tools fade up in sequence — all linked to
 * scroll position (no pin, no hold; the section scrolls normally).
 *
 * Reduced motion / no JS: everything is shown static (the `skills-live`
 * gate that hides the pre-reveal state is only added by JS when motion is
 * allowed).
 */

/**
 * Logos live in /public/logos, normalised by scripts to an identical
 * 256x256 transparent box (trimmed to content, then centred), so every
 * mark reads at the same visual weight regardless of how the source file
 * was cropped. A tool with no logo falls back to its name.
 */
type Tool = { name: string; icon?: string };

/* Descriptions are drafted from the project content already in this repo
   (see lib/projects.ts and CLAUDE.md) rather than invented — Sinai to
   edit/approve the wording. */
const GROUPS: { title: string; blurb: string; tools: Tool[] }[] = [
  {
    title: "Design & Storytelling",
    blurb:
      "Interface and communication design. Interax's app screens and Cardo's budgeting, diary and savings views, and then the reports and portfolios themselves, which were laid out and art directed rather than just written.",
    tools: [
      { name: "Figma", icon: "/logos/Figma.png" },
      { name: "InDesign", icon: "/logos/Adobe-InDesign.png" },
      { name: "Illustrator", icon: "/logos/Adobe-Illustrator.png" },
      { name: "Procreate", icon: "/logos/Procreate.png" },
      { name: "PowerPoint", icon: "/logos/PowerPoint.png" },
    ],
  },
  {
    title: "Engineering & CAD",
    blurb:
      "Modelling and technical development, taken from CAD through prototyping to detail design: the Cuttlesw!sh assembly and its packaging, Cardo's card form, and the Voronoi structure inside the Sirho Frames.",
    tools: [
      { name: "SolidWorks", icon: "/logos/Solidworks.png" },
      { name: "Fusion 360", icon: "/logos/Fusion360.png" },
      { name: "Rhino", icon: "/logos/Rhino.png" },
      { name: "Blender", icon: "/logos/Blender.png" },
      { name: "ANSYS", icon: "/logos/Ansys.png" },
    ],
  },
  {
    title: "Data & Code",
    blurb:
      "Analysis and build: the focus algorithm and biometric processing behind Interax, the market and P&L modelling in Cardo's business report, and front-end work, including this site.",
    tools: [
      { name: "Python", icon: "/logos/Python.png" },
      { name: "MATLAB", icon: "/logos/Matlab.png" },
      // One mark, one entry — the source logo covers all three.
      { name: "HTML · CSS · JS", icon: "/logos/JS-HTML-CSS.png" },
      { name: "Excel", icon: "/logos/Excel.png" },
      { name: "Adobe Analytics", icon: "/logos/Adobe-Analytics.png" },
      { name: "Tableau", icon: "/logos/Tableau.png" },
    ],
  },
];

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const section = sectionRef.current!;
    section.classList.add("skills-live");
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".skill-row").forEach((row) => {
        const words = row.querySelectorAll(".skill-word");
        const line = row.querySelector(".skill-line-fill");
        const tools = row.querySelectorAll(".skill-tool");

        // One scrubbed timeline per row: the reveal is driven by the row's
        // passage from low in the viewport up towards the middle, so it
        // plays out slowly and is fully readable as it happens.
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: row,
            // Begins as the row enters the lower viewport and is fully
            // settled by the time its top reaches the middle — it should not
            // still be resolving when it is near the top of the screen.
            start: "top 85%",
            end: "top 50%",
            scrub: true,
          },
        });

        tl.fromTo(
          words,
          { yPercent: 115, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 30, stagger: 8 },
          0,
        );
        tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 46 }, 10);
        tl.fromTo(
          tools,
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 26, stagger: 6 },
          24,
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      section.classList.remove("skills-live");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="scroll-mt-12 px-6 pb-32 pt-16 md:px-12 md:pb-40 md:pt-24 lg:px-20"
    >
      <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
        Skills
      </p>

      <div className="mt-10 space-y-14 md:space-y-16">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="skill-row grid gap-8 lg:grid-cols-[1fr_1.55fr] lg:gap-16"
          >
            <div>
              <button
                type="button"
                onClick={() =>
                  setOpen((cur) => (cur === group.title ? null : group.title))
                }
                aria-expanded={open === group.title}
                aria-controls={`skills-panel-${group.title}`}
                className="group/acc flex w-full items-center justify-between gap-6 text-left"
              >
              <h3 className="block text-[clamp(30px,3vw,46px)] font-semibold tracking-tight">
                {group.title.split(" ").map((word, i) => (
                  <span key={i} className="skill-word-mask">
                    <span className="skill-word">{word}</span>
                    {i < group.title.split(" ").length - 1 ? " " : null}
                  </span>
                ))}
              </h3>
                {/* Plus that rotates into a cross as the panel opens. */}
                <span
                  aria-hidden
                  className="skill-toggle relative block h-5 w-5 shrink-0 transition-transform duration-500 ease-out"
                  style={{
                    transform:
                      open === group.title ? "rotate(135deg)" : "rotate(0deg)",
                  }}
                >
                  <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 bg-text-muted transition-colors duration-300 group-hover/acc:bg-accent" />
                  <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 bg-text-muted transition-colors duration-300 group-hover/acc:bg-accent" />
                </span>
              </button>

              <div className="mt-5 h-px w-full bg-white/10">
                <div className="skill-line-fill h-px origin-left bg-text-secondary" />
              </div>

              {/* Accordion panel: grid-rows trick animates to auto height. */}
              <div
                id={`skills-panel-${group.title}`}
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                  open === group.title
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="mt-5 max-w-[52ch] text-body-m leading-relaxed text-text-secondary">
                    {group.blurb}
                  </p>
                </div>
              </div>
            </div>
            <ul className="flex flex-wrap items-start gap-x-7 gap-y-8 self-center">
              {group.tools.map((tool, i) => (
                <li key={tool.name} className="skill-tool">
                  {tool.icon ? (
                    <span className="flex w-28 flex-col items-center gap-3">
                      {/* Fixed box: the artwork is already normalised, so
                          every mark occupies the same square. */}
                      <span className="skill-logo relative block h-24 w-24">
                        <Image
                          src={tool.icon}
                          alt={tool.name}
                          fill
                          sizes="96px"
                          className="object-contain"
                        />
                        {/* Shimmer sweep: the same moving-gradient mechanic
                            as reactbits' ShinyText, but masked by the
                            logo's own alpha instead of clipped to glyphs,
                            so the highlight only crosses the mark itself. */}
                        <span
                          aria-hidden
                          className="skill-shine"
                          style={{
                            WebkitMaskImage: `url(${tool.icon})`,
                            maskImage: `url(${tool.icon})`,
                            animationDelay: `${(i % 5) * 0.45}s`,
                          }}
                        />
                      </span>
                      {/* Name appears with the panel, under its logo. */}
                      <span
                        className={`text-center text-[clamp(14px,1.1vw,17px)] leading-tight text-text-muted transition-opacity duration-500 ${
                          open === group.title ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {tool.name}
                      </span>
                    </span>
                  ) : (
                    <span className="text-body-l leading-relaxed text-text-secondary">
                      {tool.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
