/**
 * Compact preview of one draft question: concept, question and memo each occupy a short
 * line. View opens the full editor in the parent; Delete removes the draft item rather than
 * calling a database endpoint here.
 */
import styles from "./homework.module.css";
import book from "@/components/principal/books/books.module.css";
import MobileAction from "@/components/shared/MobileAction";

export default function HomeworkQuestionSummary({ number, concept, body, memo, onView, onDelete }: { number: number; concept: string; body: string; memo: string; onView: () => void; onDelete: () => void }) {
  return <article className={`${styles.questionSummary} motion-enter`}>
    <div className={styles.questionHeading}><h3>Question {number}</h3><div className={styles.questionActions}><MobileAction icon="view" label={`View question ${number}`} className={book.textButton} onClick={onView}>View</MobileAction><MobileAction icon="delete" label={`Delete question ${number}`} className={book.textButton} onClick={onDelete}>Delete</MobileAction></div></div>
    <dl className={styles.questionLines}>{[["Based on", concept], ["Question", body], ["Worked memo", memo || "No memo yet"]].map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}</dl>
  </article>;
}
