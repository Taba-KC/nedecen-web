import { GradesSidebar } from "@/components/principal/GradesSidebar";

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 lg:gap-[var(--grades-grid-gap)] lg:overflow-hidden lg:px-12 lg:pb-9 lg:pt-0">
      <GradesSidebar />
      <div className="flex-1 min-w-0 lg:flex lg:min-h-0">
        {children}
      </div>
    </div>
  );
}
