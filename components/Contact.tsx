/**
 * Contact — lukebaffait-style: one large confident heading, a single
 * "Contact me" call to action, minimal supporting links, generous space.
 * Phone number and Portfolio PDF intentionally left out pending Sinai's
 * confirmation. LinkedIn URL and CV file are placeholders until supplied.
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
      className="scroll-mt-12 px-6 py-32 md:px-12 md:py-48 lg:px-20"
    >
      <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
        Contact
      </p>

      <h2
        className="mt-10 max-w-[14ch] font-semibold leading-[1.02] tracking-[-0.02em]"
        style={{ fontSize: "clamp(44px, 7.5vw, 116px)" }}
      >
        Let&rsquo;s build something{" "}
        <span className="font-display font-normal italic">together.</span>
      </h2>

      <a
        href="mailto:sinai.r@icloud.com"
        className="group mt-14 inline-flex items-baseline gap-4 text-body-l font-medium transition-colors hover:text-accent md:text-heading"
      >
        Contact me
        <span
          aria-hidden
          className="inline-block text-accent transition-transform duration-300 group-hover:translate-x-2"
        >
          →
        </span>
      </a>

      <ul className="mt-16 flex gap-10">
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
    </section>
  );
}
