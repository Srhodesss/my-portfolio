import BottomNav from "@/components/BottomNav";
import NameMark from "@/components/NameMark";

/**
 * Closing section — the name mark returns, same split styling and scale
 * as the hero, anchored across the bottom above the shared bottom nav,
 * with the CLAUDE.md sign-off riding above it.
 */
export default function Closing() {
  return (
    <section className="flex min-h-[85svh] flex-col justify-end px-6 md:px-12 lg:px-20">
      <p className="text-overline uppercase tracking-[0.05em] text-text-muted">
        Designed with purpose.
      </p>
      <p className="mt-6 pb-6 md:pb-8" aria-hidden>
        <NameMark />
      </p>
      <BottomNav />
    </section>
  );
}
