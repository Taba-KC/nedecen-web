"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Curriculum {
  gradeNumber: number;
  className: string;
  coverage: { totalConcepts: number; taughtConcepts: number; percentage: number };
  chapters: { id: number; name: string; topics: { id: number; name: string; concepts: { id: number; name: string; isTaught: boolean; prerequisites?: string[]; learningOutcomes?: string[] }[] }[] }[];
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
      {curriculum && <>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>{curriculum.className} · Grade {curriculum.gradeNumber} · Read only</p>
        <dl aria-label="Class curriculum coverage" className="my-4 grid grid-cols-3 gap-3 border-y py-3" style={{ borderColor: "var(--color-border)" }}>
          <div><dt className="text-xs" style={{ color: "var(--color-text-muted)" }}>Total concepts</dt><dd className="mt-1 text-xl font-semibold">{curriculum.coverage.totalConcepts}</dd></div>
          <div><dt className="text-xs" style={{ color: "var(--color-text-muted)" }}>Confirmed taught</dt><dd className="mt-1 text-xl font-semibold" style={{ color: "#166534" }}>{curriculum.coverage.taughtConcepts}</dd></div>
          <div><dt className="text-xs" style={{ color: "var(--color-text-muted)" }}>Coverage</dt><dd className="mt-1 text-xl font-semibold">{curriculum.coverage.percentage}%</dd></div>
        </dl>
        <p className="mb-4 text-xs" style={{ color: "var(--color-text-muted)" }}>Green concepts are confirmed as taught in this class.</p>
      </>}
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
                  {topic.concepts.map(concept => <li key={concept.id} style={{ color: concept.isTaught ? "#166534" : "#171717" }}><details><summary className="cursor-pointer">{concept.name}{concept.isTaught && <span className="sr-only"> — confirmed taught</span>}</summary><div className="py-3"><strong>Prerequisites</strong>{concept.prerequisites?.length ? <ul className="my-2 list-disc space-y-1 pl-5">{concept.prerequisites.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="my-2">None added.</p>}<strong>Learning outcomes</strong>{concept.learningOutcomes?.length ? <ul className="my-2 list-disc space-y-1 pl-5">{concept.learningOutcomes.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="my-2">None added.</p>}</div></details></li>)}
                </ol> : <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>No concepts yet.</p>}
              </details>)}
            </div>
          </details>)}
        </div>}
    </section>
  );
}
