# CLAUDE.md — Sinai Rhodes Portfolio Site

This file is the standing brief for this project. Read it fully before acting. Treat it as creative direction, not a rigid checklist. The feeling and positioning matter more than ticking off every feature.

---

## 1. What this is

A personal portfolio website for Sinai Rhodes, a Design Engineering student at Imperial College London. It should read as a personal brand system, not a template. Positioning:

**Design Engineer | Product Specialist**

Seen first as a design engineer, but someone who moves across product design, industrial design, UX/UI, user research, data analysis, CAD and prototyping, computational design, product strategy and product management. The audience is design consultancies, big tech product teams, hardware startups and innovation teams.

Core identity: **Ability × Craft × Intention**

It should feel: premium, tactile, intentional, engineered, disciplined, warm but refined, technical but human, slightly experimental but never gimmicky. Faith-led, but handled with restraint. Never a Christian poster or motivational-quote page. Faith comes through tone, atmosphere and purpose, not imagery.

The line to hold in mind: ancient foundation meets modern engineering.

---

## 2. Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS for styling, driven by the design tokens below
- Lenis for smooth scrolling
- GSAP + ScrollTrigger for scroll-driven motion (loader, reveals, scrubbed sequences)
- Framer Motion for component-level transitions
- `@google/model-viewer` for any live 3D (.glb models), loaded lazily
- Deploy target: Vercel, with a custom domain later

Do not add libraries beyond these without flagging why. Keep the dependency list lean.

---

## 3. Build in phases. Get each phase running before the next.

Do not attempt the whole site in one pass. After each phase, make sure `npm run dev` runs cleanly and the page renders, then stop and summarise what changed before continuing.

1. **Scaffold + tokens + hero.** Next.js project, Tailwind, design tokens wired up, fonts loaded, Lenis smooth scroll, and a working hero section. Nothing else.
2. **Loader + scripture intro.** The opening sequence (see section 6), fading into the hero.
3. **Featured work + case study template.** The work grid and one reusable case study page layout.
4. **About + capabilities + footer + nav.**
5. **3D and video polish.** model-viewer embeds, video handling, hover interactions.
6. **Responsive, accessibility, performance, deploy.**

---

## 4. Design tokens

```
--bg:            #0A0A0A   /* deep charcoal background */
--text:          #FFFFFF   /* primary text */
--text-secondary:#CCCCCC
--text-muted:    #888888
--accent:        #FF6B35   /* orange, used sparingly as a signal */
--scripture:     #F3E8B3   /* faint warm highlight for scripture only */
--border:        #1A1A1A
```

Orange is a signal, not decoration. Use it for at most one or two accents per view (for example a short underline under RHODES, or a link hover). Avoid bright gradients and clutter.

---

## 5. Typography

Keep the font system easy to swap. Define fonts as CSS variables so a change is one line.

- **Primary sans:** clean, technical, modern. Default to General Sans or Inter for now; the choice must be swappable. Candidates: Satoshi, Neue Montreal, General Sans, Inter, Mona Sans.
- **Scripture face:** authored, human, legible. Handwritten or an elegant italic serif, not wedding calligraphy. Something marker-like or a refined italic serif.
- **Hebrew background face:** a Hebrew style used only as faint background texture. It must never compete with the main verse.

Type scale (desktop, scale down on mobile with clamp):
```
Display (name):   clamp(72px, 10vw, 148px), weight 800, line-height 0.9, letter-spacing -0.03em
Section word:     clamp(64px, 9vw, 160px)  /* e.g. a large single word like "Craft." */
Heading:          32px
Body L:           24px
Body M:           20px
Body S:           16px
Overline/caption: 14px, letter-spacing 0.05em
```

---

## 6. Homepage structure

### Scripture intro (opening moment)
Purpose: establish faith, craft and intention as the foundation.

- Dark, near-black screen.
- Faint Hebrew scripture lines across the background as layered horizontal texture, around 2 to 5% opacity. Felt more than read. Ancient and atmospheric.
- The Exodus 31 verse written across the middle in the scripture face:
  "I have filled him with the Spirit of God, with ability and intelligence, with knowledge and all craftsmanship, to devise artistic designs." (Exodus 31:1 to 2)
- The verse should feel written onto the screen: a calm, intentional handwriting reveal. No pulsing, no glow, no religious effects.
- After it finishes, it fades or dissolves smoothly into the hero. No click gate.
- Keep the whole intro tight and cinematic, not slow. Total motion around 3 to 4 seconds.

Implementation choice for the intro: prefer a native build over a video where possible. Recommended approach: render the verse as an SVG stroke path and animate `stroke-dashoffset` for a true drawn-on effect, with the faint Hebrew layer as a separate low-opacity element. If a clean single-stroke SVG of the verse is not available, fall back to a per-word masked fade in the scripture font. Sinai may provide a WebM of an After Effects version; if used, serve it optimised with a poster image and a static reduced-motion fallback. Always provide a reduced-motion path that skips straight to the hero.

### Hero
```
Design Engineer | Product Specialist

SINAI
RHODES

Engineering products that move people forward.
```
Name large, dominant, confident, centred in the viewport with strong whitespace. Optional short orange underline drawing under RHODES. Motion: gentle fade and slight upward reveal, staggered. The site is desktop first; the hero must stay centred and legible on mobile with the name scaling down cleanly.

### Featured work
A refined grid of project cards. Each card: large image or render, project title, discipline tags, a one-line impact statement, a subtle hover interaction, and a link to the case study.

Five projects, in this order unless a stronger order emerges:

1. **Interax** — A biometric wearable and companion app that helps ADHD students track focus using heart rate, respiratory rate and EDA. Tags: UX Research, UI Design, Wearable, Data Visualisation.
2. **Cardo** — An electrochromic budgeting card and app for young professionals. The card changes colour to reflect budget status; the app surfaces spending, savings and inefficiencies. Tags: Product Design, Fintech, UX/UI, CAD. Idea worth using: make the on-page card actually shift colour on scroll or hover, since that is what the product does.
3. **AID (Sirho Frames)** — A rollerblading frame project. NEEDS CONTENT: copy, images and any CAD from Sinai's folder. Placeholder tags: Industrial Design, Design Engineering, CAD, Prototyping. Use clearly marked placeholders until real material is supplied.
4. **Cuttleswish (IDE)** — An automatic pot stirrer for elderly cooks, with mouldable silicone attachments that fit different pots and an LED-ring and rotary-encoder interface, built to reduce strain in the kitchen. Tags: Industrial Design, Design Engineering, CAD, Electronics, User Research.
5. **Brushed Lips (SDE)** — A refillable, recyclable aluminium lipstick system designed to cut single-use cosmetic packaging through a closed-loop refill model. Tags: Sustainable Design, Industrial Design, Packaging, CAD.

Do not include any NBCUniversal or Hayu work.

### About
Personal, thoughtful, genuine, not corporate. Faith included naturally, not headlined. Seed copy, keep close to this wording:

"I'm a creative problem solver, rooted in faith, making things that excite and help the people around me. My work sits between hardware, software and human behaviour, combining research, prototyping, CAD, UX, data and product thinking to build things that move people forward."

"My faith shapes how I approach craft: with intention, stewardship and a desire to build things that serve people well."

Rollerblading and gym culture are part of his identity through discipline and iteration, but must not dominate.

### Capabilities
Show range without looking unfocused. The point is the ability to connect insight, engineering, design and product value, not random multidisciplinary work. Optional framing lines: from insight to system; from prototype to product; from behaviour to experience; from craft to impact.

Capabilities: Design Engineering, Product Design, Industrial Design, UX/UI, User Research, CAD and Prototyping, Computational Design, Data Analysis, Workflow Optimisation, Product Strategy, Product Management, Systems Thinking.

### Experience timeline
Omit for now. Do not invent entries. Only add later if Sinai confirms real, verified roles.

### Footer
Quiet and minimal. Text: "Designed with purpose." Links: LinkedIn, Email (sinai.r@icloud.com), CV, Portfolio PDF. Contact number is +44 7432 491292.

### Navigation
Minimal: Work, About, Capabilities, Contact. Appears after the intro and hero load. Understated.

---

## 7. Case study page template

Reusable layout, highly visual, easy to follow:
Project hero, Challenge, Context, My role, Process, Research, Prototyping, CAD / technical development, Testing / iteration, Outcome, Reflection.

Not every project fills every section. AID (Sirho Frames) can have a more custom, tactile treatment (subtle horizontal motion, technical diagrams, material callouts, a live 3D frame if a .glb is available). Use only what improves it.

---

## 8. Motion rules

Restrained and purposeful. Smooth fade-ins, subtle upward text reveals, gentle transitions, an underline draw, subtle card hovers, scroll reveals with slight stagger. No bounce, no excessive parallax, no gaming-style or gimmicky animation. The intro and hero transition are the most memorable moments; everything else stays controlled.

---

## 9. Responsive and accessibility

Desktop first, mobile must be clean: name scales without overflow, scripture intro stays centred, Hebrew texture stays subtle, cards stack, nav simplifies. Maintain strong contrast. Respect `prefers-reduced-motion` everywhere (skip the intro animation, drop parallax and staggers). Use semantic HTML. Do not rely on animation alone to convey anything.

---

## 10. Assets

Curated, web-ready assets live in `raw-assets/`, grouped by project. Images should be compressed and no larger than needed (longest edge around 2000px). 3D models are `.glb`, decimated to a few MB each. Video is compressed MP4 or WebM. If given a folder of oversized images, offer to write a batch-optimisation script rather than committing large files. Use clearly labelled placeholders anywhere real material is missing, especially for AID.
