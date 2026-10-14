"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSchoolId } from "@/lib/auth";

interface Grade {
  id: number;
  number: number;
}

export function GradesSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const sortedGrades = [...grades].sort((a, b) => a.number - b.number);

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

  return (
    <aside className="hidden lg:block w-[240px] xl:w-[290px] flex-shrink-0">
      <div
        className="glass-panel grade-sidebar min-h-[440px] rounded-[22px] overflow-hidden flex flex-col py-6"
        style={{
          backgroundColor: "var(--color-school-panel)",
          border: "1px solid rgba(37, 37, 37, 0.06)",
          boxShadow: "0 12px 26px rgba(17, 17, 17, 0.14)",
        }}
      >
        <div className="sidebar-heading px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="sidebar-school-icon" aria-hidden="true">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 9 10-5 10 5-10 5L2 9Z" />
                <path d="M6 11v6c3 3 9 3 12 0v-6M22 9v7" />
              </svg>
            </span>
            <div>
              <p className="text-[16px] font-semibold" style={{ color: "var(--color-school-black)" }}>Grades &amp; Classes</p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>School administration</p>
            </div>
          </div>
          <div className="sidebar-divider mt-5" />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-text-muted)" }}>Your grades</p>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
              />
            </div>
          ) : sortedGrades.length === 0 ? (
            <p className="px-2 py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Grades could not be loaded. Please refresh.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {sortedGrades.map((grade) => {
                const active = grade.id === activeGradeId;
                return (
                  <div
                    key={grade.id}
                    className="glass-grade-item group flex items-center transition-colors"
                    style={{ backgroundColor: active ? "var(--color-school-panel-active)" : "transparent" }}
                  >
                    <button
                      aria-current={active ? "page" : undefined}
                      onClick={() => router.push(`/dashboard/principal/grades/${grade.id}`)}
                      className="min-w-0 flex-1 flex items-center gap-3 px-5 py-3 text-left text-[14px] leading-6 font-medium"
                      style={{ color: active ? "var(--color-accent)" : "var(--color-school-black)" }}
                    >
                      <span className="sidebar-grade-icon" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="3" width="16" height="18" rx="3" />
                          <path d="M8 8h8M8 12h8M8 16h4" />
                        </svg>
                      </span>
                      Grade {grade.number}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
