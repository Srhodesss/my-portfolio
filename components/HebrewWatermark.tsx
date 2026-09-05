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

export default function HebrewWatermark() {
  return (
    <div
      dir="rtl"
      className="flex h-full flex-col justify-between py-[0.25em]"
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
        const half = `${Array(4).fill(verse).join(" · ")} · `;
        const words = (half + half).trim().split(" ");
        return (
          <p
            key={i}
            // self-end = LEFT in this RTL column: rows must anchor left so
            // the ±50% drift loop always keeps the viewport covered.
            className={`wm-row hebrew-texture m-0 w-max self-end whitespace-nowrap ${
              i % 2 ? "wm-drift-r" : "wm-drift-l"
            }`}
            style={{ animationDuration: `${140 + (i % 4) * 22}s` }}
          >
            {words.map((word, wi) => (
              <Fragment key={wi}>
                <span className="glyph-item inline-block">{word}</span>
                {wi < words.length - 1 && " "}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
