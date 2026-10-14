"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";
import { RosterImportModal } from "@/components/principal/RosterImportModal";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { FloatingLabelInput } from "@/components/shared/FloatingLabelInput";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";

interface Grade {
  id: number;
  number: number;
}

interface ClassItem {
  id: number;
  gradeId: number;
  name: string;
}

interface Learner {
  id: number;
  title: string;
  firstName: string;
  surname: string;
  admissionNumber: string;
  classId: number;
  accountSetUp: boolean;
  username: string | null;
}

interface LearnerRow extends Learner {
  gradeNumber: number;
  className: string;
}

const TITLES = ["Mr", "Ms", "Miss"].map((title) => ({ value: title, label: title }));

function formatClassName(name: string) {
  return /^grade\s+/i.test(name) ? name : `Grade ${name}`;
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function PlusIcon({ large = false }: { large?: boolean }) {
  return (
    <svg width={large ? "58" : "28"} height={large ? "58" : "28"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={large ? "1.8" : "2"} strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default function PrincipalLearnersPage() {
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLearner, setSelectedLearner] = useState<LearnerRow | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const gradeById = useMemo(() => new Map(grades.map((grade) => [grade.id, grade])), [grades]);

  const sortedClasses = useMemo(() => {
    return classes.slice().sort((a, b) => {
      const gradeA = gradeById.get(a.gradeId)?.number ?? 0;
      const gradeB = gradeById.get(b.gradeId)?.number ?? 0;
      return gradeA - gradeB || a.name.localeCompare(b.name);
    });
  }, [classes, gradeById]);

  const classOptions = sortedClasses.map((cls) => ({ value: String(cls.id), label: formatClassName(cls.name) }));
  const selectedClass = sortedClasses.find((cls) => String(cls.id) === selectedClassId) ?? null;

  const filteredLearners = useMemo(() => {
    const term = query.trim().toLowerCase();
    return learners
      .filter((learner) => !selectedClassId || learner.classId === parseInt(selectedClassId, 10))
      .filter((learner) => {
        if (!term) return true;
        return `${learner.firstName} ${learner.surname} ${learner.admissionNumber} ${learner.className}`.toLowerCase().includes(term);
      })
      .sort((a, b) => a.surname.localeCompare(b.surname) || a.firstName.localeCompare(b.firstName));
  }, [learners, query, selectedClassId]);

  const loadLearners = useCallback(async () => {
    const schoolId = getSchoolId();
    if (!schoolId) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const gradeList = await api.get<Grade[]>(`/schools/${schoolId}/grades`);
      const classGroups = await Promise.all(
        gradeList.map(async (grade) => ({
          grade,
          classes: await api.get<ClassItem[]>(`/schools/${schoolId}/grades/${grade.id}/classes`),
        }))
      );
      const allClasses = classGroups.flatMap((group) => group.classes);
      const learnerGroups = await Promise.all(
        classGroups.flatMap((group) =>
          group.classes.map(async (cls) => ({
            grade: group.grade,
            cls,
            learners: await api.get<Learner[]>(`/schools/${schoolId}/classes/${cls.id}/learners`),
          }))
        )
      );

      setGrades(gradeList);
      setClasses(allClasses);
      setLearners(
        learnerGroups.flatMap((group) =>
          group.learners.map((learner) => ({
            ...learner,
            gradeNumber: group.grade.number,
            className: group.cls.name,
          }))
        )
      );

      setSelectedClassId((current) => allClasses.some((cls) => String(cls.id) === current) ? current : String(allClasses[0]?.id ?? ""));
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("401")) {
        router.replace("/");
        return;
      }
      setError("Failed to load learners.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void loadLearners(); });
    return () => { cancelled = true; };
  }, [loadLearners]);

  function openAddSheet() {
    setFormClassId(selectedClassId);
    setAddOpen(true);
  }

  function openImportSheet() {
    setFormClassId(selectedClassId);
    setImportOpen(true);
  }

  function closeAddSheet() {
    setAddOpen(false);
    setTitle("");
    setFirstName("");
    setSurname("");
    setAdmissionNumber("");
    setFormClassId("");
    setFormError(null);
  }

  function closeImportSheet() {
    setImportOpen(false);
    setFormClassId("");
    setFormError(null);
  }

  async function handleAddLearner(e: React.FormEvent) {
    e.preventDefault();
    const schoolId = getSchoolId();
    if (!schoolId || !title || !firstName.trim() || !surname.trim() || !admissionNumber.trim() || !formClassId) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await api.post(`/schools/${schoolId}/learners`, {
        title,
        firstName: firstName.trim(),
        surname: surname.trim(),
        admissionNumber: admissionNumber.trim(),
        classId: parseInt(formClassId, 10),
      });
      await loadLearners();
      closeAddSheet();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add learner.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderRosterList() {
    if (loading) {
      return (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error}</p>
          <button type="button" onClick={loadLearners} className="rounded-full px-6 py-2.5 text-sm font-bold" style={{ backgroundColor: "var(--grade-action-bg)", color: "#ffffff" }}>
            Retry
          </button>
        </div>
      );
    }

    if (classes.length === 0) {
      return <EmptyState message="Create classes first, then learners can be added or imported." />;
    }

    if (learners.length === 0) {
      return <EmptyState message="No learners have been added yet. Use the Add learner card to get started." />;
    }

    if (filteredLearners.length === 0) {
      return <EmptyState message="No learners match this class or search." />;
    }

    return (
      <ul className="divide-y divide-white/[0.08]">
        {filteredLearners.map((learner) => (
          <li key={learner.id} className="flex items-center gap-3 px-2 py-3 hover:bg-white/[0.035]">
            <button type="button" onClick={() => setSelectedLearner(learner)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[16px] font-medium">{learner.firstName} {learner.surname}</span>
              <span className="mt-1 block text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {learner.admissionNumber} &middot; {formatClassName(learner.className)} &middot; {learner.accountSetUp ? "Account active" : "Setup pending"}
              </span>
            </button>
            <button type="button" onClick={() => setSelectedLearner(learner)}
              className="glass-control flex h-8 w-8 shrink-0 items-center justify-center rounded-full [&_svg]:h-4 [&_svg]:w-4"
              aria-label={`View details for ${learner.firstName} ${learner.surname}`}><InfoIcon /></button>
          </li>
        ))}
      </ul>
    );
  }

  function renderAddLearnerActions() {
    return (
      <section style={{ color: "var(--color-text)" }} className="glass-panel learner-actions self-start rounded-xl p-5">
        <h2 className="text-[16px] font-semibold">Add Learner(s)</h2>
        <div className="mt-4 grid grid-cols-2 gap-[9px]">
          <button type="button" onClick={openImportSheet} disabled={classes.length === 0}
            className="glass-panel glass-create-card flex min-h-[140px] flex-col items-center justify-center rounded-xl px-2 text-center disabled:opacity-45">
            <span className="class-create-icon flex h-10 w-10 items-center justify-center rounded-lg"><PlusIcon /></span>
            <span className="mt-3 text-[13px] font-semibold">Add in bulk</span>
          </button>
          <button type="button" onClick={openAddSheet} disabled={classes.length === 0}
            className="glass-panel glass-create-card flex min-h-[140px] flex-col items-center justify-center rounded-xl px-2 text-center disabled:opacity-45">
            <span className="class-create-icon flex h-10 w-10 items-center justify-center rounded-lg"><PlusIcon /></span>
            <span className="mt-3 text-[13px] font-semibold">Add individually</span>
          </button>
        </div>
        {selectedClass && <p className="mt-4 text-[12px]" style={{ color: "var(--color-text-muted)" }}>Adding to <strong style={{ color: "var(--color-accent)" }}>{formatClassName(selectedClass.name)}</strong>.</p>}
      </section>
    );
  }

  return (
    <>
      <div className="h-full min-h-0 overflow-y-auto px-4 pb-28 pt-4 sm:px-7 lg:overflow-hidden lg:px-12 lg:pb-9 lg:pt-0">
        <div className="flex min-h-0 flex-col gap-[var(--grades-grid-gap)] lg:h-full lg:flex-row">
          <main style={{ color: "var(--color-text)" }} className="glass-panel learner-list-panel flex min-h-0 min-w-0 flex-1 flex-col rounded-xl p-5">
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <h1 className="text-[16px] font-semibold">Learners</h1>
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} aria-label="Filter learners by class" disabled={classOptions.length === 0}
                className="glass-field learner-filter-select h-9 min-w-[150px] rounded-full border pl-3 pr-10 text-[12px] outline-none">
                {classOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <form onSubmit={(e) => { e.preventDefault(); setQuery(searchInput); }}
                className="glass-field relative flex h-9 min-w-[180px] flex-1 overflow-hidden rounded-full border sm:ml-auto">
                <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search learners" aria-label="Search learners"
                  className="min-w-0 flex-1 bg-transparent px-3 text-[12px] outline-none" />
                <button type="submit" aria-label="Search" className="flex w-10 shrink-0 items-center justify-center border-l border-white/10 hover:bg-white/10 [&_svg]:h-4 [&_svg]:w-4">
                  <SearchIcon />
                </button>
              </form>
            </div>
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto">{renderRosterList()}</div>
          </main>
          <div className="shrink-0 lg:w-[340px] xl:w-[380px]">{renderAddLearnerActions()}</div>
        </div>
      </div>

      <BottomSheet isOpen={addOpen} onClose={closeAddSheet} title="Add learner">
        <form onSubmit={handleAddLearner} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <FloatingLabelSelect id="learner-class" label="Class" value={formClassId} onChange={setFormClassId} options={classOptions} required />
          <FloatingLabelSelect id="learner-title" label="Title" value={title} onChange={setTitle} options={TITLES} required />
          <FloatingLabelInput id="learner-first-name" label="First name" value={firstName} onChange={setFirstName} required />
          <FloatingLabelInput id="learner-surname" label="Surname" value={surname} onChange={setSurname} required />
          <FloatingLabelInput id="learner-admission" label="Admission number" value={admissionNumber} onChange={setAdmissionNumber} required />
          {formError && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{formError}</p>}
          <button type="submit" disabled={submitting || !formClassId || !title || !firstName.trim() || !surname.trim() || !admissionNumber.trim()} className="w-full rounded-lg text-sm font-bold disabled:opacity-50" style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#ffffff" }}>
            {submitting ? "Saving..." : "Add learner"}
          </button>
        </form>
      </BottomSheet>

      {importOpen && getSchoolId() && <RosterImportModal schoolId={getSchoolId()!} kind="learners" initialClassId={formClassId} classOptions={classOptions} onClose={closeImportSheet} onSaved={loadLearners} />}

      <BottomSheet isOpen={!!selectedLearner} onClose={() => setSelectedLearner(null)} title="Learner details">
        {selectedLearner && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Name</p>
              <p className="mt-1 text-lg font-extrabold" style={{ color: "var(--color-accent)" }}>
                {selectedLearner.title} {selectedLearner.firstName} {selectedLearner.surname}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Class</p>
              <p className="mt-1 font-semibold" style={{ color: "var(--color-school-black)" }}>{formatClassName(selectedLearner.className)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Admission number</p>
              <p className="mt-1 font-semibold" style={{ color: "var(--color-school-black)" }}>{selectedLearner.admissionNumber}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Account</p>
              <p className="mt-1 font-semibold" style={{ color: selectedLearner.accountSetUp ? "#86c9a0" : "var(--color-accent)" }}>
                {selectedLearner.accountSetUp ? `Active${selectedLearner.username ? ` as ${selectedLearner.username}` : ""}` : "Setup pending"}
              </p>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
