# Learner bookshelf and learning-goal feedback

The learner route now uses the same bookshelf shell, sticky page headings, colours and native dialogs as the principal and teacher views.

The learner's left menu has a **Sign out** button in its bottom footer. Contents and account details scroll above it, keeping the action visible on small screens. It uses the existing logout helper to clear the local session and return to sign in.

## Where to make changes

- `src/app/dashboard/learner/page.tsx`: route entry and Suspense boundary.
- `src/components/dashboard/learner-books/registry.ts`: three book definitions, subject page trees, stable URL IDs and lesson/activity selection helpers.
- `LearnerBookWorkspace.tsx` in that folder: authentication guard, loading, contents tree, breadcrumbs, previous/next navigation, page turns and shelf.
- `LearnerBookPage.tsx`: upcoming/completed lessons, homework, syllabus, detail dialogs and per-goal feedback submission.
- `learner-books.module.css`: learner content and responsive refinements. Shared shell styles remain in `principal/books/books.module.css`.
- `teacher-books/LessonFeedback.tsx`: concept ranking, goal-level counts and grouped learning goals needing attention.
- `teacher-books/ConceptRows.tsx`: review goals carried into teacher planning and confirmation.

Lessons has one numbered page per subject, such as **Physical Sciences lessons**, with **Upcoming** and **Completed** tabs beside the sticky page title. The lesson number and date head the concept list. Completed defaults to the latest confirmed lesson; **All lessons (count)**, with a downward chevron, opens the complete list for choosing another. Concepts are numbered, slightly indented and use regular-weight text. Their action buttons and supporting details align with the statement after the number; buttons wrap on narrow screens. The learner toolbar contains breadcrumbs without Refresh or Close book actions; the library icon still opens the shelf.

Homework follows the same subject-page pattern, such as **Physical Sciences homework**, with **Latest** and **Previous** tabs. The activity heading replaces the old Questions heading and viewing subtitle. Questions are numbered and use regular-weight text, with Topic info and Answer aligned under the question text. Due dates and answer-release times remain visible. Previous defaults to the most recent older activity; **All homework (count)** opens the complete activity list. Choosing its latest activity switches to Latest. Answer release is still checked by the backend.

Syllabus uses the same layout: one page per subject, such as **Physical Sciences syllabus**, with **Covered** and **Not yet covered** tabs. Covered opens by default. Each view lists the corresponding numbered concepts with chapter/topic context, prerequisites and learning-goal dialogs. No intermediate subject overview or nested syllabus pages are needed. `LEARNER_TABS` in the registry defines the tab labels and IDs for all three books.

URLs use `book`, `page`, and optionally `tab`, `lesson` or `activity`. Examples: `?book=lessons&page=subject-91&tab=completed&lesson=46`, `?book=homework&page=subject-91&tab=previous&activity=81`, and `?book=syllabus&page=subject-91&tab=uncovered`. Allocation, lesson and activity IDs are stable database identities; printed sidebar numbers change automatically when subjects change order. Old subpage links for all three books are converted to the corresponding subject page and tab, including remembered locations.

## Backend changes in Project-Edu-Revo

- `src/routes/learnerWorkspace.ts` mounts learner-only workspace, answer and goal-submission routes.
- `src/services/learnerWorkspaceService.ts` resolves the signed-in learner's active class subjects, loads history and curriculum, and gates worked answers by release policy.
- `src/services/lessonResponseService.ts` saves individual Yes/No answers against a confirmed lesson's frozen goals. Repeated clicks update the existing learner/concept row.
- `src/services/lessonGoals.ts` counts answers per goal. Missing responses and historical concept reactions do not become No answers.
- `src/services/teacherLessonFeedbackService.ts` ranks concepts by total No answers, groups unmet goals, and saves those focus goals alongside review concepts.
- `src/services/teacherWorkspaceService.ts` carries queued review goals into the next plan. Unchecking a queued concept leaves its original taught lesson untouched.
- `src/services/dashboardService.ts` supplies review focus to the existing teacher plan/confirmation UI.
- Migration `0025_learning_goal_feedback.sql` adds JSON columns to feedback, lesson-concept associations and review drafts. It preserves existing feedback.

Answers are never included in the learner workspace payload. `GET /learners/me/questions/:id/answer` rechecks membership and release time on every request. Unknown release policies or missing custom release times stay locked. Home Activity numbers follow homework creation order within the class subject.

The existing feedback window is retained: learners can update goal responses until a later lesson is planned. Earlier lessons remain selectable with their own saved answers shown read-only. Confirmed lessons retain their original guidance when shared curriculum is edited; older lessons without a snapshot freeze their guidance on the first goal response.

## Verification

Frontend:

```powershell
node scripts/test-learner-books.cjs
node scripts/test-teacher-books.cjs
node scripts/test-principal-books.cjs
npx tsc --noEmit
npm run build
```

Backend, from Project-Edu-Revo:

```powershell
# Load the backend's private environment before invoking Drizzle.
node --require dotenv/config node_modules/drizzle-kit/bin.cjs migrate
npx tsx scripts/test-learner-workspace.ts
npm run test:lesson-feedback
npm run build
```

The learner integration checks create an isolated school inside a transaction and roll all database fixtures back. They cover ownership, frozen goals, repeat answers, teacher aggregation, queued/existing-plan focus, syllabus coverage, answer release boundaries and HTTP guards.

Optional browser check: with the frontend running at port 3001 and Playwright available, run `node scripts/test-learner-browser.cjs`. `PLAYWRIGHT_MODULE` can point to an existing Playwright installation, `LEARNER_UI_URL` changes the frontend origin, and `LEARNER_SCREENSHOTS` changes the screenshot directory. It uses an isolated browser context and intercepted API fixtures. It checks modals, Yes/No saves, history URLs, answer locks, teacher review actions and mobile overflow; it does not log in to real accounts or write real feedback.
