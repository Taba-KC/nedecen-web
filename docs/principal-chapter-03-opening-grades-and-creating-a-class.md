# Chapter 3: Open Grades & Classes, choose Grade 9, and create a class

Previous: [Chapter 2 — Signing in](C:/Users/Kgodiso/source/repos/nedecen-web/docs/principal-chapter-02-signing-in.md). Our wider plan: [the proposed 18 chapters](C:/Users/Kgodiso/source/repos/nedecen-web/docs/principal-learning-roadmap.md).

**Where we start:** the principal is signed in at `http://localhost:3001/dashboard/principal`. The library has rendered. The first-visit tutorial invitation is open above it.

**Where we will stop:** a new Grade 9A class has been saved and its class-register page has rendered. We will not add a learner or assign a stream yet.

We continue with the invented principal from Chapter 2: person ID **12**, school ID **7**, role **principal**. Their access token is still valid. There are no teaching allocations. For this chapter, imagine the school already has these grade rows and no classes or streams:

| Database grade ID | Actual grade number |
|---|---|
| 71 | 8 |
| 72 | 9 |
| 73 | 10 |
| 74 | 11 |
| 75 | 12 |

These IDs are invented examples, not IDs to type into your real app. The school has the principal's staff row, which we will imagine is named **Ms Demo Principal**. We will leave Class manager unselected when creating the class. Imagine PostgreSQL assigns the new class ID **501**.

That distinction matters: **9** is a grade number; **72** is the identity of this school's Grade 9 row; **501** is the identity of a class in that grade. We will follow where each value goes.

References describe the source as it stands on **28 October 2026**. We are reading/simulating the existing app, not running these changes against the database. Read the numbered steps in order.

We follow one uninterrupted logical journey. Independent requests can overlap, and development-mode effect checks or a window-focus event can cause extra reads. Where work is concurrent, we will say so rather than invent a guaranteed network-completion order.

## 1. We first dismiss the tutorial invitation

The modal currently blocks ordinary interaction with the books behind it. We cannot honestly start with a cover click while it is still open.

**Frontend: [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:71), line 71.**

You click **Maybe later**. React calls the `dismiss` function attached directly to that button.

**Called functions: [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:53), lines 53–57.**

`dismiss()` first calls `remember()`. Neither its `completed` argument nor the checkbox state `never` is true, so it preserves the existing visit count without adding completed/dismissed flags. It writes that preference to the tutorial's localStorage key. Then it asks React to set `prompt=false`, `step=null`, and close the navigation drawer.

On the next render, `{prompt && <TeacherDialog ...>}` returns nothing. React removes `TeacherDialog`. Its effect cleanup closes the native dialog and releases the body's scroll lock:

**Cleanup: [nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx:16), lines 16–23; unlock logic: [nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:8), lines 8–17.**

There is a small implementation distinction here: **Maybe later calls `dismiss` directly**, so it removes this prompt without going through the delayed motion-close callback. The dialog's own ×/Escape paths use that callback. We are describing the current behaviour, not assuming every close path animates identically.

No backend request is sent. The books are now available to click.

## 2. You click the Grades & Classes cover

**Cover button: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:351), lines 351–354.**

The `books.map(...)` from Chapter 2 created a button for each definition. On this button, `item.id` is `"grades"`.

Before the button's normal click handler, the wrapper receives the event in its **capture phase**:

**Wrapper handler: [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:137), lines 137–146.**

`event.target` identifies the clicked DOM element, possibly a span inside the cover. `.closest(...)` walks up its ancestors until it finds the book button. Because we are opening a different book, it asks the drawer state to become closed. On desktop it was already visually closed; no API call happens here.

Then the cover's own handler runs:

```tsx
() => navigate(item.id)
```

The argument is `"grades"`. We now enter your own `navigate` function. This is not a built-in Next.js function merely because it navigates.

## 3. navigate builds the address for the book

**Frontend: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:294), lines 294–313.**

The parameter values are:

```text
nextBook = "grades"
nextPage = undefined
nextTab  = undefined
```

`importChanged.current` is false, so no import-related revision change happens.

Because we did not supply a page, it calls `rememberedLibraryLocation("principal", "grades")`. That is the same helper from Chapter 2, but now asking for a remembered page **inside this book**, rather than the last overall library address.

**Helper: [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:66), lines 66–76.**

Our browser has no saved grades-book address, so the helper returns null. `new URLSearchParams(...)` therefore receives `{ book: "grades" }`. This built-in JavaScript class builds and encodes URL query parameters.

There is no remembered page to adopt and no explicit tab, so those parameters are not added. The destination is currently just:

```text
?book=grades
```

That does not identify Grade 9 yet. We have opened the book, not chosen Grade 9.

## 4. The page-turn effect starts before the new data arrives

Still inside `navigate`, `nextBook !== bookId` is true: `"grades"` is different from the previous null value. It calls `turn(1)`.

**Called hook callback: [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:91), lines 91–129.**

`turn` receives a distance of 1. It first calls its local `clear` helper to cancel any previous animation and empty the temporary layers. It then checks whether there is a usable distance, whether reduced motion is requested, and whether the source/layer refs point to real DOM nodes.

**The clear helper: [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:63), lines 63–72.** It reads the previous active animation object, sets the active ref to null, cancels each previous animation if present, removes the turning attribute, and empties each temporary layer. On this first turn there is no previous active animation to cancel.

If reduced motion is enabled, it returns here. Navigation still continues; animation is optional.

Otherwise, it takes the underlay and sheet elements, decides this is a forward turn, and asks `pageTurnSchedule(1)` and `pageTurnFrames(false)` for timing and frame descriptions:

**Animation descriptions: [nedecen-web/src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts:42), lines 42–45 and [nedecen-web/src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts:22), lines 22–37.**

The callback loops through the scheduled sheets. It creates front/back/curl/shadow divs, sets their stacking order, and uses the browser's `.animate(...)` method to animate them. These are temporary presentation elements, not extra mounted versions of the school app.

For distance 1, the schedule has one sheet with delay 0 and duration 340 milliseconds. `pageTurnFrames(false)` uses the forward-fold table. Its loop calculates clipped front/back regions, curl width/position, and shadow strength at successive progress offsets. It returns arrays of visual frame descriptions; it does not change the selected book. Those arrays are the inputs to `.animate`.

For the visible outgoing face, it calls `placeSnapshot(...)`:

**Snapshot helpers: [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:16), lines 16–55.**

`snapshot` clones the currently visible paper DOM, removes animation/binding elements and duplicate IDs, makes the clone inert, copies displayed form values where applicable, and records scroll offsets. `placeSnapshot` puts the clone into a temporary layer and restores those offsets. In our case it is a visual copy of the welcome page.

The real application has not saved anything. This work only makes the upcoming route change feel like turning a page. When the animation Promises finish, the callback clears the layers, unless a later turn has already replaced them.

**We return to `navigate`, immediately after `turn(1)`.**

## 5. The URL changes, and React works out the new selection

**Continuation: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:308), lines 308–310.**

The code calls Next.js's `router.push` with:

```text
/dashboard/principal?book=grades
```

`{ scroll: false }` asks Next.js not to scroll the whole window to the top as part of this navigation. `setQuery("")` clears the page-search text.

The browser address now identifies the selected book. This is a Next.js navigation on port 3001, not the data-loading request to Express on port 3000. Next.js may obtain route payloads as needed; the feature's database requests are the explicit API calls we follow below.

**New render: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:198), lines 198–238.**

`useSearchParams()` now yields `bookId="grades"`, `pageId=null`, and `tab=""`. `books.find(...)` finds the Grades & Classes definition.

But `loaded` is still null. So `data` is null, `pages` is empty, and no active page exists yet. The selected definition is available before its records are.

The outer workspace receives `--book-accent: #8b413d`. The shelf button's `aria-pressed` becomes true. The left introduction changes to Grades & Classes, and the paper chooses its “Preparing your page…” branch instead of the welcome branch.

**These conditional elements: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:320), lines 320–348.**

No class list is invented to fill the gap. We see the book's loading state while the real request runs.

## 6. After the render, the book's load function is called

**Effect: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:240), lines 240–246.**

Unlike the initial library render, `book` now exists, so the first guard does not return.

`getSchoolId()` reads the stored school string `"7"`, parses it into number 7, and returns it:

**Getter: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:95), lines 95–100.**

The missing-school redirect is skipped. The effect sets up `cancelled=false`, then calls `book.load(7)`. Its `.then` and `.catch` callbacks wait for that Promise. The cleanup function can set `cancelled=true` if we leave this book before its request finishes; this prevents a late response from updating the wrong selection. It does not abort the HTTP request itself.

**The selected load definition: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:100), lines 100–102.**

It starts these three tasks using `Promise.all`:

```text
structure(7)
get("/schools/7/streams")
get("/schools/7/people")
```

`get` is your small wrapper around `api.get`; `base(7)` returns `"/schools/7"`:

**Wrappers: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:15), lines 15–16.**

The three tasks can overlap. It would be inaccurate to say their database queries must finish one after another. We will follow each task's own sequence, then meet again at `Promise.all`.

## 7. structure first asks for the school's grades

**Frontend: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:47), lines 47–51.**

The first `await` is `get('/schools/7/grades')`. The class requests on the next line cannot begin until this grade list arrives.

**API transport: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:174), lines 174–210 and [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:218), lines 218–230.**

As in Chapter 2, `api.get` calls `request`, which reads the in-memory access token and calls `fetch`. The request is approximately:

```http
GET /schools/7/grades HTTP/1.1
Host: localhost:3000
Origin: http://localhost:3001
Content-Type: application/json
Authorization: Bearer ACCESS_TOKEN
```

There is no JSON body. The 7 is in the URL. The access token identifies the caller; the URL chooses the requested school. The server must check that they agree.

CORS preflight may happen first. The common Express CORS/header/logger middleware from Chapter 2 applies. The login-attempt limiters do not match this path.

**Backend router order: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:70), lines 70–87.**

Earlier routers have no matching school-grades endpoint. Express reaches `gradesRouter`.

## 8. The grade router authenticates and authorizes the request

**Backend: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:12), lines 12–20.**

The `router.use('/schools/:schoolId/grades', ...)` prefix matches. Here `:schoolId` captures `"7"` as a string in `req.params.schoolId`.

Express runs `requireAuth` first:

**Authentication: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:33), lines 33–55.**

It extracts the Bearer token, verifies its signature/expiry with `jsonwebtoken`, selects the live person by ID 12 and school 7, checks activation, replaces the token's role with the live database role, attaches `req.caller`, and calls `next()`. This is the same real authentication work from Chapter 2, now for a different request.

Next comes `requireSchoolAdmin`, created earlier by `requireSchoolAdministration(["grades"], ["grades", "learners", "curriculum"])`.

**Authorization factory and returned middleware: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:4), lines 4–15.**

The factory's first array describes write capabilities; the second describes read capabilities. Calling the factory during server setup registered a middleware function. Now Express calls that returned async function with this request.

It calls `staffAccess(req.caller)`:

**Live access lookup: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:8), lines 8–18.**

As in Chapter 2, this queries the current person, administrative grants, and active school allocations. Our no-allocation example skips the chapter-assignment query. It returns `isPrincipal=true`, all principal capabilities, and school ID 7.

The middleware compares URL school 7 to access school 7. It chooses the read array because `req.method` is GET. Since this caller is a principal, the unassigned-capability rejection is skipped. It calls `next()`.

Back in the grade router's remaining inline middleware, `Number(...)` converts the school parameter, `Number.isSafeInteger` and the positive-number test pass, and the caller-school comparison passes. Another `next()` reaches the GET handler.

We have authenticated the caller, checked current authority, and checked the school scope. **None of these steps has returned the grades yet.**

## 9. The GET handler reads the school, then the grades

**Route handler: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:23), lines 23–27.**

It converts the parameter to 7 and calls `getSchoolById(7)`.

**Service: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts:33), lines 33–36.**

The service builds a Drizzle SELECT from schools where ID equals 7. Drizzle passes a parameterized command through the PostgreSQL pool. PostgreSQL returns the school's row; `[school]` takes the first result. The function returns that row instead of null, so the handler skips its 404 branch.

Now the handler calls `getGradesBySchool(7)` and waits.

**Service: [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts:14), lines 14–16.**

This SELECT reads grades whose school ID is 7, ordered by their grade number. The database returns five records in our example. This SQL ordering is by educational grade number, not arbitrary database ID.

**Schema: [Project-Edu-Revo/src/db/schema/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/grades.ts:9), lines 9–17.**

The schema maps JavaScript `schoolId` to SQL `school_id`. The rows already exist. Reading them neither provisions another set nor creates custom grades. The grade endpoints explicitly reject custom grade creation/deletion; we will create a **class within Grade 9** instead.

`res.json(...)` sends HTTP 200 containing the grade array. Here is a shortened illustration; real records also include their timestamps:

```json
[
  { "id": 71, "schoolId": 7, "number": 8 },
  { "id": 72, "schoolId": 7, "number": 9 },
  { "id": 73, "schoolId": 7, "number": 10 },
  { "id": 74, "schoolId": 7, "number": 11 },
  { "id": 75, "schoolId": 7, "number": 12 }
]
```

The frontend API helper receives 200, skips refresh/error handling, parses JSON, and resolves `get(...)`. We return to the waiting first line of `structure`.

## 10. structure now starts one class-list request per grade

**Continuation: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:48), lines 48–50.**

The frontend also sorts grades numerically. Then `grades.map(...)` calls `get` five times, building:

```text
/schools/7/grades/71/classes
/schools/7/grades/72/classes
/schools/7/grades/73/classes
/schools/7/grades/74/classes
/schools/7/grades/75/classes
```

`Promise.all(...)` waits for all five arrays. They can load in parallel. We will trace `/schools/7/grades/72/classes` completely; the other four follow the same procedure with another grade ID.

This request is GET with the bearer token, no body, and the same API helper/security transport described in step 7.

## 11. A class-list request passes the grades prefix before the classes router

This is an easy detail to miss when reading only `routes/classes.ts`.

**Earlier prefix: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:14), lines 14–20.**

`/schools/7/grades/72/classes` starts with `/schools/7/grades`, so the grade router's prefix middleware matches. The `requireAuth` → `requireSchoolAdmin` → school-check sequence from step 8 runs again for this new request.

The grade router has no exact GET endpoint for the full `/.../72/classes` path. It passes through to the application's later classes router.

**Classes prefix: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:31), lines 31–39.**

This prefix captures school `"7"` and grade `"72"`. It runs **another** `requireAuth` and **another** `requireSchoolAdmin`, then its own inline async middleware:

1. Convert the parameters to numbers.
2. Reject an invalid/nonpositive grade ID.
3. Check the school matches the caller.
4. Select grade ID 72 **and** school ID 7 from grades.
5. If no such grade exists, return 404. Our row exists, so call `next()`.

The following middleware requiring `/:classId` does not match this collection address; we have not requested a particular class.

**Exact GET: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:107), lines 107–130.**

This route declares `requireAuth` and `requireSchoolAdmin` again. They therefore run a **third** time on this one class-list request before the handler executes. The code currently repeats these guards; one verification does not automatically suppress the others.

Each authentication guard does its live person lookup. Each authorization guard calls the live `staffAccess` service with its database queries. This is actual repeated backend work, not three separate browser requests.

The final handler parses IDs, checks the school via `getSchoolById`, then calls `getClassesByGrade(72)`.

## 12. PostgreSQL builds the class-list response

**Service: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:90), lines 90–125.**

This query selects class details, stream IDs, optional manager names, and learner counts. Follow the important operations:

- `.from(classes)` starts with classes.
- A SQL subquery gathers the stream IDs linked to each class.
- `.leftJoin(learners, ...)` can attach learners while preserving a class with none.
- `.leftJoin(people, ...)` can attach the class manager while preserving an unassigned class.
- `.where(eq(classes.gradeId, gradeId))` limits results to grade ID 72.
- `count(learners.id)` counts actual joined learner IDs. A class without learners gets zero.
- `.groupBy(...)` groups joined rows back into one result per class and selected manager details.
- `.orderBy(classes.name)` orders the classes.

`sql` is Drizzle's SQL-template helper for expressions the query builder does not spell out as ordinary chained methods. Its values are still bound safely, rather than using string concatenation to build SQL commands.

In our example no classes exist in Grade 9. PostgreSQL returns zero rows. The route sends `[]` as JSON with status 200. An empty list is a successful answer, not a 404 or server failure.

The other four grade-class requests similarly return empty arrays. Back in `structure`, `Promise.all` yields `[[], [], [], [], []]`; `.flat()` combines these into `[]`. The function returns:

```js
{ grades: /* the five grade records */, classes: [] }
```

We have completed one of the three tasks that the book loader started. The Streams and People tasks must finish too.

With five grades, this initial load starts **eight feature GET requests** in total: one grade list, five class lists, one stream list, and one people list. That count excludes browser preflights, Next.js route payloads, and optional development/focus-related repeats. Repeated middleware checks happen inside those requests; they are not extra fetch calls.

## 13. The concurrent Streams task returns its array

**Backend prefix and route: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:28), lines 28–31 and [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:82), lines 82–100.**

For GET `/schools/7/streams`, Express reaches this router. Its collection prefix runs `requireAuth`, `requireSchoolAdmin`, and the caller-school comparison. Its exact GET repeats `requireAuth` and `requireSchoolAdmin`, then parses school ID 7, checks the school exists, and calls `getStreamsBySchool(7)`.

**Service: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:21), lines 21–23.**

The service selects streams where `streams.schoolId` equals 7. There are none in our example, so it returns `[]`, the handler sends JSON 200, and the frontend wrapper resolves with that array.

No stream membership is created and no class subjects are synchronized by this read. The array will be available later when the class's stream tools need it.

## 14. The concurrent People task returns staff display data

**Backend route: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:57), lines 57–64; capability configuration: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:19), line 19.**

GET `/schools/7/people` runs its `requireAuth` and `requireSchoolAdmin`, checks that school 7 exists, then calls `getPeopleBySchool(7)`.

**Service: [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:27), lines 27–63.**

This query deliberately selects display/account-status fields, not the entire people record. It also calculates administrative capabilities and counts of active teaching assignments. The joins/grouping preserve one result per staff member and the where clause restricts it to school 7. The results are ordered by surname.

For our scenario the array contains the principal row, including ID 12 and the name fields for Ms Demo Principal. It does **not** include the password hash. The route sends this array as JSON 200, and `api.get` resolves with it.

This is why the class-manager dropdown can have staff choices: they were loaded as part of the book, even before you open the create-class form.

## 15. The loader combines all results and stores them in React state

**Return to the waiting load: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:102), line 102.**

When all three top-level tasks succeed, their results occupy the corresponding array positions, regardless of which network request finished first. The destructuring names them `data`, `streams`, and `people`.

`return { ...data, streams, people }` produces:

```js
{
  grades: /* five grades */,
  classes: [],
  streams: [],
  people: /* staff display records */
}
```

`...data` copies the properties of the structure result into this object. It does not trigger another request.

**Back to the workspace effect: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:244), lines 244–246.**

The Promise resolves. We are still in this book, so `cancelled` is false. `setLoaded({ bookId: book.id, data, revision })` stores the result with book ID grades and revision 0. `setLoadError(null)` clears an old error. React schedules a new render.

If one required task had rejected, `Promise.all` would reject instead. The catch would store a load-error message, and the workspace's error branch would display it with Try again. The already-started sibling requests are not automatically cancelled by `Promise.all`.

## 16. The grade records become book pages

**Workspace derivation: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:224), lines 224–233.**

The loaded record matches the selected book/revision, so `data` is now the combined object. `book.pages(data)` runs.

**Page builder: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:103), lines 103–108.**

For each grade it constructs a **BookPage object**. Grade 9's object resembles:

```js
{
  id: "grade-72",
  title: "Grade 9",
  number: "2",
  kind: "grade",
  entity: { id: 72, schoolId: 7, number: 9, /* timestamp */ },
  children: []
}
```

`index` is 1 for the second array item; `String(index + 1)` becomes `"2"`. This explains why the page's printed number is 2 although the educational grade is 9.

`entity` carries the grade row for use when building content/actions. `children` would contain its classes, sorted by name; there are none yet.

**Type and helpers: [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:18), lines 18–26, [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:115), lines 115–117, and [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:122), lines 122–130.**

The interface describes the shape to TypeScript. It does not itself create DOM or store pages in PostgreSQL. The map creates the actual objects.

`flattenPages` recursively puts parents before children for Previous/Next order. `findPagePath` recursively finds a page plus its ancestors for breadcrumbs.

There is no selected `pageId`, so `flat.find(...) ?? flat[0]` chooses the first page: Grade 8. The URL still contains only `book=grades`; the fallback does not add a page parameter by itself.

## 17. The first page's view is built, then drawn

**View effect: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:249), lines 249–255.**

Now book, data, and page all exist. The effect calls `book.view` with school ID 7, the combined data, the Grade 8 page, empty tab, and the principal flag.

**Grade branch: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:109), lines 109–118.**

It reads `page.entity`, sees `kind="grade"`, filters this grade's classes, totals their learner counts, and returns a description plus a section. Here they are both zero. `classCommand(...)` creates the action description; it does not submit a class.

Because this branch is async, it returns a Promise even though it makes no new API call for a grade page. The workspace's `.then` stores the view with its matching keys. React renders again and can finally mount `WorkspacePage` for Grade 8.

**Renderer: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:118), lines 118–191.**

The title is taken from `page.title`; the description comes from `view.description`; the section title is Classes in this grade. With no rows, the renderer chooses the empty message and the create-class action. Other conditional branches—imports, custom content, tabs—do not produce controls for this grade page.

**Left contents: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:39), lines 39–46.**

The recursive component maps the five grade objects into buttons with their displayed numbers. Its active-page comparison gives Grade 8 `aria-current="page"` and the active CSS class. The cover is also active. Different comparisons control the active cover and the active page; they are not one shared CSS switch.

The desktop loading journey is now complete. We can choose Grade 9.

## 18. You click Grade 9 in the contents

**Button and supplied callback: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:39), lines 39–46 and [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:326), line 326.**

For this button `page.id` is `"grade-72"`. Its click calls the `onNavigate` prop with that string. The prop is a function the workspace supplied:

```tsx
id => navigate(book!.id, id)
```

The resulting call is `navigate("grades", "grade-72")`. The exclamation mark after `book` is a TypeScript assertion, not an instruction to load it again.

In `navigate`, an explicit page was supplied, so the per-book memory lookup is skipped. It builds book=grades and page=grade-72. The page-turn distance uses the flattened indices: Grade 8 was index 0; Grade 9 is index 1. `turn(1)` performs the same presentation work from step 4. The route push produces:

```text
http://localhost:3001/dashboard/principal?book=grades&page=grade-72
```

The search state is cleared. React renders with the new query. `book` and its loaded data are unchanged, so the load effect's book/revision dependencies have not changed. It does **not** fetch the whole book again for this page click.

`page` becomes the Grade 9 object. `findPagePath` returns just that page. `index` becomes 1. The old Grade 8 view does not match the new page key, so the workspace waits for the new view instead of displaying Grade 8 content under a Grade 9 title.

The view effect calls the same grade branch with entity ID 72 and grade number 9. It filters the existing in-memory class array and returns the Grade 9 description, section, and create-class action. No new database call is required by this grade branch.

When that Promise resolves, the keyed view state updates and `WorkspacePage` renders Grade 9.

## 19. This is what makes Grade 9 appear the way it does

**Header and body renderer: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:158), lines 158–188.**

`<h1>{title}</h1>` receives `"Grade 9"`. There are no tabs, imports, or title actions in this particular view. The description says Grade 9 has 0 classes with 0 learners enrolled. The bold numbers come from the registry's `figure` helper, which uses React's `createElement("strong", ...)`:

**Description helpers: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:26), lines 26–27.**

The section renderer puts Classes in this grade and a count of 0 on the same heading row. Its action array contains the class-creation command. With an empty row list it displays “No classes yet. Create the first class here.”

**CSS: [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:79), lines 79–90, [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:93), lines 93–96, and [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:109), lines 109–111.**

The heading is sticky within the paper scroller. `top: 0` and an opaque paper background let it remain readable while content scrolls below it. Its h1 uses Georgia at 28 pixels in the base rule. The section's flex layout aligns its children, and the action group's automatic left margin pushes the button towards the end of the row.

The create button's background comes from `--book-accent-solid`, derived from the open book's `#8b413d`. It is not a colour hardcoded separately in the Grade 9 action.

The breadcrumb uses the selected book title plus the selected page path. It now reads Grades & Classes / Grade 9. The footer uses `page.number`, so it identifies Page 2. The contents comparison moves its active highlight to grade-72.

The location-memory effect from Chapter 2 saves the current safe URL under this account's last location and grades-book location. That is a browser preference write, not a school-data update.

## 20. You click Create a class in Grade 9

**Action rendering and dispatch: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:141), lines 141–145 and [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:151), lines 151–157.**

The section's command was passed into `contextAction`. That rendered a `MobileAction` button with an `onClick` callback that calls `activate(action)`.

**Shared button: [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:42), lines 42–47; label-to-icon helper: [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:7), lines 7–14.**

The action label begins with Create, so `actionIconFor` returns add. `MobileAction` uses that to supply a plus SVG and accessible label. Desktop styling hides the icon; phone styling can show the icon alongside the label for an important create action. The component forwards the click prop to its actual `<button>`.

Back in `activate`, this command has no `pageId`. Therefore it calls `onCommand(action)`, which the parent supplied as `setCommand`.

React stores this command object in workspace state. The address stays on the Grade 9 page. No class has been created and no POST has been sent yet.

**Parent conditional: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:358), line 358.**

On the next render, `command` is truthy, so React mounts `CommandDialog` above the workspace.

## 21. The command describes a form; CommandDialog creates its elements

**Command builder: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:57), lines 57–73.**

This builder had received school 7, the book data, the Grade 9 row, and no existing class. Because `cls` is undefined, it supplied a Create label and empty starting values.

Its fields are descriptions of controls:

```text
label           → Class label (for example A); required
classTeacherId  → Class manager; optional dropdown
description     → Description; optional textarea; at most 200 characters
```

**Field helpers: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:21), lines 21–22; option formatting: [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:142), line 142.**

`text(...)` returns a plain object. `select(...)` adds type=select and uses `optionsOf` to convert people into `{ value, label }` choices. For our principal, the option value is string `"12"`; its label is built from their title/first name/surname because that people row has no `name` property.

These objects are not HTML inputs yet. The renderer converts them into elements.

**Dialog setup and markup: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:68), lines 68–75 and [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:94), lines 94–111.**

The component creates state for busy=false, error="", selection={}, and a submitting ref=false. `useModalMotion(onDismiss)` supplies the dialog ref and close callback. `onDismiss` is the parent's function that will clear command state.

The returned form maps fields to controls. Label gets an `<input name="label">`. Class manager gets `AppSelect name="classTeacherId"`. Description gets a `<textarea name="description" rows={5} maxLength={200}>`. The `name` attributes will be the keys when the form is collected.

There is no custom renderContent or confirmation text on this command. The footer displays Cancel and Save because `command.run` exists.

After React commits the DOM, the effect calls `showModal()` and `lockModalScroll()`. The shared dialog CSS/motion from Chapter 2 gives it paper styling, backdrop, and the entry animation. The form is now usable.

## 22. The class-manager chooser mounts, but we leave it untouched

**Custom chooser: [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:22), lines 22–51.**

`AppSelect` receives the staff options and an empty default value. Its internal selection starts as `[""]`. `readOptions` walks the supplied option elements and produces option objects; `textOf` extracts their text:

**Option readers: [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:9), lines 9–19.**

The visible summary is “Choose an option”. A hidden native select preserves the named form value. The visible button uses combobox/listbox accessibility attributes and `type="button"`, so clicking that chooser would not submit the whole class form.

`open` starts false, so `SelectPanel` is not mounted. Its placement, search, backdrop, and choosing code do not run just because the parent form is open. We are leaving the manager blank for this example, so this remains true throughout this chapter.

The hidden select's value is empty. That will later become a null class-manager ID in the JSON payload.

## 23. First, try saving with an empty class label

You click Save before filling Label. The label input has `required=true`, so the browser's native form validation stops submission. Normally the submit handler is not called at all for this empty required field; the browser points out the missing value.

**Required attribute and submit attachment: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:95), lines 95–110.**

There is also a required-field check inside `submit`, which would return with “Class label (for example A) is required.” if the submission reaches it with a blank/whitespace value after trimming. The browser's empty-field check and your JavaScript check are different layers.

There is no POST and no SQL INSERT. Seeing a form and clicking a button does not mean the database has been contacted.

## 24. Now type a label that the backend will reject

Type `123` into Class label and `Morning class` into Description. Keep Class manager empty. We intentionally start with a nonempty but invalid label to follow a backend error all the way home.

These input/textarea controls use `defaultValue`, not a React-controlled `value` tied to state. The browser's form elements hold the text as you type. There is no `setLabel` on each keystroke in this dialog. Nothing is sent to the server yet.

Now click Save.

**Submit handler: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:79), lines 79–94.**

The browser sees a nonempty required label and permits submission. React calls `submit(event)`.

Follow its statements:

1. `event.preventDefault()` stops a normal browser form navigation.
2. `command.renderContent` is absent, so its early return is skipped.
3. `submitting.current` is false, so the duplicate-submission return is skipped.
4. `new FormData(event.currentTarget)` collects named controls from this form, including the hidden select.
5. `Array.from(...entries())` gives key/value pairs; `.filter` keeps string values; `Object.fromEntries` turns them into an object.
6. The field loop trims each value. The label contains `123`, so the required check passes.
7. It sets the submitting ref to true, busy state to true, and clears the error.
8. Inside try, it calls `command.run(values, formData)` and awaits its result.

For our example, values are:

```js
{ label: "123", classTeacherId: "", description: "Morning class" }
```

`FormData` here is a browser way to collect the form. It does **not** mean we upload multipart data: the next function deliberately turns these values into a JSON request.

React can show Saving… and disable relevant controls while the asynchronous work waits. The ref changes immediately, so another submission cannot slip in merely because a React busy render has not painted yet.

**We leave submit waiting at `command.run`.**

## 25. The command constructs a class name and POST payload

**Run function inside classCommand: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:63), lines 63–71.**

Follow the `run` inside `classCommand`, not the similar run functions for other features.

It still has access to the school/data/grade values from when the command object was created. This is a **closure**: an inner function can use values from its surrounding function even after that surrounding call returned its object.

`grade.number` is 9. Trimming and uppercasing `"123"` leaves `"123"`. The template expression produces `name="9123"`.

The frontend duplicate check scans `data.classes` for a same-grade, same-name class, excluding the edited class if any. Our list is empty, so it does not throw.

The path becomes `/schools/7/grades/72/classes`. The payload becomes:

```json
{ "name": "9123", "classTeacherId": null, "description": "Morning class" }
```

`Number("")` is 0; `|| null` converts that to null for the unselected manager. The nonempty description stays a string. There is no streamId or academicYear in this payload.

Since `cls` is absent, the create side of the conditional executes: `api.post(path, payload)`. The edit/PATCH side does not run.

The shared API helper stringifies the body, attaches Content-Type/Authorization, sends POST to port 3000, and awaits the response. We now cross into Express.

## 26. The create request passes its security and parent checks

**Earlier grades prefix: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:14), lines 14–20. Classes prefix: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:31), lines 31–39. Exact POST: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:67), lines 67–103.**

The common middleware parses the JSON into `req.body`. As with the class-list GET, the grades prefix first runs authentication/live administration checks and school validation. The classes prefix then repeats authentication/administration, validates grade 72 in school 7, and calls next. The exact POST repeats authentication/administration a third time.

For these POST authorization calls, `requireSchoolAdministration` chooses its **write** array, `["grades"]`, rather than its GET read array. Our live principal is permitted. The class-ID middleware still does not match because we are creating in the collection, not updating `/:classId`.

Inside the POST callback, `parseInt` produces school 7 and grade 72. Invalid-ID branches are skipped. `getSchoolById(7)` queries the school and returns it, so the missing-school branch is skipped too.

Then `createClassSchema.safeParse(req.body)` runs.

**Zod schema: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:45), lines 45–51.**

It checks that name is a nonempty string, optional IDs have valid numeric shapes when present, and description is trimmed and at most 200 characters. It allows a nullable manager. Our `"9123"` name passes this schema because the schema does not check its letters-only class-identifier rule.

That rule lives in the service. The route calls `createClass({ gradeId: 72, ...result.data })` and waits.

## 27. createClass reads the grade, then rejects the label

**Backend service: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:71), lines 71–87.**

The input is now:

```js
{ gradeId: 72, name: "9123", classTeacherId: null, description: "Morning class" }
```

It selects the grade by ID 72. The route already checked ownership; this service reads the grade again because it needs its number for name normalization. PostgreSQL returns Grade 9.

Next it calls `normalizeClassName("9123", 9)`.

**Normalizer: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:37), lines 37–50.**

The helper trims whitespace, removes an optional Grade prefix, removes the leading grade number 9, removes remaining whitespace, and uppercases the identifier. Here the identifier becomes `"123"`.

`/^[A-Z]+$/.test(identifier)` is false: digits are not letters A–Z. It throws an `InvalidClassNameError` with:

```text
Class identifier must be letters only, for example 9A.
```

Throwing interrupts the normal sequence. `ensureUniqueClassName` and the transaction are **not** reached. No class row has been inserted.

## 28. The error returns to the still-open form

**Backend catch: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:92), lines 92–102.**

The error is not a duplicate-name error. The `InvalidClassNameError` branch matches and sends HTTP 400:

```json
{ "error": "Class identifier must be letters only, for example 9A." }
```

**Frontend error handling: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:121), lines 121–124 and [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:90), lines 90–93.**

The fetch response is not ok. It is not a 401 requiring session renewal. `parseError` reads the JSON and throws a JavaScript Error with that message.

That rejects `api.post`, which rejects `command.run`, which throws at submit's await. Its catch stores the message in error state. Finally sets submitting=false and busy=false.

On the next render, the error paragraph appears inside the form, Save is available again, and the form remains open. `onSaved` and `onClose` did not run because the earlier await failed. The browser-held input values remain in place; you can correct them.

We have now followed a wrong input all the way from a click, through a request and database read, back to an understandable UI response.

## 29. Correct the label to A and save again

Replace `123` with `A`. Leave Description as Morning class and Class manager blank.

The same submit sequence gathers/trim-checks values, guards duplicate submissions, marks busy, and calls the command. This time its name expression produces `"9A"`.

The JSON request is:

```http
POST /schools/7/grades/72/classes HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer ACCESS_TOKEN

{"name":"9A","classTeacherId":null,"description":"Morning class"}
```

The repeated middleware/route sequence from step 26 runs for this new request. All checks and Zod validation pass. The service reads grade 72, then `normalizeClassName("9A", 9)` returns `"9A"`: after removing the leading grade number, the remaining identifier A passes the letters test.

**Next service call: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:55), lines 55–66.**

`ensureUniqueClassName(72, "9A")` SELECTs matching class IDs for that grade/name. None exists. Its `.find` returns undefined, so it does not throw `DuplicateClassNameError`. The Promise resolves and createClass continues after its await.

## 30. The service starts a database transaction and inserts the class

**Transaction: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:78), lines 78–86.**

Follow the transaction inside `createClass`.

`db.transaction` asks Drizzle/the driver to run the callback using one transaction. `tx` is the transaction-scoped database object supplied to that callback. Commands using it belong to this transaction rather than separate independent pool operations.

First it executes `select pg_advisory_xact_lock(7411, 0)`. This is PostgreSQL's transaction-scoped advisory lock used by related school-workflow operations in this app. Operations that take the same lock coordinate with each other; it is not a magic lock on every unrelated query in the database. It is released at transaction end.

`data.streamId` is absent, so the optional stream row-lock query is skipped.

Then:

```ts
const [cls] = await tx.insert(classes).values({ ...data, name }).returning();
```

This sends the INSERT. `...data` supplies grade ID 72, null manager, and description; `name` supplies the normalized name. `.returning()` asks PostgreSQL for the inserted row. `[cls]` takes it from the returned array.

**Class schema: [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:11), lines 11–25. Year migration: [Project-Edu-Revo/src/db/migrations/0026_school_workflows.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0026_school_workflows.sql:1), lines 1–3. Unique-name migration: [Project-Edu-Revo/src/db/migrations/0012_unique_class_names.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0012_unique_class_names.sql:1), line 1.**

These existing database definitions explain the values/constraints:

- The serial primary key generates an ID; imagine it is 501.
- grade_id points to the existing grade row 72.
- name stores 9A.
- class_teacher_id is null because no manager was chosen.
- stream_id and stream_configuration are null because no stream was assigned.
- stream_revision defaults to 0.
- academic_year defaults from the database's current date; assume 2026 here.
- created_at defaults to the database's current timestamp.
- The grade/name unique constraint rejects a second identical name within that grade.

Those migration files are not being executed on this click. They explain the table the already-running database is enforcing.

We are not finished: createClass calls `syncClassSubjects(tx, 501)` before the transaction can commit.

## 31. The new class's subject setup is checked inside that transaction

**Synchronization function: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:19), lines 19–47.**

This function receives the **same tx** plus new class ID 501. So it can see the uncommitted new row and any failure can roll back the whole creation.

It takes the same advisory lock, selects class 501 `for('update')`, and selects its grade. Both exist. The stream-ownership lookup is skipped because streamId is null.

It then calls `streamOptions(tx, 501)`.

**Called helper: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:9), lines 9–21.**

That helper selects class 501 and its class_streams links. There are no links; its fallback to the legacy streamId also has nothing to add. Because the stream ID array is empty, the joined stream/subject query is skipped.

Its map/union/filter calculations produce empty options/common/different arrays and split=false. It returns that configuration to `syncClassSubjects`.

Back in synchronization, the desired subject list and wanted set are empty. It SELECTs existing class_subjects rows for class 501; there are none. Consequently:

- The loop updating existing allocations runs zero times.
- The loop adding desired allocations/chapters runs zero times.
- No subject, chapter, or teacher allocation is invented for this unassigned class.

The async function finishes. We return to createClass's transaction callback, which returns cls. Drizzle commits the successful transaction, releases the lock, and resolves the outer Promise with the inserted class.

If a database operation had failed, the transaction would roll back instead. A generated sequence value can still be consumed during failed inserts; IDs do not promise gap-free numbering. The book's displayed page numbering is unrelated to that sequence.

## 32. The route sends 201; the frontend receives the saved class

**Route continuation: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:89), lines 89–91.**

The waiting await now yields the inserted row. `res.status(201).json(cls)` sends Created plus JSON. A shortened response is:

```json
{
  "id": 501,
  "gradeId": 72,
  "name": "9A",
  "classTeacherId": null,
  "description": "Morning class",
  "streamId": null,
  "streamRevision": 0,
  "streamConfiguration": null,
  "academicYear": 2026
}
```

The actual row also includes createdAt. The response is the class row, not a JSX page or DOM fragment.

`request` accepts status 201 as ok, parses JSON, and resolves `api.post`. In `classCommand.run`, the returned object becomes saved. Its last statement returns the string `"class-501"`.

**Frontend return: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:68), lines 68–70.**

This string is an internal page identity. It is not another class inserted into the database.

## 33. Submit receives the page ID and asks the workspace to refresh

**Return to submit: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:90), lines 90–93.**

`pageId` becomes `"class-501"`. Now the next await runs: `onSaved(pageId || undefined)`.

The parent supplied `refresh` as that prop:

**Refresh function: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:315), lines 315–318.**

`refresh("class-501")` sees a selected book, so it calls `navigate("grades", "class-501")`. That builds the destination URL and starts the optional visual turn. It then increments revision with `setRevision(value => value + 1)`.

This is a React data-reload counter, not the class's database streamRevision. Our workspace revision changes from 0 to 1.

Although `refresh` is async, it does not await the HTTP book reload. It schedules navigation/state updates and returns. Therefore submit's `await onSaved(...)` waits for that scheduling function, **not for the entire refreshed book to finish loading**.

Next submit calls `onClose()`. The motion hook keeps the dialog briefly mounted during its exit, marks it inert, and eventually calls the parent's onDismiss, which sets command=null. The dialog unmount cleanup closes it and releases the scroll lock. Finally the submit handler clears its busy/submitting state.

**Motion close: [nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:19), lines 19–37.**

With reduced motion, dismissal can happen immediately. With motion enabled, the close delay is 140 milliseconds. We do not delay the database write to make the animation work; the save already succeeded.

## 34. The book reloads, and page numbers are recalculated

**Reload guard and callback: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:240), lines 240–246.**

The effect depends on book and revision. Revision changed, so it calls the grades book's load function again. The old loaded object has revision 0; it no longer counts as current data for revision 1.

The loader repeats the network sequence from steps 6–15: grades/streams/people, then class lists after grades arrive. These are real new reads. We do not merely append a fake class tile to old state and hope it matches the database.

This time `getClassesByGrade(72)` returns the saved class with manager-display fields, `streamIds: []`, and `learnerCount: 0`. The other grade class lists remain empty.

When the new combined data is stored with revision 1, the page builder runs again. Grade 9's children now contain:

```js
{
  id: "class-501",
  title: "Grade 9A",
  number: "2.1",
  kind: "class",
  entity: /* class 501's returned record */,
  children: [{
    id: "import-501",
    title: "Bulk import learners",
    number: "2.1.1",
    kind: "import",
    entity: /* the same class record */
  }]
}
```

**Display-name helper: [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:132), line 132; numbering builder: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:103), lines 103–108.**

`classLabel` adds Grade before the stored 9A because the stored name does not already start with Grade. Child index 0 gives 2.1. Its fixed import child gets 2.1.1. `flattenPages` now includes both children in reading order.

Nobody created a separate `class-501/page.tsx` file. The saved database row caused the registry to produce new page objects. That is what “a page is created dynamically” means in this implementation.

The query selects class-501, which now exists. Breadcrumb ancestors are Grade 9 and Grade 9A. The contents gains the class/import children, and the footer can show Page 2.1.

## 35. The new class page needs one more request: its learners

**Class view branch: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:118), lines 118–124.**

The view effect calls book.view again, now with kind=class. The import/grade branches are skipped. `entity` is class 501.

It finds grade 72 in the data, finds no manager because classTeacherId is null, builds `/schools/7/classes/501`, and checks whether tab is subjects. Our URL has no tab, so that check is false. It calls:

```text
GET /schools/7/classes/501/learners
```

The shared API helper attaches the bearer token and sends it. Unlike `/schools/7/grades/72/classes`, this address does not start with the grades prefix, so it does not run that grades-router chain.

**Learner collection route: [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:69), lines 69–82.**

The matched route runs requireAuth and the live school-administration check permitting learners/grades administration. It parses school 7/class 501, joins classes to grades to verify this class belongs to this school, checks the school exists, then calls `getLearnersByClass(501)`.

**Service: [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:34), lines 34–41.**

The query selects learner display/status fields, joins their current class, and optionally joins current-year/current-revision stream choices and their stream names. It filters by class 501 and orders by surname. Password hashes are not selected.

There are no learners yet, so PostgreSQL returns `[]`. The handler sends JSON 200. The frontend parses it, and the class-view function resumes with `items=[]`.

## 36. The class view describes its controls; React renders the final screen

**Final view object: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:135), lines 135–154.**

For this class's default Learners tab, the returned view has:

- A guidance sentence pointing to the Subjects tab.
- No-manager description.
- Edit class and Delete class title actions.
- Learners and Subjects tabs.
- A Class register section with no rows, Add learner, and a Bulk import learners alternative.

The Move learners action is absent because `items.length` is zero. Split-choice reset actions have no learner rows to attach to. The stream-management command is prepared in this view function, but it is not an action displayed in the selected Learners section.

The view Promise resolves. The workspace stores it under the class/revision/tab key and mounts or updates `WorkspacePage` with title Grade 9A.

**Renderer: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:158), lines 158–188.**

The title row now includes the tabs and actions. `tab || view.tabs[0].id` evaluates to learners, so Learners has `aria-pressed=true`. The shared `MotionTabs` measures the selected button after layout and places the coloured indicator under it; `MotionPanel` can animate content entry unless reduced motion is requested:

**Motion components: [nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:13), lines 13–36 and [nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:37), lines 37–48.**

The section's empty branch displays “Your class register is empty. Choose Add learner or Bulk import learners to get started.” It does not present a server failure, because the empty learner list was a valid response.

The active cover remains Grades & Classes. The active contents entry is now Grade 9A. The URL identifies book grades and page class-501. The displayed numbering is 2.1. The new class is persisted in PostgreSQL; these UI descriptions are derived from it.

**We have reached the end state promised at the start.**

## 37. Before moving on: what if A already existed?

This is a separate short replay, not an extra class we create after step 36.

If you had opened the create-class dialog when the current book data already contained 9A, `classCommand.run` would produce name 9A, find a same-grade match, and throw “That class already exists in this grade.” **before api.post**. The submit catch would show that message with no POST.

If the frontend data were old and missed another principal's newly created 9A, the POST could still reach `ensureUniqueClassName`. That function would find the matching row and throw DuplicateClassNameError. The route's known-error catch would respond 409; the frontend would display the returned message.

The database unique constraint is an additional safeguard if overlapping requests get past the earlier lookup. The current create route only translates its named DuplicateClassNameError and InvalidClassNameError; it does not explicitly translate a raw database uniqueness exception into the same friendly 409. So **duplicate storage is prevented**, but we should not claim every timing-related duplicate failure has an equally polished message. This chapter documents that distinction without changing the code.

Likewise, this example leaves manager null. The class schema has a foreign key to people, but that by itself does not prove a manager is from the same school. We will inspect the real manager-edit checks when we cover that action; we should not invent a check that this create path did not run.

## 38. How the same journey differs on a phone or portrait tablet

The backend calls, input rules, transaction, and page-object numbering remain the same. Responsive presentation changes what stays visible around them.

**Mode selection and automatic contents introduction: [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:15), lines 15–22 and [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:67), lines 67–84.**

On compact screens, selecting the grades book changes bookTitle from undefined to Grades & Classes. Once the wrapper has the real viewport mode, its effect schedules two animation-frame callbacks, records the book title, and opens the contents drawer for this newly opened book. It can introduce the pages while book data is still arriving; the list fills when the page objects are available.

The effect deliberately does not repeat this introduction for an ordinary page change or rotation of the same book. On phone, choosing Grade 9 in the drawer also runs the wrapper's capture handler, which closes the contents drawer. The workspace then becomes the main visible surface.

**Drawer styles: [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:29), lines 29–59. Portrait paper/panels: [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:92), lines 92–98.**

Phones use the width for the page. Portrait tablets retain centred paper with margins and binding, while drawers float above a darkened background. The wrapper also handles inert regions and focus trapping while a drawer is active; this is the same component introduced in Chapter 2, responding to an actual open menu now.

**Phone action treatment: [nedecen-web/src/components/shared/mobile-action.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/mobile-action.module.css:3), lines 3–12.**

Create/add actions retain text with the plus icon. Familiar edit/delete actions can become compact icons with accessible labels. The underlying onClick still dispatches the same command; changing the visual content does not create a different save endpoint.

We have not added any mobile-only database rule. A class created on a phone is the same class a principal would see on PC.

## Where we stop

You are on Grade 9A's Learners tab. The class row exists; no stream, learner, or teaching allocation has been added. You now know why its contents entry appeared, why its page number is 2.1, how the request and response travelled, and what made the error message and final controls render.

The next chapter can start with **Edit class** from this exact state. We will follow renaming/managing a class and the deletion rules separately, without repeating an entire book's initial load unless the code actually runs it again.
