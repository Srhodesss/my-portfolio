import type { Metadata } from "next";
import {
  primarySans,
  displaySerif,
  scriptureFace,
  referenceFace,
} from "./fonts";
import CustomCursor from "@/components/CustomCursor";
import ProjectPeek from "@/components/ProjectPeek";
import ScrollReset from "@/components/ScrollReset";
import ScrollReveal from "@/components/ScrollReveal";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinai Rhodes — Design Engineer | Product Specialist",
  description:
    "Portfolio of Sinai Rhodes, Design Engineering student at Imperial College London. Engineering products that move people forward.",
};

/**
 * Runs before first paint: arms the scripture intro (locks scroll, holds
 * the hero entrance) only on the homepage, when JS is running and motion
 * is allowed — no-JS and reduced-motion visitors land straight on the
 * hero, and other routes are never scroll-locked. ScriptureIntro removes
 * the class when it hands over to the hero.
 */
const introGate = `try{if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("intro-active")}catch(e){}
// Arriving at a section anchor (back from a case study): hide before the
// first paint so the server HTML never shows at the top on its way down to
// the target. ScrollReset reveals once the layout has settled; the timeout
// is a safety net if that never runs.
try{if(location.hash){var d=document.documentElement;d.style.visibility="hidden";setTimeout(function(){d.style.visibility=""},1500)}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${primarySans.variable} ${displaySerif.variable} ${scriptureFace.variable} ${referenceFace.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-bg font-sans text-text">
        <script dangerouslySetInnerHTML={{ __html: introGate }} />
        <SmoothScroll>
          <ProjectPeek>{children}</ProjectPeek>
        </SmoothScroll>
        <CustomCursor />
        <ScrollReset />
        <ScrollReveal />
      </body>
    </html>
  );
}
