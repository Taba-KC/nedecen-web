type ChipColor = "default" | "green" | "amber" | "red";

const colorMap: Record<ChipColor, { bg: string; text: string }> = {
  default: { bg: "var(--color-surface)", text: "var(--color-text-muted)" },
  green:   { bg: "rgba(34, 197, 94, 0.15)", text: "#16a34a" },
  amber:   { bg: "rgba(245, 158, 11, 0.15)", text: "#b45309" },
  red:     { bg: "var(--color-accent-muted)", text: "var(--color-accent)" },
};

interface ConceptChipProps {
  label: string;
  color?: ChipColor;
}

export function ConceptChip({ label, color = "default" }: ConceptChipProps) {
  const { bg, text } = colorMap[color];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
}