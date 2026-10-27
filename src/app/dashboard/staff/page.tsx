/**
 * Entry point for /dashboard/staff. TeacherBookWorkspace owns the shelf, page selection and
 * teaching data. This small route file connects Next.js routing to that component.
 */
import { Suspense } from "react";
import TeacherBookWorkspace from "@/components/dashboard/teacher-books/TeacherBookWorkspace";
import { StaffAccessBoundary } from "@/components/dashboard/StaffAccess";

export default function Page() {
  return <Suspense fallback={<p className="p-8">Opening your teaching library…</p>}><StaffAccessBoundary mode="teaching"><TeacherBookWorkspace /></StaffAccessBoundary></Suspense>;
}
