# Learner account review

Class managers receive an **Accounts Management** book whenever a class is assigned to them. Subject teaching assignments are not required. The book has **Claimed accounts** and **Confirmed accounts** pages and a badge counting distinct learners with outstanding requests. Opening the book does not clear the badge; reviewing the requests does.

## First activation

Learners use their school code, admission number and initials to propose credentials. Each proposal receives a private random reference. Until confirmation, those credentials can open only a waiting screen with the reference. Schoolwork, feedback and other protected endpoints remain blocked on the server.

The manager asks the learner to show their reference, selects that pending reference and confirms it. Confirmation activates those credentials and erases the username and password hashes from every other proposal for the learner. Rejected references remain as audit records with reviewer/time information, without usable credentials.

## Password recovery

**Forgot password?** opens a learner recovery form. It accepts the same school details, a username (existing or new) and a new password. The resulting password reference is also available by signing in with the proposed credentials.

The previously confirmed login continues to work during review. The proposed login can read only one lesson and one homework activity per subject: the latest available when the request was made, or the first published afterwards if none existed. These items remain fixed while review is pending. Syllabus, worked answers, feedback submissions and older API routes are blocked for that login. The manager confirms the matching reference from **Confirmed accounts** to promote the proposal and invalidate all other credentials and sessions.

## Revocation and suspension

- **Revoke claim** removes all usable credentials and sessions and makes the learner unclaimed. Learning records remain intact.
- **Temporarily deactivate** blocks access without removing credentials or schoolwork. **Resume account** permits a fresh login; old sessions do not become valid again.
- Managers may review only learners currently assigned to their own managed classes in their school. Assignment and account permissions are checked by the backend on each request.

Each learner may submit at most **two successful credential proposals per South African calendar day**, combining initial claims and password requests. Revocation does not reset the allowance. The learner row is locked during submissions/reviews so simultaneous requests cannot exceed the limit.

Existing activated learners remain confirmed. Staff activation is unchanged; this workflow covers class-managed learner accounts.

## Local verification

Backend migration: `npm run db:migrate` applies `0030_learner_account_reviews.sql` and `0031_learner_claim_login_index.sql`. Deploy the backend migrations before the updated app.

Backend checks: `npx tsx scripts/test-account-reviews.ts` runs service and HTTP assertions inside a rollback transaction.

Frontend checks: `node scripts/test-account-reviews-browser.cjs` runs mocked browser flows for desktop, tablet and mobile. Set `PLAYWRIGHT_MODULE` if Playwright is supplied outside the repository.
