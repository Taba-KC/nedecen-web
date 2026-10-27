/**
 * Entry point for /dashboard/principal. The actual bookshelf UI is in
 * components/principal/books/BookWorkspace.tsx. Suspense provides a loading boundary around
 * the workspace that reads URL query parameters.
 */
import { Suspense } from "react";
import { BookWorkspace } from "@/components/principal/books/BookWorkspace";
import { StaffAccessBoundary } from "@/components/dashboard/StaffAccess";

export default function PrincipalHome() {
  return <Suspense fallback={<p className="p-8">Opening your school library…</p>}><StaffAccessBoundary mode="administration"><BookWorkspace /></StaffAccessBoundary></Suspense>;
}
