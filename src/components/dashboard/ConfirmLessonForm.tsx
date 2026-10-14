"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Subject } from "./RoleDashboard";
import styles from "./role-dashboard.module.css";
export default function ConfirmLessonForm({ lesson, onConfirmed, onHomework }: { lesson: Subject["lessons"][number]; onConfirmed: () => void; onHomework: () => void }) {
 const [ids,setIds]=useState(lesson.concepts.map(item=>item.id)),[busy,setBusy]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
 async function confirm(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError("");try{await api.patch("/staff/lessons/"+lesson.id+"/confirm",{conceptIds:ids});setDone(true);onConfirmed();}catch(err){setError(err instanceof Error?err.message:"Could not confirm lesson.");}finally{setBusy(false);}}
 if(done)return <div className={styles.modalEmpty}><span className={styles.successMark}>✓</span><h3>Lesson confirmed</h3><p>Your coverage now reflects what you taught. Concepts you left unchecked remain available for your next lesson.</p>{ids.length>0&&<button className={styles.primaryButton} onClick={onHomework}>Create homework</button>}</div>;
 return <form className={styles.workflowForm} onSubmit={confirm}><fieldset disabled={busy}><h3>{lesson.chapterName}</h3><p className={styles.muted}>Uncheck anything you didn’t actually cover.</p>{lesson.concepts.map(concept=><label className={styles.conceptChoice} key={concept.id}><input type="checkbox" checked={ids.includes(concept.id)} onChange={()=>setIds(current=>current.includes(concept.id)?current.filter(id=>id!==concept.id):[...current,concept.id])}/><span>{concept.name}</span></label>)}{error&&<p className={styles.formError} role="alert">{error}</p>}<button className={styles.primaryButton} disabled={busy}>{busy?"Confirming…":"Confirm what was taught"}</button></fieldset></form>;
}
