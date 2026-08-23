/* Bottom-bar navigation, shared by the hero and the closing section.
   "Skills" replaces the old dead Capabilities anchor (CLAUDE.md §6) —
   the Skills section covers that role. */
const NAV = [
  { label: "Projects", href: "/work" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export default function BottomNav({ delay }: { delay?: string }) {
  return (
    <nav
      aria-label="Primary"
      className={`relative z-10 border-t border-border ${delay ? "hero-rise" : ""}`}
      style={delay ? { animationDelay: delay } : undefined}
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
  );
}
