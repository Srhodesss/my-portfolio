/**
 * Index metadata for /work — the Brief / Skills / Role fields shown above
 * each project's gallery.
 *
 * Copy is drawn from CLAUDE.md §6 and the built Interax case study only.
 * Anything not yet supplied is `null`, which renders as a clearly marked
 * TODO placeholder rather than invented content. Years are only stated
 * where there is evidence (Interax: DE3 / DESE60001, portfolio dated
 * March 2025); the rest await confirmation.
 */

export type WorkLink = { label: string; href: string; external?: boolean };

export type WorkMeta = {
  /** Short label for the sidebar. */
  navLabel: string;
  year: string | null;
  module: string | null;
  /** The problem being solved. */
  brief: string | null;
  /** Disciplines and tools applied. */
  skills: string[];
  /** What Sinai specifically did. */
  role: string | null;
  links: WorkLink[];
};

const FIGMA_PROTO =
  "https://www.figma.com/proto/PmwFyUaUryU0T8ocQ5CZgA/Interax-UI?node-id=8-68&starting-point-node-id=8%3A68&locale=en";

export const WORK_META: Record<string, WorkMeta> = {
  interax: {
    navLabel: "Interax",
    year: "2025",
    module: "DE3 · DESE60001 Design Engineering Futures",
    brief:
      "ADHD students rarely get to see their own focus — when it arrives, when it breaks, and what breaks it. Without that feedback, every study session is guesswork.",
    skills: [
      "UX Research",
      "UI Design",
      "Wearable",
      "Data Visualisation",
      "Figma",
      "Blender",
    ],
    role: "UX research, UI design and data visualisation — shaping how raw biometric signals become something a student can read at a glance.",
    links: [
      { label: "View prototype", href: FIGMA_PROTO, external: true },
      { label: "Read the case study", href: "/work/interax" },
    ],
  },
  cardo: {
    navLabel: "Cardo",
    year: null,
    module: null,
    brief:
      "Budgets live in apps people avoid opening. Overspending doesn't feel like anything at the moment it happens — the feedback arrives weeks later, as a statement.",
    skills: ["Product Design", "Fintech", "UX/UI", "CAD"],
    role: "Product design across hardware and software: the card's form and CAD, and the app's budgeting, diary and savings views.",
    links: [{ label: "Read the case study", href: "/work/cardo" }],
  },
  "aid-sirho-frames": {
    navLabel: "AID",
    year: null,
    module: null,
    brief: null,
    skills: ["Industrial Design", "Design Engineering", "CAD", "Prototyping"],
    role: null,
    links: [{ label: "Read the case study", href: "/work/aid-sirho-frames" }],
  },
  cuttleswish: {
    navLabel: "Cuttleswish",
    year: null,
    module: null,
    brief:
      "Stirring is one of cooking's quiet strains — long, repetitive and hard on older wrists and shoulders. Giving it up often means giving up dishes people have cooked their whole lives.",
    skills: [
      "Industrial Design",
      "Design Engineering",
      "CAD",
      "Electronics",
      "User Research",
    ],
    role: "Industrial design and design engineering across the project: user research with elderly cooks, CAD, and the electronics behind the LED-ring interface.",
    links: [{ label: "Read the case study", href: "/work/cuttleswish" }],
  },
  "brushed-lips": {
    navLabel: "Brushed Lips",
    year: null,
    module: null,
    brief:
      "Lipstick packaging is designed to be thrown away — a single-use shell around a product people repurchase for years.",
    skills: ["Sustainable Design", "Industrial Design", "Packaging", "CAD"],
    role: null,
    links: [{ label: "Read the case study", href: "/work/brushed-lips" }],
  },
  verdure: {
    navLabel: "Verdure",
    year: null,
    module: null,
    brief: null,
    skills: ["Product Design", "CAD", "Prototyping"],
    role: null,
    links: [{ label: "Read the case study", href: "/work/verdure" }],
  },
};
