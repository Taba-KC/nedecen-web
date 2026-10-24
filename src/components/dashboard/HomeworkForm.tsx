"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Subject } from "./RoleDashboard";
import styles from "./role-dashboard.module.css";
import HomeworkMethodFilters, { type HomeworkMode } from "./HomeworkMethodFilters";
import ManualQuestionDialog from "./ManualQuestionDialog";
import HomeworkQuestionSummary from "./HomeworkQuestionSummary";
import HomeworkQuestionDialog from "./HomeworkQuestionDialog";
import TeacherDialog from "./teacher-books/TeacherDialog";
import { lessonName, dateLabel } from "./teacher-books/registry";
import book from "@/components/principal/books/books.module.css";
import local from "./homework.module.css";
import TeacherSection from "./teacher-books/TeacherSection";
type Context = { concepts:{id:number;name:string}[]; existingHomeworkId:number|null; aiAvailable:boolean; chapterName:string };
type Question = { key:string; conceptId:number; body:string; memo:string };
function localDateTime() { const date=new Date(Date.now()+86400000);date.setMinutes(date.getMinutes()-date.getTimezoneOffset());return date.toISOString().slice(0,16); }
export default function HomeworkForm({ subject, lessonId, onSent, mode }: { subject:Subject; lessonId:number|null; onSent:()=>void; mode?:HomeworkMode }) {
 const [internalMode,setInternalMode]=useState<HomeworkMode>("manual");
 const activeMode=mode??internalMode;
 const eligible=subject.lessons.filter(lesson=>lesson.status==="confirmed"&&!lesson.homework.length&&lesson.concepts.length>0);
 const [picking,setPicking]=useState(false);
 const [chosen,setChosen]=useState(eligible.find(lesson=>lesson.id===lessonId)?.id??eligible[0]?.id??null);
 if(chosen===null)return <div className={styles.modalEmpty}><h3>No lesson needs homework</h3><p>First confirm a lesson with taught concepts. Each confirmed lesson can have one homework set.</p></div>;
 const retained=subject.lessons.find(lesson=>lesson.id===chosen);
 const choices=(retained&&!eligible.some(lesson=>lesson.id===chosen)?[...eligible,retained]:eligible).toSorted((a,b)=>(a.lessonNumber??a.id)-(b.lessonNumber??b.id));
 return <>
  <div className={local.lessonSummary}><p>You are {activeMode==="ai"?"automatically":"manually"} creating homework for: <strong>{retained ? `${lessonName(retained, subject)} - ${dateLabel(retained.date)}` : "Selected lesson"}</strong></p><button type="button" className={book.textButton} onClick={()=>setPicking(true)}>Pick another lesson</button></div>
  <HomeworkComposer key={chosen} lessonId={chosen} onSent={onSent} mode={activeMode} onModeChange={mode===undefined?setInternalMode:undefined}/>
  {picking&&<TeacherDialog title="Pick another lesson" onClose={()=>setPicking(false)}><ul className={`${book.rows} ${local.lessonChoices}`}>{choices.map(lesson=><li key={lesson.id}><button type="button" className={book.rowLink} aria-current={lesson.id===chosen?"true":undefined} onClick={()=>{setChosen(lesson.id);setPicking(false);}}><span><strong>{lessonName(lesson, subject)} - {dateLabel(lesson.date)}</strong><small>{lesson.chapterName}</small></span>{lesson.id===chosen?<span className={book.badge}>Selected</span>:<span aria-hidden="true">→</span>}</button></li>)}</ul></TeacherDialog>}
 </>;
}
function HomeworkComposer({ lessonId,onSent,mode,onModeChange }:{lessonId:number;onSent:()=>void;mode:HomeworkMode;onModeChange?:(mode:HomeworkMode)=>void}) {
 const [context,setContext]=useState<Context|null>(null),[counts,setCounts]=useState<Record<number,number>>({}),[draft,setDraft]=useState<Question[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
 const [questionDialogOpen,setQuestionDialogOpen]=useState(false);
 const [viewedQuestion,setViewedQuestion]=useState<string|null>(null);
 const [dueDate,setDueDate]=useState(localDateTime),[release,setRelease]=useState("at_due_date"),[releaseAt,setReleaseAt]=useState("");
 useEffect(()=>{let active=true;api.get<Context>("/staff/lessons/"+lessonId+"/homework-context").then(result=>{if(!active)return;setContext(result);setCounts(Object.fromEntries(result.concepts.map(concept=>[concept.id,2])));}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[lessonId]);
 function edit(key:string,patch:Partial<Question>){setDraft(current=>current.map(question=>question.key===key?{...question,...patch}:question));}
 async function generate(){if(busy||!context)return;setBusy(true);setError("");try{const result=await api.post<{questions:{conceptId:number;body:string;memo:string}[]}>("/staff/lessons/"+lessonId+"/generate-homework",{counts:context.concepts.map(concept=>({conceptId:concept.id,count:counts[concept.id]??0}))});setDraft(current=>[...current,...result.questions.map(question=>({...question,key:crypto.randomUUID(),}))]);}catch(err){setError(err instanceof Error?err.message:"Could not generate homework.");}finally{setBusy(false);}}
 async function send(event:React.FormEvent){event.preventDefault();if(busy)return;if(!draft.length||draft.some(question=>!question.body.trim())){setError("Add a non-empty question before sending homework.");return;}setBusy(true);setError("");try{await api.post("/staff/lessons/"+lessonId+"/homework",{dueDate:new Date(dueDate).toISOString(),memoReleaseType:release,...(release==="custom"?{memoReleaseAt:new Date(releaseAt).toISOString()}:{}),questions:draft.map(question=>({conceptId:question.conceptId,body:question.body,memo:question.memo}))});setSent(true);onSent();}catch(err){setError(err instanceof Error?err.message:"Could not send homework.");}finally{setBusy(false);}}
 if(sent)return <div className={styles.modalEmpty}><span className={styles.successMark}>✓</span><h3>Homework sent</h3><p>Your class can now see these questions. Worked memos follow your release setting.</p></div>;
 if(!context)return <p role={error?"alert":"status"}>{error||"Loading confirmed concepts…"}</p>;
 if(context.existingHomeworkId)return <p className={styles.empty}>This lesson already has homework.</p>;
 const viewed=draft.find(question=>question.key===viewedQuestion);
 const total=Object.values(counts).reduce((sum,count)=>sum+count,0);
 return <><form className={styles.workflowForm} onSubmit={send}><fieldset disabled={busy}>
  {onModeChange&&<HomeworkMethodFilters mode={mode} onChange={onModeChange}/>}
  {mode==="ai"&&<TeacherSection title="Questions per concept" count={total} action={context.aiAvailable&&<button type="button" className={book.contextButton} disabled={busy||total<1||total>30||draft.length+total>50} onClick={generate}>{busy?"Generating…":"Generate questions & memos"}</button>}>
    {context.aiAvailable?<>{context.concepts.map(concept=><label className={styles.questionCount} key={concept.id}><span className={local.singleLine} title={concept.name}>{concept.name}</span><input type="number" min={0} max={10} step={1} value={counts[concept.id]??0} onChange={event=>setCounts(current=>({...current,[concept.id]:Math.max(0,Math.min(10,Number(event.target.value)))}))}/></label>)}<p className={styles.muted}>Maximum 30 questions per generation. Review questions and worked memos before sending.</p></>:<p className={styles.muted}>Automatic generation is not available yet. You can write questions manually.</p>}
  </TeacherSection>}
  <section><div className={local.questionsHeading}><h3>Questions</h3><button type="button" className={book.contextButton} disabled={!context.concepts.length||draft.length>=50} onClick={()=>setQuestionDialogOpen(true)}>+ Add a question</button></div>{!draft.length&&<p className={styles.muted}>Homework questions will show up here. Add your first question, or generate a draft above.</p>}{draft.map((question,index)=><HomeworkQuestionSummary key={question.key} number={index+1} concept={context.concepts.find(concept=>concept.id===question.conceptId)?.name??"Concept unavailable"} body={question.body} memo={question.memo} onView={()=>setViewedQuestion(question.key)} onDelete={()=>setDraft(current=>current.filter(item=>item.key!==question.key))}/>)}</section>
  <hr className={local.sectionDivider}/>
  <label className={local.inlineField}><span>Due date and time:</span><input type="datetime-local" required value={dueDate} onChange={event=>setDueDate(event.target.value)}/></label>
  <label className={local.inlineField}><span>Memo release:</span><select value={release} onChange={event=>setRelease(event.target.value)}><option value="immediately">Immediately</option><option value="at_due_date">At due date</option><option value="custom">Custom time</option></select></label>
  {release==="custom"&&<label className={local.inlineField}><span>Release memos at:</span><input type="datetime-local" required value={releaseAt} onChange={event=>setReleaseAt(event.target.value)}/></label>}
  {error&&<p className={styles.formError} role="alert">{error}</p>}{busy&&<p role="status" className={styles.muted}>Working… Your draft is being kept here.</p>}<button className={styles.primaryButton} disabled={busy||!draft.length||draft.some(question=>!question.body.trim())}>{busy?"Please wait…":"Send homework to class"}</button>
 </fieldset></form>{questionDialogOpen&&<ManualQuestionDialog concepts={context.concepts} onClose={()=>setQuestionDialogOpen(false)} onSave={question=>setDraft(current=>[...current,{...question,key:crypto.randomUUID(),}])}/>}{viewed&&<HomeworkQuestionDialog key={viewed.key} number={draft.indexOf(viewed)+1} question={viewed} concepts={context.concepts} lessonId={lessonId} aiAvailable={context.aiAvailable} onSave={question=>edit(viewed.key,question)} onClose={()=>setViewedQuestion(null)}/>}</>;
}
