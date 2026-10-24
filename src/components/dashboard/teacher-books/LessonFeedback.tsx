"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { dateLabel } from "./registry";
import type { Subject } from "../RoleDashboard";
import TeacherDialog from "./TeacherDialog";
import TeacherSection from "./TeacherSection";
import TeacherPageHeading from "./TeacherPageHeading";
import book from "@/components/principal/books/books.module.css";
import styles from "./teacher-books.module.css";
import type { LessonBrief } from "../lessonBrief";

export type FeedbackConcept = { id: number; name: string; canReview: boolean; teachingBrief?: LessonBrief | null; counts: { understood: number; notUnderstood: number; responses: number; noResponse: number } };
export type LessonFeedbackSet = { id: number; lessonId: number; lessonNumber: number; lessonDate: string; createdAt: string; chapterName: string; totalLearners: number; concepts: FeedbackConcept[] };
type Selection = { lesson: LessonFeedbackSet; concept: FeedbackConcept };

function ConceptDialog({ selection, onClose, onAdded }: { selection: Selection; onClose: () => void; onAdded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const { lesson, concept } = selection;
  async function add() {
    if (submitting.current || message) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const result = await api.post<{ destination: "lesson" | "draft"; date: string | null }>(`/staff/lessons/${lesson.id}/review-concepts`, { conceptId: concept.id });
      setMessage(result.destination === "lesson" && result.date ? `Added to your planned lesson on ${dateLabel(result.date)}, in curriculum order.` : "Saved to your next lesson draft. This concept will be included automatically when you plan the next lesson.");
      onAdded();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add this concept. Please try again."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <TeacherDialog title={concept.name} onClose={onClose} busy={busy}>
    <p>Lesson {lesson.lessonNumber} - {dateLabel(lesson.lessonDate)}</p>
    <TeacherSection title="Understanding" count={concept.counts.responses}><ul className={`${book.rows} ${styles.spacedRows}`}>{[
      ["I get it", concept.counts.understood], ["I don’t get it", concept.counts.notUnderstood], ["No response yet", concept.counts.noResponse],
    ].map(([label, count]) => <li key={label}><div className={book.rowText}><strong>{label}</strong></div><span className={book.badge}>{count} {count === 1 ? "learner" : "learners"}</span></li>)}</ul></TeacherSection>
    <p className={styles.note}>Each learner gives one response per concept for this lesson.</p>
    {concept.teachingBrief && <>
      <TeacherSection title="Prerequisites for understanding it">{concept.teachingBrief.prerequisites.length ? <ul className={styles.concepts}>{concept.teachingBrief.prerequisites.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No specific prerequisites.</p>}</TeacherSection>
      <TeacherSection title="Learning outcomes"><ul className={styles.concepts}>{concept.teachingBrief.learningOutcomes.map((item, index) => <li key={index}>{item}</li>)}</ul></TeacherSection>
    </>}
    {!concept.canReview && <p className={styles.note}>This concept is no longer active in your teaching allocation.</p>}
    {error && <p className={book.error} role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <footer><button type="button" onClick={onClose} disabled={busy}>Close</button><button type="button" className={book.primary} disabled={busy || !!message || !concept.canReview} onClick={() => void add()}>{busy ? "Adding…" : message ? "Added to next lesson" : "Add to next lesson"}</button></footer>
  </TeacherDialog>;
}

export function LessonFeedbackFilter({ lessons, selectedId, loading, failed, onChange }: { lessons: LessonFeedbackSet[]; selectedId?: number; loading: boolean; failed: boolean; onChange: (id: number) => void }) {
  return <label className={`${book.filterDropdown} ${styles.lessonFilter}`}><span className="sr-only">Select lesson to review</span>
    <select value={selectedId ?? ""} disabled={loading || failed || lessons.length === 0} onChange={event => onChange(Number(event.target.value))}>
      {!lessons.length && <option value="">{failed ? "Feedback unavailable" : loading ? "Loading lesson…" : "No confirmed lessons yet"}</option>}
      {lessons.map(lesson => <option key={lesson.id} value={lesson.id}>Lesson {lesson.lessonNumber} - {dateLabel(lesson.lessonDate)}</option>)}
    </select>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
  </label>;
}

export function LessonFeedbackContent({ lesson, onSelectConcept }: { lesson: LessonFeedbackSet; onSelectConcept: (concept: FeedbackConcept) => void }) {
  return <>
    <TeacherSection title="Concepts" count={lesson.concepts.length}>
      <p className={styles.note}>Least understood concepts appear first.</p>
      {lesson.concepts.length ? <ul className={`${book.rows} ${styles.spacedRows}`}>{lesson.concepts.map(concept => <li key={concept.id}><button type="button" className={book.rowLink} onClick={() => onSelectConcept(concept)}><span className={styles.rowBody}><strong className={styles.singleLine}>{concept.name}</strong><small>{concept.counts.responses ? `${concept.counts.understood} get it · ${concept.counts.notUnderstood} don’t get it` : "No feedback yet"}</small></span><span className={book.textButton}>View</span></button></li>)}</ul> : <p className={book.empty}>No concepts are available for this lesson.</p>}
    </TeacherSection>
  </>;
}

export default function LessonFeedback({ subject, onAdded }: { subject: Subject; onAdded: () => void }) {
  const [data, setData] = useState<LessonFeedbackSet[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  useEffect(() => {
    let active = true;
    api.get<LessonFeedbackSet[]>(`/staff/class-subjects/${subject.id}/lesson-feedback`).then(result => { if (active) { setData(result); setError(""); } }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load lesson feedback."); });
    return () => { active = false; };
  }, [subject, attempt]);
  const current = data?.find(lesson => lesson.id === selectedLessonId) ?? data?.[0];
  return <>
    <TeacherPageHeading title="See lesson feedback" subtitle={current ? <>You are reviewing feedback for: <strong>Lesson {current.lessonNumber} - {dateLabel(current.lessonDate)}</strong></> : undefined} controls={<LessonFeedbackFilter lessons={data ?? []} selectedId={current?.id} loading={data === null} failed={!!error} onChange={id => { setSelectedLessonId(id); setSelection(null); }} />} />
    <div className={styles.pageContent}>
      {error ? <div className={book.viewError} role="alert"><span>{error}</span><button className={book.textButton} onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button></div> : data === null ? <p className={book.empty} role="status">Loading lesson feedback…</p> : current ? <LessonFeedbackContent lesson={current} onSelectConcept={concept => setSelection({ lesson: current, concept })} /> : <p className={book.empty}>No lessons have been confirmed for this class subject yet.</p>}
    </div>
    {selection && <ConceptDialog key={`${selection.lesson.id}-${selection.concept.id}`} selection={selection} onClose={() => setSelection(null)} onAdded={onAdded} />}
  </>;
}
