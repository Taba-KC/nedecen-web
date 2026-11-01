"use client";

import { useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { LearnerHomework, LearnerQuestion } from "./registry";
import Chalkboard, { ChalkboardTeacher } from "./Chalkboard";
import styles from "./lesson-chalkboard.module.css";

type AnswerState = { loading: boolean; open: boolean; memo?: string | null; error?: string };

function WorkedAnswer({ state, active, id }: { state: AnswerState; active: boolean; id: string }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(() => {
      const node = panel.current, scroll = node?.closest<HTMLElement>("[data-board-scroll]");
      if (node && scroll) scroll.scrollTo({ top: scroll.scrollTop + node.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 12, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, state.loading]);
  return <section className={styles.workedAnswer} id={id} ref={panel} aria-label="Worked answer"><h4>Worked answer</h4>{state.loading ? <p role="status">Loading answer…</p> : state.error ? <p role="alert">{state.error}</p> : <p>{state.memo?.trim() ? state.memo : "Your teacher has not provided a worked answer for this question yet."}</p>}</section>;
}

export default function HomeworkChalkboard({ activity, canReveal, releaseNote, releaseNoteId }: { activity: LearnerHomework; canReveal: boolean; releaseNote: string; releaseNoteId: string }) {
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const pending = useRef(new Set<number>());
  const id = useId();
  async function reveal(question: LearnerQuestion) {
    if (!canReveal || pending.current.has(question.id)) return;
    const cached = answers[question.id];
    if (cached?.open && !cached.error) {
      setAnswers(previous => ({ ...previous, [question.id]: { ...cached, open: false } }));
      return;
    }
    pending.current.add(question.id);
    setAnswers(previous => ({ ...previous, [question.id]: { loading: true, open: true } }));
    try {
      // The protected endpoint independently checks the learner and the release policy.
      const result = await api.get<{ memo: string | null }>(`/learners/me/questions/${question.id}/answer`);
      setAnswers(previous => ({ ...previous, [question.id]: { loading: false, open: true, memo: result.memo } }));
    } catch (error) {
      setAnswers(previous => ({ ...previous, [question.id]: { loading: false, open: true, error: error instanceof Error ? error.message : "Could not load the answer. Please try again." } }));
    } finally { pending.current.delete(question.id); }
  }
  return <Chalkboard items={activity.questions} noun="Question" intro="A little practice, one question at a time" renderItem={(question, position, active) => <>
    <div className={`${styles.conceptHeading} ${styles.homeworkHeading}`}><span className={styles.kicker}>Question {position + 1} of {activity.questions.length}</span><h3 className={styles.questionText} data-question-text>{question.body}</h3><span className={styles.underline} aria-hidden="true" /><ChalkboardTeacher /></div>
    <details className={styles.goals}><summary>Topic info <span aria-hidden="true">＋</span></summary><dl className={styles.topicDetails}><dt>Chapter</dt><dd>{question.chapterName}</dd><dt>Topic</dt><dd>{question.topicName}</dd><dt>Concept</dt><dd>{question.conceptName}</dd></dl></details>
    {canReveal && answers[question.id]?.open && <WorkedAnswer state={answers[question.id]} active={active} id={`${id}-answer-${question.id}`} />}
  </>} renderAction={question => {
    const state = answers[question.id];
    return <div className={styles.feedbackAction}><button type="button" disabled={!canReveal || !!state?.loading} aria-describedby={releaseNoteId} aria-expanded={canReveal && !!state?.open} aria-controls={`${id}-answer-${question.id}`} title={releaseNote} onClick={() => void reveal(question)}>{state?.loading ? "Loading answer…" : state?.error ? "Try answer again" : state?.open && canReveal ? "Hide answer" : "Show answer"}<span aria-hidden="true">↗</span></button></div>;
  }} />;
}
