import Link from "next/link";

interface GradeRowProps {
  grade: { id: number; number: number };
}

export function GradeRow({ grade }: GradeRowProps) {
  return (
    <div
      className="glass-panel grade-glass-card group overflow-hidden rounded-[20px] transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(37, 37, 37, 0.10)",
        boxShadow: "0 10px 24px rgba(37, 37, 37, 0.06)",
      }}
    >
      <Link href={`/dashboard/principal/grades/${grade.id}`} className="block px-5 pb-3 pt-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--color-school-grey)" }}>
          Grade
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <span className="text-[34px] font-black leading-none" style={{ color: "var(--color-accent)" }}>
            {grade.number}
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--color-school-black)" }}>
            Open
          </span>
        </div>
      </Link>

      <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "rgba(37, 37, 37, 0.08)" }}>
        <span className="text-xs" style={{ color: "var(--color-school-grey)" }}>
          Manage classes
        </span>
      </div>
    </div>
  );
}
