export type LessonBrief = { prerequisites: string[]; learningOutcomes: string[] };
export type BriefState = { status: "ready"; brief: LessonBrief };
