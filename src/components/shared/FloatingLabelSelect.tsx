"use client";
import AppSelect from "./AppSelect";

/** Preserve the existing form API while sharing the app's accessible custom chooser. */
export function FloatingLabelSelect({ id, label, value, onChange, options, required, disabled }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  options: { value: string; label: string }[]; required?: boolean; disabled?: boolean;
}) {
  return <div style={{ minWidth: 0 }}>
    <label htmlFor={id} style={{ display: "block", marginBottom: 7, fontSize: 14 }}>{label}</label>
    <AppSelect id={id} value={value} onChange={event => onChange(event.target.value)} required={required} disabled={disabled}>
      <option value="" disabled>Choose {label.toLocaleLowerCase()}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </AppSelect>
  </div>;
}
