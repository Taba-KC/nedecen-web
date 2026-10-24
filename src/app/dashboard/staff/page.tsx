import { Suspense } from "react";
import TeacherBookWorkspace from "@/components/dashboard/teacher-books/TeacherBookWorkspace";

export default function Page() {
  return <Suspense fallback={<p className="p-8">Opening your teaching library…</p>}><TeacherBookWorkspace /></Suspense>;
}
