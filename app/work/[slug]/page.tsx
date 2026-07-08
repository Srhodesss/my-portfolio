import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyLayout from "@/components/CaseStudyLayout";
import InteraxCaseStudy from "@/components/InteraxCaseStudy";
import { getProject, projects } from "@/lib/projects";

type Params = { slug: string };

/**
 * Rich long-form case studies live in dedicated components as they get
 * their portfolio source material. Others use the simple template until
 * then. (The long-form pattern is components/case-study/*.)
 */
const RICH_STUDIES: Record<string, () => React.ReactNode> = {
  interax: () => <InteraxCaseStudy />,
};

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
  return <main>{rich ? rich() : <CaseStudyLayout project={project} />}</main>;
}
