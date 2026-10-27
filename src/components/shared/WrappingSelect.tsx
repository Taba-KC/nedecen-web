"use client";
import { useId } from "react";
import AppSelect from "./AppSelect";
import styles from "./wrapping-select.module.css";

/** Labelled form variant of the same overlay chooser used throughout the app. */
export default function WrappingSelect({ label, value, options, onChange, disabled = false, placeholder = "Choose an option" }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; disabled?: boolean; placeholder?: string;
}) {
  const id = useId();
  return <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    <AppSelect id={id} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
      {!options.some(option => option.value === value) && <option value="" disabled>{placeholder}</option>}
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </AppSelect>
  </div>;
}
