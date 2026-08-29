/**
 * Featured work — order and facts per CLAUDE.md §6. Copy is seed copy
 * drawn from the brief; Sirho Frames awaits real content from Sinai
 * and its placeholder sections are flagged with `placeholder: true` so the
 * template renders them clearly marked.
 */

export type ProjectImage = {
  src: string;
  alt: string;
  /** CSS aspect-ratio for the frame, e.g. "4/3". Defaults per context. */
  aspect?: string;
  /** "contain" for UI screens on a panel; "cover" (default) for renders. */
  fit?: "cover" | "contain";
  /** UI / screen captures: sit on white, not the dark ground. */
  light?: boolean;
};

export type CaseSection = {
  heading: string;
  body: string[];
  image?: ProjectImage;
  /** Clearly-marked placeholder awaiting real content. */
  placeholder?: boolean;
};

export type Project = {
  slug: string;
  title: string;
  impact: string;
  tags: string[];
  cover: ProjectImage;
  sections: CaseSection[];
  gallery?: ProjectImage[];
};

export const projects: Project[] = [
  {
    slug: "interax",
    title: "Interax",
    impact:
      "A biometric wearable and app that lets ADHD students see their focus — live, and after every session.",
    tags: ["UX Research", "UI Design", "Wearable", "Data Visualisation"],
    cover: { src: "/work/interax/hero.jpg", alt: "Interax app interface mockup" },
    sections: [
      {
        heading: "Challenge",
        body: [
          "Students with ADHD rarely get to see their own focus — when it arrives, when it breaks, and what breaks it. Without that feedback, every study session is guesswork.",
        ],
      },
      {
        heading: "Context",
        body: [
          "Interax pairs a biometric wearable with a companion app. The wearable reads heart rate, respiratory rate and electrodermal activity; the app turns those signals into a live picture of focus a student can actually use.",
        ],
        image: {
          src: "/work/interax/hand-mockup.png",
          alt: "Interax wearable worn on the hand",
          aspect: "3/4",
        },
      },
      {
        heading: "My role",
        body: [
          "UX research, UI design and data visualisation — shaping how raw biometric signals become something a student can read at a glance.",
        ],
      },
      {
        heading: "Process",
        body: [
          "The interface follows the rhythm of a study session: set an intention and start, watch a live focus state during the session, then unpack a full breakdown afterwards — where focus held, where it broke, and what the body was doing at the time.",
        ],
        image: {
          src: "/work/interax/ui.png",
          alt: "Interax app key screens",
        },
      },
      {
        heading: "Outcome",
        body: [
          "A wearable-plus-app system that gives ADHD students a feedback loop for focus: a live signal during the session, and a clear, visual breakdown after it.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/interax/focus-dashboard.png",
        alt: "Interax focus dashboard screen",
        aspect: "9/16",
        fit: "contain",
      },
      {
        src: "/work/interax/focus-breakdown.png",
        alt: "Interax post-session focus breakdown screen",
        aspect: "9/16",
        fit: "contain",
      },
    ],
  },
  {
    slug: "aid-sirho-frames",
    title: "Sirho Frames",
    impact: "A rollerblading frame project. Full case study in progress.",
    tags: ["Industrial Design", "Design Engineering", "CAD", "Prototyping"],
    cover: { src: "/work/aid-sirho-frames/hero.jpg", alt: "Sirho Frames render" },
    sections: [
      {
        heading: "Challenge",
        body: [
          "Placeholder — awaiting copy from Sinai. Sirho Frames is a rollerblading frame project spanning industrial design, design engineering, CAD and prototyping.",
        ],
        placeholder: true,
      },
      {
        heading: "CAD / technical development",
        body: [
          "Placeholder — awaiting technical write-up. Renders below are from the working CAD; 3D models exist and a live frame viewer is planned for a later phase.",
        ],
        placeholder: true,
        image: {
          src: "/work/aid/frame.png",
          alt: "Sirho frame CAD render",
        },
      },
    ],
    gallery: [
      { src: "/work/aid/podium-final.png", alt: "Sirho frame podium render" },
      {
        src: "/work/aid/podium-deconstructed.jpg",
        alt: "Sirho frame podium, deconstructed view",
      },
      {
        src: "/work/aid/podium-annotated.png",
        alt: "Sirho frame podium render, annotated",
      },
    ],
  },
  {
    slug: "cardo",
    title: "Cardo",
    impact:
      "A budgeting card that changes colour with your spending — feedback at the moment of payment, not the end of the month.",
    tags: ["Product Design", "Fintech", "UX/UI", "CAD"],
    cover: { src: "/work/cardo/hero.jpg", alt: "Cardo card and app mockup" },
    sections: [
      {
        heading: "Challenge",
        body: [
          "Budgets live in apps people avoid opening. Overspending doesn't feel like anything at the moment it happens — the feedback arrives weeks later, as a statement.",
        ],
      },
      {
        heading: "Context",
        body: [
          "Cardo is an electrochromic budgeting card and companion app for young professionals. The card itself shifts colour to reflect budget status — feedback you can't ignore, carried in the object you already pay with. The app does the deeper work: surfacing spending, savings and the quiet inefficiencies in between.",
        ],
        // Phase 5 idea (CLAUDE.md): make this card actually shift colour
        // on scroll or hover, since that is what the product does.
        image: {
          src: "/work/cardo/card.png",
          alt: "The Cardo electrochromic card",
          aspect: "8/3",
          fit: "contain",
        light: true,
        },
      },
      {
        heading: "My role",
        body: [
          "Product design across hardware and software: the card's form and CAD, and the app's budgeting, diary and savings views.",
        ],
      },
      {
        heading: "Process",
        body: [
          "The app is organised around four honest views of money: a budget that maps to the card's colour state, a spending diary, net savings over time, and a view that hunts inefficiencies — the recurring costs that don't pull their weight.",
        ],
        image: {
          src: "/work/cardo/budget.png",
          alt: "Cardo budget view on iPhone",
          aspect: "9/16",
          fit: "contain",
        light: true,
        },
      },
      {
        heading: "Outcome",
        body: [
          "A budgeting system that moves feedback from the monthly statement to the moment of payment.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/cardo/diary.png",
        alt: "Cardo spending diary on iPhone",
        aspect: "9/16",
        fit: "contain",
        light: true,
      },
      {
        src: "/work/cardo/net-savings.png",
        alt: "Cardo net savings view on iPhone",
        aspect: "9/16",
        fit: "contain",
        light: true,
      },
      {
        src: "/work/cardo/inefficiencies.png",
        alt: "Cardo inefficiencies view on iPhone",
        aspect: "9/16",
        fit: "contain",
        light: true,
      },
    ],
  },
  {
    slug: "cuttleswish",
    title: "Cuttlesw!sh",
    impact:
      "An automatic pot stirrer that takes the repetitive strain out of cooking for elderly hands.",
    tags: [
      "Industrial Design",
      "Design Engineering",
      "CAD",
      "Electronics",
      "User Research",
    ],
    cover: {
      src: "/work/cuttleswish/hero.jpg",
      alt: "Cuttlesw!sh automatic pot stirrer",
    },
    sections: [
      {
        heading: "Challenge",
        body: [
          "Stirring is one of cooking's quiet strains — long, repetitive and hard on older wrists and shoulders. Giving it up often means giving up dishes people have cooked their whole lives.",
        ],
      },
      {
        heading: "Context",
        body: [
          "Cuttlesw!sh is an automatic pot stirrer built for elderly cooks. Mouldable silicone attachments fit the pots people already own, and an LED ring with a rotary encoder keeps the interface physical, legible and familiar — no screens in a steamy kitchen.",
        ],
      },
      {
        heading: "My role",
        body: [
          "Industrial design and design engineering across the project: user research with elderly cooks, CAD, and the electronics behind the LED-ring interface.",
        ],
      },
      {
        heading: "CAD / technical development",
        body: [
          "The assembly balances a food-safe, cleanable build with the torque needed to stir real meals — and packaging engineered to survive the journey to the kitchen.",
        ],
        image: {
          src: "/work/cuttleswish/assembly.png",
          alt: "Cuttlesw!sh key assembly features render",
          aspect: "3/4",
        },
      },
      {
        heading: "Outcome",
        body: [
          "A kitchen tool that takes over the repetitive work while the cook stays in charge of the dish.",
        ],
        image: {
          src: "/work/cuttleswish/final-render.png",
          alt: "Cuttlesw!sh final render",
        },
      },
    ],
    gallery: [
      {
        src: "/work/cuttleswish/exploded-packaging.png",
        alt: "Cuttlesw!sh exploded packaging render",
        aspect: "3/4",
      },
      { src: "/work/cuttleswish/render.jpg", alt: "Cuttlesw!sh render", aspect: "8/3" },
    ],
  },
  {
    slug: "brushed-lips",
    title: "Brushed Lips",
    impact:
      "A refillable aluminium lipstick system that closes the loop on single-use cosmetic packaging.",
    tags: ["Sustainable Design", "Industrial Design", "Packaging", "CAD"],
    cover: {
      src: "/work/brushed-lips/hero.jpg",
      alt: "Brushed Lips packaging render",
    },
    sections: [
      {
        heading: "Challenge",
        body: [
          "Lipstick packaging is designed to be thrown away — a single-use shell around a product people repurchase for years.",
        ],
      },
      {
        heading: "Context",
        body: [
          "Brushed Lips is a refillable, recyclable aluminium lipstick system: buy the case once, replace only the refill, and return the empties through a closed-loop model.",
        ],
      },
      {
        heading: "CAD / technical development",
        body: [
          "The case is machined aluminium, engineered so the refill seats cleanly and the mechanism survives years of daily use — durability is what makes the refill model honest.",
        ],
        image: {
          src: "/work/brushed-lips/exploded.png",
          alt: "Brushed Lips exploded CAD view",
          aspect: "16/9",
        },
      },
      {
        heading: "Outcome",
        body: [
          "A closed-loop refill system that cuts single-use packaging without asking people to change how they buy.",
        ],
        image: {
          src: "/work/brushed-lips/packaging-15.png",
          alt: "Brushed Lips packaging render",
          aspect: "16/9",
        },
      },
    ],
    gallery: [
      {
        src: "/work/brushed-lips/packaging-front.png",
        alt: "Brushed Lips packaging, front view",
        aspect: "16/9",
      },
      {
        src: "/work/brushed-lips/infographic.png",
        alt: "Brushed Lips closed-loop system infographic",
      },
    ],
  },
  {
    slug: "verdure",
    title: "Verdure",
    impact:
      "An outdoor plant display, designed and built end-to-end for A-Level product design.",
    tags: ["Product Design", "CAD", "Prototyping"],
    cover: { src: "/work/verdure/hero.jpg", alt: "Verdure outdoor plant display" },
    sections: [
      {
        heading: "Context",
        body: [
          "Verdure is an outdoor plant display designed and built as an A-Level product design project — an early, complete pass through the whole arc: research, sketching, CAD, and making the real thing.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "A finished, working display — and the project that made designing and building products feel like the job worth doing.",
        ],
      },
    ],
    gallery: [
      { src: "/work/verdure/c1.jpg", alt: "Verdure outdoor plant display, built" },
      { src: "/work/verdure/c2.jpg", alt: "Verdure display detail" },
      { src: "/work/verdure/c3.jpg", alt: "Verdure display in place" },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
