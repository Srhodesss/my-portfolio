import Link from "next/link";

/**
 * Nav link with a word-flip hover: the label rolls up out of view while
 * an identical copy rolls in from below in the accent orange. Two stacked
 * copies inside a clipped box, moved as one — so the flip is a single
 * transform, snappy and interruptible.
 *
 * `underline` adds a hairline beneath the label that draws out from the
 * centre on hover, the same treatment used on the intro CTA and the
 * Contact link, so every hoverable word on the site behaves alike.
 *
 * `backArrow` puts a left-pointing arrow outside the flipping box, so it
 * can travel left on hover instead of rolling with the label. Keeping it
 * inside the label text meant it could only ever flip, never move.
 *
 * Reduced motion: no roll, no draw and no travel; the label just takes
 * the accent colour.
 */
export default function FlipLink({
  href,
  label,
  className = "",
  external,
  onClick,
  underline,
  backArrow,
}: {
  href: string;
  label: string;
  className?: string;
  external?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Draw a hairline out from the centre beneath the label on hover. */
  underline?: boolean;
  /** Prefix a back arrow that slides left on hover. */
  backArrow?: boolean;
}) {
  const inner = (
    <>
      {backArrow && (
        <span aria-hidden className="flip-back-arrow">
          ←
        </span>
      )}
      <span className="flip-box" aria-hidden>
        <span className="flip-roll">
          <span className="flip-face">{label}</span>
          <span className="flip-face flip-face-alt">{label}</span>
        </span>
      </span>
      {underline && <span aria-hidden className="hover-rule" />}
    </>
  );

  const classes = `flip-link ${underline ? "has-rule " : ""}${
    backArrow ? "flip-back " : ""
  }${className}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        <span className="sr-only">{label}</span>
        {inner}
      </a>
    );
  }
  return (
    // scroll={false} for hash links: Next's router scrolls the new route
    // to the top by default, which landed after the browser had already
    // jumped to the anchor and undid it. ScrollReset owns positioning for
    // these, so the router must keep its hands off.
    <Link
      href={href}
      scroll={!href.includes("#")}
      className={classes}
      onClick={onClick}
    >
      <span className="sr-only">{label}</span>
      {inner}
    </Link>
  );
}
