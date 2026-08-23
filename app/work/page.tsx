import type { Metadata } from "next";
import WorkIndex from "@/components/WorkIndex";

export const metadata: Metadata = {
  title: "Projects — Sinai Rhodes",
  description:
    "Selected projects by Sinai Rhodes: Interax, Cardo, AID (Sirho Frames), Cuttleswish and Brushed Lips.",
};

export default function WorkPage() {
  return (
    <main>
      <WorkIndex />
    </main>
  );
}
