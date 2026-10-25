/**
 * Teacher book definitions and the class -> subject -> task page tree. The dashboard
 * response supplies assignments; teacherPages derives sidebar nodes and numbers. Add a new
 * book branch here and implement its page kind in TeacherBookPage.
 */
import type { Subject } from "../RoleDashboard";
import type { BookPage } from "@/components/principal/books/types";

export type TeacherTask = { id: string; classSubjectId: number; lessonId: number; subjectName: string; className: string; kind: string; date: string };
export type TeacherDashboard = {
  profile: { firstName: string; surname: string; title?: string | null; username: string | null; number: string; schoolName: string };
  subjects: Subject[];
  needsYou: TeacherTask[];
  comingUp: TeacherTask[];
};
export type TeacherPage = Omit<BookPage, "children"> & { subject?: Subject; subjects?: Subject[]; chapter?: Subject["curriculum"][number]; children?: TeacherPage[] };
export const TEACHER_BOOKS = [
  { id: "lessons", title: "Lessons", mark: "01", color: "#8b413d", description: "Plan lessons, confirm what you taught and review lesson feedback, organised by class and subject." },
  { id: "homework", title: "Homework", mark: "02", color: "#96713d", description: "Create questions linked to the concepts covered in taught lessons." },
  { id: "curriculum", title: "Curriculum", mark: "03", color: "#536b58", description: "Explore chapters, topics and concepts in each class subject. Coverage follows confirmed teaching." },
  { id: "announcements", title: "Announcements", mark: "04", color: "#786081", description: "School news, reminders and important updates relevant to your teaching day." },
] as const;
export type TeacherBookId = typeof TEACHER_BOOKS[number]["id"];

export const className = (subject: Subject) => /^grade\s/i.test(subject.className) ? subject.className : `Grade ${subject.className}`;
export const allocationName = (subject: Subject) => `${subject.subjectName} · ${className(subject)}`;
/**
 * Use the saved lessonNumber when available; the ID-based fallback supports older response
 * data. This is not the sidebar page number.
 */
export function lessonName(lesson: Subject["lessons"][number], subject: Subject) {
  const number = lesson.lessonNumber ?? [...subject.lessons].sort((a, b) => a.id - b.id).findIndex(item => item.id === lesson.id) + 1;
  return `Lesson ${number}`;
}
/**
 * Format a stored date for display. Formatting a label does not change the saved lesson or
 * due time.
 */
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date(value.length === 10 ? `${value}T12:00:00+02:00` : value));
}
/**
 * Get the school calendar date in South Africa, independently of the browser machine's
 * timezone.
 */
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/**
 * Group assignments by class, sort subjects, then build the selected book's children.
 * Indexes produce display numbers; record IDs produce stable page IDs.
 */
export function teacherPages(bookId: TeacherBookId, subjects: Subject[]): TeacherPage[] {
  if (bookId === "announcements") return [{ id: "under-development", title: "Still under development", number: "1", kind: "under-development" }];
  const grouped = new Map<number, Subject[]>();
  for (const subject of subjects) grouped.set(subject.classId, [...(grouped.get(subject.classId) ?? []), subject]);
  return [...grouped.values()].sort((a, b) => a[0].gradeNumber - b[0].gradeNumber || className(a[0]).localeCompare(className(b[0]), undefined, { numeric: true })).map((items, index) => {
    const number = String(index + 1);
    const ordered = [...items].sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    return { id: `class-${items[0].classId}`, title: className(items[0]), number, kind: "class", subjects: ordered,
      children: ordered.map((subject, i): TeacherPage => {
        const sub = `${number}.${i + 1}`;
        const children: TeacherPage[] = bookId === "lessons" ? [
          { id: `plan-${subject.id}`, title: "Plan the next lesson", number: `${sub}.1`, kind: "plan", subject },
          { id: `confirm-${subject.id}`, title: "Confirm taught lesson", number: `${sub}.2`, kind: "confirm", subject },
          { id: `lesson-feedback-${subject.id}`, title: "See lesson feedback", number: `${sub}.3`, kind: "lesson-feedback", subject },
        ] : bookId === "homework" ? [
          { id: `compose-${subject.id}`, title: "Create homework", number: `${sub}.1`, kind: "compose", subject },
        ] : subject.curriculum.map((chapter, j) => ({ id: `chapter-${subject.id}-${chapter.id}`, title: chapter.name, number: `${sub}.${j + 1}`, kind: "chapter", subject, chapter }));
        return { id: `subject-${subject.id}`, title: subject.subjectName, number: sub, kind: "subject", subject, children };
      }),
    };
  });
}

/**
 * Walk the nested teacher page objects to recover the breadcrumb path to one stable page ID.
 */
export function teacherPagePath(pages: TeacherPage[], pageId: string): TeacherPage[] {
  for (const page of pages) {
    if (page.id === pageId) return [page];
    const children = teacherPagePath(page.children ?? [], pageId);
    if (children.length) return [page, ...children];
  }
  return [];
}
/**
 * Flatten the tree in reading order for Previous/Next controls while retaining the same page
 * objects and IDs.
 */
export function flattenTeacherPages(pages: TeacherPage[]): TeacherPage[] {
  return pages.flatMap(page => [page, ...flattenTeacherPages(page.children ?? [])]);
}
