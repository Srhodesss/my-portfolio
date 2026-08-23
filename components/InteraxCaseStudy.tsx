import Image from "next/image";
import Link from "next/link";
import StorySection from "@/components/case-study/StorySection";
import DoubleDiamond from "@/components/case-study/DoubleDiamond";
import { getNextProject } from "@/lib/projects";

/* ---- content (from interax-portfolio.pdf) --------------------------- */

const DEFINITION = [
  { k: "Who", v: "ADHD students aged 14 and above — old enough to reflect on their own focus." },
  { k: "What", v: "Integrated educational technologies and non-pharmacological interventions that support ADHD students." },
  { k: "Where", v: "UK educational institutions, delivered through the centralised NHS — with potential for global adoption." },
  { k: "Why", v: "To give ADHD students personalised learning support adapted to their specific needs." },
  { k: "When", v: "Anticipated fully operational by 2045." },
  { k: "How", v: "Electrical Muscle Stimulation (EMS) and ultrasound skin haptics, combined with machine learning that analyses biometric data to monitor focus." },
];

const TRENDS = [
  {
    title: "Trends in ADHD treatment",
    points: [
      "Diagnoses and prescriptions for ADHD medication have risen over the past two decades.",
      "Interventions to reduce disruptive behaviour have been introduced — self-regulating methods are found most effective.",
      "Newer options such as neurofeedback have emerged, but their effectiveness is not yet proven.",
    ],
  },
  {
    title: "Current limiting factors",
    points: [
      "Teacher recruitment and retention challenges have limited schools' ability to support ADHD students.",
      "Budget strain has held schools back; the impact of a recent £1bn funding boost remains to be seen.",
      "SEND products require multiple approvals, and the technology enablers have only recently matured.",
    ],
  },
  {
    title: "Focus & ADHD",
    points: [
      "The Association for Behaviour Analysis International found fidget devices improved on-task behaviour, with immediate performance gains on use.",
      "MRI research (University of Auckland & Mātai) showed fidget devices could improve activation of ADHD students' decision-making.",
    ],
  },
];

const FIDGET_ISSUES = [
  { title: "Distraction to others", body: "Fidget devices have been criticised for distracting other students, leading some schools to ban them outright." },
  { title: "Lack of evidence", body: "Research on fidget devices improving classroom focus remains inconclusive — but ML and biometrics now make a research-backed solution possible." },
  { title: "Lack of feedback", body: "Current devices are low-cost 'toys' that give the user no feedback. The rise of smart wearables suggests a better model." },
];

const METHODS = [
  { title: "Reliance on medication", body: "Stimulants like methylphenidate and amphetamines remain the cornerstone of management — but medication doesn't address underlying cognitive or behavioural drivers, and doesn't work uniformly across individuals." },
  { title: "Inadequate behavioural intervention", body: "Behavioural interventions are recommended alongside medication, but their implementation and quality are inconsistent across UK schools." },
  { title: "Insufficient learning adjustments", body: "Adjustments like extra time help, but rarely accommodate the diverse needs of ADHD students — technology can offer more personalised learning." },
];

const PILLARS = [
  { title: "Support", body: "Positive reinforcement over criticism. Criticism — however constructive — can trigger Rejection Sensitive Dysphoria (RSD), causing emotional dysregulation and a vicious cycle of 'poor behaviour' and discipline." },
  { title: "Movement", body: "Give students a valid reason to move — hand a restless student a classroom task that gets them out of their seat. Discreet, quiet fidget tools are specifically encouraged." },
  { title: "Distractions", body: "Seat students away from doors and windows, between calm high-achievers. Break tasks into small chunks so a student who loses focus can rejoin without falling behind." },
];

const NEEDS = [
  { title: "Organisation", issue: "Students with ADHD often struggle to maintain structure in daily routines, leading to poor organisation.", solution: "Consistent schedules and simple, portable tools that act as reminders or cues to stay on track." },
  { title: "Transitions", issue: "Transitions between activities can cause anxiety and disrupt focus.", solution: "Advance notice of changes and familiar objects to ease the shift, promoting smoother transitions." },
  { title: "Fidgeting", issue: "Physical restlessness can hinder concentration and disrupt classroom activities.", solution: "Encourage discreet, tactile items that allow for controlled physical activity while maintaining focus." },
  { title: "Focus", issue: "Students may experience fluctuating moods and difficulty maintaining attention during lessons.", solution: "Calming techniques and focus aids that give subtle sensory feedback to regulate mood and sustain attention." },
  { title: "Rewards", issue: "Maintaining motivation can be challenging, leading to inconsistent performance.", solution: "Personalised reward systems with interactive elements that reinforce positive behaviours." },
];

const HMW = [
  "How might we use haptic feedback to provide subtle, real-time sensory cues that help students sustain focus without being distracting?",
  "How might we design a wearable that allows controlled, non-disruptive fidgeting while reinforcing focus through tactile feedback?",
  "How might we create a haptic-assisted transition system that gives calming, structured guidance during shifts between activities?",
];

const REQUIREMENTS = [
  { title: "Non-disruptive", body: "ADHD students already battle cognitive overload; a subtle tool keeps them engaged without adding distractions." },
  { title: "Adaptive", body: "The system learns from the user's focus patterns, biometric data and fidget preferences to personalise its responses." },
  { title: "Sustain focus", body: "Feelings of being overwhelmed lead to disengagement — real-time support should help keep students on track." },
];

const CONCEPT_ISSUES = [
  "Inadequate battery storage to power the device.",
  "Unclear design of how the tactile sensations would be felt.",
  "Incorrect electrode placement, crucial for effective muscle stimulation.",
  "Missing safety measures and regulatory-compliance considerations.",
];

const SLEEVE = [
  { part: "Ultrasound speaker", body: "Piezoelectric ceramics with silicone-coated rims to prevent skin irritation during prolonged wear." },
  { part: "EMS electrodes", body: "Hydrogel-coated conductive fabric — excellent conductivity and adhesion, refreshable with a simple saline solution." },
  { part: "LED status indicator", body: "A surface-mount LED in polycarbonate for soft illumination, signalling power status and mode changes." },
  { part: "Woven conductive lining", body: "Breathable silver-coated nylon: a comfortable layer that aids conductivity and wicks sweat." },
  { part: "Protective mesh", body: "3D-printed TPU exoskeleton — lightweight and durable, maintaining airflow and flexibility." },
  { part: "Silicone mounting rings", body: "Medical-grade silicone to secure the device comfortably to the arm." },
];

/* Direct proto URL for the fallback link; the embed host (embed.figma.com)
   is the one Figma actually permits framing — the raw proto URL is blocked
   by Figma's frame-ancestors policy and would only ever show the fallback. */
const FIGMA_URL =
  "https://www.figma.com/proto/PmwFyUaUryU0T8ocQ5CZgA/Interax-UI?node-id=8-68&starting-point-node-id=8%3A68&locale=en";
const FIGMA_EMBED =
  "https://embed.figma.com/proto/PmwFyUaUryU0T8ocQ5CZgA/Interax-UI?node-id=8-68&starting-point-node-id=8%3A68&embed-host=sinai-rhodes";

export default function InteraxCaseStudy() {
  const next = getNextProject("interax");

  return (
    <article>
      {/* Hero */}
      <header className="px-6 pt-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <Link
              href="/work"
              className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
            >
              ← Projects
            </Link>
            <span
              className="rounded-full border border-accent/50 px-3 py-1 text-overline font-medium uppercase tracking-[0.08em] text-accent"
              title="Year 3 of the MEng — DESE60001 Design Engineering Futures"
            >
              DE3
            </span>
          </div>

          <h1
            className="mt-14 font-semibold leading-[0.95] tracking-[-0.03em]"
            style={{ fontSize: "clamp(56px, 11vw, 168px)" }}
          >
            Interax<span className="font-display font-normal italic text-accent">.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-body-l text-text-secondary">
            A biometric wearable and companion app that lets ADHD students see —
            and shape — their focus, through controlled haptic fidgeting.
          </p>
          <p className="mt-6 text-overline uppercase tracking-[0.05em] text-text-muted">
            DESE60001 Design Engineering Futures&ensp;·&ensp;UX Research · UI Design ·
            Wearable · Data Visualisation
          </p>

          <div
            data-reveal
            className="relative mt-12 aspect-[16/10] overflow-hidden rounded-lg border border-border bg-black md:mt-16"
          >
            <Image
              src="/work/interax/hero.png"
              alt="Interax sleeve and companion app"
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </header>

      {/* 1 — Futures Scenario */}
      <StorySection eyebrow="Futures Scenario" title="Designing for 2055">
        <blockquote
          data-reveal
          className="max-w-4xl font-display text-2xl italic leading-snug md:text-[34px]"
        >
          “By 2055, NHS advancements will enable earlier and more accurate ADHD
          diagnoses. Alongside medication, enhanced diagnostic tools and digital
          health technologies will promote self-regulation as a key component of
          treatment, empowering ADHD patients to actively manage their symptoms
          more effectively.”
        </blockquote>

        <div className="cs-stagger mt-14 grid gap-6 sm:grid-cols-2 md:gap-8">
          {DEFINITION.map((d) => (
            <div
              key={d.k}
              data-reveal
              className="rounded-lg border border-border p-6"
            >
              <p className="text-overline uppercase tracking-[0.08em] text-accent">
                {d.k}
              </p>
              <p className="mt-3 text-body-s leading-relaxed text-text-secondary">
                {d.v}
              </p>
            </div>
          ))}
        </div>
      </StorySection>

      {/* 2 — Contextual Trends (interlude) */}
      <StorySection
        tone="interlude"
        eyebrow="Research · 01"
        title="Contextual trends"
        intro="Diagnoses are rising while support is stretched thin — and the tools students are given fall short."
      >
        <div className="cs-stagger grid gap-8 md:grid-cols-2 lg:gap-10">
          {TRENDS.map((col) => (
            <div key={col.title} data-reveal className="cs-il-card p-6">
              <span className="cs-il-tag">{col.title}</span>
              <ul className="mt-5 space-y-4">
                {col.points.map((p) => (
                  <li key={p.slice(0, 24)} className="text-body-s leading-relaxed">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-14 text-overline font-semibold uppercase tracking-[0.05em]">
          Current issues with fidget devices
        </p>
        <div className="cs-stagger mt-6 grid gap-8 md:grid-cols-2 lg:gap-10">
          {FIDGET_ISSUES.map((f) => (
            <div key={f.title} data-reveal className="cs-il-card-navy p-6">
              <span className="cs-il-tag">{f.title}</span>
              <p className="mt-4 text-body-s leading-relaxed text-white/85">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </StorySection>

      {/* 3 — Forecasting ADHD (interlude) */}
      <StorySection
        tone="interlude"
        eyebrow="Research · 02"
        title="Forecasting ADHD"
        intro="ADHD involves neurobiological differences — including altered serotonin levels that affect mood regulation, decision-making and impulse control. Today's management leans heavily on medication that doesn't address those underlying drivers, and doesn't work uniformly across individuals."
      >
        <div className="cs-stagger grid gap-8 md:grid-cols-2 lg:gap-10">
          {METHODS.map((m) => (
            <div key={m.title} data-reveal className="cs-il-card p-6">
              <div className="cs-il-rule w-10" />
              <h3 className="mt-4 text-body-l font-semibold">{m.title}</h3>
              <p className="mt-3 text-body-s leading-relaxed opacity-80">
                {m.body}
              </p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-10 max-w-3xl text-body-s leading-relaxed opacity-70">
          Behavioural interventions and learning adjustments are recommended, but
          inconsistently implemented across UK schools — leaving room for a
          personalised, technology-led approach.
        </p>
      </StorySection>

      {/* 4 — Teaching for ADHD (interlude) */}
      <StorySection
        tone="interlude"
        eyebrow="Research · 03"
        title="Teaching for ADHD"
        intro="Across academic sources and an interview with Angus Nicholson — a teacher of 20+ years — three pillars emerged for helping ADHD students focus and thrive."
      >
        <div className="cs-stagger grid gap-8 md:grid-cols-2 lg:gap-10">
          {PILLARS.map((p, i) => (
            <div key={p.title} data-reveal className="cs-il-card p-6">
              <span className="cs-il-tag">{`0${i + 1}`}</span>
              <h3 className="mt-4 text-body-l font-semibold">{p.title}</h3>
              <p className="mt-3 text-body-s leading-relaxed opacity-80">
                {p.body}
              </p>
            </div>
          ))}
        </div>
        <blockquote
          data-reveal
          className="mt-12 max-w-4xl border-l-2 pl-6 font-display text-2xl italic leading-snug md:text-[30px]"
          style={{ borderColor: "var(--il-lime)" }}
        >
          “We try and break down the tasks, so keeping people focused is good —
          and we also have lots of movement around.”
          <cite className="mt-4 block text-body-s not-italic opacity-60">
            Angus Nicholson · teacher, 20+ years
          </cite>
        </blockquote>
      </StorySection>

      {/* 5 — User Needs */}
      <StorySection
        eyebrow="Insight"
        title="User needs"
        intro="Five needs surfaced from research and interviews — each an issue, each with a design response."
      >
        <div className="cs-stagger grid gap-6 md:grid-cols-2 md:gap-8">
          {NEEDS.map((n) => (
            <div key={n.title} data-reveal className="rounded-lg border border-border p-6">
              <h3 className="text-body-l font-semibold">{n.title}</h3>
              <p className="mt-4 text-body-s leading-relaxed text-text-secondary">
                <span className="text-accent">Issue&nbsp;·&nbsp;</span>
                {n.issue}
              </p>
              <p className="mt-3 text-body-s leading-relaxed text-text-secondary">
                <span className="text-accent">Solution&nbsp;·&nbsp;</span>
                {n.solution}
              </p>
            </div>
          ))}
        </div>
        <blockquote
          data-reveal
          className="mt-12 max-w-3xl border-l-2 border-accent pl-6 font-display text-2xl italic leading-snug md:text-[30px]"
        >
          “I really struggle to focus in class, but I want to improve. At the
          moment I don&rsquo;t feel like I control my focus — it controls me.”
          <cite className="mt-4 block text-body-s not-italic text-text-muted">
            Ben, 18 · student with ADHD
          </cite>
        </blockquote>
      </StorySection>

      {/* 6 — Design Requirements */}
      <StorySection
        eyebrow="Definition"
        title="Design requirements"
        intro="Three 'How Might We' questions turned the research into direction."
      >
        <div className="space-y-4">
          {HMW.map((q, i) => (
            <div
              key={i}
              data-reveal
              className="flex gap-5 rounded-lg border border-border p-6"
            >
              <span className="font-display text-3xl italic text-accent">
                {`0${i + 1}`}
              </span>
              <p className="text-body-m leading-relaxed text-text-secondary">{q}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-overline font-semibold uppercase tracking-[0.05em] text-text-muted">
          Three key requirements
        </p>
        <div className="cs-stagger mt-6 grid gap-8 md:grid-cols-2 lg:gap-10">
          {REQUIREMENTS.map((r) => (
            <div key={r.title} data-reveal className="rounded-lg border border-border p-6">
              <div className="h-px w-10 bg-accent" />
              <h3 className="mt-4 text-body-l font-semibold">{r.title}</h3>
              <p className="mt-3 text-body-s leading-relaxed text-text-secondary">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </StorySection>

      {/* 7 — Project Development Plan */}
      <StorySection
        eyebrow="Process"
        title="Project development plan"
        intro="The Double Diamond structured the work across four phases — Discover, Define, Develop, Deliver — iterating from research through to a validated concept."
      >
        <DoubleDiamond />
      </StorySection>

      {/* 8 — Concept Overview */}
      <StorySection
        eyebrow="Concept"
        title="Concept overview"
        intro="The initial concept was a wearable bracelet with two skin-contact electrodes, using EMS to simulate the tactile sensation of a physical fidget device. Four issues drove the refinement."
      >
        <div className="cs-stagger grid gap-6 sm:grid-cols-2 md:gap-8">
          {CONCEPT_ISSUES.map((issue, i) => (
            <div key={i} data-reveal className="rounded-lg border border-border p-6">
              <p className="font-display text-3xl italic text-accent">{`0${i + 1}`}</p>
              <p className="mt-3 text-body-s leading-relaxed text-text-secondary">
                {issue}
              </p>
            </div>
          ))}
        </div>
      </StorySection>

      {/* 9 — Concept Development */}
      <StorySection
        eyebrow="Development"
        title="Concept development"
        intro="Refined electrode research identified the muscles that control the hand — thenar, hypothenar, lumbricals and interossei — validated against a published paper on increasing EMS dexterity through back-of-hand actuation. That fed a detailed sleeve design."
      >
        <p className="text-overline font-semibold uppercase tracking-[0.05em] text-text-muted">
          The Interax sleeve
        </p>
        <div className="cs-stagger mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
          {SLEEVE.map((s) => (
            <div key={s.part} data-reveal className="rounded-lg border border-border p-6">
              <h3 className="text-body-m font-semibold">{s.part}</h3>
              <p className="mt-2 text-body-s leading-relaxed text-text-secondary">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </StorySection>

      {/* 10 — Final Concept */}
      <StorySection eyebrow="Outcome" title="Final concept">
        <div
          data-reveal
          className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-black"
        >
          <Image
            src="/work/interax/final-concept.jpg"
            alt="Interax final concept — sleeve and app"
            fill
            sizes="(min-width: 1024px) 1152px, 100vw"
            className="object-cover"
          />
        </div>
      </StorySection>

      {/* 11 — Key Pages */}
      <StorySection
        eyebrow="Interface"
        title="Key pages"
        intro="The app connects to the sleeve — set up a focus session, watch real-time biometrics, and reflect afterwards."
      >
        <div
          data-reveal
          className="relative aspect-[2200/1498] overflow-hidden rounded-lg border border-border bg-black"
        >
          <Image
            src="/work/interax/key-pages.png"
            alt="Interax app — four key pages"
            fill
            sizes="(min-width: 1024px) 1152px, 100vw"
            className="object-contain"
          />
        </div>
      </StorySection>

      {/* 12 — Prototype & Demo */}
      <StorySection
        eyebrow="Prototype"
        title="Prototype & demo"
        intro="A working demo of the sleeve, and the interactive Figma prototype of the app."
      >
        <div data-reveal className="flex justify-center">
          <div className="cs-embed" style={{ width: 504, maxWidth: "100%" }}>
            <iframe
              src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7309574327899705344?compact=1"
              height={399}
              width={504}
              title="Interax prototype — LinkedIn post"
              allowFullScreen
              style={{ maxWidth: "100%" }}
            />
          </div>
        </div>

        <div data-reveal className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
              Interactive prototype
            </p>
            <a
              href={FIGMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-overline uppercase tracking-[0.05em] text-text-muted transition-colors hover:text-accent"
            >
              Open prototype ↗
            </a>
          </div>
          <div className="cs-embed">
            <iframe
              src={FIGMA_EMBED}
              className="h-[600px] w-full md:h-[820px]"
              title="Interax UI — Figma prototype"
              allowFullScreen
            />
          </div>
        </div>
      </StorySection>

      {/* Next */}
      <footer className="border-t border-border px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
            Next project
          </p>
          <Link
            href={`/work/${next.slug}`}
            className="group mt-3 inline-flex items-baseline gap-3"
          >
            <span className="text-heading font-semibold tracking-tight md:text-[40px]">
              {next.title}
            </span>
            <span
              aria-hidden
              className="text-accent transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </footer>
    </article>
  );
}
