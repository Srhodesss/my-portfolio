/**
 * Font system — the single place to swap typefaces.
 *
 * Primary sans candidates: Satoshi, Neue Montreal, General Sans, Inter, Mona Sans.
 * Inter is the working default. To swap to a non-Google face (e.g. General Sans
 * from Fontshare), replace this with a `next/font/local` config pointing at the
 * font files and keep the same `variable` name — nothing else needs to change.
 *
 * The Hebrew background face (Gveret Levin, raw-assets/bible-verse-intro/) is
 * loaded via @font-face in globals.css from /fonts/hebrew-background.ttf.
 *
 * All faces use `display: "block"`, not "swap". Swap paints a fallback on
 * the first frame and replaces it when the real face arrives, and the two
 * have different metrics — so descenders (f, g) were clipping and then
 * completing a moment later, visible in the scripture verse, the hero's
 * "Engineering products that move people forward" and the pill
 * definitions. The clipping rather than mere shifting comes from the
 * masked inline-block word wrappers those three share (.rt-word,
 * .skill-word-mask): a line box sized to the fallback crops the real
 * face's descenders until the reflow lands.
 * `block` holds the glyphs invisible instead of showing the wrong ones.
 * next/font self-hosts and preloads these, so that wait is a frame or
 * two — the same trade the Hebrew face already makes in globals.css,
 * for the same reason.
 */
import {
  Instrument_Sans,
  Instrument_Serif,
  Playfair_Display,
  DM_Sans,
} from "next/font/google";
import localFont from "next/font/local";

/**
 * Primary sans — stand-in for TASA Orbiter (paid; files to be supplied).
 * General Sans was requested but lives on Fontshare, not Google Fonts, so
 * Instrument Sans is the Google-hosted stand-in. To swap in TASA Orbiter
 * (or General Sans) later: replace this block with a `next/font/local`
 * config keeping `variable: "--font-primary"` — nothing else changes.
 */
export const primarySans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "block",
});

/**
 * Display serif — Instrument Serif italic, for display and accent text
 * (the "Rhodes" in the hero name, accent lines).
 */
export const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-display-serif",
  display: "block",
});

/**
 * Scripture face — Playfair Display italic 400, a refined high-contrast
 * serif (CLAUDE.md §5: "refined italic serif"). Verse only.
 */
export const scriptureFace = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-scripture",
  display: "block",
});

/**
 * Reference face — DM Sans 500 for the scripture reference line
 * (uppercase, wide-tracked, muted).
 */
export const referenceFace = DM_Sans({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-reference",
  display: "block",
});

/**
 * Noto Sans Imperial Aramaic — self-hosted via next/font/local from the
 * .ttf dropped at the project root (preferred over the Google Fonts link
 * tags: no external request, no render-blocking round trip, and Next
 * subsets/preloads it automatically).
 *
 * IMPORTANT: despite the similar name, this typeface has ZERO coverage of
 * the Hebrew square script (U+0590-05FF) the site's verses are written
 * in — it only covers the distinct ancient Imperial Aramaic script block
 * (U+10840-1085F), ~2,700 years older and a different alphabet, not a
 * stylistic variant. Applying it to the existing Hebrew watermark text
 * changes nothing: the browser silently falls back past it to the next
 * font in the stack for every glyph actually used. Wired up and ready,
 * but see the note where it is applied (.hebrew-texture-imperial-aramaic
 * in globals.css) before using it on real content.
 */
export const imperialAramaic = localFont({
  src: "../Noto_Sans_Imperial_Aramaic/NotoSansImperialAramaic-Regular.ttf",
  variable: "--font-imperial-aramaic",
  display: "block",
});
