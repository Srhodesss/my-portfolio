import type { Metadata } from "next";
import WorkIndex from "@/components/WorkIndex";

export const metadata: Metadata = {
  title: "Projects — Sinai Rhodes",
  description:
    "Selected projects by Sinai Rhodes: Interax, Cardo, Sirho Frames, Cuttlesw!sh and Brushed Lips.",
};

export default function WorkPage() {
  return (
    <main>
      <WorkIndex />
    </main>
  );
}
