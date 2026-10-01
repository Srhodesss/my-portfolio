import { Fragment } from "react";

/**
 * The one Hebrew watermark, shared verbatim by the scripture intro overlay
 * and the hero background so the intro→hero handoff is a pixel-invariant
 * crossfade (identical markup + identical CSS drift animations, which run
 * on the same document timeline in both copies).
 *
 * Structure: rows of verse text (favourite-verses.md — Delitzsch for the
 * New Testament, Hebrew original for Psalm 62 / Exodus 31). Each row's
 * content is two identical halves so the alternating CSS drift loops
 * seamlessly at translateX(±50%). Words are spans (.glyph-item) so the
 * hero can attach repulsion, proximity glow and the sequential shimmer.
 *
 * The 6% tint lives in `color` (inherited), so per-word/per-character
 * effects can brighten past the base level.
 */

const VERSES = [
  // Exodus 31:3 — the foundation verse itself
  "ואמלא אתו רוח אלהים בחכמה ובתבונה ובדעת ובכל מלאכה לחשב מחשבת",
  // Philippians 4:13
  "כל זאת אוכל בעזרת המשיח הנותן בי כח",
  // Psalm 62:1–2
  "אך אל אלהים דומיה נפשי ממנו ישועתי אך הוא צורי וישועתי משגבי לא אמוט רבה",
  // Matthew 22:37–38
  "ואהבת את יהוה אלהיך בכל לבבך ובכל נפשך ובכל מדעך זאת היא המצוה הגדולה והראשונה",
  // 2 Timothy 3:16–17
  "כי כל הכתוב נכתב ברוח אלהים גם מועיל להורת ולהוכיח ולישר וליסר בצדק למען אשר יהיה איש האלהים תמים ומהיר לכל מעשה טוב",
  // John 1:3
  "הכל נהיה על ידו ומבלעדיו לא נהיה כל אשר נהיה",
  // Ephesians 6:13
  "על כן קחו את כל נשק האלהים למען תוכלו לעמד ביום הרע ואחרי כלותכם את הכל עמד תעמדו",
  // 1 Corinthians 9:24–25
  "הלא ידעתם כי רצי המרוצה רצים כלם ורק אחד מהם ישיג את שכר הנצחון ככה רוצו למען תשיגהו",
  // Matthew 11:29–30
  "קבלו עליכם את עלי ולמדו ממני כי ענו ושפל רוח אנכי ותמצאו מרגוע לנפשתיכם כי עלי נעים והמשא שלי קל",
];

const ROWS = 12;

/* How long the tiling half has to be, in characters.
 *
 * Each row is that half twice over, and the drift translates by exactly
 * one half (±50%), so the half must be at least a viewport wide or the
 * row uncovers the screen at the extremes of its travel. It used to be a
 * flat four repeats of the verse regardless of how long the verse was,
 * which sized every row to its text rather than to that requirement: the
 * longest verse (2 Timothy, ~120 characters) produced a half over three
 * viewports wide, and measured live the rows ran 4,046-8,899px across
 * for a 1,440px viewport — 4.36 Mpx of continuously animating area, only
 * 19% of it ever on screen.
 *
 * Counting characters rather than repeats sizes every row to the same
 * requirement instead. The font size is itself viewport-derived
 * (min(3.55vh, 7.5vw) below), so a character count holds a roughly
 * constant half-to-viewport ratio at any size rather than needing to be
 * recomputed per breakpoint: ~0.42em per Hebrew glyph puts 180
 * characters at ~1.7 viewports on a 16:10 laptop and still over one on a
 * 21:9 ultrawide, which is the tightest case (widest aspect = smallest
 * font relative to width). Sized for that worst case on purpose — a
 * smaller number benchmarks better and would leave a visible gap in the
 * texture at the end of the drift on a wide monitor.
 *
 * The visible texture is unchanged: font size and glyph density are
 * untouched, so the same span of screen shows the same number of
 * characters. Only the off-screen repetition shrinks. */
/* The same requirement, resolved per breakpoint.
 *
 * One number can't serve every viewport, because the font size is
 * clamped by a vh term that barely shrinks on a narrow screen while the
 * width collapses: measured live at 375x812, the tiling half came out
 * 5.48x the viewport width, where it only ever needs to be 1x. The
 * ultrawide figure was being paid on every phone.
 *
 * Resolved in CSS rather than JS on purpose. This component is rendered
 * twice — the scripture intro overlay and the hero background — and the
 * intro-to-hero handoff crossfades between the two copies, which only
 * reads as one image if they are pixel-identical while both are on
 * screen. translateX(-50%) is relative to each row's OWN width, so a
 * copy that resized a frame before the other sits at a different pixel
 * offset: measuring after mount and rewriting the rows would put a
 * visible slip in exactly the frame the crossfade happens (and risk a
 * hydration mismatch besides). Media queries change both copies in the
 * same frame, off one stylesheet, with nothing to keep in sync.
 *
 * Surplus units are hidden BY CLASS, so the same indices disappear from
 * both halves of a row, both halves stay identical, and the ±50% loop
 * still lands on an exact copy. */
const HALF_MIN_CHARS = {
  /* Each tier is the widest viewport it must cover, against the
     SMALLEST font that viewport can produce — which is the 19px clamp
     floor on a short window, not the nominal vh size. That floor is why
     the tiers aren't more aggressive: at 479x400 a glyph is ~7.9px wide,
     so even a phone-width viewport needs ~61 characters. */
  narrow: 70, // <= 479px
  small: 110, // <= 767px
  wide: 180, // above that, up to 21:9 ultrawide
};

export default function HebrewWatermark() {
  return (
    <div
      dir="rtl"
      className="wm-rows flex h-full flex-col justify-between py-[0.25em]"
      style={{
        // Strength is a variable so a host section can light the same
        // markup harder without forking it — the closing section reveals
        // it under the cursor. Unset everywhere else, so 6% stands.
        color:
          "color-mix(in srgb, var(--scripture) var(--wm-strength, 6%), transparent)",
        /* Rows are distributed down the full height, so the gap between
           them is set by the container's HEIGHT — tie the size to the same
           axis and the ratio between the two holds at any viewport. Sized
           by width instead, it hit its ceiling on large screens while the
           gaps kept growing, and the texture drifted 24% looser. The vw
           term only takes over on narrow screens, where a purely
           height-derived size would be far too large. */
        fontSize: "clamp(19px, min(3.55vh, 7.5vw), 56px)",
      }}
    >
      {Array.from({ length: ROWS }, (_, i) => {
        const verse = VERSES[i % VERSES.length];
        const unit = `${verse} · `;
        const unitWords = unit.trim().split(" ");
        const needed = (chars: number) =>
          Math.max(1, Math.ceil(chars / unit.length));
        const [nNarrow, nSmall, nWide] = [
          needed(HALF_MIN_CHARS.narrow),
          needed(HALF_MIN_CHARS.small),
          needed(HALF_MIN_CHARS.wide),
        ];
        // One entry per tiling unit, carrying the tier that may drop it.
        // The half is this list; the row is it twice.
        const tiers = Array.from({ length: nWide }, (_, u) =>
          u < nNarrow ? "" : u < nSmall ? "wm-u1" : "wm-u2",
        );
        const half = [...tiers, ...tiers];
        return (
          <p
            key={i}
            // self-end = LEFT in this RTL column: rows must anchor left so
            // the ±50% drift loop always keeps the viewport covered.
            className={`wm-row hebrew-texture m-0 w-max self-end whitespace-nowrap ${
              i % 2 ? "wm-drift-r" : "wm-drift-l"
            }`}
            style={{
              /* --wm-slow lets a host section stretch the drift without
                 forking this markup: unset everywhere (1x), 3x in the
                 closing section, where only a third of the rows move at
                 all. See .ms-field .wm-row in globals.css. */
              animationDuration: `calc(${140 + (i % 4) * 22}s * var(--wm-slow, 1))`,
              /* A negative delay starts the drift partway through its own
                 cycle, so the rows are never all at the same offset. In
                 the hero and the intro that only de-synchronises the
                 drift slightly (both copies get identical values, so the
                 crossfade between them is unaffected). In the closing
                 section, where the drift is paused outright, it is what
                 gives each row a DIFFERENT frozen offset instead of
                 every row snapping to translateX(0) and the texture
                 reading as twelve aligned copies of itself. */
              animationDelay: `-${(i * 13 + 5) % 97}s`,
            }}
          >
            {half.map((tier, ui) => (
              <span key={ui} className={`wm-unit ${tier}`}>
                {unitWords.map((word, wi) => (
                  <Fragment key={wi}>
                    <span className="glyph-item inline-block">{word}</span>{" "}
                  </Fragment>
                ))}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
