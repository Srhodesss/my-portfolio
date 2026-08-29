#!/usr/bin/env python3
"""Build compact, retina-sharp page PDFs for the on-site slideshow.

The masters are 34-169MB (raw-assets/, gitignored) and rely on tiling
patterns and colour spaces that lossless recompressors (Ghostscript is
unavailable here; PyMuPDF's rewrite_images) corrupt — dropping page
backgrounds. So instead each page is RENDERED from the master by MuPDF
(patterns and all, pixel-faithful) at a fixed long-edge resolution and
written into a fresh PDF, which the on-site PDF.js viewer then displays.

At ~2200px on the long edge each page is sharp on a 2× display at the size
the deck shows it — the old 1400px JPEGs were not — while the files stay a
few MB each and are served with HTTP range requests.

Requires: pip install pymupdf pillow
Usage:    python3 scripts/compress-case-pdfs.py
"""
import io
import os
import sys

import pymupdf
from PIL import Image

pymupdf.TOOLS.mupdf_display_errors(False)

SOURCES = {
    "interax": "raw-assets/interax/web-ready-assets/project-work/interax-portfolio.pdf",
    "cardo": "raw-assets/cardo/project-work/Cardo - Business Report.pdf",
    "aid-sirho-frames": "raw-assets/aid/project-work/Rhodes_Sinai_Portfolio.pdf",
    "cuttleswish": "raw-assets/cuttleswish/project-work/IDE_Group4_Portfolio.pdf",
    "brushed-lips": "raw-assets/brushed-lips/project-work/SDE.pdf",
}

OUT_DIR = "public/case-pdf"
LONG_EDGE_PX = 2200
JPEG_QUALITY = 70


def build(src: str, out: str) -> tuple[int, float]:
    doc = pymupdf.open(src)
    new = pymupdf.open()
    for pg in doc:
        rect = pg.rect
        long_pt = max(rect.width, rect.height)
        dpi = round(LONG_EDGE_PX * 72 / long_pt)
        pix = pg.get_pixmap(dpi=dpi)
        im = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True)
        np = new.new_page(width=rect.width, height=rect.height)
        np.insert_image(np.rect, stream=buf.getvalue())
    new.save(out, garbage=3, deflate=True)
    n = new.page_count
    new.close()
    doc.close()
    return n, os.path.getsize(out) / 1e6


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for slug, src in SOURCES.items():
        if not os.path.exists(src):
            print(f"SKIP {slug} — missing {src}", file=sys.stderr)
            continue
        n, mb = build(src, os.path.join(OUT_DIR, f"{slug}.pdf"))
        print(f"{slug}: {n}pp  {mb:.1f}MB")


if __name__ == "__main__":
    main()
