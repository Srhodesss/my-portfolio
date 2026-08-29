/**
 * Hover label whose characters ripple in a travelling wave, with the
 * CTA arrow riding the end of that wave.
 *
 * Each character carries its own transition-delay, stepped by index, so
 * on hover the lift and the colour run left-to-right through the word.
 * The arrow is the last link in the same chain: it takes the delay of a
 * character one past the end of the word, so it moves once the wave has
 * travelled through, and it slides sideways rather than lifting. Because
 * the delays apply to the return transition too, the whole thing travels
 * back out the same way when the pointer leaves.
 *
 * The visible characters are hidden from assistive tech and a single
 * readable copy sits behind them, so the link keeps a clean accessible
 * name instead of being announced letter by letter.
 *
 * Reduced motion: the wave and the slide are dropped in CSS; the colour
 * still changes.
 */

const STEP_MS = 26;

export default function RippleText({
  children,
  className = "",
  arrow,
}: {
  children: string;
  className?: string;
  /** "right" renders →, "diagonal" renders ↗ for links that leave the site. */
  arrow?: "right" | "diagonal";
}) {
  const chars = Array.from(children);
  return (
    <span className={`ripple-text ${className}`.trim()}>
      <span className="sr-only">{children}</span>
      {chars.map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className="ripple-ch"
          style={{ transitionDelay: `${i * STEP_MS}ms` }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
      {arrow && (
        <span
          aria-hidden
          className={`ripple-arrow${arrow === "diagonal" ? " ripple-arrow-diagonal" : ""}`}
          style={{ transitionDelay: `${chars.length * STEP_MS}ms` }}
        >
          {arrow === "diagonal" ? "↗" : "→"}
        </span>
      )}
    </span>
  );
}
