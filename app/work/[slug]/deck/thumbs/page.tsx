import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseDeckThumbs from "@/components/CaseDeckThumbs";
import { CASE_DECKS } from "@/lib/case-decks";
import { getProject } from "@/lib/projects";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return Object.keys(CASE_DECKS).map((slug) => ({ slug }));
}

export const metadata: Metadata = {
  title: "Deck — thumbnail variant — Sinai Rhodes",
};

export default async function DeckThumbsPage({
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
      <CaseDeckThumbs title={project.title} deck={deck} />
    </main>
  );
}
