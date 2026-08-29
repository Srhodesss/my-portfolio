"use client";

/* Primary navigation.

   The bar sits in the flow at the bottom of the hero and again at the
   bottom of the closing section, so it scrolls with the page rather than
   following the reader down it.

   "Skills" replaces the old dead Capabilities anchor (CLAUDE.md §6) —
   the Skills section covers that role. */

import FlipLink from "@/components/FlipLink";
import { crossFadeTo, sectionTarget } from "@/lib/section-nav";

const NAV = [
  { label: "About", href: "#about" },
  // Scrolls to the folder on this page rather than leaving for /work.
  { label: "Projects", href: "#work" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export default function BottomNav({ delay }: { delay?: string }) {
  const go = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = sectionTarget(href.slice(1));
    if (target === null) return;
    e.preventDefault();
    crossFadeTo(target);
  };

  return (
    <nav
      aria-label="Primary"
      className={`relative z-10 border-t border-border ${
        delay ? "hero-rise" : ""
      }`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <div>
        <ul className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2">
          {NAV.map(({ label, href }) => (
            <li key={label}>
              <FlipLink
                href={href}
                label={label}
                underline
                onClick={go(href)}
                // py gives each link a 44px-tall hit area without changing how it looks.
                className="inline-flex items-center py-3.5 text-overline uppercase tracking-[0.05em] text-text-muted"
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
