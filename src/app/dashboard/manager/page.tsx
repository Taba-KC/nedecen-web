"use client";

import AppSelect from "@/components/shared/AppSelect";
/**
 * Shared curriculum editor for app managers. It loads a subject and grade, edits a local
 * chapter/topic/concept tree, previews spreadsheets, then explicitly saves through the
 * manager API. Array order becomes curriculum order; record IDs preserve identity during
 * edits.
 */
import MobileAction from "@/components/shared/MobileAction";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccountType, logout } from "@/lib/auth";
import styles from "./manager.module.css";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { useModalMotion } from "@/hooks/useModalMotion";
type Concept = { id?:number; name:string; prerequisites?:string[]; learningOutcomes?:string[]; key:string };
type Topic = { id?:number; name:string; concepts:Concept[]; key:string };
type Chapter = { id?:number; name:string; topics:Topic[]; key:string };
type RawChapter = { id?:number; name:string; topics:{ id?:number; name:string; concepts:{ id?:number; name:string; prerequisites?:string[]; learningOutcomes?:string[] }[] }[] };
type Library = { subjectId:number; gradeNumber:number; revision:number; exists:boolean; chapters:RawChapter[] };
type Sheet = { name:string; chapters:RawChapter[]; warnings:string[] };
/**
 * Browser keys keep unsaved items stable in React. Existing database IDs are retained
 * separately for updates.
 */
const decorate = (rows:RawChapter[]):Chapter[] => rows.map(c => ({ ...c,key:crypto.randomUUID(),topics:c.topics.map(t => ({ ...t,key:crypto.randomUUID(),concepts:t.concepts.map(x => ({ ...x,key:crypto.randomUUID() })) })) }));
/**
 * Return a reordered copy of an array. Its new order becomes the curriculum order on Save;
 * IDs remain attached to the same records.
 */
function move<T>(items:T[], i:number, d:number) { const next=[...items]; if(i+d<0||i+d>=items.length)return next; [next[i],next[i+d]]=[next[i+d],next[i]]; return next; }
/** Keep existing confirmation choices, using the same brief animated exit as other roles. */
function CurriculumConfirmation({ message, onConfirm, onClose }: { message: string; onConfirm: () => void; onClose: () => void }) {
 const accepted=useRef(false);
 const motion=useModalMotion(()=>{onClose();if(accepted.current)onConfirm();});
 return <BottomSheet isOpen title="Confirm change" width="md" motion={motion} onClose={motion.close}>
  <p>{message}</p><div className={styles.actions}><button type="button" autoFocus onClick={motion.close}>Cancel</button><button type="button" className={styles.primary} onClick={()=>{accepted.current=true;motion.close();}}>Confirm</button></div>
 </BottomSheet>;
}
export default function ManagerCurriculum() {
 const router=useRouter();
 const [confirmation,setConfirmation]=useState<{id:string;message:string;run:()=>void}|null>(null);
 const ask=(message:string,run:()=>void)=>setConfirmation({id:crypto.randomUUID(),message,run});
 const [ready,setReady]=useState(false),[subjects,setSubjects]=useState<{id:number;name:string}[]>([]);
 const [subjectId,setSubjectId]=useState(""),[grade,setGrade]=useState("11");
 const [library,setLibrary]=useState<Library|null>(null),[chapters,setChapters]=useState<Chapter[]>([]);
 const [sheets,setSheets]=useState<Sheet[]>([]),[sheetIndex,setSheetIndex]=useState(0);
 const [busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 const [error,setError]=useState(""),[message,setMessage]=useState(""),[newSubject,setNewSubject]=useState("");
 useEffect(()=>{ if(getAccountType()!=="manager"){router.replace("/manager/login");return;} let cancelled=false;
 api.get<{id:number;name:string}[]>("/manager/subjects").then(rows=>{if(!cancelled){setSubjects(rows);setSubjectId(String(rows[0]?.id??""));setReady(true);}}).catch(e=>{if(!cancelled){setError(e.message);setReady(true);}});return()=>{cancelled=true;}; },[router]);
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
 /**
  * Ask before replacing local edits. A successful local edit still needs an explicit server
  * Save.
  */
 const discard=(run:()=>void)=>{if(dirty)ask("Discard unsaved curriculum edits?",run);else run();};
 /**
  * Apply one local curriculum edit and mark the editor dirty; nothing is written to
  * PostgreSQL yet.
  */
 function change(fn:(items:Chapter[])=>Chapter[]){setChapters(items=>fn(structuredClone(items)));setDirty(true);setMessage("");}
 /**
  * Fetch the selected subject/grade curriculum together with its revision for later conflict
  * detection.
  */
 function load(){discard(()=>void loadCurriculum());}
 async function loadCurriculum(){setBusy(true);setError("");setMessage("");try{const result=await api.get<Library>("/manager/curricula/"+subjectId+"/"+grade);setLibrary(result);setChapters(decorate(result.chapters));setDirty(false);setSheets([]);}catch(e){setError(e instanceof Error?e.message:"Could not load curriculum");}finally{setBusy(false);}}
 /**
  * Send a spreadsheet for preview, then let the manager choose/review its parsed content
  * before saving.
  */
 function upload(file:File){discard(()=>{if(library?.exists)ask("Review this spreadsheet as a replacement for the saved curriculum? Nothing changes until you save. Existing lesson history will be retained.",()=>void preview(file));else void preview(file);});}
 async function preview(file:File){setBusy(true);setError("");setMessage("");try{const form=new FormData();form.append("file",file);const result=await api.upload<{sheets:Sheet[]}>("/manager/curricula/preview",form);setSheets(result.sheets);setSheetIndex(0);setChapters(decorate(result.sheets[0].chapters));setDirty(true);setMessage("Preview only. Edit labels below, then save.");}catch(e){setError(e instanceof Error?e.message:"Could not read workbook");}finally{setBusy(false);}}
 /**
  * Send the edited curriculum with its loaded revision. A conflict means another save
  * happened and the editor must reload.
  */
 async function save(){if(!library)return;setBusy(true);setError("");setMessage("");try{const result=await api.post<Library>("/manager/curricula",{subjectId:library.subjectId,gradeNumber:library.gradeNumber,revision:library.revision,chapters:chapters.map(chapter=>({...chapter,topics:chapter.topics.map(topic=>({...topic,concepts:topic.concepts.map(concept=>({...concept,prerequisites:(concept.prerequisites??[]).map(line=>line.trim()).filter(Boolean),learningOutcomes:(concept.learningOutcomes??[]).map(line=>line.trim()).filter(Boolean)}))}))}))});setLibrary(result);setChapters(decorate(result.chapters));setDirty(false);setSheets([]);setMessage("Curriculum saved. Continue editing or load another subject and grade.");}catch(e){setError(e instanceof Error?e.message:"Could not save curriculum");}finally{setBusy(false);}}
 return <main className={styles.page}>
 <header className={styles.header}><div><h1>Curriculum manager</h1><p>Upload → review labels and order → save to a subject and grade.</p></div><button disabled={busy} onClick={()=>discard(async()=>{const token=localStorage.getItem("refreshToken");if(token)await api.post("/auth/logout",{refreshToken:token}).catch(()=>{});logout();router.replace("/manager/login");})}>Sign out</button></header>
 {error&&<p role="alert" className={styles.error}>{error}</p>}{message&&<p role="status" className={styles.success}>{message}</p>}
 {!ready?<p>Loading…</p>:<fieldset disabled={busy} style={{border:0,padding:0,margin:0}}>
 <section className={styles.panel}><div className={styles.toolbar}>
 <label>Subject<AppSelect value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="" disabled>Select a subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</AppSelect></label>
 <label>Grade<AppSelect value={grade} onChange={e=>setGrade(e.target.value)}>{[8,9,10,11,12].map(n=><option key={n} value={n}>Grade {n}</option>)}</AppSelect></label>
 <button disabled={!subjectId} onClick={load}>Load curriculum</button></div>
 <form className={styles.toolbar} style={{marginTop:16}} onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");try{const result=await api.post<{id:number;name:string}>("/manager/subjects",{name:newSubject});setSubjects(items=>[...items,result].sort((a,b)=>a.name.localeCompare(b.name)));setSubjectId(String(result.id));setNewSubject("");}catch(err){setError(err instanceof Error?err.message:"Could not add subject");}finally{setBusy(false);}}}><label>New subject<input value={newSubject} onChange={e=>setNewSubject(e.target.value)} maxLength={120} required/></label><button>Add subject to catalog</button></form></section>
 {library&&<><section className={styles.panel}><h2>{subjects.find(s=>s.id===library.subjectId)?.name} · Grade {library.gradeNumber}</h2>
 {library.exists&&<p>{sheets.length?"Reviewing a replacement spreadsheet. Saving retires the previous curriculum entries; existing lesson history is retained.":"Editing saved curriculum. Renames keep existing records; replacement creates a new concept. Removed entries leave the curriculum and remain linked to existing lesson history."}</p>}<p>Use one row per concept. Row 1 headers: Chapter, Topic, Concept, Prerequisite 1 through Prerequisite 5, Learning outcome 1 through Learning outcome 5. Repeat Chapter and Topic on every row; unused guidance cells can stay blank. The older chapter/topic-column format is still supported. Upload .xlsx or .csv, up to 2 MB.</p><p><a className={styles.templateLink} href="/templates/curriculum-template.xlsx" download>Download example spreadsheet</a></p><label>Upload spreadsheet<input type="file" accept=".xlsx,.csv" onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void upload(file);}}/></label>
 {sheets.length>1&&<label>Worksheet<AppSelect value={sheetIndex} onChange={e=>{const i=Number(e.target.value);discard(()=>{setSheetIndex(i);setChapters(decorate(sheets[i].chapters));setDirty(true);});}}>{sheets.map((s,i)=><option key={i} value={i}>{s.name}</option>)}</AppSelect></label>}

 {sheets[sheetIndex]?.warnings.map((warning,i)=><p key={i} role="status" className={styles.warning}>{warning}</p>)}
 <p>{chapters.length} chapters · {chapters.reduce((n,c)=>n+c.topics.length,0)} topics · {chapters.reduce((n,c)=>n+c.topics.reduce((sum,t)=>sum+t.concepts.length,0),0)} concepts{dirty?" · Unsaved changes":""}</p>
 <div className={styles.toolbar}><MobileAction onClick={()=>change(items=>[...items,{name:"",topics:[],key:crypto.randomUUID()}])} icon="add" label="Add chapter" /><button className={styles.primary} disabled={!dirty||!chapters.length} onClick={save}>{busy?"Working…":"Save curriculum"}</button></div></section>
 <div className={styles.chapters}>{chapters.map((chapter,i)=><section className={styles.chapter} key={chapter.key}>
 <label>Chapter {i+1}<textarea value={chapter.name} maxLength={1000} onChange={e=>change(items=>{items[i].name=e.target.value;return items;})}/></label>
 <div className={styles.actions}><MobileAction disabled={i===0} onClick={()=>change(items=>move(items,i,-1))} icon="up" label="Move up" /><MobileAction disabled={i===chapters.length-1} onClick={()=>change(items=>move(items,i,1))} icon="down" label="Move down" /><MobileAction onClick={()=>ask("Remove this chapter, its topics and concepts from the curriculum?",()=>{change(items=>items.filter((_,j)=>j!==i));})} icon="delete" label="Remove chapter" />
 {!chapter.id&&chapters.some((c,j)=>j!==i&&!c.id)&&<label>Combine into chapter<AppSelect aria-label={"Combine chapter "+(i+1)} value="" onChange={e=>{const destination=e.target.value;if(!destination)return;change(items=>{const target=items.find(c=>c.key===destination)!;target.topics=items.findIndex(c=>c.key===destination)>i?[...items[i].topics,...target.topics]:[...target.topics,...items[i].topics];return items.filter(c=>c.key!==chapter.key);});}}><option value="">Choose destination…</option>{chapters.filter(c=>c.key!==chapter.key&&!c.id).map(c=><option key={c.key} value={c.key}>{c.name||"Untitled chapter"}</option>)}</AppSelect></label>}
 </div>
 <div className={styles.grid}>{chapter.topics.map((topic,j)=><section className={styles.topic} key={topic.key}>
 <label>Topic {j+1}<textarea value={topic.name} maxLength={1000} onChange={e=>change(items=>{items[i].topics[j].name=e.target.value;return items;})}/></label>
 <div className={styles.actions}><MobileAction disabled={j===0} onClick={()=>change(items=>{items[i].topics=move(items[i].topics,j,-1);return items;})} icon="left" label="Move left" /><MobileAction disabled={j===chapter.topics.length-1} onClick={()=>change(items=>{items[i].topics=move(items[i].topics,j,1);return items;})} icon="right" label="Move right" /><MobileAction onClick={()=>ask("Remove this topic and its concepts?",()=>{change(items=>{items[i].topics.splice(j,1);return items;});})} icon="delete" label="Remove topic" /></div>
 {topic.concepts.map((concept,k)=><div className={styles.concept} key={concept.key}><label>Concept {k+1}<textarea value={concept.name} maxLength={1000} onChange={e=>change(items=>{items[i].topics[j].concepts[k].name=e.target.value;return items;})}/></label>
 <details className={styles.guidance}><summary>Prerequisites and learning outcomes</summary><p>Simple skills needed before learning the concept; outcomes describe what learners can do afterwards. Up to five of each.</p>{(["prerequisites","learningOutcomes"] as const).map(field=><fieldset key={field}><legend>{field==="prerequisites"?"Prerequisites":"Learning outcomes"}</legend>{Array.from({length:5},(_,n)=><label key={n}>{field==="prerequisites"?"Prerequisite":"Learning outcome"} {n+1}<input type="text" maxLength={1000} value={concept[field]?.[n]??""} onChange={e=>change(items=>{const row=items[i].topics[j].concepts[k];const values=[...(row[field]??[])];while(values.length<=n)values.push("");values[n]=e.target.value;row[field]=values;return items;})}/></label>)}</fieldset>)}</details>
 <div className={styles.actions}><MobileAction disabled={k===0} onClick={()=>change(items=>{items[i].topics[j].concepts=move(items[i].topics[j].concepts,k,-1);return items;})} icon="up" label="Up" /><MobileAction disabled={k===topic.concepts.length-1} onClick={()=>change(items=>{items[i].topics[j].concepts=move(items[i].topics[j].concepts,k,1);return items;})} icon="down" label="Down" /><MobileAction onClick={()=>change(items=>{items[i].topics[j].concepts.splice(k+1,0,{name:"",key:crypto.randomUUID()});return items;})} icon="add" label="Insert after" />
 {concept.id&&<MobileAction onClick={()=>ask("Replace with a new concept? Existing lessons keep the old record.",()=>{change(items=>{items[i].topics[j].concepts[k]={name:"",key:crypto.randomUUID()};return items;});})} icon="replace" label="Replace" />}
 <MobileAction onClick={()=>change(items=>{items[i].topics[j].concepts.splice(k,1);return items;})} icon="delete" label="Remove" /></div></div>)}
 <MobileAction onClick={()=>change(items=>{items[i].topics[j].concepts.push({name:"",key:crypto.randomUUID()});return items;})} icon="add" label="Add concept" /></section>)}</div>
 <MobileAction className={styles.addTopic} onClick={()=>change(items=>{items[i].topics.push({name:"",concepts:[],key:crypto.randomUUID()});return items;})} icon="add" label="Add topic" /></section>)}</div></>}
 </fieldset>}{confirmation&&<CurriculumConfirmation key={confirmation.id} message={confirmation.message} onConfirm={confirmation.run} onClose={()=>setConfirmation(null)}/>}</main>;
}
