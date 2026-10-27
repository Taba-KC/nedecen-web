# NEDECEN: current user capabilities, business rules, and edge cases

**Code review date: 26 October 2026**  
**Scope: what happens after a user has signed in.**

This document describes the implementation currently present in the frontend and backend repositories. It explains what each user can do, what information they provide, what happens to the information, and what restrictions exist. It deliberately excludes visual design, navigation instructions, login, and account activation procedures.

This is a description of the current code, not a specification of everything the finished product ought to do. It does not certify that the running database has every migration applied. No production records were changed to prepare this document, and the suspected gaps below were not tested against real users' records.

## Reading the status labels

| Label | Meaning |
| --- | --- |
| **Available** | The current application exposes this activity and the backend supports it. |
| **Enforced** | A server-side rule or database constraint checks the restriction in the relevant workflow. |
| **Application check** | The frontend checks it; that alone does not guarantee that a direct backend request is rejected. |
| **Backend only / legacy** | Code exposes an operation, but it is not an ordinary activity in the current application. |
| **Gap** | A missing or inconsistent restriction identified by reading the code. |
| **Inferred risk** | The code suggests a failure or unwanted outcome, but this review did not reproduce it against a database. |

Where this document says that a rule is enforced, the statement applies to the named workflow. Some older operations bypass the stronger rules of newer operations. Section 9 makes these exceptions explicit.

## Contents

1. [The information the app works with](#1-the-information-the-app-works-with)
2. [User types and responsibility boundaries](#2-user-types-and-responsibility-boundaries)
3. [Principal](#3-principal)
4. [Teacher](#4-teacher)
5. [Learner](#5-learner)
6. [Curriculum manager](#6-curriculum-manager)
7. [Developer role and older backend operations](#7-developer-role-and-older-backend-operations)
8. [Rules that connect the different users](#8-rules-that-connect-the-different-users)
9. [Gaps, surprising behavior, and cases that need decisions](#9-gaps-surprising-behavior-and-cases-that-need-decisions)
10. [Concrete edge-case checklist](#10-concrete-edge-case-checklist)
11. [Implementation sources](#11-implementation-sources)

## 1. The information the app works with

### 1.1 School structure

- A **school** contains grades, classes, staff, and learners.
- A **grade** is one of Grades 8, 9, 10, 11, or 12 belonging to that school.
- A **class** is a group within a grade, such as Grade 11B.
- A **class manager** is a staff member associated with a class. This is separate from a teacher's subject assignment.
- A **subject** is a shared platform catalogue entry, such as Mathematics.
- A **stream** is a school-owned collection of subjects. Assigning a stream to a class determines that class's active subjects.
- A **class subject** means one subject taught in one particular class. Grade 11B Mathematics and Grade 11C Mathematics are separate teaching allocations, even though they use the same subject.

### 1.2 Curriculum

A shared curriculum belongs to a **subject and grade**, not to one school or one class. For example, Grade 11 Physical Sciences has shared chapters, topics, and concepts.

The relationship is:

> Subject and grade → chapter → topic → concept.

Each shared concept can also have:

- Up to five prerequisite skills: what a learner needs before learning the concept.
- Up to five learning outcomes or learning goals: what the learner should be able to do after learning it.

**Learning outcomes** and **learning goals** refer to the same underlying information in this document.

A teacher can add a **custom concept** for a particular class subject. It is additional class-specific content, not a new shared curriculum concept for every school.

### 1.3 Lessons, homework, and feedback

- A **planned lesson** records a date and selected concepts. It does not mean those concepts have been taught.
- A **confirmed lesson** records the subset of planned concepts that the teacher says was actually taught.
- A **lesson number** is assigned when the lesson is created, within its class subject. It is independent of the lesson date.
- A **home activity** is a homework set attached to one confirmed lesson. It contains questions, their concept links, optional worked answers, a due time, and an answer-release policy.
- **Lesson feedback** is a learner's Yes or No response to each learning goal of a concept in a particular confirmed lesson.
- A **review suggestion** is a concept the teacher has chosen to revisit, with learning goals that need attention.

Homework feedback is not a current user activity. Learners do not currently submit understanding ratings for homework questions.

## 2. User types and responsibility boundaries

There are four active application user types:

| Activity | Principal | Teacher | Learner | Curriculum manager |
| --- | --- | --- | --- | --- |
| Manage school classes and streams | Yes | No | No | No |
| Add staff and learner roster records | Yes | No | No | No |
| Assign subject teachers | Yes | No | No | No |
| Inspect school curriculum and class coverage | Yes | Own teaching allocation | Own subjects and coverage | Shared curriculum records |
| Plan and confirm lessons | Teaching backend permits it only for the principal's own teaching assignments; the principal's ordinary workflow is administration | Yes, within assignment | No | No |
| Prepare and send homework | Same assignment restriction as above | Yes, within assignment | No | No |
| Answer learning-goal feedback | No | No | Own eligible lessons | No |
| Read released homework answers | Not a learner activity | Own teaching records contain memos | Own class's homework | No |
| Edit shared curriculum | Not offered by the current principal workflow; older backend exceptions exist | No | No | Yes, across schools for a subject and grade |
| Add class-specific custom concepts | Only through authorized teaching backend operations | Yes | No | Not through the shared curriculum editor |

The backend also recognizes a **developer** staff role for an older curriculum-import operation. That is described separately in Section 7; it is not a fifth complete application workflow.

Being a class manager does not automatically make someone the subject teacher. Being a principal does not automatically grant teaching ownership of every class's lessons in the current teacher services.

## 3. Principal

### 3.1 Work with the school's fixed grades

**Available:** inspect Grades 8–12 and their classes.

The school receives that fixed set of grades. A principal manages classes inside those grades rather than creating arbitrary grade numbers.

**Enforced:**

- Custom grade creation is rejected by the grade endpoint.
- Grade deletion is rejected.
- Database migration rules protect the fixed grade set against ordinary deletion or renumbering.
- A principal's grade-management requests must refer to their own school.
- A class operation naming a grade must use a grade belonging to that school.

**Example:** the principal can create Grade 9C, but cannot create Grade 13 or remove Grade 8 merely because it has no classes.

### 3.2 Create a class

The principal provides a class label in an existing grade. They may also specify a class manager and a description. A class can exist before a stream or subject teacher has been assigned.

The app forms a canonical class name from the grade and the letter identifier. It trims surrounding space, removes the grade prefix when present, removes internal spaces in the identifier, and uppercases the identifier.

**Server normalization examples:** within Grade 11, `b`, `11b`, and `Grade 11 B` resolve to `11B` when supplied directly as the class name. In the ordinary application activity, the principal supplies just the letter label, such as `B`, because that activity adds the grade prefix itself. Supplying the full grade-prefixed name as the letter label can therefore be rejected rather than normalized as intended.

**Enforced:**

- The remaining class identifier must contain letters A–Z only.
- Empty identifiers, digits in the identifier, punctuation, and hyphens are rejected.
- Two classes in the **same grade record** cannot have the same canonical name.
- The database also enforces this uniqueness, including simultaneous requests.
- A class description is optional and limited to 200 characters.
- If a stream is supplied, it must belong to the class's school.

**Scope clarification:** “two classes cannot have the same label” is not a platform-wide rule. Grade 8A and Grade 9A are valid. Two different schools can each have Grade 11B. Two Grade 11B records within the same school's Grade 11 are not valid.

**Not enforced:** there is no class-size limit, no maximum number of classes per grade, and no rule limiting a staff member to managing one class. The class-manager assignment has a school-validation gap described in Section 9.

### 3.3 Change class details

The principal can rename the class, change or clear its manager, and change its description.

Renaming changes the class's name rather than creating another class. Its learner and teaching records continue to refer to the same class.

**Enforced:** the same label normalization, uniqueness, and description limits apply to edits. Renaming a class to its own existing canonical name is permitted.

There is no current ordinary workflow to move an existing class into a different grade. Class renaming is not a learner-promotion operation.

### 3.4 Assign or change a class stream

The principal selects a stream belonging to the school and assigns it to the class.

The app then synchronizes the class's subjects with that stream:

1. Subjects present in the stream become active class subjects.
2. Missing class-subject records are created.
3. Previously existing class-subject records for those subjects are reused where possible.
4. Subjects no longer in the stream become inactive rather than having their teaching history deleted.
5. Relevant active shared curriculum chapters are associated with the class subjects.

**Consequences:**

- Learners do not choose subjects individually. Their current subjects come from their class's active subject allocations.
- A class can have only one current stream reference.
- Changing stream can remove a subject from the class's current activities without deleting its stored lessons and homework.
- Restoring the same subject can reactivate the existing allocation, including its retained history and assignment information.
- New class subjects initially have no subject teacher unless one is subsequently assigned.

**Enforced:** the class and stream must belong to the same school. Synchronization is transactional and serialized with related setup changes.

### 3.5 Create, rename, and delete school streams

The principal can:

- Create a named stream with zero or more subjects from the shared subject catalogue.
- Add another subject to an existing stream.
- Remove a subject from a stream.
- Rename a stream.
- Delete a stream.

The same stream can be used by more than one class. Editing its subject membership updates all classes currently using it.

**Enforced:** a subject cannot appear twice in the same stream. The database prevents duplicate stream/subject pairs.

**Allowed:** the same subject can belong to several different streams.

Deleting a stream clears its reference from affected classes and makes their previously provided subject allocations inactive. It does not intentionally delete those classes or their saved teaching histories.

**Important partial-save behavior:** creating a stream and adding its selected subjects involves several requests. The stream may already exist when a later subject addition fails. The app reports that partial result, and retrying the same in-progress creation attempts the remaining additions rather than deliberately creating a second stream.

**Gaps:** duplicate stream names and names consisting only of spaces are not consistently prevented by the backend. There is no automatic system-stream template catalogue yet.

### 3.6 Assign the teacher for a class subject

The principal can assign one teacher to an active subject in a particular class, replace that teacher, or clear the default assignment.

**Enforced:**

- The class must belong to the principal's school.
- The class subject must be active and belong to that class.
- The selected person must belong to the same school.
- The person's stored role must be teacher or principal.

The assignment updates the class subject's default teacher. Chapter assignments that were following the previous default are updated too. Explicitly different chapter assignments are preserved.

**Allowed:**

- One teacher can teach several subjects in one class.
- One teacher can teach the same subject in several classes.
- A principal can be assigned as a teacher.
- A person can be selected before completing account setup; teaching services still require a usable account when that person later performs teaching work.

**Not implemented:** workload balancing, timetable-conflict detection, qualification checks, subject specialization requirements, and teaching-load limits.

Clearing the default teacher does not necessarily clear an explicit chapter assignment to someone else.

### 3.7 Add and inspect staff records

The principal can register a staff member by providing title, first name, surname, and staff number.

The current creation flow registers teaching staff; it is not a general role-management operation. Sending an extra role in this request does not create a platform administrator through the normal staff-creation schema.

The principal can inspect the school roster, names, staff numbers, account-setup status, and assignment counts. They can identify staff with or without assigned chapters.

**Enforced:** the database prevents the exact same staff number from appearing twice within one school. The same number can exist in another school.

**Limitations:**

- Individual creation and spreadsheet import do not apply identical identifier normalization; see Section 9.
- The current principal application does not offer staff record editing, individual removal, role promotion, password administration, or staff transfer.
- “Teaching assigned” is currently based on assigned **chapter** counts, not every possible indication of teaching responsibility. A subject allocation with no curriculum chapters can therefore produce a surprising classification.

### 3.8 Add and inspect learner records

The principal supplies first name, surname, admission number, and the class the learner belongs to.

The learner becomes part of that class's roster and receives that class's active subjects. Adding a learner does not create a separate personalized subject-enrollment list.

The principal can inspect learners across the school or within a class, including their admission numbers, class membership, and account-setup status.

**Enforced:**

- A learner record references one class.
- The database prevents the exact same admission number from being repeated within the same school.
- Another school can use the same admission number.

**Limitations:** the normal application does not currently provide individual learner editing, removal, class transfer, annual promotion, individual subject exceptions, or guardian management. The older individual-add endpoint does not fully check school/class consistency; bulk import is stricter.

### 3.9 Import staff or learners in bulk

The principal provides a spreadsheet, reviews the proposed records, corrects or removes problematic rows, then explicitly commits the records.

- Staff rows require `title`, `firstName`, `surname`, and `staffNumber`.
- Learner rows require `firstName`, `surname`, and `admissionNumber`.
- A learner import targets one selected class.

**Enforced in the current import flow:**

- Only the principal's school can be targeted.
- The learner target class must belong to that school.
- The upload must be one `.xlsx`, `.xls`, or `.csv` file, at most 2 MB.
- The first worksheet is used.
- Required column headings must appear exactly once with the required spelling.
- The parser permits at most 500 data rows and 31 columns.
- Spreadsheet formulas are rejected; plain values are required.
- Required values cannot be blank after trimming.
- Individual text fields are limited to 200 characters.
- Repeated numbers within the proposed batch are identified.
- Numbers already registered in the school are identified.
- Duplicate comparisons in this import are case-insensitive and ignore surrounding whitespace.
- The server repeats the checks at commit time. Passing preview is not a guarantee that the records are still available later.
- A batch containing invalid rows is rejected as a whole. It does not intentionally save only the valid rows.
- Commits use a transaction and a school-level lock to reduce conflicts between concurrent imports.
- The older direct-upload operation is rejected instead of bypassing review.

**Examples:** importing admission number `A001` when `a001` exists is rejected by this flow. Importing the same learner twice into different classes in the same school is also rejected by the school-wide admission-number check.

If a spreadsheet has already lost leading zeros by storing an identifier as an ordinary number, the app cannot reconstruct the intended number.

### 3.10 Inspect curriculum and class coverage

The principal can inspect shared curriculum chapters and concepts relevant to school subjects. Relevant subjects are derived from streams assigned to classes in the grade.

For a particular class subject, the principal can inspect shared chapters, topics, concepts, prerequisites, learning outcomes, and coverage.

**Coverage means:** the number of distinct current shared curriculum concepts included in confirmed lessons for that class subject, compared with the number of current shared concepts in its curriculum.

**Enforced calculation rules:**

- Planning alone does not increase coverage.
- Teaching the same concept in several lessons does not count it several times.
- Teaching the concept in another class does not increase this class's coverage.
- Class-specific custom concepts are excluded from this shared-curriculum coverage denominator.
- Current coverage does not count retired concepts as active shared curriculum.
- Empty shared curricula produce zero coverage rather than division by zero.

This is a record of teacher-confirmed teaching, not evidence that every learner understands the material.

**Current limitation:** the general principal curriculum listing uses an older concept-list operation that can include custom concepts without class filtering. The class-specific coverage operation is more carefully scoped. See Section 9.

### 3.11 Delete a class

The principal can request deletion of a class belonging to the named grade and their school.

The operation is intended to remove the class and its dependent school activity: learners, their relevant feedback and stored renewal credentials, class subjects, chapter assignments, lessons, homework, questions, and class-targeted announcements.

It is a **destructive operation**, not an archive or a move to another grade. There is no user-facing recycle-bin or restore operation.

**Enforced:** the deletion is transactional. A database failure rolls back its preceding deletions instead of intentionally leaving half the class removed.

**Inferred risk:** cleanup does not explicitly remove custom concepts that refer to a class subject. Their foreign key can block deletion. That case should not be described as fully handled; Section 9 explains it.

### 3.12 Activities not currently available to the principal

- Publishing announcements through the current application: this remains an unfinished feature, despite older backend announcement operations.
- Editing shared curriculum through the current principal workflow.
- Creating system stream templates.
- Managing timetables, attendance, assessments, grades, report cards, or fees.
- Editing or deleting individual staff or learner roster records through the current application.
- Promoting learners to the next grade or closing out an academic year.

## 4. Teacher

### 4.1 Work only within teaching assignments

The teacher receives the active class subjects for which they are the default teacher or have an applicable chapter assignment.

Planning and teaching services check the person's current stored role, school, usable account record, active class subject, subject and grade curriculum, and chapter ownership.

**Enforced:** knowing another class-subject number or lesson number is not sufficient to plan, confirm, send homework, or request current feedback for it through the current teaching services.

Chapter-specific assignments can override the class subject's default teacher. Another teacher's chapter is not automatically available merely because the caller teaches some other chapter of the same subject.

**Important boundary:** authorization of an existing lesson primarily follows that lesson's primary chapter. A cross-chapter lesson is not separately authorized against every linked concept on every subsequent read or write. This deserves additional review when assignments are split or changed.

### 4.2 Prepare a lesson

The teacher chooses a lesson date and the concepts to cover.

The offered ordinary concepts are the first **ten untaught concepts**, in curriculum order, across the teacher's assigned chapters. Previously taught concepts are excluded from the ordinary choices.

Concepts explicitly added from lesson feedback are included in addition to those ten. They begin selected, but the teacher may deselect them.

The teacher can inspect the shared prerequisites and learning outcomes for each concept. That inspection does not generate new guidance, alter the shared curriculum, or automatically add prerequisite concepts to the lesson.

When the teacher saves:

1. The server checks teaching ownership again.
2. It recomputes which concepts are currently eligible, rather than trusting the previously displayed choices.
3. It stores the selected concepts and any accepted custom concepts as one planned lesson.
4. It assigns a permanent lesson number within this class subject.
5. It consumes the review suggestions that this planning request reviewed.

**Enforced:**

- At least one ordinary/review concept or custom concept is required.
- A selected concept cannot be repeated within the same plan.
- A previously taught concept cannot be submitted as an ordinary new concept unless it is currently an eligible queued review.
- A concept outside the permitted ten/review set is rejected, even if it was eligible when the teacher first loaded the data.
- Total selected and custom concepts cannot exceed 120.
- The current request schema permits at most 20 newly supplied custom concepts.
- The current date field must be a real calendar date in the required date format.
- Related writes are committed together.

**Allowed, and worth understanding:**

- A lesson may cross chapter boundaries.
- Several lessons may have the same date.
- More than one unconfirmed lesson may exist for the same class subject.
- A lesson can be dated in the past; the current planning rule does not prohibit it.
- The same still-untaught concept can appear in more than one unconfirmed plan. “Already planned” is not treated as “already taught.”
- There is no check against a school calendar, weekends, holidays, or a timetable.

### 4.3 Add a custom concept while preparing a lesson

The teacher supplies a concept statement, chooses an assigned chapter, and chooses a topic belonging to that chapter.

Changing the chosen chapter replaces the permitted topic set. Editing a staged custom concept restores its chapter and topic. A chapter without topics cannot accept a new custom concept through this workflow.

Accepting the custom-concept draft does not itself insert a database record. The new concept is persisted when the entire lesson plan is saved.

**Enforced:**

- The concept statement must be nonblank after trimming and at most 500 characters.
- The selected topic must belong to an active chapter the teacher currently owns for the allocation.
- The server determines the chapter from that authorized topic; it does not accept an arbitrary browser-supplied chapter association.
- The database also requires the topic and chapter association to match.
- The concept is scoped to the particular class subject.
- Newly created custom concepts do not become part of the shared curriculum used by other classes.

The teacher can edit or remove a custom concept while it is still part of the unsaved planning draft.

**Current limitations:** duplicate custom concept names are not prevented. The creation workflow does not accept prerequisites or learning goals for custom concepts; they start with empty guidance. There is no ordinary workflow to edit a persisted custom concept or enrich its guidance afterward.

### 4.4 Understand lesson numbering

The first saved lesson for a class subject is Lesson 1, the next is Lesson 2, and so on.

**Enforced:** the database assigns the number when inserting the lesson and makes the class-subject/lesson-number pair unique.

Changing the lesson date does not determine its number. A new lesson with an earlier date still receives the next number. Another class subject has its own sequence beginning at 1.

The current application does not offer an ordinary saved-lesson editing, deletion, cancellation, or renumbering activity.

### 4.5 Confirm what was taught

After teaching, the teacher identifies which concepts from the saved plan were actually covered. They may exclude concepts that were not reached.

The server then:

1. Locks and verifies the lesson.
2. Checks that it is still planned.
3. Checks that its lesson date has arrived according to the South African school date.
4. Verifies that every supplied concept belongs to that saved plan.
5. Removes the omitted concept associations from this lesson.
6. Freezes the retained concepts' names, prerequisites, and learning outcomes for this confirmed lesson.
7. Marks the lesson confirmed.

**Enforced:**

- A future-dated lesson cannot be confirmed early.
- An already confirmed lesson cannot be confirmed again.
- A concept outside the original plan cannot be injected during confirmation.
- Duplicate concept selections are rejected.
- Confirmation updates the existing lesson rather than creating another lesson number.

**Allowed:** all concepts may be excluded, producing a confirmed lesson with zero retained concepts. That lesson cannot produce valid homework because there are no confirmed concepts to test.

An omitted concept that has never been taught remains eligible as untaught. Omitting a review concept does **not** erase its taught status in an older confirmed lesson.

**Historical detail:** the frozen information is concept name and guidance. Chapter and topic names and some ordering relationships are still read from the current curriculum records; not every aspect of historical context is frozen.

### 4.6 Review learning-goal feedback

The teacher can review up to the ten most recently numbered confirmed lessons available to their current teaching assignment.

For each lesson concept they receive:

- Its recorded learning goals.
- The number of Yes responses for each goal.
- The number of No responses for each goal.
- The number of learners who have not answered that goal.
- An indication of whether the concept is still eligible to be added to a later lesson.

Concepts are ordered primarily by the **total number of No answers across their learning goals**, highest first. A tie uses a concept-understanding score, with unanswered concepts handled separately. The summary of unmet goals lists goals with at least one No, grouped under their concept.

**Example:** Concept A has four goals and receives ten No answers in total. Concept B has one goal and receives six No answers. A ranks ahead of B, even if B's percentage of No responses is higher. The ordering is not a percentage-normalized ranking.

**Enforced calculation rules:**

- Only responses from learners currently in that class's roster are included.
- The teacher receives aggregates, not a named learner-by-learner breakdown.
- An unanswered goal is not silently counted as No.
- A learner contributes at most one current answer to a given goal in that lesson concept.
- Goal text and index must match the goals attached to that lesson; stale answers for different goal text are not counted against a replacement goal.

“Anonymous to the teacher” does not mean unidentifiable storage. The database links responses to learners so their own answer can be updated and deduplicated.

**Current consequence:** a learner changing classes can change the totals for historical lesson feedback, because the roster is evaluated when feedback is read rather than frozen when the lesson was taught.

### 4.7 Add a concept to a later lesson for review

The teacher chooses a concept from a confirmed lesson to revisit. The app also gathers that concept's learning goals with at least one No response, providing a focus for the review.

If a suitable planned lesson already exists, the app adds the concept there. Otherwise, it saves a queued suggestion for the teacher's next planning activity.

**Selection of an existing plan:** it must belong to the same class subject, be within the teacher's current chapter ownership, be planned, and have a date today or later. The earliest date is chosen, with the record number breaking ties.

**Enforced:**

- The source lesson must be confirmed.
- The concept must actually belong to that source lesson.
- It must still be active and available in the teacher's allocation.
- The concept cannot be inserted twice into the same destination lesson.
- Repeating the request merges distinct review-focus goals rather than creating duplicate concept associations.
- A planned lesson cannot grow beyond 120 concepts.
- A queued review draft cannot contain more than 100 distinct review concepts for the teacher and class subject.
- At most five distinct review-focus goal texts are retained per concept.
- A successful addition to an existing plan removes a duplicate queued suggestion for that teacher and concept.

**Allowed:** the server does not require a minimum No count before adding a concept. An authorized teacher can request a review even when there are no No responses; its review-focus list may be empty.

When the teacher later creates a lesson from queued suggestions, accepted and declined suggestions that were reviewed by that request are consumed. A declined review does not keep appearing indefinitely simply because it was once queued. Suggestions added separately after the planning data was loaded are intended to remain queued.

There is no general saved-plan editing activity for removing a concept that was directly added to an already saved plan. The teacher can still exclude it when confirming what was taught.

### 4.8 Prepare homework manually

The teacher chooses a confirmed lesson that has at least one taught concept and does not already have homework.

For each question, the teacher provides:

- One concept from that confirmed lesson.
- A nonblank question.
- An optional worked memo.

They can add questions, inspect and edit draft questions, change a question's concept to another confirmed concept of the same lesson, or remove draft questions.

Accepting a question saves it into the current unsent homework draft. It does not send the question to learners or persist an incomplete homework set.

**Enforced:**

- Blank and whitespace-only questions are rejected.
- Questions cannot be linked to concepts not confirmed in the selected lesson.
- Question text is limited to 12,000 characters.
- A memo is limited to 24,000 characters.
- The final homework request must contain between 1 and 50 questions.

**Allowed:** several questions can test the same concept. A memo may be absent. Identical question text can be repeated. The teacher can mix manually written and generated questions in one draft.

**Important gap:** there is no final rule requiring every taught concept to receive at least one question. Linking questions to valid concepts is enforced; full coverage of all lesson concepts is not.

### 4.9 Generate questions and worked memos with AI

When generation is configured on the server, the teacher specifies how many questions to generate for each confirmed concept.

The app requests questions and worked memos, validates the returned structure and concept counts, and adds accepted results to the unsent draft for teacher review.

**Enforced:**

- At most 10 questions per concept in one generation request.
- Between 1 and 30 questions in one generation request.
- Counts must be whole numbers and cannot be negative.
- A concept cannot be repeated as a separate count entry in the same request.
- Only concepts from the authorized confirmed lesson may be requested.
- The generated response must contain exactly the requested numbers for the requested concepts.
- Generated questions and memos must satisfy their text and nonblank limits.
- An incomplete, malformed, unavailable, or timed-out generation request reports a failure rather than deliberately appending a partial response.
- A lesson that already has homework cannot receive a new generated homework draft through the current generation endpoint.
- The current backend limits AI operations to 40 attempts per account per server-hour bucket and one in-progress AI operation per account, within that running server process.

The application normally prevents a generation request that would take the local draft over 50 questions. The final send request independently enforces the 50-question maximum.

Generation itself does not publish homework. No learner name or school identity is deliberately included in the generation payload; the supplied information includes grade, educational labels, questions, and correction notes as applicable.

**Limitations:** mathematical correctness, pedagogical quality, plagiarism, and suitability are not automatically proven by passing structural validation. The teacher still needs to review the result. The usage limiter is not shared between multiple server instances and resets when its process restarts.

### 4.10 Correct or generate a worked memo

While editing an unsent question, the teacher can write a memo directly or request a proposed AI memo using a correction note. The teacher can accept the proposal, ask for another proposal, or discard it.

Accepting a proposal changes the question's unsaved memo; it still requires accepting the edited question and eventually sending the homework to persist it.

**Enforced:**

- The question and correction note must be nonblank for a generation request.
- A correction note is limited to 2,000 characters.
- The question must relate to a confirmed concept from the authorized lesson.
- A pending proposal must be accepted or discarded before the current question edit is accepted.
- Rejecting a proposal does not overwrite the previous memo.

There is also a backend-only operation for updating the memo of an already saved question. It checks teaching ownership and the memo's length. The current teacher application does not expose a complete sent-homework editing activity. That backend update does not keep a memo revision history or send a learner notification.

### 4.11 Set homework timing and send it

The teacher chooses a future due date and time, and one of these answer-release policies:

1. Release answers immediately when the homework is created.
2. Release answers at the due date and time.
3. Release answers at a specific custom time.

When the teacher sends the homework, the server saves the complete set and its questions together.

**Enforced:**

- The source lesson must still be confirmed and authorized.
- The lesson may have only one homework set. This is also a database uniqueness rule.
- The due time must be valid and later than the server's current time.
- A custom release policy must supply a valid time.
- Every question is rechecked against that lesson's confirmed concepts.
- Empty sets and empty question text are rejected.
- Sending is transactional: failure does not intentionally expose a partially saved set.
- Concurrent sends for one lesson are serialized; a second completed submission finds that homework already exists.
- Older operations that created an empty set first or appended questions afterward are explicitly disabled.

**Allowed:** a custom release time can be before the due time or already in the past. There is currently no rule requiring it to be in the future or after the homework deadline.

**Not currently available:** homework resubmission, teacher grading, learner file uploads, automatic marks, lateness penalties, or a normal edit/delete/reschedule operation for a sent homework set.

### 4.12 Read curriculum and understand draft persistence

The teacher can read shared curriculum for their assigned chapters and inspect class-specific teaching progress. They cannot edit the shared source through the teaching workflow.

Lesson planning choices, new custom concepts, and unsent homework questions are generally browser-memory drafts. Changing homework-writing method for the same lesson retains the question draft. Choosing a different lesson intentionally starts a different composer.

**Not provided:** durable server draft saving, cross-device draft synchronization, offline submission, or a guarantee that reloading/leaving the activity preserves unsaved content.

Teacher announcements remain unfinished. There is no current teacher announcement publishing activity.

## 5. Learner

### 5.1 Read learning information for the current class

The learner receives subjects from their current class's active subject allocations. They can read lessons, homework, and syllabus information for those subjects.

**Enforced in the current learner workspace and answer/goal services:**

- The learner record, class, and school must agree with the signed-in account's scope.
- Another class's question cannot be opened simply by changing its number in a request.
- Another class's lesson cannot receive feedback from this learner through the current goal-feedback service.
- Inactive class subjects are excluded.
- Other classes' custom concepts are excluded.
- The learner receives their own saved goal answers, not classmates' individual answers.

The learner cannot assign their own subjects, change class, edit curriculum, create or confirm lessons, create homework, or change answer release times.

### 5.2 Prepare for an upcoming lesson

The learner can read the concepts in the latest saved lesson that is still planned, along with the concept's chapter/topic context, prerequisites, and learning goals.

**Exact current meaning of “upcoming”:** the application chooses the planned lesson with the highest lesson number. It does not choose the nearest future lesson by date and does not exclude overdue unconfirmed plans on that basis alone.

If no plan exists, there is no upcoming lesson to read. The app does not invent concepts or generate a lesson for the learner.

Reading prerequisites is informational. Learners are not required to pass a prerequisite test, and prerequisites are not automatically scheduled as lessons.

### 5.3 Revisit completed lessons

The learner can read confirmed lessons for the active class subject, select a different completed lesson, and inspect its retained taught concepts.

The default completed lesson is the one with the highest lesson number, not necessarily the most recent calendar date.

Omitted concepts from the teacher's confirmation are not part of that lesson's completed content. Retaught concepts can appear again in a later completed lesson without deleting their older appearances.

For confirmed lessons, the stored concept name, prerequisites, and learning goals are used when a snapshot exists. Older records without a snapshot fall back to current guidance; the first goal-feedback submission freezes their available guidance if necessary.

### 5.4 Give Yes/No feedback for learning goals

For an eligible confirmed lesson, the learner answers Yes or No for each learning goal of each concept. Each answer is saved independently when submitted.

**Plain-English interpretation:** “Yes” means the learner says they can do what that learning goal asks; “No” means they say they cannot yet do it.

The learner can change an answer while the lesson's feedback window remains open. Updating a goal replaces that learner's previous answer to that goal rather than adding another vote.

**Enforced:**

- Feedback must target a confirmed lesson in the learner's current active class subject.
- The goal must actually exist in that lesson concept's frozen goals.
- A valid goal position is one of the maximum five goals.
- Only Yes or No is accepted by the current goal endpoint.
- Extra submitted fields such as another learner identity are rejected by that request schema; the server uses the signed-in learner.
- One learner/concept record is retained and updated, with one current answer per goal.
- A concept with no learning goals has nothing to answer through this activity.
- Unanswered goals remain unanswered; they are not automatically converted to No.

**When the feedback window closes:** creation of a later-numbered lesson for the same class subject closes feedback for the earlier lesson. The later lesson need not have been taught or confirmed. Its scheduled date need not have arrived.

**Example:** Lesson 2 is confirmed today. If Lesson 3 is created for next week, Lesson 2's feedback is already closed now. Learners can still read saved responses, but further changes are rejected.

This is not a configurable number-of-days deadline. There is no current teacher operation to reopen a closed feedback window.

At concept-summary level, any No makes the learner's concept reaction “didn't understand.” All goals answered Yes makes it “understood.” Partially answered all-Yes goals remain pending. These summaries do not create a third learner answer option.

### 5.5 Read homework questions

The learner can read the latest homework activity for a subject and previous homework activities. They can inspect each question's linked concept, topic, and chapter, and the homework's due and release timing.

The latest activity is determined by its activity sequence, derived from homework creation order for the class subject. It is not selected by nearest deadline or by whether the learner has completed it.

**Important:** Home Activity 3 is not necessarily homework for Lesson 3. Teachers can create homework for confirmed lessons in a different order.

Homework remains readable after its due time. The due time is not a content-deletion timer.

There is currently no learner action to submit a typed answer, upload a file, mark homework done, request grading, or rate homework understanding. Completing the work happens outside this app's current submission functionality.

### 5.6 Read worked answers when released

The learner can request a question's memo once its teacher-selected release time has arrived.

**Enforced on the server:**

- Immediate-release homework becomes answer-eligible from its creation time.
- Due-date release becomes answer-eligible at the due timestamp.
- Custom release becomes answer-eligible at its custom timestamp.
- Equality counts: an answer can be revealed **at** the release time, not only later.
- The requested question must belong to confirmed homework in the learner's own current active class subject.
- The main learner data response deliberately omits memo text. Locked answers are not merely hidden after being downloaded.
- A direct answer request before release is rejected even if the learner modifies browser data or their device clock.

If the teacher never supplied a memo, release eligibility does not create one. The learner receives an explanation that no worked answer is available. Learners do not trigger AI answer generation by requesting a memo.

### 5.7 Read covered and not-yet-covered syllabus

The learner can read active shared concepts and their own class subject's active custom concepts, with chapter/topic context and available guidance.

- **Covered** means the concept occurs in at least one confirmed lesson for that class subject.
- **Not yet covered** means it does not occur in any such confirmed lesson.

**Consequences:**

- A planned concept stays not yet covered until confirmation.
- A learner answering No does not move the concept back to not yet covered.
- Repeating a taught concept does not erase earlier coverage.
- Another class's teaching does not change this learner's class coverage.
- Retired curriculum concepts do not remain in the active syllabus solely because they were once taught. Historical lesson content can still retain them.

The learner cannot change covered status themselves.

## 6. Curriculum manager

### 6.1 Manage shared educational content across schools

The curriculum manager manages the shared subject catalogue and subject/grade curriculum. This is platform content used by multiple schools, not a school-specific curriculum copy.

The manager does not use this role to allocate teachers, manage school rosters, create class lessons, send homework, or submit learner feedback.

**Enforced:** current manager operations require a manager-type account and check that its stored manager record is still active.

### 6.2 Add a subject to the shared catalogue

The manager supplies a subject name.

**Enforced in this operation:**

- Names are trimmed and repeated whitespace is normalized.
- A name must contain between 1 and 120 characters after applicable validation.
- The catalogue prevents names differing only by case or normalized whitespace.

**Example:** `Physical Sciences` and ` physical   sciences ` do not become two catalogue subjects.

Adding a subject to the catalogue does not automatically enroll every school or class in it. Principals still choose subjects through streams and class allocations.

The current manager application does not provide subject renaming, subject deletion, or merging catalogue subjects. An older public subject-creation endpoint weakens the intended manager-only boundary; see Section 9.

### 6.3 Load or create a subject/grade curriculum

The manager chooses a subject and a grade from 8–12. They can load the existing curriculum or prepare a new one if none exists.

They can create chapters, topics within chapters, and concepts within topics. A concept may have zero to five prerequisites and zero to five learning outcomes.

**Enforced:** the saved subject must exist, the grade must be within 8–12, and saving requires at least one chapter. A chapter may have no topics, and a topic may have no concepts; empty nested sections are allowed while the overall curriculum has a chapter.

The current manager authoring workflow does not use AI to invent prerequisites or learning goals. Supplied guidance is shared curriculum data.

### 6.4 Edit, reorder, replace, and remove curriculum information

The manager can:

- Rename existing chapters, topics, and concepts.
- Edit prerequisites and learning outcomes after the curriculum has already been saved.
- Reorder chapters.
- Reorder topics within their existing chapter.
- Reorder concepts within their existing topic.
- Insert another concept at a chosen position.
- Add or remove chapters, topics, or concepts.
- Replace a concept with a new concept identity rather than merely renaming the old one.
- Combine eligible newly created, unsaved chapters during preparation.

**Enforced identity rules:**

- Reordering within a parent retains the existing record's identity.
- An existing topic cannot be silently moved to a different chapter by submitting its old identity under that chapter.
- An existing concept cannot be silently moved to a different topic under its old identity.
- IDs must belong to the selected subject/grade's existing active curriculum and cannot be repeated in the submitted tree.
- The manager cannot use shared-curriculum saving to take ownership of a class-specific custom concept.

The ordinary combining operation applies to eligible new unsaved chapters, not a general merger of established chapters with historical teaching data.

### 6.5 Import and review curriculum from a spreadsheet

The manager supplies a spreadsheet, chooses the worksheet to use, reviews the interpreted hierarchy and labels, adjusts it, then explicitly saves to the chosen subject and grade.

The preferred record format has these 13 columns:

`Chapter`, `Topic`, `Concept`, `Prerequisite 1`, `Prerequisite 2`, `Prerequisite 3`, `Prerequisite 4`, `Prerequisite 5`, `Learning outcome 1`, `Learning outcome 2`, `Learning outcome 3`, `Learning outcome 4`, `Learning outcome 5`.

One row describes one concept. Chapter and topic values identify its parents. Unused guidance fields can be blank.

The older format is also understood: chapter headings in the first row, topic headings in the second row, and concepts below each topic column. Merged chapter headings are supported in that older format.

**Enforced in the current manager import:**

- One `.xlsx` or `.csv` file, at most 2 MB.
- Between 1 and 10 worksheets.
- At most 100 worksheet columns and 2,002 physical worksheet rows, including heading rows, under the reader's actual boundary check. The older two-heading-row format therefore permits 2,000 concept rows. The preferred one-heading-row format can currently admit 2,001 data-row positions despite the error message describing a 2,000-row limit.
- Required preferred-format headers must match the template in the expected order, using the parser's case/whitespace normalization.
- Nonempty preferred-format concept rows must include chapter, topic, and concept.
- Preferred-format cell text is limited to 1,000 characters.
- Duplicate concepts within a preferred-format topic are rejected.
- Exact normalized parent names are grouped into the same chapter/topic in that row-based format.
- Read formula cells are rejected as labels; this is not a spreadsheet-calculation feature.
- Extra guidance columns are not accepted as additional prerequisites or outcomes.

**Warnings versus rejection:** similar chapter spellings and repeated topic headings in the older format can produce review warnings. A warning is not an automatic merge. The final save applies stricter uniqueness rules.

Uploading and interpreting a file does not publish it. Importing a replacement tree and accepting it for review still requires an explicit curriculum save. A replacement spreadsheet generally supplies new record identities; it is not automatically matched to all existing concepts by wording.

### 6.6 Save curriculum safely

The manager explicitly saves the entire prepared subject/grade tree. The server checks its current revision, parent/child identities, names, and limits before committing changes.

**Enforced:**

- Chapter names are unique within that subject/grade curriculum.
- Topic names are unique within a chapter.
- Concept names are unique within a topic.
- These name comparisons ignore case, surrounding whitespace, and repeated internal whitespace.
- Names and individual guidance statements must contain 1–1,000 characters.
- At most five prerequisites and five learning outcomes per concept.
- At most 100 chapters, 100 topics per chapter, and 2,000 concepts per topic in the submitted structure.
- The current HTTP save operation also limits the curriculum to 5,000 total concepts.
- General request-size limits can reject a payload before these structural ceilings are reached.
- A stale revision is rejected rather than overwriting another manager's more recent saved changes.
- Related curriculum writes are transactional.

**Example:** two managers load revision 4. The first saves successfully, producing revision 5. The second cannot save their old revision 4 over it without reloading and resolving their changes.

**Removal and replacement:** existing omitted records are normally marked inactive rather than physically deleted. Older lessons can still refer to those records. Replacing a concept makes a new identity and retires the old one; it does not automatically count the replacement as already taught.

New chapters are associated with active matching class subjects across schools, using their default teacher where applicable.

**Allowed:** the same concept wording can appear in different topics, and the same topic wording can appear in different chapters. The app does not enforce platform-wide uniqueness of every educational sentence.

### 6.7 Understand the effect on teaching history

- Current planning reads current shared concept information.
- Confirming a lesson freezes the retained concept names and guidance for that lesson.
- Later guidance edits should not overwrite those existing confirmed snapshots.
- Old records without snapshots can initially fall back to current guidance.
- Replacing a concept does not move old lesson feedback to the new concept automatically.
- Retired content is excluded from active curriculum and ordinary future selection.

**Important limitation:** preservation in the database is not a promise that every older lesson remains accessible to every teacher. Teacher visibility and authorization also depend on current active chapter assignments. Retiring an entire primary chapter can hide or make its historical lessons inaccessible to that teacher's current workflows.

Manager changes are local drafts until saved. A failed save does not intentionally publish partial changes. Drafts are not durably synchronized across browsers or devices.

## 7. Developer role and older backend operations

### 7.1 Developer role

The backend recognizes a staff role called developer for an older shared-chapter import operation.

That operation accepts rows with chapter and concept names, reuses or creates chapters, adds concepts, and links new chapters to matching active class subjects. It can report per-concept errors after partially processing the file; it is not equivalent to the current manager's transactional revision-aware save.

It does not expose the same full chapter/topic/guidance review process or all the manager import's safeguards. No dedicated developer dashboard implementing a broader developer workflow is present.

The developer role is not automatically treated as a teacher or principal by their role-specific checks.

### 7.2 Principal curriculum backend exceptions

Older principal-authorized operations still allow creating shared chapters, creating shared concepts, assigning chapters to class subjects, and assigning a person to a class chapter.

These are not normal capabilities offered by the current principal application. They matter because backend permission is broader than the current application activities suggest.

They do not consistently apply the manager's revision checks, normalized duplicate-name rules, and record-ownership checks. For example, a direct legacy concept creation can create a fallback General topic when no topic exists.

### 7.3 Announcements backend

An older announcement subsystem supports principal creation, reading, editing, and deletion, plus relevant learner reading.

An announcement contains title, body, and an audience of everyone in the school, a grade, a class, or a stream. Current announcement updates and deletion use the caller's school to find the record. Creation requires a title, body, and an audience identifier for targeted audiences.

However, the principal and teacher's current announcement feature is unfinished, and the current learner workspace does not offer an announcement activity. These backend operations should therefore not be represented as a complete currently usable announcement feature.

Target audience ownership/existence is not fully validated by the older implementation. The edit schema can also admit a null target for a targeted audience in some cases.

### 7.4 Older learner feedback operations

There are older operations for:

- Concept-level “understood” / “didn't understand” lesson reactions.
- Planned-lesson preview reactions such as “new to me.”

The current learner activity uses Yes/No **learning-goal** answers instead. Preview reactions are not a current application activity.

The compatibility concept-level endpoint enforces lesson/class access and the feedback window. The older preview endpoints do not perform equivalent class-membership and lesson-status checks. Their existence is a gap, not evidence that a learner is meant to submit preview feedback for arbitrary lessons.

## 8. Rules that connect the different users

### 8.1 Complete business sequence

1. The curriculum manager supplies a shared subject/grade curriculum and concept guidance.
2. The principal creates school classes and streams, assigns streams to classes, registers learners and teachers, and assigns subject teachers.
3. The teacher chooses permitted untaught concepts, queued reviews, and optional custom concepts, then saves a dated lesson plan.
4. Learners can prepare from the latest unconfirmed planned lesson's content.
5. On or after its date, the teacher confirms the concepts actually covered.
6. The retained concepts count as covered in that class subject.
7. Learners may answer the retained concepts' learning goals while the feedback window is open.
8. The teacher reviews aggregate unmet goals and requests relevant concept reviews.
9. The teacher can prepare homework testing any valid selection of the confirmed concepts and explicitly send the complete set.
10. Learners read the questions immediately and request memos when the release policy permits.

These steps are related but not all mandatory prerequisites for the next step. For example, homework does not require learners to have submitted feedback, and planning the next lesson does not require homework for the previous lesson to exist.

### 8.2 What changes coverage and what does not

| Event | Makes an active shared concept count as taught for that class subject? |
| --- | --- |
| Manager adds the concept to shared curriculum | No |
| Teacher selects it in a local draft | No |
| Teacher saves a lesson plan | No |
| Learner reads its prerequisites | No |
| Teacher confirms the lesson and retains it | Yes |
| Learner answers No to a learning goal | Does not undo teaching coverage |
| Teacher adds it to a review lesson | Does not undo original teaching coverage |
| Teacher omits it from a later review confirmation | Does not undo an older confirmed appearance |
| Manager replaces it with a new identity | The replacement does not inherit the retired concept's coverage |

### 8.3 Saved history versus active availability

Changing a stream or curriculum generally retires/deactivates records rather than rewriting all old teaching history.

This separates two questions:

- **Does the old information still exist?** Often yes.
- **Can the current person still access it through an active assignment?** Not necessarily.

Deleting a class is different: it attempts destructive cleanup of the class's activity rather than simple retirement.

### 8.4 Concurrency and repeated requests

Several important operations are protected against overlapping work:

- School setup changes use transaction locks.
- Roster imports lock at school level and revalidate before inserting.
- Lesson planning and review operations lock around the class subject.
- Learner goal responses use the related lock when rechecking whether planning has closed feedback.
- Confirming and sending homework lock the lesson.
- The database rejects duplicate class names within a grade, duplicate subjects within a stream, duplicate concepts within one lesson, and duplicate homework sets for one lesson.
- Curriculum saving uses revision comparison to prevent silent overwriting by an older edit.

These mechanisms are not universal duplicate-request protection. For example, two successful lesson-planning requests may still create two valid plans with different lesson numbers. There is no general request identifier making every create operation safe to repeat without a second record.

### 8.5 Date and time meanings

- Lesson dates are calendar dates, with confirmation eligibility based on Africa/Johannesburg.
- Homework due/release values are timestamps. Server time controls answer eligibility and whether a due time is in the future.
- The teacher's date/time input is converted from the device's local time when sent. On a device set to another timezone, that local entry can represent a different South African clock time.
- There is no current academic-year or term separation. Teaching coverage, sequence counters, and histories do not automatically reset for a new year.

### 8.6 Privacy boundaries and their limits

The current teaching services and learner workspace apply assignment/class checks. Manager shared-content operations apply manager checks. Principal class/grade/stream and current class-subject operations apply school checks.

However, it would be inaccurate to say “every endpoint is isolated by school.” The older staff, learner, preview, and curriculum operations have exceptions listed below. Restricting what the application offers does not itself restrict a person who submits a direct backend request.

## 9. Gaps, surprising behavior, and cases that need decisions

This section documents current behavior. It does not claim these issues were fixed while producing this file.

### G1. School ownership is missing on some roster operations

**Applies to:** principal staff listing/individual creation and learner listing/individual creation.

Those routes check the caller's principal role and that a requested school exists, but do not consistently compare the requested school with the caller's school. The learner-list operation queries by class without proving that the class belongs to the named school. The individual learner-add operation does not prove class and school consistency.

**Consequence:** the normal application supplies the principal's school, but a crafted request can bypass that expectation. The newer bulk import flow has stronger school/class checks.

**Evidence:** `routes/people.ts`, `routes/learners.ts`, `services/learnerService.ts`, compared with `routes/rosterImport.ts`.

### G2. The older learner-list response is broader than required

**Applies to:** principal class learner listing.

The learner-list service selects entire learner rows rather than a limited roster projection. The learner schema includes stored password hashes as well as ordinary roster fields.

**Consequence:** activated learners' stored hashes can be included in an API response intended for roster reading, although the current application does not display them. This is unnecessary sensitive-data exposure, made more serious by G1. A stored hash is not the learner's plaintext password, but it still should not be part of a normal roster response.

**Evidence:** `getLearnersByClass` in `services/learnerService.ts` and the learner schema.

### G3. Class-manager school/role validation is incomplete

The normal application offers school staff, but class create/update accepts an existing person reference without independently proving that this person belongs to the same school or has an appropriate role.

**Consequence:** subject-teacher assignment is more strongly validated than class-manager assignment. There is also no uniqueness rule restricting a manager to one class.

### G4. Duplicate stream names and inconsistent identifier normalization

Stream names have no school/name uniqueness constraint. The normal application trims required values, but older direct stream requests do not robustly reject whitespace-only names.

Staff/admission numbers have exact database uniqueness within a school. Bulk import uses normalized case-insensitive comparisons, while individual creation does not apply the same rule. Case/whitespace variants can therefore behave differently depending on how records were created.

**Consequence:** “duplicate names/numbers are always rejected” would be an overstatement.

### G5. Older shared-curriculum routes bypass manager safeguards

Principal-authorized legacy chapter/concept creation does not require the manager's curriculum revision or its full normalized uniqueness checks. Legacy chapter assignment also does not consistently prove the school, subject/grade compatibility, and selected teacher ownership expected of the newer workflows.

**Consequence:** shared content is not exclusively protected by the current manager workflow just because that is the intended authoring activity.

### G6. Subject creation has an unprotected older route

The manager-specific subject creation checks an active manager. A separate older `POST /subjects` route still creates subjects without an authentication/role requirement.

**Consequence:** normalized duplicate prevention exists, but the ability to add catalogue entries is not fully restricted to managers across the backend.

### G7. Old planned-lesson preview endpoints lack current learner scope checks

The older preview-reading and preview-reaction services query a lesson or accept references without the same current-class, active-allocation, confirmed/planned-state, and concept-membership checks used by current goal feedback.

**Consequence:** do not assume that the current learner workspace's protections cover every older learner endpoint.

### G8. Class deletion can be blocked by custom concepts — inferred risk

The class-deletion cleanup removes class-subject records but does not explicitly remove class-specific concepts that reference them. The custom-concept foreign key shown in the migration has no automatic delete cascade.

**Expected consequence:** a class with custom concepts may fail deletion on a foreign-key dependency. Because the deletion uses a transaction, the expected outcome is rollback rather than intentionally partial cleanup. This case was inferred from code and schema; it was not reproduced during this document review.

### G9. Question links are valid, but homework concept coverage is not complete by rule

Every question must target a confirmed lesson concept. Nothing requires at least one question for **every** concept in that lesson.

**Example:** a three-concept lesson can receive homework containing one question about only the first concept. That is currently permitted.

There is also no duplicate-question-text rule or requirement that each question has a worked memo.

### G10. Release scheduling permits already-past custom release times

The due timestamp must be in the future. The custom answer-release timestamp only has to be valid. It can precede both the due time and the current time.

**Consequence:** choosing an old custom timestamp can make answers eligible immediately. Whether this is desirable should be an explicit product decision.

### G11. Feedback can close before learners had a reasonable opportunity to respond

Any later-numbered lesson creation closes the earlier lesson's feedback window, even if that later lesson is scheduled far in the future. Teachers can also prepare several plans before confirming the earlier one.

**Consequence:** a newly confirmed older lesson may already be closed for feedback. No reopen operation is implemented.

### G12. “Upcoming” and “latest” follow sequence, not necessarily chronology

The learner's upcoming lesson is the highest-numbered planned lesson. The completed default is the highest-numbered confirmed lesson. Latest homework follows activity creation order.

**Consequence:** backdated lessons, out-of-order planning, and homework created out of lesson order can produce surprising defaults. Only one planned lesson is selected as upcoming even when several exist.

### G13. Draft preservation is limited

Planning, unsent homework, and manager edits are not durable server drafts. Reloading, leaving an activity, switching homework lesson, or changing devices can discard unsaved work.

Remembering an activity location is separate from saving its unfinished contents. There is no offline queue or cross-device draft synchronization.

### G14. Custom concepts have limited authoring after creation

Custom concepts start without prerequisites and learning goals. The shared manager editor excludes them. There is no normal persisted-custom-concept editing/guidance workflow.

**Consequence:** learners can encounter a custom concept with no goals to answer. Duplicate custom wording is also permitted.

### G15. Cross-chapter ownership and retired historical lessons need review

The primary chapter authorizes later operations on a lesson. A teacher can gain or lose chapter assignments after a cross-chapter plan was made. Later operations do not consistently recheck each linked concept's current chapter ownership.

Retiring an entire primary chapter can also make stored lessons unavailable to the teacher's active history or feedback operations, despite their data being preserved.

**Consequence:** reassignment and curriculum retirement are not fully equivalent to a stable historical permission model.

### G16. General principal curriculum reading can mix class-specific concepts

The generic concept-by-chapter service does not filter out class custom concepts or restrict them to a named class subject. The current principal general curriculum reader uses it.

**Consequence:** that general listing can contain local concepts from more than one class using the shared chapter. The dedicated class curriculum/coverage operation excludes custom concepts and is more predictable.

### G17. Coverage and feedback are not permanently frozen reports

Current coverage uses current active shared curriculum, so changing or replacing curriculum can change the denominator and apparent progress. Feedback aggregates use the current class roster, so changing membership can alter old totals.

Concept snapshots preserve selected educational text, but chapter/topic names and ordering may still reflect current records.

**Consequence:** the current app does not provide immutable end-of-term reporting.

### G18. AI safeguards do not guarantee educational correctness or distributed quotas

Generated outputs are structurally validated, not independently marked for correctness. Manual review remains necessary. Usage limits are in-memory, per running backend process, not a shared durable account quota.

The AI request can include a primary chapter context even when lesson concepts span chapters. The concept list remains explicit, but the context is not a complete multi-chapter teaching model.

### G19. There is no academic-year rollover or timetable model

No current routine promotes learners, resets lesson numbers, clears yearly coverage, or isolates one year's class history from the next automatically. Class dates are not checked against holidays or teacher timetable clashes.

**Consequence:** the same continuing class allocation can retain its numbers and taught history unless an explicit future year-management feature is designed.

### G20. Announcements are incomplete as a user feature

Backend create/read/update/delete operations exist, but the current application does not provide a complete announcement workflow. Older audience targeting does not fully validate that the target belongs to the appropriate school, and some audience edits can leave an invalid target.

### G21. Not all multi-step creation is atomic or safe to repeat

The lesson, homework, roster-import, and manager curriculum save operations group important writes together. Stream creation plus its selected subject additions uses several requests, and old developer import can partially succeed.

Repeated lesson-create requests are not deduplicated into one plan merely because they contain the same date and concepts. Class-name database uniqueness prevents duplicate class records, but a racing failure may surface as a less friendly database error after both requests pass their early check.

### G22. Removing content after planning can leave a stale plan

Planning choices are revalidated when the plan is created, but confirmation primarily checks membership in the saved plan rather than requiring every retained concept to remain active in the current curriculum.

**Consequence:** retiring a concept after planning does not automatically edit that plan. If its primary chapter is still accessible, confirmation can retain an old concept; if the primary chapter itself was retired, authorization may block the lesson instead. There is no general plan reconciliation/cancellation workflow.

## 10. Concrete edge-case checklist

The following are useful acceptance scenarios. The answers describe current implementation, not a claim that every scenario was rerun for this document.

| Scenario | Current outcome |
| --- | --- |
| Principal creates label `b` when `11B` already exists in the same Grade 11 | Rejected after canonical class-name normalization; database also prevents duplication. |
| Another school creates its own Grade 11B | Allowed. |
| Principal tries class label `B1` or `B-C` | Rejected: letters-only identifier. |
| Principal deletes an empty fixed grade | Rejected. |
| Principal assigns another school's stream | Rejected in current class setup. |
| Principal assigns another school's person as subject teacher | Rejected in current subject assignment. |
| Principal submits another school's person as class manager directly | Not equivalently validated; gap. |
| Same subject added twice to a stream | Rejected by unique membership. |
| Two streams have the same name | Allowed; gap if uniqueness is desired. |
| A stream's subject is removed while lessons already exist | Allocation becomes inactive; teaching history is retained rather than deliberately erased. |
| Subject is later restored to the same class | Existing allocation can be reactivated, retaining history. |
| Bulk import contains one bad row and 99 valid rows | Commit rejects the batch; it does not intentionally save the 99. |
| Two import rows differ only by identifier case | Treated as duplicates by the current import validator. |
| Individual roster creation uses a case variant of an existing number | Not guaranteed to match bulk-import behavior. |
| Teacher chooses concept number 11 beyond the current ten eligible untaught concepts | Rejected unless independently eligible as a review concept. |
| Teacher includes the same concept twice in one plan | Rejected.   |
| Teacher prepares two different plans containing the same still-untaught concept | Allowed. |
| Teacher plans across two assigned chapters | Allowed; actual concept relationships retained. |
| Teacher adds a custom concept under another assigned chapter's topic | Allowed; it remains class-specific. |
| Teacher adds a custom concept under an unassigned chapter's topic | Rejected by current planning save. |
| Teacher confirms tomorrow's lesson today | Rejected using the South African school date. |
| Teacher confirms the same lesson twice | Second confirmation rejected. |
| Teacher excludes every concept during confirmation | Allowed; confirmed lesson has no retained concepts and cannot supply valid homework. |
| Teacher excludes a review concept that was taught before | Earlier confirmed teaching remains intact. |
| Learner answers only some goals Yes | Those goals are saved; unanswered goals remain unanswered; concept summary remains pending unless a No exists. |
| Learner changes a Yes to No before feedback closes | Existing answer is updated, not duplicated. |
| Learner posts another class's goal reference | Rejected by current goal-feedback scope checks. |
| Teacher plans another lesson while learners are answering the last one | Later planning closes the old feedback window; current writes recheck under the shared lock. |
| Teacher requests review with zero No responses | Allowed by server; no review-focus goals may be attached. |
| Teacher requests review twice for the same destination plan | One concept association; focus goals merge without duplicate insertion. |
| Teacher saves a plan after deselecting a queued review | Reviewed suggestion is consumed; old taught status is not undone. |
| Homework contains questions for only one of three taught concepts | Allowed; full concept-test coverage is not enforced. |
| Teacher accepts a blank or whitespace-only question | Rejected. |
| Teacher closes an unsaved question edit | Its local edits are not accepted into the homework draft. |
| Teacher requests zero AI questions overall | Rejected. |
| AI returns incorrect concept counts or malformed text | Response rejected rather than appended as a valid draft. |
| AI returns a plausible but mathematically wrong memo | Structural checks may accept it; teacher review is required. |
| Two attempts send homework for the same lesson | One set is permitted; the other finds the existing set and is rejected. |
| Teacher sends homework with no memo | Allowed; learner later has no worked answer to retrieve. |
| Custom memo-release date is yesterday | Valid timestamp can be accepted; answer may be immediately eligible. |
| Learner changes device time to see answers early | Server still rejects a request before the actual release time. |
| Learner requests an answer exactly at release time | Allowed if class/subject/lesson ownership checks pass. |
| Manager saves guidance with six prerequisites | Rejected by current schema; database also limits the stored array length. |
| Manager uses two normalized-identical concept names within one topic | Rejected in current shared curriculum save. |
| Same concept wording appears in different topics | Allowed. |
| Manager submits an existing concept identity under another topic | Rejected; old identity cannot be silently reparented. |
| Two managers save from the same curriculum revision | The later stale save is rejected. |
| Manager replaces an already taught concept | New concept does not inherit the old identity's taught status or feedback. |
| Manager renames a concept used in a confirmed snapshot | Frozen lesson concept name/guidance remain; current curriculum wording changes. |
| Principal deletes a class containing saved custom concepts | Potential foreign-key cleanup failure; needs a regression test and cleanup decision. |
| A new school year starts | No automatic rollover/reset is implemented. |

## 11. Implementation sources

These links identify the code inspected for this document. They are evidence references, not instructions for using the application. Backend links assume the two repositories remain siblings on disk.

### Current application activities

- [Principal capabilities and action definitions](../src/components/principal/books/registry.ts)
- [Teacher activity definitions](../src/components/dashboard/teacher-books/TeacherBookPage.tsx)
- [Lesson planning](../src/components/dashboard/PlanLessonForm.tsx)
- [Lesson confirmation](../src/components/dashboard/ConfirmLessonForm.tsx)
- [Homework preparation and sending](../src/components/dashboard/HomeworkForm.tsx)
- [Question draft validation](../src/components/dashboard/manualQuestion.ts)
- [Question and memo editing](../src/components/dashboard/HomeworkQuestionDialog.tsx)
- [Teacher feedback activities](../src/components/dashboard/teacher-books/LessonFeedback.tsx)
- [Learner activities and selection rules](../src/components/dashboard/learner-books/LearnerBookPage.tsx)
- [Learner lesson/activity ordering](../src/components/dashboard/learner-books/registry.ts)
- [Manager authoring activities](../src/app/dashboard/manager/page.tsx)

### Current backend rules

- [Teacher request validation and AI usage limits](../../Project-Edu-Revo/src/routes/teacherWorkspace.ts)
- [Teaching ownership, planning, confirmation, and homework rules](../../Project-Edu-Revo/src/services/teacherWorkspaceService.ts)
- [Feedback aggregation and review placement](../../Project-Edu-Revo/src/services/teacherLessonFeedbackService.ts)
- [Learner scope, syllabus, and answer release](../../Project-Edu-Revo/src/services/learnerWorkspaceService.ts)
- [Learner feedback window and goal saving](../../Project-Edu-Revo/src/services/lessonResponseService.ts)
- [Goal count calculation](../../Project-Edu-Revo/src/services/lessonGoals.ts)
- [Current learner request schemas](../../Project-Edu-Revo/src/routes/learnerWorkspace.ts)
- [Class naming and destructive cleanup](../../Project-Edu-Revo/src/services/classService.ts)
- [Class-subject synchronization and teacher assignment](../../Project-Edu-Revo/src/services/classSubjectService.ts)
- [Stream mutations](../../Project-Edu-Revo/src/services/streamService.ts)
- [Class shared-curriculum coverage](../../Project-Edu-Revo/src/services/classCurriculumService.ts)
- [Reviewed roster import rules](../../Project-Edu-Revo/src/services/rosterImportService.ts)
- [Reviewed roster import authorization](../../Project-Edu-Revo/src/routes/rosterImport.ts)
- [Manager access and request limits](../../Project-Edu-Revo/src/routes/manager.ts)
- [Shared curriculum identity, import, and revision rules](../../Project-Edu-Revo/src/services/curriculumService.ts)
- [AI response validation](../../Project-Edu-Revo/src/services/homeworkAiService.ts)

### Older operations and schema evidence

- [Staff roster routes](../../Project-Edu-Revo/src/routes/people.ts)
- [Learner roster routes](../../Project-Edu-Revo/src/routes/learners.ts)
- [Learner roster service and selected response fields](../../Project-Edu-Revo/src/services/learnerService.ts)
- [Older chapter assignment and creation](../../Project-Edu-Revo/src/routes/chapters.ts)
- [Older shared concept operations](../../Project-Edu-Revo/src/routes/concepts.ts)
- [Older subject catalogue routes](../../Project-Edu-Revo/src/routes/subjects.ts)
- [Older preview-feedback routes](../../Project-Edu-Revo/src/routes/learnerFeedback.ts)
- [Older preview-feedback service](../../Project-Edu-Revo/src/services/learnerFeedbackService.ts)
- [Older announcement operations](../../Project-Edu-Revo/src/routes/announcements.ts)
- [Developer-only chapter import route](../../Project-Edu-Revo/src/routes/chapterImport.ts)
- [Database schema definitions](../../Project-Edu-Revo/src/db/schema)
- [Database migrations, including fixed grades, uniqueness, custom-concept scope, and lesson numbers](../../Project-Edu-Revo/src/db/migrations)

This document should be revised whenever the app's permissions, business rules, or available activities change. In particular, the gaps above should not silently become “enforced rules” in later descriptions until the implementation and relevant regression checks actually support that claim.
