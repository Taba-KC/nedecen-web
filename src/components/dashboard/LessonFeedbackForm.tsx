"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import styles from "./role-dashboard.module.css";

type Reaction = "understood" | "didnt_understand";
type Feedback = { canRespond: boolean; concepts: { lessonConceptId: number; name: string; reaction: Reaction | null }[] };

export default function LessonFeedbackForm({ lessonId }: { lessonId: number }) {
  const [data, setData] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    api.get<Feedback>(`/learners/me/lessons/${lessonId}/feedback`).then(result => { if (active) { setData(result); setError(""); } }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load lesson feedback."); });
    return () => { active = false; };
  }, [lessonId, attempt]);
  async function respond(lessonConceptId: number, reaction: Reaction) {
    if (submitting.current) return;
    submitting.current = true; setBusy(lessonConceptId); setError("");
    try {
      await api.post("/lesson-feedback", { lessonConceptId, reaction, isAnonymous: true });
      setData(previous => previous ? { ...previous, concepts: previous.concepts.map(item => item.lessonConceptId === lessonConceptId ? { ...item, reaction } : item) } : previous);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save your response."); }
    finally { submitting.current = false; setBusy(null); }
  }
  return <section aria-label="Lesson feedback">
    <h3>Lesson feedback</h3>
    {error && <p role="alert">{error} <button type="button" className={styles.textButton} onClick={() => { setError(""); setAttempt(value => value + 1); }}>Try again</button></p>}
    {!data && !error ? <p role="status">Loading lesson feedback…</p> : data && <>
      {!data.canRespond && <p className={styles.muted}>Feedback closed when the next lesson was planned.</p>}
      <ul className={styles.taskList}>{data.concepts.map(item => <li key={item.lessonConceptId}>
        <p>{item.name}</p>
        <div role="group" aria-label={`Understanding: ${item.name}`}>
          {([["understood", "I get it"], ["didnt_understand", "I don’t get it"]] as const).map(([value, label]) => <button key={value} type="button" className={styles.button} aria-pressed={item.reaction === value} disabled={!data.canRespond || busy !== null} onClick={() => void respond(item.lessonConceptId, value)}>{item.reaction === value ? "✓ " : ""}{label}</button>)}
        </div>
        {busy === item.lessonConceptId && <p role="status">Saving…</p>}
      </li>)}</ul>
    </>}
  </section>;
}
