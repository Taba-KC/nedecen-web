/**
 * Entry point for /dashboard/staff. TeacherBookWorkspace owns the shelf, page selection and
 * teaching data. This small route file connects Next.js routing to that component.
 */
import { Suspense } from "react";
import TeacherBookWorkspace from "@/components/dashboard/teacher-books/TeacherBookWorkspace";

export default function Page() {
  return <Suspense fallback={<p className="p-8">Opening your teaching library…</p>}><TeacherBookWorkspace /></Suspense>;
}
