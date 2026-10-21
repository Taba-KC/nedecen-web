/* Exercise the book model against an in-memory API; never touches school data. */
/* eslint-disable @typescript-eslint/no-require-imports -- The isolated test loader intercepts CommonJS imports to stub the API. */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : name, ...args);
};
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
}
const apiPath = require.resolve("../src/lib/api.ts");
let calls = [];
let failSubject = false;
const fixtures = {
  "/schools/7/grades": [{ id: 1, number: 8 }, { id: 2, number: 9 }],
  "/schools/7/grades/1/classes": [{ id: 11, name: "8A", gradeId: 1, learnerCount: 2, classTeacherId: 51, streamId: 21 }, { id: 12, name: "8B", gradeId: 1, learnerCount: 0 }],
  "/schools/7/grades/2/classes": [],
  "/schools/7/streams": [{ id: 21, name: "Science" }],
  "/schools/7/people": [{ id: 51, title: "Ms", firstName: "Test", surname: "Teacher", assignedChapterCount: 2, accountSetUp: true }],
  "/subjects": [{ id: 31, name: "Mathematics" }, { id: 32, name: "Science" }],
  "/schools/7/classes/11/learners": [{ id: 41, title: "Ms", firstName: "Test", surname: "Learner", admissionNumber: "L01", accountSetUp: false }],
  "/schools/7/classes/12/learners": [],
  "/schools/7/classes/11/subjects": [{ id: 61, subjectName: "Mathematics", personId: 51 }],
  "/schools/7/streams/21/subjects": [{ id: 71, subjectId: 31, subjectName: "Mathematics" }],
  "/schools/7/announcements": [],
  "/subjects/31/grades/8/chapters": [{ id: 81, name: "Numbers" }],
  "/chapters/81/concepts": [{ id: 91, name: "Fractions" }],
};
require.cache[apiPath] = { id: apiPath, filename: apiPath, loaded: true, exports: { API_BASE: "http://localhost:3000", api: {
  get: async url => { calls.push(["get", url]); assert.ok(url in fixtures, `Unexpected GET ${url}`); return structuredClone(fixtures[url]); },
  post: async (url, body) => { calls.push(["post", url, body]); if (failSubject && body.subjectId === 32) { failSubject = false; throw Error("Test network error"); } return { id: 100, ...body }; },
  patch: async (url, body) => { calls.push(["patch", url, body]); return { id: 100, ...body }; },
  delete: async url => { calls.push(["delete", url]); },
  upload: async (url, data) => { calls.push(["upload", url, data]); },
} } };

async function main() {
  const { BOOKS } = require("../src/components/principal/books/registry.ts");
  const { findPagePath, flattenPages, streamLabel } = require("../src/components/principal/books/types.ts");
  assert.equal(streamLabel(" Science "), "SCIENCE STREAM");
  assert.equal(streamLabel("Science Stream"), "SCIENCE STREAM");
  assert.equal(streamLabel("STREAM for science"), "STREAM FOR SCIENCE");
  assert.equal(streamLabel("Mainstream"), "MAINSTREAM STREAM");
  assert.equal(BOOKS.length, 6);
  assert.equal(BOOKS.some(book => book.id === "timetable"), false);
  const grades = BOOKS.find(book => book.id === "grades");
  const data = await grades.load(7);
  const pages = grades.pages(data);
  const flat = flattenPages(pages);
  assert.deepEqual(flat.map(page => [page.id, page.number]), [["grade-1", "1"], ["class-11", "1.1"], ["import-11", "1.1.1"], ["class-12", "1.2"], ["import-12", "1.2.1"], ["grade-2", "2"]]);
  assert.equal(new Set(flat.map(page => page.id)).size, flat.length);
  assert.deepEqual(findPagePath(pages, "import-11").map(page => page.id), ["grade-1", "class-11", "import-11"]);
  assert.deepEqual(findPagePath(pages, "import-11").slice(-2).map(page => page.title), ["Grade 8A", "Import learners"]);
  assert.deepEqual(findPagePath(pages, "grade-2").map(page => page.title), ["Grade 9"]);
  assert.deepEqual(findPagePath(pages, "missing"), []);
  let view = await grades.view({ schoolId: 7, data, page: pages[0], tab: "" });
  assert.equal(view.stats[1].value, 2);
  await assert.rejects(view.sections[0].actions[0].run({ label: "A", classTeacherId: "", description: "" }), /already exists/);
  assert.equal(await view.sections[0].actions[0].run({ label: "c", classTeacherId: "51", description: "New class" }), "class-100");
  assert.deepEqual(calls.at(-1), ["post", "/schools/7/grades/1/classes", { name: "8C", classTeacherId: 51, description: "New class" }]);
  view = await grades.view({ schoolId: 7, data, page: flat[1], tab: "subjects" });
  assert.equal(view.eyebrow, "SCIENCE STREAM");
  assert.equal(view.titleActions[0].label, "Edit class");
  assert.equal(view.actions.some(action => action.label === "Edit class"), false);
  assert.equal(view.actions.some(action => action.label === "Delete class"), true);
  assert.equal(view.sections[0].rows[0].detail, "Ms Test Teacher");
  const assign = view.sections[0].actions.find(action => action.label === "Assign stream");
  assert.equal(assign.fields[0].options[0].label, "SCIENCE STREAM");
  assert.deepEqual(await assign.fields[0].preview("21"), ["Mathematics"]);
  await assign.run({ streamId: "21" });
  assert.deepEqual(calls.at(-1), ["post", "/schools/7/grades/1/classes/11/stream", { streamId: 21 }]);
  view = await grades.view({ schoolId: 7, data, page: flat[1], tab: "learners" });
  assert.equal(view.sections[0].title, "Class register");
  const addLearner = view.sections[0].actions[0];
  assert.equal(view.sections[0].rows[0].title, "Test Learner", "Learner titles must not be displayed, even from an older response");
  assert.equal(addLearner.label, "Add learner");
  assert.equal(addLearner.fields.some(field => field.name === "title"), false);
  assert.equal(addLearner.fields.find(field => field.name === "classId").value, "11");
  assert.equal(view.actions.some(action => action.label === "Add learner"), false);
  assert.equal(view.links[0].pageId, "import-11");
  await addLearner.run({ firstName: "New", surname: "Learner", identifier: "L02", classId: "11" });
  assert.deepEqual(calls.at(-1), ["post", "/schools/7/learners", { firstName: "New", surname: "Learner", admissionNumber: "L02", classId: 11 }]);
  view = await grades.view({ schoolId: 7, data, page: flat[2], tab: "" });
  assert.deepEqual(view.import, { kind: "learners", classId: "11" });
  const streams = BOOKS.find(book => book.id === "streams");
  const streamData = await streams.load(7);
  assert.equal(streams.pages(streamData)[0].children[0].title, "SCIENCE STREAM");
  assert.equal(streamData.streams[0].name, "Science", "Display formatting must not change stored names");
  view = await streams.view({ schoolId: 7, data: streamData, page: streams.pages(streamData)[0], tab: "" });
  const form = new FormData(); form.append("subjects", "31"); form.append("subjects", "32");
  calls = []; failSubject = true;
  await assert.rejects(view.sections[0].actions[0].run({ name: "New stream" }, form), /retry/);
  assert.equal(await view.sections[0].actions[0].run({ name: "New stream" }, form), "stream-100");
  assert.equal(calls.filter(call => call[0] === "post" && call[1] === "/schools/7/streams").length, 1, "Retry must not create a duplicate stream");
  assert.equal(calls.filter(call => call[2]?.subjectId === 31).length, 1, "Retry must not add the same subject twice");
  for (const book of BOOKS) {
    const bookData = await book.load(7);
    const entries = flattenPages(book.pages(bookData));
    assert.equal(new Set(entries.map(page => page.id)).size, entries.length, `${book.id}: unique IDs`);
    const first = await book.view({ schoolId: 7, data: bookData, page: entries[0], tab: "" });
    assert.ok(first.description, `${book.id}: first page resolves`);
    if (book.id === "staff") {
      assert.equal(first.filterDisplay, "dropdown");
      assert.equal(first.searchable, true);
      const pending = await book.view({ schoolId: 7, data: bookData, page: entries[0], tab: "pending" });
      assert.equal(pending.sections[0].rows.length, 0);
      assert.equal(pending.searchable, true, "Search remains available even when the staff filter has no matches");
    }
  }
  console.log("Principal book checks passed: tree numbering, imports, all six books, class creation, stream preview, assignment, and safe retries.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
