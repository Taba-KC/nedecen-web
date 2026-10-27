"use client";

/** The selected URL node chooses the content; supporting detail opens in a dialog instead of lengthening every row. */
import { useModalMotion } from "@/hooks/useModalMotion";
import { MotionPanel, MotionTabs } from "@/components/shared/Motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import TeacherDialog from "../teacher-books/TeacherDialog";
import TeacherPageHeading from "../teacher-books/TeacherPageHeading";
import book from "@/components/principal/books/books.module.css";
import styles from "./learner-books.module.css";
import { LEARNER_TABS, completedLessons, upcomingLesson, homeworkHistory, lessonLabel, timeLabel, type LearnerBookId, type LearnerTab, type LearnerPage, type LearnerConcept, type LearnerQuestion, type LearnerLesson, type LearnerHomework, type GoalAnswer } from "./registry";

type Modal = { kind: "info" | "prerequisites" | "goals"; concept: LearnerConcept } | { kind: "feedback"; concept: LearnerConcept; lesson: LearnerLesson } | { kind: "topic"; question: LearnerQuestion } | { kind: "answer"; question: LearnerQuestion; activity: LearnerHomework };
function Section({ title, count, action, children }: { title: string; count?: number; action?: ReactNode; children: ReactNode }) {
  return <section aria-label={title}><div className={styles.sectionTitle}><h2>{title}</h2>{count !== undefined && <span className={book.badge}>{count}</span>}{action && <div className={styles.sectionAction}>{action}</div>}</div>{children}</section>;
}

/** Tabs change the view of one subject page. Arrow keys move between the two views. */
function SubjectTabs({ id, active, bookId, onChange }: { id: string; active: LearnerTab; bookId: LearnerBookId; onChange: (tab: LearnerTab) => void }) {
  const tabs = LEARNER_TABS[bookId];
  const label = bookId === "syllabus" ? "Syllabus coverage" : bookId === "homework" ? "Homework history" : "Lesson status";
  return <MotionTabs active={active} className={book.tabs} role="tablist" aria-label={label}>{tabs.map(tab => <button key={tab.id} type="button" role="tab" id={`${id}-${tab.id}`} aria-controls={`${id}-panel`} aria-selected={active === tab.id} tabIndex={active === tab.id ? 0 : -1} onClick={() => { if (tab.id !== active) onChange(tab.id); }} onKeyDown={event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? tabs[0] : event.key === "End" ? tabs[1] : tab.id === tabs[0].id ? tabs[1] : tabs[0];
    if (next.id !== active) onChange(next.id);
  }}>{tab.label}</button>)}</MotionTabs>;
}

function HistoryDialog({ title, items, selectedId, onSelect, onClose: onDismiss }: { title: string; items: { id: number; label: string; latest?: boolean }[]; selectedId?: number; onSelect: (id: number) => void; onClose: () => void }) {
  const motion = useModalMotion(onDismiss);
  const onClose = motion.close;
  return <TeacherDialog motion={motion} title={title} onClose={onClose}>
    <ul className={styles.list}>{items.map(item => <li className={styles.browseItem} key={item.id}><button type="button" className={book.rowLink} aria-current={item.id === selectedId ? "true" : undefined} onClick={() => { onClose(); onSelect(item.id); }}><span>{item.label}</span>{(item.id === selectedId || item.latest) && <span className={book.badge}>{item.id === selectedId ? "Selected" : "Latest"}</span>}</button></li>)}</ul>
    <footer><button type="button" className={book.primary} onClick={onClose}>Close</button></footer>
  </TeacherDialog>;
}
function HistoryButton({ label, count, open, onClick }: { label: string; count: number; open: boolean; onClick: () => void }) {
  return <button type="button" className={`${book.contextButton} ${book.outlineButton} ${styles.browseButton}`} disabled={!count} aria-haspopup="dialog" aria-expanded={open} onClick={onClick}>{label} ({count})<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></button>;
}
function FeedbackDialog({ concept, lesson, onClose: onDismiss, onSaved }: { concept: LearnerConcept; lesson: LearnerLesson; onClose: () => void; onSaved: () => void }) {
  const motion = useModalMotion(onDismiss);
  const onClose = motion.close;
  const [answers, setAnswers] = useState<GoalAnswer[]>(concept.answers ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  async function save(goalIndex: number, answer: "yes" | "no") {
    if (submitting.current || !lesson.canRespond || !concept.lessonConceptId) return;
    submitting.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const saved = await api.post<{ goalResponses: { goalIndex: number; answer: "yes" | "no" }[] }>(`/learners/me/lesson-concepts/${concept.lessonConceptId}/goals`, { goalIndex, answer });
      setAnswers(concept.learningOutcomes.map((_, index) => saved.goalResponses.find(item => item.goalIndex === index)?.answer ?? null));
      setMessage("Feedback saved."); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save your feedback. Try again."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <TeacherDialog motion={motion} title="Learning goals feedback" onClose={onClose} busy={busy}>
    <p className={styles.question}><strong>{concept.name}</strong></p><p className={styles.muted}>{lessonLabel(lesson)}</p>
    {!lesson.canRespond && <p className={styles.muted}>Feedback closed when the next lesson was planned. Your saved answers are shown below.</p>}
    {concept.learningOutcomes.length ? <ul className={styles.goals}>{concept.learningOutcomes.map((goal, index) => <li key={index} className={styles.goal}><p id={`goal-${concept.lessonConceptId}-${index}`}>{goal}</p><div className={styles.choices} role="group" aria-labelledby={`goal-${concept.lessonConceptId}-${index}`}>{(["yes", "no"] as const).map(answer => <button key={answer} type="button" className={styles.choice} aria-pressed={answers[index] === answer} disabled={busy || !lesson.canRespond} onClick={() => void save(index, answer)}>{answer === "yes" ? "Yes" : "No"}</button>)}</div></li>)}</ul> : <p className={styles.empty}>No learning goals were recorded for this concept in this lesson.</p>}
    {error && <p role="alert" className={book.error}>{error}</p>}<p className={styles.status} role="status">{busy ? "Saving…" : message}</p>
    <p className={styles.muted}>{answers.filter(answer => answer === "yes" || answer === "no").length} of {concept.learningOutcomes.length} learning goals answered. Your selected answers are saved individually.</p>
    <footer><button type="button" className={book.primary} disabled={busy} onClick={onClose}>Done</button></footer>
  </TeacherDialog>;
}
function AnswerDialog({ question, activity, onClose: onDismiss }: { question: LearnerQuestion; activity: LearnerHomework; onClose: () => void }) {
  const motion = useModalMotion(onDismiss);
  const onClose = motion.close;
  const [memo, setMemo] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    api.get<{ memo: string | null }>(`/learners/me/questions/${question.id}/answer`).then(result => { if (active) setMemo(result.memo); }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load the answer."); });
    return () => { active = false; };
  }, [question.id, attempt]);
  return <TeacherDialog motion={motion} title="Worked answer" onClose={onClose}><p className={styles.muted}>Home Activity {activity.activityNumber}</p><p className={styles.question}>{question.body}</p>{error ? <div role="alert"><p className={book.error}>{error}</p><button type="button" className={book.textButton} onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button></div> : memo === undefined ? <p role="status">Loading answer…</p> : <p className={styles.answer}>{memo || "Your teacher has not provided a worked answer for this question yet."}</p>}<footer><button type="button" className={book.primary} onClick={onClose}>Close</button></footer></TeacherDialog>;
}
function DetailDialog({ modal, onClose: onDismiss, onSaved }: { modal: Modal; onClose: () => void; onSaved: () => void }) {
  const motion = useModalMotion(onDismiss);
  const onClose = motion.close;
  if (modal.kind === "feedback") return <FeedbackDialog concept={modal.concept} lesson={modal.lesson} onClose={onClose} onSaved={onSaved} />;
  if (modal.kind === "answer") return <AnswerDialog question={modal.question} activity={modal.activity} onClose={onClose} />;
  const title = modal.kind === "info" || modal.kind === "topic" ? "Topic info" : modal.kind === "goals" ? "Learning goals" : "Prerequisites";
  const item = modal.kind === "topic" ? modal.question : modal.concept;
  const details = modal.kind === "prerequisites" ? modal.concept.prerequisites : modal.kind === "goals" ? modal.concept.learningOutcomes : null;
  return <TeacherDialog motion={motion} title={title} onClose={onClose}>
    {details ? <><p className={styles.question}><strong>{"name" in item ? item.name : item.conceptName}</strong></p>{details.length ? <ul className={styles.bullets}>{details.map((detail, index) => <li key={index}>{detail}</li>)}</ul> : <p className={styles.empty}>{modal.kind === "goals" ? "No learning goals have been added yet." : "No prerequisites have been added yet."}</p>}</> : <dl className={styles.details}><dt>Chapter</dt><dd>{item.chapterName}</dd><dt>Topic</dt><dd>{item.topicName}</dd><dt>Concept</dt><dd>{"name" in item ? item.name : item.conceptName}</dd></dl>}
    <footer><button type="button" className={book.primary} onClick={onClose}>Close</button></footer>
  </TeacherDialog>;
}

export default function LearnerBookPage({ page, tab = LEARNER_TABS[page.kind][0].id, onTabChange = () => {}, selectedId, onSelect, onSaved }: { page: LearnerPage; tab?: LearnerTab; onTabChange?: (tab: LearnerTab) => void; selectedId: number | null; onSelect: (id: number) => void; onSaved: () => void }) {
  const releaseNoteId = useId();
  const tabsId = useId();
  const [modal, setModal] = useState<Modal | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const dismiss = () => { setModal(null); setBrowsing(false); };
    window.addEventListener("popstate", dismiss);
    return () => window.removeEventListener("popstate", dismiss);
  }, []);
  // Refresh only the button's presentation at release time; the server independently gates every answer request.
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
  const subject = page.subject;
  const completed = completedLessons(subject);
  const history = homeworkHistory(subject);
  const pastHomework = history.slice(1);
  const isLesson = page.kind === "lessons";
  const isCompleted = isLesson && tab === "completed";
  const lesson = isCompleted ? completed.find(item => item.id === selectedId) ?? completed[0] : upcomingLesson(subject);
  const isHomework = page.kind === "homework";
  const isPrevious = isHomework && tab === "previous";
  const activity = isPrevious ? pastHomework.find(item => item.id === selectedId) ?? pastHomework[0] : history[0];
  const isCovered = page.kind === "syllabus" && tab === "covered";
  const concepts = isLesson ? lesson?.concepts ?? [] : subject.syllabus.filter(concept => isCovered ? concept.taught : !concept.taught);
  const controls = <SubjectTabs id={tabsId} active={tab} bookId={page.kind} onChange={onTabChange} />;
  const canReveal = !!activity && (activity.canReveal || (!!activity.releaseAt && now >= new Date(activity.releaseAt).getTime()));
  const releaseNote = canReveal ? "Answers are available." : activity?.releaseAt ? `Answers unlock on ${timeLabel(activity.releaseAt)} (SAST).` : "Your teacher has not scheduled answer release yet.";
  const historyAction = isCompleted ? <HistoryButton label="All lessons" count={completed.length} open={browsing} onClick={() => setBrowsing(true)} /> : isPrevious ? <HistoryButton label="All homework" count={history.length} open={browsing} onClick={() => setBrowsing(true)} /> : undefined;
  return <>
    <TeacherPageHeading title={page.title} controls={controls} />
    <MotionPanel changeKey={`${tab}/${selectedId ?? "default"}`} className={styles.content} id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
      {subject.attendanceLocation && <p className={styles.muted}>Attend {subject.subjectName} in {subject.attendanceLocation.building} · {subject.attendanceLocation.classroom}.</p>}
      {isHomework ? <Section title={activity ? `Home Activity ${activity.activityNumber}` : isPrevious ? "Previous homework" : "Latest homework"} action={historyAction}>
        {activity ? <><p id={releaseNoteId} className={styles.muted}>Due: {timeLabel(activity.dueDate)} (SAST). {releaseNote}</p>
        <ol className={`${styles.list} ${styles.conceptList}`}>{activity.questions.map((question, index) => <li className={styles.item} key={question.id}><p className={`${styles.question} ${styles.numberedQuestion}`}><span className={styles.conceptNumber}>{index + 1}.</span><span data-question-text>{question.body}</span></p><div className={styles.actions}><button className={book.textButton} type="button" onClick={() => setModal({ kind: "topic", question })}>Topic info</button><button className={book.textButton} type="button" disabled={!canReveal} aria-describedby={releaseNoteId} title={releaseNote} onClick={() => setModal({ kind: "answer", question, activity })}>Answer</button></div></li>)}</ol>{!activity.questions.length && <p className={styles.empty}>No questions were added to this homework.</p>}</> : <p className={styles.empty}>{isPrevious ? "No previous homework yet. Your most recent activity is in Latest." : "Your teacher has not shared any homework for this subject yet."}</p>}
      </Section> : <Section title={isLesson ? lesson ? lessonLabel(lesson) : isCompleted ? "Completed lessons" : "Upcoming lesson" : "Concepts"} count={isLesson ? undefined : concepts.length} action={historyAction}>
        {isLesson && !lesson ? <p className={styles.empty}>{isCompleted ? "No lessons have been confirmed as taught yet." : "Your teacher has not planned an upcoming lesson yet."}</p> : concepts.length ? <ol className={`${styles.list} ${styles.conceptList}`}>{concepts.map((concept, index) => <li className={styles.item} key={concept.lessonConceptId ?? concept.id}><h3><span className={styles.conceptNumber}>{index + 1}.</span><span>{concept.name}</span></h3>{!isLesson && <p className={styles.context}>{concept.chapterName} · {concept.topicName}</p>}<div className={styles.actions}>{isCompleted && lesson ? <button type="button" className={book.textButton} onClick={() => setModal({ kind: "feedback", concept, lesson })}>Give feedback</button> : <>{isLesson && <button type="button" className={book.textButton} onClick={() => setModal({ kind: "info", concept })}>Info</button>}<button type="button" className={book.textButton} onClick={() => setModal({ kind: "prerequisites", concept })}>Prerequisites</button><button type="button" className={book.textButton} onClick={() => setModal({ kind: "goals", concept })}>Learning goals</button></>}</div></li>)}</ol> : <p className={styles.empty}>{isCovered ? "No syllabus concepts have been confirmed as taught yet." : page.kind === "syllabus" ? (subject.syllabus.length ? "All current syllabus concepts have been covered." : "No curriculum has been added for this subject yet.") : "No concepts were recorded for this lesson."}</p>}
      </Section>}
    </MotionPanel>
    {modal && <DetailDialog modal={modal} onClose={() => setModal(null)} onSaved={onSaved} />}
    {browsing && <HistoryDialog title={isHomework ? `Homework activities (${history.length})` : `Completed lessons (${completed.length})`} items={isHomework ? history.map((item, index) => ({ id: item.id, label: `Home Activity ${item.activityNumber}`, latest: index === 0 })) : completed.map(item => ({ id: item.id, label: lessonLabel(item) }))} selectedId={isHomework ? activity?.id : lesson?.id} onSelect={id => { if (isHomework && id === history[0]?.id) onTabChange("latest"); else onSelect(id); }} onClose={() => setBrowsing(false)} />}
  </>;
}
