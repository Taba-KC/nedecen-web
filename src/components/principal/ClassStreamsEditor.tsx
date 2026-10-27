"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import WrappingSelect from '@/components/shared/WrappingSelect';
import styles from './books/books.module.css';
type Stream = { id: number; name: string; subjects: { id: number; name: string }[] };
type Configuration = { primarySubjectId: number; locations: { subjectId: number; building: string; classroom: string }[] };
export default function ClassStreamsEditor({ schoolId, classId, streams }: { schoolId: number; classId: number; streams: { id: number; name: string }[] }) {
  const [options, setOptions] = useState<Stream[]>([]), [selected, setSelected] = useState<number[]>([]), [configuration, setConfiguration] = useState<Configuration | null>(null), [primary, setPrimary] = useState(''), [error, setError] = useState(''), [ready, setReady] = useState(false);
  useEffect(() => { let active = true; Promise.all([api.get<{ options: Stream[]; cls: { streamConfiguration: Configuration | null } }>(`/schools/${schoolId}/classes/${classId}/streams`), Promise.all(streams.map(async stream => ({ ...stream, subjects: (await api.get<{ subjectId: number; subjectName: string }[]>(`/schools/${schoolId}/streams/${stream.id}/subjects`)).map(item => ({ id: item.subjectId, name: item.subjectName })) })))]).then(([current, all]) => { if (!active) return; setOptions(all); setSelected(current.options.map(row => row.id)); setConfiguration(current.cls.streamConfiguration); setPrimary(String(current.cls.streamConfiguration?.primarySubjectId ?? '')); setReady(true); }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, [schoolId, classId, streams]);
  const chosen = options.filter(option => selected.includes(option.id));
  const union = [...new Map(chosen.flatMap(option => option.subjects).map(subject => [subject.id, subject])).values()];
  const common = union.filter(subject => chosen.every(option => option.subjects.some(item => item.id === subject.id)));
  const different = union.filter(subject => !common.some(item => item.id === subject.id));
  const split = chosen.length > 1 && different.length > 0;
  return <fieldset disabled={!ready} style={{ border: 0, padding: 0, minWidth: 0 }}>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!ready && <p role="status">Loading class streams…</p>}
    <p>Choose the streams sharing this master class. Common subjects are taught together; each learner confirms their own subject combination.</p>
    {options.map(option => <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input style={{ width: 18, margin: 0 }} type="checkbox" name="streamIds" value={option.id} checked={selected.includes(option.id)} onChange={() => setSelected(current => current.includes(option.id) ? current.filter(id => id !== option.id) : [...current, option.id])} />{option.name}</label>)}
    <input type="hidden" name="streamEditorReady" value={ready ? 'yes' : 'no'} />
    {!!common.length && <><strong>Subjects attended together</strong><ul className="list-disc pl-5">{common.map(subject => <li key={subject.id}>{subject.name}</li>)}</ul></>}
    {split && <>
      <WrappingSelect label="Primary subject attended in this master class" value={primary} options={different.map(subject => ({ value: String(subject.id), label: subject.name }))} onChange={setPrimary} placeholder="Choose the primary subject" />
      <input type="hidden" name="primarySubjectId" value={primary} />
      <p>Specify where learners attend each secondary subject. Shared subjects retain this master class.</p>
      {different.filter(subject => String(subject.id) !== primary).map(subject => <fieldset key={subject.id} style={{ border: '1px solid var(--line)', padding: 12, marginBlock: 12, minWidth: 0 }}><legend>{subject.name}</legend><label>Building<input required maxLength={120} name={`building-${subject.id}`} defaultValue={configuration?.locations.find(row => row.subjectId === subject.id)?.building} /></label><label>Classroom name<input required maxLength={120} name={`classroom-${subject.id}`} defaultValue={configuration?.locations.find(row => row.subjectId === subject.id)?.classroom} /></label></fieldset>)}
      <p>Changing the stream subjects requires learners to confirm their subject combination again.</p>
    </>}
  </fieldset>;
}
