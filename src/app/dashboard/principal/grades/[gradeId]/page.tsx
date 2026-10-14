"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";
import { RosterImportModal } from "@/components/principal/RosterImportModal";
import { ClassCurriculum } from "@/components/principal/ClassCurriculum";
import { PageHeader } from "@/components/shared/PageHeader";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { FloatingLabelInput } from "@/components/shared/FloatingLabelInput";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";
import { type ClassItem, type StreamItem } from "@/components/principal/ClassRow";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Grade {
  id: number;
  number: number;
}

interface StreamSubject {
  personId: number | null;
  id: number;
  subjectId: number;
  subjectName: string;
}

interface Person {
  id: number;
  title: string;
  firstName: string;
  surname: string;
  role: string;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type ClassDetails = ClassItem & {
  description?: string;
  classTeacherId?: number | null;
  classTeacherTitle?: string | null;
  classTeacherFirstName?: string | null;
  classTeacherSurname?: string | null;
};

function getClassTeacherName(cls: ClassDetails) {
  return [cls.classTeacherTitle, cls.classTeacherFirstName, cls.classTeacherSurname]
    .filter(Boolean)
    .join(" ");
}

function getClassLabel(name: string) {
  return name.toLowerCase().startsWith("grade ") ? name : `Grade ${name}`;
}

function getClassIdentifier(name: string, gradeNumber?: number) {
  let identifier = name.trim().replace(/^grade\s+/i, "");
  if (gradeNumber) {
    identifier = identifier.replace(new RegExp(`^${gradeNumber}\\s*`, "i"), "");
  }
  return identifier.toUpperCase();
}

function buildClassName(gradeNumber: number | undefined, identifier: string) {
  if (!gradeNumber) return identifier.trim().toUpperCase();
  return `${gradeNumber}${getClassIdentifier(identifier, gradeNumber)}`;
}

function classNameExists(name: string, classList: ClassItem[], exceptClassId?: number) {
  return classList.some((cls) => (
    cls.id !== exceptClassId && cls.name.toLowerCase() === name.toLowerCase()
  ));
}

function getClassSubtitle(cls: ClassItem, stream?: StreamItem) {
  if (stream) return stream.name;
  if (cls.learnerCount > 0) {
    return `${cls.learnerCount} ${cls.learnerCount === 1 ? "learner" : "learners"}`;
  }
  return "Class profile";
}

function ClassCard({
  classTeacherName,
  cls,
  deleting,
  onDelete,
  onEdit,
  onInfo,
  onUpload,
  stream,
}: {
  classTeacherName: string;
  cls: ClassDetails;
  deleting: boolean;
  onDelete: (cls: ClassItem) => void;
  onEdit: (cls: ClassItem) => void;
  onInfo: (cls: ClassItem) => void;
  onUpload: (cls: ClassItem) => void;
  stream?: StreamItem;
}) {
  return (
    <article
      className="glass-panel class-glass-card flex min-h-[194px] flex-col overflow-hidden rounded-xl"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid var(--color-border)",
        boxShadow: "0 4px 12px rgba(37, 37, 37, 0.10)",
      }}
    >
      <div className="flex-1 px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 text-[16px] font-semibold leading-tight" style={{ color: "#ffffff" }}>
            {getClassLabel(cls.name)}
          </h3>
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-school-charcoal)" }}>
            {cls.learnerCount} {cls.learnerCount === 1 ? "learner" : "learners"}
          </span>
        </div>
        {stream ? (
          <button
            type="button"
            onClick={() => onInfo(cls)}
            className="mt-2 max-w-full truncate text-[13px] font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--color-school-charcoal)" }}
            title="View subjects, teachers and curriculum"
          >
            {stream.name}
          </button>
        ) : (
          <p className="mt-2 truncate text-[13px]" style={{ color: "var(--color-school-charcoal)" }}>
            {cls.description ?? getClassSubtitle(cls, stream)}
          </p>
        )}
        {classTeacherName && (
          <p className="mt-2 truncate text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Managed by {classTeacherName}
          </p>
        )}
      </div>

      <button type="button" onClick={() => onInfo(cls)} className="mx-5 mb-3 self-start text-[12px] font-medium hover:underline" style={{ color: "var(--color-school-charcoal)" }}>
        Subjects &amp; Teachers
      </button>

      <div className="grid grid-cols-3 gap-2 px-4 pb-4" style={{ color: "var(--color-school-charcoal)" }}>
        <button
          type="button"
          onClick={() => onEdit(cls)}
          className="glass-control flex h-8 items-center justify-center gap-1 rounded-full text-[12px] transition-colors hover:bg-black/5 sm:h-7 [&_svg]:h-3.5 [&_svg]:w-3.5"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <PencilIcon />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onUpload(cls)}
          className="glass-control flex h-8 items-center justify-center gap-1 rounded-full text-[12px] transition-colors hover:bg-black/5 sm:h-7 [&_svg]:h-3.5 [&_svg]:w-3.5"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <PlusIcon />
          Learners
        </button>
        <button
          type="button"
          onClick={() => onDelete(cls)}
          disabled={deleting}
          className="glass-control flex h-8 items-center justify-center gap-1 rounded-full text-[12px] transition-colors hover:bg-black/5 disabled:opacity-45 sm:h-7 [&_svg]:h-3.5 [&_svg]:w-3.5"
          style={{ border: "1px solid var(--color-border)" }}
          title="Delete class"
        >
          <TrashIcon />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function GradeDetailPage() {
  const params = useParams();
  const gradeId = parseInt(params.gradeId as string, 10);
  const router = useRouter();

  const [grade, setGrade] = useState<Grade | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Add class ──────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassStreamId, setNewClassStreamId] = useState("");
  const [newClassTeacherId, setNewClassTeacherId] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit class
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [editClassStreamId, setEditClassStreamId] = useState("");
  const [editClassTeacherId, setEditClassTeacherId] = useState("");
  const [editClassDescription, setEditClassDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Assign stream (pencil) ─────────────────────────────────────────────────
  const [streamSheetClass, setStreamSheetClass] = useState<ClassItem | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [streamSubmitting, setStreamSubmitting] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // ── Info modal (ℹ️) ────────────────────────────────────────────────────────
  const [curriculumSubject, setCurriculumSubject] = useState<StreamSubject | null>(null);
  const [infoClass, setInfoClass] = useState<ClassItem | null>(null);
  const [infoSubjects, setInfoSubjects] = useState<StreamSubject[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [savingTeacher, setSavingTeacher] = useState<number | null>(null);
  const infoRequest = useRef(0);

  // ── Upload (document) ─────────────────────────────────────────────────────
  const [uploadClass, setUploadClass] = useState<ClassItem | null>(null);

  const [deletingClassId, setDeletingClassId] = useState<number | null>(null);
  const [classActionError, setClassActionError] = useState<string | null>(null);

  const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name));
  const streamMap = new Map(streams.map((s) => [s.id, s]));
  const streamOptions = streams.map((s) => ({ value: String(s.id), label: s.name }));
  const teacherOptions = people
    .filter((p) => p.role === "teacher" || p.role === "principal")
    .map((p) => ({
      value: String(p.id),
      label: `${p.title} ${p.firstName} ${p.surname}`,
    }));

  // ── Fetch on mount ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isNaN(gradeId)) { router.replace("/dashboard/principal/grades"); return; }
    const schoolId = getSchoolId();
    if (!schoolId) { router.replace("/"); return; }

    Promise.all([
      api.get<Grade[]>(`/schools/${schoolId}/grades`),
      api.get<ClassItem[]>(`/schools/${schoolId}/grades/${gradeId}/classes`),
      api.get<StreamItem[]>(`/schools/${schoolId}/streams`),
      api.get<Person[]>(`/schools/${schoolId}/people`),
    ])
      .then(([grades, cls, str, ppl]) => {
        const found = grades.find((g) => g.id === gradeId) ?? null;
        if (!found) { router.replace("/dashboard/principal/grades"); return; }
        setGrade(found);
        setClasses(cls);
        setStreams(str);
        setPeople(ppl);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("401")) { router.replace("/"); return; }
        setError("Failed to load class data.");
      })
      .finally(() => setLoading(false));
  }, [gradeId, router]);

  // ── Add class ──────────────────────────────────────────────────────────────

  function openAdd() {
    setNewClassName("");
    setNewClassStreamId("");
    setNewClassTeacherId("");
    setNewClassDescription("");
    setAddError(null);
    setAddOpen(true);
  }

  function closeAdd() {
    setAddOpen(false);
    setNewClassName("");
    setNewClassStreamId("");
    setNewClassTeacherId("");
    setNewClassDescription("");
    setAddError(null);
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    const name = buildClassName(grade?.number, newClassName);
    if (!name) return;
    if (classNameExists(name, classes)) {
      setAddError(`${getClassLabel(name)} already exists in this grade.`);
      return;
    }
    const schoolId = getSchoolId();
    if (!schoolId) return;
    setAdding(true);
    setAddError(null);
    try {
      await api.post<ClassItem>(`/schools/${schoolId}/grades/${gradeId}/classes`, {
        name,
        streamId: newClassStreamId ? parseInt(newClassStreamId, 10) : null,
        classTeacherId: newClassTeacherId ? parseInt(newClassTeacherId, 10) : null,
        description: newClassDescription.trim() || null,
      });
      const updated = await api.get<ClassItem[]>(`/schools/${schoolId}/grades/${gradeId}/classes`);
      setClasses(updated);
      closeAdd();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create class. Try again.");
    } finally {
      setAdding(false);
    }
  }

  function openEditClass(cls: ClassItem) {
    const richClass = cls as ClassDetails;
    setEditClass(cls);
    setEditClassName(getClassIdentifier(cls.name, grade?.number));
    setEditClassStreamId(cls.streamId ? String(cls.streamId) : "");
    setEditClassTeacherId(richClass.classTeacherId ? String(richClass.classTeacherId) : "");
    setEditClassDescription(richClass.description ?? "");
    setEditError(null);
  }

  function closeEditClass() {
    setEditClass(null);
    setEditClassName("");
    setEditClassStreamId("");
    setEditClassTeacherId("");
    setEditClassDescription("");
    setEditError(null);
  }

  async function handleEditClass(e: React.FormEvent) {
    e.preventDefault();
    if (!editClass) return;
    const name = buildClassName(grade?.number, editClassName);
    if (!name) return;
    if (classNameExists(name, classes, editClass.id)) {
      setEditError(`${getClassLabel(name)} already exists in this grade.`);
      return;
    }
    const schoolId = getSchoolId();
    if (!schoolId) return;
    setEditing(true);
    setEditError(null);
    try {
      await api.patch(`/schools/${schoolId}/grades/${gradeId}/classes/${editClass.id}`, {
        name,
        streamId: editClassStreamId ? parseInt(editClassStreamId, 10) : null,
        classTeacherId: editClassTeacherId ? parseInt(editClassTeacherId, 10) : null,
        description: editClassDescription.trim() || null,
      });
      const updated = await api.get<ClassItem[]>(`/schools/${schoolId}/grades/${gradeId}/classes`);
      setClasses(updated);
      closeEditClass();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update class. Try again.");
    } finally {
      setEditing(false);
    }
  }

  // ── Assign stream ──────────────────────────────────────────────────────────

  function openStreamSheet(cls: ClassItem) {
    setStreamSheetClass(cls);
    setSelectedStreamId(cls.streamId ? String(cls.streamId) : "");
    setStreamError(null);
  }

  function closeStreamSheet() {
    setStreamSheetClass(null);
    setSelectedStreamId("");
    setStreamError(null);
  }

  async function handleAssignStream(e: React.FormEvent) {
    e.preventDefault();
    if (!streamSheetClass || !selectedStreamId) return;
    const schoolId = getSchoolId();
    if (!schoolId) return;
    setStreamSubmitting(true);
    setStreamError(null);
    try {
      await api.post(
        `/schools/${schoolId}/grades/${gradeId}/classes/${streamSheetClass.id}/stream`,
        { streamId: parseInt(selectedStreamId, 10) }
      );
      setClasses((prev) =>
        prev.map((c) =>
          c.id === streamSheetClass.id
            ? { ...c, streamId: parseInt(selectedStreamId, 10) }
            : c
        )
      );
      closeStreamSheet();
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : "Failed to assign stream. Try again.");
    } finally {
      setStreamSubmitting(false);
    }
  }

  // ── Info modal ─────────────────────────────────────────────────────────────

  async function openInfo(cls: ClassItem) {
    const request = ++infoRequest.current;
    setCurriculumSubject(null);
    setInfoClass(cls);
    setInfoSubjects([]);
    setInfoError(null);
    setInfoLoading(true);
    const schoolId = getSchoolId();
    if (!schoolId) { setInfoLoading(false); return; }
    try {
      const [subjects, staff] = await Promise.all([
        api.get<StreamSubject[]>(`/schools/${schoolId}/classes/${cls.id}/subjects`),
        api.get<Person[]>(`/schools/${schoolId}/people`),
      ]);
      if (request !== infoRequest.current) return;
      setInfoSubjects(subjects);
      setPeople(staff);
    } catch (err) {
      if (request === infoRequest.current) setInfoError(err instanceof Error ? err.message : "Could not load subjects.");
    } finally {
      if (request === infoRequest.current) setInfoLoading(false);
    }
  }

  async function assignTeacher(subjectId: number, value: string) {
    const schoolId = getSchoolId();
    if (!schoolId || !infoClass || savingTeacher !== null) return;
    const request = infoRequest.current;
    setSavingTeacher(subjectId);
    setInfoError(null);
    try {
      const subjects = await api.patch<StreamSubject[]>(`/schools/${schoolId}/classes/${infoClass.id}/subjects/${subjectId}/teacher`, { personId: value ? Number(value) : null });
      if (request === infoRequest.current) setInfoSubjects(subjects);
    } catch (err) {
      if (request === infoRequest.current) setInfoError(err instanceof Error ? err.message : "Could not save teacher.");
    } finally { setSavingTeacher(null); }
  }

  function closeInfo() {
    ++infoRequest.current;
    setCurriculumSubject(null);
    setInfoClass(null);
    setInfoSubjects([]);
    setInfoError(null);
  }

  function openUpload(cls: ClassItem) { setUploadClass(cls); }
  function closeUpload() { setUploadClass(null); }
  async function refreshClassCounts() {
    const schoolId = getSchoolId();
    if (!schoolId) return;
    setClasses(await api.get<ClassItem[]>(`/schools/${schoolId}/grades/${gradeId}/classes`));
  }

  async function handleDeleteClass(cls: ClassItem) {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    const confirmed = window.confirm(
      `Delete ${getClassLabel(cls.name)}? This will delete its learners, lessons, homework, feedback, and class setup.`
    );
    if (!confirmed) return;

    setDeletingClassId(cls.id);
    setClassActionError(null);
    try {
      await api.delete<{ id: number }>(`/schools/${schoolId}/grades/${gradeId}/classes/${cls.id}`);
      setClasses((current) => current.filter((item) => item.id !== cls.id));
    } catch (err) {
      setClassActionError(err instanceof Error ? err.message : "Failed to delete class.");
    } finally {
      setDeletingClassId(null);
    }
  }

  // ── Shared class list ──────────────────────────────────────────────────────

  // "Grade 11 Classes" — matches the screenshot heading pattern
  const pageTitle = grade ? `Grade ${grade.number}` : "Loading...";

  const mobileClassContent = (
    <>
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
          />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold px-6 py-2.5 rounded-lg"
            style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[9px] px-4 pt-5 sm:grid-cols-2 sm:px-0">
          {classActionError && (
            <p className="sm:col-span-2 text-sm" style={{ color: "var(--color-accent)" }}>
              {classActionError}
            </p>
          )}
          {sortedClasses.length === 0 && (
            <p className="sm:col-span-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              No classes have been created for this grade yet.
            </p>
          )}
          {sortedClasses.map((cls) => {
            const richClass = cls as ClassDetails;
            const classTeacherName = getClassTeacherName(richClass);
            const stream = cls.streamId ? streamMap.get(cls.streamId) : undefined;

            return (
              <ClassCard
                key={cls.id}
                classTeacherName={classTeacherName}
                cls={richClass}
                deleting={deletingClassId === cls.id}
                onDelete={handleDeleteClass}
                onEdit={openEditClass}
                onInfo={openInfo}
                onUpload={openUpload}
                stream={stream}
              />
            );
          })}
          <button
            type="button"
            onClick={openAdd}
            className="glass-panel glass-create-card flex min-h-[194px] flex-col items-center justify-center rounded-xl text-center transition-all hover:bg-black/[0.02]"
            style={{
              backgroundColor: "#ffffff",
              border: "1.5px solid rgba(37, 37, 37, 0.14)",
              color: "var(--color-school-black)",
            }}
          >
            <span className="class-create-icon flex h-10 w-10 items-center justify-center rounded-lg text-[30px] font-light leading-none">+</span>
            <span className="mt-3 text-[15px] font-extrabold leading-tight">Add New Class</span>
            <span className="mt-1 text-[13px]" style={{ color: "var(--color-school-grey)" }}>
              {grade ? `For Grade ${grade.number}` : "For this grade"}
            </span>
          </button>
        </div>
      )}
    </>
  );

  const desktopClassContent = (
    <div className="min-h-0 flex-1 overflow-y-auto pb-3">
      {loading ? (
        <div className="flex items-center justify-center min-h-[280px]">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
          />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] gap-4 px-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold px-6 py-2.5 rounded-full"
            style={{ backgroundColor: "var(--grade-action-bg, var(--color-school-black))", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-[9px] pb-2">
          {classActionError && (
            <p className="col-span-full text-sm" style={{ color: "var(--color-accent)" }}>
              {classActionError}
            </p>
          )}
          {sortedClasses.length === 0 && (
            <p className="col-span-full text-sm" style={{ color: "var(--color-text-muted)" }}>
              No classes have been created for this grade yet.
            </p>
          )}
          {sortedClasses.map((cls) => {
            const richClass = cls as ClassDetails;
            const classTeacherName = getClassTeacherName(richClass);
            const stream = cls.streamId ? streamMap.get(cls.streamId) : undefined;

            return (
              <ClassCard
                key={cls.id}
                classTeacherName={classTeacherName}
                cls={richClass}
                deleting={deletingClassId === cls.id}
                onDelete={handleDeleteClass}
                onEdit={openEditClass}
                onInfo={openInfo}
                onUpload={openUpload}
                stream={stream}
              />
            );
          })}

          <button
            type="button"
            onClick={openAdd}
            className="glass-panel glass-create-card flex min-h-[194px] flex-col items-center justify-center rounded-xl text-center transition-all hover:bg-black/[0.02]"
            style={{
              backgroundColor: "#ffffff",
              border: "1.5px solid rgba(37, 37, 37, 0.14)",
              color: "var(--color-school-black)",
            }}
          >
            <span className="class-create-icon flex h-10 w-10 items-center justify-center rounded-lg text-[30px] font-light leading-none">+</span>
            <span className="mt-3 text-[15px] font-extrabold leading-tight">Add New Class</span>
            <span className="mt-1 text-[13px]" style={{ color: "var(--color-school-grey)" }}>
              {grade ? `For Grade ${grade.number}` : "For this grade"}
            </span>
          </button>
        </div>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Mobile / tablet ──────────────────────────────────────────────────── */}
      <div className="lg:hidden h-full overflow-y-auto pb-28 pt-4">
        <div className="mx-auto max-w-3xl sm:px-7">
          <div>
            <PageHeader
              title={pageTitle}
              onBack={() => router.push("/dashboard/principal/grades")}
              rightAction={
                !loading ? (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="h-9 rounded-full px-4 text-sm font-bold"
                    style={{ backgroundColor: "var(--grade-action-bg, var(--color-school-black))", color: "#ffffff" }}
                  >
                    + Class
                  </button>
                ) : null
              }
            />
            {mobileClassContent}
          </div>
        </div>
      </div>

      {/* ── Desktop: right panel (sidebar is in grades/layout.tsx) ──────────── */}
      <div className="hidden lg:block flex-1 overflow-hidden">
        <div className="h-full min-h-0">
          <div className="h-full min-h-0 w-full">

            {/* Card */}
            <div
              className="classes-workspace flex h-full min-h-0 flex-col overflow-hidden pb-3"
            >
              {desktopClassContent}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom sheet: add class — mobile / tablet ─────────────────────────── */}
      <BottomSheet isOpen={addOpen} onClose={closeAdd} title="Add class">
        <form onSubmit={handleAddClass} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <div className="flex gap-2">
            <div
              className="flex h-[var(--control-height)] shrink-0 items-center rounded-lg px-4 text-sm font-semibold"
              style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text)" }}
            >
              Grade {grade?.number ?? ""}
            </div>
            <div className="min-w-0 flex-1">
              <FloatingLabelInput
                id="class-name-create"
                label="Identifier (e.g. A)"
                type="text"
                value={newClassName}
                onChange={(value) => setNewClassName(getClassIdentifier(value, grade?.number))}
                required
              />
            </div>
          </div>
          {streamOptions.length > 0 && (
            <FloatingLabelSelect
              id="class-stream-create"
              label="Stream (optional)"
              value={newClassStreamId}
              onChange={setNewClassStreamId}
              options={streamOptions}
            />
          )}
          {teacherOptions.length > 0 && (
            <FloatingLabelSelect
              id="class-teacher-create"
              label="Class teacher (optional)"
              value={newClassTeacherId}
              onChange={setNewClassTeacherId}
              options={teacherOptions}
            />
          )}
          <FloatingLabelInput
            id="class-description-create"
            label="Description (optional)"
            type="text"
            value={newClassDescription}
            onChange={setNewClassDescription}
          />
          {addError && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>{addError}</p>
          )}
          <button
            type="submit"
            disabled={!newClassName.trim() || adding || !grade}
            className="w-full text-sm font-bold rounded-lg disabled:opacity-50"
            style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            {adding ? "Creating..." : "Create class"}
          </button>
        </form>
      </BottomSheet>

      {/* ── Bottom sheet: assign stream ────────────────────────────────────────── */}
      <BottomSheet
        isOpen={!!editClass}
        onClose={closeEditClass}
        title={`Edit class${editClass ? ` - ${getClassLabel(editClass.name)}` : ""}`}
      >
        <form onSubmit={handleEditClass} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <div className="flex gap-2">
            <div
              className="flex h-[var(--control-height)] shrink-0 items-center rounded-lg px-4 text-sm font-semibold"
              style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text)" }}
            >
              Grade {grade?.number ?? ""}
            </div>
            <div className="min-w-0 flex-1">
              <FloatingLabelInput
                id="class-name-edit"
                label="Identifier (e.g. A)"
                type="text"
                value={editClassName}
                onChange={(value) => setEditClassName(getClassIdentifier(value, grade?.number))}
                required
              />
            </div>
          </div>
          {streamOptions.length > 0 && (
            <FloatingLabelSelect
              id="class-stream-edit"
              label="Stream (optional)"
              value={editClassStreamId}
              onChange={setEditClassStreamId}
              options={streamOptions}
            />
          )}
          {teacherOptions.length > 0 && (
            <FloatingLabelSelect
              id="class-teacher-edit"
              label="Class teacher (optional)"
              value={editClassTeacherId}
              onChange={setEditClassTeacherId}
              options={teacherOptions}
            />
          )}
          <FloatingLabelInput
            id="class-description-edit"
            label="Description (optional)"
            type="text"
            value={editClassDescription}
            onChange={setEditClassDescription}
          />
          {editError && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>{editError}</p>
          )}
          <button
            type="submit"
            disabled={!editClassName.trim() || editing || !grade}
            className="w-full text-sm font-bold rounded-lg disabled:opacity-50"
            style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            {editing ? "Saving..." : "Save class"}
          </button>
        </form>
      </BottomSheet>

      <BottomSheet
        isOpen={!!streamSheetClass}
        onClose={closeStreamSheet}
        title={`Assign stream — ${streamSheetClass?.name ?? ""}`}
      >
        <form onSubmit={handleAssignStream} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          {streamOptions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No streams have been created yet. Add streams first.
            </p>
          ) : (
            <FloatingLabelSelect
              id="stream-select"
              label="Stream"
              value={selectedStreamId}
              onChange={setSelectedStreamId}
              options={streamOptions}
              required
            />
          )}
          {streamError && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>{streamError}</p>
          )}
          {streamOptions.length > 0 && (
            <button
              type="submit"
              disabled={!selectedStreamId || streamSubmitting}
              className="w-full text-sm font-bold rounded-lg disabled:opacity-50"
              style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              {streamSubmitting ? "Saving..." : "Assign stream"}
            </button>
          )}
        </form>
      </BottomSheet>

      {uploadClass && getSchoolId() && <RosterImportModal schoolId={getSchoolId()!} kind="learners" fixedClass initialClassId={String(uploadClass.id)} classOptions={[{ value: String(uploadClass.id), label: getClassLabel(uploadClass.name) }]} onClose={closeUpload} onSaved={refreshClassCounts} />}

      {/* ── Info modal: stream & subjects ──────────────────────────────────────── */}
      <BottomSheet isOpen={!!infoClass} onClose={closeInfo} width="md" title={`${infoClass ? getClassLabel(infoClass.name) : "Class"} — ${curriculumSubject ? "Curriculum" : "Subjects & Teachers"}`}>
        {curriculumSubject && infoClass && getSchoolId() ? (
          <ClassCurriculum key={curriculumSubject.id} schoolId={getSchoolId()!} classId={infoClass.id} classSubjectId={curriculumSubject.id} subjectName={curriculumSubject.subjectName} onBack={() => setCurriculumSubject(null)} />
        ) : <>
        <p className="mb-4 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Choose who teaches each subject, or explore its grade curriculum. Teacher changes save automatically.
        </p>
        {infoClass?.streamId && <p className="mb-4 text-sm font-semibold" style={{ color: "var(--color-accent)" }}>{streamMap.get(infoClass.streamId)?.name}</p>}
        {infoError && <p role="alert" className="mb-3 text-sm" style={{ color: "var(--color-accent)" }}>{infoError}</p>}
        {infoLoading ? <p className="py-6 text-sm">Loading subjects...</p> : infoSubjects.length === 0 ? (
          <p className="py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>{infoClass?.streamId ? "Add subjects to this class's stream first." : "Assign a stream to this class first."}</p>
        ) : <div className="flex flex-col gap-4">
          {infoSubjects.map(subject => <div key={subject.id}>
            <div className="class-subject-heading mb-2 flex items-start justify-between gap-3">
              <label htmlFor={`subject-teacher-${subject.id}`} className="min-w-0 text-sm font-semibold">{subject.subjectName}</label>
              <button type="button" onClick={() => setCurriculumSubject(subject)} aria-label={`View curriculum for ${subject.subjectName}`} className="shrink-0 text-xs font-medium hover:underline" style={{ color: "#ffffff" }}>View curriculum →</button>
            </div>
            <select id={`subject-teacher-${subject.id}`} value={subject.personId ?? ""} disabled={savingTeacher !== null}
              onChange={e => assignTeacher(subject.id, e.target.value)}
              className="glass-field subject-teacher-select h-10 w-full rounded-lg border pl-3 pr-10 text-sm outline-none disabled:opacity-60" style={{ color: "var(--color-text)" }}>
              <option value="">Not assigned</option>
              {teacherOptions.map(person => <option key={person.value} value={person.value}>{person.label}</option>)}
            </select>
            {savingTeacher === subject.id && <p role="status" className="mt-1 text-xs">Saving...</p>}
          </div>)}
        </div>}
        </>}
      </BottomSheet>

      {/* ── Floating + button — mobile / tablet ──────────────────────────────── */}
      {!addOpen && !loading && (
        <button
          onClick={openAdd}
          className="lg:hidden fixed right-6 bottom-24 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-light"
          style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          aria-label="Add class"
        >
          +
        </button>
      )}
    </>
  );
}
