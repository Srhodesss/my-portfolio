import Image from "next/image";
import Link from "next/link";
import type { Project, ProjectImage } from "@/lib/projects";
import { getNextProject } from "@/lib/projects";

function Figure({ image, sizes }: { image: ProjectImage; sizes: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-black ${
        image.fit === "contain" ? "p-6 md:p-10" : ""
      }`}
      style={{ aspectRatio: image.aspect ?? "4/3" }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className={image.fit === "contain" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}

export default function CaseStudyLayout({ project }: { project: Project }) {
  const next = getNextProject(project.slug);

  return (
    <article className="mx-auto max-w-5xl px-6 pb-24 pt-16 md:px-12 md:pt-24">
      <Link
        href="/work"
        className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
      >
        ← Projects
      </Link>

      <header className="mt-12 md:mt-16">
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          {project.tags.join(" · ")}
        </p>
        <h1
          className="mt-4 font-extrabold leading-[0.95] tracking-[-0.03em]"
          style={{ fontSize: "clamp(44px, 7vw, 96px)" }}
        >
          {project.title}
        </h1>
        <p className="mt-6 max-w-2xl text-body-m text-text-secondary md:text-body-l">
          {project.impact}
        </p>
      </header>

      <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-lg border border-border bg-black md:mt-16">
        <Image
          src={project.cover.src}
          alt={project.cover.alt}
          fill
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-cover"
          priority
        />
      </div>

      <div className="mt-20 space-y-16 md:mt-28 md:space-y-24">
        {project.sections.map((section) => (
          <section key={section.heading} data-reveal>
            <h2 className="text-heading font-semibold tracking-tight">
              {section.heading}
            </h2>
            <div
              className={`mt-5 space-y-4 ${
                section.placeholder
                  ? "rounded-lg border border-dashed border-text-muted/40 p-5"
                  : ""
              }`}
            >
              {section.placeholder && (
                <p className="text-overline uppercase tracking-[0.05em] text-accent">
                  Placeholder
                </p>
              )}
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="max-w-[65ch] text-body-m leading-relaxed text-text-secondary"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            {section.image && (
              <div className="mt-10 md:mt-12">
                <Figure
                  image={section.image}
                  sizes="(min-width: 1024px) 960px, 100vw"
                />
              </div>
            )}
          </section>
        ))}
      </div>

      {project.gallery && project.gallery.length > 0 && (
        <div
          data-reveal
          className="mt-20 grid gap-6 sm:grid-cols-2 md:mt-28 md:gap-8"
        >
          {project.gallery.map((image) => (
            <Figure
              key={image.src}
              image={image}
              sizes="(min-width: 768px) 480px, 100vw"
            />
          ))}
        </div>
      )}

      <footer className="mt-24 border-t border-border pt-10 md:mt-32">
        <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
          Next project
        </p>
        <Link
          href={`/work/${next.slug}`}
          className="group mt-3 inline-flex items-baseline gap-3"
        >
          <span className="text-heading font-semibold tracking-tight md:text-[40px]">
            {next.title}
          </span>
          <span
            aria-hidden
            className="text-accent transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </footer>
    </article>
  );
}
