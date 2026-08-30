# Sinai Rhodes — portfolio

Personal portfolio site for Sinai Rhodes, a Design Engineering student at
Imperial College London. Positioned as **Design Engineer | Product Specialist**:
work spanning product and industrial design, UX/UI, research, CAD and
prototyping, computational design and product strategy.

The site is a single scroll-driven homepage (scripture intro → hero → about →
roles and projects → skills → contact) plus a `/work` index, where each project
opens its source document as a paged slideshow rendered from the real PDF.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4, tokens in `app/globals.css` |
| Scroll | Lenis (smooth scroll), GSAP + ScrollTrigger (pinned and scrubbed sequences) |
| Motion | Anime.js (text splitting and scrubbed reveals), Motion / Framer Motion |
| Carousel | Embla Carousel |
| Documents | PDF.js (`pdfjs-dist`) renders deck pages as vector, not images |

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:3000>. Other scripts: `npm run build` (production
build), `npm start` (serve the build), `npm run lint`.

Requires Node 20 or newer.

## Structure

```
app/            Routes. page.tsx is the homepage; work/[slug]/deck is the PDF viewer.
components/     One file per section or behaviour (Hero, About, Skills, CaseDeck…).
lib/            Generated and hand-written data: project metadata, deck indexes.
public/         Served assets — case PDFs, logos, project imagery, fonts.
raw-assets/     Source material. Never served; the scripts below derive public/ from it.
scripts/        Asset pipeline (see below).
```

Two `lib/` files are generated — `case-decks.ts` and `work-images.ts` — and say
so at the top. Note that the image flags in `work-images.ts` (`light`, `padded`,
`bordered`…) are currently hand-maintained despite that header, so re-running
`build-work-assets.sh` will drop them.

## Asset pipeline

Source documents and images live in `raw-assets/` and are processed into
`public/`. Re-run the relevant script after replacing a source file:

```bash
python3 scripts/compress-case-pdfs.py      # raw PDFs -> public/case-pdf/*.pdf
python3 scripts/extract-deck-titles.py     # rebuild lib/case-decks.ts (page index)
python3 scripts/normalise-logo.py <png>    # re-canvas a logo to the set's 80% fill
./scripts/sync-cv.sh                       # publish the CV to public/cv.pdf
```

`extract-deck-titles.py` detects a section title per page and then applies the
hand-authored labels in its `MANUAL_RANGES` map on top, so edits there survive a
rebuild.

## Project brief

`CLAUDE.md` in this directory is the standing brief — positioning, tone, design
tokens, type scale, section-by-section intent and motion rules. Read it before
making design decisions, and keep it current when the direction changes. It is
also the context future Claude Code sessions load first.
