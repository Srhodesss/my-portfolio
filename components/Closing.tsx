import BottomNav from "@/components/BottomNav";
import HeroGlyphField from "@/components/HeroGlyphField";
import NameMark from "@/components/NameMark";

/**
 * Closing section — the name mark returns, same split styling and scale
 * as the hero, anchored across the bottom, with the CLAUDE.md sign-off
 * riding above it, above the shared bottom nav.
 *
 * The interactive verse field returns here, as it is in the hero: the
 * page opens and closes on the same ground. It keeps its full height,
 * with no bottom fade, because there is no bar down there to clear.
 */
export default function Closing() {
  return (
    <section className="relative flex min-h-[85svh] flex-col justify-end overflow-hidden px-6 md:px-12 lg:px-20">
      <HeroGlyphField variant="closing" />

      <p
        data-reveal
        className="relative z-10 text-overline uppercase tracking-[0.05em] text-text-muted"
      >
        Designed with purpose.
      </p>
      <p data-reveal className="relative z-10 mt-6 pb-6 md:pb-8" aria-hidden>
        <NameMark />
      </p>

      <BottomNav />
    </section>
  );
}
