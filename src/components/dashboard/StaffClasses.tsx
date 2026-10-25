"use client";
/**
 * Teaching-assignment cards and their modal/detail selection. This is a separate card-based
 * component; the current staff route enters TeacherBookWorkspace instead.
 */
import { useEffect, useRef, useState } from "react";
import type { Subject } from "./RoleDashboard";
import PlanLessonForm from "./PlanLessonForm";
import HomeworkForm from "./HomeworkForm";
import ConfirmLessonForm from "./ConfirmLessonForm";
import QuestionMemoEditor from "./QuestionMemoEditor";
import styles from "./role-dashboard.module.css";
export type StaffPanel = "plan" | "createHomework" | "coverage" | "lessons" | "homework" | "confirm";
const titles: Record<StaffPanel,string> = { plan:"Plan a lesson",createHomework:"Create homework",coverage:"Curriculum Coverage",lessons:"Lessons",homework:"Homework",confirm:"Confirm what was taught" };
/**
 * Add the visible Grade prefix only when needed; keep the stored class identity unchanged.
 */
function classLabel(subject:Subject){return /^grade\s/i.test(subject.className)?subject.className:"Grade "+subject.className;}
/**
 * Format a stored date for display. Formatting a label does not change the saved lesson or
 * due time.
 */
function dateLabel(value:string){return new Intl.DateTimeFormat("en-ZA",{day:"numeric",month:"short",year:"numeric",timeZone:"Africa/Johannesburg"}).format(new Date(value.length===10?value+"T12:00:00+02:00":value));}
/**
 * Get the school calendar date in South Africa, independently of the browser machine's
 * timezone.
 */
function today(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Johannesburg",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
export default function StaffClasses({subjects,selectedId,onSelect,onBack,panel,onPanelChange,lessonId,onRefresh,refreshing,history}: {
 subjects:Subject[];selectedId:number|null;onSelect:(id:number)=>void;onBack:()=>void;panel:StaffPanel|null;onPanelChange:(panel:StaffPanel|null)=>void;lessonId:number|null;onRefresh:()=>void;refreshing:boolean;history:boolean;
}) {
 const subject=subjects.find(item=>item.id===selectedId)??subjects[0];
 const [confirmId,setConfirmId]=useState<number|null>(null);
 const dialogRef=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=dialogRef.current;if(!dialog||!panel||!subject)return;dialog.showModal();const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
 const dismiss=(event:PointerEvent)=>{if(event.target!==dialog)return;const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)onPanelChange(null);};dialog.addEventListener("pointerdown",dismiss);
 return()=>{dialog.removeEventListener("pointerdown",dismiss);dialog.close();document.body.style.overflow=overflow;};},[panel,subject,onPanelChange]);
 if(!subject)return <section className={styles.panel}><span className={styles.status}>Awaiting assignment</span><h1>Your classes will appear here</h1><p className={styles.muted}>Your principal hasn’t assigned you to a subject in a class yet.</p><button className={styles.button} onClick={onRefresh} disabled={refreshing}>Refresh assignments</button></section>;
 const selectedLesson=subject.lessons.find(lesson=>lesson.id===(confirmId??lessonId));
 const cards:StaffPanel[]=history?["lessons","homework"]:["plan","createHomework","coverage"];
 function openCard(next:StaffPanel){setConfirmId(null);onPanelChange(next);}
 return <div className={styles.staffWorkspace+(selectedId!==null?" "+styles.mobileSelected:"")}>
  <aside className={styles.classSidebar} aria-label="Your class subjects"><div className={styles.sidebarHeading}><div><h1>Classes & Subjects</h1><p>Your teaching allocations</p></div></div><div className={styles.classChoices}><ul>{subjects.map(item=><li key={item.id}><button aria-current={subject.id===item.id?"page":undefined} onClick={()=>{setConfirmId(null);onSelect(item.id);}}>{item.subjectName} · {classLabel(item)}</button></li>)}</ul></div></aside>
  <section className={styles.classWorkspace} aria-label={subject.subjectName+" in "+subject.className}><button className={styles.mobileBack} onClick={onBack}>← Classes & subjects</button><div className={styles.mobileSubjectHeading}><h1>{subject.subjectName} · {classLabel(subject)}</h1></div><div className={styles.featureGrid}>{cards.map(item=><button key={item} className={styles.featureCard+((item==="plan"||item==="createHomework")?" "+styles.createCard:"")} onClick={()=>openCard(item)} aria-haspopup="dialog">{item==="plan"||item==="createHomework"?<><span className={styles.createPlus} aria-hidden="true">+</span><h2>{item==="plan"?"Plan A Lesson":"Create Homework"}</h2><p>{subject.subjectName} · {classLabel(subject)}</p></>:<><span className={styles.cardSymbol} aria-hidden="true">{item==="coverage"?"▥":item==="lessons"?"▤":"☷"}</span><h2>{titles[item]}</h2><p>{item==="coverage"?subject.taughtConcepts+" / "+subject.totalConcepts+" concepts taught":item==="lessons"?"Past lessons and saved plans":"Previously shared homework"}</p><span className={styles.featureLink}>View <span aria-hidden="true">→</span></span></>}</button>)}</div></section>
  <dialog ref={dialogRef} className={styles.workspaceDialog} aria-labelledby="staff-workspace-dialog-title" onCancel={()=>onPanelChange(null)}><div className={styles.dialogHeader}><div><p className={styles.eyebrow}>{subject.subjectName} · {classLabel(subject)}</p><h2 id="staff-workspace-dialog-title">{panel?titles[panel]:""}</h2></div><button className={styles.closeDialog} onClick={()=>onPanelChange(null)} aria-label="Close dialog">✕</button></div><div className={styles.dialogBody}>
   {panel==="plan"&&<PlanLessonForm subject={subject} onSaved={onRefresh}/>}
   {panel==="createHomework"&&<HomeworkForm subject={subject} lessonId={confirmId??lessonId} onSent={onRefresh}/>}
   {panel==="confirm"&&(selectedLesson?<ConfirmLessonForm key={selectedLesson.id} lesson={selectedLesson} onConfirmed={onRefresh} onHomework={()=>onPanelChange("createHomework")}/>:<p className={styles.empty}>This plan is no longer available.</p>)}
   {panel==="lessons"&&<>{subject.lessons.length?subject.lessons.map(lesson=><details key={lesson.id} open={lessonId===lesson.id?true:undefined} className={styles.disclosure}><summary>{lesson.chapterName}<small>{dateLabel(lesson.date)} · {lesson.status==="confirmed"?"Confirmed":"Planned"}</small></summary><div className={styles.details}><h3>{lesson.status==="confirmed"?"Taught concepts":"Planned concepts"}</h3><ul>{lesson.concepts.map(concept=><li key={concept.id}>{concept.name}</li>)}</ul>{lesson.status==="planned"&&lesson.date<=today()&&<button className={styles.primaryButton} onClick={()=>{setConfirmId(lesson.id);onPanelChange("confirm");}}>Confirm what was taught</button>}{lesson.status==="confirmed"&&!lesson.homework.length&&lesson.concepts.length>0&&<button className={styles.button} onClick={()=>{setConfirmId(lesson.id);onPanelChange("createHomework");}}>Create homework</button>}</div></details>):<div className={styles.modalEmpty}><h3>No lessons yet</h3><p>Your confirmed lessons and saved plans will appear here.</p></div>}</>}
   {panel==="homework"&&<>{subject.lessons.some(lesson=>lesson.homework.length)?subject.lessons.flatMap(lesson=>lesson.homework.map(hw=><details key={hw.id} className={styles.disclosure}><summary>{lesson.chapterName}<small>Lesson: {dateLabel(lesson.date)} · Due: {dateLabel(hw.dueDate)}</small></summary><div className={styles.details}><ol>{hw.questions.map(question=><li key={question.id}><QuestionMemoEditor question={question} onSaved={onRefresh}/></li>)}</ol></div></details>)):<div className={styles.modalEmpty}><h3>No homework yet</h3><p>Homework shared with this class will appear here.</p></div>}</>}
   {panel==="coverage"&&<><div className={styles.coverageSummary}><div className={styles.progressLabel}><span>{subject.taughtConcepts} / {subject.totalConcepts} concepts taught</span><span>{subject.totalConcepts?Math.round(subject.taughtConcepts/subject.totalConcepts*100):0}%</span></div><progress value={subject.taughtConcepts} max={subject.totalConcepts||1} aria-label="Confirmed curriculum coverage"/><p className={styles.muted}>Only confirmed lessons count as taught.</p></div>{subject.curriculum.length?subject.curriculum.map(chapter=><details key={chapter.id} className={styles.disclosure}><summary>{chapter.name}<small>{chapter.taught} / {chapter.total} concepts taught</small></summary><div className={styles.details}>{chapter.topics.map(topic=><details key={topic.id} className={styles.topic}><summary>{topic.name}<small>{topic.concepts.length} concepts</small></summary><ol>{topic.concepts.map(concept=><li key={concept.id}>{concept.name}</li>)}</ol></details>)}</div></details>):<p className={styles.empty}>Curriculum hasn’t been published for this allocation yet.</p>}</>}
  </div></dialog>
 </div>;
}
