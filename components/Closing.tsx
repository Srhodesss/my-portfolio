import BottomNav from "@/components/BottomNav";
import MountSinai from "@/components/MountSinai";
import NameMark from "@/components/NameMark";

/**
 * Closing section — the name mark returns, same split styling and scale
 * as the hero, anchored across the bottom,
 * above the shared bottom nav.
 *
 * The verses return here, as they are in the hero: the page opens and
 * closes on the same ground. But where the hero's field parts around the
 * cursor, this one holds still — it sits behind the Mount Sinai
 * illustration and is found by the light rather than pushed by it. Both
 * layers live in MountSinai so the torch reveals them as one picture.
 */
export default function Closing() {
  return (
    <section
      data-closing
      className="relative flex min-h-svh flex-col justify-end overflow-hidden px-6 md:px-12 lg:px-20"
    >
      <MountSinai />

      <p data-reveal className="relative z-10 mt-6 pb-6 md:pb-8" aria-hidden>
        <NameMark />
      </p>

      <BottomNav />
    </section>
  );
}
