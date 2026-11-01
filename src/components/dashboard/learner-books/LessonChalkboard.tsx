"use client";

import { useId, useRef, useState } from "react";
import type { GoalAnswer, LearnerConcept } from "./registry";
import { api } from "@/lib/api";
import styles from "./lesson-chalkboard.module.css";
import Chalkboard, { ChalkboardTeacher } from "./Chalkboard";

type FeedbackState = { answers: GoalAnswer[]; saved: GoalAnswer[]; error: string; message: string };
const conceptKey = (concept: LearnerConcept) => String(concept.lessonConceptId ?? concept.id);
function initialFeedback(concept: LearnerConcept): FeedbackState {
  const answers = concept.learningOutcomes.map((_, n) => concept.answers?.[n] ?? null);
  return { answers, saved: answers, error: "", message: "" };
}

export default function LessonChalkboard({ concepts, completed = false, canRespond = false, onSaved }: { concepts: LearnerConcept[]; completed?: boolean; canRespond?: boolean; onSaved?: () => void }) {
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const id = useId();
  const stateFor = (concept: LearnerConcept) => {
    const state = feedback[conceptKey(concept)] ?? initialFeedback(concept);
    return canRespond ? state : { ...state, answers: initialFeedback(concept).answers };
  };
  function choose(concept: LearnerConcept, goalIndex: number, answer: "yes" | "no") {
    if (!canRespond || submitting.current) return;
    setFeedback(previous => {
      const state = previous[conceptKey(concept)] ?? initialFeedback(concept);
      return { ...previous, [conceptKey(concept)]: { ...state, answers: state.answers.map((value, n) => n === goalIndex ? answer : value), error: "", message: "" } };
    });
  }
  async function submit(concept: LearnerConcept) {
    if (submitting.current || !canRespond || !concept.lessonConceptId || !concept.learningOutcomes.length) return;
    const key = conceptKey(concept), state = stateFor(concept);
    if (state.answers.some(answer => answer === null)) {
      setFeedback(previous => ({ ...previous, [key]: { ...state, error: "Choose Yes or No for each learning goal.", message: "" } }));
      return;
    }
    submitting.current = true; setSaving(true);
    setFeedback(previous => ({ ...previous, [key]: { ...state, error: "", message: "" } }));
    try {
      const result = await api.post<{ goalResponses: { goalIndex: number; answer: "yes" | "no" }[] }>(`/learners/me/lesson-concepts/${concept.lessonConceptId}/feedback`, { answers: state.answers.map((answer, goalIndex) => ({ goalIndex, answer })) });
      const saved = concept.learningOutcomes.map((_, goalIndex) => result.goalResponses.find(item => item.goalIndex === goalIndex)?.answer ?? null);
      setFeedback(previous => ({ ...previous, [key]: { answers: saved, saved, error: "", message: "Feedback submitted." } }));
      onSaved?.();
    } catch (error) {
      setFeedback(previous => ({ ...previous, [key]: { ...state, error: error instanceof Error ? error.message : "Could not submit feedback. Please try again.", message: "" } }));
    } finally { submitting.current = false; setSaving(false); }
  }
  return <Chalkboard items={concepts} noun="Concept" intro={completed ? "Concepts from your lesson" : "Concepts you’ll learn"} renderItem={(concept, position) => <>
              <div className={styles.conceptHeading}><span className={styles.kicker}>Concept {position + 1} of {concepts.length}</span><h3>{concept.name}</h3><span className={styles.underline} aria-hidden="true" /><ChalkboardTeacher /></div>
              <p className={styles.topic}>{concept.chapterName} <span aria-hidden="true"> / </span> {concept.topicName}</p>
              {completed ? <div className={styles.prerequisites}><h4><span aria-hidden="true">↳</span> Learning goals</h4><p className={styles.hint}>Think back to what you learned.</p>{concept.learningOutcomes.length ? <ul>{concept.learningOutcomes.map((goal, n) => <li key={n}><span aria-hidden="true">✧</span><span id={`${id}-${conceptKey(concept)}-goal-${n}`}>{goal}</span><div className={styles.goalChoices} role="group" aria-labelledby={`${id}-${conceptKey(concept)}-goal-${n}`}>{(["yes", "no"] as const).map(answer => <button key={answer} type="button" aria-pressed={stateFor(concept).answers[n] === answer} disabled={saving || !canRespond || !concept.lessonConceptId} onClick={() => choose(concept, n, answer)}>{answer === "yes" ? "Yes" : "No"}</button>)}</div></li>)}</ul> : <p className={styles.noPrerequisites}>No learning goals were recorded for this concept.</p>}</div> : <><div className={styles.prerequisites}><h4><span aria-hidden="true">↳</span> Before we begin</h4><p className={styles.hint}>Bring these ideas with you.</p>{concept.prerequisites.length ? <ul>{concept.prerequisites.map((item, n) => <li key={n}><span aria-hidden="true">✧</span><span>{item}</span></li>)}</ul> : <p className={styles.noPrerequisites}>No prerequisites listed. You can start right here.</p>}</div>
              <details className={styles.goals}><summary>Learning goals <span aria-hidden="true">＋</span></summary>{concept.learningOutcomes.length ? <ul>{concept.learningOutcomes.map((goal, n) => <li key={n}>{goal}</li>)}</ul> : <p>No learning goals have been added yet.</p>}</details>
              </>}
  </>} renderAction={completed ? active => {
    const activeFeedback = stateFor(active);
    const alreadySaved = activeFeedback.answers.length > 0 && activeFeedback.saved.every(answer => answer !== null) && activeFeedback.answers.every((answer, n) => answer === activeFeedback.saved[n]);
    return <div className={styles.feedbackAction}>{activeFeedback.error ? <p className={styles.feedbackError} role="alert">{activeFeedback.error}</p> : <p className={styles.feedbackStatus} role="status">{!canRespond ? "Feedback closed. Your saved answers are shown." : saving ? "Submitting feedback…" : activeFeedback.message || `${activeFeedback.answers.filter(answer => answer !== null).length} of ${activeFeedback.answers.length} goals answered`}</p>}<button type="button" disabled={saving || !canRespond || !active.lessonConceptId || !active.learningOutcomes.length || alreadySaved} onClick={() => void submit(active)}>{saving ? "Submitting…" : "Submit feedback"} <span aria-hidden="true">✓</span></button></div>;
  } : undefined} />;
}
