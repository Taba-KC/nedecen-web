"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import WrappingSelect from "@/components/shared/WrappingSelect";
import book from "./books/books.module.css";
import styles from "./move-learners.module.css";
type Learner = { id: number; firstName: string; surname: string; admissionNumber: string };
type Review = { reviewHash: string; count: number; remaining: number; source: { name: string }; target: { name: string; academicYear: number }; learners: Learner[] };
export default function MoveLearners({ schoolId, classId, sourceName, learners, destinations, onSaved, onClose, setBusy }: {
 schoolId: number; classId: number; sourceName: string; learners: Learner[]; destinations: { id: number; label: string }[];
 onSaved: () => Promise<void>; onClose: () => void; setBusy: (busy: boolean) => void;
}) {
 const [selected,setSelected]=useState(learners.map(row=>row.id));
 const [target,setTarget]=useState(''), [review,setReview]=useState<Review|null>(null), [error,setError]=useState(''), [loading,setLoading]=useState(false);
 const inFlight=useRef(false);
 const path=`/schools/${schoolId}/classes/${classId}/learner-transfers`;
 async function perform(commit: boolean) {
  if(inFlight.current)return;
  if(!target||!selected.length){setError('Choose a destination and at least one learner.');return;}
  inFlight.current=true;setLoading(true);setBusy(true);setError('');
  try {
   const payload={targetClassId:Number(target),learnerIds:selected};
   if(commit) {
    if(!review)throw new Error('Review the move first.');
    await api.post(path+'/commit',{...payload,reviewHash:review.reviewHash});
    await onSaved();onClose();
   } else setReview(await api.post<Review>(path+'/review',payload));
  } catch(err) { setError(err instanceof Error?err.message:'Could not move learners.'); if(commit)setReview(null); }
  finally { inFlight.current=false;setLoading(false);setBusy(false); }
 }
 return <div className={styles.content}>
  <p>Move all or selected learners from <strong>{sourceName}</strong> to another class in the same grade and academic year.</p>
  <p>Their accounts and history stay intact. Their current subjects will follow the destination class. If it has a subject split, they must confirm their subject combination.</p>
  {!destinations.length ? <p role="status">Create another class in this grade and academic year before moving learners.</p> : <>
   <fieldset disabled={loading} className={styles.fields}>
    <WrappingSelect label="Destination class" value={target} onChange={value=>{setTarget(value);setReview(null);}} options={destinations.map(row=>({value:String(row.id),label:row.label}))} />
    <div className={styles.selection}><label><input type="checkbox" checked={selected.length===learners.length} onChange={event=>{setSelected(event.target.checked?learners.map(row=>row.id):[]);setReview(null);}}/>Select all learners</label><span>{selected.length} selected</span></div>
    <ul className={styles.list}>{learners.map(row=><li key={row.id}><label><input type="checkbox" checked={selected.includes(row.id)} onChange={()=>{setSelected(current=>current.includes(row.id)?current.filter(id=>id!==row.id):[...current,row.id]);setReview(null);}}/><span>{row.firstName} {row.surname}<small>{row.admissionNumber}</small></span></label></li>)}</ul>
   </fieldset>
   {review ? <div className={styles.review} role="status"><strong>Review this move</strong><p>{review.count} {review.count===1?'learner':'learners'} will move from {sourceName} to {destinations.find(row=>row.id===Number(target))?.label}. {review.remaining} will remain in {sourceName}. Learners already in the destination class will stay there.</p><p>Academic year: {review.target.academicYear}. This does not change the streams assigned to either class.</p><button type="button" className={book.primary} disabled={loading} onClick={()=>perform(true)}>{loading?'Moving…':`Confirm move (${review.count})`}</button></div> : <button type="button" className={book.primary} disabled={loading||!target||!selected.length} onClick={()=>perform(false)}>{loading?'Reviewing…':'Review move'}</button>}
  </>}
  {error&&<p className={book.error} role="alert">{error}</p>}
 </div>;
}
