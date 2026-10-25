/**
 * Shared teacher section heading and body. The action prop puts an Add button on the same
 * line at the right edge; count is a display badge. Reuse this to keep section rules and
 * spacing consistent.
 */
import type { ReactNode } from "react";
import book from "@/components/principal/books/books.module.css";
import styles from "./teacher-books.module.css";

export default function TeacherSection({ title, count, action, children }: { title: string; count?: number; action?: ReactNode; children: ReactNode }) {
  return <section className={book.section} aria-label={title}>
    <div className={`${book.sectionHeading} ${styles.sectionHeading}`}><h2>{title}</h2>{count !== undefined && <span>{count}</span>}{action && <div className={styles.sectionAction}>{action}</div>}</div>
    {children}
  </section>;
}
