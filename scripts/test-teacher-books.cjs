/**
 * Structural checks for teacher books, page ordering, leaf tasks and related helpers.
 * Fixture records model teaching assignments without requiring a teacher to click through
 * the browser.
 */
/* In-memory checks for teacher book navigation and workflow availability. */
/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript loader for local checks. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : name, ...args);
};
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
}
require.extensions[".css"] = module => { module.exports = new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) }); };
const { TEACHER_BOOKS, teacherPages, flattenTeacherPages, teacherPagePath, allocationName, dateLabel, lessonName } = require("../src/components/dashboard/teacher-books/registry.ts");
const TeacherBookPage = require("../src/components/dashboard/teacher-books/TeacherBookPage.tsx").default;
const MobileAction = require("../src/components/shared/MobileAction.tsx").default;
const HomeworkForm = require("../src/components/dashboard/HomeworkForm.tsx").default;
const HomeworkMethodFilters = require("../src/components/dashboard/HomeworkMethodFilters.tsx").default;
const ManualQuestionDialog = require("../src/components/dashboard/ManualQuestionDialog.tsx").default;
const { readManualQuestion } = require("../src/components/dashboard/manualQuestion.ts");
const HomeworkQuestionSummary = require("../src/components/dashboard/HomeworkQuestionSummary.tsx").default;
const HomeworkQuestionDialog = require("../src/components/dashboard/HomeworkQuestionDialog.tsx").default;
const ConceptRows = require("../src/components/dashboard/teacher-books/ConceptRows.tsx").default;
const TeacherSection = require("../src/components/dashboard/teacher-books/TeacherSection.tsx").default;
const { LessonFeedbackFilter, LessonFeedbackContent } = require("../src/components/dashboard/teacher-books/LessonFeedback.tsx");
const concepts = [{ id: 1, name: "Fractions" }];
const subject = {
  id: 10, subjectName: "Mathematics", className: "8A", classId: 20, gradeNumber: 8, totalConcepts: 2, taughtConcepts: 1,
  currentChapter: { name: "Numbers" }, curriculum: [{ id: 30, name: "Numbers", total: 2, taught: 1, topics: [{ id: 40, name: "Operations", concepts }] }],
  lessons: [
    { id: 50, date: "2000-01-01", status: "planned", chapterName: "Numbers", concepts, homework: [] },
    { id: 51, date: "2999-01-01", status: "planned", chapterName: "Numbers", concepts, homework: [] },
    { id: 52, date: "2000-01-01", status: "confirmed", chapterName: "Numbers", concepts, homework: [] },
    { id: 53, date: "2000-01-01", status: "confirmed", chapterName: "Numbers", concepts, homework: [{ id: 60, dueDate: "2000-01-02T12:00:00Z", questions: [{ id: 70, body: "What is one half?", conceptId: 1, memo: "One of two equal parts." }] }] },
    { id: 54, date: "2000-01-01", status: "confirmed", chapterName: "Numbers", concepts: [], homework: [] },
  ],
};
const other = { ...subject, id: 11, subjectName: "English", lessons: [] };
const higher = { ...subject, id: 12, classId: 21, className: "11B", gradeNumber: 11, lessons: [] };
const data = { profile: { firstName: "Test", surname: "Teacher", username: "teacher", number: "T01", schoolName: "Test School" }, subjects: [higher, subject, other], needsYou: [], comingUp: [] };
let destination;
const navigate = (...args) => { destination = args; };
const props = (bookId, page) => ({ bookId, page, navigate, refresh() {}, selectedLessonId: null });
const find = (element, predicate) => {
  if (!React.isValidElement(element)) return undefined;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
};
let rendered = 0;
for (const book of TEACHER_BOOKS) {
  const pages = flattenTeacherPages(teacherPages(book.id, data.subjects));
  assert.equal(new Set(pages.map(page => page.id)).size, pages.length, `${book.id}: page ids stay unique across allocations`);
  assert.equal(new Set(pages.map(page => page.number)).size, pages.length, `${book.id}: page numbers stay unique`);
  for (const page of pages) {
    const markup = renderToStaticMarkup(React.createElement(TeacherBookPage, props(book.id, page)));
    assert.ok(markup.length, `${book.id}/${page.id} renders`);
    rendered++;
  }
  const empty = teacherPages(book.id, []);
  assert.equal(empty.length, book.id === "announcements" ? 1 : 0, `${book.id}: no invented class pages`);
}
assert.equal(allocationName(subject), "Mathematics · Grade 8A");
assert.equal(allocationName(other), "English · Grade 8A");
assert.match(dateLabel("2000-01-01"), /^0?1 Jan 2000$/);
assert.deepEqual(TEACHER_BOOKS.map(book => book.title), ["Lessons", "Homework", "Curriculum", "Announcements"]);
const lessonPages = teacherPages("lessons", data.subjects);
assert.deepEqual(lessonPages.map(page => [page.title, page.number]), [["Grade 8A", "1"], ["Grade 11B", "2"]]);
assert.deepEqual(lessonPages[0].children.map(page => [page.title, page.number]), [["English", "1.1"], ["Mathematics", "1.2"]]);
assert.deepEqual(lessonPages[0].children[1].children.map(page => [page.title, page.number]), [["Plan the next lesson", "1.2.1"], ["Confirm taught lesson", "1.2.2"], ["See lesson feedback", "1.2.3"]]);
assert.deepEqual(teacherPagePath(lessonPages, "confirm-10").map(page => page.title), ["Grade 8A", "Mathematics", "Confirm taught lesson"]);
const confirmationPage = flattenTeacherPages(lessonPages).find(page => page.id === "confirm-10");
const confirmationMarkup = renderToStaticMarkup(React.createElement(TeacherBookPage, props("lessons", confirmationPage)));
assert.match(confirmationMarkup, /Confirm taught lesson/);
assert.match(confirmationMarkup, /Available on/);
const homeworkPages = teacherPages("homework", data.subjects);
assert.deepEqual(homeworkPages[0].children[1].children.map(page => page.title), ["Create homework"]);
const compose = flattenTeacherPages(homeworkPages).find(page => page.id === "compose-10");
const list = TeacherBookPage(props("homework", compose));
const create = find(list, node => node.type === MobileAction && node.props.label === "Create homework");
create.props.onClick();
assert.deepEqual(destination, ["homework", "compose-10", 52], "Only taught lessons without homework appear in the creation list");
const selectedPage = TeacherBookPage({ ...props("homework", compose), selectedLessonId: 52, homeworkMode: "ai" });
const composer = find(selectedPage, node => node.type === HomeworkForm);
assert.equal(composer.props.lessonId, 52);
assert.equal(composer.props.mode, "ai", "The title filters control the composer without navigating");
const homeworkMarkup = renderToStaticMarkup(React.createElement(HomeworkForm, { subject, lessonId: 52, mode: "manual", onSent() {} }));
assert.match(homeworkMarkup, /You are manually creating homework for:/);
assert.match(renderToStaticMarkup(React.createElement(HomeworkForm, { subject, lessonId: 52, mode: "ai", onSent() {} })), /You are automatically creating homework for:/);
assert.match(homeworkMarkup, /Lesson 3 - 0?1 Jan 2000/);
assert.match(homeworkMarkup, /Pick another lesson/);
assert.doesNotMatch(homeworkMarkup, /Confirmed lesson|<select/);
assert.equal(lessonName({ ...subject.lessons[0], lessonNumber: 41 }, subject), "Lesson 41", "Persisted lesson numbers take precedence over display order");
let viewed = false, deleted = false;
const summary = HomeworkQuestionSummary({ number: 1, concept: "Fractions", body: "What is one half?", memo: "One of two equal parts.", onView() { viewed = true; }, onDelete() { deleted = true; } });
const summaryMarkup = renderToStaticMarkup(summary);
assert.ok(summaryMarkup.indexOf('>View') < summaryMarkup.indexOf('>Delete'));
assert.match(summaryMarkup, /Based on:/);
assert.match(summaryMarkup, /Worked memo:/);
assert.doesNotMatch(summaryMarkup, /<textarea|<select/, "Questions stay compact outside the modal");
const actions = [];
function collectActions(node) {
  if (!React.isValidElement(node)) return;
  if (node.type === "button" || node.type === MobileAction) actions.push(node);
  React.Children.toArray(node.props.children).forEach(collectActions);
}
collectActions(summary);
actions[0].props.onClick(); assert.equal(viewed, true); assert.equal(deleted, false);
actions[1].props.onClick(); assert.equal(deleted, true);
const detailedBody = "A complete question. ".repeat(50);
const detailsMarkup = renderToStaticMarkup(React.createElement(HomeworkQuestionDialog, { number: 1, question: { conceptId: 1, body: detailedBody, memo: "Complete memo" }, concepts, lessonId: 52, aiAvailable: false, onSave() { throw Error("Viewing must not save edits"); }, onClose() {} }));
assert.ok(detailsMarkup.includes(detailedBody));
assert.match(detailsMarkup, /Complete memo/);
const conceptMarkup = renderToStaticMarkup(React.createElement(ConceptRows, { concepts: [{ id: 1, name: "Homework correction concept", detail: "Included automatically" }, { id: 2, name: "New concept" }], selectedIds: [1], lockedIds: [1], onToggle() {} }));
assert.equal((conceptMarkup.match(/type="checkbox"/g) ?? []).length, 2);
assert.match(conceptMarkup, /disabled=""[^>]*checked=""/);
assert.match(conceptMarkup, /View/);
const sectionMarkup = renderToStaticMarkup(React.createElement(TeacherSection, { title: "Concepts", count: 2, action: React.createElement("button", { type: "button" }, "+ Add a concept") }, "Concept rows"));
assert.ok(sectionMarkup.indexOf("Concepts</h2>") < sectionMarkup.indexOf("+ Add a concept"));
assert.equal(find(selectedPage, node => node.type === "button"), undefined, "The lesson dropdown needs no redundant back-to-list button");
let method;
const filters = HomeworkMethodFilters({ mode: "manual", onChange(value) { method = value; } });
assert.equal(filters.props.className, "tabs", "Use the principal workspace tab styling");
find(filters, node => node.type === "button" && node.props.children === "Generate automatically").props.onClick();
assert.equal(method, "ai");
const manualMarkup = renderToStaticMarkup(React.createElement(ManualQuestionDialog, { concepts, onSave() { throw Error("Rendering or opening must never save a question"); }, onClose() {} }));
assert.match(manualMarkup, /<dialog/);
assert.match(manualMarkup, /type="submit"[^>]*>Save<\/button>/);
assert.match(manualMarkup, /type="button"[^>]*>Cancel<\/button>/);
assert.equal(readManualQuestion({ conceptId: 1, body: "", memo: "Memo alone" }, concepts), null);
assert.equal(readManualQuestion({ conceptId: 1, body: " \n\t ", memo: "" }, concepts), null, "Whitespace is not a question");
assert.equal(readManualQuestion({ conceptId: 99, body: "Question", memo: "" }, concepts), null, "Question concepts must belong to the chosen lesson");
assert.deepEqual(readManualQuestion({ conceptId: 1, body: " What is one half? ", memo: " " }, concepts), { conceptId: 1, body: "What is one half?", memo: "" }, "A question with no memo can be saved");
const feedbackPage = flattenTeacherPages(lessonPages).find(page => page.id === "lesson-feedback-10");
assert.match(renderToStaticMarkup(React.createElement(TeacherBookPage, props("lessons", feedbackPage))), /Select lesson to review/);
const feedbackSets = [
  { id: 100, lessonId: 52, lessonNumber: 3, lessonDate: "2000-01-03", dueDate: "2000-01-04", chapterName: "Numbers", concepts: [{ id: 1, name: "Only the latest lesson concept", canReview: true, counts: { understood: 1, notUnderstood: 0, responses: 1, noResponse: 0 } }] },
  { id: 99, lessonId: 53, lessonNumber: 2, lessonDate: "2000-01-01", dueDate: "2000-01-02", chapterName: "Numbers", concepts: [{ id: 2, name: "Only the other lesson concept", canReview: true, counts: { understood: 0, notUnderstood: 1, responses: 1, noResponse: 0 } }] },
];
let selectedHomework;
const homeworkFilter = LessonFeedbackFilter({ lessons: feedbackSets, selectedId: 99, loading: false, failed: false, onChange(id) { selectedHomework = id; } });
const selectHomework = find(homeworkFilter, node => node.type === require("../src/components/shared/AppSelect.tsx").default);
assert.equal(selectHomework.props.value, 99);
selectHomework.props.onChange({ target: { value: "100" } });
assert.equal(selectedHomework, 100);
const selectedFeedbackMarkup = renderToStaticMarkup(React.createElement(LessonFeedbackContent, { lesson: feedbackSets[1], onSelectConcept() {} }));
assert.match(selectedFeedbackMarkup, /Only the other lesson concept/);
assert.doesNotMatch(selectedFeedbackMarkup, /Only the latest lesson concept|<details|<summary/);
assert.match(selectedFeedbackMarkup, /No learning goal feedback yet/);
const goalFeedback = { ...feedbackSets[1], concepts: [{ ...feedbackSets[1].concepts[0], noCount: 2, learningGoals: [{ goalIndex: 0, goal: "Can you identify a numerator?", yes: 1, no: 2, responses: 3, noResponse: 1 }] }] };
const goalMarkup = renderToStaticMarkup(React.createElement(LessonFeedbackContent, { lesson: goalFeedback, onSelectConcept() {} }));
assert.match(goalMarkup, /2 No responses/);
assert.match(goalMarkup, /Learning goals mostly not met/);
assert.match(goalMarkup, /Can you identify a numerator/);
assert.match(goalMarkup, /2 of 3 responding learners marked No/);
assert.match(goalMarkup, /Add related concept to next lesson/);
const emptyHomeworkFilter = renderToStaticMarkup(React.createElement(LessonFeedbackFilter, { lessons: [], loading: false, failed: false, onChange() {} }));
assert.match(emptyHomeworkFilter, /disabled=""/);
assert.match(emptyHomeworkFilter, /No confirmed lessons yet/);
const announcement = teacherPages("announcements", data.subjects);
assert.equal(announcement.length, 1);
assert.equal(announcement[0].title, "Still under development");
assert.doesNotMatch(renderToStaticMarkup(React.createElement(TeacherBookPage, props("announcements", announcement[0]))), /<button|<input|<form/);
console.log(`Teacher book checks passed: ${rendered} pages, class/subject hierarchy, confirmation, homework eligibility, feedback, and development page.`);

const LessonBriefDialog = require("../src/components/dashboard/LessonBriefDialog.tsx").default;
const guidanceMarkup = renderToStaticMarkup(React.createElement(LessonBriefDialog, { name: "Direction of a resultant", state: {status:"ready",brief:{prerequisites:["Be able to identify opposite and adjacent sides."],learningOutcomes:["Can you calculate a reference angle?"]}}, onClose() {} }));
assert.match(guidanceMarkup,/Be able to identify opposite and adjacent sides/);
assert.match(guidanceMarkup,/Can you calculate a reference angle/);
assert.doesNotMatch(guidanceMarkup,/Regenerate|Retry generation|Write manually|Edit brief/);
