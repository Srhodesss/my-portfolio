import type { Metadata } from "next";
import {
  primarySans,
  displaySerif,
  scriptureFace,
  referenceFace,
  imperialAramaic,
} from "./fonts";
import CustomCursor from "@/components/CustomCursor";
import ProjectPeek from "@/components/ProjectPeek";
import ScrollReset from "@/components/ScrollReset";
import ScrollReveal from "@/components/ScrollReveal";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinai Rhodes | Design Engineer",
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
try{if(location.hash){var d=document.documentElement;d.style.visibility="hidden";setTimeout(function(){d.style.visibility=""},1500)}}catch(e){}
// WebKit's compositor is measurably more expensive than Blink's for
// stacked filters, backdrop-filter and mask-image — the effects this
// site leans on hardest. Stamped pre-paint so the lighter variants are
// what actually gets composited first, never a swap after.
// navigator.vendor rather than a UA string: "Apple Computer, Inc." is
// Safari AND every iOS browser (all WebKit, all the same compositor),
// while Chrome/Edge on macOS report "Google Inc." — which is exactly the
// split wanted here. Two classes on purpose: wk is the plain fact, wk-fx
// gates the reductions, so wk-fx can be toggled off in Web Inspector to
// A/B a Timeline trace without a rebuild.
try{if(navigator.vendor==="Apple Computer, Inc."){document.documentElement.classList.add("wk","wk-fx")}}catch(e){}
// No cursor gate here any more. Removing cursor-off pre-paint killed the
// load flash, but it also suppressed the native cursor during the window
// before the custom one knows where the pointer is — leaving NO cursor at
// all, which on WebKit shows as the OS arrow drawn and never redrawn away.
// CustomCursor now owns this as a single tie: cursor-off is removed on the
// first pointermove and restored when the pointer leaves, so the suppression
// is active exactly while the custom cursor is drawn and never otherwise.
// The class ships on <html> from the server, so the state before any pointer
// input is a normal arrow rather than nothing.`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // cursor-off ships in the server HTML and the pre-paint script above
      // removes it when the custom cursor applies. Shipped ON so that a
      // visitor whose JS never runs keeps a real cursor; removed before
      // first paint otherwise, so there is never a frame with the OS
      // arrow drawn over the page for WebKit to then fail to redraw.
      className={`cursor-off ${primarySans.variable} ${displaySerif.variable} ${scriptureFace.variable} ${referenceFace.variable} ${imperialAramaic.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* The Hebrew watermark is on screen from the first frame of the
            scripture intro, so its face has to be in flight before the
            stylesheet is even parsed. Without this the browser only
            discovered the @font-face when it reached the CSS, and the
            watermark flashed in a fallback serif first. */}
        <link
          rel="preload"
          href="/fonts/hebrew-background.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
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
