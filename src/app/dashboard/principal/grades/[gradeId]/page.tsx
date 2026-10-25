/**
 * Translate an older /grades/<id> address into the current ?book=grades&page=grade-<id>
 * selection. The database grade ID stays the same; the destination workspace renders its
 * content.
 */
import { redirect } from "next/navigation";

export default async function GradeEntry({ params }: { params: Promise<{ gradeId: string }> }) {
  const { gradeId } = await params;
  redirect(`/dashboard/principal?book=grades&page=grade-${encodeURIComponent(gradeId)}`);
}
