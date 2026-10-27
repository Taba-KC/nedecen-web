"use client";

import AppSelect from "@/components/shared/AppSelect";

/**
 * Teacher feedback for one selected confirmed lesson. Load the last ten lessons, show the
 * selected lesson's concepts, and open count details. Add to next lesson calls the server,
 * which chooses an existing upcoming plan or a queued draft.
 */
import { useModalMotion } from "@/hooks/useModalMotion";
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
import { MobileActionContent } from "@/components/shared/MobileAction";

export type FeedbackGoal = { goalIndex: number; goal: string; yes: number; no: number; responses: number; noResponse: number };
export type FeedbackConcept = { id: number; name: string; canReview: boolean; teachingBrief?: LessonBrief | null; counts: { understood: number; notUnderstood: number; responses: number; noResponse: number }; learningGoals?: FeedbackGoal[]; noCount?: number };
export type LessonFeedbackSet = { id: number; lessonId: number; lessonNumber: number; lessonDate: string; createdAt: string; chapterName: string; totalLearners: number; concepts: FeedbackConcept[] };
type Selection = { lesson: LessonFeedbackSet; concept: FeedbackConcept };

/**
 * Show the selected concept's response counts and the action that queues it for the next
 * lesson.
 */
function ReviewAction({ selection, onAdded }: { selection: Selection; onAdded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const { lesson, concept } = selection;
  /**
   * Ask the backend to place this concept in an upcoming plan or draft. Success describes the
   * destination; it does not mark the old concept untaught.
   */
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
  const focusGoals = concept.learningGoals?.filter(goal => goal.no > 0) ?? [];
  return <div><button type="button" className={book.primary} disabled={busy || !!message || !concept.canReview} onClick={() => void add()}>{busy ? "Adding…" : message ? "Added to next lesson" : "Add related concept to next lesson"}</button>{error && <p className={book.error} role="alert">{error}</p>}{message && <><p role="status">{message}</p>{focusGoals.length > 0 && <div><p>Learning goals to focus on:</p><ul className={styles.concepts}>{focusGoals.map(goal => <li key={goal.goalIndex}>{goal.goal}</li>)}</ul></div>}</>}</div>;
}

function ConceptDialog({ selection, onClose: onDismiss, onAdded }: { selection: Selection; onClose: () => void; onAdded: () => void }) {
  const motion = useModalMotion(onDismiss);
  const onClose = motion.close;
  const { lesson, concept } = selection;
  return <TeacherDialog motion={motion} title={concept.name} onClose={onClose}>
    <p>Lesson {lesson.lessonNumber} - {dateLabel(lesson.lessonDate)}</p>
    <TeacherSection title="Learning goals" count={concept.learningGoals?.length ?? 0}>{concept.learningGoals?.length ? <ul className={styles.concepts}>{concept.learningGoals.map(goal => <li key={goal.goalIndex}><p>{goal.goal}</p><p>{goal.yes} Yes · {goal.no} No · {goal.noResponse} not answered</p></li>)}</ul> : <p>No learning goals were recorded for this lesson concept.</p>}</TeacherSection>
    <p className={styles.note}>Learners answer Yes or No for each learning goal. Unanswered goals are not counted as No.</p>
    {concept.teachingBrief && <>
      <TeacherSection title="Prerequisites for understanding it">{concept.teachingBrief.prerequisites.length ? <ul className={styles.concepts}>{concept.teachingBrief.prerequisites.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No specific prerequisites.</p>}</TeacherSection>
    </>}
    {!concept.canReview && <p className={styles.note}>This concept is no longer active in your teaching allocation.</p>}
    <footer><button type="button" onClick={onClose}>Close</button><ReviewAction selection={selection} onAdded={onAdded} /></footer>
  </TeacherDialog>;
}

/**
 * Select one of the loaded recent lessons beside the title. The selected ID determines which
 * concept list is displayed.
 */
export function LessonFeedbackFilter({ lessons, selectedId, loading, failed, onChange }: { lessons: LessonFeedbackSet[]; selectedId?: number; loading: boolean; failed: boolean; onChange: (id: number) => void }) {
  return <label className={`${book.filterDropdown} ${styles.lessonFilter}`}><span className="sr-only">Select lesson to review</span>
    <AppSelect value={selectedId ?? ""} disabled={loading || failed || lessons.length === 0} onChange={event => onChange(Number(event.target.value))}>
      {!lessons.length && <option value="">{failed ? "Feedback unavailable" : loading ? "Loading lesson…" : "No confirmed lessons yet"}</option>}
      {lessons.map(lesson => <option key={lesson.id} value={lesson.id}>Lesson {lesson.lessonNumber} - {dateLabel(lesson.lessonDate)}</option>)}
    </AppSelect>
  </label>;
}

/**
 * Render the selected lesson's already expanded concepts, including loading/error/empty
 * states and a detail modal.
 */
export function LessonFeedbackContent({ lesson, onSelectConcept, onAdded = () => {} }: { lesson: LessonFeedbackSet; onSelectConcept: (concept: FeedbackConcept) => void; onAdded?: () => void }) {
  const needingReview = lesson.concepts.filter(concept => concept.learningGoals?.some(goal => goal.no > 0));
  return <>
    <TeacherSection title="Concepts" count={lesson.concepts.length}>
      <p className={styles.note}>Concepts with the most learning goals marked No appear first.</p>
      {lesson.concepts.length ? <ul className={`${book.rows} ${styles.spacedRows}`}>{lesson.concepts.map(concept => <li key={concept.id}><button type="button" className={book.rowLink} onClick={() => onSelectConcept(concept)}><span className={styles.rowBody}><strong className={styles.singleLine}>{concept.name}</strong><small>{concept.learningGoals?.some(goal => goal.responses > 0) ? `${concept.noCount ?? 0} No responses · ${concept.learningGoals.filter(goal => goal.no > 0).length} learning goals need attention` : "No learning goal feedback yet"}</small></span><span className={book.textButton}><MobileActionContent icon="view">View</MobileActionContent></span></button></li>)}</ul> : <p className={book.empty}>No concepts are available for this lesson.</p>}
    </TeacherSection>
    <TeacherSection title="Learning goals mostly not met" count={needingReview.length}>{needingReview.length ? needingReview.map(concept => <div key={concept.id} className={styles.reviewSummary}><h3>{concept.name}</h3><ul className={styles.concepts}>{concept.learningGoals!.filter(goal => goal.no > 0).sort((a, b) => b.no - a.no || a.goalIndex - b.goalIndex).map(goal => <li key={goal.goalIndex}>{goal.goal}<br /><strong>{goal.no} of {goal.responses} responding learners marked No</strong></li>)}</ul><ReviewAction selection={{ lesson, concept }} onAdded={onAdded} /></div>) : <p className={styles.note}>No learning goals have been marked No yet.</p>}</TeacherSection>
  </>;
}

/**
 * Own the recent-feedback request and selected lesson. Keep the selector, subtitle and
 * concept list based on the same selection.
 */
export default function LessonFeedback({ subject, onAdded, selectedId, onSelectLesson }: { subject: Subject; onAdded: () => void; selectedId?: number | null; onSelectLesson?: (id: number) => void }) {
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
  const current = data?.find(lesson => lesson.id === (selectedId ?? selectedLessonId)) ?? data?.[0];
  return <>
    <TeacherPageHeading title="See lesson feedback" subtitle={current ? <>You are reviewing feedback for: <strong>Lesson {current.lessonNumber} - {dateLabel(current.lessonDate)}</strong></> : undefined} controls={<LessonFeedbackFilter lessons={data ?? []} selectedId={current?.id} loading={data === null} failed={!!error} onChange={id => { setSelectedLessonId(id); setSelection(null); onSelectLesson?.(id); }} />} />
    <div className={styles.pageContent}>
      {error ? <div className={book.viewError} role="alert"><span>{error}</span><button className={book.textButton} onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button></div> : data === null ? <p className={book.empty} role="status">Loading lesson feedback…</p> : current ? <LessonFeedbackContent lesson={current} onSelectConcept={concept => setSelection({ lesson: current, concept })} onAdded={onAdded} /> : <p className={book.empty}>No lessons have been confirmed for this class subject yet.</p>}
    </div>
    {selection && <ConceptDialog key={`${selection.lesson.id}-${selection.concept.id}`} selection={selection} onClose={() => setSelection(null)} onAdded={onAdded} />}
  </>;
}
