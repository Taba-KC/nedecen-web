"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { FloatingLabelInput } from "@/components/shared/FloatingLabelInput";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";
import { PageHeader } from "@/components/shared/PageHeader";

interface Stream {
  id: number;
  schoolId: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface StreamSubject {
  id: number;
  streamId: number;
  subjectId: number;
  subjectName: string;
}

type SubjectFormMode = "add" | "edit";

function PencilIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default function PrincipalStreamsPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streamSubjects, setStreamSubjects] = useState<StreamSubject[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [streamSheetOpen, setStreamSheetOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [streamName, setStreamName] = useState("");
  const [streamSubmitting, setStreamSubmitting] = useState(false);

  const [subjectSheetOpen, setSubjectSheetOpen] = useState(false);
  const [subjectFormMode, setSubjectFormMode] = useState<SubjectFormMode>("add");
  const [editingStreamSubject, setEditingStreamSubject] = useState<StreamSubject | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);

  const sortedStreams = [...streams].sort((a, b) => a.name.localeCompare(b.name));
  const selectedStream = selectedStreamId ? streams.find((stream) => stream.id === selectedStreamId) ?? null : null;
  const sortedStreamSubjects = [...streamSubjects].sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  const availableSubjectOptions = useMemo(() => {
    const selectedSubjectIds = new Set(
      streamSubjects
        .filter((item) => item.id !== editingStreamSubject?.id)
        .map((item) => item.subjectId)
    );

    return subjects
      .filter((subject) => !selectedSubjectIds.has(subject.id))
      .map((subject) => ({ value: String(subject.id), label: subject.name }));
  }, [editingStreamSubject?.id, streamSubjects, subjects]);

  async function loadStreams(preferredStreamId?: number) {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    const streamList = await api.get<Stream[]>(`/schools/${schoolId}/streams`);
    setStreams(streamList);

    const nextSelected =
      preferredStreamId ??
      selectedStreamId ??
      streamList[0]?.id ??
      null;

    if (nextSelected && streamList.some((stream) => stream.id === nextSelected)) {
      setSelectedStreamId(nextSelected);
      await loadStreamSubjects(nextSelected);
    } else {
      setSelectedStreamId(null);
      setStreamSubjects([]);
    }
  }

  async function loadStreamSubjects(streamId: number) {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    setSubjectsLoading(true);
    try {
      const items = await api.get<StreamSubject[]>(`/schools/${schoolId}/streams/${streamId}/subjects`);
      setStreamSubjects(items);
    } finally {
      setSubjectsLoading(false);
    }
  }

  useEffect(() => {
    const schoolId = getSchoolId();
    if (!schoolId) {
      router.replace("/");
      return;
    }

    Promise.all([
      api.get<Stream[]>(`/schools/${schoolId}/streams`),
      api.get<Subject[]>("/subjects"),
    ])
      .then(async ([streamList, subjectList]) => {
        setStreams(streamList);
        setSubjects(subjectList);
        const firstStream = streamList[0] ?? null;
        if (firstStream) {
          setSelectedStreamId(firstStream.id);
          await loadStreamSubjects(firstStream.id);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("401")) {
          router.replace("/");
          return;
        }
        setError("Failed to load streams.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function openCreateStream() {
    setEditingStream(null);
    setStreamName("");
    setActionError(null);
    setStreamSheetOpen(true);
  }

  function openEditStream(stream: Stream) {
    setEditingStream(stream);
    setStreamName(stream.name);
    setActionError(null);
    setStreamSheetOpen(true);
  }

  function closeStreamSheet() {
    setStreamSheetOpen(false);
    setEditingStream(null);
    setStreamName("");
    setActionError(null);
  }

  async function handleStreamSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = streamName.trim();
    if (!name) return;

    const duplicate = streams.some((stream) => (
      stream.id !== editingStream?.id && stream.name.toLowerCase() === name.toLowerCase()
    ));
    if (duplicate) {
      setActionError("A stream with this name already exists.");
      return;
    }

    const schoolId = getSchoolId();
    if (!schoolId) return;

    setStreamSubmitting(true);
    setActionError(null);
    try {
      if (editingStream) {
        const updated = await api.patch<Stream>(`/schools/${schoolId}/streams/${editingStream.id}`, { name });
        setStreams((current) => current.map((stream) => stream.id === updated.id ? updated : stream));
      } else {
        const created = await api.post<Stream>(`/schools/${schoolId}/streams`, { name });
        await loadStreams(created.id);
      }
      closeStreamSheet();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save stream.");
    } finally {
      setStreamSubmitting(false);
    }
  }

  async function handleDeleteStream(stream: Stream) {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    const confirmed = window.confirm(
      `Delete ${stream.name}? Classes using this stream will no longer have a stream selected.`
    );
    if (!confirmed) return;

    setActionError(null);
    try {
      await api.delete<{ id: number }>(`/schools/${schoolId}/streams/${stream.id}`);
      const remaining = streams.filter((item) => item.id !== stream.id);
      setStreams(remaining);
      const nextStream = remaining[0] ?? null;
      setSelectedStreamId(nextStream?.id ?? null);
      if (nextStream) {
        await loadStreamSubjects(nextStream.id);
      } else {
        setStreamSubjects([]);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete stream.");
    }
  }

  function openAddSubject() {
    setSubjectFormMode("add");
    setEditingStreamSubject(null);
    setSelectedSubjectId("");
    setActionError(null);
    setSubjectSheetOpen(true);
  }

  function openEditSubject(item: StreamSubject) {
    setSubjectFormMode("edit");
    setEditingStreamSubject(item);
    setSelectedSubjectId(String(item.subjectId));
    setActionError(null);
    setSubjectSheetOpen(true);
  }

  function closeSubjectSheet() {
    setSubjectSheetOpen(false);
    setSubjectFormMode("add");
    setEditingStreamSubject(null);
    setSelectedSubjectId("");
    setActionError(null);
  }

  async function handleSubjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStream || !selectedSubjectId) return;

    const schoolId = getSchoolId();
    if (!schoolId) return;

    setSubjectSubmitting(true);
    setActionError(null);
    try {
      if (subjectFormMode === "edit" && editingStreamSubject) {
        await api.patch<StreamSubject>(
          `/schools/${schoolId}/streams/${selectedStream.id}/subjects/${editingStreamSubject.id}`,
          { subjectId: parseInt(selectedSubjectId, 10) }
        );
      } else {
        await api.post<StreamSubject>(
          `/schools/${schoolId}/streams/${selectedStream.id}/subjects`,
          { subjectId: parseInt(selectedSubjectId, 10) }
        );
      }

      await loadStreamSubjects(selectedStream.id);
      closeSubjectSheet();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save subject.");
    } finally {
      setSubjectSubmitting(false);
    }
  }

  async function handleDeleteSubject(item: StreamSubject) {
    if (!selectedStream) return;
    const schoolId = getSchoolId();
    if (!schoolId) return;

    const confirmed = window.confirm(`Remove ${item.subjectName} from ${selectedStream.name}?`);
    if (!confirmed) return;

    setActionError(null);
    try {
      await api.delete<{ id: number }>(`/schools/${schoolId}/streams/${selectedStream.id}/subjects/${item.id}`);
      setStreamSubjects((current) => current.filter((subject) => subject.id !== item.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove subject.");
    }
  }

  function renderStreamList({ mobile = false }: { mobile?: boolean } = {}) {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
          />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full px-6 py-2.5 text-sm font-bold"
            style={{ backgroundColor: "var(--grade-action-bg, var(--color-school-black))", color: "#ffffff" }}
          >
            Retry
          </button>
        </div>
      );
    }

    if (sortedStreams.length === 0) {
      return <EmptyState message="No streams yet. Add a stream to get started." />;
    }

    return (
      <div className={mobile ? "grid gap-1" : "flex flex-col gap-1"}>
        {sortedStreams.map((stream) => {
          const active = stream.id === selectedStreamId;
          return (
            <div
              key={stream.id}
              className="glass-grade-item group flex items-center transition-colors"
              style={{ backgroundColor: active ? "var(--color-school-panel-active)" : "transparent" }}
            >
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setSelectedStreamId(stream.id);
                  loadStreamSubjects(stream.id);
                }}
                className="min-w-0 flex-1 px-5 py-3 text-left text-[14px] font-medium leading-6"
                style={{ color: active ? "var(--color-accent)" : "var(--color-school-black)" }}
              >
                <span className="block truncate">{stream.name}</span>
              </button>
              <button
                type="button"
                onClick={() => openEditStream(stream)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
                style={{ color: "var(--color-school-grey)" }}
                title="Edit stream"
                aria-label={`Edit ${stream.name}`}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStream(stream)}
                className="mr-2 flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
                style={{ color: "var(--color-school-grey)" }}
                title="Delete stream"
                aria-label={`Delete ${stream.name}`}
              >
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  function renderSubjectsPanel() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        {actionError && (
          <p className="mb-4 text-sm" style={{ color: "var(--color-accent)" }}>{actionError}</p>
        )}
        {!selectedStream ? (
          <div className="flex min-h-[240px] items-center justify-center text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Select a stream to view its subjects.
            </p>
          </div>
        ) : subjectsLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2"
              style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2 xl:grid-cols-3">
            {sortedStreamSubjects.map((item) => (
              <article key={item.id}
                className="glass-panel subject-glass-card flex min-h-[97px] flex-col overflow-hidden rounded-xl">
                <div className="flex-1 px-5 pb-3 pt-3">
                  <h3 className="text-[16px] font-semibold leading-tight" style={{ color: "var(--color-school-black)" }}>
                    {item.subjectName}
                  </h3>
                  <p className="mt-1 truncate text-[11px] leading-tight" style={{ color: "var(--color-text-muted)" }} title={selectedStream.name}>
                    {selectedStream.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 px-4 pb-3" style={{ color: "var(--color-school-charcoal)" }}>
                  <button type="button" onClick={() => openEditSubject(item)}
                    className="glass-control flex h-8 items-center justify-center gap-1 rounded-full text-[12px] transition-colors hover:bg-black/5 sm:h-7 [&_svg]:h-3.5 [&_svg]:w-3.5"
                    aria-label={`Replace ${item.subjectName}`}>
                    <PencilIcon /> Replace
                  </button>
                  <button type="button" onClick={() => handleDeleteSubject(item)}
                    className="glass-control flex h-8 items-center justify-center gap-1 rounded-full text-[12px] transition-colors hover:bg-black/5 sm:h-7 [&_svg]:h-3.5 [&_svg]:w-3.5"
                    aria-label={`Delete ${item.subjectName}`}>
                    <TrashIcon /> Delete
                  </button>
                </div>
              </article>
            ))}
            <button type="button" onClick={openAddSubject}
              className="glass-panel glass-create-card flex min-h-[97px] flex-col items-center justify-center rounded-xl text-center transition-all hover:bg-black/[0.02]"
              style={{ color: "var(--color-school-black)" }}>
              <span className="class-create-icon flex h-8 w-8 items-center justify-center rounded-lg text-[30px] font-light leading-none">+</span>
              <span className="mt-2 text-[15px] font-extrabold leading-tight">Add New Subject</span>
              <span className="mt-1 text-[13px]" style={{ color: "var(--color-school-grey)" }}>For {selectedStream.name}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="hidden h-full min-h-0 gap-[var(--grades-grid-gap)] overflow-hidden px-12 pb-9 pt-0 lg:flex">
        <aside className="w-[240px] xl:w-[290px] shrink-0">
          <div
            className="glass-panel stream-sidebar flex h-full min-h-0 flex-col overflow-hidden rounded-xl py-6"
            style={{
              backgroundColor: "var(--color-school-panel)",
              border: "1px solid rgba(37, 37, 37, 0.06)",
              boxShadow: "0 12px 26px rgba(17, 17, 17, 0.14)",
            }}
          >
            <div className="shrink-0 px-5">
              <p className="text-[16px] font-semibold leading-none" style={{ color: "var(--color-school-black)" }}>
                Streams &amp; Subjects
              </p>
              <p className="mt-2 text-[11px]" style={{ color: "var(--color-text-muted)" }}>Subject combinations</p>
              <div className="sidebar-divider mt-5" />
            </div>

            <div className="mt-3 flex-1 overflow-y-auto">
              {renderStreamList()}
            </div>

            <div className="mt-5 shrink-0 px-5">
              <button
                type="button"
                onClick={openCreateStream}
                className="h-10 w-full rounded-full text-[16px] font-bold transition-all hover:opacity-85"
                style={{ backgroundColor: "var(--grade-action-bg, var(--color-school-black))", color: "#ffffff", boxShadow: "0 6px 14px rgba(17,17,17,0.28)" }}
              >
                + Add new stream
              </button>
            </div>
          </div>
        </aside>

        <main
          className="min-w-0 flex-1 flex flex-col overflow-hidden"
        >
          {renderSubjectsPanel()}
        </main>
      </div>

      <div className="lg:hidden h-full overflow-y-auto px-4 pb-28 pt-4 sm:px-7">
        <div className="mx-auto max-w-3xl">
          <PageHeader
            title="Streams & Subjects"
            rightAction={
              <button
                type="button"
                onClick={openCreateStream}
                className="h-9 rounded-full px-4 text-sm font-bold"
                style={{ backgroundColor: "var(--grade-action-bg, var(--color-school-black))", color: "#ffffff" }}
              >
                + Stream
              </button>
            }
          />

          <section
            className="glass-panel stream-mobile-panel mt-5 rounded-xl p-4"
            style={{
              backgroundColor: "var(--color-school-panel)",
              border: "1px solid rgba(37, 37, 37, 0.06)",
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[18px] font-extrabold uppercase" style={{ color: "var(--color-school-black)" }}>
                Streams &amp; Subjects
              </h2>
            </div>
            {renderStreamList({ mobile: true })}
          </section>

          <section className="mt-3">
            {renderSubjectsPanel()}
          </section>
        </div>
      </div>

      <BottomSheet
        isOpen={streamSheetOpen}
        onClose={closeStreamSheet}
        title={editingStream ? "Edit stream" : "Add stream"}
      >
        <form onSubmit={handleStreamSubmit} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <FloatingLabelInput
            id="stream-name"
            label="Stream name"
            type="text"
            value={streamName}
            onChange={setStreamName}
            required
          />
          {actionError && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>
              {actionError}
            </p>
          )}
          <button
            type="submit"
            disabled={!streamName.trim() || streamSubmitting}
            className="w-full rounded-lg text-sm font-bold disabled:opacity-50"
            style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#ffffff" }}
          >
            {streamSubmitting ? "Saving..." : editingStream ? "Save stream" : "Create stream"}
          </button>
        </form>
      </BottomSheet>

      <BottomSheet
        isOpen={subjectSheetOpen}
        onClose={closeSubjectSheet}
        title={subjectFormMode === "edit" ? "Replace subject" : "Add subject"}
      >
        <form onSubmit={handleSubjectSubmit} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          {selectedStream && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {subjectFormMode === "edit" ? "Choose a replacement subject for" : "Add a platform subject to"}{" "}
              <strong style={{ color: "var(--color-text)" }}>{selectedStream.name}</strong>.
            </p>
          )}
          {availableSubjectOptions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              There are no more available subjects to add to this stream.
            </p>
          ) : (
            <FloatingLabelSelect
              id="stream-subject"
              label="Subject"
              value={selectedSubjectId}
              onChange={setSelectedSubjectId}
              options={availableSubjectOptions}
              required
            />
          )}
          {actionError && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>
              {actionError}
            </p>
          )}
          {availableSubjectOptions.length > 0 && (
            <button
              type="submit"
              disabled={!selectedSubjectId || subjectSubmitting}
              className="w-full rounded-lg text-sm font-bold disabled:opacity-50"
              style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#ffffff" }}
            >
              {subjectSubmitting ? "Saving..." : subjectFormMode === "edit" ? "Save subject" : "Add subject"}
            </button>
          )}
        </form>
      </BottomSheet>
    </>
  );
}
