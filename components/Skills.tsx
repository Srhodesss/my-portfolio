"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAfterIntro } from "@/lib/use-after-intro";

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
      "I use design to tell a story. Whether it's a portfolio, a product, or an interface, the message needs to land clearly. Good design tells that story. Clear storytelling is the hard part.",
    tools: [
      { name: "Figma", icon: "/logos/Figma.png" },
      { name: "InDesign", icon: "/logos/Adobe-InDesign.png" },
      { name: "Illustrator", icon: "/logos/Adobe-Illustrator.png" },
      { name: "After Effects", icon: "/logos/Adobe-After-Effects.png" },
      { name: "Procreate", icon: "/logos/Procreate.png" },
      { name: "PowerPoint", icon: "/logos/PowerPoint.png" },
    ],
  },
  {
    title: "Engineering & CAD",
    blurb:
      "Modelling and technical development, taken from CAD through to prototyping. Iteration through prototyping takes patience and precision, and that attention to detail is something I prioritise in every build.",
    tools: [
      { name: "SolidWorks", icon: "/logos/Solidworks.png" },
      { name: "Fusion 360", icon: "/logos/Fusion360.png" },
      { name: "Rhino", icon: "/logos/Rhino.png" },
      { name: "ANSYS", icon: "/logos/Ansys.png" },
      { name: "Blender", icon: "/logos/Blender.png" },
      { name: "KeyShot", icon: "/logos/Keyshot.png" },
    ],
  },
  {
    title: "Data & Analytics",
    blurb:
      "Performance is measured through data, and that demands rigour, not guesswork. I use it to test assumptions, catch what isn't working, and make decisions I can actually justify.",
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
  // See lib/use-after-intro — this section's own ScrollTrigger setup
  // mounts and runs regardless of being hidden behind the intro overlay,
  // competing with the intro's character reveal for the main thread on a
  // phone.
  const afterIntro = useAfterIntro();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!afterIntro) return;

    const section = sectionRef.current!;
    section.classList.add("skills-live");
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      /* One scrubbed timeline for the whole section, not one per row.

         Per-row triggers could never all peak together: the section is a
         viewport tall, so when the last row reached the middle the first
         two were already above it and the section itself had scrolled
         past centre. Driving the timeline from the SECTION means the
         reveal completes exactly as the section sits centred, with the
         rows staggered inside that one span. */
      const rows = gsap.utils.toArray<HTMLElement>(".skill-row");
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 88%",
          // Peaks as the categories centre — but only when the section
          // actually fits the viewport. On a short window it is taller
          // than the screen, so "centred" is never reached and the
          // section was still unrevealed when the nav landed on it.
          // There, finish as its top clears the same band the title
          // lands in.
          end: () => {
            const el = sectionRef.current;
            const tall = !!el && el.offsetHeight > window.innerHeight;
            return tall ? "top 15%" : "center center";
          },
          invalidateOnRefresh: true,
          scrub: true,
        },
      });

      rows.forEach((row, i) => {
        const words = row.querySelectorAll(".skill-word");
        const line = row.querySelector(".skill-line-fill");
        const tools = row.querySelectorAll(".skill-tool");
        // Each row opens a little after the one above it, and the last
        // one still finishes inside the shared span.
        const at = i * 14;

        tl.fromTo(
          words,
          { yPercent: 115, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 26, stagger: 6 },
          at,
        );
        tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 34 }, at + 8);
        tl.fromTo(
          tools,
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 24, stagger: 5 },
          at + 18,
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      section.classList.remove("skills-live");
    };
  }, [afterIntro]);

  return (
    <section
      ref={sectionRef}
      id="skills"
      /* py-8 below md, not py-24: with three accordion rows and one
         expanded blurb stacked on a phone, the section's own top+bottom
         padding was the single largest contributor to running past the
         viewport height — bigger than the expanded text itself. Cutting
         it here (together with the row spacing below) is the
         load-bearing part of fitting all three rows without a scroll;
         md:py-28 (desktop, untouched) stays exactly as it was. */
      className="flex min-h-svh scroll-mt-12 flex-col justify-center px-6 py-8 md:px-12 md:py-28 lg:px-20"
    >
      <p className="section-label section-label-heading">
        Skills
      </p>

      {/* mt-6/space-y-6 below md, not mt-10/space-y-14: the last lever
          toward fitting three accordion rows plus one expanded blurb in
          a phone's viewport height without scrolling, after the blurb's
          own font-size and the section's padding above. md:mt-10/
          md:space-y-16 (desktop) are exactly what they were. */}
      <div className="mt-6 space-y-4 md:mt-10 md:space-y-16">
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
                  {/* text-pretty: the browser rebalances the closing lines so a
                      final short word is not left on its own. At 1728px the
                      column landed such that "part." and "justify." each hung
                      alone; this fixes that at every width rather than the
                      one measured.
                      Smaller below md: with all three accordion rows and one
                      expanded blurb stacked on a phone, the full section runs
                      well past the viewport height. */}
                  <p className="mt-5 max-w-[52ch] text-pretty text-[13px] leading-snug text-text-secondary md:text-body-m md:leading-relaxed">
                    {group.blurb}
                  </p>
                </div>
              </div>
            </div>
            {/* Always a single row of 6 (see .skill-tools-grid) — icons
                shrink to fit their grid cell rather than the row ever
                wrapping. flex-wrap's organic wrapping used to land
                wherever the icons' fixed pixel width happened to break,
                which at plenty of real widths landed on 2 per row (3
                rows) or an uneven mix instead. */}
            <div className="skill-tools self-center">
              <ul className="skill-tools-grid">
                {group.tools.map((tool, i) => (
                  <li key={tool.name} className="skill-tool">
                    {tool.icon ? (
                      <span className="flex flex-col items-center gap-2 md:gap-3">
                        {/* Square, sized by the grid cell (not a fixed px
                            box) so it scales with whichever of the two
                            layouts is active. Padded on mobile: six equal
                            marks sitting edge-to-edge in a narrow column
                            read as one cluttered strip rather than six
                            distinct tools — the inset gives each its own
                            breathing room without shrinking the grid
                            cell itself. Not needed on desktop, where the
                            wider columns already carry that space. */}
                        <span className="skill-logo relative block aspect-square w-full p-1.5 md:p-0">
                          {/* unoptimized: these marks are already emitted
                              at a fixed, normalised 256x256 (see the Tool
                              comment above) — plenty of resolution for the
                              ~50-110px box they render into, so there is
                              nothing for Next's resize pipeline to do here
                              except generate a dozen srcset variants no
                              browser needs. It also turned out not to be
                              free: four of these marks (Fusion 360, Rhino,
                              ANSYS, Blender) were reproducibly failing to
                              resolve through `/_next/image` — the direct
                              file always served fine, but the optimizer's
                              lazy-loaded, multi-candidate srcset never
                              settled on one for these four specifically,
                              even minutes later. Serving the file directly
                              (same fix MountSinai's own base image uses,
                              for the same reason) sidesteps that pipeline
                              entirely rather than chasing why. */}
                          <Image
                            src={tool.icon}
                            alt={tool.name}
                            fill
                            unoptimized
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
                              // No modulo: `i % 5` wrapped the sixth mark
                              // back to zero, so Tableau swept in step with
                              // Python at the far end of the row instead of
                              // following its neighbour.
                              animationDelay: `${i * 0.42}s`,
                            }}
                          />
                        </span>
                        {/* Name appears with the panel, under its logo —
                            desktop only. Six columns leave each mobile
                            cell too narrow for a multi-word name (e.g.
                            "After Effects", "Adobe Analytics") to stay
                            legible at any size worth shrinking to, so it
                            is dropped there rather than wrapped small. */}
                        <span
                          className={`hidden text-center text-[clamp(14px,1.1vw,17px)] leading-tight text-text-muted transition-opacity duration-500 md:block ${
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
          </div>
        ))}
      </div>
    </section>
  );
}
