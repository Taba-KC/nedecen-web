import { Suspense } from "react";
import { BookWorkspace } from "@/components/principal/books/BookWorkspace";

export default function PrincipalHome() {
  return <Suspense fallback={<p className="p-8">Opening your school library…</p>}><BookWorkspace /></Suspense>;
}
