import type { ReactNode } from "react";
import RevealText from "@/components/RevealText";

/**
 * Reusable long-form case-study section shell. `tone="interlude"` switches
 * to the light research/insight palette (navy / lime / off-white); default
 * is the dark site palette. The header block fades up via the shared
 * data-reveal system; each section is a full scroll beat.
 *
 * This is the template primitive — other projects compose these once they
 * have their own source material.
 */
export default function StorySection({
  id,
  eyebrow,
  title,
  intro,
  tone = "dark",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  tone?: "dark" | "interlude";
  children?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`cs-section scroll-mt-16 px-6 md:px-12 lg:px-20 ${
        tone === "interlude" ? "cs-interlude" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl">
        {/* The heading carries its own per-word reveal; the eyebrow and
            intro fade separately so the two don't double-animate. */}
        <div className="max-w-3xl">
          {eyebrow && (
            <p
              data-reveal
              className="cs-eyebrow text-overline uppercase tracking-[0.05em] text-text-muted"
            >
              {eyebrow}
            </p>
          )}
          <RevealText
            as="h2"
            text={title}
            className="mt-4 block font-semibold leading-[1.05] tracking-[-0.02em]"
            style={{ fontSize: "clamp(30px, 4.5vw, 60px)" }}
          />
          {intro && (
            <div
              data-reveal
              className="mt-6 text-body-m leading-relaxed opacity-80"
            >
              {intro}
            </div>
          )}
        </div>
        {children && <div className="mt-12 md:mt-16">{children}</div>}
      </div>
    </section>
  );
}
