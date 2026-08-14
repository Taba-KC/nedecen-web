"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";

interface Grade {
  id: number;
  number: number;
}

const ALL_NUMBERS = [8, 9, 10, 11, 12];

export function GradesSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sortedGrades = [...grades].sort((a, b) => a.number - b.number);
  const availableOptions = ALL_NUMBERS
    .filter((n) => !grades.some((g) => g.number === n))
    .map((n) => ({ value: String(n), label: `Grade ${n}` }));

  const match = pathname.match(/\/grades\/(\d+)/);
  const activeGradeId = match ? parseInt(match[1], 10) : null;

  useEffect(() => {
    const schoolId = getSchoolId();
    if (!schoolId) { router.replace("/"); return; }
    api.get<Grade[]>(`/schools/${schoolId}/grades`)
      .then(setGrades)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  function openForm() {
    setSelectedNumber("");
    setSubmitError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSelectedNumber("");
    setSubmitError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNumber) return;
    const schoolId = getSchoolId();
    if (!schoolId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/schools/${schoolId}/grades`, { number: parseInt(selectedNumber, 10) });
      const updated = await api.get<Grade[]>(`/schools/${schoolId}/grades`);
      setGrades(updated);
      closeForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create grade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-64 flex-shrink-0 p-4"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      {/* Floating card */}
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-card)",
          boxShadow: "0 2px 16px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Card heading */}
        <div
          className="px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
            Grades
          </p>
        </div>

        {/* Grade list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
              />
            </div>
          ) : sortedGrades.length === 0 ? (
            <p className="px-5 py-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
              No grades yet.
            </p>
          ) : (
            sortedGrades.map((grade, i) => {
              const active = grade.id === activeGradeId;
              return (
                <div key={grade.id}>
                  {i > 0 && (
                    <div className="mx-4" style={{ height: "1px", backgroundColor: "var(--color-border)" }} />
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/principal/grades/${grade.id}`)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors"
                    style={{
                      color: active ? "var(--color-accent)" : "var(--color-text)",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <span className="text-sm font-medium">Grade {grade.number}</span>
                    {active && (
                      <span className="text-base" style={{ color: "var(--color-accent)" }}>›</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add grade */}
        {availableOptions.length > 0 && (
          <>
            <div className="mx-4" style={{ height: "1px", backgroundColor: "var(--color-border)" }} />
            <div className="px-4 py-4 flex-shrink-0">
              {!formOpen ? (
                <button
                  onClick={openForm}
                  className="w-full text-sm font-semibold py-2.5 rounded-lg transition-all"
                  style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                >
                  + Add grade
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <FloatingLabelSelect
                    id="sidebar-grade-number"
                    label="Grade number"
                    value={selectedNumber}
                    onChange={setSelectedNumber}
                    options={availableOptions}
                    required
                  />
                  {submitError && (
                    <p className="text-xs" style={{ color: "var(--color-accent)" }}>
                      {submitError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="flex-1 text-sm py-2 rounded-lg transition-all"
                      style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedNumber || submitting}
                      className="flex-1 text-sm font-semibold py-2 rounded-lg disabled:opacity-50 transition-all"
                      style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                    >
                      {submitting ? "..." : "Create"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
