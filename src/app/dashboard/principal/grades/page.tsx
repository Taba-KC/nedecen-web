"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { GradeRow } from "@/components/principal/GradeRow";

interface Grade {
  id: number;
  number: number;
}

export default function GradesPage() {
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sortedGrades = [...grades].sort((a, b) => a.number - b.number);
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

  return (
    <>
      {/* ── Mobile / tablet ──────────────────────────────────────────────────── */}
      <div className="lg:hidden h-full overflow-y-auto px-4 pb-28 pt-4 sm:px-7">
        <div className="mx-auto max-w-3xl">
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
              <EmptyState message="Grades could not be loaded. Please refresh." />
            ) : (
              <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
                {sortedGrades.map((grade) => (
                  <GradeRow
                    key={grade.id}
                    grade={grade}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop: right panel (sidebar is in grades/layout.tsx) ──────────── */}
      <div className="hidden lg:flex flex-1 min-h-0 items-center justify-center overflow-y-auto px-6 py-8">
        <div className="glass-panel grade-glass-card w-full max-w-[400px] rounded-[12px] px-8 py-8 text-center" role="status">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}>
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m10 6-6 6 6 6M4 12h16" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            {loading ? "Loading grades" : error ? "Couldn't load grades" : sortedGrades.length === 0 ? "Grades unavailable" : "Choose a grade"}
          </h2>
          <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-muted)" }}>
            {loading ? "Your school structure will appear shortly." : error ? error : sortedGrades.length === 0 ? "Please refresh to load your school grades." : "Select a grade from the sidebar to see its classes."}
          </p>
          {!loading && !!error && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: "var(--grade-action-bg, var(--color-school-black))", color: "#fff" }}
            >
              Retry
            </button>
          )}
        </div>
      </div>

    </>
  );
}
