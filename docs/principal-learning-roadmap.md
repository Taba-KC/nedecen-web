# The principal's app: our chapter plan

This guide follows the existing app, one user action at a time. It is a learning walkthrough, not a proposal to rebuild the app. Each chapter explains the current source with concrete example values, requests, responses, database work, and the resulting screen.

**My current estimate is 18 chapters altogether.** This is a plan, not a promise to squeeze every topic into exactly 18 files. If a chapter becomes hard to follow, we will split it instead of rushing through it. The remaining chapters are proposed; they have not been written yet.

| Chapter | Journey | Status |
|---|---|---|
| 1 | Enter localhost, load the app, and reach the empty login form | [Written](C:/Users/Kgodiso/source/repos/nedecen-web/docs/principal-chapter-01-opening-the-app.md) |
| 2 | Type credentials, sign in, check permissions, and render the library | [Written](C:/Users/Kgodiso/source/repos/nedecen-web/docs/principal-chapter-02-signing-in.md) |
| 3 | Open Grades & Classes, select Grade 9, and create a class | [Written](C:/Users/Kgodiso/source/repos/nedecen-web/docs/principal-chapter-03-opening-grades-and-creating-a-class.md) |
| 4 | Edit a class, choose its manager, rename it, and attempt deletion with/without history | Planned |
| 5 | Open Streams, create a stream, and add/change/remove its subjects | Planned |
| 6 | Assign class streams, configure a subject split and rooms, assign subject teachers, and inspect the class curriculum | Planned |
| 7 | Add one learner to a class; follow validation, account status, and subject-choice reset | Planned |
| 8 | Upload a learner spreadsheet, choose its purpose, parse it, correct it, and preview its effects | Planned |
| 9 | Confirm that import: updates, transfers, grade progression, academic years, and preserved history | Planned |
| 10 | Select learners, preview a move to another class, and confirm the move | Planned |
| 11 | Open Staff, filter/search records, add a staff member, and import staff | Planned |
| 12 | Assign administrative work, change permissions, and switch between administration and teaching | Planned |
| 13 | Open the school Learners book, browse class registers, filter/search, and follow its shared actions | Planned |
| 14 | Open Curriculum and trace grade → subject → chapter → topic → concept, including spreadsheet import | Planned |
| 15 | Edit saved curriculum and its prerequisites/learning goals; follow links to class teaching records | Planned |
| 16 | Open Announcements and explain the current under-development implementation | Planned |
| 17 | Follow navigation help, mobile/tablet drawers, tabs, custom dropdowns, focus, and responsive changes in more depth | Planned |
| 18 | Close/reopen the app, resume a location, renew an expired session, sign out, and follow failure/retry paths | Planned |

The chapters reuse code explanations when the same helper runs again, while still showing exactly where it re-enters the process. For example, an API request in Chapter 6 will still identify its authentication and database steps; we will not pretend those steps disappeared because Chapter 2 explained them.

Each chapter stops at a clear state. The next chapter starts from that state. All examples use invented IDs and names; producing these documents does not create those records in the real database.
