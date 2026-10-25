"use client";

/**
 * Plan a lesson from the server's eligible concepts: the first ten untaught concepts plus
 * queued reviews. Checkbox state is a draft until Save. Shared guidance comes from
 * curriculum records; custom concepts belong only to this class subject.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { Subject } from "./RoleDashboard";
import TeacherSection from "./teacher-books/TeacherSection";
import TeacherDialog from "./teacher-books/TeacherDialog";
import ConceptRows from "./teacher-books/ConceptRows";
import book from "@/components/principal/books/books.module.css";
import styles from "./role-dashboard.module.css";
import local from "./teacher-books/teacher-books.module.css";

type PlanningConcept = { id: number; name: string; topicId: number; prerequisites: string[]; learningOutcomes: string[] };
type Planning = {
  chapter: Subject["curriculum"][number] | null;
  customConcepts: PlanningConcept[];
  reviewConcepts?: PlanningConcept[];
  planningConcepts?: PlanningConcept[];
  taughtConceptIds: number[];
  flaggedConcepts: { id: number; name: string; didntUnderstand: number; totalLearners: number }[];
  suggestedDate: string;
};
type CustomConcept = { name: string; topicId: number };

/**
 * Edit one class-specific concept draft. Save reports it to the parent; it is not inserted
 * into the shared curriculum.
 */
function CustomConceptDialog({ topics, initial, onSave, onClose }: { topics: { id: number; name: string }[]; initial?: CustomConcept; onSave: (concept: CustomConcept) => void; onClose: () => void }) {
  const [error, setError] = useState("");
  const nameField = useRef<HTMLInputElement>(null);
  useEffect(() => { nameField.current?.focus(); }, []);
  /**
   * Validate this one custom concept and pass it to the parent draft; no database write
   * happens in this modal.
   */
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    const topicId = Number(fields.get("topicId"));
    if (!name || !topics.some(topic => topic.id === topicId)) { setError("Enter a concept and choose a topic."); return; }
    onSave({ name, topicId }); onClose();
  }
  return <TeacherDialog title={initial ? "Custom concept" : "Add a concept"} onClose={onClose}><form onSubmit={save}>
    <label>Concept<input ref={nameField} name="name" required maxLength={500} defaultValue={initial?.name} /></label>
    <label>Topic<select name="topicId" defaultValue={initial?.topicId ?? topics[0]?.id}>{topics.map(topic => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
    <p className={local.note}>This concept belongs to this class subject. It does not change the shared curriculum.</p>
    {error && <p className={book.error} role="alert">{error}</p>}
    <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" className={book.primary}>Save</button></footer>
  </form></TeacherDialog>;
}

/**
 * Load server-approved planning choices, keep selected IDs locally and submit the explicit
 * selection when the teacher saves.
 */
export default function PlanLessonForm({ subject, onSaved }: { subject: Subject; onSaved: () => void }) {
  const [data, setData] = useState<Planning | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [date, setDate] = useState("");
  const [custom, setCustom] = useState<CustomConcept[]>([]);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [attempt, setAttempt] = useState(0);
  /**
   * Load only the choices the backend permits for this allocation. Queued review concepts
   * begin checked; a late response is ignored after switching away.
   */
  useEffect(() => {
    let active = true;
    api.get<Planning>(`/staff/class-subjects/${subject.id}/planning`).then(result => {
      if (!active) return;
      setData(result); setDate(result.suggestedDate);
      setSelected((result.reviewConcepts ?? []).map(concept => concept.id));
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load lesson concepts."); });
    return () => { active = false; };
  }, [subject.id, attempt]);

  /**
   * Create a new selected-ID array when checking/unchecking a concept so React notices the
   * state change.
   */
  function toggle(id: number) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  /**
   * Send the selected concept IDs and date to create the plan, then refresh the parent after
   * success.
   */
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!data?.chapter || busy) return;
    setBusy(true); setError("");
    try {
      /**
       * Send selected IDs separately from the suggestions shown. This lets the server consume
       * reviewed suggestions even when the teacher unchecked them.
       */
      await api.post(`/staff/class-subjects/${subject.id}/plans`, { chapterId: data.chapter.id, date, conceptIds: selected, reviewConceptIds: (data.reviewConcepts ?? []).map(concept => concept.id), customConcepts: custom });
      setSaved(true); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save this plan."); }
    finally { setBusy(false); }
  }
  if (saved) return <div className={local.statusMessage} role="status"><h2>Lesson plan saved</h2><p>Your class can preview the planned concepts. Confirm what was taught after the lesson to update coverage.</p></div>;
  if (!data) return error ? <div className={book.viewError} role="alert"><span>{error}</span><button className={book.textButton} onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button></div> : <p className={book.empty} role="status">Loading lesson concepts…</p>;
  if (!data.chapter) return <p className={book.empty}>No curriculum is available for this teaching allocation yet. Your school manages this list.</p>;
  const chapter = data.chapter;
  /**
   * Display the backend's curriculum order. Do not reinsert all previously taught concepts
   * here.
   */
  const ordered = data.planningConcepts ?? [];
  const correctionIds = (data.reviewConcepts ?? []).map(concept => concept.id);
  const concepts = ordered.map(concept => {
    const flag = data.flaggedConcepts.find(item => item.id === concept.id);
    return { ...concept, detail: [correctionIds.includes(concept.id) ? "Added from lesson feedback" : "Not taught yet", flag ? `${flag.didntUnderstand} of ${flag.totalLearners} learners need help` : ""].filter(Boolean).join(" · ") };
  });
  return <>
    <form onSubmit={save} className={`${styles.workflowForm} ${local.compactForm}`}><fieldset disabled={busy}>
      <TeacherSection title="Concepts" count={concepts.length + custom.length} action={<button type="button" className={book.contextButton} disabled={!chapter.topics.length || custom.length >= 20} onClick={() => setEditing("new")}>+ Add a concept</button>}>
        <p className={local.note}>The first 10 untaught concepts, in curriculum order.{!!correctionIds.length && " Concepts added from lesson feedback are checked; uncheck any you don’t want to include."}</p>
        {concepts.length ? <ConceptRows concepts={concepts} selectedIds={selected} onToggle={toggle} /> : <p className={book.empty}>All available concepts have been taught. Add concepts to a lesson from lesson feedback when you want to revisit them.</p>}
        {custom.length > 0 && <ul className={`${book.rows} ${local.spacedRows}`}>{custom.map((concept, index) => <li key={index}><div className={local.rowBody}><strong className={local.singleLine}>{concept.name}</strong><small className={local.rowDetail}>Custom concept</small></div><button type="button" className={book.textButton} onClick={() => setEditing(index)}>Edit concept</button><button type="button" className={book.textButton} onClick={() => setCustom(current => current.filter((_, i) => i !== index))}>Remove</button></li>)}</ul>}
      </TeacherSection>
      <hr className={local.sectionDivider} />
      <label className={local.inlineField}><span>Lesson date:</span><input type="date" required value={date} onChange={event => setDate(event.target.value)} /></label>
      {error && <p role="alert" className={styles.formError}>{error}</p>}
      <button className={styles.primaryButton} disabled={busy || (!selected.length && !custom.length)}>{busy ? "Saving…" : "Save lesson plan"}</button>
    </fieldset></form>
    {editing !== null && <CustomConceptDialog key={editing} topics={chapter.topics} initial={typeof editing === "number" ? custom[editing] : undefined} onClose={() => setEditing(null)} onSave={concept => setCustom(current => typeof editing === "number" ? current.map((row, i) => i === editing ? concept : row) : [...current, concept])} />}
  </>;
}
