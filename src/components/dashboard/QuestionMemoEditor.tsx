"use client";
/**
 * Edit a memo for an already saved question. Unlike an unsent homework draft, Save here
 * sends a PATCH request to persist the memo through a permission-checked backend operation.
 */
import { useState } from "react";
import { api } from "@/lib/api";
import styles from "./role-dashboard.module.css";
export default function QuestionMemoEditor({question,onSaved}:{question:{id:number;body:string;memo?:string|null};onSaved:()=>void}){
 const [editing,setEditing]=useState(false),[memo,setMemo]=useState(question.memo??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 /**
  * Persist the edited memo for a saved question through the staff endpoint, then notify the
  * parent after success.
  */
 async function save(){if(busy)return;setBusy(true);setError("");try{await api.patch("/staff/questions/"+question.id+"/memo",{memo});setEditing(false);onSaved();}catch(err){setError(err instanceof Error?err.message:"Could not update memo.");}finally{setBusy(false);}}
 return <div className={styles.historyQuestion}><p>{question.body}</p>{editing?<div className={styles.workflowForm}><label>Worked memo (optional)<textarea maxLength={24000} value={memo} onChange={event=>setMemo(event.target.value)} disabled={busy}/></label>{error&&<p className={styles.formError} role="alert">{error}</p>}<div className={styles.formActions}><button className={styles.button} disabled={busy} onClick={save}>{busy?"Saving…":"Save memo"}</button><button className={styles.textButton} disabled={busy} onClick={()=>setEditing(false)}>Cancel</button></div></div>:<><p className={styles.savedMemo}>{question.memo||"No memo yet"}</p><button className={styles.textButton} onClick={()=>{setMemo(question.memo??"");setEditing(true);}}>{question.memo?"Edit memo":"Add memo"}</button></>}</div>;
}
