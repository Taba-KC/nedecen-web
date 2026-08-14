"use client";

import { useState } from "react";

interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}

export function FloatingLabelInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
  disabled,
}: FloatingLabelInputProps) {
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
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        className="w-full h-full text-sm outline-none bg-transparent"
        style={{
          padding: active ? "14px var(--control-px) 0" : "0 var(--control-px)",
          color: "var(--color-text)",
          transition: "padding 0.15s ease",
        }}
      />
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