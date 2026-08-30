import BottomNav from "@/components/BottomNav";
import HeroGlyphField from "@/components/HeroGlyphField";
import NameMark from "@/components/NameMark";

/**
 * Closing section — the name mark returns, same split styling and scale
 * as the hero, anchored across the bottom,
 * above the shared bottom nav.
 *
 * The interactive verse field returns here, as it is in the hero: the
 * page opens and closes on the same ground. The section is a full
 * viewport tall so the field covers the screen once the reader reaches
 * the end, and it carries the same bottom fade as the hero to clear a
 * band for the nav bar.
 */
export default function Closing() {
  return (
    <section
      data-closing
      className="relative flex min-h-svh flex-col justify-end overflow-hidden px-6 md:px-12 lg:px-20"
    >
      <HeroGlyphField variant="closing" />

      <p data-reveal className="relative z-10 mt-6 pb-6 md:pb-8" aria-hidden>
        <NameMark />
      </p>

      <BottomNav />
    </section>
  );
}
