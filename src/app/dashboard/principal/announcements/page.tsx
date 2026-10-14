"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccountId, getSchoolId } from "@/lib/auth";
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

interface Stream {
  id: number;
  name: string;
}

interface Announcement {
  id: number;
  createdBy: number;
  title: string;
  body: string;
  audienceType: "all" | "grade" | "class" | "stream";
  audienceId: number | null;
  createdAt: string;
  createdByTitle?: string | null;
  createdByFirstName?: string | null;
  createdBySurname?: string | null;
}

type AudienceType = Announcement["audienceType"];
type AudienceFilter = "all" | AudienceType;

const AUDIENCE_TYPES = [
  { value: "all", label: "Whole school" },
  { value: "grade", label: "Grade" },
  { value: "class", label: "Class" },
  { value: "stream", label: "Stream" },
];

const FILTERS: { value: AudienceFilter; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "grade", label: "Grades" },
  { value: "class", label: "Classes" },
  { value: "stream", label: "Streams" },
];

function formatClassName(name: string) {
  return /^grade\s+/i.test(name) ? name : `Grade ${name}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  return `${date.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}, ${time}`;
}

function PlusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function MutedIcon({ kind }: { kind: "hide" | "pin" | "settings" }) {
  if (kind === "hide") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.5 5.2A10.6 10.6 0 0 1 12 5c5.5 0 9 5 9 7a8.3 8.3 0 0 1-2.2 3.2" />
        <path d="M6.4 6.5C4.2 7.9 3 10.2 3 12c0 2 3.5 7 9 7 1.4 0 2.7-.3 3.8-.8" />
      </svg>
    );
  }

  if (kind === "pin") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 17v5" />
        <path d="M5 17h14" />
        <path d="M16 3l5 5-4 4v5H7v-5L3 8l5-5h8z" />
      </svg>
    );
  }

  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function PersonAvatar() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-school-panel)", color: "var(--color-school-grey)" }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    </span>
  );
}

export default function PrincipalAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<AudienceFilter>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [audienceId, setAudienceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const accountId = getAccountId();
  const gradeById = useMemo(() => new Map(grades.map((grade) => [grade.id, grade])), [grades]);

  const audienceOptions = useMemo(() => {
    if (audienceType === "grade") {
      return grades.slice().sort((a, b) => a.number - b.number).map((grade) => ({ value: String(grade.id), label: `Grade ${grade.number}` }));
    }

    if (audienceType === "class") {
      return classes
        .slice()
        .sort((a, b) => {
          const gradeA = gradeById.get(a.gradeId)?.number ?? 0;
          const gradeB = gradeById.get(b.gradeId)?.number ?? 0;
          return gradeA - gradeB || a.name.localeCompare(b.name);
        })
        .map((cls) => ({ value: String(cls.id), label: formatClassName(cls.name) }));
    }

    if (audienceType === "stream") {
      return streams.slice().sort((a, b) => a.name.localeCompare(b.name)).map((stream) => ({ value: String(stream.id), label: stream.name }));
    }

    return [];
  }, [audienceType, classes, gradeById, grades, streams]);

  const filteredAnnouncements = (() => {
    const term = query.trim().toLowerCase();
    return announcements
      .filter((announcement) => filter === "all" || announcement.audienceType === filter)
      .filter((announcement) => {
        if (!term) return true;
        return `${announcement.title} ${announcement.body} ${authorLabel(announcement)} ${audienceLabel(announcement)}`.toLowerCase().includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  function audienceLabel(announcement: Announcement) {
    if (announcement.audienceType === "all") return "All users";
    if (announcement.audienceType === "grade") {
      const grade = grades.find((item) => item.id === announcement.audienceId);
      return grade ? `Grade ${grade.number}` : "Grade";
    }
    if (announcement.audienceType === "class") {
      const cls = classes.find((item) => item.id === announcement.audienceId);
      return cls ? formatClassName(cls.name) : "Class";
    }
    const stream = streams.find((item) => item.id === announcement.audienceId);
    return stream?.name ?? "Stream";
  }

  function authorLabel(announcement: Announcement) {
    const name = [announcement.createdByTitle, announcement.createdByFirstName, announcement.createdBySurname]
      .filter(Boolean)
      .join(" ");
    if (!name) return announcement.createdBy === accountId ? "You" : "Staff member";
    return announcement.createdBy === accountId ? `${name} - (You)` : name;
  }

  const loadAnnouncements = useCallback(async () => {
    const schoolId = getSchoolId();
    if (!schoolId) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [announcementList, gradeList, streamList] = await Promise.all([
        api.get<Announcement[]>(`/schools/${schoolId}/announcements`),
        api.get<Grade[]>(`/schools/${schoolId}/grades`),
        api.get<Stream[]>(`/schools/${schoolId}/streams`),
      ]);
      const classGroups = await Promise.all(
        gradeList.map((grade) => api.get<ClassItem[]>(`/schools/${schoolId}/grades/${grade.id}/classes`))
      );

      setAnnouncements(announcementList);
      setGrades(gradeList);
      setStreams(streamList);
      setClasses(classGroups.flat());
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("401")) {
        router.replace("/");
        return;
      }
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void loadAnnouncements(); });
    return () => { cancelled = true; };
  }, [loadAnnouncements]);

  function openCreateSheet() {
    setEditingAnnouncement(null);
    setTitle("");
    setBody("");
    setAudienceType("all");
    setAudienceId("");
    setFormError(null);
    setSheetOpen(true);
  }

  function openEditSheet(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setBody(announcement.body);
    setAudienceType(announcement.audienceType);
    setAudienceId(announcement.audienceId ? String(announcement.audienceId) : "");
    setFormError(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingAnnouncement(null);
    setTitle("");
    setBody("");
    setAudienceType("all");
    setAudienceId("");
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const schoolId = getSchoolId();
    if (!schoolId || !title.trim() || !body.trim()) return;
    if (audienceType !== "all" && !audienceId) {
      setFormError("Choose who should receive this announcement.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        audienceType,
        ...(audienceType !== "all" ? { audienceId: parseInt(audienceId, 10) } : { audienceId: null }),
      };

      if (editingAnnouncement) {
        await api.patch<Announcement>(`/schools/${schoolId}/announcements/${editingAnnouncement.id}`, payload);
        await loadAnnouncements();
      } else {
        await api.post<Announcement>(`/schools/${schoolId}/announcements`, payload);
        await loadAnnouncements();
      }
      closeSheet();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save announcement.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(announcement: Announcement) {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    const confirmed = window.confirm(`Delete "${announcement.title}"?`);
    if (!confirmed) return;

    try {
      await api.delete<{ id: number }>(`/schools/${schoolId}/announcements/${announcement.id}`);
      setAnnouncements((current) => current.filter((item) => item.id !== announcement.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete announcement.");
    }
  }

  function renderAnnouncementList() {
    if (loading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error}</p>
          <button type="button" onClick={loadAnnouncements} className="rounded-full px-6 py-2.5 text-sm font-bold" style={{ backgroundColor: "var(--grade-action-bg)", color: "#ffffff" }}>
            Retry
          </button>
        </div>
      );
    }

    if (announcements.length === 0) {
      return <EmptyState message="No announcements have been published yet." />;
    }

    if (filteredAnnouncements.length === 0) {
      return <EmptyState message="No announcements match this search or category." />;
    }

    return (
      <div className="flex flex-col gap-[9px] pb-3">
        {filteredAnnouncements.map((announcement) => (
          <article key={announcement.id} className="glass-panel announcement-glass-card rounded-xl p-5">
            <div className="flex items-start gap-4">
              <PersonAvatar />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="truncate text-[16px] font-semibold" style={{ color: "var(--color-school-black)" }}>
                    {authorLabel(announcement)}
                  </p>
                  <p className="shrink-0 text-[11px]" style={{ color: "var(--color-school-black)" }}>
                    {formatDate(announcement.createdAt)}
                  </p>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>{audienceLabel(announcement)}</p>
                <h2 className="mt-4 text-[16px] font-semibold leading-tight" style={{ color: "var(--color-accent)" }}>
                  {announcement.title}
                </h2>
                <p className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6" style={{ color: "var(--color-school-black)" }}>
                  {announcement.body}
                </p>
                <div className="mt-6" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }} />
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button type="button" onClick={() => openEditSheet(announcement)} className="glass-control flex h-7 items-center justify-center gap-1 rounded-full text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5" style={{ color: "var(--color-school-grey)" }}>
                    <EditIcon /> Edit
                  </button>
                  <button type="button" disabled className="glass-control flex h-7 items-center justify-center gap-1 rounded-full text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5 opacity-45" style={{ color: "var(--color-school-grey)" }} title="Hide needs announcement visibility fields">
                    <MutedIcon kind="hide" /> Hide
                  </button>
                  <button type="button" disabled className="glass-control flex h-7 items-center justify-center gap-1 rounded-full text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5 opacity-45" style={{ color: "var(--color-school-grey)" }} title="Pin needs a pinned announcement field">
                    <MutedIcon kind="pin" /> Pin
                  </button>
                  <button type="button" onClick={() => handleDelete(announcement)} className="glass-control flex h-7 items-center justify-center gap-1 rounded-full text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5" style={{ color: "var(--color-school-grey)" }}>
                    <TrashIcon /> Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderSettingsRow({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
      <button
        type="button"
        disabled
        className="glass-control flex w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-left opacity-55"
        style={{ backgroundColor: "var(--color-school-panel-active)", boxShadow: "0 3px 8px rgba(17,17,17,0.12)" }}
        title="This needs backend settings support"
      >
        <span className="text-[13px] leading-tight" style={{ color: "var(--color-school-black)" }}>
          {title}
          {subtitle && <span className="block">{subtitle}</span>}
        </span>
        <span style={{ color: "var(--color-school-grey)" }}>
          <MutedIcon kind="settings" />
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="h-full min-h-0 overflow-y-auto px-4 pb-28 pt-4 sm:px-7 lg:overflow-hidden lg:px-12 lg:pb-9 lg:pt-0">
        <div className="flex min-h-0 flex-col gap-[var(--grades-grid-gap)] lg:h-full lg:flex-row">
          <aside className="glass-panel announcement-sidebar flex shrink-0 flex-col rounded-xl p-5 lg:w-[240px] xl:w-[290px]" style={{ color: "var(--color-text)" }}>
            <button type="button" onClick={openCreateSheet}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold [&_svg]:h-4 [&_svg]:w-4"
              style={{ backgroundColor: "var(--grade-action-bg)", color: "#ffffff" }}>
              <PlusIcon /> New announcement
            </button>
            <div className="hidden lg:block">
              <div className="sidebar-divider my-5" />
              <h2 className="text-[16px] font-semibold">Announcement settings</h2>
              <div className="mt-4 flex flex-col gap-[9px]">
                {renderSettingsRow({ title: "Manage permissions", subtitle: "Who can post" })}
                {renderSettingsRow({ title: "Categories and system tags" })}
                {renderSettingsRow({ title: "Retention and archiving rules" })}
                {renderSettingsRow({ title: "Default audience", subtitle: "All users" })}
              </div>
            </div>
          </aside>
          <main className="min-h-0 min-w-0 flex-1 lg:flex lg:flex-col" style={{ color: "var(--color-text)" }}>
            <div className="glass-panel announcement-toolbar flex shrink-0 flex-wrap items-center gap-3 rounded-xl p-4">
              <h1 className="text-[16px] font-semibold">Announcements</h1>
              <select value={filter} onChange={(e) => setFilter(e.target.value as AudienceFilter)} aria-label="Filter announcements"
                className="glass-field announcement-filter-select h-9 min-w-[150px] rounded-full border pl-3 pr-10 text-[12px] outline-none">
                {FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <form onSubmit={(e) => { e.preventDefault(); setQuery(searchInput); }}
                className="glass-field flex h-9 min-w-[180px] flex-1 overflow-hidden rounded-full border">
                <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search announcements" aria-label="Search announcements"
                  className="min-w-0 flex-1 bg-transparent px-3 text-[12px] outline-none" />
                <button type="submit" aria-label="Search" className="flex w-10 shrink-0 items-center justify-center border-l border-white/10 [&_svg]:h-4 [&_svg]:w-4"><SearchIcon /></button>
              </form>
            </div>
            <div className="mt-[9px] min-h-0 flex-1 overflow-y-auto">{renderAnnouncementList()}</div>
          </main>
        </div>
      </div>

      <BottomSheet isOpen={sheetOpen} onClose={closeSheet} title={editingAnnouncement ? "Edit announcement" : "New announcement"}>
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <FloatingLabelInput id="announcement-title" label="Title" value={title} onChange={setTitle} required />
          <FloatingLabelSelect
            id="announcement-audience-type"
            label="Audience"
            value={audienceType}
            onChange={(value) => {
              setAudienceType(value as AudienceType);
              setAudienceId("");
            }}
            options={AUDIENCE_TYPES}
            required
          />
          {audienceType !== "all" && (
            <FloatingLabelSelect id="announcement-audience" label={`Choose ${audienceType}`} value={audienceId} onChange={setAudienceId} options={audienceOptions} required />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Announcement body"
            required
            rows={6}
            className="w-full resize-none rounded-lg border bg-transparent p-4 text-sm outline-none"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
          {formError && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{formError}</p>}
          <button type="submit" disabled={submitting || !title.trim() || !body.trim() || (audienceType !== "all" && !audienceId)} className="w-full rounded-lg text-sm font-bold disabled:opacity-50" style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#ffffff" }}>
            {submitting ? "Saving..." : editingAnnouncement ? "Save announcement" : "Publish announcement"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
