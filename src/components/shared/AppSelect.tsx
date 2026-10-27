"use client";

import { Children, isValidElement, useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes, type KeyboardEvent, type CSSProperties, type RefObject } from "react";
import { lockModalScroll, useModalMotion } from "@/hooks/useModalMotion";
import styles from "./app-select.module.css";

type Option = { value: string; label: string; disabled?: boolean };
type PanelStyle = CSSProperties & { "--select-backdrop"?: string };
function textOf(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : String(child)).join("");
}
function readOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return [];
    if (child.type !== "option") return readOptions(child.props.children);
    return [{ value: String(child.props.value ?? textOf(child.props.children)), label: textOf(child.props.children), disabled: child.props.disabled }];
  });
}

/** One chooser for every role. The hidden select preserves FormData and native required-field
 * validation; the visible control never opens an operating-system dropdown. */
export default function AppSelect({ children, value, defaultValue, onChange, multiple, disabled, required, name, id: suppliedId, className = "", style, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId(), id = suppliedId ?? generated;
  const trigger = useRef<HTMLButtonElement>(null), native = useRef<HTMLSelectElement>(null);
  const [internal, setInternal] = useState<string[]>(() => [defaultValue ?? ""].flat().map(String));
  const selected = value === undefined ? internal : [value].flat().map(String);
  const options = readOptions(children);
  const [open, setOpen] = useState(false), [invalid, setInvalid] = useState(false);
  const [label, setLabel] = useState("Select an option");
  function showChoices() {
    const labelNode = trigger.current?.labels?.[0]?.cloneNode(true) as HTMLElement | undefined;
    labelNode?.querySelectorAll("[data-custom-select],svg").forEach(node => node.remove());
    setLabel(props["aria-label"] ?? labelNode?.textContent?.trim() ?? "Select an option");
    setOpen(true);
  }
  const summary = options.filter(option => selected.includes(option.value)).map(option => option.label).join(", ") || "Choose an option";
  const choose = (next: string[]) => {
    const node = native.current;
    if (!node) return;
    for (const option of node.options) option.selected = next.includes(option.value);
    setInternal(next); setInvalid(false);
    // Dispatch a real change event, so existing form handlers receive the usual target.value.
    node.dispatchEvent(new Event("change", { bubbles: true }));
  };
  return <span className={`${styles.field} ${className}`} style={style} data-custom-select>
    <button ref={trigger} id={id} type="button" role="combobox" aria-label={props["aria-label"]} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]} aria-required={required} aria-invalid={invalid || props["aria-invalid"]} aria-haspopup="listbox" aria-controls={`${id}-options`} aria-expanded={open} disabled={disabled || !options.length} className={styles.trigger} onClick={showChoices} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); showChoices(); } }}>
      <span>{summary}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <select {...props} ref={native} hidden aria-hidden="true" aria-label={undefined} aria-labelledby={undefined} tabIndex={-1} id={undefined} className={undefined} name={name} multiple={multiple} disabled={disabled} required={required} value={multiple ? selected : selected[0] ?? ""} onChange={onChange ?? (() => {})} onInvalid={event => { event.preventDefault(); setInvalid(true); showChoices(); }}>{children}</select>
    {open && <SelectPanel id={id} label={label} options={options} selected={selected} multiple={multiple} anchorRef={trigger} onChoose={choose} onClose={() => { setOpen(false); trigger.current?.focus(); }} />}
  </span>;
}

function SelectPanel({ id, label, options, selected, multiple, anchorRef, onChoose, onClose }: { id: string; label: string; options: Option[]; selected: string[]; multiple?: boolean; anchorRef: RefObject<HTMLButtonElement | null>; onChoose: (values: string[]) => void; onClose: () => void }) {
  const panelNode = useRef<HTMLDialogElement | null>(null);
  const { ref: dialogRef, close } = useModalMotion(() => {
    // Release the modal's inert background before restoring focus to its trigger.
    panelNode.current?.close();
    onClose();
  });
  const list = useRef<HTMLDivElement>(null), searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(Math.max(0, options.findIndex(option => selected.includes(option.value))));
  const [position, setPosition] = useState<PanelStyle>({});
  const typeahead = useRef({ text: "", time: 0 });
  const visible = options.filter(option => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const available = visible.filter(option => !option.disabled);
  const current = Math.min(active, Math.max(0, available.length - 1));
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    panelNode.current = dialog;
    dialog.showModal();
    const unlock = lockModalScroll();
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) { setPosition({}); return; }
      const box = anchor.getBoundingClientRect(), width = Math.min(Math.max(box.width, 320), 480, innerWidth - 32);
      // A transparent cut-out leaves the real trigger lit, without moving or duplicating it.
      // The modal still intercepts clicks in that opening, so clicking it closes the chooser.
      const radius = parseFloat(getComputedStyle(anchor).borderTopLeftRadius) || 0;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${innerWidth}" height="${innerHeight}"><defs><mask id="spotlight"><rect width="100%" height="100%" fill="white"/><rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}" rx="${radius}" fill="black"/></mask></defs><rect width="100%" height="100%" fill="#101817" fill-opacity=".55" mask="url(#spotlight)"/></svg>`;
      const backdrop = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      if (window.matchMedia("(max-width: 600px)").matches) { setPosition({ "--select-backdrop": backdrop }); return; }
      const height = Math.min(dialog.scrollHeight, innerHeight - 32);
      setPosition({ "--select-backdrop": backdrop, width, left: Math.max(16, Math.min(box.left, innerWidth - width - 16)), top: Math.max(16, Math.min(box.bottom + 8, innerHeight - height - 16)) });
    };
    place(); window.addEventListener("resize", place);
    (options.length > 8 ? searchInput.current : list.current)?.focus();
    return () => { window.removeEventListener("resize", place); dialog.close(); unlock(); };
  }, [anchorRef, dialogRef, options.length]);
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" }); }, [current, query]);
  function choose(option: Option) {
    if (option.disabled) return;
    onChoose(multiple ? selected.includes(option.value) ? selected.filter(value => value !== option.value) : [...selected, option.value] : [option.value]);
    if (!multiple) close();
  }
  function keyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault(); event.stopPropagation(); close();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault(); setActive(event.key === "Home" ? 0 : event.key === "End" ? available.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + available.length) % Math.max(1, available.length));
    } else if ((event.key === "Enter" || event.key === " ") && event.target !== searchInput.current) {
      event.preventDefault(); if (available[current]) choose(available[current]);
    } else if (event.key === "Enter" && event.target === searchInput.current) {
      event.preventDefault(); if (available[current]) choose(available[current]);
    } else if (event.target !== searchInput.current && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = event.timeStamp;
      typeahead.current = { text: (now - typeahead.current.time < 700 ? typeahead.current.text : "") + event.key.toLocaleLowerCase(), time: now };
      const index = available.findIndex(option => option.label.toLocaleLowerCase().startsWith(typeahead.current.text));
      if (index >= 0) setActive(index);
    }
  }
  return <dialog ref={dialogRef} data-select-panel className={styles.panel} style={position} aria-label={label} onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => { event.stopPropagation(); if (event.target === dialogRef.current) { event.preventDefault(); close(); } }}>
    <header className={styles.header}><span>{label}</span></header>
    {options.length > 8 && <input ref={searchInput} className={styles.search} type="search" aria-label="Search choices" placeholder="Search choices…" value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={keyDown} />}
    <div ref={list} id={`${id}-options`} role="listbox" aria-label={label} aria-multiselectable={multiple || undefined} aria-activedescendant={available[current] ? `${id}-choice-${options.indexOf(available[current])}` : undefined} tabIndex={0} className={styles.options} onKeyDown={keyDown}>
      {visible.map(option => <div key={option.value} id={`${id}-choice-${options.indexOf(option)}`} role="option" aria-selected={selected.includes(option.value)} aria-disabled={option.disabled} data-active={option === available[current]} className={styles.option} onPointerMove={() => { const index = available.indexOf(option); if (index >= 0) setActive(index); }} onClick={event => { event.preventDefault(); choose(option); }}><span>{option.label}</span><span className={styles.mark} aria-hidden="true">{selected.includes(option.value) ? "✓" : multiple ? "○" : ""}</span></div>)}
      {!visible.length && <p className={styles.empty}>No matching options.</p>}
    </div>
    {multiple && <footer className={styles.footer}><button type="button" onClick={close}>Done</button></footer>}
  </dialog>;
}
