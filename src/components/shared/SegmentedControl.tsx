"use client";

interface Option {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      className="inline-flex rounded-xl p-1 gap-1"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: selected ? "var(--color-card)" : "transparent",
              color: selected ? "var(--color-text)" : "var(--color-text-muted)",
              boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}