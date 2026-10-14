"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";

type Row = { title: string; firstName: string; surname: string; identifier: string };
type EditableRow = Row & { key: number };
interface Preview { rows: Row[]; existingIdentifiers: string[] }

export function RosterImportModal({ schoolId, kind, onClose, onSaved, classOptions = [], initialClassId = "", fixedClass = false }: {
  schoolId: number; kind: "staff" | "learners"; onClose: () => void; onSaved: () => Promise<void>;
  classOptions?: { value: string; label: string }[]; initialClassId?: string; fixedClass?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [classId, setClassId] = useState(initialClassId);
  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const [existing, setExisting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const numberLabel = kind === "staff" ? "Staff number" : "Admission number";
  const numberColumn = kind === "staff" ? "staffNumber" : "admissionNumber";
  const target = classOptions.find(option => option.value === classId)?.label;
  const base = "/schools/" + schoolId + (kind === "staff" ? "/people/import" : "/classes/" + classId + "/learners/import");
  const fields: { key: keyof Row; label: string }[] = [
    { key: "title", label: "Title" }, { key: "firstName", label: "First name" }, { key: "surname", label: "Surname" }, { key: "identifier", label: numberLabel },
  ];
  const issues = useMemo(() => {
    const existingNumbers = new Set(existing.map(value => value.trim().toLowerCase()));
    const counts = new Map<string, number>();
    for (const row of rows ?? []) { const id = row.identifier.trim().toLowerCase(); if (id) counts.set(id, (counts.get(id) ?? 0) + 1); }
    return (rows ?? []).map(row => {
      const errors: string[] = [];
      if (!row.title.trim()) errors.push("Title is required");
      if (!row.firstName.trim()) errors.push("First name is required");
      if (!row.surname.trim()) errors.push("Surname is required");
      if (!row.identifier.trim()) errors.push(numberLabel + " is required");
      if (Object.values(row).some(value => typeof value === "string" && value.length > 200)) errors.push("Use at most 200 characters per field");
      const id = row.identifier.trim().toLowerCase();
      if (id && existingNumbers.has(id)) errors.push(numberLabel + " already exists in this school");
      if (id && (counts.get(id) ?? 0) > 1) errors.push(numberLabel + " is repeated in this preview");
      return errors;
    });
  }, [rows, existing, numberLabel]);
  const invalid = issues.filter(issue => issue.length).length;

  async function preview(event: React.FormEvent) {
    event.preventDefault();
    if (!file || (kind === "learners" && !classId) || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(null);
    try {
      const data = new FormData(); data.append("file", file);
      const result = await api.upload<Preview>(base + "/preview", data);
      if (!mounted.current) return;
      setRows(result.rows.map((row, key) => ({ ...row, key })));
      setExisting(result.existingIdentifiers);
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "Could not preview spreadsheet."); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  async function save() {
    if (!rows?.length || invalid || inFlight.current || saved !== null) return;
    inFlight.current = true; setBusy(true); setError(null);
    try {
      const result = await api.post<{ saved: number }>(base + "/commit", { rows: rows.map(({ title, firstName, surname, identifier }) => ({ title, firstName, surname, identifier })) });
      if (!mounted.current) return;
      setSaved(result.saved);
      try { await onSaved(); } catch { setError("Saved successfully. Refresh the list to see the new records."); }
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "Could not save records."); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const buttonStyle = { height: "var(--control-height)", backgroundColor: "var(--grade-action-bg)", color: "#ffffff" };
  return <BottomSheet isOpen onClose={() => { if (!inFlight.current) onClose(); }} width={rows && saved === null ? "xl" : "md"} title={saved !== null ? "Import complete" : rows ? "Review " + kind : "Import " + kind}>
    {kind === "learners" && target && <p className="mb-4 text-sm font-semibold" style={{ color: "var(--color-text)" }}>Adding to {target}</p>}
    {error && <p role="alert" className="mb-4 text-sm" style={{ color: "var(--color-accent)" }}>{error}</p>}
    {saved !== null ? <div className="space-y-4">
      <p role="status" className="text-sm">{saved} {kind === "staff" ? "staff member" + (saved === 1 ? "" : "s") : "learner" + (saved === 1 ? "" : "s")} added. Their accounts are ready to claim.</p>
      <button type="button" onClick={onClose} disabled={busy} className="w-full rounded-lg text-sm font-bold disabled:opacity-50" style={buttonStyle}>Done</button>
    </div> : rows ? <div>
      <p className="mb-3 text-sm" style={{ color: "var(--color-text-muted)" }}>Nothing has been saved yet. Edit any cell or remove rows before saving.</p>
      <p role="status" className="mb-4 text-sm">{rows.length} rows · {invalid ? invalid + " need attention" : "Ready to save"}</p>
      <div className="max-h-[50vh] overflow-auto rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="sticky top-0 z-10" style={{ background: "#292929" }}><tr><th className="p-3">Row</th>{fields.map(field => <th key={field.key} className="p-3">{field.label}</th>)}<th className="p-3">Action</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.key} className="border-t align-top" style={{ borderColor: "var(--color-border)" }}>
            <td className="p-3">{index + 1}</td>
            {fields.map(field => <td key={field.key} className="p-2"><input value={row[field.key]} disabled={busy} maxLength={200} aria-label={field.label + ", row " + (index + 1)} aria-invalid={issues[index]?.length ? true : undefined}
              onChange={event => { const value = event.target.value; setError(null); setRows(current => current!.map(item => item.key === row.key ? { ...item, [field.key]: value } : item)); }}
              className="w-full min-w-[90px] rounded-md border bg-white/5 px-2 py-2 outline-none focus:border-white/40" style={{ color: "var(--color-text)", borderColor: issues[index]?.length ? "#ef969d80" : "var(--color-border)" }} />
              {field.key === "identifier" && issues[index]?.length > 0 && <ul className="mt-1 space-y-1 text-xs" style={{ color: "var(--color-accent)" }}>{issues[index].map(message => <li key={message}>{message}</li>)}</ul>}
            </td>)}
            <td className="p-3"><button type="button" disabled={busy} aria-label={"Remove row " + (index + 1)} onClick={() => { setError(null); setRows(current => current!.filter(item => item.key !== row.key)); }} className="text-xs hover:underline disabled:opacity-50">Remove</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!rows.length && <p className="mt-3 text-sm">All rows removed. Go back to choose another spreadsheet.</p>}
      <div className="mt-5 flex justify-between gap-3">
        <button type="button" disabled={busy} onClick={() => { setRows(null); setError(null); }} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50" style={{ borderColor: "var(--color-border)" }}>Back</button>
        <button type="button" onClick={save} disabled={busy || !rows.length || invalid > 0} className="rounded-lg px-5 text-sm font-bold disabled:opacity-50" style={buttonStyle}>{busy ? "Saving..." : "Save " + rows.length + " " + kind}</button>
      </div>
    </div> : <form onSubmit={preview} className="flex flex-col gap-4">
      {kind === "learners" && !fixedClass && <FloatingLabelSelect id="bulk-import-class" label="Class" value={classId} onChange={setClassId} options={classOptions} disabled={busy} required />}
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Columns: title, firstName, surname, {numberColumn}. Up to 500 rows and 2 MB. The first worksheet is used.</p>
      <label className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm" style={{ borderColor: "var(--color-border)" }}>
        <input type="file" accept=".xlsx,.xls,.csv" disabled={busy} className="sr-only" onChange={event => { setFile(event.target.files?.[0] ?? null); setError(null); }} />
        <strong>{file?.name ?? "Choose spreadsheet"}</strong><span className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>Preview before saving</span>
      </label>
      <button type="submit" disabled={busy || !file || (kind === "learners" && !classId)} className="w-full rounded-lg text-sm font-bold disabled:opacity-50" style={buttonStyle}>{busy ? "Preparing preview..." : "Preview"}</button>
    </form>}
  </BottomSheet>;
}
