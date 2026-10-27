"use client";
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import book from '@/components/principal/books/books.module.css';
type Setup = { classId:number|null;status: 'ready' | 'awaiting-class' | 'choose-subjects' | 'awaiting-class-setup'; className?: string; revision: number; academicYear: number | null; common: { id: number; name: string }[]; different: { id: number; name: string }[]; options: { id: number; name: string; subjects: { id: number; name: string }[] }[]; configuration: { primarySubjectId: number; locations: { subjectId: number; building: string; classroom: string }[] } | null };
/** This gate appears before any learning data is requested; the server enforces it too. */
export default function LearnerSetup({ children }: { children: ReactNode }) {
  const router = useRouter(); const [setup, setSetup] = useState<Setup | null>(null), [selection, setSelection] = useState<number | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const load = useCallback(() => { api.get<Setup>('/learners/me/learning-setup').then(value => { setSetup(value); setError(''); }).catch(err => setError(err.message)); }, []);
  useEffect(() => { load(); window.addEventListener('focus', load); const timer = setInterval(load, 30000); return () => { window.removeEventListener('focus', load); clearInterval(timer); }; }, [load]);
  if (setup?.status === 'ready') return <>{children}</>;
  async function confirm() { if (!selection || !setup || busy) return; setBusy(true); setError(''); try { await api.post('/learners/me/learning-setup', { classId:setup.classId,academicYear:setup.academicYear,streamId: selection, revision: setup.revision }); load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not confirm subjects.'); } finally { setBusy(false); } }
  return <main className={book.workspace} style={{ padding: '24px 16px', display: 'grid', placeItems: 'center' }}><section style={{ width: 'min(100%,640px)', padding: 24, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8 }}>
    <h1 style={{ font: '28px Georgia,serif', marginBottom: 18 }}>{setup?.status === 'choose-subjects' ? 'Confirm your subjects' : setup?.status === 'awaiting-class' ? 'Waiting for your class' : 'Preparing your learning'}</h1>
    {error && <p role="alert" className={book.error}>{error}</p>}
    {!setup && <p role="status">Loading your class details…</p>}
    {setup?.status === 'awaiting-class' && <p>Your account and past work are safe. Your school needs to assign your current class before you can continue. Please contact your principal.</p>}
    {setup?.status === 'awaiting-class-setup' && <p>Your school is updating the subject split and classroom locations for your class. Please contact your principal.</p>}
    {setup?.status === 'choose-subjects' && <><p>{setup.className} is your full-time master class for {setup.academicYear}. Learners attend the shared subjects together, but attend different optional subjects. Confirm the combination you actually study before continuing.</p>
      {!!setup.common.length && <><h2 style={{ marginTop: 20, fontWeight: 600 }}>Subjects everyone shares</h2><ul className="list-disc pl-5">{setup.common.map(subject => <li key={subject.id}>{subject.name}</li>)}</ul></>}
      <fieldset disabled={busy} style={{ marginTop: 24 }}><legend>Which subject combination do you study?</legend>{setup.options.map(option => <label key={option.id} style={{ display: 'flex', gap: 12, padding: '16px 0', alignItems: 'start' }}><input type="radio" name="stream" checked={selection === option.id} onChange={() => setSelection(option.id)} style={{ marginTop: 5 }} /><span><strong>{option.subjects.filter(subject => setup.different.some(item => item.id === subject.id)).map(subject => subject.name).join(' + ')}</strong><small style={{ display: 'block' }}>{option.name}</small>{option.subjects.map(subject => { const location = setup.configuration?.locations.find(row => row.subjectId === subject.id); return location ? <small key={subject.id} style={{ display: 'block' }}>{subject.name}: {location.building} · {location.classroom}</small> : null; })}</span></label>)}</fieldset>
      <p>Confirm carefully. If you select the wrong combination, your school will need to correct it.</p><button className={book.primary} style={{ marginTop: 20 }} disabled={!selection || busy} onClick={() => void confirm()}>{busy ? 'Confirming…' : 'Confirm my subjects'}</button>
    </>}
    <footer style={{ marginTop: 24, display: 'flex', gap: 20 }}><button type="button" className={book.textButton} onClick={load}>Check again</button><button type="button" className={book.textButton} onClick={() => { logout(); router.replace('/'); }}>Sign out</button></footer>
  </section></main>;
}
