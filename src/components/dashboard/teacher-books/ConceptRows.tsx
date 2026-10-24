"use client";

import { useId, useState } from "react";
import TeacherDialog from "./TeacherDialog";
import book from "@/components/principal/books/books.module.css";
import styles from "./teacher-books.module.css";
import LessonBriefDialog from "../LessonBriefDialog";
import type { LessonBrief } from "../lessonBrief";

export type ConceptRow = { id: number; name: string; detail?: string; teachingBrief?: LessonBrief | null; prerequisites?: string[]; learningOutcomes?: string[] };

export default function ConceptRows({ concepts, selectedIds, lockedIds = [], onToggle, onView }: { concepts: ConceptRow[]; selectedIds?: number[]; lockedIds?: number[]; onToggle?: (id: number) => void; onView?: (concept: ConceptRow) => void }) {
  const [viewed, setViewed] = useState<ConceptRow | null>(null);
  const prefix = useId();
  return <>
    <ul className={`${book.rows} ${styles.spacedRows}`}>{concepts.map(concept => <li key={concept.id}>
      <div className={styles.rowBody}>{onToggle ? <label className={styles.conceptOption} htmlFor={`${prefix}-${concept.id}`}><input id={`${prefix}-${concept.id}`} type="checkbox" checked={selectedIds?.includes(concept.id) ?? false} disabled={lockedIds.includes(concept.id)} onChange={() => onToggle(concept.id)} /><span className={styles.singleLine}>{concept.name}</span></label> : <strong className={styles.singleLine}>{concept.name}</strong>}{concept.detail && <small className={styles.rowDetail}>{concept.detail}</small>}</div>
      <button type="button" className={book.textButton} onClick={() => onView ? onView(concept) : setViewed(concept)}>View<span className="sr-only"> {concept.name}</span></button>
    </li>)}</ul>
    {viewed && ((viewed.teachingBrief || viewed.prerequisites || viewed.learningOutcomes) ? <LessonBriefDialog name={viewed.name} state={{ status: "ready", brief: viewed.teachingBrief ?? { prerequisites: viewed.prerequisites ?? [], learningOutcomes: viewed.learningOutcomes ?? [] } }} onClose={() => setViewed(null)} /> : <TeacherDialog title="Concept details" onClose={() => setViewed(null)}><p className={styles.detailText}>{viewed.name}</p>{viewed.detail && <p className={styles.note}>{viewed.detail}</p>}<footer><button type="button" className={book.primary} onClick={() => setViewed(null)}>Close</button></footer></TeacherDialog>)}
  </>;
}
