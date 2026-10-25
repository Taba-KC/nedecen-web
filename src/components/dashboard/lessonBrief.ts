/**
 * Frontend types for a concept's name, prerequisites and learning outcomes. These describe
 * data displayed in lesson previews; types themselves do not fetch or save anything.
 */
export type LessonBrief = { prerequisites: string[]; learningOutcomes: string[] };
export type BriefState = { status: "ready"; brief: LessonBrief };
