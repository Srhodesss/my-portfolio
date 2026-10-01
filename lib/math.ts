/** Constrain a scroll-progress style value to the 0–1 range it's meant to
 *  represent, before feeding it to a smoothstep or other easing curve. */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
