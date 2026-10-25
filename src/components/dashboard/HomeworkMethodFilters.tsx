/**
 * The two homework creation controls beside the page title. Clicking one reports manual or
 * ai to the owning component; that value decides whether generation controls are shown.
 */
import styles from "@/components/principal/books/books.module.css";

export type HomeworkMode = "manual" | "ai";

export default function HomeworkMethodFilters({ mode, onChange }: { mode: HomeworkMode; onChange: (mode: HomeworkMode) => void }) {
  return <div className={styles.tabs} role="group" aria-label="Homework creation method">
    <button type="button" aria-pressed={mode === "manual"} onClick={() => onChange("manual")}>Write manually</button>
    <button type="button" aria-pressed={mode === "ai"} onClick={() => onChange("ai")}>Generate automatically</button>
  </div>;
}
