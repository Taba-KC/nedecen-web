"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Subject } from "./RoleDashboard";
import styles from "./role-dashboard.module.css";
import TeacherSection from "./teacher-books/TeacherSection";
import ConceptRows from "./teacher-books/ConceptRows";
import local from "./teacher-books/teacher-books.module.css";
export default function ConfirmLessonForm({ lesson, onConfirmed, onHomework, onBusyChange }: { lesson: Subject["lessons"][number]; onConfirmed: () => void; onHomework: () => void; onBusyChange?: (busy: boolean) => void }) {
 const [ids,setIds]=useState(lesson.concepts.map(item=>item.id)),[busy,setBusy]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
 async function confirm(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);onBusyChange?.(true);setError("");try{await api.patch("/staff/lessons/"+lesson.id+"/confirm",{conceptIds:ids});setDone(true);onConfirmed();}catch(err){setError(err instanceof Error?err.message:"Could not confirm lesson.");}finally{setBusy(false);onBusyChange?.(false);}}
 if(done)return <div className={local.statusMessage} role="status"><h2>Lesson confirmed</h2><p>Your coverage now reflects what you taught. Unchecked concepts remain available for your next lesson.</p>{ids.length>0&&<button className={styles.primaryButton} onClick={onHomework}>Create homework</button>}</div>;
 return <form className={`${styles.workflowForm} ${local.compactForm}`} onSubmit={confirm}><fieldset disabled={busy}><p className={local.contextLine}>You are confirming: <strong>{lesson.chapterName}</strong></p><TeacherSection title="Taught concepts" count={ids.length}><p className={local.note}>Uncheck anything you did not cover.</p><ConceptRows concepts={lesson.concepts} selectedIds={ids} onToggle={id=>setIds(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id])}/></TeacherSection>{error&&<p className={styles.formError} role="alert">{error}</p>}<button className={styles.primaryButton} disabled={busy}>{busy?"Confirming…":"Confirm what was taught"}</button></fieldset></form>;
}
