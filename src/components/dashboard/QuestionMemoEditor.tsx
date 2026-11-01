"use client";

import { useId, useRef, useState } from "react";
import { api } from "@/lib/api";
import styles from "./role-dashboard.module.css";

/** Generated answers remain editable drafts until the teacher explicitly saves them. */
export default function QuestionMemoEditor({ question, onSaved, terminology = "memo", allowAI = false, aiAvailable = false }: {
  question: { id: number; body: string; memo?: string | null }; onSaved: () => void;
  terminology?: "memo" | "answer"; allowAI?: boolean; aiAvailable?: boolean;
}) {
  const [editing, setEditing] = useState(false), [memo, setMemo] = useState(question.memo ?? "");
  const [busy, setBusy] = useState<"save" | "generate" | null>(null), [error, setError] = useState("");
  const [note, setNote] = useState(""), [candidate, setCandidate] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ source: string | null | undefined; value: string } | null>(null);
  const [message, setMessage] = useState("");
  const pending = useRef(false), fieldId = useId(), noteId = useId();
  const currentMemo = saved && saved.source === question.memo ? saved.value : question.memo ?? "";
  function edit() { setMemo(currentMemo); setError(""); setMessage(""); setCandidate(null); setEditing(true); }
  async function save() {
    if (pending.current || candidate !== null) return;
    pending.current = true; setBusy("save"); setError("");
    try {
      const result = await api.patch<{ id: number; memo: string | null }>(`/staff/questions/${question.id}/memo`, { memo });
      setSaved({ source: question.memo, value: result.memo ?? "" }); setEditing(false);
      setMessage(terminology === "answer" ? "Answer saved." : "Memo saved."); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : `Could not update ${terminology}.`); }
    finally { pending.current = false; setBusy(null); }
  }
  async function generate() {
    if (pending.current || !aiAvailable) return;
    const draft = editing ? memo : currentMemo;
    if (!editing) { setMemo(draft); setEditing(true); }
    pending.current = true; setBusy("generate"); setError(""); setMessage("");
    try {
      const result = await api.post<{ memo: string }>(`/staff/questions/${question.id}/generate-memo`, { memo: draft, note });
      setCandidate(result.memo);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not generate an answer. Your draft is unchanged."); }
    finally { pending.current = false; setBusy(null); }
  }
  const aiButton = allowAI && <button type="button" className={styles.textButton} disabled={!!busy || !aiAvailable} title={!aiAvailable ? "AI generation is not configured. You can still write the answer manually." : undefined} onClick={() => void generate()}>{busy === "generate" ? "Generating answer…" : "Generate answer with AI"}</button>;
  return <div className={styles.historyQuestion}>
    <p>{question.body}</p>
    {editing ? <div className={styles.workflowForm}>
      <label htmlFor={fieldId}>Worked {terminology} (optional)</label><textarea id={fieldId} rows={6} maxLength={24000} value={memo} onChange={event => { setMemo(event.target.value); setMessage(""); }} disabled={!!busy} />
      {allowAI && <><label htmlFor={noteId}>AI guidance (optional)</label><textarea id={noteId} rows={2} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} disabled={!!busy} />{aiButton}</>}
      {busy === "generate" && <p role="status">Generating a draft answer…</p>}
      {candidate !== null && <section className={styles.memoDraft} aria-label="AI answer draft"><h4>AI answer draft</h4><p className={styles.savedMemo}>{candidate}</p><div className={styles.formActions}>
        <button type="button" className={styles.button} disabled={!!busy} onClick={() => { setMemo(candidate); setCandidate(null); setMessage("AI draft added. Review it, then save the answer."); }}>Use draft</button>
        <button type="button" className={styles.textButton} disabled={!!busy} onClick={() => void generate()}>Try again</button>
        <button type="button" className={styles.textButton} disabled={!!busy} onClick={() => setCandidate(null)}>Discard draft</button>
      </div></section>}
      {error && <p className={styles.formError} role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <div className={styles.formActions}><button type="button" className={styles.button} disabled={!!busy || candidate !== null} onClick={() => void save()}>{busy === "save" ? "Saving…" : `Save ${terminology}`}</button><button type="button" className={styles.textButton} disabled={!!busy} onClick={() => { setEditing(false); setCandidate(null); }}>Cancel</button></div>
    </div> : <>
      <p className={styles.savedMemo}>{currentMemo.trim() ? currentMemo : `No ${terminology} yet`}</p>
      <div className={styles.formActions}><button type="button" className={styles.textButton} onClick={edit}>{`${currentMemo.trim() ? "Edit" : "Add"} ${terminology}`}</button>{aiButton}</div>
      {message && <p role="status">{message}</p>}
    </>}
  </div>;
}
