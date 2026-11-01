"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./lesson-chalkboard.module.css";

/** A small, code-drawn teacher sticker keeps the board light and works offline. */
export function ChalkboardTeacher() {
  return <svg className={styles.teacher} viewBox="0 0 140 172" fill="none" aria-hidden="true">
    <g stroke="#fff7dc" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M46 153 42 115Q39 92 61 89L84 89Q98 90 102 113L109 151Z" fill="#e5aa48" />
      <path d="m46 107-16 12-16-21M94 107l18-20 15-4" stroke="#a56342" strokeWidth="15" />
      <path d="M42 51Q30 18 62 13Q96 5 103 38L98 76 43 77Z" fill="#332e29" />
      <path d="M50 44Q70 48 87 32L95 53 91 73Q84 88 70 86Q49 84 48 63Z" fill="#aa6c48" />
    </g>
    <path d="m46 107-16 12-16-21M94 107l18-20 15-4" stroke="#aa6c48" strokeWidth="10" strokeLinecap="round" />
    <path d="m10 94 3-8m0 8-7-2m111-10 9-13" stroke="#aa6c48" strokeWidth="5" strokeLinecap="round" />
    <path d="m126 69 7-18" stroke="#f7edd2" strokeWidth="4" strokeLinecap="round" />
    <path d="M46 153 44 115Q42 95 61 91L70 104 81 91Q98 93 100 114L105 153Z" fill="#e8ae4d" />
    <path d="m62 90 8 14 11-14" fill="#fff5d7" />
    <path d="m57 101-5 51m36-51 8 51" stroke="#c48732" strokeWidth="2" />
    <circle cx="70" cy="116" r="2" fill="#95682e" /><circle cx="70" cy="129" r="2" fill="#95682e" />
    <g stroke="#352f2a" strokeWidth="2.5"><rect x="51" y="52" width="17" height="13" rx="5" /><rect x="75" y="51" width="17" height="13" rx="5" /><path d="M68 56h7" /></g>
    <path d="M66 74q7 6 13-1" stroke="#4b3028" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="60" cy="58" r="1.8" fill="#322c29" /><circle cx="83" cy="57" r="1.8" fill="#322c29" />
    <path d="m70 62-2 5h4" stroke="#854d35" strokeWidth="2" strokeLinecap="round" />
    <path d="m36 155 75-1" stroke="#fff7dc" strokeWidth="7" strokeLinecap="round" />
    <path d="m111 31 4-6m6 18 7-1M24 54l-6-3" stroke="#f5db88" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={back ? "m14 5-7 7 7 7M7 12h14" : "m10 5 7 7-7 7M3 12h14"} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Shared board frame and slide navigation for lessons and homework. */
export default function Chalkboard<T extends { id: number }>({ items, noun, intro, context, renderItem, renderAction }: {
  items: T[]; noun: "Concept" | "Question"; intro: string;
  context?: "syllabus";
  renderItem: (item: T, position: number, active: boolean) => ReactNode;
  renderAction?: (item: T) => ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const id = useId(), count = items.length;
  const word = noun.toLowerCase();
  function goTo(next: number) {
    const node = viewport.current;
    if (!node) return;
    const target = Math.max(0, Math.min(count - 1, next));
    current.current = target; setIndex(target);
    node.scrollTo({ left: target * node.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(() => node.scrollTo({ left: current.current * node.clientWidth, behavior: "instant" }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  if (!count) return null;
  return <section className={styles.experience} aria-label={context === "syllabus" ? "Syllabus chalkboard" : noun === "Concept" ? "Lesson chalkboard" : "Homework chalkboard"} aria-roledescription="carousel">
    <div className={styles.intro}><span><span className={styles.spark} aria-hidden="true">✦</span> {intro}</span><span>One {word} at a time</span></div>
    <div className={styles.frame}><div className={`${styles.board}${renderAction ? ` ${styles.reviewBoard}` : ""}`}>
      <div className={styles.rail} id={id} ref={viewport} role="group" tabIndex={0} aria-label={`${context === "syllabus" ? "Syllabus concepts" : noun === "Concept" ? "Lesson concepts" : "Homework questions"}. Swipe or use the left and right arrow keys.`} onKeyDown={event => {
        if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        goTo(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : current.current + (event.key === "ArrowLeft" ? -1 : 1));
      }} onScroll={() => {
        const node = viewport.current;
        if (!node?.clientWidth) return;
        const next = Math.max(0, Math.min(count - 1, Math.round(node.scrollLeft / node.clientWidth)));
        current.current = next; setIndex(next);
      }}>
        {items.map((item, position) => <article key={item.id} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${noun} ${position + 1} of ${count}`} aria-hidden={position !== index ? true : undefined} inert={position !== index}><div className={styles.slideScroll} data-board-scroll>{renderItem(item, position, position === index)}</div></article>)}
      </div>
      {renderAction ? renderAction(items[index]) : <div className={styles.boardFoot} aria-hidden="true"><span>Let’s make it click.</span><span className={styles.doodle}>✧</span></div>}
    </div><div className={styles.tray} aria-hidden="true"><span className={styles.chalk} /><span className={styles.yellowChalk} /><span className={styles.eraser} /></div></div>
    <nav className={styles.navigation} aria-label={`${noun} navigation`}><button type="button" aria-label={`Previous ${word}`} aria-controls={id} disabled={index === 0} onClick={() => goTo(current.current - 1)}><Arrow back /></button><div className={styles.counter} aria-live="polite" aria-atomic="true"><strong>{index + 1} <span>of</span> {count}</strong><span>{index === count - 1 ? `Last ${word} in this ${context === "syllabus" ? "syllabus view" : noun === "Concept" ? "lesson" : "activity"}` : `Swipe or turn to the next ${word}`}</span></div><button type="button" aria-label={`Next ${word}`} aria-controls={id} disabled={index === count - 1} onClick={() => goTo(current.current + 1)}><Arrow /></button></nav>
  </section>;
}
