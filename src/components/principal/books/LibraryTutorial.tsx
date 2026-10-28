"use client";

import { useEffect, useState } from "react";
import TeacherDialog from "@/components/dashboard/teacher-books/TeacherDialog";
import book from "./books.module.css";
import styles from "./library-tutorial.module.css";

type Progress = { visits: number; completed?: boolean; dismissed?: boolean };
function accountKey() {
  const account = localStorage.getItem("accountType"), id = localStorage.getItem("accountId"), school = localStorage.getItem("schoolId");
  return account && id && school ? `nedecen.navigation-help.v1:${account}:${school}:${id}` : null;
}
function read(key: string): Progress {
  try { const value = JSON.parse(localStorage.getItem(key) ?? "{}"); return { visits: Math.max(0, Number(value.visits) || 0), completed: value.completed === true, dismissed: value.dismissed === true }; }
  catch { return { visits: 0 }; }
}
export default function LibraryTutorial({ request, compact, bookOpen, openMenu, closeMenu, stepChanged }: {
  request: number; compact: boolean; bookOpen: boolean; openMenu: (side: "contents" | "shelf") => void; closeMenu: () => void; stepChanged: (step: number | null) => void;
}) {
  const [prompt, setPrompt] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [never, setNever] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    // A visit lasts for this browser tab's session, or until 30 minutes of inactivity.
    // Refreshing, changing books and switching staff modes do not consume another visit.
    const frame = requestAnimationFrame(() => {
    try {
      const account = accountKey(); if (!account) return;
      setKey(account);
      const saved = read(account), now = Date.now(), last = Number(sessionStorage.getItem(account) ?? 0);
      sessionStorage.setItem(account, String(now));
      if (now - last < 30 * 60 * 1000) return;
      saved.visits = Math.min(saved.visits + 1, 4);
      localStorage.setItem(account, JSON.stringify(saved));
      if (saved.visits <= 3 && !saved.completed && !saved.dismissed) setPrompt(true);
    } catch { /* Help remains available when browser storage is blocked. */ }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!request) return;
    const frame = requestAnimationFrame(() => { setStep(0); setPrompt(false); setNever(false); });
    return () => cancelAnimationFrame(frame);
  }, [request]);
  useEffect(() => {
    stepChanged(step);
    if (step === 0 || step === 2) openMenu("shelf");
    if (step === 1 && bookOpen) openMenu("contents");
    // Navigation callbacks deliberately use the shell's latest location without restarting a step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, bookOpen]);
  function remember(completed = false) {
    try { if (key) localStorage.setItem(key, JSON.stringify({ ...read(key), ...(completed ? { completed: true } : {}), ...(never ? { dismissed: true } : {}) })); } catch { /* Optional preference. */ }
  }
  function dismiss() { remember(); setPrompt(false); setStep(null); closeMenu(); }
  function next() {
    if (step === 2) { remember(true); setStep(null); closeMenu(); }
    else setStep(current => (current ?? -1) + 1);
  }
  const titles = ["Choose a book", "Choose a page", "Switch books anytime"];
  const descriptions = [
    "Each book contains one part of your work. Choose a book from your library to explore it.",
    compact ? "The menu with three lines opens the pages in this book. Choose a subject or task to open its page." : "The menu on the left lists the pages in your book. Choose a subject or task to open its page.",
    compact ? "Use the books icon at the top right to open your library and switch books. You can reopen this guide from Navigation help in the left menu." : "Your library stays on the right. Choose another book whenever you need it. Navigation help is always at the bottom of the left menu.",
  ];
  return <>
    {prompt && <TeacherDialog title="A quick tour of your library?" onClose={dismiss}>
      <p>Your work is organised into books and pages. Take a short tour to learn how to find your way around.</p>
      <label className={styles.preference}><input type="checkbox" checked={never} onChange={event => setNever(event.target.checked)} /> Don’t ask again</label>
      <footer><button type="button" onClick={dismiss}>Maybe later</button><button type="button" className={book.primary} onClick={() => { remember(); setPrompt(false); setStep(0); }}>Show me</button></footer>
    </TeacherDialog>}
    {step !== null && <section className={styles.coach} aria-label="Navigation tutorial" aria-live="polite">
      <div className={styles.step}>Step {step + 1} of 3</div><h2>{titles[step]}</h2><p>{descriptions[step]}</p>
      {step === 0 && !bookOpen && <p className={styles.hint}>Open any book, then continue.</p>}
      <label className={styles.preference}><input type="checkbox" checked={never} onChange={event => setNever(event.target.checked)} /> Don’t ask again</label>
      <footer><button type="button" onClick={dismiss}>Skip tour</button><button type="button" className={book.primary} disabled={step === 0 && !bookOpen} onClick={next}>{step === 2 ? "Finish" : "Next"}</button></footer>
    </section>}
  </>;
}
