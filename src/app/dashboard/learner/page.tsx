/**
 * Learner bookshelf route. Suspense allows the client workspace to read URL search parameters.
 */
import { Suspense } from "react";
import LearnerBookWorkspace from "@/components/dashboard/learner-books/LearnerBookWorkspace";

export default function Page() { return <Suspense fallback={<p>Preparing your library…</p>}><LearnerBookWorkspace /></Suspense>; }
