"use client";

/**
 * View and edit a single draft question in full. Local edits reach the parent only after
 * Save. Memo regeneration asks the backend for a replacement draft; the teacher still
 * decides whether to keep it.
 */
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import TeacherDialog from "./teacher-books/TeacherDialog";
import { readManualQuestion, type ManualQuestion } from "./manualQuestion";
import styles from "@/components/principal/books/books.module.css";
import local from "./homework.module.css";

export default function HomeworkQuestionDialog({ number, question, concepts, lessonId, aiAvailable, onSave, onClose }: {
  number: number; question: ManualQuestion; concepts: { id: number; name: string }[]; lessonId: number; aiAvailable: boolean; onSave: (question: ManualQuestion) => void; onClose: () => void;
}) {
  const [conceptId, setConceptId] = useState(question.conceptId);
  const [body, setBody] = useState(question.body);
  const [memo, setMemo] = useState(question.memo);
  const [note, setNote] = useState("");
  const [correction, setCorrection] = useState(false);
  const [candidate, setCandidate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /**
   * Request a proposed worked memo using the teacher's correction note. Keep the edited draft
   * in the dialog until Save.
   */
  async function regenerate() {
    if (busy || !body.trim() || !note.trim()) return;
    setBusy(true); setError("");
    try {
      const result = await api.post<{ memo: string }>(`/staff/lessons/${lessonId}/regenerate-memo`, { conceptId, body, memo, note });
      setCandidate(result.memo);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not regenerate this memo."); }
    finally { setBusy(false); }
  }
  /**
   * Validate the edited question and pass accepted values to the parent; closing the dialog
   * without this step discards its local edits.
   */
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || candidate !== null) return;
    const value = readManualQuestion({ conceptId, body, memo }, concepts);
    if (!value) { setError("Enter a question and choose a concept from this lesson."); return; }
    onSave(value); onClose();
  }

  return <TeacherDialog title={`Question ${number}`} onClose={onClose} busy={busy}>
    <form onSubmit={save}><fieldset disabled={busy} className={local.dialogFields}>
      <label>Based on<select value={conceptId} onChange={event => { setConceptId(Number(event.target.value)); setCandidate(null); }}>{concepts.map(concept => <option key={concept.id} value={concept.id}>{concept.name}</option>)}</select></label>
      <label>Question<textarea required maxLength={12000} rows={5} value={body} onChange={event => { setBody(event.target.value); setCandidate(null); }} /></label>
      <label>Worked memo (optional)<textarea maxLength={24000} rows={6} value={memo} onChange={event => { setMemo(event.target.value); setCandidate(null); }} /></label>
      {aiAvailable && <button type="button" className={styles.textButton} onClick={() => setCorrection(!correction)}>{memo ? "Flag memo as wrong" : "Generate a memo"}</button>}
      {correction && <><label>{memo ? "What is wrong with this memo?" : "What should the worked answer cover?"}<textarea maxLength={2000} rows={3} value={note} onChange={event => setNote(event.target.value)} /></label><button type="button" className={styles.contextButton} disabled={busy || !note.trim() || !body.trim()} onClick={() => void regenerate()}>{busy ? "Generating…" : "Regenerate this memo"}</button></>}
      {candidate !== null && <section className={local.memoComparison}><h3>Review replacement memo</h3><p>Previous memo</p><del>{memo || "No memo"}</del><p>New memo</p><div className={local.fullText}>{candidate}</div><div className={local.questionActions}><button type="button" className={styles.textButton} onClick={() => { setMemo(candidate); setCandidate(null); setCorrection(false); }}>Keep this</button><button type="button" className={styles.textButton} onClick={() => void regenerate()}>Try again</button><button type="button" className={styles.textButton} onClick={() => setCandidate(null)}>Discard</button></div></section>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {busy && <p role="status">Generating a replacement memo…</p>}
      {candidate !== null && <p>Keep or discard the replacement memo before saving.</p>}
      <footer><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={styles.primary} disabled={busy || !body.trim() || candidate !== null}>Save</button></footer>
    </fieldset></form>
  </TeacherDialog>;
}
