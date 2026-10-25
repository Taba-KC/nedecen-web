"use client";

/**
 * Read-only view of concept guidance. For confirmed lessons the backend can supply a saved
 * teaching-brief snapshot, preserving what was attached when the lesson was taught.
 */
import TeacherDialog from "./teacher-books/TeacherDialog";
import TeacherSection from "./teacher-books/TeacherSection";
import type { BriefState } from "./lessonBrief";
import book from "@/components/principal/books/books.module.css";
import styles from "./teacher-books/teacher-books.module.css";

export default function LessonBriefDialog({ name, state, onClose }: { name: string; state?: BriefState; onClose: () => void }) {
  const brief = state?.brief;
  return <TeacherDialog title="Concept details" onClose={onClose}>
    <TeacherSection title="Concept"><p className={styles.detailText}>{name}</p></TeacherSection>
    <TeacherSection title="Prerequisites for understanding it">{brief?.prerequisites.length ? <ul className={styles.concepts}>{brief.prerequisites.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No prerequisites have been added to this concept.</p>}</TeacherSection>
    <TeacherSection title="Learning outcomes">{brief?.learningOutcomes.length ? <ul className={styles.concepts}>{brief.learningOutcomes.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No learning outcomes have been added to this concept.</p>}</TeacherSection>
    <footer><button type="button" className={book.primary} onClick={onClose}>Close</button></footer>
  </TeacherDialog>;
}
