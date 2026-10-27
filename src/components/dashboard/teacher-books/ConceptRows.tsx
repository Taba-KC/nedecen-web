"use client";

/**
 * Compact concept list with optional selection checkboxes and a View action. The parent owns
 * selected IDs; this component reports toggles and opens a brief viewer without marking
 * anything taught.
 */
import { useId, useState } from "react";
import TeacherDialog from "./TeacherDialog";
import book from "@/components/principal/books/books.module.css";
import styles from "./teacher-books.module.css";
import LessonBriefDialog from "../LessonBriefDialog";
import type { LessonBrief } from "../lessonBrief";
import { useModalMotion } from "@/hooks/useModalMotion";
import MobileAction from "@/components/shared/MobileAction";

export type ConceptRow = { id: number; name: string; detail?: string; teachingBrief?: LessonBrief | null; prerequisites?: string[]; learningOutcomes?: string[]; reviewGoals?: string[] };

export default function ConceptRows({ concepts, selectedIds, lockedIds = [], onToggle, showView = true }: { concepts: ConceptRow[]; selectedIds?: number[]; lockedIds?: number[]; onToggle?: (id: number) => void; showView?: boolean }) {
  const [viewed, setViewed] = useState<ConceptRow | null>(null);
  const motion = useModalMotion(() => setViewed(null));
  const prefix = useId();
  return <>
    <ul className={`${book.rows} ${styles.spacedRows}`}>{concepts.map(concept => <li key={concept.id}>
      <div className={styles.rowBody}>{onToggle ? <label className={styles.conceptOption} htmlFor={`${prefix}-${concept.id}`}><input id={`${prefix}-${concept.id}`} type="checkbox" checked={selectedIds?.includes(concept.id) ?? false} disabled={lockedIds.includes(concept.id)} onChange={() => onToggle(concept.id)} /><span className={styles.singleLine}>{concept.name}</span></label> : showView ? <button type="button" className={`${styles.singleLine} ${styles.conceptTitleButton}`} onClick={() => setViewed(concept)}>{concept.name}</button> : <strong className={styles.singleLine}>{concept.name}</strong>}{concept.detail && <small className={styles.rowDetail}>{concept.detail}</small>}
        {!!concept.reviewGoals?.length && <div className={styles.reviewFocus}><strong>Focus on these learning goals</strong><ul>{concept.reviewGoals.map(goal => <li key={goal}>{goal}</li>)}</ul></div>}
      </div>
      {showView && <MobileAction icon="view" label={`View ${concept.name}`} className={book.textButton} onClick={() => setViewed(concept)}>View</MobileAction>}
    </li>)}</ul>
    {viewed && ((viewed.teachingBrief || viewed.prerequisites || viewed.learningOutcomes) ? <LessonBriefDialog name={viewed.name} state={{ status: "ready", brief: viewed.teachingBrief ?? { prerequisites: viewed.prerequisites ?? [], learningOutcomes: viewed.learningOutcomes ?? [] } }} onClose={() => setViewed(null)} /> : <TeacherDialog motion={motion} title="Concept details" onClose={motion.close}><p className={styles.detailText}>{viewed.name}</p>{viewed.detail && <p className={styles.note}>{viewed.detail}</p>}<footer><button type="button" className={book.primary} onClick={motion.close}>Close</button></footer></TeacherDialog>)}
  </>;
}
