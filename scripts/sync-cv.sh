#!/usr/bin/env bash
# Publish the CV from raw-assets to public/ under a clean, space-free URL.
# Re-run after replacing the source PDF.
set -euo pipefail
cd "$(dirname "$0")/.."
src="raw-assets/Sinai Rhodes CV.pdf"
[ -f "$src" ] || { echo "missing: $src" >&2; exit 1; }
cp "$src" public/cv.pdf
echo "public/cv.pdf  <-  $src  ($(du -h public/cv.pdf | cut -f1))"
