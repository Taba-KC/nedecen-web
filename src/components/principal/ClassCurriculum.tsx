"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Curriculum {
  gradeNumber: number;
  chapters: { id: number; name: string; topics: { id: number; name: string; concepts: { id: number; name: string }[] }[] }[];
}

export function ClassCurriculum({ schoolId, classId, classSubjectId, subjectName, onBack }: {
  schoolId: number; classId: number; classSubjectId: number; subjectName: string; onBack?: () => void;
}) {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get<Curriculum>("/schools/" + schoolId + "/classes/" + classId + "/subjects/" + classSubjectId + "/curriculum")
      .then(data => { if (!cancelled) setCurriculum(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load curriculum."); });
    return () => { cancelled = true; };
  }, [schoolId, classId, classSubjectId, attempt]);

  return (
    <section aria-label={subjectName + " curriculum"} style={{ color: "var(--color-text)" }}>
      {onBack && <button type="button" onClick={onBack} className="mb-4 text-sm hover:underline" style={{ color: "var(--color-text-muted)" }}>← Back to subjects</button>}
      <h3 className="text-base font-semibold">{subjectName}</h3>
      {curriculum && <p className="mt-1 mb-4 text-xs" style={{ color: "var(--color-text-muted)" }}>Grade {curriculum.gradeNumber} · Curriculum · Read only</p>}
      {error ? <div role="alert" className="mt-4 text-sm">
        <p>{error}</p>
        <button type="button" onClick={() => { setError(null); setAttempt(value => value + 1); }} className="mt-3 rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)" }}>Try again</button>
      </div> : !curriculum ? <p role="status" className="py-6 text-sm">Loading curriculum...</p>
        : !curriculum.chapters.length ? <p className="py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>No curriculum has been added for Grade {curriculum.gradeNumber} {subjectName} yet. An app manager needs to add it.</p>
        : <div className="flex flex-col gap-3">
          {curriculum.chapters.map((chapter, index) => <details key={chapter.id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "#ffffff04" }}>
            <summary className="cursor-pointer text-sm font-semibold">{index + 1}. {chapter.name}</summary>
            {!chapter.topics.length && <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>No topics yet.</p>}
            <div className="mt-3 flex flex-col gap-2">
              {chapter.topics.map(topic => <details key={topic.id} className="rounded-md border p-3" style={{ borderColor: "var(--color-border)" }}>
                <summary className="cursor-pointer text-sm font-medium">{topic.name}</summary>
                {topic.concepts.length ? <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm" style={{ color: "var(--color-school-charcoal)" }}>
                  {topic.concepts.map(concept => <li key={concept.id}>{concept.name}</li>)}
                </ol> : <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>No concepts yet.</p>}
              </details>)}
            </div>
          </details>)}
        </div>}
    </section>
  );
}
