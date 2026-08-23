import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseDeck from "@/components/CaseDeck";
import { CASE_DECKS } from "@/lib/case-decks";
import { getProject } from "@/lib/projects";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return Object.keys(CASE_DECKS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  const deck = CASE_DECKS[slug];
  if (!project || !deck) return {};
  return {
    title: `${project.title} — ${deck.label} — Sinai Rhodes`,
    description: `${deck.label} for ${project.title}, page by page.`,
  };
}

export default async function DeckPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  const deck = CASE_DECKS[slug];
  if (!project || !deck) notFound();
  return (
    <main>
      <CaseDeck title={project.title} slug={slug} deck={deck} />
    </main>
  );
}
