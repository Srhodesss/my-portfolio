/**
 * Contact — quiet and minimal (CLAUDE.md §6 footer). Name, email, links,
 * and the sign-off line. LinkedIn URL and CV file are placeholders until
 * Sinai supplies them.
 */

const LINKS = [
  // TODO: real LinkedIn profile URL from Sinai
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  // TODO: drop the real CV at public/cv.pdf
  { label: "CV", href: "/cv.pdf" },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-12 px-6 py-28 md:px-12 md:py-44 lg:px-20"
    >
      <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
        Contact
      </p>

      <h2
        className="mt-8 font-display italic leading-tight"
        style={{ fontSize: "clamp(36px, 5vw, 72px)" }}
      >
        Sinai Rhodes
      </h2>

      <a
        href="mailto:sinai.r@icloud.com"
        className="mt-6 inline-block text-body-l text-text-secondary transition-colors hover:text-accent md:text-heading"
      >
        sinai.r@icloud.com
      </a>

      <ul className="mt-12 flex gap-10">
        {LINKS.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-24 text-overline uppercase tracking-[0.05em] text-text-muted md:mt-32">
        Designed with purpose.
      </p>
    </section>
  );
}
