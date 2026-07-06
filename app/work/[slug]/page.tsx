import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyLayout from "@/components/CaseStudyLayout";
import { getProject, projects } from "@/lib/projects";

type Params = { slug: string };

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
  const project = getProject((await params).slug);
  if (!project) notFound();
  return (
    <main>
      <CaseStudyLayout project={project} />
    </main>
  );
}
