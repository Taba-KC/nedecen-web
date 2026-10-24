import type { ReactNode } from "react";
import book from "@/components/principal/books/books.module.css";
import styles from "./teacher-books.module.css";

export default function TeacherPageHeading({ title, subtitle, controls }: { title: string; subtitle?: ReactNode; controls?: ReactNode }) {
  return <header className={book.pageHeading} data-page-heading>
    <div className={book.titleRow}><h1>{title}</h1>{controls && <div className={book.headingControls}><div className={book.filterTools}>{controls}</div></div>}</div>
    {subtitle && <p className={styles.allocation}>{subtitle}</p>}
  </header>;
}
