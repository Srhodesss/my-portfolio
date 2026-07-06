/**
 * The split name mark — SINAI in the bold sans, Rhodes in the display
 * serif italic — shared by the hero (inside its h1) and the closing
 * section. Sized to stand roughly a third of the viewport tall on
 * desktop while never overflowing the row (phrasing-content spans only,
 * so it is valid inside h1 or p).
 */
export default function NameMark() {
  return (
    <span
      className="flex items-baseline justify-between gap-6"
      style={{ fontSize: "clamp(48px, 16.5vw, 260px)", lineHeight: 0.95 }}
    >
      <span className="font-semibold tracking-[-0.03em]">SINAI</span>
      <span className="font-display font-normal italic tracking-[-0.01em]">
        Rhodes
      </span>
    </span>
  );
}
