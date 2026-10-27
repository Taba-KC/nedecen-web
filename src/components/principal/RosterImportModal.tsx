"use client";

import AppSelect from "@/components/shared/AppSelect";

/**
 * Preview and edit a staff/learner spreadsheet before committing it. Uploading obtains
 * proposed rows and validation issues; only the final Save request inserts accounts. Inline
 * mode allows the same tool inside a book page.
 */
import MobileAction from "@/components/shared/MobileAction";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";
import { useModalMotion } from "@/hooks/useModalMotion";
import styles from "./roster-import.module.css";

export type ImportPurpose = "update" | "progression";
export function RosterImportPurpose({ value, onChange, disabled }: { value: ImportPurpose; onChange: (value: ImportPurpose) => void; disabled?: boolean }) {
  return <label className={styles.purpose}>Purpose<AppSelect value={value} disabled={disabled} onChange={event => onChange(event.target.value as ImportPurpose)}><option value="update">Update class register</option><option value="progression">Grade progression</option></AppSelect></label>;
}

type Row = { title?: string; firstName: string; surname: string; identifier: string };
type EditableRow = Row & { key: number };
type Impact = { reviewHash: string; added: number; retained: number; assigned: number; transfers: { admissionNumber: string; name: string; fromClass: string }[]; removed: { admissionNumber: string; name: string }[] };
interface Preview { rows: Row[]; existingIdentifiers: string[] }

export function RosterImportModal({ schoolId, kind, onClose: onDismiss, onSaved, classOptions = [], initialClassId = "", fixedClass = false, inline = false, purpose, onPurposeLocked }: {
  schoolId: number; kind: "staff" | "learners"; onClose: () => void; onSaved: () => Promise<void>;
  classOptions?: { value: string; label: string; academicYear?: number }[]; initialClassId?: string; fixedClass?: boolean;
  inline?: boolean;
  purpose?: ImportPurpose; onPurposeLocked?: (locked: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [classId, setClassId] = useState(initialClassId);
  const [localMode, setMode] = useState<ImportPurpose>("update");
  const mode = purpose ?? localMode;
  const [academicYear, setAcademicYear] = useState(String(classOptions.find(option => option.value === initialClassId)?.academicYear ?? new Date().getFullYear()));
  const [impact, setImpact] = useState<Impact | null>(null);
  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const [existing, setExisting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(0);
  useEffect(() => { onPurposeLocked?.(busy || rows !== null); return () => onPurposeLocked?.(false); }, [busy, rows, onPurposeLocked]);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const motion = useModalMotion(() => { if (!inFlight.current) onDismiss(); });
  const onClose = motion.close;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const numberLabel = kind === "staff" ? "Staff number" : "Admission number";
  const numberColumn = kind === "staff" ? "staffNumber" : "admissionNumber";
  const target = classOptions.find(option => option.value === classId)?.label;
  const base = "/schools/" + schoolId + (kind === "staff" ? "/people/import" : "/classes/" + classId + "/learners/import");
  const fields: { key: keyof Row; label: string }[] = [
    ...(kind === "staff" ? [{ key: "title" as const, label: "Title" }] : []), { key: "firstName", label: "First name" }, { key: "surname", label: "Surname" }, { key: "identifier", label: numberLabel },
  ];
  const issues = useMemo(() => {
    const existingNumbers = new Set(existing.map(value => value.trim().toLowerCase()));
    const counts = new Map<string, number>();
    for (const row of rows ?? []) { const id = row.identifier.trim().toLowerCase(); if (id) counts.set(id, (counts.get(id) ?? 0) + 1); }
    return (rows ?? []).map(row => {
      const errors: string[] = [];
      if (kind === "staff" && !row.title?.trim()) errors.push("Title is required");
      if (!row.firstName.trim()) errors.push("First name is required");
      if (!row.surname.trim()) errors.push("Surname is required");
      if (!row.identifier.trim()) errors.push(numberLabel + " is required");
      if (Object.values(row).some(value => typeof value === "string" && value.length > 200)) errors.push("Use at most 200 characters per field");
      const id = row.identifier.trim().toLowerCase();
      if (id && existingNumbers.has(id)) errors.push(numberLabel + " already exists in this school");
      if (id && (counts.get(id) ?? 0) > 1) errors.push(numberLabel + " is repeated in this preview");
      return errors;
    });
  }, [rows, existing, numberLabel, kind]);
  const invalid = issues.filter(issue => issue.length).length;

  /**
   * Upload the selected spreadsheet to get editable proposed rows and validation issues;
   * preview does not insert accounts.
   */
  async function preview(event: React.FormEvent) {
    event.preventDefault();
    if (!file || (kind === "learners" && !classId) || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(null);
    try {
      const data = new FormData(); data.append("file", file); data.append("mode", mode); data.append("academicYear", academicYear);
      const result = await api.upload<Preview>(base + "/preview", data);
      if (!mounted.current) return;
      const existingNumbers = new Set(result.existingIdentifiers.map(value => value.trim().toLowerCase()));
      const newRows = inline && kind === "staff" ? result.rows.filter(row => !existingNumbers.has(row.identifier.trim().toLowerCase())) : result.rows;
      setSkipped(result.rows.length - newRows.length);
      setRows(newRows.map((row, key) => ({ ...row, key })));
      setExisting(result.existingIdentifiers);
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "Could not preview spreadsheet."); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  /**
   * Submit the reviewed rows for final validation and atomic import. Refresh the parent
   * register only after the server reports success.
   */
  async function save() {
    if (!rows?.length || invalid || inFlight.current || saved !== null) return;
    inFlight.current = true; setBusy(true); setError(null);
    try {
      const payload = { mode, academicYear: Number(academicYear), rows: rows.map(({ title, firstName, surname, identifier }) => ({ ...(kind === "staff" ? { title } : {}), firstName, surname, identifier })) };
      if (kind === "learners" && !impact) {
        const review = await api.post<Impact>(base + "/review", payload);
        if (mounted.current) setImpact(review);
        return;
      }
      const result = await api.post<{ saved: number }>(base + "/commit", { ...payload, reviewHash: impact?.reviewHash });
      if (!mounted.current) return;
      setSaved(result.saved);
      try { await onSaved(); } catch { setError("Saved successfully. Refresh the list to see the new records."); }
    } catch (err) { if (mounted.current) { setImpact(null); setError(err instanceof Error ? err.message : "Could not save records."); } }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const buttonStyle = { height: "var(--control-height)", backgroundColor: "var(--grade-action-bg)", color: "#ffffff" };
  const content = <>
    {kind === "learners" && target && <p className="mb-4 text-sm font-semibold" style={{ color: "var(--color-text)" }}>Class: {target}</p>}
    {error && <p role="alert" className="mb-4 text-sm" style={{ color: "var(--color-accent)" }}>{error}</p>}
    {saved !== null ? <div className="space-y-4">
      <p role="status" className="text-sm">{saved} {kind === "staff" ? "staff records saved. Their accounts are ready to claim." : "learner records saved. Existing accounts and learning history have been preserved."}</p>
      <button type="button" onClick={onClose} disabled={busy} className="w-full rounded-lg text-sm font-bold disabled:opacity-50" style={buttonStyle}>Done</button>
    </div> : rows ? <div>
      <p className="mb-3 text-sm" style={{ color: "var(--color-text-muted)" }}>Nothing has been saved yet. Edit any cell or remove rows before saving.</p>
      <p role="status" className="mb-4 text-sm">{rows.length} rows · {invalid ? invalid + " need attention" : "Ready to save"}{skipped > 0 && ` · ${skipped} existing records skipped`}</p>
      <div className={`max-h-[50vh] overflow-auto rounded-lg border ${styles.reviewViewport}`} style={{ borderColor: "var(--color-border)" }}>
        <table className={`w-full min-w-[700px] text-left text-sm ${styles.reviewTable}`}>
          <thead className="sticky top-0 z-10" style={{ background: inline ? "#eef0e7" : "#292929" }}><tr><th className="p-3">Row</th>{fields.map(field => <th key={field.key} className="p-3">{field.label}</th>)}<th className="p-3">Action</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.key} className="border-t align-top" style={{ borderColor: "var(--color-border)" }}>
            <td className="p-3" data-label="Row">{index + 1}</td>
            {fields.map(field => <td key={field.key} className="p-2" data-label={field.label}><input value={row[field.key] ?? ""} disabled={busy} maxLength={200} aria-label={field.label + ", row " + (index + 1)} aria-invalid={issues[index]?.length ? true : undefined}
              onChange={event => { const value = event.target.value; setError(null); setImpact(null); setRows(current => current!.map(item => item.key === row.key ? { ...item, [field.key]: value } : item)); }}
              className="w-full min-w-[90px] rounded-md border bg-white/5 px-2 py-2 outline-none focus:border-white/40" style={{ color: "var(--color-text)", borderColor: issues[index]?.length ? "#ef969d80" : "var(--color-border)" }} />
              {field.key === "identifier" && issues[index]?.length > 0 && <ul className="mt-1 space-y-1 text-xs" style={{ color: "var(--color-accent)" }}>{issues[index].map(message => <li key={message}>{message}</li>)}</ul>}
            </td>)}
            <td className="p-3" data-label="Action"><MobileAction type="button" disabled={busy} aria-label={"Remove row " + (index + 1)} onClick={() => { setError(null); setImpact(null); setRows(current => current!.filter(item => item.key !== row.key)); }} className="text-xs hover:underline disabled:opacity-50" icon="delete" label="Remove" /></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!rows.length && <p className="mt-3 text-sm">All rows removed. Go back to choose another spreadsheet.</p>}
      {impact && <section className="mt-5 space-y-3" aria-label="Import impact">
        <h3 className="font-semibold">Review changes before saving</h3>
        <p>{impact.added} new; {impact.retained} retained; {impact.assigned} assigned from no class; {impact.transfers.length} transfers; {impact.removed.length} removed from this roster.</p>
        {impact.transfers.length > 0 && <><strong>Transfers into this class</strong><ul className="list-disc pl-5">{impact.transfers.map(item => <li key={item.admissionNumber}>{item.name} ({item.admissionNumber}) from {item.fromClass}</li>)}</ul></>}
        {impact.removed.length > 0 && <><strong>Will have no current class until reassigned</strong><ul className="list-disc pl-5">{impact.removed.map(item => <li key={item.admissionNumber}>{item.name} ({item.admissionNumber})</li>)}</ul></>}
        <p>Accounts, passwords and learning history are kept. {mode === "progression" ? "This upload replaces the class roster for " + academicYear + "." : "Unlisted learners stay in their current class."}</p>
      </section>}
      <div className="mt-5 flex justify-between gap-3">
        <button type="button" disabled={busy} onClick={() => { setRows(null); setImpact(null); setError(null); }} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50" style={{ borderColor: "var(--color-border)" }}>Back</button>
        <button type="button" onClick={save} disabled={busy || !rows.length || invalid > 0} className="rounded-lg px-5 text-sm font-bold disabled:opacity-50" style={buttonStyle}>{busy ? "Working..." : kind === "learners" && !impact ? "Review changes" : "Save " + rows.length + " " + kind}</button>
      </div>
    </div> : <form onSubmit={preview} className="flex flex-col gap-4">
      {kind === "learners" && !fixedClass && <FloatingLabelSelect id="bulk-import-class" label="Class" value={classId} onChange={value => { setClassId(value); setAcademicYear(String(classOptions.find(option => option.value === value)?.academicYear ?? new Date().getFullYear())); }} options={classOptions} disabled={busy} required />}
      {kind === "learners" && <>
        {!purpose && <RosterImportPurpose value={mode} onChange={setMode} disabled={busy} />}
        <label>Academic year<input type="number" min={classOptions.find(option => option.value === classId)?.academicYear ?? new Date().getFullYear()} max={2100} value={academicYear} disabled={mode !== "progression"} onChange={event => setAcademicYear(event.target.value)} className="ml-3 w-28 rounded border p-2" /></label>
        <p>{mode === "update" ? "Listed learners are added, corrected or transferred here. Unlisted learners stay." : "Only listed learners remain in this class for the selected year. Other accounts are preserved without a current class."}</p>
      </>}
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Columns: {kind === "staff" ? "title, " : ""}firstName, surname, {numberColumn}. Up to 500 rows and 2 MB. The first worksheet is used.</p>
      <label className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm" style={{ borderColor: "var(--color-border)" }}>
        <input type="file" accept=".xlsx,.xls,.csv" disabled={busy} className="sr-only" onChange={event => { setFile(event.target.files?.[0] ?? null); setError(null); }} />
        <strong>{file?.name ?? "Choose spreadsheet"}</strong><span className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Preview before saving</span>
      </label>
      <button type="submit" disabled={busy || !file || (kind === "learners" && !classId)} className="w-full rounded-lg text-sm font-bold disabled:opacity-50" style={buttonStyle}>{busy ? "Preparing preview..." : "Preview"}</button>
    </form>}
  </>;
  return inline ? <section className="mt-6" aria-label={"Import " + kind}>{content}</section> : <BottomSheet isOpen motion={motion} busy={busy} onClose={onClose} width={rows && saved === null ? "xl" : "md"} title={saved !== null ? "Import complete" : rows ? "Review " + kind : "Import " + kind}>{content}</BottomSheet>;
}
