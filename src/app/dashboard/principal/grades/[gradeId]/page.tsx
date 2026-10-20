import { redirect } from "next/navigation";

export default async function GradeEntry({ params }: { params: Promise<{ gradeId: string }> }) {
  const { gradeId } = await params;
  redirect(`/dashboard/principal?book=grades&page=grade-${encodeURIComponent(gradeId)}`);
}
