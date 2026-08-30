/**
 * Index metadata for /work — the Summary / Skills / Role fields shown
 * above each project's gallery.
 *
 * Copy is drawn from CLAUDE.md §6, the built Interax case study, and each
 * project's own source document. Anything not yet supplied is `null`,
 * which renders as a clearly marked TODO placeholder rather than invented
 * content. Years are only stated where there is evidence (Interax: DE3 /
 * DESE60001, portfolio dated March 2025); the rest await confirmation.
 *
 * `skills` and `tools` are deliberately separate. Skills are the
 * disciplines and methods; tools are the named software, each one taken
 * from a statement in that project's own document where one exists.
 * Sirho Frames names its software outright ("Fusion 360", "Grasshopper.
 * Voronoi Generation", "Blender cycles"); Interax names Figma for UI/UX,
 * Blender for 3D and Python for biometric analysis; Cuttlesw!sh names
 * Blender for renders and Illustrator for the packaging net. Fusion 360
 * on Cuttlesw!sh is Sinai's own account of the CAD work; the group
 * portfolio says "Final CAD Model" without naming the package.
 *
 * Tools are rendered as marks only, with no text label, so the row reads
 * as a set of software rather than a second list of skills. Each name
 * survives as the image's alt text and title.
 */

export type WorkLink = { label: string; href: string; external?: boolean };

/** Named software, matched to the logo set used by the Skills section. */
export type WorkTool = { name: string; icon: string };

export type WorkMeta = {
  /** Short label for the sidebar. */
  navLabel: string;
  year: string | null;
  module: string | null;
  /** The problem being solved. */
  summary: string | null;
  /** Disciplines and methods. No software. */
  skills: string[];
  /** Named software, evidenced by the project's own document. */
  tools: WorkTool[];
  /** What Sinai specifically did. */
  role: string | null;
  links: WorkLink[];
};

const FIGMA_PROTO =
  "https://www.figma.com/proto/PmwFyUaUryU0T8ocQ5CZgA/Interax-UI?node-id=8-68&starting-point-node-id=8%3A68&locale=en";

const TOOL = {
  figma: { name: "Figma", icon: "/logos/Figma.png" },
  blender: { name: "Blender", icon: "/logos/Blender.png" },
  python: { name: "Python", icon: "/logos/Python.png" },
  excel: { name: "Excel", icon: "/logos/Excel.png" },
  fusion: { name: "Fusion 360", icon: "/logos/Fusion360.png" },
  // Grasshopper is Rhino's visual programming environment and ships with
  // it, so it carries the Rhino mark.
  grasshopper: { name: "Grasshopper", icon: "/logos/Rhino.png" },
  illustrator: { name: "Illustrator", icon: "/logos/Adobe-Illustrator.png" },
  powerpoint: { name: "PowerPoint", icon: "/logos/PowerPoint.png" },
} as const;

export const WORK_META: Record<string, WorkMeta> = {
  interax: {
    navLabel: "Interax",
    year: "Mar 2025",
    module: "Imperial · Design Engineering Futures",
    summary:
      "ADHD students are asked to manage their focus without ever being shown it. Interax is a biometric wearable and companion app that reads heart rate, respiratory rate and electrodermal activity, and turns them into a record of focus a student can actually read.",
    skills: [
      "User Research",
      "UI Design",
      "Data Visualisation",
      "Wearable Design",
      "Biometrics",
    ],
    tools: [TOOL.figma, TOOL.blender, TOOL.python],
    role: "One of five. I led the user research that outlined the design requirements, and designed the app prototype and the systems overview: the key screens and states, and the data visualisation that turns raw biometric traces into something readable mid-session.",
    links: [
      { label: "View prototype", href: FIGMA_PROTO, external: true },
      { label: "Read the case study", href: "/work/interax" },
    ],
  },
  cardo: {
    navLabel: "Cardo",
    year: "Dec 2024",
    module: "Imperial · Innovation & Entrepreneurship",
    summary:
      "Budgeting apps only work for people willing to open them, and overspending registers as nothing at the moment it happens. Cardo moves the feedback onto the card itself: an electrochromic surface that shifts colour as a budget is spent down, with an app that categorises spending and forecasts the month.",
    skills: [
      "Product Design",
      "UX/UI",
      "Fintech",
      "CAD",
      "Market Analysis",
      "Financial Modelling",
    ],
    tools: [TOOL.figma, TOOL.excel],
    role: "Product design across hardware and software: the card's form and CAD, and the app's budgeting, diary and savings views. I ran the user research that shaped the design, mapped the sales channels and marketing approach, and built the market analysis and a three year month on month P&L model behind the business case.",
    links: [{ label: "View case study", href: "/work/cardo/deck" }],
  },
  "aid-sirho-frames": {
    navLabel: "Sirho Frames",
    year: "Mar 2025",
    module: "Imperial · Advanced Industrial Design",
    summary:
      "A rollerblading frame carries every gram directly under the foot, and adjusting the wheels means bringing an allen key that is easy to leave at home. Sirho Frames answers both: a lighter structure that gives up no stiffness, and the tool carried inside the frame.",
    skills: [
      "Industrial Design",
      "Design Engineering",
      "Computational Design",
      "CMF",
      "Prototyping",
    ],
    tools: [TOOL.fusion, TOOL.grasshopper, TOOL.blender],
    role: "Solo, from structural concept to finished CMF. I generated the Voronoi lattice to reduce weight without losing stiffness, and specified the frame material and manufacturing process.",
    links: [{ label: "View case study", href: "/work/aid-sirho-frames/deck" }],
  },
  cuttleswish: {
    navLabel: "Cuttlesw!sh",
    year: "Jun 2024",
    module: "Imperial · Industrial Design Engineering",
    summary:
      "Stirring is a long, low-grade strain that falls hardest on older cooks, and giving it up usually means giving up the dishes a person has cooked their whole life. Cuttlesw!sh is an automatic pot stirrer with silicone attachments that fit different pots, set through an LED ring and rotary encoder that need no fine grip or close vision.",
    skills: [
      "Industrial Design",
      "Design Engineering",
      "User Research",
      "Electronics",
      "CAD",
      "Packaging Design",
    ],
    tools: [TOOL.fusion, TOOL.blender, TOOL.illustrator],
    role: "Chief Operations Officer on a team of four, owning user experience and manufacture. I ran the packaging end to end, researched safety, compliance and labelling, designed the user guide, soldered the circuit, and did the 3D printing, assembly and finishing of the final unit.",
    links: [{ label: "View case study", href: "/work/cuttleswish/deck" }],
  },
  "brushed-lips": {
    navLabel: "Brushed Lips",
    year: "Dec 2024",
    module: "Imperial · Sustainable Design Engineering",
    summary:
      "A lipstick tube is built to be discarded: a plastic spinning mechanism sleeved in metal and glued shut, with a third of the bullet buried to hold it upright and never used. Only 9% of cosmetic packaging reaches a recycling plant. Brushed Lips replaces it with a case machined from one piece of aluminium, where a slider does the spinning mechanism's job and only the bullet is replaced.",
    skills: [
      "Sustainable Design",
      "Industrial Design",
      "Packaging",
      "CAD",
      "Life Cycle Assessment",
      "User Research",
    ],
    tools: [TOOL.fusion, TOOL.blender, TOOL.illustrator],
    role: "One of four. I designed and rendered the CAD and packaging, then owned the actors and data layers of the circular system: mapping stakeholders and what each would need to change, building the user profiles the design is argued against, and auditing the claims the product could defend.",
    links: [{ label: "View case study", href: "/work/brushed-lips/deck" }],
  },
  verdure: {
    navLabel: "Verdure",
    year: "May 2022",
    module: "Dulwich College · Product Design NEA Project",
    summary:
      "A keen gardener collects more plants than a patio can hold, and through summer they sit on the ground with nowhere to go. Verdure is a five-tier outdoor plant stand built for one client: hardwood shelves on a black-painted metal frame, holding twelve to fifteen pots clear of the floor with storage underneath.",
    skills: [
      "Product Design",
      "Client Research",
      "Ergonomics",
      "Material Selection",
      "CAD",
      "Manufacturing",
    ],
    tools: [TOOL.fusion, TOOL.powerpoint],
    role: "Run end to end and made by hand. I interviewed the client and ran a task analysis to turn what he wanted into testable specification points, then took that through to a finished piece of furniture.",
    links: [{ label: "View case study", href: "/work/verdure/deck" }],
  },
};
