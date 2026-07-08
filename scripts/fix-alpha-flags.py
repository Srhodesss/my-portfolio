#!/usr/bin/env python3
"""Post-process lib/work-images.ts: sips reports the alpha CHANNEL, but the
white-box treatment should only apply to images with real transparency.
Sample each PNG's alpha extrema and rewrite the manifest's alpha flags.

Usage: python3 scripts/fix-alpha-flags.py
"""

import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TS = ROOT / "lib" / "work-images.ts"


def truly_transparent(path: Path) -> bool:
    if path.suffix.lower() != ".png":
        return False
    with Image.open(path) as im:
        if im.mode not in ("RGBA", "LA", "PA"):
            return False
        alpha = im.getchannel("A")
        lo, _hi = alpha.getextrema()
        return lo < 250  # any meaningfully transparent pixel


text = TS.read_text()


def repl(m: re.Match) -> str:
    src = m.group("src")
    real = truly_transparent(ROOT / "public" / src.lstrip("/"))
    return f'{{ src: "{src}", alpha: {"true" if real else "false"}, '


pattern = re.compile(r'\{ src: "(?P<src>[^"]+)", alpha: (?:true|false), ')
text, n = pattern.subn(repl, text)
TS.write_text(text)
print(f"updated {n} entries")
flags = re.findall(r'src: "([^"]+)", alpha: true', text)
print("truly transparent:", flags or "none")
