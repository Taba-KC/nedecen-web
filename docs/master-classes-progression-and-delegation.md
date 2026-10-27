# Master classes, progression imports and administrative work

Implemented 27 October 2026. This describes the new workflows; the separate capabilities audit still records earlier unresolved gaps. This change does not claim that every older gap has been resolved.

## A class can use several streams

In Grades & Classes, open the class's Subjects view and choose **Manage streams**. Select the streams using this full-time class. A stream remains a complete subject combination, rather than an isolated optional subject.

The application computes the intersection of the selected streams. These are the subjects all learners share. All other subjects form the split. The class has one teaching allocation for each distinct subject, so shared subjects are not duplicated for each stream.

For example, the Agriculture and Geography streams can share six subjects. The master class then has eight distinct subject allocations: six shared, Agriculture and Geography. Assign a teacher to each allocation as usual.

If the streams differ, select the primary subject taught in the master classroom. Enter a building and classroom name for every other differing subject. These locations are required before the configuration can be saved. Learners taking a secondary subject see its attendance location in their learning workspace.

### What the learner confirms

Before learning data is loaded, a learner in a split class must select and confirm their actual subject combination. They see the common subjects, the differing subjects for each option and the secondary classroom locations. They cannot bypass this step by opening a lesson URL directly: the backend checks the selection too.

After confirmation, the learner's Lessons, Homework and Syllabus contain only the subjects in that combination. Shared subject feedback counts use the master-class roster. Optional subject counts use learners who have confirmed a combination containing that subject. Learners who have not confirmed are excluded from optional-subject counts.

A learner cannot silently switch to the other combination after confirming. In the class register, **Reset subject choice** lets authorized administrative staff require that learner to confirm again. The reset preserves lesson responses and existing learning records.

Changing a class's stream combinations, changing the subjects within an assigned stream, or starting a later class year invalidates old confirmations. A split whose classroom configuration is incomplete blocks learning access until the school repairs the configuration. Changing only classroom locations does not require learners to choose their subjects again.

### Limits of the classroom information

Buildings and classroom names are attendance instructions. They do not create a timetable, detect simultaneous periods, reserve rooms or merge the secondary subject with another class's lessons. Each subject is still taught and planned against its master-class allocation. A shared teaching group spanning several master classes would be a separate future feature.

## Importing learner registers more than once

Use the existing learner spreadsheet columns: `firstName`, `surname`, `admissionNumber`. Use plain values, with no spreadsheet formulas. The first worksheet is read, with a maximum of 500 learner rows and a 2 MB file size. Keep admission numbers as text when they contain leading zeroes.

Choose a class, the purpose of the upload, and the academic year. Upload and preview the spreadsheet. You can correct cells or remove rows. Then choose **Review changes**. The application shows counts and names for learners moving from other classes and learners being removed from this roster. **Save** is a separate action after that review.

### Update class register

- A listed admission number already in the target class keeps that learner's account and updates their name.
- A listed admission number in another class in the same school transfers that learner to the target class. The review names the source class.
- A listed learner without a current class is assigned to the target class.
- A new admission number creates a new learner record.
- Unlisted learners remain where they are.
- An update uses the target class's current academic year.

### Grade progression

- Upload the complete intended roster for the target class and select its academic year.
- Existing learners are matched within the school by admission number; username, password and account activation are retained.
- Existing learners in other classes transfer to the target class.
- New admission numbers create new accounts ready to claim.
- Learners currently in the target class but absent from the upload lose their current class assignment. Their accounts and stored learning history are retained.
- A learner without a current class sees a waiting message and cannot use another class's learning material. They can be reassigned through a later import.

This is principal-controlled progression, not automatic promotion based on marks. Learners do not carry out their own grade changes. Upload each new class roster when the school is ready.

### Starting a later academic year

Each class records its current academic year. A progression upload may retain that year or move it forward, up to 2100; it cannot move backwards. An existing learner cannot be transferred backwards from a class already in a later year.

Advancing the year creates fresh subject allocations. Earlier allocations become inactive, retaining their lessons, homework, feedback and coverage records. New allocations start with fresh lesson numbering and untaught coverage. Default teacher assignments and matching chapter assignments carry forward from the previous year, and can be changed by the school.

Class-specific custom concepts belong to their original teaching allocation; they are not automatically copied into the new year. Shared curriculum concepts remain available. Previous work is retained in the database; this change does not add a learner-facing historical-years browser.

Class membership history records transfers and year changes. Admission numbers are matched after trimming whitespace and ignoring case. Ambiguous existing records with equivalent admission numbers are rejected rather than arbitrarily choosing an account. Duplicate numbers within a spreadsheet and missing required values must be corrected before saving.

The final save runs in one transaction. It verifies a fingerprint of the reviewed rows and current school roster, so a changed register requires another review. A failed import does not partially transfer or detach learners. Empty spreadsheets cannot be used to clear a whole class.

## Delegating administrative work

The principal opens the Staff register and chooses **Assign administrative work** for a staff member. Select any of:

- Grades & Classes: manage classes, streams assigned to classes, subject teachers and class registers.
- Streams: manage the school's stream bundles and their subject memberships.
- Staff: add and import school staff records.
- Learners: manage learner registers and reviewed learner imports.
- Curriculum: browse the curriculum available through school grades and assigned streams.

These capabilities correspond to existing books and their existing features. Curriculum delegation does not grant the platform manager's shared-curriculum editing tools. Announcements is still under development and is not offered as a delegated capability.

Teaching assignments remain separate. Administrative access does not grant permission to plan lessons for an unassigned subject. Staff administration does not grant the authority to delegate more administration: only the school's actual principal can change these grants.

### Which library appears

- Teaching only: the teaching library.
- Administration only: the administration library, containing only assigned books.
- Teaching and administration: staff enter through teaching and can use **Switch to administration** / **Switch to teaching** at the bottom of the left menu.
- A principal keeps access to all principal books, and gets the teaching switch when personally assigned teaching work.
- Staff with neither assignment see a message to contact the principal, with a sign-out option.

Each work mode retains its own per-book navigation memory. Explicit sign-out clears the active location in both staff modes. A staff member may need to reopen or refocus their workspace after an assignment changes to refresh the displayed books; every backend request checks current grants, so revocation applies immediately to subsequent requests.

### Access boundaries

The server obtains the staff member's real role, school and live grants from the database. Editing a browser role label does not create administrative permission. School-scoped endpoints reject access to another school. Some assigned capabilities also allow supporting read requests—for example, Grades & Classes needs the staff list to assign teachers and the stream list to assign streams. Those supporting reads do not grant write access to the corresponding book.

## Implementation map

Frontend files are relative to `nedecen-web/`:

| Purpose | File |
| --- | --- |
| Class stream selection and secondary rooms | `src/components/principal/ClassStreamsEditor.tsx` |
| Administrative capability checkboxes | `src/components/principal/AdministrativeWorkEditor.tsx` |
| Register preview, purpose/year and impact review | `src/components/principal/RosterImportModal.tsx` |
| Class and staff commands; multi-stream curriculum browsing | `src/components/principal/books/registry.ts` |
| Filtered administrative bookshelf | `src/components/principal/books/BookWorkspace.tsx` |
| Teaching/administration access and redirects | `src/components/dashboard/StaffAccess.tsx` |
| Mode switch in the left menu | `src/components/principal/books/ResponsiveLibrary.tsx` |
| Mandatory learner subject confirmation | `src/components/dashboard/learner-books/LearnerSetup.tsx` |
| Secondary classroom attendance information | `src/components/dashboard/learner-books/LearnerBookPage.tsx` |
| Separate navigation memory for each mode | `src/lib/libraryMemory.ts` |

Backend files are relative to `Project-Edu-Revo/`:

| Purpose | File |
| --- | --- |
| New tables | `src/db/schema/schoolWorkflows.ts` |
| Class year, configuration and allocation year | `src/db/schema/classes.ts`, `classSubjects.ts` |
| Applied migration and initial membership backfill | `src/db/migrations/0026_school_workflows.sql` |
| Shared/differing subjects, learner gates, subject rosters | `src/services/classStreamService.ts` |
| Multi-stream and annual allocation synchronization | `src/services/classSubjectService.ts` |
| Import reconciliation, impact and transaction | `src/services/learnerRosterService.ts` |
| Live staff capabilities | `src/services/staffAccessService.ts` |
| Permission middleware | `src/middleware/schoolAdministration.ts` |
| Class setup, learner confirmation and reset endpoints | `src/routes/classStreams.ts` |
| Assignment reads and principal-only grant writes | `src/routes/staffAccess.ts` |
| Spreadsheet preview, review and commit routes | `src/routes/rosterImport.ts` |

Verification: `npm run test:school-workflows` in the backend runs database and mounted HTTP checks with rollback-only fixtures. Existing learner and teacher workflow suites cover regression behavior. The frontend's `scripts/test-school-workflows-browser.cjs` uses mocked API responses and checks configuration saving, import review, restricted books, mode switching, phone subject confirmation and classroom information. It writes local screenshots under `.next/school-workflows-screenshots/`.

The migration has been applied to the configured development database. Testing did not import real rosters, alter real subject selections or grant real staff permissions.
