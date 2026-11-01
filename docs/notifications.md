# Learning notifications

Teacher and learner libraries show an in-app notification menu and unread counts on the relevant book and subject headings. Alerts open the exact subject, lesson or homework activity and its matching tab. Reading the visible page marks its matching alerts as read after a short interval; content behind a navigation drawer stays unread. The menu also supports marking all alerts as read.

The backend derives alerts from authorized workspace records: missing plans for tomorrow, submitted lesson feedback, learning outcomes with No responses, published upcoming lessons, unanswered learning goals, new homework and released worked answers. Low-understanding alerts follow the feedback page's existing rule of at least one No response. Feedback alerts contain aggregate information only. Answer alerts require both the release time and a nonblank worked answer; answer contents continue to use the protected answer endpoint.

Notifications refresh every minute while the tab is visible, when focus returns, and after workspace data refreshes. Changed feed records refresh the workspace too. Read receipts are saved by school, account type and account ID, and updated feedback creates a new unread version. Notification failures have their own retry control and do not block book content or saving.

## Backend deployment

Deploy the companion changes in `Project-Edu-Revo` and run `npm run db:migrate` there before serving notifications. Migration `0029_notification_reads` adds the receipt table without changing lesson or feedback records. It has been applied to the local development database.

## Verification

- Backend: `npm run test:notifications`, `npm run test:learner-workspace`, `npm run test:dashboards`, `npm run test:lesson-feedback`, `npm run build`.
- Frontend: `node scripts/test-learner-books.cjs`, `node scripts/test-teacher-books.cjs`, `npm run lint`, `npx tsc --noEmit`, `npm run build -- --webpack`.
- Browser: `node scripts/test-notifications-browser.cjs` against the local app on port 3001; set `PLAYWRIGHT_MODULE` if Playwright is provided outside the repository. Fixtures intercept the API and exercise desktop, portrait tablet and phone layouts without changing real accounts.
