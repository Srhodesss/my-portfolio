/**
 * Pixel-accurate hit-test for the Mount Sinai illustration in the closing
 * section, shared between MountSinai (which owns the asset's alpha data
 * and where it currently renders) and CustomCursor (which needs to know
 * whether the pointer sits over actual mountain, not just within a
 * rectangular region around it, to offer "Top").
 *
 * A plain module-level singleton rather than React state or context: the
 * two readers live in unrelated branches of the tree (the cursor is a
 * fixed top-level overlay; the mountain is deep inside page content), and
 * this is read on every pointer move — neither side should re-render when
 * the other updates, since it's pure geometry, not UI state. MountSinai
 * pushes a fresh transform every time it repositions anything else
 * (mount, resize, and every scroll frame, since the mountain's own
 * entrance animation keeps moving it — see placePeak's own comments);
 * everyone else just calls isOverMountainPixel with a raw viewport point.
 */

type AlphaMap = { data: Uint8ClampedArray; w: number; h: number };

/* Everything needed to invert placePeak's own object-fit mapping and go
   from a viewport point back to a natural-pixel coordinate in the
   source asset. imgLeft/imgTop are the <img> element's own
   getBoundingClientRect() origin — already viewport-relative, so unlike
   the wrap-relative math placePeak uses for CSS positioning, nothing
   here needs the wrap's own rect: it would only cancel back out. */
type Transform = {
  imgLeft: number;
  imgTop: number;
  ox: number;
  oy: number;
  fit: number;
};

let alpha: AlphaMap | null = null;
let transform: Transform | null = null;

export function setMountainAlpha(next: AlphaMap | null) {
  alpha = next;
}

export function setMountainTransform(next: Transform | null) {
  transform = next;
}

/** True only when both the pixel data and the current transform are
 *  ready AND the given viewport point lands on an actually-opaque pixel
 *  of the mountain — false off the silhouette, off the image entirely,
 *  or before either is ready, so a caller can treat "unknown" and "not
 *  on the mountain" identically. */
export function isOverMountainPixel(clientX: number, clientY: number): boolean {
  if (!alpha || !transform) return false;
  const { imgLeft, imgTop, ox, oy, fit } = transform;
  const naturalX = Math.round((clientX - imgLeft - ox) / fit);
  const naturalY = Math.round((clientY - imgTop - oy) / fit);
  if (naturalX < 0 || naturalX >= alpha.w || naturalY < 0 || naturalY >= alpha.h) {
    return false;
  }
  const i = (naturalY * alpha.w + naturalX) * 4 + 3;
  return alpha.data[i] > 20;
}
