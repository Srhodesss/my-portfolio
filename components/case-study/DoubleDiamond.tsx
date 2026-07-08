"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Double Diamond framework, revealed in sequence as the section scrolls.
 * Four phases (Discover / Define / Develop / Deliver) brighten one after
 * another, scrubbed to scroll — the diamond half and its step column light
 * together. Step text lives in an aligned HTML grid below the SVG (rather
 * than inside it) so nothing collides and it reflows on mobile.
 *
 * Base state (no JS / reduced motion) is fully lit.
 */

const PHASES = [
  {
    key: "discover",
    label: "Discover",
    steps: ["Understanding ADHD challenges", "User insights", "Technology exploration"],
    tri: "10,150 250,20 250,280",
    labelX: 130,
    fill: "rgba(255,255,255,0.04)",
  },
  {
    key: "define",
    label: "Define",
    steps: ["User needs identification", "Concept ideation", "Technical feasibility"],
    tri: "250,20 490,150 250,280",
    labelX: 370,
    fill: "rgba(255,107,53,0.08)",
  },
  {
    key: "develop",
    label: "Develop",
    steps: ["Refining EMS feedback", "Biometric data refinement", "Concept visualisation"],
    tri: "510,150 750,20 750,280",
    labelX: 630,
    fill: "rgba(255,255,255,0.04)",
  },
  {
    key: "deliver",
    label: "Deliver",
    steps: ["Concept validation", "Scenario testing", "Final concept"],
    tri: "750,20 990,150 750,280",
    labelX: 870,
    fill: "rgba(255,107,53,0.08)",
  },
];

export default function DoubleDiamond() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Light the diamond half and its step column together, phase by phase.
      PHASES.forEach((p, i) => {
        const targets = rootRef.current!.querySelectorAll(`[data-phase="${p.key}"]`);
        gsap.set(targets, { autoAlpha: 0.18 });
        gsap.to(targets, {
          autoAlpha: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: `top ${72 - i * 4}%`,
            end: `top ${34 - i * 4}%`,
            scrub: true,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mt-4">
      <svg
        viewBox="0 0 1000 300"
        className="w-full"
        role="img"
        aria-label="Double Diamond design process: Discover, Define, Develop, Deliver"
      >
        {PHASES.map((p) => (
          <g key={p.key} className="dd-phase" data-phase={p.key}>
            <polygon
              points={p.tri}
              fill={p.fill}
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <text
              x={p.labelX}
              y="158"
              textAnchor="middle"
              fill="var(--text)"
              style={{ font: "600 21px var(--font-primary), sans-serif" }}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
        {PHASES.map((p) => (
          <div key={p.key} data-phase={p.key} className="dd-phase">
            <p className="text-overline uppercase tracking-[0.05em] text-accent">
              {p.label}
            </p>
            <ul className="mt-3 space-y-1.5">
              {p.steps.map((s) => (
                <li key={s} className="text-body-s leading-snug text-text-muted">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
