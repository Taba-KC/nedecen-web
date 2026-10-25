/**
 * Compatibility entry for an older principal URL. Redirect to
 * "/dashboard/principal?book=learners"; the current content is rendered by
 * components/principal/books/BookWorkspace.tsx and its registry, not by this file.
 */
import { redirect } from "next/navigation";

export default function BookEntry() {
  redirect("/dashboard/principal?book=learners");
}
