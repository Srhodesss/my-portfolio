#!/usr/bin/env python3
"""Rebuild the raster site icons from app/icon.svg.

app/icon.svg is the source of truth and carries the "SR" letterforms as
outlines rather than text — traced once with fontTools from Instrument
Sans instanced at weight 600, the same face and weight as the "SINAI"
half of the wordmark, with its -0.03em tracking — so nothing here needs
the font installed. Corners are rounded at 22% of the tile. Colours are
the site tokens: --accent ground, --bg ink. Dark on orange rather than
white on orange because white on #FF6B35 is only about 2.6:1 and falls
apart at favicon sizes.

Needs Pillow and the project's sharp (via node) for SVG rasterisation.

Usage: python3 scripts/build-icons.py
"""
import subprocess, tempfile, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SVG = ROOT / "app" / "icon.svg"

raster = """
import sharp from "sharp";
const [svg, out, n] = process.argv.slice(2);
await sharp(svg, { density: 600 }).resize(+n, +n).png().toFile(out);
"""

def png(size, dest):
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", dir=ROOT, delete=False) as f:
        f.write(raster)
        script = f.name
    try:
        subprocess.run(["node", script, str(SVG), str(dest), str(size)],
                       cwd=ROOT, check=True)
    finally:
        pathlib.Path(script).unlink(missing_ok=True)

png(180, ROOT / "app" / "apple-icon.png")
print("app/apple-icon.png  180x180")

with tempfile.TemporaryDirectory() as tmp:
    big = pathlib.Path(tmp) / "icon-512.png"
    png(512, big)
    from PIL import Image
    Image.open(big).convert("RGBA").save(
        ROOT / "app" / "favicon.ico", format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)])
print("app/favicon.ico     16/32/48")
