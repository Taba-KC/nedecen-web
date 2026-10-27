"use client";

/**
 * Choose the body component for a teacher page.kind. Class/subject nodes show links; task
 * nodes open planning, confirmation or homework forms. This dispatch connects registry page
 * objects to real UI.
 */
import MobileAction from "@/components/shared/MobileAction";
import { useId, useState } from "react";
import type { Subject } from "../RoleDashboard";
import PlanLessonForm from "../PlanLessonForm";
import ConfirmLessonForm from "../ConfirmLessonForm";
import HomeworkForm from "../HomeworkForm";
import type { HomeworkMode } from "../HomeworkMethodFilters";
import { allocationName, dateLabel, lessonName, today, type TeacherBookId, type TeacherPage } from "./registry";
import LessonFeedback from "./LessonFeedback";
import TeacherDialog from "./TeacherDialog";
import TeacherSection from "./TeacherSection";
import ConceptRows from "./ConceptRows";
import { Collapse } from "@/components/shared/Motion";
import book from "@/components/principal/books/books.module.css";
import workflow from "../role-dashboard.module.css";
import styles from "./teacher-books.module.css";

export type Navigate = (bookId?: TeacherBookId, pageId?: string, lessonId?: number) => void;
type Props = { bookId: TeacherBookId; page: TeacherPage; navigate: Navigate; refresh: () => void; selectedLessonId: number | null; homeworkMode?: HomeworkMode };
const formClass = `${workflow.paperWorkflows} ${styles.workflow}`;

/**
 * Display a supplied taught/total count. Confirmation on the backend determines coverage;
 * rendering this number does not change it.
 */
export function Coverage({ subject }: { subject: Subject }) {
  const percentage = subject.totalConcepts ? Math.round(subject.taughtConcepts / subject.totalConcepts * 100) : 0;
  return <div className={styles.coverage}><div><span>{subject.taughtConcepts} / {subject.totalConcepts} concepts taught</span><strong>{percentage}%</strong></div><progress value={subject.taughtConcepts} max={subject.totalConcepts || 1} aria-label={`Confirmed curriculum coverage for ${allocationName(subject)}`} /></div>;
}
const Section = TeacherSection;
/**
 * Show child-page links using the workspace navigation callback so URL and contents
 * selection stay in sync.
 */
export function PageLinks({ pages, bookId, navigate, empty }: { pages: TeacherPage[]; bookId: TeacherBookId; navigate: Navigate; empty: string }) {
  const description = (page: TeacherPage) => page.chapter ? `${page.chapter.taught} / ${page.chapter.total} concepts taught` : page.kind === "subject" ? page.subject?.currentChapter?.name ?? "Curriculum pending" : page.kind === "plan" ? "Choose concepts and a lesson date" : page.kind === "confirm" ? "Record the concepts you taught" : page.kind === "compose" ? "Prepare questions from a taught lesson" : page.kind === "lesson-feedback" ? "Review understanding and plan corrections" : "Open this page";
  return pages.length ? <ul className={`${book.rows} ${styles.spacedRows}`}>{pages.map(page => <li key={page.id}><div className={styles.rowBody}><strong className={styles.singleLine}>{page.title}</strong><small className={styles.rowDetail}>{description(page)}</small></div><MobileAction icon="right" label={`Open ${page.title}`} className={book.textButton} onClick={() => navigate(bookId, page.id)}>Open</MobileAction></li>)}</ul> : <p className={book.empty}>{empty}</p>;
}

/**
 * Expand plans in place so concepts sit beneath their lesson. Guidance opens from those
 * concepts; the confirmation dialog focuses on selecting what was taught.
 */
function ConfirmTaughtLessons({ subject, selectedLessonId, navigate, refresh }: { subject: Subject; selectedLessonId: number | null; navigate: Navigate; refresh: () => void }) {
  const [expanded, setExpanded] = useState<number[]>([]);
  const [selected, setSelected] = useState<Subject["lessons"][number] | null>(() => subject.lessons.find(lesson => lesson.id === selectedLessonId && lesson.status === "planned" && lesson.date <= today()) ?? null);
  const [confirming, setConfirming] = useState(false);
  const prefix = useId();
  const planned = subject.lessons.filter(lesson => lesson.status === "planned").toSorted((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  return <>
    <p className={styles.contextLine}>You are confirming lessons for: <strong>{allocationName(subject)}</strong></p>
    <Section title="Lessons to confirm" count={planned.length}>{planned.length ? <ul className={`${book.rows} ${styles.spacedRows} ${styles.plannedLessons}`}>{planned.map(lesson => {
      const open = expanded.includes(lesson.id);
      const title = `${lessonName(lesson, subject)} - ${dateLabel(lesson.date)}`;
      const conceptsId = `${prefix}-concepts-${lesson.id}`;
      return <li key={lesson.id}>
        <div className={styles.lessonHeading}>
          <div className={styles.rowBody}><h3><button type="button" className={styles.lessonToggle} aria-expanded={open} aria-controls={conceptsId} onClick={() => setExpanded(current => open ? current.filter(id => id !== lesson.id) : [...current, lesson.id])}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg><span>{title}</span></button></h3><small>{lesson.concepts.length} {lesson.concepts.length === 1 ? "concept" : "concepts"}</small></div>
        </div>
        <Collapse open={open} id={conceptsId} className={styles.lessonConcepts} role="region" aria-label={`${title} concepts`}>
          {lesson.concepts.length ? <ConceptRows concepts={lesson.concepts} /> : <p className={styles.note}>No concepts were added to this lesson.</p>}
        </Collapse>
        <div className={`${styles.pageActions} ${styles.lessonConfirmation}`}>
          {lesson.date <= today() ? <MobileAction type="button" className={book.textButton} onClick={() => setSelected(lesson)} icon="confirm" label="Confirm taught lesson" /> : <span className={book.badge}>Available on {dateLabel(lesson.date)}</span>}
        </div>
      </li>;
    })}</ul> : <p className={book.empty}>No lesson plans are waiting for confirmation. Plan the next lesson to get started.</p>}</Section>
    {selected && <TeacherDialog title="Confirm taught lesson" onClose={() => setSelected(null)} busy={confirming}>
        <p>{allocationName(subject)} · {dateLabel(selected.date)}</p>
        <div className={workflow.paperWorkflows}><ConfirmLessonForm key={selected.id} lesson={selected} subject={subject} onConfirmed={refresh} onBusyChange={setConfirming} onHomework={() => navigate("homework", `compose-${subject.id}`, selected.id)} /></div>
    </TeacherDialog>}
  </>;
}

/**
 * Dispatch the selected kind to its form or list. A new kind in the registry needs a
 * matching branch here to become a usable page.
 */
export default function TeacherBookPage({ bookId, page, navigate, refresh, selectedLessonId, homeworkMode }: Props) {
  const subject = page.subject;
  if (page.kind === "under-development") return <Section title="About Announcements"><p className={styles.note}>School news, reminders and important updates will appear here when this feature is ready.</p></Section>;
  if (page.kind === "class") return <>
    <p className={styles.contextLine}>You are viewing your subjects in: <strong>{page.title}</strong></p>
    <Section title="Subjects in this class" count={page.children?.length ?? 0}><PageLinks pages={page.children ?? []} bookId={bookId} navigate={navigate} empty="No subjects are assigned to you in this class." /></Section>
  </>;
  if (!subject) return null;
  if (page.kind === "plan") return <><div className={formClass}><PlanLessonForm subject={subject} onSaved={refresh} /></div></>;
  if (page.kind === "confirm") return <ConfirmTaughtLessons subject={subject} selectedLessonId={selectedLessonId} navigate={navigate} refresh={refresh} />;
  if (page.kind === "lesson-feedback") return <LessonFeedback subject={subject} onAdded={refresh} />;
  if (page.kind === "compose") {
    const eligible = subject.lessons.filter(lesson => lesson.status === "confirmed" && !lesson.homework.length && lesson.concepts.length > 0);
    const selected = subject.lessons.find(lesson => lesson.id === selectedLessonId && lesson.status === "confirmed" && lesson.concepts.length > 0);
    return <>
      {selected ? <div className={formClass}><HomeworkForm key={selected.id} subject={subject} lessonId={selected.id} onSent={refresh} mode={homeworkMode} onLessonChange={id => navigate("homework", page.id, id)} /></div> : <Section title="Taught lessons ready for homework" count={eligible.length}>{eligible.length ? <ul className={`${book.rows} ${styles.spacedRows}`}>{eligible.map(lesson => <li key={lesson.id}><div className={styles.rowBody}><strong>{lessonName(lesson, subject)} - {dateLabel(lesson.date)}</strong><small>{lesson.chapterName} · {lesson.concepts.length} taught concepts</small></div><MobileAction className={book.textButton} onClick={() => navigate("homework", page.id, lesson.id)} icon="homework" label="Create homework" /></li>)}</ul> : <p className={book.empty}>No taught lessons are waiting for homework. Confirm a lesson with taught concepts first.</p>}</Section>}
    </>;
  }
  if (page.kind === "chapter" && page.chapter) return <>
    <p className={styles.contextLine}>Curriculum coverage: <strong>{page.chapter.taught} / {page.chapter.total} concepts taught</strong></p>
    {page.chapter.topics.length ? page.chapter.topics.map(topic => <Section key={topic.id} title={topic.name} count={topic.concepts.length}><ConceptRows concepts={topic.concepts.map(concept => ({ ...concept, detail: topic.name }))} /></Section>) : <p className={book.empty}>No topics have been published in this chapter yet.</p>}
  </>;
  return <>
    <p className={styles.contextLine}>You are {bookId === "lessons" ? "managing lessons" : bookId === "homework" ? "managing homework" : "viewing the curriculum"} for: <strong>{allocationName(subject)}</strong></p>
    {bookId === "curriculum" && <Coverage subject={subject} />}
    <Section title={bookId === "curriculum" ? "Chapters" : bookId === "homework" ? "Homework pages" : "Lesson pages"} count={page.children?.length ?? 0}><PageLinks pages={page.children ?? []} bookId={bookId} navigate={navigate} empty="Your school hasn’t published curriculum for this subject yet." /></Section>
  </>;
}
