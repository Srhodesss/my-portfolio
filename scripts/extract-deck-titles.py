#!/usr/bin/env python3
"""Pull a section title for each page of the deck PDFs using pdftotext,
and fold them into lib/case-decks.ts so the slideshow progress bar can
label real content sections instead of bare page numbers.

Heuristic: the first short, title-like line on each page. Pages with no
plausible heading fall back to null (the UI shows the page number).

Usage: python3 scripts/extract-deck-titles.py
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TS = ROOT / "lib" / "case-decks.ts"

SOURCES = {
    "interax": "raw-assets/interax/web-ready-assets/project-work/interax-portfolio.pdf",
    "cardo": "raw-assets/cardo/project-work/Cardo - Business Report.pdf",
    "sirho-frames": "raw-assets/aid/project-work/Rhodes_Sinai_Portfolio.pdf",
    "cuttleswish": "raw-assets/cuttleswish/project-work/IDE_Group4_Portfolio.pdf",
    "brushed-lips": "raw-assets/brushed-lips/project-work/SDE.pdf",
    "verdure": "raw-assets/verdure/project-work/A Level Project - Verdure.pdf",
}

# Lines that are page furniture rather than section titles.
NOISE = re.compile(
    r"^(page\s*\d+|\d+|figure\s*\d+|fig\.?\s*\d+|contents|www\.|http)",
    re.I,
)

# Team documents carry a per-page author byline in the same type size as a
# heading, so the first "title-like" line on a page is sometimes just a
# name. Skipped from page 2 onward only: a cover page's title genuinely
# can be the author's name (Sirho Frames' portfolio opens on exactly
# that).
BYLINES = {
    "ashley yang",
    "gexing fang",
    "ruby kennedy",
    "sinai rhodes",
    "freddie nicholson",
    "emmanuel irechukwu",
    "liberty wright",
    "kaitai yang",
    "francesco",
    "alex",
}

# Some headings are split across lines by the layout, or set in a face
# whose runs pdftotext returns out of order, so the first title-like line
# is only a fragment. These are read off the page and pinned here, so a
# re-run of this script does not undo them.
# Hand-authored labels, supplied by Sinai, expressed as page RANGES.
#
# These are applied ON TOP of the detected index, not instead of it: an
# earlier version replaced the whole index with just these pages, which
# left every unlisted page unlabelled. Detection still names every page;
# these ranges then overwrite the pages they cover.
MANUAL_RANGES: dict[str, list[tuple[int, int, str]]] = {
    "interax": [
        (1, 1, "Interax"),
        (5, 5, "Teaching for ADHD"),
        (9, 11, "Technical Feasibility"),
        (19, 19, "Economics"),
    ],
    "sirho-frames": [
        (1, 1, "Sirho Frames"),
        (2, 2, "Deconstructed Diagram"),
        (3, 3, "Wheel Variations"),
        (4, 4, "Context"),
        (5, 5, "Initial Ideation"),
        (6, 6, "Prototyping"),
        (7, 7, "CAD Development"),
        (8, 8, "CMF"),
        (9, 9, "Final Design"),
        (10, 10, "References"),
    ],
    "cardo": [
        (1, 1, "Cardo"),
        (2, 3, "Contents"),
    ],
    "cuttleswish": [
        (1, 1, "Cuttlesw!sh"),
        (18, 19, "Final Renders"),
        (21, 22, "Orthographic Diagrams"),
        (23, 23, "References"),
    ],
    "brushed-lips": [
        (1, 1, "Brushed Lips"),
        (2, 2, "Problem"),
        (6, 6, "Innovation, Feasibility and Environmental Impact"),
        (7, 8, "Infrastructure System Design"),
        (11, 12, "Value System Design"),
        (13, 14, "Principle System Design"),
    ],
    "verdure": [
        (1, 1, "Verdure"),
        (2, 2, "Mindmapping"),
        (3, 4, "Client Profile"),
        (5, 6, "Product Moodboards"),
        (10, 10, "Ergonomics and Anthropometrics"),
        (11, 12, "Site Study"),
        (15, 16, "Product Requirements"),
        (18, 20, "Initial Sketches"),
        (21, 22, "Lofi Prototyping"),
        (23, 23, "Final Design Sketch"),
        (24, 27, "Product Development"),
        (28, 30, "Final Design"),
        (31, 33, "Orthographic Diagrams"),
        (35, 41, "Production Plan and Photo Diary"),
        (42, 42, "Hero"),
        (43, 43, "Final Product User Research"),
        (44, 47, "Testing against Specification"),
    ],
}


OVERRIDES: dict[str, dict[int, str]] = {
    # Verdure's specification pages open on a table header ("Title"), and
    # its materials pages run over, so the heuristic reads a column name
    # or a sub-item instead of the section.
    "verdure": {
        8: "Materials Research",
        16: "Product Requirements",
        45: "Sustainability Requirements",
    },
    "brushed-lips": {
        2: "PROBLEM OUTLINE",
        3: "FUTURE SCENARIO",
        12: "VALUE SYSTEM OVERVIEW",
        13: "PRINCIPLE SYSTEM DESIGN",
        14: "EXISTING PRINCIPLE SYSTEM",
    },
}


def landscape_pages(pdf: Path) -> list[int]:
    """1-based page numbers whose media box is wider than it is tall.

    A landscape page dropped into a slot sized for portrait pages is
    constrained by width, so it renders at roughly half the height of its
    neighbours. The viewer widens these slots instead.
    """
    out = subprocess.run(
        ["pdfinfo", "-f", "1", "-l", "9999", str(pdf)],
        capture_output=True, text=True,
    ).stdout
    wide: list[int] = []
    for m in re.finditer(r"^Page\s+(\d+)\s+size:\s+([\d.]+) x ([\d.]+)", out, re.M):
        if float(m.group(2)) > float(m.group(3)):
            wide.append(int(m.group(1)))
    return wide


def page_count(pdf: Path) -> int:
    out = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True).stdout
    m = re.search(r"^Pages:\s+(\d+)", out, re.M)
    return int(m.group(1)) if m else 0

def normalise(line: str) -> str:
    """Repair display-font glyph substitutions.

    Cuttleswish's heading face maps capital I to the exclamation glyph, so
    pdftotext yields "DETAIL DES!GN". Only rewrite an exclamation mark that
    sits between two letters — a genuine "Wow!" is untouched.
    """
    return re.sub(r"(?<=[A-Za-z])!(?=[A-Za-z])", "I", line)


SECTION_RE = re.compile(r"^(\d{1,2})[.)]?\s+([A-Z][A-Za-z&/'\u2019\- ]{2,44})$")


def section_for(pdf: Path, page: int) -> tuple[int, str] | None:
    """Top-level numbered heading starting on this page, e.g. "2 Market analysis".

    Only the first few lines are considered — a section heading opens its
    page. Pages carrying two or more such headings are contents pages, not
    section starts, so they are skipped.
    """
    out = subprocess.run(
        ["pdftotext", "-f", str(page), "-l", str(page), str(pdf), "-"],
        capture_output=True, text=True,
    ).stdout
    hits = []
    for raw in out.splitlines()[:14]:
        m = SECTION_RE.match(" ".join(raw.split()))
        if m:
            hits.append((int(m.group(1)), normalise(m.group(2).strip())))
    if len(hits) != 1:
        return None
    return hits[0]


def title_for(pdf: Path, page: int) -> str | None:
    out = subprocess.run(
        ["pdftotext", "-f", str(page), "-l", str(page), str(pdf), "-"],
        capture_output=True, text=True,
    ).stdout
    for raw in out.splitlines():
        line = " ".join(raw.split())
        if not line or NOISE.match(line):
            continue
        if page > 1 and line.strip().lower() in BYLINES:
            continue
        # A heading: short, starts like a heading (capital / digit-free),
        # and is not a wrapped body-copy fragment.
        if not (2 <= len(line) <= 46):
            continue
        if line.endswith((",", ";", ".")) and not line.isupper():
            continue
        if not line[0].isupper():
            continue  # lowercase start = mid-sentence wrap
        words = line.split()
        if len(words) > 6:
            continue
        # Reject lines that read as prose (common lowercase connectives).
        if any(w.lower() in {"is", "are", "was", "the", "of", "and", "as", "for", "through"}
               for w in words[1:]) and not line.isupper():
            continue
        return normalise(line)
    return None

def main() -> None:
    lines = [
        "// AUTO-GENERATED by scripts/build-case-decks.sh + extract-deck-titles.py",
        "// — do not edit by hand.",
        "export type CaseDeck = {",
        "  label: string;",
        "  pages: number;",
        "  /** Compressed source PDF, rendered on-site by PDF.js. */",
        "  pdf: string;",
        "  /** Rasterised page dir (thumbnails / fallback). */",
        "  dir: string;",
        "  /** Section title per page, where one could be detected. */",
        "  titles: (string | null)[];",
        "  /** Set only on the page where a new numbered section begins. */",
        "  sections: (string | null)[];",
        "  /** 1-based pages that are wider than they are tall. */",
        "  landscape: number[];",
        "};",
        "",
        "export const CASE_DECKS: Record<string, CaseDeck> = {",
    ]
    existing = TS.read_text() if TS.exists() else ""
    for slug, rel in SOURCES.items():
        pdf = ROOT / rel
        if not pdf.exists():
            print(f"SKIP {slug} — missing {rel}")
            continue
        m = re.search(rf'"{re.escape(slug)}":\s*{{\s*label:\s*"([^"]+)"', existing)
        label = m.group(1) if m else "Document"
        n = page_count(pdf)
        titles = [title_for(pdf, i) for i in range(1, n + 1)]
        for page_no, fixed in OVERRIDES.get(slug, {}).items():
            if 1 <= page_no <= n:
                titles[page_no - 1] = fixed
        # Hand-authored labels go over the top of the detected ones, page
        # by page. Everything they do not cover keeps what detection
        # found, so no page is left unlabelled.
        manual_pages = 0
        for lo, hi, name in MANUAL_RANGES.get(slug, []):
            for page_no in range(lo, min(hi, n) + 1):
                titles[page_no - 1] = name
                manual_pages += 1
        found = sum(1 for t in titles if t)

        # Section starts: accept a heading only when its number advances on
        # the last one accepted, which drops contents pages, repeats and
        # stray prose that happens to open with a digit.
        sections: list[str | None] = [None] * n
        last_no = 0
        for i in range(1, n + 1):
            hit = section_for(pdf, i)
            if hit and hit[0] > last_no:
                last_no = hit[0]
                sections[i - 1] = f"{hit[0]} {hit[1]}"
        n_sections = sum(1 for s in sections if s)

        # Not every deck numbers its sections. Cuttleswish, for one, sets a
        # plain heading at the top-left of each page and repeats it across
        # that section's pages — so fall back to the page titles and mark a
        # start wherever the heading CHANGES. Same result as the numbered
        # path: one index entry per section, carried across its pages.
        if n_sections < 2:
            sections = [None] * n
            previous = None
            for i, title in enumerate(titles):
                if title and title != previous:
                    sections[i] = title
                previous = title or previous
            n_sections = sum(1 for s in sections if s)

        # Manual labels land last, once detection (including the
        # unnumbered fallback) has produced its full index. Applying them
        # any earlier inflated the section count and made that fallback
        # skip itself, collapsing Interax from 20 sections to 3.
        for lo, hi, name in MANUAL_RANGES.get(slug, []):
            if 1 <= lo <= n:
                sections[lo - 1] = name
            # One manual label spans its whole range rather than being
            # cut in half by a detected start inside it.
            for page_no in range(lo + 1, min(hi, n) + 1):
                sections[page_no - 1] = None
        n_sections = sum(1 for s in sections if s)
        rendered = ", ".join("null" if t is None else '"%s"' % t.replace('"', "'") for t in titles)
        rendered_sections = ", ".join(
            "null" if s is None else '"%s"' % s.replace('"', "'") for s in sections
        )
        lines.append(
            f'  "{slug}": {{ label: "{label}", pages: {n}, '
            f'pdf: "/case-pdf/{slug}.pdf", dir: "/case-pdf/{slug}", '
            f'titles: [{rendered}], sections: [{rendered_sections}], '
            f"landscape: {json.dumps(landscape_pages(pdf))} }},"
        )
        print(
            f"{slug}: {found}/{n} pages titled, {n_sections} sections"
            + (f", {manual_pages} manual" if manual_pages else "")
        )
    lines.append("};")
    TS.write_text("\n".join(lines) + "\n")
    print(f"wrote {TS.relative_to(ROOT)}")

main()
