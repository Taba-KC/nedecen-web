# Principal Dashboard Specification

Last regenerated: 2026-10-03

This document describes what "done" means for the principal side of NEDECEN, based on the current data model and backend routes.

It is intentionally decision-oriented. Some parts are already implemented, some are partly implemented, and some are open product decisions.

## 1. Principal Dashboard Purpose

The principal dashboard is the school's setup and administration console.

The principal is responsible for making sure the school structure exists before teachers and learners can use the teaching/feedback flows.

The principal dashboard should answer:

- Do all grades exist?
- Does each grade have classes?
- Does each class have a stream?
- Does each stream contain subjects?
- Does each class have learners?
- Do staff records exist?
- Which staff members are actually teachers?
- Are chapters/concepts available for each subject and grade?
- Are chapters assigned to the correct class subjects?
- Are people assigned to teach those chapters?
- Are accounts activated?
- Are announcements being managed?

## 2. Current Product Boundary

The app has three broad layers:

1. Platform-level curriculum
2. School-level setup
3. Teaching and learner feedback

The principal mostly owns school-level setup, but there is overlap with curriculum setup because the backend currently allows principals to create/import chapters and concepts.

Teacher/learner flows such as lesson planning, homework, preview feedback, post-lesson feedback, and aggregated feedback are not principal-first screens, although the principal may eventually need oversight views.

## 3. Core Mental Model

The current data model works like this:

```text
Platform subject catalogue
  -> subjects

School streams
  -> streams
  -> stream_subjects

School structure
  -> grades
  -> classes
  -> class_subjects

Curriculum library
  -> chapters by subjectId + gradeNumber
  -> concepts inside chapters

Class-specific teaching setup
  -> class_chapters
     links one curriculum chapter to one class_subject
     optionally assigns personId as the teacher for that chapter

Teaching activity
  -> lessons
  -> lesson_concepts
  -> homework
  -> questions
  -> learner feedback tables
```

Important clarification:

Some old comments in the schema describe chapters as if chapters directly belong to a class subject. The actual current schema does not do that.

Currently:

- `chapters` belong to a `subjectId` and `gradeNumber`.
- `concepts` belong to a `chapterId`.
- `class_chapters` links a curriculum chapter into a specific `class_subject`.
- `class_chapters.personId` assigns the staff member who teaches that chapter for that class subject.

That means "Physical Sciences Grade 11: Mechanics" can exist once in the curriculum library, then be linked into Grade 11A Physical Sciences, Grade 11B Physical Sciences, etc.

## 4. What Each Entity Means

### Subject

A subject is a platform-level item, for example:

- Mathematics
- Physical Sciences
- English First Additional Language
- Life Sciences

Subjects are not school-specific in the data model.

Current decision:

- Platform should own the canonical subject catalogue.
- Principals should choose from existing subjects, not create arbitrary subjects, unless we explicitly allow school-specific subject requests later.

### Stream

A stream is a school-created group of subjects.

Examples:

- Science Stream
- Commerce Stream
- General (Maths Lit)

A stream belongs to a school.

The principal creates streams and adds subjects to them.

### Grade

A grade belongs to a school.

For this MVP, the normal high-school set appears to be:

- Grade 8
- Grade 9
- Grade 10
- Grade 11
- Grade 12

The app enforces no duplicate grade numbers per school.

### Class

A class belongs to one grade.

Examples:

- Grade 11A
- Grade 11B
- Grade 12C

A class may have:

- a stream
- a class teacher
- a profile image
- a description
- learners

The app enforces no duplicate class names within the same grade.

### Class Subject

A class subject is a class-specific subject record.

Example:

- Grade 11A -> Physical Sciences
- Grade 11A -> Mathematics

When a stream is assigned to a class, the backend creates `class_subjects` from that stream's subjects.

This matters because lessons, chapters, homework, and feedback attach to class-specific subjects, not directly to the stream.

### Chapter

A chapter is a curriculum unit for a subject and grade.

Example:

- Subject: Physical Sciences
- Grade: 11
- Chapter: Newton's Laws

Chapters have an order.

### Concept

A concept is the smallest teachable idea inside a chapter.

Example:

- Chapter: Newton's Laws
- Concepts:
  - Resultant force
  - Inertia
  - Free-body diagrams

Lessons and homework feedback eventually trace back to concepts.

### Class Chapter

A class chapter links a curriculum chapter to a class subject.

Example:

- Grade 11A Physical Sciences
- linked to Chapter: Newton's Laws
- assigned to Mr Mokoena

This is where a staff member becomes a real teacher in the system.

A person is not truly a teacher just because their role says `teacher`. In the product logic, they become a teacher when they are assigned to at least one `class_chapters.personId`.

## 5. Current Principal Screens

### Grades and Classes

Current state:

- Implemented.
- Principal can add/delete grades.
- Principal can add/edit/delete classes.
- Principal can assign stream.
- Principal can assign class teacher.
- Principal can upload class profile image.
- Principal can add/import learners into a class.
- Class cards show stream, teacher, image/placeholder, and actions.

Done criteria:

- All school grades can be created.
- No duplicate grades.
- Each grade can have one or more classes.
- No duplicate class names in a grade.
- Each class can have stream, class teacher, profile image, and learners.
- Empty states still allow creation.

Remaining decisions:

- Should classes be allowed without streams?
- Should deleting a grade/class always cascade, or should there be a confirmation/recovery mechanism?

### Streams

Current state:

- Implemented.
- Principal can create/edit/delete streams.
- Principal can add/replace/remove subjects in a stream.
- Streams use platform subject catalogue.

Done criteria:

- Principal can define all school subject bundles.
- Principal can assign streams to classes.
- Stream changes do not destroy historical class teaching records.

Important rule:

- Changing a stream definition should not automatically rewrite existing `class_subjects` for classes unless we explicitly build that behavior.
- `class_subjects` are the stable class-specific records used by lessons and feedback.

Remaining decisions:

- Should a stream change update future classes only?
- Should principal be warned when changing a stream already assigned to classes?

### Staff

Current state:

- Implemented.
- Principal can add staff individually.
- Principal can import staff in bulk.
- Staff list can filter:
  - all
  - assigned
  - not assigned
  - account active
  - setup pending
- Assigned means the person has at least one chapter assignment.

Done criteria:

- Staff records can be created/imported.
- Staff can claim accounts through onboarding.
- Principal can see who has activated account.
- Principal can see who is actually assigned to teaching work.

Remaining backend/UI gaps:

- Edit staff record.
- Delete staff record.
- Reassign/deactivate staff safely.
- Show which classes/subjects/chapters a staff member teaches.

### Learners

Current state:

- Implemented.
- Principal can add learners individually.
- Principal can import learners in bulk.
- Learners are attached to classes.
- Learners can onboard and activate accounts.

Done criteria:

- Learners can be added per class.
- Learners can be imported from spreadsheet.
- Principal can search/filter by class.
- Principal can see account activation status.

Remaining backend/UI gaps:

- Edit learner.
- Delete learner.
- Move learner between classes.
- Show learner's subjects/homework/feedback status.

### Announcements

Current state:

- Implemented.
- Principal can create announcements.
- Principal can target:
  - all users
  - grade
  - class
  - stream
- Principal can edit/delete announcements.
- Learner endpoint can fetch relevant announcements.

Done criteria:

- Principal can publish messages to the right audience.
- Learners only see announcements relevant to their class/grade/stream/all.

Remaining decisions and schema gaps:

- Hide announcement.
- Pin announcement.
- Categories/system tags.
- Announcement permissions.
- Retention/archive rules.
- Default audience settings.

These require extra schema fields/tables if they need to persist.

## 6. Biggest Missing Principal Feature: Curriculum Setup

This is the main missing area.

The principal still needs a UI for:

1. Selecting a subject and grade.
2. Viewing chapters for that subject and grade.
3. Creating/importing chapters.
4. Viewing concepts inside each chapter.
5. Creating/importing concepts.
6. Seeing which class subjects use those chapters.
7. Assigning chapters to class subjects.
8. Assigning staff members to chapters.

Possible screen name:

- Curriculum
- Teaching Setup
- Subject Setup
- Chapters and Teachers

Recommended screen name:

`Curriculum Setup`

Reason:

It explains the job better than "Subjects", because the principal is not just looking at subjects. They are setting up chapters, concepts, and teaching assignments.

## 7. How Curriculum Setup Should Work

### Step 1: Choose Grade

Example:

- Grade 11

### Step 2: Choose Subject

Example:

- Physical Sciences

### Step 3: Manage Curriculum Library

The principal sees:

- Chapters for Physical Sciences Grade 11
- Concepts inside each chapter

Actions:

- Add chapter
- Edit chapter
- Delete chapter if unused
- Import chapters/concepts spreadsheet
- Add concept
- Edit concept
- Delete concept if unused

Current backend already supports:

- create chapter
- list chapters by subject and grade
- import chapters/concepts
- create concept
- list concepts by chapter

Likely missing backend:

- update chapter
- delete chapter safely
- update concept
- delete concept safely

### Step 4: Link Curriculum to Class Subjects

For each class studying the subject, the principal should see:

- Grade 11A Physical Sciences
- Grade 11B Physical Sciences
- Grade 11C Physical Sciences

Each class subject should show:

- chapters linked
- chapters missing
- assigned teacher per chapter

Current backend partially supports:

- assign chapter to class subject
- list class chapters
- assign person to class chapter

Likely missing backend:

- list class subjects by class with subject names
- list class subjects by grade/subject
- remove chapter from class subject
- bulk assign chapters to all matching class subjects
- bulk assign teacher to many chapters

### Step 5: Assign Teachers

The principal can assign a staff member to:

- one chapter in one class subject
- many chapters in one class subject
- all chapters in one subject for one class
- all matching chapters across multiple classes

Example:

Mr Mokoena teaches:

- Grade 11A Physical Sciences: Mechanics chapters
- Grade 11B Physical Sciences: Mechanics chapters

Ms Dlamini teaches:

- Grade 11A Physical Sciences: Chemistry chapters

This supports split-subject teaching, especially for subjects like Physical Sciences.

## 8. School Status / Completeness Dashboard

The earlier Home/Status idea still makes product sense, even if we removed the Home tab temporarily.

The principal should eventually have a setup health dashboard.

It should detect:

- fewer than expected grades
- grade has no classes
- class has no stream
- class has no learners
- class has no class teacher
- stream has no subjects
- class subject has no chapters
- chapter has no concepts
- class chapter has no assigned teacher
- staff account setup pending
- learner account setup pending
- announcement settings incomplete

Recommended product name:

`School Setup Health`

This can live as:

- a Home dashboard later, or
- an alert panel inside each relevant tab.

## 9. Principal Definition of Done

The principal module is done when a principal can perform these jobs without backend/manual intervention:

### School structure

- Create grades.
- Create classes.
- Assign streams to classes.
- Assign class teachers.
- Upload class images.
- Delete grades/classes safely.

### Streams

- Create streams.
- Add platform subjects to streams.
- Edit/delete streams.
- Understand impact of stream changes.

### Staff

- Add/import staff.
- Edit/delete staff safely.
- See account activation status.
- See teaching assignment status.
- Assign staff to teaching chapters.

### Learners

- Add/import learners.
- Edit/delete/move learners safely.
- See account activation status.

### Curriculum

- See subjects available to the school through streams/classes.
- Manage chapters by subject and grade.
- Manage concepts by chapter.
- Import chapters/concepts.
- Link chapters to class subjects.
- Assign staff to class chapters.

### Announcements

- Create/edit/delete announcements.
- Target announcements.
- Manage pin/hide/category/archive settings if those features are kept.

### Completeness

- See what is incomplete.
- Click directly from an issue to the place where it can be fixed.

## 10. Things That Are Not Principal MVP

These are more teacher/learner app responsibilities:

- Teacher planning lessons.
- Teacher confirming lessons taught.
- Teacher creating homework.
- Learner previewing concepts before lesson.
- Learner giving post-lesson feedback.
- Learner doing homework feedback.
- Teacher viewing detailed lesson feedback.

The principal may later need summary analytics, but not the full operational teacher workflow.

## 11. Open Decisions

These decisions need product choices before more implementation:

1. Should principals manage chapters/concepts, or should platform managers own the curriculum library?
2. If platform owns chapters/concepts, can schools customize them?
3. Should a class stream update automatically change existing class subjects?
4. Should chapters auto-link to every class subject when imported?
5. Should a teacher assignment be per chapter, per subject, or both?
6. Should class teacher and subject/chapter teacher be separate concepts? Current answer appears yes.
7. Should delete actions hard-delete records, soft-delete records, or archive them?
8. Should announcement hide/pin/categories exist in MVP?
9. Should the Home/School Setup Health dashboard return now or later?
10. What is the smallest workflow a school must complete before learners can start using the app?

## 12. Suggested Next Build Order

Recommended next sequence:

1. Build `Curriculum Setup` UI.
2. Add backend endpoints for listing class subjects with subject/class/grade names.
3. Add chapter/concept edit/delete endpoints.
4. Add teacher assignment UI for class chapters.
5. Add setup health checks.
6. Add edit/delete/move for staff and learners.
7. Decide whether announcement pin/hide/categories are MVP.

## 13. Simplest Definition of MVP Done

Principal MVP is done when this sentence is true:

The principal can set up the school's grades, classes, streams, staff, learners, curriculum chapters/concepts, and teacher assignments so that teachers can plan lessons and learners can receive class-specific work and announcements without any manual database work.

