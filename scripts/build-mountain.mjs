/**
 * Build public/bottom-hero/mount-sinai.webp from the cutout source.
 *
 * Beyond a resize, this remaps the alpha channel to control how soft the
 * silhouette's edge reads — where the verses behind the mountain stop
 * being visible. The supplied cutout has a naturally feathered matte (the
 * silhouette fades from transparent to opaque over a median of ~19px, p90
 * 25px, max 75px, measured across the summit). Two things were already
 * tried and rejected before this one:
 *   - Passing the cutout's alpha straight through (LO=0, HI=255): the
 *     verses fade out gradually under the mountain, which reads as
 *     genuinely soft/out-of-focus at the silhouette's edge.
 *   - A narrow linear window (LO=120, HI=136): a binary cutoff steepens
 *     the ramp to ~2px, but a HARD threshold on a naturally-feathered
 *     matte aliases — measured and confirmed visibly jagged on the
 *     mountain's shallower diagonal slopes, where staircasing is most
 *     exposed.
 *
 * What's here instead: a sigmoid remap (steepens the *middle* of the
 * ramp while easing the tails, so it stays continuous — no binary jump)
 * followed by a light unsharp mask applied to the alpha channel alone.
 * Measured median transition width down to 3px (max 5px) across the
 * summit, smooth on both the near-vertical peak and the shallow lower
 * flanks — confirmed by crops at 6x pixel zoom against the original and
 * against a k=30 no-USM pass before adding the sharpen. K and the USM
 * amount are both one-number changes here if the source ever changes and
 * this needs re-tuning; SIGMOID_MID should stay 0.5 unless a source's own
 * matte is measurably skewed off-centre.
 *
 * RGB is untouched — verified byte-identical against the source, only
 * the ~1-2% of pixels inside the original feather band change at all.
 *
 * Usage: node scripts/build-mountain.mjs
 */
import sharp from "sharp";

const SRC = "raw-assets/bottom-hero/mount-sinai-illuminated.png";
const OUT = "public/bottom-hero/mount-sinai.webp";
const MAX = 2400;

const SIGMOID_K = 30; // steepness; ~30 was the sweet spot — tighter (50+)
// starts reading as a near-binary edge again, the same failure mode as
// the rejected hard threshold.
const SIGMOID_MID = 0.5; // input alpha (0-1) that maps to the output midpoint

const USM_SIGMA = 1.0; // unsharp mask radius, alpha channel only
const USM_AMOUNT = 1.0; // sharp's "m2" flat-area boost

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// --- 1. Sigmoid remap on the alpha channel --------------------------------
const sigmoided = Buffer.from(data);
for (let i = 0; i < W * H; i++) {
  const x = data[i * C + 3] / 255;
  const y = 1 / (1 + Math.exp(-SIGMOID_K * (x - SIGMOID_MID)));
  sigmoided[i * C + 3] = Math.max(0, Math.min(255, Math.round(y * 255)));
}

// --- 2. Unsharp mask applied ONLY to the alpha channel --------------------
// Extract alpha as its own single-band image so the sharpen never touches
// RGB, then rejoin. sharp's raw() output for a greyscale pipeline comes
// back as 3 (identical) channels regardless of the 1-channel input — read
// the resolved channel count rather than assuming a 1-byte stride, which
// silently zeroed the whole channel the first time this was tried.
const alphaOnly = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) alphaOnly[i] = sigmoided[i * C + 3];

const { data: sharpenedAlpha, info: sInfo } = await sharp(alphaOnly, {
  raw: { width: W, height: H, channels: 1 },
})
  .sharpen({ sigma: USM_SIGMA, m1: 0, m2: USM_AMOUNT, x1: 2, y2: 10, y3: 20 })
  .raw()
  .toBuffer({ resolveWithObject: true });
const SC = sInfo.channels;

const out = Buffer.from(sigmoided);
for (let i = 0; i < W * H; i++) {
  out[i * C + 3] = sharpenedAlpha[i * SC];
}

await sharp(out, { raw: { width: W, height: H, channels: C } })
  .resize(W > MAX ? MAX : W) // never upscales
  // Same reasoning as the rest of the art pipeline: quality high and the
  // deblocking filter off, because the cursor torch lifts the shadows and
  // default settings smear the rock grain it uncovers.
  .webp({ quality: 97, effort: 6, smartSubsample: true, alphaQuality: 100 })
  .toFile(OUT);

const m = await sharp(OUT).metadata();
console.log(`${OUT}  ${m.width}x${m.height}  alpha=${m.hasAlpha}`);
