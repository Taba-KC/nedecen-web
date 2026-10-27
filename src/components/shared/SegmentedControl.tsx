"use client";
import { MotionTabs } from "./Motion";

/**
 * Reusable set of mutually exclusive choices. It reports the selected value to the parent;
 * filtering or switching content happens wherever that parent uses the value.
 */
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
    <MotionTabs active={value} role="group" aria-label="View options"
      className="inline-flex rounded-xl p-1 gap-1"
      style={{ backgroundColor: "var(--color-surface)", "--motion-tab-color": "var(--color-card)" } as React.CSSProperties}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              color: selected ? "var(--color-text)" : "var(--color-text-muted)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </MotionTabs>
  );
}
