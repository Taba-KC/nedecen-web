"use client";

import type { Subject } from "../RoleDashboard";
import QuestionMemoEditor from "../QuestionMemoEditor";
import AppSelect from "@/components/shared/AppSelect";
import TeacherPageHeading from "./TeacherPageHeading";
import TeacherSection from "./TeacherSection";
import { allocationName, dateLabel, lessonName } from "./registry";
import book from "@/components/principal/books/books.module.css";
import workflow from "../role-dashboard.module.css";
import styles from "./teacher-books.module.css";

export function publishedHomework(subject: Subject) {
  const entries = subject.lessons.filter(lesson => lesson.status === "confirmed").flatMap(lesson => lesson.homework.map(activity => ({ lesson, activity })));
  const ordered = entries.toSorted((a, b) => a.activity.id - b.activity.id);
  return ordered.map((entry, index) => ({ ...entry, number: entry.activity.activityNumber ?? index + 1 })).toSorted((a, b) => b.number - a.number || b.activity.id - a.activity.id);
}

/** Open the latest activity automatically; keep the five preceding activities in the chooser. */
export default function PreviousHomework({ subject, selectedLessonId, selectedActivityId, aiAvailable = false, onSelect, onSaved }: {
  subject: Subject; selectedLessonId: number | null; selectedActivityId?: number | null; aiAvailable?: boolean;
  onSelect: (lessonId: number, activityId: number) => void; onSaved: () => void;
}) {
  const recent = publishedHomework(subject).slice(0, 6);
  const selected = recent.find(entry => selectedActivityId ? entry.activity.id === selectedActivityId : entry.lesson.id === selectedLessonId) ?? recent[0];
  const chooser = <label className={book.filterDropdown}><span className="sr-only">Select previous homework</span><AppSelect aria-label="Select previous homework" value={selected?.activity.id ?? ""} disabled={!recent.length} onChange={event => {
    const entry = recent.find(item => item.activity.id === Number(event.target.value));
    if (entry) onSelect(entry.lesson.id, entry.activity.id);
  }}>{recent.length ? recent.map((entry, index) => <option key={entry.activity.id} value={entry.activity.id}>{"Home Activity " + entry.number + " · " + lessonName(entry.lesson, subject) + (index === 0 ? " · Latest" : "")}</option>) : <option value="">No published homework</option>}</AppSelect></label>;
  return <>
    <TeacherPageHeading title="Previous homework" subtitle={allocationName(subject)} controls={chooser} />
    <div className={styles.pageContent}>
      {selected ? <>
        <p className={styles.note}>Add or edit worked answers below. Learners can see saved answers once the scheduled answer-release time has been reached.</p>
        <TeacherSection title={"Home Activity " + selected.number + " · " + lessonName(selected.lesson, subject)}>
          <p className={styles.note}>{dateLabel(selected.lesson.date)} · {selected.lesson.chapterName} · Due {dateLabel(selected.activity.dueDate)} · {selected.activity.questions.filter(question => !question.memo?.trim()).length} worked {selected.activity.questions.filter(question => !question.memo?.trim()).length === 1 ? "answer" : "answers"} missing</p>
          {selected.activity.questions.length ? <ol className={styles.publishedQuestions + " " + workflow.paperWorkflows + " " + styles.workflow}>{selected.activity.questions.map((question, index) => <li key={question.id}>
            <h3>Question {index + 1}</h3>
            <QuestionMemoEditor question={question} terminology="answer" allowAI aiAvailable={aiAvailable} onSaved={onSaved} />
          </li>)}</ol> : <p className={book.empty}>No questions were recorded for this homework.</p>}
        </TeacherSection>
      </> : <p className={book.empty}>No homework has been published for this subject yet. Sent activities will appear here so you can add or update their worked answers.</p>}
    </div>
  </>;
}
