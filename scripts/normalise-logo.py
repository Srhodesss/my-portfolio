#!/usr/bin/env python3
"""Re-canvas a logo so it matches the rest of the set.

Every mark in public/logos should sit on a square canvas with its
artwork occupying ~80% of the box, centred. Marks that arrive filling
their whole canvas render visibly larger than their neighbours once
object-contain scales them into an equal box; marks with lopsided
padding sit off-centre.

Usage: python3 scripts/normalise-logo.py <file.png> [more.png ...]
"""
import sys
from pathlib import Path
from PIL import Image

FILL = 0.80
SIZE = 512


def normalise(path: Path) -> str:
    im = Image.open(path).convert("RGBA")
    box = im.split()[-1].getbbox()
    if not box:
        return f"{path.name}: fully transparent, skipped"
    art = im.crop(box)
    w, h = art.size
    scale = (SIZE * FILL) / max(w, h)
    art = art.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(art, ((SIZE - art.size[0]) // 2, (SIZE - art.size[1]) // 2), art)
    out.save(path)
    return f"{path.name}: {w}x{h} -> {art.size[0]}x{art.size[1]} on {SIZE}x{SIZE}"


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        print(normalise(Path(arg)))
