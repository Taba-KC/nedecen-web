"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getSchoolId, getAccountId } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Person {
  id: number;
  title: string;
  firstName: string;
  surname: string;
  role: string;
  accountSetUp: boolean;
}

interface Grade { id: number; number: number; }
interface Stream { id: number; name: string; }

interface Class {
  id: number;
  name: string;
  gradeId: number;
  streamId: number | null;
}

interface Learner {
  id: number;
  accountSetUp: boolean;
}

interface DashboardData {
  principalName: string;
  grades: Grade[];
  streams: Stream[];
  allClasses: Class[];
  allPeople: Person[];
  gradesWithNoClasses: Grade[];
  learnersPerClass: Map<number, Learner[]>;
}

// ── Insights ──────────────────────────────────────────────────────────────────

type Severity = "warning" | "info" | "ok";

interface Insight {
  severity: Severity;
  headline: string;
  detail: string;
  action?: { label: string; href: string };
}

function deriveInsights(d: DashboardData): Insight[] {
  const out: Insight[] = [];
  const { grades, streams, allClasses, allPeople, gradesWithNoClasses, learnersPerClass } = d;

  if (grades.length === 0) {
    out.push({
      severity: "warning",
      headline: "No grades added yet",
      detail: "Adding grades is the first step. Classes, streams, subjects, and lessons all flow from here.",
      action: { label: "Add grades", href: "/dashboard/principal/grades" },
    });
    return out;
  }

  if (gradesWithNoClasses.length > 0) {
    out.push({
      severity: "warning",
      headline: `${gradesWithNoClasses.length} grade${gradesWithNoClasses.length !== 1 ? "s have" : " has"} no classes`,
      detail: `Create classes like 11A and 11B inside each grade so learners have somewhere to belong.`,
      action: { label: "Add classes", href: "/dashboard/principal/classes" },
    });
  }

  if (streams.length === 0) {
    out.push({
      severity: "warning",
      headline: "No streams created yet",
      detail: "Streams define which subjects a class studies. You need at least one before you can assign subjects to classes.",
      action: { label: "Create streams", href: "/dashboard/principal/streams" },
    });
  }

  const classesNoStream = allClasses.filter((c) => c.streamId === null);
  if (classesNoStream.length > 0) {
    out.push({
      severity: "warning",
      headline: `${classesNoStream.length} class${classesNoStream.length !== 1 ? "es have" : " has"} no stream assigned`,
      detail: "Without a stream a class has no subjects... learners in those classes won't have lessons or homework.",
      action: { label: "Assign streams", href: "/dashboard/principal/classes" },
    });
  }

  const classesNoLearners: Class[] = [];
  learnersPerClass.forEach((learners, classId) => {
    if (learners.length === 0) {
      const cls = allClasses.find((c) => c.id === classId);
      if (cls) classesNoLearners.push(cls);
    }
  });
  if (classesNoLearners.length > 0) {
    out.push({
      severity: "info",
      headline: `${classesNoLearners.length} class${classesNoLearners.length !== 1 ? "es have" : " has"} no learners yet`,
      detail: "Add learners individually or import them from an Excel file.",
      action: { label: "Add learners", href: "/dashboard/principal/learners" },
    });
  }

  const inactiveStaff = allPeople.filter((p) => !p.accountSetUp);
  if (inactiveStaff.length > 0) {
    out.push({
      severity: "info",
      headline: `${inactiveStaff.length} staff member${inactiveStaff.length !== 1 ? "s haven't" : " hasn't"} set up their account`,
      detail: "They won't be able to sign in until they complete onboarding.",
      action: { label: "View staff", href: "/dashboard/principal/staff" },
    });
  }

  let inactiveLearners = 0;
  learnersPerClass.forEach((learners) => {
    inactiveLearners += learners.filter((l) => !l.accountSetUp).length;
  });
  if (inactiveLearners > 0) {
    out.push({
      severity: "info",
      headline: `${inactiveLearners} learner${inactiveLearners !== 1 ? "s haven't" : " hasn't"} set up their account`,
      detail: "They won't be able to receive homework or submit feedback until they complete onboarding.",
      action: { label: "View learners", href: "/dashboard/principal/learners" },
    });
  }

  if (out.length === 0) {
    out.push({
      severity: "ok",
      headline: "Your school is fully configured",
      detail: "All classes have streams, all staff and learners have active accounts. Everything is ready.",
    });
  }

  return out;
}

// ── Severity config ───────────────────────────────────────────────────────────

const SEVERITY = {
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    iconColor: "#f59e0b",
    btnBg: "#f59e0b",
    btnText: "#1a1a1a",
  },
  info: {
    bg: "var(--color-surface)",
    border: "var(--color-border)",
    iconColor: "var(--color-text-muted)",
    btnBg: "var(--color-btn-primary-bg)",
    btnText: "var(--color-btn-primary-text)",
  },
  ok: {
    bg: "rgba(34, 197, 94, 0.08)",
    border: "rgba(34, 197, 94, 0.2)",
    iconColor: "#22c55e",
    btnBg: "",
    btnText: "",
  },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const cfg = SEVERITY[insight.severity];

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex items-start gap-3">
        {/* Severity icon */}
        <span className="flex-shrink-0 mt-0.5">
          {insight.severity === "ok" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : insight.severity === "warning" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
            {insight.headline}
          </p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {insight.detail}
          </p>
        </div>
      </div>

      {insight.action && (
        <Link
          href={insight.action.href}
          className="self-start text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-80"
          style={{ backgroundColor: cfg.btnBg, color: cfg.btnText }}
        >
          {insight.action.label} →
        </Link>
      )}
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
        {value}
      </span>
      <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PrincipalHome() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const schoolId = getSchoolId();
    const accountId = getAccountId();

    if (!schoolId) {
      router.replace("/");
      return;
    }

    async function load() {
      try {
        const [people, grades, streams] = await Promise.all([
          api.get<Person[]>(`/schools/${schoolId}/people`),
          api.get<Grade[]>(`/schools/${schoolId}/grades`),
          api.get<Stream[]>(`/schools/${schoolId}/streams`),
        ]);

        const classGroups = grades.length > 0
          ? await Promise.all(
              grades.map((g) =>
                api.get<Class[]>(`/schools/${schoolId}/grades/${g.id}/classes`)
              )
            )
          : [];

        const allClasses = classGroups.flat();
        const gradesWithNoClasses = grades.filter((_, i) => (classGroups[i] ?? []).length === 0);

        const learnerGroups = allClasses.length > 0
          ? await Promise.all(
              allClasses.map((c) =>
                api.get<Learner[]>(`/schools/${schoolId}/classes/${c.id}/learners`)
              )
            )
          : [];

        const learnersPerClass = new Map<number, Learner[]>();
        allClasses.forEach((c, i) => {
          learnersPerClass.set(c.id, learnerGroups[i] ?? []);
        });

        const me = people.find((p) => p.id === accountId);

        setData({
          principalName: me ? `${me.title} ${me.surname}` : "",
          grades,
          streams,
          allClasses,
          allPeople: people,
          gradesWithNoClasses,
          learnersPerClass,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          router.replace("/");
          return;
        }
        setError("Could not load the dashboard. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-semibold px-6 py-2.5 rounded-lg"
          style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const insights = deriveInsights(data);
  const totalLearners = Array.from(data.learnersPerClass.values()).reduce(
    (sum, l) => sum + l.length,
    0
  );

  return (
    <div
      className="px-[var(--page-px)] sm:px-[var(--page-px-sm)] py-8"
    >
      <div className="mx-auto max-w-3xl">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {data.principalName ? `Hello, ${data.principalName}` : "School dashboard"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Here is a summary of your school is current state.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <StatTile value={data.grades.length} label="Grades" />
          <StatTile value={data.allClasses.length} label="Classes" />
          <StatTile value={data.allPeople.length} label="Staff" />
          <StatTile value={totalLearners} label="Learners" />
        </div>

        {/* Insights */}
        <p
          className="text-xs font-semibold tracking-widest mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          SCHOOL STATUS
        </p>
        <div className="flex flex-col gap-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>

      </div>
    </div>
  );
}