import Link from "next/link";

interface GradeRowProps {
  grade: { id: number; number: number };
  isLast: boolean;
}

export function GradeRow({ grade, isLast }: GradeRowProps) {
  return (
    <Link
      href={`/dashboard/principal/grades/${grade.id}`}
      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--color-surface)]"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
      }}
    >
      <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
        Grade {grade.number}
      </span>
      <span className="text-lg" style={{ color: "var(--color-text-muted)" }}>›</span>
    </Link>
  );
}