/** Stable page IDs belong in URLs; printed numbers are derived from the current subject order. */
export type GoalAnswer = "yes" | "no" | null;
export type LearnerConcept = {
  id: number; name: string; chapterName: string; topicName: string;
  prerequisites: string[]; learningOutcomes: string[]; taught?: boolean;
  lessonConceptId?: number; answers?: GoalAnswer[]; reviewGoals?: string[];
};
export type LearnerLesson = { id: number; lessonNumber: number; date: string; status: string; canRespond: boolean; concepts: LearnerConcept[] };
export type LearnerQuestion = { id: number; body: string; conceptId: number; conceptName: string; chapterName: string; topicName: string };
export type LearnerHomework = { id: number; activityNumber: number; lessonId: number; dueDate: string; releaseAt: string | null; canReveal: boolean; questions: LearnerQuestion[] };
export type LearnerSubject = { id: number; subjectId: number; subjectName: string; syllabus: LearnerConcept[]; lessons: LearnerLesson[]; homework: LearnerHomework[] };
export type LearnerWorkspaceData = { profile: { firstName: string; surname: string; number: string; username: string | null; schoolName: string; className: string; gradeNumber: number }; subjects: LearnerSubject[] };
export const LEARNER_BOOKS = [
  { id: "lessons", title: "Lessons", mark: "01", color: "#8b413d", description: "Prepare for your next lesson, revisit completed lessons and give feedback on your learning goals." },
  { id: "homework", title: "Homework", mark: "02", color: "#96713d", description: "Find your home activities and see worked answers when your teacher releases them." },
  { id: "syllabus", title: "Syllabus", mark: "03", color: "#536b58", description: "See what you have covered and what comes next, with prerequisites and learning goals." },
] as const;
export type LearnerBookId = typeof LEARNER_BOOKS[number]["id"];
export type LessonTab = "upcoming" | "completed";
export type HomeworkTab = "latest" | "previous";
export type SyllabusTab = "covered" | "uncovered";
export type LearnerTab = LessonTab | HomeworkTab | SyllabusTab;
export type LearnerPageKind = LearnerBookId;
export type LearnerPage = { id: string; title: string; number: string; kind: LearnerPageKind; subject: LearnerSubject; children?: LearnerPage[] };
/** Every book opens a subject page; these tabs choose which part of that subject to display. */
export const LEARNER_TABS = {
  lessons: [{ id: "upcoming", label: "Upcoming" }, { id: "completed", label: "Completed" }],
  homework: [{ id: "latest", label: "Latest" }, { id: "previous", label: "Previous" }],
  syllabus: [{ id: "covered", label: "Covered" }, { id: "uncovered", label: "Not yet covered" }],
} as const;
export function learnerPages(book: LearnerBookId, subjects: LearnerSubject[]): LearnerPage[] {
  return [...subjects].sort((a, b) => a.subjectName.localeCompare(b.subjectName) || a.id - b.id).map((subject, index) => ({
    id: `subject-${subject.id}`, title: `${subject.subjectName} ${book}`,
    number: String(index + 1), kind: book, subject,
  }));
}
/** Convert old subpage URLs and remembered locations into the corresponding subject and tab. */
export function learnerPageSelection(book: string | undefined, pageId: string | null, tab: string | null): { pageId: string | null; tab: LearnerTab } {
  const options = book === "homework" ? LEARNER_TABS.homework : book === "syllabus" ? LEARNER_TABS.syllabus : LEARNER_TABS.lessons;
  const previous = book ? pageId?.match(/^([a-z]+)-(\d+)$/) : null;
  const previousTab = previous ? options.find(option => option.id === previous[1]) : undefined;
  return { pageId: previousTab && previous ? `subject-${previous[2]}` : pageId, tab: options.find(option => option.id === tab)?.id ?? (!tab ? previousTab?.id : undefined) ?? options[0].id };
}
export function flattenLearnerPages(pages: LearnerPage[]): LearnerPage[] { return pages.flatMap(page => [page, ...flattenLearnerPages(page.children ?? [])]); }
export function learnerPagePath(pages: LearnerPage[], id: string): LearnerPage[] {
  for (const page of pages) { if (page.id === id) return [page]; const children = learnerPagePath(page.children ?? [], id); if (children.length) return [page, ...children]; }
  return [];
}
export const dateLabel = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date));
export const timeLabel = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }).format(new Date(date));
export const lessonLabel = (lesson: LearnerLesson) => `Lesson ${lesson.lessonNumber} - ${dateLabel(lesson.date)}`;
export const completedLessons = (subject: LearnerSubject) => subject.lessons.filter(lesson => lesson.status === "confirmed").sort((a, b) => b.lessonNumber - a.lessonNumber);
export const upcomingLesson = (subject: LearnerSubject) => subject.lessons.filter(lesson => lesson.status === "planned").sort((a, b) => b.lessonNumber - a.lessonNumber)[0];
export const homeworkHistory = (subject: LearnerSubject) => [...subject.homework].sort((a, b) => b.activityNumber - a.activityNumber);
