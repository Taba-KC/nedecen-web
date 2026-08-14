import { GradesSidebar } from "@/components/principal/GradesSidebar";

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 64px)" }}>
      <GradesSidebar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
