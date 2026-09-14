"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { FloatingLabelInput } from "@/components/shared/FloatingLabelInput";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";
import { ClassRow, type ClassItem, type StreamItem } from "@/components/principal/ClassRow";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Grade {
  id: number;
  number: number;
}

interface StreamSubject {
  id: number;
  subjectId: number;
  subjectName: string;
}

interface UploadResult {
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; admissionNumber: string; reason: string }>;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GradeDetailPage() {
  const params = useParams();
  const gradeId = parseInt(params.gradeId as string, 10);
  const router = useRouter();

  const [grade, setGrade] = useState<Grade | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Add class ──────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── Assign stream (pencil) ─────────────────────────────────────────────────
  const [streamSheetClass, setStreamSheetClass] = useState<ClassItem | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [streamSubmitting, setStreamSubmitting] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // ── Info modal (ℹ️) ────────────────────────────────────────────────────────
  const [infoClass, setInfoClass] = useState<ClassItem | null>(null);
  const [infoSubjects, setInfoSubjects] = useState<StreamSubject[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);

  // ── Upload (document) ─────────────────────────────────────────────────────
  const [uploadClass, setUploadClass] = useState<ClassItem | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name));
  const streamMap = new Map(streams.map((s) => [s.id, s]));
  const streamOptions = streams.map((s) => ({ value: String(s.id), label: s.name }));

  // ── Fetch on mount ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isNaN(gradeId)) { router.replace("/dashboard/principal/grades"); return; }
    const schoolId = getSchoolId();
    if (!schoolId) { router.replace("/"); return; }

    Promise.all([
      api.get<Grade[]>(`/schools/${schoolId}/grades`),
      api.get<ClassItem[]>(`/schools/${schoolId}/grades/${gradeId}/classes`),
      api.get<StreamItem[]>(`/schools/${schoolId}/streams`),
    ])
      .then(([grades, cls, str]) => {
        const found = grades.find((g) => g.id === gradeId) ?? null;
        if (!found) { router.replace("/dashboard/principal/grades"); return; }
        setGrade(found);
        setClasses(cls);
        setStreams(str);
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
    setAddError(null);
    setAddOpen(true);
  }

  function closeAdd() {
    setAddOpen(false);
    setNewClassName("");
    setAddError(null);
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    const name = newClassName.trim();
    if (!name) return;
    const schoolId = getSchoolId();
    if (!schoolId) return;
    setAdding(true);
    setAddError(null);
    try {
      await api.post(`/schools/${schoolId}/grades/${gradeId}/classes`, { name });
      const updated = await api.get<ClassItem[]>(`/schools/${schoolId}/grades/${gradeId}/classes`);
      setClasses(updated);
      closeAdd();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create class. Try again.");
    } finally {
      setAdding(false);
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
    setInfoClass(cls);
    setInfoSubjects([]);
    if (!cls.streamId) return;
    const schoolId = getSchoolId();
    if (!schoolId) return;
    setInfoLoading(true);
    try {
      const subjects = await api.get<StreamSubject[]>(
        `/schools/${schoolId}/streams/${cls.streamId}/subjects`
      );
      setInfoSubjects(subjects);
    } catch {
      setInfoSubjects([]);
    } finally {
      setInfoLoading(false);
    }
  }

  function closeInfo() {
    setInfoClass(null);
    setInfoSubjects([]);
  }

  // ── Upload learners ────────────────────────────────────────────────────────

  function openUpload(cls: ClassItem) {
    setUploadClass(cls);
    setUploadFile(null);
    setUploadResult(null);
    setUploadError(null);
  }

  function closeUpload() {
    setUploadClass(null);
    setUploadFile(null);
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadClass || !uploadFile) return;
    const schoolId = getSchoolId();
    if (!schoolId) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.upload<UploadResult>(
        `/schools/${schoolId}/classes/${uploadClass.id}/learners/import`,
        formData
      );
      setUploadResult(result);
      if (result.succeeded > 0) {
        const updated = await api.get<ClassItem[]>(`/schools/${schoolId}/grades/${gradeId}/classes`);
        setClasses(updated);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Shared class list ──────────────────────────────────────────────────────

  // "Grade 11 Classes" — matches the screenshot heading pattern
  const pageTitle = grade ? `Grade ${grade.number}` : "Loading...";
  const cardTitle = grade ? `Grade ${grade.number} Classes` : "Loading...";

  const classContent = (
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
      ) : sortedClasses.length === 0 ? (
        <EmptyState message="No classes yet. Add a class to this grade." />
      ) : (
        sortedClasses.map((cls, i) => (
          <ClassRow
            key={cls.id}
            cls={cls}
            stream={cls.streamId ? streamMap.get(cls.streamId) : undefined}
            isLast={i === sortedClasses.length - 1}
            onAssignStream={openStreamSheet}
            onInfo={openInfo}
            onUpload={openUpload}
          />
        ))
      )}
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Mobile / tablet ──────────────────────────────────────────────────── */}
      <div className="lg:hidden py-6">
        <div className="sm:max-w-xl sm:mx-auto">
          <div>
            <PageHeader
              title={pageTitle}
              onBack={() => router.push("/dashboard/principal/grades")}
            />
            {classContent}
          </div>
        </div>
      </div>

      {/* ── Desktop: right panel (sidebar is in grades/layout.tsx) ──────────── */}
      <div className="hidden lg:block overflow-y-auto flex-1">
        <div className="py-10">
          <div className="max-w-[60%] mx-auto">

            {/* Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                boxShadow: "0 2px 16px rgba(0, 0, 0, 0.08)",
              }}
            >
              {/* Card header — "Grade 11 Classes" + "+ Add class" */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {cardTitle}
                </h2>
                <button
                  onClick={addOpen ? closeAdd : openAdd}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                  style={
                    addOpen
                      ? { border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }
                      : { backgroundColor: "var(--color-accent)", color: "#fff" }
                  }
                >
                  {!addOpen && <PlusIcon />}
                  {addOpen ? "Cancel" : "Add class"}
                </button>
              </div>

              {/* Inline add class form — desktop only */}
              {addOpen && (
                <div
                  className="px-6 py-5"
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <form onSubmit={handleAddClass} className="flex items-end gap-3">
                    <div className="flex-1">
                      <FloatingLabelInput
                        id="class-name-desktop"
                        label="Class name (e.g. 11A)"
                        type="text"
                        value={newClassName}
                        onChange={setNewClassName}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newClassName.trim() || adding}
                      className="flex-shrink-0 text-sm font-semibold px-5 rounded-lg disabled:opacity-50"
                      style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
                    >
                      {adding ? "Creating..." : "Create"}
                    </button>
                  </form>
                  {addError && (
                    <p className="text-xs mt-2" style={{ color: "var(--color-accent)" }}>{addError}</p>
                  )}
                </div>
              )}

              {classContent}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom sheet: add class — mobile / tablet ─────────────────────────── */}
      <BottomSheet isOpen={addOpen} onClose={closeAdd} title="Add class">
        <form onSubmit={handleAddClass} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <FloatingLabelInput
            id="class-name-mobile"
            label="Class name (e.g. 11A)"
            type="text"
            value={newClassName}
            onChange={setNewClassName}
            required
          />
          {addError && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>{addError}</p>
          )}
          <button
            type="submit"
            disabled={!newClassName.trim() || adding}
            className="w-full text-sm font-bold rounded-lg disabled:opacity-50"
            style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            {adding ? "Creating..." : "Create class"}
          </button>
        </form>
      </BottomSheet>

      {/* ── Bottom sheet: assign stream ────────────────────────────────────────── */}
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

      {/* ── Bottom sheet: upload learners ──────────────────────────────────────── */}
      <BottomSheet
        isOpen={!!uploadClass}
        onClose={closeUpload}
        title={`Add learners — ${uploadClass?.name ?? ""}`}
      >
        {uploadResult ? (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                {uploadResult.succeeded} learner{uploadResult.succeeded !== 1 ? "s" : ""} added
                {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
              </p>
              {uploadResult.errors.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {uploadResult.errors.map((e, i) => (
                    <li key={i} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Row {e.row} ({e.admissionNumber}): {e.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={closeUpload}
              className="w-full text-sm font-bold rounded-lg"
              style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Upload a spreadsheet with columns: <strong>title</strong>, <strong>firstName</strong>, <strong>surname</strong>, <strong>admissionNumber</strong>.
            </p>

            {/* Styled file picker */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <div
                className="flex items-center justify-center py-4 rounded-xl border-2 border-dashed cursor-pointer"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p className="text-sm" style={{ color: uploadFile ? "var(--color-text)" : "var(--color-text-muted)" }}>
                  {uploadFile ? uploadFile.name : "Tap to choose a .xlsx file"}
                </p>
              </div>
            </div>

            {uploadError && (
              <p className="text-sm" style={{ color: "var(--color-accent)" }}>{uploadError}</p>
            )}

            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="w-full text-sm font-bold rounded-lg disabled:opacity-50"
              style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        )}
      </BottomSheet>

      {/* ── Info modal: stream & subjects ──────────────────────────────────────── */}
      {infoClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={closeInfo}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-card)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
                  {infoClass.name}
                </p>
                <h3 className="text-sm font-semibold mt-0.5" style={{ color: "var(--color-text)" }}>
                  Stream &amp; Subjects
                </h3>
              </div>
              <button
                onClick={closeInfo}
                className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-5">
              {infoClass.streamId ? (
                <>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--color-text-muted)" }}>
                    Stream
                  </p>
                  <div
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                    style={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}
                  >
                    {streamMap.get(infoClass.streamId)?.name ?? "—"}
                  </div>

                  <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--color-text-muted)" }}>
                    Subjects
                  </p>
                  {infoLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div
                        className="w-4 h-4 rounded-full border-2 animate-spin"
                        style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
                      />
                    </div>
                  ) : infoSubjects.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No subjects assigned to this stream yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {infoSubjects.map((s) => (
                        <li key={s.id} className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "var(--color-accent)" }}
                          />
                          <span className="text-sm" style={{ color: "var(--color-text)" }}>{s.subjectName}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No stream assigned to this class yet. Use the pencil icon to assign one.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
