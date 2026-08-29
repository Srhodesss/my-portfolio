import BottomNav from "@/components/BottomNav";
import HeroGlyphField from "@/components/HeroGlyphField";
import NameMark from "@/components/NameMark";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-svh flex-col overflow-hidden px-6 pt-10 md:px-12 lg:px-20"
    >
      <HeroGlyphField />

      {/* Name only, horizontal along the bottom: SINAI left, Rhodes right,
          shared baseline. */}
      <h1
        className="hero-rise relative z-10 mt-auto pb-6 md:pb-8"
        style={{ animationDelay: "0.2s" }}
      >
        <NameMark />
      </h1>

      <BottomNav delay="0.5s" />
    </section>
  );
}
