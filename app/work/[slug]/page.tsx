import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseDeck from "@/components/CaseDeck";
import CaseStudyLayout from "@/components/CaseStudyLayout";
import { CASE_DECKS } from "@/lib/case-decks";
import { getProject, projects } from "@/lib/projects";

type Params = { slug: string };

/**
 * Projects whose portfolio PDF is the case study are shown as a deck
 * (see components/CaseDeck) rather than a bespoke page. Interax moved to
 * this treatment so every project reads and is indexed the same way.
 */
const RICH_STUDIES: Record<string, () => React.ReactNode> = {};

/* Projects whose portfolio PDF *is* the case study: the page shows the
   same flick-through deck the other projects use, indexed by the section
   titles read from the top of each page. */
const DECK_AS_CASE_STUDY = new Set(["interax"]);

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: `${project.title} — Sinai Rhodes`,
    description: project.impact,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const slug = (await params).slug;
  const project = getProject(slug);
  if (!project) notFound();
  const rich = RICH_STUDIES[slug];
  const deck = CASE_DECKS[slug];
  if (!rich && deck && DECK_AS_CASE_STUDY.has(slug)) {
    return (
      <main>
        <CaseDeck title={project.title} slug={slug} deck={deck} />
      </main>
    );
  }
  return <main>{rich ? rich() : <CaseStudyLayout project={project} />}</main>;
}
