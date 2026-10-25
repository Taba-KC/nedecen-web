"use client";

/**
 * Create one manual question in a modal. Closing or cancelling does not add a question; Save
 * first validates the text and concept, then passes the draft back to HomeworkForm.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import TeacherDialog from "./teacher-books/TeacherDialog";
import { readManualQuestion, type ManualQuestion } from "./manualQuestion";
import styles from "@/components/principal/books/books.module.css";

export default function ManualQuestionDialog({ concepts, onSave, onClose }: { concepts: { id: number; name: string }[]; onSave: (question: ManualQuestion) => void; onClose: () => void }) {
  const [error, setError] = useState("");
  const questionField = useRef<HTMLTextAreaElement>(null);
  const saved = useRef(false);
  useEffect(() => { questionField.current?.focus(); }, []);

  /**
   * Read/validate the form and only then call onSave. An empty question or Cancel never
   * creates a draft item.
   */
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saved.current) return;
    const fields = new FormData(event.currentTarget);
    const question = readManualQuestion({ conceptId: Number(fields.get("conceptId")), body: String(fields.get("body") ?? ""), memo: String(fields.get("memo") ?? "") }, concepts);
    if (!question) {
      setError("Enter a question and choose a concept from this lesson.");
      questionField.current?.focus();
      return;
    }
    saved.current = true;
    onSave(question);
    onClose();
  }

  return <TeacherDialog title="Add a question" onClose={onClose}>
    <form onSubmit={save}>
      <label>Concept<select name="conceptId" required defaultValue={concepts[0]?.id}>{concepts.map(concept => <option key={concept.id} value={concept.id}>{concept.name}</option>)}</select></label>
      <label>Question<textarea ref={questionField} name="body" required maxLength={12000} rows={5} aria-invalid={!!error} aria-describedby={error ? "manual-question-error" : undefined} /></label>
      <label>Worked memo (optional)<textarea name="memo" maxLength={24000} rows={4} /></label>
      {error && <p id="manual-question-error" className={styles.error} role="alert">{error}</p>}
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" className={styles.primary}>Save</button></footer>
    </form>
  </TeacherDialog>;
}
