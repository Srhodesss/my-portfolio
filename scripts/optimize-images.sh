#!/usr/bin/env bash
# Batch-optimise raw project images into public/work/ (CLAUDE.md §10).
# Longest edge capped at 1800px; opaque images become quality-82 JPEGs,
# images with transparency stay PNG. Never upscales. Uses macOS sips.
#
# Usage: bash scripts/optimize-images.sh
set -euo pipefail
cd "$(dirname "$0")/.."

RAW="raw-assets"
OUT="public/work"
MAX=1800

# "source relative to raw-assets/|slug/dest-name-without-extension"
MAPPINGS=(
  "interax/web-ready-assets/Interax - UI/Interax Mockup.png|interax/cover"
  "interax/web-ready-assets/Interax - UI/UI.png|interax/ui"
  "interax/web-ready-assets/Interax - UI/Focus Dashboard.png|interax/focus-dashboard"
  "interax/web-ready-assets/Interax - UI/Focus Breakdown.png|interax/focus-breakdown"
  "interax/web-ready-assets/Interax - UI/Hand Mockup.png|interax/hand-mockup"
  "cardo/web-ready-assets/Cardo Mockup.png|cardo/cover"
  "cardo/web-ready-assets/Card_New 1.png|cardo/card"
  "cardo/web-ready-assets/Budget in iPhone.png|cardo/budget"
  "cardo/web-ready-assets/Diary in iPhone.png|cardo/diary"
  "cardo/web-ready-assets/Net Savings in iPhone.png|cardo/net-savings"
  "cardo/web-ready-assets/Inefficiencies in iPhone.png|cardo/inefficiencies"
  "aid/web-ready-assets/Cover.png|aid/cover"
  "aid/web-ready-assets/Sirho Frame.png|aid/frame"
  "aid/web-ready-assets/Podium Final.png|aid/podium-final"
  "aid/web-ready-assets/Podium Deconstructed.jpg|aid/podium-deconstructed"
  "aid/web-ready-assets/Podium Anotated.png|aid/podium-annotated"
  "cuttleswish/web-ready-assets/Cuttleswish Portfolio Cover 2.png|cuttleswish/cover"
  "cuttleswish/web-ready-assets/Cuttleswish Key Assembly Features Render.png|cuttleswish/assembly"
  "cuttleswish/web-ready-assets/Cuttleswish Exploded Pacakaging Render PNG 2.png|cuttleswish/exploded-packaging"
  "cuttleswish/web-ready-assets/Cuttleswish render 6.jpg|cuttleswish/render"
  "cuttleswish/web-ready-assets/Final Render_2 2.png|cuttleswish/final-render"
  "brushed-lips/web-ready-assets/SDE Packaging Render NEW.png|brushed-lips/cover"
  "brushed-lips/web-ready-assets/SDE Lipstick Exploded.png|brushed-lips/exploded"
  "brushed-lips/web-ready-assets/SDE Lipstick Packaging Front.png|brushed-lips/packaging-front"
  "brushed-lips/web-ready-assets/OG SDE INFOGRAPHIC.png|brushed-lips/infographic"
  "brushed-lips/web-ready-assets/SDE Lipstick Packaging 15.png|brushed-lips/packaging-15"
)

for mapping in "${MAPPINGS[@]}"; do
  src="$RAW/${mapping%%|*}"
  dest_base="$OUT/${mapping##*|}"
  mkdir -p "$(dirname "$dest_base")"

  width=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
  height=$(sips -g pixelHeight "$src" | awk '/pixelHeight/{print $2}')
  alpha=$(sips -g hasAlpha "$src" | awk '/hasAlpha/{print $2}')
  longest=$(( width > height ? width : height ))

  if [[ "$alpha" == "yes" ]]; then
    dest="$dest_base.png"; fmt_args=(-s format png)
  else
    dest="$dest_base.jpg"; fmt_args=(-s format jpeg -s formatOptions 82)
  fi

  if (( longest > MAX )); then
    sips "${fmt_args[@]}" --resampleHeightWidthMax "$MAX" "$src" --out "$dest" >/dev/null
  else
    sips "${fmt_args[@]}" "$src" --out "$dest" >/dev/null
  fi
  echo "$(du -h "$dest" | cut -f1)  $dest  (${width}x${height}, alpha=$alpha)"
done
