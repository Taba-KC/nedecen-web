import styles from "./homework.module.css";
import book from "@/components/principal/books/books.module.css";

export default function HomeworkQuestionSummary({ number, concept, body, memo, onView, onDelete }: { number: number; concept: string; body: string; memo: string; onView: () => void; onDelete: () => void }) {
  return <article className={styles.questionSummary}>
    <div className={styles.questionHeading}><h3>Question {number}</h3><div className={styles.questionActions}><button type="button" className={book.textButton} onClick={onView}>View<span className="sr-only"> question {number}</span></button><button type="button" className={book.textButton} onClick={onDelete}>Delete<span className="sr-only"> question {number}</span></button></div></div>
    <dl className={styles.questionLines}>{[["Based on", concept], ["Question", body], ["Worked memo", memo || "No memo yet"]].map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}</dl>
  </article>;
}
