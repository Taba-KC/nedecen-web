"use client";

import { useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface FloatingLabelSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
}

export function FloatingLabelSelect({
  id,
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}: FloatingLabelSelectProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value !== "";

  return (
    <div
      className="relative rounded-lg"
      style={{
        height: "var(--control-height)",
        border: `1.5px solid ${focused ? "var(--color-focus)" : "var(--color-border)"}`,
        backgroundColor: "var(--color-card)",
        transition: "border-color 0.15s ease",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        className="w-full h-full text-sm outline-none bg-transparent appearance-none cursor-pointer"
        style={{
          padding: active ? "14px var(--control-px) 0" : "0 var(--control-px)",
          paddingRight: "2.5rem",
          color: value ? "var(--color-text)" : "transparent",
          transition: "padding 0.15s ease",
        }}
      >
        <option value="" disabled />
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
          >
            {opt.label}
          </option>
        ))}
      </select>

      <div
        className="absolute right-4 top-1/2 pointer-events-none"
        style={{ transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <label
        htmlFor={id}
        className="absolute pointer-events-none"
        style={{
          left: "var(--control-px)",
          top: active ? "0" : "50%",
          transform: active ? "translateY(-50%) scale(0.72)" : "translateY(-50%)",
          transformOrigin: "left center",
          fontSize: "0.875rem",
          lineHeight: "1",
          color: focused ? "var(--color-focus)" : "var(--color-text-muted)",
          backgroundColor: "var(--color-card)",
          padding: "0 4px",
          zIndex: 2,
          transition: "top 0.15s ease, transform 0.15s ease, color 0.15s ease",
        }}
      >
        {label}
      </label>
    </div>
  );
}