import Link from "next/link";

/**
 * Nav link with a word-flip hover: the label rolls up out of view while
 * an identical copy rolls in from below in the accent orange. Two stacked
 * copies inside a clipped box, moved as one — so the flip is a single
 * transform, snappy and interruptible.
 *
 * Reduced motion: no roll, the label just takes the accent colour.
 */
export default function FlipLink({
  href,
  label,
  className = "",
  external,
}: {
  href: string;
  label: string;
  className?: string;
  external?: boolean;
}) {
  const inner = (
    <span className="flip-box" aria-hidden>
      <span className="flip-roll">
        <span className="flip-face">{label}</span>
        <span className="flip-face flip-face-alt">{label}</span>
      </span>
    </span>
  );

  const classes = `flip-link ${className}`;

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
    <Link href={href} className={classes}>
      <span className="sr-only">{label}</span>
      {inner}
    </Link>
  );
}
