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

interface StaffMember {
  id: number;
  title: string;
  firstName: string;
  surname: string;
  staffNumber: string;
  role: string;
  accountSetUp: boolean;
  username: string | null;
  assignedChapterCount: number;
  assignedSubjectCount: number;
}

type StaffFilter = "all" | "assigned" | "unassigned" | "active" | "pending";

const TITLES = ["Mr", "Mrs", "Ms", "Dr"].map((title) => ({ value: title, label: title }));

const FILTERS: { value: StaffFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "assigned", label: "Assigned" },
  { value: "unassigned", label: "Not assigned" },
  { value: "active", label: "Account active" },
  { value: "pending", label: "Setup pending" },
];

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

function PlusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function isAssignedTeacher(person: StaffMember) {
  return Number(person.assignedSubjectCount ?? 0) > 0 || Number(person.assignedChapterCount ?? 0) > 0;
}

export default function PrincipalStaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredStaff = useMemo(() => {
    const term = query.trim().toLowerCase();
    return staff
      .filter((person) => {
        if (filter === "assigned") return isAssignedTeacher(person);
        if (filter === "unassigned") return !isAssignedTeacher(person);
        if (filter === "active") return person.accountSetUp;
        if (filter === "pending") return !person.accountSetUp;
        return true;
      })
      .filter((person) => {
        if (!term) return true;
        return `${person.title} ${person.firstName} ${person.surname} ${person.staffNumber}`.toLowerCase().includes(term);
      })
      .sort((a, b) => a.surname.localeCompare(b.surname) || a.firstName.localeCompare(b.firstName));
  }, [filter, query, staff]);

  const loadStaff = useCallback(async () => {
    const schoolId = getSchoolId();
    if (!schoolId) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await api.get<StaffMember[]>(`/schools/${schoolId}/people`);
      setStaff(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("401")) {
        router.replace("/");
        return;
      }
      setError("Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadStaff();
    });
    return () => { cancelled = true; };
  }, [loadStaff]);

  function closeAddSheet() {
    setAddOpen(false);
    setTitle("");
    setFirstName("");
    setSurname("");
    setStaffNumber("");
    setFormError(null);
  }

  function closeImportSheet() {
    setImportOpen(false);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const schoolId = getSchoolId();
    if (!schoolId || !title || !firstName.trim() || !surname.trim() || !staffNumber.trim()) return;

    const duplicate = staff.some((person) => person.staffNumber.toLowerCase() === staffNumber.trim().toLowerCase());
    if (duplicate) {
      setFormError("A staff member with this staff number already exists.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.post<StaffMember>(`/schools/${schoolId}/people`, {
        title,
        firstName: firstName.trim(),
        surname: surname.trim(),
        staffNumber: staffNumber.trim(),
      });
      await loadStaff();
      closeAddSheet();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add staff member.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderStaffList() {
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
          <button type="button" onClick={loadStaff} className="rounded-full px-6 py-2.5 text-sm font-bold" style={{ backgroundColor: "var(--grade-action-bg)", color: "#ffffff" }}>
            Retry
          </button>
        </div>
      );
    }

    if (staff.length === 0) {
      return <EmptyState message="No staff members have been added yet." />;
    }

    if (filteredStaff.length === 0) {
      return <EmptyState message="No staff match this filter or search." />;
    }

    return (
      <ul className="divide-y divide-white/[0.08]">
        {filteredStaff.map((person) => (
          <li key={person.id} className="flex items-center gap-3 px-2 py-3 hover:bg-white/[0.035]">
            <button type="button" onClick={() => setSelectedStaff(person)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[16px] font-medium">{person.title} {person.firstName} {person.surname}</span>
              <span className="mt-1 block text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {person.staffNumber} &middot; {person.accountSetUp ? "Account active" : "Setup pending"}
              </span>
            </button>
            <button type="button" onClick={() => setSelectedStaff(person)}
              className="glass-control flex h-8 w-8 shrink-0 items-center justify-center rounded-full [&_svg]:h-4 [&_svg]:w-4"
              aria-label={`View details for ${person.firstName} ${person.surname}`}><InfoIcon /></button>
          </li>
        ))}
      </ul>
    );
  }

  function renderAddStaffActions() {
    return (
      <section style={{ color: "var(--color-text)" }} className="glass-panel staff-actions self-start rounded-xl p-5">
        <h2 className="text-[16px] font-semibold">Add Staff Member(s)</h2>
        <div className="mt-4 grid grid-cols-2 gap-[9px]">
          <button type="button" onClick={() => setImportOpen(true)}
            className="glass-panel glass-create-card flex min-h-[140px] flex-col items-center justify-center rounded-xl px-2 text-center">
            <span className="class-create-icon flex h-10 w-10 items-center justify-center rounded-lg"><PlusIcon /></span>
            <span className="mt-3 text-[13px] font-semibold">Add in bulk</span>
          </button>
          <button type="button" onClick={() => setAddOpen(true)}
            className="glass-panel glass-create-card flex min-h-[140px] flex-col items-center justify-center rounded-xl px-2 text-center">
            <span className="class-create-icon flex h-10 w-10 items-center justify-center rounded-lg"><PlusIcon /></span>
            <span className="mt-3 text-[13px] font-semibold">Add individually</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="h-full min-h-0 overflow-y-auto px-4 pb-28 pt-4 sm:px-7 lg:overflow-hidden lg:px-12 lg:pb-9 lg:pt-0">
        <div className="flex min-h-0 flex-col gap-[var(--grades-grid-gap)] lg:h-full lg:flex-row">
          <main style={{ color: "var(--color-text)" }} className="glass-panel staff-list-panel flex min-h-0 min-w-0 flex-1 flex-col rounded-xl p-5">
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <h1 className="text-[16px] font-semibold">Staff</h1>
              <select value={filter} onChange={(e) => setFilter(e.target.value as StaffFilter)} aria-label="Filter staff"
                className="glass-field staff-filter-select h-9 min-w-[150px] rounded-full border pl-3 pr-10 text-[12px] outline-none">
                {FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <form onSubmit={(e) => { e.preventDefault(); setQuery(searchInput); }}
                className="glass-field relative flex h-9 min-w-[180px] flex-1 overflow-hidden rounded-full border sm:ml-auto">
                <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search staff" aria-label="Search staff"
                  className="min-w-0 flex-1 bg-transparent px-3 text-[12px] outline-none" />
                <button type="submit" aria-label="Search" className="flex w-10 shrink-0 items-center justify-center border-l border-white/10 hover:bg-white/10 [&_svg]:h-4 [&_svg]:w-4">
                  <SearchIcon />
                </button>
              </form>
            </div>
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto">{renderStaffList()}</div>
          </main>
          <div className="shrink-0 lg:w-[340px] xl:w-[380px]">{renderAddStaffActions()}</div>
        </div>
      </div>

      <BottomSheet isOpen={addOpen} onClose={closeAddSheet} title="Add staff member">
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <FloatingLabelSelect id="staff-title" label="Title" value={title} onChange={setTitle} options={TITLES} required />
          <FloatingLabelInput id="staff-first-name" label="First name" value={firstName} onChange={setFirstName} required />
          <FloatingLabelInput id="staff-surname" label="Surname" value={surname} onChange={setSurname} required />
          <FloatingLabelInput id="staff-number" label="Staff number" value={staffNumber} onChange={setStaffNumber} required />
          {formError && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{formError}</p>}
          <button type="submit" disabled={submitting || !title || !firstName.trim() || !surname.trim() || !staffNumber.trim()} className="w-full rounded-lg text-sm font-bold disabled:opacity-50" style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#ffffff" }}>
            {submitting ? "Saving..." : "Add staff member"}
          </button>
        </form>
      </BottomSheet>

      {importOpen && getSchoolId() && <RosterImportModal schoolId={getSchoolId()!} kind="staff" onClose={closeImportSheet} onSaved={loadStaff} />}

      <BottomSheet isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title="Staff details">
        {selectedStaff && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Name</p>
              <p className="mt-1 text-lg font-extrabold" style={{ color: "var(--color-accent)" }}>
                {selectedStaff.title} {selectedStaff.firstName} {selectedStaff.surname}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Staff number</p>
              <p className="mt-1 font-semibold" style={{ color: "var(--color-school-black)" }}>{selectedStaff.staffNumber}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Teaching status</p>
              <p className="mt-1 font-semibold" style={{ color: isAssignedTeacher(selectedStaff) ? "#86c9a0" : "var(--color-accent)" }}>
                {isAssignedTeacher(selectedStaff)
                  ? `Teacher: ${selectedStaff.assignedSubjectCount ?? 0} subject-class allocation(s), ${selectedStaff.assignedChapterCount} chapter(s)`
                  : "No teaching assignments yet"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Account</p>
              <p className="mt-1 font-semibold" style={{ color: selectedStaff.accountSetUp ? "#166534" : "var(--color-accent)" }}>
                {selectedStaff.accountSetUp ? `Active${selectedStaff.username ? ` as ${selectedStaff.username}` : ""}` : "Setup pending"}
              </p>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
