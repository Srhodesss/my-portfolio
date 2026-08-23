import type { ElementType } from "react";

/**
 * The site's one heading reveal: words rise from behind a clipping mask
 * with a tight stagger and snappy easing. Replaces the slower block
 * fades that headings used to share with body content.
 *
 * Server-rendered — the observer that adds `.is-in` lives in
 * ScrollReveal, which watches `[data-reveal-text]` alongside
 * `[data-reveal]`. The hidden start state is gated on `html.reveal-ready`
 * (JS + motion only), so no-JS and reduced-motion get plain static text.
 */
export default function RevealText({
  as: Tag = "span",
  text,
  className,
  style,
  stagger = 0.032,
  delay = 0,
}: {
  as?: ElementType;
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** Seconds between words — keep tight. */
  stagger?: number;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <Tag className={className} style={style} data-reveal-text>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <span key={i} className="rt-word">
            <span
              className="rt-inner"
              style={{ transitionDelay: `${(delay + i * stagger).toFixed(3)}s` }}
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}
