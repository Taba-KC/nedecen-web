/* Meaningful learner navigation/content checks without a database or browser. */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) { return resolve.call(this, name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : name, ...args); };
for (const extension of [".ts", ".tsx"]) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
require.extensions[".css"] = module => { module.exports = new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) }); };
const { LEARNER_BOOKS, learnerPages, flattenLearnerPages, learnerPagePath, learnerPageSelection, upcomingLesson, completedLessons, homeworkHistory } = require("../src/components/dashboard/learner-books/registry.ts");
const Page = require("../src/components/dashboard/learner-books/LearnerBookPage.tsx").default;
const concept = { id: 1, lessonConceptId: 31, name: "Resolve perpendicular vectors", chapterName: "Vectors", topicName: "Components", prerequisites: ["Identify triangle sides"], learningOutcomes: ["Can you calculate a component?"], answers: [null], taught: true };
const question = { id: 71, body: "Calculate the resultant.", conceptId: 1, conceptName: concept.name, chapterName: concept.chapterName, topicName: concept.topicName };
const subject = { id: 10, subjectId: 3, subjectName: "Physical Sciences", syllabus: [concept, { ...concept, id: 2, name: "Future concept", taught: false }], lessons: [
  { id: 20, lessonNumber: 1, date: "2026-10-10", status: "confirmed", canRespond: false, concepts: [{ ...concept, name: "Old lesson concept" }] },
  { id: 21, lessonNumber: 2, date: "2026-10-09", status: "confirmed", canRespond: true, concepts: [concept] },
  { id: 22, lessonNumber: 3, date: "2026-10-29", status: "planned", canRespond: false, concepts: [concept] },
  { id: 23, lessonNumber: 4, date: "2026-10-28", status: "planned", canRespond: false, concepts: [concept] },
], homework: [1, 2, 3].map(n => ({ id: 60 + n, activityNumber: n, lessonId: 21, dueDate: "2026-10-29T10:00:00Z", releaseAt: "2999-01-01T10:00:00Z", canReveal: false, questions: [{ ...question, body: `Activity ${n} question` }] })) };
assert.deepEqual(LEARNER_BOOKS.map(book => book.title), ["Lessons", "Homework", "Syllabus"]);
assert.equal(upcomingLesson(subject).id, 23, "Latest plan uses the saved sequence, even when lesson dates differ");
assert.equal(completedLessons(subject)[0].id, 21, "Completed defaults to the latest saved lesson number");
assert.equal(homeworkHistory(subject)[0].activityNumber, 3);
let checked = 0;
for (const book of LEARNER_BOOKS) {
  const pages = learnerPages(book.id, [subject, { ...subject, id: 11, subjectName: "English First Additional Language" }]);
  assert.deepEqual(pages.map(page => page.number), ["1", "2"]);
  assert.equal(pages[0].subject.id, 11);
  assert.equal(pages[1].title, `Physical Sciences ${book.id}`);
  assert.equal(pages[1].children, undefined, "Each subject is one page with tabs, not subpages");
  assert.equal(flattenLearnerPages(pages).length, 2);
  assert.equal(learnerPagePath(pages, pages[1].id)[0].subject.id, 10);
  for (const page of flattenLearnerPages(pages)) {
    const markup = renderToStaticMarkup(React.createElement(Page, { page, selectedId: null, navigate() {}, onSelect() {}, onSaved() {} }));
    assert.match(markup, /data-page-heading/); checked++;
    if (page.subject.id !== 10) continue;
    if (page.kind === "lessons") {
      assert.match(markup, /Lesson 4 - 28 Oct 2026/); assert.match(markup, />Info</); assert.match(markup, />Prerequisites</); assert.match(markup, />Learning goals</);
      assert.match(markup, /role="tablist"/); assert.match(markup, /role="tabpanel"/); assert.match(markup, /conceptNumber">1\./);
      assert.doesNotMatch(markup, /You are preparing for|You are reviewing|<h2>Concepts/);
      const completed = renderToStaticMarkup(React.createElement(Page, { page, tab: "completed", selectedId: null, navigate() {}, onSelect() {}, onSaved() {} }));
      assert.match(completed, /Lesson 2 - 9 Oct 2026/); assert.match(completed, />All lessons \(2\)/); assert.match(completed, /Give feedback/); assert.doesNotMatch(completed, /Old lesson concept/);
    }
    if (page.kind === "homework") {
      assert.match(markup, /Home Activity 3/); assert.match(markup, /Activity 3 question/); assert.match(markup, />Topic info</); assert.match(markup, /disabled=""[^>]*>Answer/);
      assert.match(markup, /role="tablist"/); assert.match(markup, /role="tabpanel"/); assert.match(markup, /conceptNumber">1\./);
      assert.doesNotMatch(markup, /You are viewing|<h2>Questions/);
      assert.ok(markup.indexOf("Answers unlock on") < markup.indexOf('data-question-text'));
      const previous = renderToStaticMarkup(React.createElement(Page, { page, tab: "previous", selectedId: null, navigate() {}, onSelect() {}, onSaved() {} }));
      assert.match(previous, /Activity 2 question/); assert.match(previous, />All homework \(3\)/); assert.doesNotMatch(previous, /Activity 3 question/);
      const older = renderToStaticMarkup(React.createElement(Page, { page, tab: "previous", selectedId: 61, navigate() {}, onSelect() {}, onSaved() {} }));
      assert.match(older, /Activity 1 question/); assert.doesNotMatch(older, /Activity 2 question/);
      const onlyLatest = renderToStaticMarkup(React.createElement(Page, { page: { ...page, subject: { ...page.subject, homework: [page.subject.homework[0]] } }, tab: "previous", selectedId: null, navigate() {}, onSelect() {}, onSaved() {} }));
      assert.match(onlyLatest, /No previous homework yet/); assert.match(onlyLatest, />All homework \(1\)/);
    }
    if (page.kind === "syllabus") {
      assert.match(markup, /Resolve perpendicular vectors/); assert.doesNotMatch(markup, /Future concept/); assert.match(markup, /Vectors · Components/);
      assert.match(markup, /role="tablist" aria-label="Syllabus coverage"/); assert.match(markup, />Not yet covered</);
      assert.match(markup, />Prerequisites</); assert.match(markup, />Learning goals</);
      const uncovered = renderToStaticMarkup(React.createElement(Page, { page, tab: "uncovered", selectedId: null, onSelect() {}, onSaved() {} }));
      assert.match(uncovered, /Future concept/); assert.doesNotMatch(uncovered, /Resolve perpendicular vectors/);
      const allCovered = renderToStaticMarkup(React.createElement(Page, { page: { ...page, subject: { ...page.subject, syllabus: [concept] } }, tab: "uncovered", selectedId: null, onSelect() {}, onSaved() {} }));
      assert.match(allCovered, /All current syllabus concepts have been covered/);
    }
  }
}
const pages = flattenLearnerPages(learnerPages("lessons", [subject]));
const selected = renderToStaticMarkup(React.createElement(Page, { page: pages[0], tab: "completed", selectedId: 20, navigate() {}, onSelect() {}, onSaved() {} }));
assert.match(selected, /Old lesson concept/); assert.doesNotMatch(selected, /Resolve perpendicular vectors/);
assert.deepEqual(learnerPageSelection("lessons", "completed-10", null), { pageId: "subject-10", tab: "completed" });
assert.deepEqual(learnerPageSelection("lessons", "upcoming-10", null), { pageId: "subject-10", tab: "upcoming" });
assert.deepEqual(learnerPageSelection("homework", "previous-10", null), { pageId: "subject-10", tab: "previous" });
assert.deepEqual(learnerPageSelection("homework", "latest-10", null), { pageId: "subject-10", tab: "latest" });
assert.deepEqual(learnerPageSelection("homework", "subject-10", "wrong-tab"), { pageId: "subject-10", tab: "latest" });
assert.deepEqual(learnerPageSelection("lessons", "subject-10", "wrong-tab"), { pageId: "subject-10", tab: "upcoming" });
assert.deepEqual(learnerPageSelection("syllabus", "covered-10", null), { pageId: "subject-10", tab: "covered" });
assert.deepEqual(learnerPageSelection("syllabus", "uncovered-10", null), { pageId: "subject-10", tab: "uncovered" });
assert.deepEqual(learnerPageSelection("syllabus", "subject-10", "wrong-tab"), { pageId: "subject-10", tab: "covered" });
const emptySubject = { ...subject, lessons: [], homework: [], syllabus: [] };
for (const book of LEARNER_BOOKS) for (const page of flattenLearnerPages(learnerPages(book.id, [emptySubject]))) assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(Page, { page, selectedId: null, navigate() {}, onSelect() {}, onSaved() {} })));
console.log(`Learner book checks passed: ${checked} pages, stable hierarchy, latest selection, filtered syllabus, answer lock and empty states.`);
