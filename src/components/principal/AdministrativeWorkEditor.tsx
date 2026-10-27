"use client";
export const ADMIN_WORK = [['grades', 'Grades & Classes'], ['streams', 'Streams'], ['staff', 'Staff'], ['learners', 'Learners'], ['curriculum', 'Curriculum']] as const;
export default function AdministrativeWorkEditor({ selected }: { selected: string[] }) {
  return <div><p>Grant only the administrative work this staff member should manage. Teaching assignments remain separate. Only the principal can change these grants.</p>{ADMIN_WORK.map(([id, label]) => <label key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input type="checkbox" name="capabilities" value={id} defaultChecked={selected.includes(id)} style={{ width: 18, margin: 0 }} />{label}</label>)}</div>;
}
