"use client";

import type { LearnerConcept } from "./registry";
import Chalkboard, { ChalkboardTeacher } from "./Chalkboard";
import styles from "./lesson-chalkboard.module.css";

/** Syllabus guidance follows the coverage filter; feedback stays attached to completed lessons. */
export default function SyllabusChalkboard({ concepts, covered }: { concepts: LearnerConcept[]; covered: boolean }) {
  return <Chalkboard items={concepts} noun="Concept" context="syllabus" intro={covered ? "Concepts you’ve covered" : "Concepts still to come"} renderItem={(concept, position) => <>
    <div className={styles.conceptHeading}><span className={styles.kicker}>Concept {position + 1} of {concepts.length}</span><h3>{concept.name}</h3><span className={styles.underline} aria-hidden="true" /><ChalkboardTeacher /></div>
    <p className={styles.topic}>{concept.chapterName} · {concept.topicName}</p>
    <div className={styles.prerequisites}><h4><span aria-hidden="true">↳</span> Prerequisites</h4><p className={styles.hint}>{covered ? "A quick look at the ideas behind this concept." : "Bring these ideas with you."}</p>
      {concept.prerequisites.length ? <ul>{concept.prerequisites.map((item, index) => <li key={index}><span aria-hidden="true">✧</span><span>{item}</span></li>)}</ul> : <p className={styles.noPrerequisites}>No prerequisites listed. You can start right here.</p>}
    </div>
    <details className={styles.goals}><summary>Learning goals <span aria-hidden="true">＋</span></summary>{concept.learningOutcomes.length ? <ul>{concept.learningOutcomes.map((goal, index) => <li key={index}>{goal}</li>)}</ul> : <p>No learning goals have been added yet.</p>}</details>
  </>} />;
}
