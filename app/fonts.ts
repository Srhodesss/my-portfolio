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
 */
import {
  Instrument_Sans,
  Instrument_Serif,
  Playfair_Display,
  DM_Sans,
} from "next/font/google";

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
  display: "swap",
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
  display: "swap",
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
  display: "swap",
});

/**
 * Reference face — DM Sans 500 for the scripture reference line
 * (uppercase, wide-tracked, muted).
 */
export const referenceFace = DM_Sans({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-reference",
  display: "swap",
});
