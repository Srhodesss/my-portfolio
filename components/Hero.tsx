import HeroGlyphField from "@/components/HeroGlyphField";

/* Bottom-bar navigation (CLAUDE.md §6). About / Capabilities anchors are
   placeholders until those sections land in a later phase. */
const NAV = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Contact", href: "#contact" },
];

export default function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden px-6 pt-10 md:px-12 lg:px-20">
      <HeroGlyphField />

      {/* Name only, horizontal along the bottom: SINAI left, Rhodes right,
          shared baseline. */}
      <h1
        className="hero-rise relative z-10 mt-auto flex items-baseline justify-between gap-6 pb-6 md:pb-8"
        style={{
          animationDelay: "0.2s",
          fontSize: "clamp(48px, 13.5vw, 210px)",
          lineHeight: 0.95,
        }}
      >
        {/* Semibold, not extrabold: Instrument Sans caps at 700 anyway, and
            600 sits as a matched pair with the serif italic. */}
        <span className="font-semibold tracking-[-0.03em]">SINAI</span>
        <span className="font-display font-normal italic tracking-[-0.01em]">
          Rhodes
        </span>
      </h1>

      {/* Bottom bar */}
      <nav
        aria-label="Primary"
        className="hero-rise relative z-10 border-t border-border"
        style={{ animationDelay: "0.5s" }}
      >
        <ul className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
          {NAV.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
