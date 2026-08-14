"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";
import { GradeRow } from "@/components/principal/GradeRow";

interface Grade {
  id: number;
  number: number;
}

const ALL_NUMBERS = [8, 9, 10, 11, 12];

export default function GradesPage() {
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sortedGrades = [...grades].sort((a, b) => a.number - b.number);
  const availableOptions = ALL_NUMBERS
    .filter((n) => !grades.some((g) => g.number === n))
    .map((n) => ({ value: String(n), label: `Grade ${n}` }));

  useEffect(() => {
    const schoolId = getSchoolId();
    if (!schoolId) { router.replace("/"); return; }

    api.get<Grade[]>(`/schools/${schoolId}/grades`)
      .then(setGrades)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("401")) { router.replace("/"); return; }
        setError("Failed to load grades.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleOpen() {
    setSelectedNumber("");
    setSubmitError(null);
    setFormOpen(true);
  }

  function handleClose() {
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
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create grade. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Mobile / tablet ──────────────────────────────────────────────────── */}
      <div className="lg:hidden py-6">
        <div className="sm:max-w-xl sm:mx-auto">
          <div>
            <PageHeader title="Grades & Classes" />

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
            ) : sortedGrades.length === 0 ? (
              <EmptyState message="No grades yet. Tap + to add the first grade." />
            ) : (
              sortedGrades.map((grade, i) => (
                <GradeRow
                  key={grade.id}
                  grade={grade}
                  isLast={i === sortedGrades.length - 1}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop: right panel (sidebar is in grades/layout.tsx) ──────────── */}
      <div className="hidden lg:flex items-center justify-center flex-1">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Select a grade to view and manage its classes.
        </p>
      </div>

      {/* ── Bottom sheet — mobile / tablet ───────────────────────────────────── */}
      <BottomSheet isOpen={formOpen} onClose={handleClose} title="Add grade">
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>
          <FloatingLabelSelect
            id="grade-number-mobile"
            label="Grade number"
            value={selectedNumber}
            onChange={setSelectedNumber}
            options={availableOptions}
            required
          />
          {submitError && (
            <p className="text-sm" style={{ color: "var(--color-accent)" }}>
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={!selectedNumber || submitting}
            className="w-full text-sm font-bold rounded-lg disabled:opacity-50"
            style={{ height: "var(--control-height)", backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            {submitting ? "Creating..." : "Create grade"}
          </button>
        </form>
      </BottomSheet>

      {/* ── Floating + button — mobile / tablet ──────────────────────────────── */}
      {availableOptions.length > 0 && !formOpen && !loading && (
        <button
          onClick={handleOpen}
          className="lg:hidden fixed right-6 bottom-24 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-light"
          style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          aria-label="Add grade"
        >
          +
        </button>
      )}
    </>
  );
}
