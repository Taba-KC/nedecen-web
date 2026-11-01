# Chapter 6 - Assigning the Biology stream to Grade 9B

**Starts:** Grade 9B is open on Learners, showing the five imported learners and class manager Mr Kgodiso Taba. The principal clicks **Subjects**, then **Manage streams**.

**Ends:** Biology is saved as the class's stream. The Subjects tab displays **BIOLOGY STREAM** and three subject rows: English Home Language, Life Sciences and Physical Sciences. Each has **No teacher assigned**, **Assign teacher**, and **Curriculum**.

This lesson follows the current source and your five screenshots. I have not changed the running school's data to produce it. The screenshots show the states reached; the source tells us how those states are produced. They do not reveal exact request timings or database ids that are absent from the screen.

As before, **S** means the actual school id. Class **179** is visible in your URL. I will use **B** for Biology's stream id, **SC** for Science's stream id, and **E**, **L**, **P** for the three subject ids. These letters are explanatory placeholders, not literal strings sent to the API.

The word **stream** here means a school subject bundle. It does not mean a JavaScript stream of bytes, a video stream, or a network connection. The Biology bundle in your screenshots contains the three subjects listed above. The principal is assigning an existing bundle to a class, rather than creating the subject definitions in this task.

## 1. The already-rendered starting screen

![Screenshot 1 - Grade 9B before opening Subjects](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-6-01-start.png)

The URL is:

~~~text
http://localhost:3001/dashboard/principal?book=grades&page=class-179
~~~

There is no tab parameter, so this page currently uses its first tab, Learners.

The class register contains the five learners from Chapter 5. Their Setup pending badges concern account setup; they do not stop a principal from configuring class subjects.

The following code supplied the controls at the render that produced this starting screen. Looking at the page does not execute their click handlers again.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 135 - 152)

The class view describes its guidance, class-manager paragraph, top actions, tabs, and section.

Its tabs array contains two objects:

~~~ts
[
  { id: "learners", label: "Learners" },
  { id: "subjects", label: "Subjects" }
]
~~~

An array literal stores a sequence of values. Each object has an internal id and a visible label. Those ids let the program choose behavior without comparing the screen's typography or coordinates.

At this point the learner branch supplied **Class register**, Add learner, Bulk import learners and Move learners. The subject branch exists in the same view function, but its subject request has not run just because the Subjects button is visible.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 164)

WorkspacePage maps the tabs array into real HTML buttons inside MotionTabs.

Each button has type="button". This prevents it acting as a form-submit button. aria-pressed reports which tab is active to assistive technology.

The click handler is an arrow function. For the first tab it passes undefined; for the second it passes that tab's id. Therefore clicking Subjects calls:

~~~ts
onTab("subjects")
~~~

Supplying the arrow function during rendering registers it for a future click. It does not invoke onTab while the button is being created.

## 2. Clicking Subjects updates the URL

The browser determines which button received the pointer click. React invokes the callback associated with that button. Our application does not manually poll mouse coordinates in a game-style loop.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 341 - 341)

The parent supplied onTab as a callback that calls navigate with the existing book id, the existing page id, and the new tab id.

So the destination is still book grades and page class-179, with tab subjects added.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 310)

navigate constructs URLSearchParams, sets book/page/tab, and calls the Next.js router's push method with scroll: false.

URLSearchParams is a browser utility for handling the query string after ?. router.push performs client-side navigation and adds a history entry.

The result is:

~~~text
/dashboard/principal?book=grades&page=class-179&tab=subjects
~~~

The function clears the page's search query as part of navigation.

Its explicit page-turn condition checks whether the book or page changes. Here both stay the same, so switching this tab does not take that explicit book-page turn branch.

There is also no pending import change left from Chapter 5's completed return. The import-change check does not trigger another full book reload for this click.

The URL change selects a view. It is not the backend subject-list request itself.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 198 - 209)

The workspace reads the new search parameters. tab now contains the string subjects.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 237)

The loaded book data still belongs to this book and revision. The same class page remains selected.

pageKey includes the book, page and data revision. viewKey also includes the selected tab. This distinction lets the workspace keep the current page surface while recognizing that the view needs updating.

The old view can remain temporarily mounted while viewStale is true. The app does not treat its old learner rows as a completed Subjects response.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 168 - 171)

While the new view is stale, the component can announce **Updating page content…**. The panel receives aria-busy and inert.

inert prevents interaction with the stale panel's contents. This avoids operating old row controls as though they belonged to the new tab.

The header's active-tab state can update before the subject data arrives. React rendering and an asynchronous HTTP request are separate pieces of work.

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 13 - 33)

MotionTabs uses a ref to its DOM element and a layout effect to find the button whose accessibility state marks it selected.

It reads the selected button's offsets/dimensions and writes CSS custom properties for the moving tab indicator. ResizeObserver, a browser API, remeasures when relevant elements resize. Cleanup disconnects that observer.

This explains how the selected-tab highlight follows the actual button. It does not select the subject data or query PostgreSQL.

## 3. The view function requests Grade 9B's subjects

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

The changed tab is a dependency of the view effect. The effect calls book.view with schoolId, book data, selected page, tab and the principal-access flag.

A promise represents the result that will become available later. The .then callback stores the view when it resolves; a cancellation flag prevents an obsolete result replacing a newer page.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 118 - 122)

The registry finds the class's grade and manager, builds the class path and evaluates:

~~~ts
const subjectsSelected = tab === "subjects";
~~~

const declares a binding that cannot be reassigned. === performs a strict equality comparison; it does not assign a value. The comparison produces true here.

The conditional expression chooses the endpoint ending in subjects rather than learners:

~~~text
GET /schools/S/classes/179/subjects
~~~

await suspends this async function until the request resolves. It does not freeze the entire browser or stop all other events.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 15 - 16)

The registry's get helper calls the shared api.get function. base constructs the school-prefixed path.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 6 - 6)

API_BASE uses the configured backend address, with http://localhost:3000 as its fallback.

Your UI is on localhost:3001. A port identifies a listening service on a computer, so these can be separate frontend/backend services on the same machine.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 224)

api.get delegates to the JSON request helper. The helper reads the current access token and calls fetch with method GET, applicable credentials/cookies, an Authorization bearer header when a token exists, and its shared Content-Type header.

The relevant request is conceptually:

~~~text
GET http://localhost:3000/schools/S/classes/179/subjects
Authorization: Bearer <current access token>
~~~

There is no submitted learner spreadsheet or subject body in this GET. A different backend environment setting changes the address, not the purpose of the request.

The browser may make a CORS preflight for a cross-origin request with these headers, unless a suitable preflight result is cached. That browser check asks whether the frontend origin is permitted; it is not a subject write.

The helper has token-refresh/retry handling for expired sessions. We follow the retained valid principal session here, so we do not invent another login.

## 4. The backend verifies the request and reads subject allocations

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

Express receives the request. Its application middleware handles CORS, response headers, applicable body parsing, and request logging.

A GET without a JSON body has no subject payload for express.json to parse. The logger records the method/path and calls next to continue.

These middleware registrations were made when the server started. On this request the registered functions execute; the server does not restart.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 87 - 87)

The mounted classSubjectsRouter handles the matching class-subject path.

(File: [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts), lines 15 - 25)

Its prefix middleware runs requireAuth and school-administration access checking, validates school/class ids and checks that class 179 belongs to school S through its grade.

The ownership query uses an inner join: it matches a class to its grade so the school's id can be checked.

A valid numeric class id alone would not establish school ownership.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

requireAuth reads the bearer token and verifies it with the JWT library, using the configured secret and permitted algorithm. For a staff account it also reads the current staff record and requires account setup still to be valid.

It attaches caller information to the request and continues on success. An expired/invalid token or unavailable staff account stops this operation before the subject listing.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

The administration middleware obtains current access, requires the requested school to match, and chooses the permitted read capabilities for GET.

The principal passes its isPrincipal check. Authorization runs on the server even though the UI also decides which controls to display.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 17)

staffAccess reads the current person, grants and teaching-assignment information. It returns isPrincipal, capabilities, schoolId and teaching access. These reads keep permission decisions tied to current records rather than trusting an old button or role label in the browser.

The query and access-check sequence is repeated on protected requests as appropriate; opening one tab does not permanently authorize future requests.

(File: [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts), lines 17 - 30)

After those middleware calls succeed, the route's own parameter/ownership checks finish and next passes control to the GET handler. That handler calls getClassSubjects.

The authentication references above explain the middleware invoked by this route; they do not mean authentication happens after an unauthorized subject query.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 62 - 69)

getClassSubjects builds a Drizzle SELECT of class-subject allocation ids, subject names, teacher ids and optional teacher names.

The query joins class_subjects to subjects, classes and grades, then left-joins people for a teacher. A left join preserves an allocation even when personId is null.

Its WHERE conditions restrict the school/class and require active=true. Its ORDER BY sorts by subject name.

(File: [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts), lines 17 - 26)

Drizzle uses the existing PostgreSQL connection pool. Its builder calls produce SQL that the database driver sends to PostgreSQL.

PostgreSQL performs the SELECT and returns rows. The connection pool was initialized earlier; looking up a subject does not create a new database server.

At this starting point the response is an empty array, consistent with the zero count in your next screenshot. This read does not automatically assign a stream or synchronize subjects.

(File: [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts), lines 29 - 30)

res.json serializes the array into a JSON response.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 205 - 211)

The shared helper checks success and parses the JSON response into JavaScript values. Execution can now resume after the registry's await.

## 5. The empty Subjects view is rendered

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 123 - 143)

The registry looks for the class's stream in its already-loaded school stream data. No stream is assigned yet.

It constructs an assignStream command with label **Manage streams**, title **Class streams and subject split**, content describing a ClassStreamsEditor element, and a run callback for a later save.

createElement is React's function for describing an element. Creating an element description in this view does not yet mount its editor, run its useEffect, or send the editor's stream-detail requests. That happens when the command dialog actually renders the content.

The subject branch returns:

| Part of the view | Value at this stage |
| --- | --- |
| Guidance | No stream has been assigned yet. Manage streams to assign subjects to this class. |
| Manager | Class manager: Mr Kgodiso Taba |
| Tabs | Learners and Subjects |
| Section | Subjects & teachers |
| Row count | 0 |
| Section action | Manage streams |
| Empty text | Assign one or more streams to bring subjects into this master class. |

The command's save body is registered here, but it has not run. **Manage streams** opens a configuration form; merely rendering it does not PUT anything.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

The effect stores the completed view. Its key now matches the Subjects view key, so the stale state clears.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 171 - 185)

WorkspacePage renders the guidance/manager and maps the section into a heading, count and action. With no rows, it displays the supplied empty text.

The search rule requires more than five section rows when there is no explicit override; zero does not qualify.

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 37 - 47)

MotionPanel can animate the completed tab content with the browser's element.animate API: a short opacity/vertical-offset transition. It respects reduced-motion preference and cancels the animation/listener during cleanup.

This is presentation after the view changes; it is not a background loop calculating which subjects belong to Biology.

![Screenshot 2 - Subjects tab before assigning a stream](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-6-02-subjects.png)

The sidebar still selects Grade 9B, the footer still says Page 2.1, and the book still has 13 pages. We changed a tab, not a class/page node.

Edit class and Delete class remain displayed. Their own handlers are registered but not invoked by this tab change.


## 6. Clicking Manage streams opens a command dialog

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 148 - 155)

contextAction renders Manage streams as a shared action button whose onClick calls activate(action).

For Subjects & teachers the renderer suppresses the small utility icon. The filled variant supplies the solid action-button presentation visible in your screenshot.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 141 - 145)

activate checks whether the action has pageId. Manage streams does not: it is a command, so activate calls onCommand(action).

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 220 - 221)

The parent uses setCommand to store that command object. This state setter requests a render with a non-null command.

This is a React state change, not route navigation. The URL remains on tab=subjects.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

The conditional command expression renders CommandDialog. The parent passes refresh as onSaved and supplies an onClose callback that sets command back to null.

That callback is registered now. It will eventually remove the dialog when closing completes.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 68 - 73)

CommandDialog initializes busy=false, error="", an empty selection object, and a submitting ref.

The destructured onClose prop is locally renamed onDismiss. useModalMotion returns a ref for the dialog and an animated close function.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 94 - 110)

The dialog renders a form with submit wired to the shared submit handler.

The title comes from command.title, so it says **Class streams and subject split**. The × button calls the shared close function. Its type is button, not submit, and its accessible name is Close dialog.

command.content is inserted into the form. This is the point at which React mounts the previously described ClassStreamsEditor.

There are no ordinary command.fields for this action. The editor supplies its own checkbox fields instead. The command has a run callback, so the footer contains **Cancel** and **Save**.

Cancel closes without invoking the save callback. Clicking outside or pressing Escape has guarded close behavior too. Those closing handlers are available, but your path proceeds through Save.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 198 - 206)

The CSS module styles the native dialog: fixed positioning, centered margins, a bounded width/height, pale background, border, shadow and backdrop.

The title's font is explicitly **Georgia, serif**, with the declared size/line-height. This is one exact place to change this dialog heading's font if you want to customize it.

The backdrop rule dims the page. Label/footer/input rules supply spacing and appearance. CSS controls how the form looks; the React state and request handlers control what it does.

## 7. ClassStreamsEditor mounts and loads its choices

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 6 - 9)

The Stream type describes an object with id, name and a subjects array. Configuration describes the primary split subject and secondary teaching locations.

These TypeScript declarations describe expected shapes; they do not fetch stream subjects or create database tables.

The editor extracts schoolId, classId and streams from its props. The registry supplied schoolId S, classId 179 and the school stream summary list already loaded for the book.

Its initial state is:

| State | Initial value |
| --- | --- |
| options | [] |
| selected | [] |
| configuration | null |
| primary | "" |
| error | "" |
| ready | false |

useState returns the current value plus a setter. The syntax puts several separate state declarations on the same source line; they remain distinct values.

selected is an array of numeric stream ids. It is not a single name string, because a class can use multiple streams.

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 11 - 22)

On the first render, options and selected are empty, so chosen, union, common and different are empty, and split is false.

The fieldset is disabled because !ready is true. A disabled fieldset disables its contained form controls. It displays Loading class streams… while awaiting initialization.

The explanatory paragraph is already present, but there are no checkbox options until the data arrives.

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 10 - 10)

After mounting, the effect starts:

1. GET /schools/S/classes/179/streams for the class's saved stream state.
2. A GET /schools/S/streams/SC/subjects for Science.
3. A GET /schools/S/streams/B/subjects for Biology.

The second group is generated by streams.map. With the two stream options visible here, it generates two requests. More school streams would generate more option-detail calls.

Nested Promise.all waits for both the current-class result and all available-stream subject results. The independent reads can overlap; the code does not require their responses to arrive in a specific order.

The active variable initially equals true. Cleanup sets it false so a late result does not initialize an editor that has already closed or been replaced.

These requests use the same authenticated GET helper explained earlier. They are reads, and selecting Biology later will use their results.

### The current-class stream request

Before following the server handlers, there is another browser effect involved in opening this dialog.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

After the dialog/editor DOM has been committed, the parent's opening effect calls showModal on the actual HTML dialog and locks background scrolling. The editor's passive effect can start its reads before the parent's opening effect; neither waits for those responses before the dialog can open. There is no extra click between these effects.

The browser's dialog API supplies modal behavior: background controls cannot receive ordinary interaction while it is open.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

lockModalScroll saves the body's previous overflow on the first lock and sets overflow to hidden. Its returned cleanup function releases that lock and restores the original value when the final lock is released. The counter supports nested dialogs. It is a page-scroll mechanism, not a database lock.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 15 - 22)

The open dialog's motion-dialog class starts the short modal/backdrop entrance animations. CSS animates opacity and transform; it does not delay or perform the stream-data requests. Reduced-motion rules can suppress these transitions.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 74 - 74)

The classStreamsRouter was mounted at startup and handles the class-stream path.

(File: [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts), lines 12 - 19)

The GET route authenticates the staff account and checks administrative read access. It opens a transaction, verifies class 179 belongs to school S through its grade, and calls streamOptions.

The db.transaction callback receives a transaction object, tx. Queries through it belong to this transaction. This transaction reads configuration; it does not save a selection.

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 9 - 17)

streamOptions reads the class and its class_streams links.

links.map extracts the saved stream ids. The compatibility fallback uses cls.streamId if there are no link rows but a legacy single-stream id exists.

At this starting point neither source supplies a stream. That is consistent with the class page's unassigned guidance and the editor's initially unchecked boxes.

Because ids.length is zero, the conditional subject query returns [] without querying selected-stream subjects on this invocation.

options is constructed from the assigned ids, so current.options is also [].

The name options here means **currently assigned class stream options**, not every stream offered by the school. The frontend separately fetches the school-wide option subjects.

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 18 - 21)

The helper computes subject union/common/different from the assigned options and returns the class record plus those arrays and split.

For no assigned streams the arrays are empty and split is false.

The class record includes streamConfiguration, which is null for this unconfigured class. The route serializes this read result as JSON.

### The available-stream subject requests

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 25 - 37)

The streams router's prefix middleware authenticates/authorizes the request and checks the requested school. Its stream-id middleware verifies the stream exists within that school.

This applies separately to the Science and Biology request.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 171 - 179)

The subject-list handler parses the stream id and calls getStreamSubjects, then responds with its result.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 106 - 118)

getStreamSubjects selects the stream-subject links joined to subject definitions and orders them by subject name.

A stream-subject link answers “which subjects belong to this bundle?” It is different from a class-subject allocation answering “which subject is taught in this class/year, and by whom?”

For Biology, the data yields English Home Language, Life Sciences and Physical Sciences. The task does not tell us Science's full membership, and we do not need to invent it.

No new subject or link is inserted by these GETs.

### The editor receives all results

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 10 - 10)

The effect's continuation receives [current, all]. Array destructuring assigns the current-class response to current and the school-wide enriched options to all.

Each option-subject result is mapped from subjectId/subjectName into a simpler { id, name } shape.

The ...stream spread copies the summary stream fields while subjects adds the fetched list. Thus options now contains both available bundles, with their subject arrays.

setSelected takes ids from current.options. There are none, so selected remains [].

setConfiguration stores the current class configuration. setPrimary uses its primarySubjectId if present, with "" as fallback. String conversion supplies the text form expected by the potential selector.

setReady(true) requests a render with enabled editor controls. An error would instead populate error and leave the editor unready; the command's later save guard also checks readiness.

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 16 - 22)

React renders Science and Biology as label/input pairs.

Each checkbox has:

| Property | Purpose |
| --- | --- |
| type="checkbox" | Native browser checked/unchecked control. |
| name="streamIds" | Key used when the enclosing form is collected. |
| value=option.id | The id submitted if checked. |
| checked=selected.includes(option.id) | State controls whether its tick is shown. |
| onChange | Toggles the numeric id in selected. |

Clicking a label can activate its associated nested checkbox. The browser supplies the native checkmark appearance; your application supplies the checked state and change callback.

The inline styles arrange each label horizontally and size the checkbox. Those specific width/margin declarations override the broader dialog input rule where they overlap.

A hidden input named streamEditorReady now has value yes. It does not occupy visible screen space but will be included in form data. Hidden does not mean secret or trusted by the backend.

![Screenshot 3 - Manage streams loaded with neither selected](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-6-03-manage-streams.png)

The footer Save button belongs to CommandDialog, outside the editor's fieldset. The ready hidden field and command callback protect against submitting before editor initialization; the fieldset alone is not what disables that outer Save button.

## 8. Clicking Biology changes local state and reveals its subjects

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 20 - 20)

You click Biology. React invokes the checkbox's onChange callback.

The callback calls setSelected with a functional updater. current is the previous numeric-id array.

It checks current.includes(B). Since Biology was not selected, the condition is false and [...current, B] creates a new array containing its id.

If the option had already been selected, the other branch would filter it out. That is the toggle logic; your observed click takes the add branch.

No api call appears in this handler. This click does not save a stream selection on the server.

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 11 - 15)

React re-renders and recomputes the derived arrays:

~~~text
selected  [B]
chosen    [the Biology option]
union     [English Home Language, Life Sciences, Physical Sciences]
common    [English Home Language, Life Sciences, Physical Sciences]
different []
split     false
~~~

Here is the actual array reasoning:

- filter retains options whose id appears in selected.
- flatMap combines subjects from the chosen streams into one array.
- map creates subject-id/object pairs.
- new Map keeps one entry per subject id, eliminating duplicates across bundles.
- .values() supplies the subject objects, and [...] turns those values back into an array.
- every asks whether each chosen stream contains the subject; some tests for a matching subject id in each stream.
- different removes the subjects already in common.

With one chosen stream, every subject in it is common to the chosen streams. The code does not mean that every stream offered by the school contains those subjects.

split requires both more than one chosen stream and at least one different subject. chosen.length is one, so split is false.

(File: [src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx), lines 22 - 29)

common.length is three, so the conditional fragment renders **Subjects attended together** and a bulleted list of the three names. A React fragment groups adjacent elements without adding a wrapper element.

The split block is not rendered. Therefore there is no primary-subject chooser, no building field and no classroom-name field for this single-stream choice.

Those controls exist for a different situation with multiple streams and differing subjects. We do not execute or mount their interaction logic on your path.

![Screenshot 4 - Biology selected and subjects previewed](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-6-04-biology-selected.png)

The dialog grows to accommodate the list. Browser layout recalculates the form's height and the centered dialog's position. No manual screen-coordinate code is needed.

Behind the dialog, Subjects & teachers still has zero rows. That is correct: the editor's local preview has changed, but no class-stream write has occurred.

The preview is based on the subject lists fetched when the dialog opened. Save will perform server-side validation/synchronization using database records.


## 9. Save collects the form's named controls

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 79 - 92)

Save is type submit, so clicking it submits the enclosing form and invokes CommandDialog's submit handler.

event.preventDefault() prevents the browser's normal form-navigation submission. The handler will use our command/API flow instead.

The renderContent guard is false for this action: it uses command.content, not a self-managed renderContent workflow. The submitting ref also permits this first submission.

new FormData(event.currentTarget) collects successful controls from this actual form. event.currentTarget is the form whose handler is running.

Checked checkboxes with a name contribute entries; unchecked checkboxes do not. Therefore the relevant form entries are:

~~~text
streamIds          String(B)
streamEditorReady  yes
~~~

Although React selected stores numbers, HTML form values are strings. Science is unchecked and contributes no streamIds entry.

There is no primarySubjectId control in the form, because the split block was not rendered. There are also no building-* or classroom-* fields on this path.

The handler constructs values with Object.fromEntries from string entries. The command has no ordinary command.fields to trim/check, so that fields loop has no iterations.

FormData itself is still passed to command.run. That matters because a checkbox group can contain repeated names. Object.fromEntries alone would retain only one value per repeated key, whereas form.getAll can retrieve all checked streamIds.

The handler marks submitting.current true, sets busy and clears the error.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 94 - 110)

busy disables the dialog's ×, Cancel and Save controls and changes the submit caption to **Saving…**. Escape/outside-click dismissal checks busy too.

The editor's own fieldset is disabled based on ready, not the dialog's busy state. Its checkboxes are not separately wired to busy in this implementation. The outgoing save uses the FormData snapshot captured for this submission; subsequent local checkbox changes would not rewrite an already-constructed request body.

## 10. The command constructs a PUT request

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 124 - 133)

command.run now executes.

Its first check requires form.get("streamEditorReady") to equal yes. This is the application's readiness guard for the editor's asynchronous load.

form.getAll("streamIds").map(Number) collects the checked values and converts them to numeric ids. The result is [B].

Number(form.get("primarySubjectId")) evaluates to 0 here because get returns null for the absent field. The location scan finds no form keys starting with building-, so locations is [].

The payload chooses configuration only when primarySubjectId is truthy. Zero is falsy, so the actual payload is:

~~~text
{
  streamIds: [B],
  configuration: null
}
~~~

B represents Biology's numeric database id. The actual JSON contains that number.

The command calls api.put with:

~~~text
/schools/S/classes/179/streams
~~~

PUT expresses a request to save the selected stream configuration for this class. This operation updates the class's stream selection; it is not the endpoint for creating a new school stream.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 218 - 221)

api.put constructs method PUT and uses JSON.stringify on the payload.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 211)

The shared helper sends the JSON request with the current bearer token, Content-Type: application/json and applicable cookies:

~~~text
PUT http://localhost:3000/schools/S/classes/179/streams
Authorization: Bearer <current access token>
Content-Type: application/json

{"streamIds":[<Biology's numeric id>],"configuration":null}
~~~

The angle-bracket placeholder is explanatory, not valid literal JSON. It stands for the numeric id read from the checkbox option.

fetch returns a promise. await waits for its response while the browser remains able to render other work.

## 11. The backend validates the requested configuration

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

The PUT request passes through the same application middleware. Because its body is application/json, express.json parses it into req.body, subject to the configured limit.

The request logger records the method/path. The mounted class-stream router receives the matching request.

(File: [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts), lines 20 - 23)

The route repeats requireAuth and requireSchoolAdministration for this write. The write capability is grades. The principal passes.

Having permission to read the dialog's options is not a permanent substitute for permission on this PUT.

(File: [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts), lines 11 - 11)

The route calls the Zod config schema's safeParse on req.body.

The schema requires streamIds to be an array of 1–10 positive integers and configuration to be either null or an object with a valid primary subject and bounded location fields.

The one positive Biology id plus null configuration passes that structural validation. Duplicate stream ids are checked again by the service, rather than being eliminated silently.

Zod performs runtime validation. TypeScript type declarations in the browser cannot guarantee what an arbitrary HTTP caller sends to this server.

(File: [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts), lines 21 - 22)

On valid input the handler opens a database transaction. Inside its callback it first awaits saveClassStreams and then awaits syncClassSubjects.

These dependent operations run in that order using the same tx. The subject synchronization therefore sees the newly selected class stream even before the transaction becomes visible to other connections.

Only after both operations succeed can this transaction commit. A failure rolls its changes back.

## 12. The transaction saves Biology as the class's stream

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 23 - 29)

saveClassStreams first takes the workflow advisory transaction lock using key (7411, 0). PostgreSQL releases it when this transaction ends. Cooperating workflow operations using the same key serialize around it; it is not a browser UI lock.

The function selects class 179 joined to grades, using FOR UPDATE, and checks its school against S. This row lock protects the selected records against conflicting modifications during the transaction.

It requires 1–10 distinct stream ids. new Set(streamIds).size detects duplicates.

It queries streams for the requested ids belonging to school S. The allowed-count comparison ensures every requested stream belongs to that school. Biology passes.

Drizzle's eq, and and inArray helpers build SQL conditions. The SQL/query helpers parameterize values rather than treating an arbitrary submitted string as executable SQL.

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 30 - 33)

The function calls streamOptions to capture the old assignment. As when opening the editor, this class has no selected stream on the scenario's starting path, so old.options is [].

It then deletes class_streams links for this class and inserts the requested new link.

For this initially unassigned class, the DELETE has no link rows to remove. The INSERT creates the class-179/Biology relationship.

(File: [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts), lines 9 - 12)

classStreams describes the class_streams link table: generated id, classId and streamId foreign keys, and a uniqueness rule for a class/stream pair.

This schema describes the already-created database table. It is not running CREATE TABLE during Save.

A link row permits a class to have several streams without duplicating the class itself.

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 33 - 34)

The service sets classes.streamId to the first selected id, B. That single-stream field remains alongside the multi-stream link table for compatibility.

It then calls streamOptions again. This time the new link exists inside tx, so streamOptions reads Biology's subject memberships, constructs its option and computes the three common subjects.

The list is based on the database's current stream-subject records, not trusted copies of subject names from the checkbox preview.

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 35 - 41)

next.split is false for a single Biology stream. The block requiring a primary split subject and secondary classroom locations is skipped.

The function compares the old and new stream/subject-id structures after sorting them. JSON.stringify makes those normalized array structures comparable as strings.

An empty old assignment differs from a Biology assignment, so changed is true.

It updates streamConfiguration to null because there is no split and increments streamRevision by one through the SQL expression. The precise prior revision is not visible in your screenshots; we need not invent it.

(File: [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts), lines 11 - 21)

These columns hold the class's academic year, stream revision, optional JSON configuration, stream reference and class-manager reference.

streamConfiguration is a PostgreSQL jsonb column: structured JSON stored in the database. null here means no split configuration is required.

The revision is a version marker used when checking subject choices. Incrementing it does not directly log in a learner or mark accountSetUp true.

The save updates stream fields; it does not overwrite classTeacherId with a subject teacher. A class manager and a subject's assigned teacher are separate relationships.

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 42 - 42)

saveClassStreams returns next. The route still has another awaited operation to perform: subject synchronization. Saving the link alone is not the complete PUT operation.

## 13. Synchronization creates the class's subject allocations

(File: [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts), lines 22 - 22)

The route calls syncClassSubjects(tx, 179) before finishing the transaction.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 19 - 28)

syncClassSubjects takes the same advisory lock within the transaction, reads/locks the class, reads its grade, and checks that the selected stream belongs to that grade's school.

Taking the same advisory transaction lock again within this transaction does not make it wait on itself.

The class's grade number is 9; that number will matter for curriculum matching. Grade database id and grade number are distinct values.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 29 - 35)

The function obtains current streamOptions again and flattens their subjects into desired allocations.

A Map keyed by subjectId creates uniqueDesired. This prevents a subject shared by multiple streams becoming duplicate class-subject allocations.

wanted is a Set of desired subject ids. For Biology it contains E, L and P.

The function reads existing allocations for this class. If records exist, it updates active according to whether each allocation belongs to the current academic year and its subject is wanted.

An empty visible subject list proves no active displayed allocations, not that the database could not possibly contain historical inactive records. In the newly created, previously unassigned class path from our chapters, there are no prior allocations to update. The code nevertheless supports historical records instead of assuming every class is new.

This is why the implementation deactivates unwanted/older allocations instead of deleting their teaching history.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 36 - 40)

The function loops over the three unique desired subjects.

For each subject it looks for the most recent earlier-year allocation and an allocation in the current year.

If no current-year allocation exists, it inserts one with classId 179, that subject id, the class academic year, and the previous allocation's teacher id if available, otherwise null.

On the fresh-class path, no earlier allocation supplies a teacher, so personId is null.

The resulting conceptual records are:

| Class | Subject | Academic year | Default teacher |
| --- | --- | --- | --- |
| 179 | English Home Language | 2026 | null |
| 179 | Life Sciences | 2026 | null |
| 179 | Physical Sciences | 2026 | null |

Each allocation also has its own generated id. That id is different from the subject-definition id and the class id.

(File: [Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts), lines 11 - 22)

The class_subjects schema defines these class-specific teaching records. active defaults true, lessonCount defaults zero, and personId is nullable.

The uniqueness constraint covers class, subject and academic year. It prevents two allocations for the same class/subject/year while allowing historical years to remain separate.

This table exists because “Life Sciences as a subject definition” and “Life Sciences taught in Grade 9B this year” are different things. The latter needs a stable class-specific identity for teaching work.

(File: [Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql), lines 22 - 33)

When these INSERTs execute, the installed allocation trigger checks that an active allocation's year matches its class's current year. It also checks the school relationship for a non-null assigned teacher.

Here the academic year matches and personId is null, so there is no non-null teacher to verify.

These trigger definitions were installed when migrations were applied. The migration file itself is not rerun by the Save button. This source walkthrough assumes the database has the checkout's migrations applied; screenshots alone cannot verify that installation.

## 14. Synchronization also checks shared curriculum links

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 41 - 45)

Still inside each subject iteration, the function queries active shared chapters whose subject matches and whose gradeNumber is 9.

It reads chapter links already attached to that allocation and computes missing links.

If a matching curriculum chapter is not linked, the function inserts a class_chapters link. For a new year it can preserve a previous chapter-specific teacher where one exists; otherwise it uses the allocation's teacher.

For our fresh allocations, the default teacher is null.

The screenshots do not show the shared curriculum tables, so they do not tell us how many matching chapters exist. The SELECTs and missing-link calculation execute; the insertion branch executes only if missing.length is positive.

It would be inaccurate to invent a particular number of curriculum links or claim that opening this dialog creates new shared chapter definitions.

(File: [Project-Edu-Revo/src/db/schema/classChapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classChapters.ts), lines 10 - 16)

class_chapters stores the allocation id, shared chapter id and optional teacher id. It links existing shared chapter content to this class's allocation; it does not duplicate the whole chapter text.

This work can happen during stream assignment even though the principal has not clicked the visible Curriculum action yet.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 36 - 47)

The loop completes for the three subjects. Any needed allocation/active-state/curriculum-link writes belong to the same transaction as the class-stream link and revision update.

If one step fails, the transaction does not leave half of this stream assignment committed.

No learner account is created here, no learner is moved out of Grade 9B, and no subject teacher is selected by the principal's Biology checkbox.

## 15. The backend returns success

(File: [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts), lines 22 - 23)

When both service calls succeed and the transaction finishes, the route sends:

~~~json
{ "saved": true }
~~~

This uses the normal successful 200 status. The response is an acknowledgment; it is not the three fully rendered subject rows.

A StreamChoiceError is converted into its status/message. The client helper would reject an unsuccessful response, and CommandDialog would show its error rather than closing as though the save succeeded.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 205 - 211)

The helper checks res.ok, parses the JSON and resolves the awaited PUT promise.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 127 - 133)

command.run resumes and completes. It returns no new page id, because assigning a stream did not create a new navigation page.

The dialog's shared submit function can now continue after awaiting command.run.


## 16. The dialog requests a book refresh and starts closing

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 89 - 92)

The submit handler awaits onSaved(pageId || undefined). Since this command returned no page id, it passes undefined.

This dialog received the parent's refresh function. That is a different callback from Chapter 5's inline import notification: here it immediately increments the book revision.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 315 - 318)

refresh navigates only if a nextPage was supplied. None was supplied, so the route stays:

~~~text
/dashboard/principal?book=grades&page=class-179&tab=subjects
~~~

The function calls setRevision(value => value + 1).

Although refresh is declared async, its body does not await the ensuing network reload. Its promise completes after scheduling the state change. The actual book-loading effect performs its work separately.

Consequently, the submit handler does not wait for every refreshed GET to finish before starting the dialog close. We must follow the actual statements rather than treating “await refresh” as proof that the final subject rows are already on screen.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 89 - 92)

After onSaved resolves, the submit handler calls onClose. Its finally block releases submitting and busy.

If the write had failed, catch would store the error message and the successful-close path would not run. Your final screenshot corresponds to success.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

The shared modal close helper checks its dialog and the motion preference.

For an open dialog with ordinary motion enabled, it sets data-motion-closing, marks the node inert, and schedules onDismiss after 140 ms. A timer is asynchronous; other rendering/requests can proceed during that interval.

With reduced motion, dismissal is immediate. We cannot determine that preference from these still images, so those are the two branches supported by the source.

The timer guard prevents duplicate scheduled closes, and the connected-node check avoids dismissing a dialog already removed by navigation.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

The parent's onDismiss callback sets command to null. The conditional dialog is removed from React's rendered tree.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

The dialog effect's cleanup closes the native dialog node and releases its scroll lock. ClassStreamsEditor's effect cleanup also marks its active flag false.

Closing the dialog does not undo the successful transaction.

## 17. The new revision reloads the book's supporting records

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 246)

The new revision no longer matches loaded.revision, so the old loaded data is not accepted as current. The book-loading effect runs again.

It reads the school id and calls book.load. The effect stores the completed data with the new revision and clears a load error. Its cancellation flag prevents an older response replacing a newer load.

The preparation UI may be visible while these requests are in progress. Animation, dialog cleanup, requests and rendering can overlap. The fifth screenshot shows the settled result, not their precise relative timings.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 47 - 50)

structure loads the school's grades, sorts them numerically, then loads the classes for each grade using Promise.all.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 100 - 108)

The Grades & Classes load function runs structure alongside school-stream and people reads. With the five grades shown in the navigation, its supporting calls are:

| GET | What the result supplies |
| --- | --- |
| /schools/S/grades | Grade records for the page tree. |
| /schools/S/grades/G8/classes | Grade 8 class records/counts. |
| /schools/S/grades/G9/classes | Grade 9 records, including Grade 9B's new stream fields. |
| /schools/S/grades/G10/classes | Grade 10 class records/counts. |
| /schools/S/grades/G11/classes | Grade 11 class records/counts. |
| /schools/S/grades/G12/classes | Grade 12 class records/counts. |
| /schools/S/streams | Stream names used in the class guidance. |
| /schools/S/people | Staff names used for manager/teacher display. |

G8–G12 mean actual grade ids, which are not necessarily the displayed grade numbers.

These calls use the authenticated api.get helper and their backend route guards. They can interleave. This table describes the feature's supporting loads, not an exact packet count including preflights, development tools or unrelated background work.

### Backend reads for that refresh

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 14 - 27)

The grade-list request authenticates/authorizes the school and checks it exists before calling getGradesBySchool.

(File: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts), lines 33 - 36)

getSchoolById selects the school record or returns null. The school exists in our retained successful session.

(File: [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts), lines 14 - 16)

getGradesBySchool selects the school's grades ordered by grade number.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 31 - 38)

Each nested grade/classes request has its school/grade ownership checked before listing classes.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 107 - 123)

The class-list handler validates its parameters, verifies the school and calls getClassesByGrade.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 90 - 125)

That service selects class fields including streamId and the streamIds array from class_streams, plus class-manager information and learner counts.

Grade 9B now has streamId B and streamIds containing B. Its learner count is still five and its manager remains the same.

The SQL subquery for streamIds produces an array of the class's linked stream ids. This is how the refreshed frontend can know about the link table without making a separate class-stream editor request for every class in the book.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 82 - 96)

The school-stream GET checks its school and delegates to getStreamsBySchool after the route's access guards.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 21 - 23)

getStreamsBySchool reads stream definitions for S. Biology's definition already exists; saving the assignment did not rename it.

(File: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts), lines 57 - 64)

The people route verifies the school and returns getPeopleBySchool.

(File: [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts), lines 27 - 61)

The people service selects staff identity/name/account and assignment-summary fields, scoped to the school.

Reloading that list supports resolving classTeacherId and subject personId into readable names. It does not automatically make the manager the teacher for every subject.

Each handler returns JSON; the frontend's Promise.all collects the results into the new book data.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 237)

The workspace rebuilds the page tree from the current data and finds class-179. Its new revision gives this page/view a current key.

There is still only one Grade 9B node and its one Bulk import learners child. A stream assignment does not add a sidebar page for every subject.

## 18. The refreshed Subjects view requests the saved allocations

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

The current data causes the view effect to run. tab is still subjects, so it loads that class view again.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 118 - 123)

The registry calls:

~~~text
GET /schools/S/classes/179/subjects
~~~

The same authenticated class-subject route described in step 4 runs again.

(File: [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts), lines 17 - 30)

Its school/class checks succeed. The GET handler calls getClassSubjects and returns the result.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 62 - 69)

This SELECT now finds the three active class-subject allocations.

It joins their subject definitions to obtain the names and sorts by subject name. That yields English Home Language, Life Sciences and Physical Sciences.

The optional people join has no assigned person for these rows. The result's personId is null.

No new allocation is created by this GET. The allocations were saved during the preceding PUT transaction.

The returned allocation id is the id used for future operations such as assigning that class subject's teacher; it is not interchangeable with the subject-definition id.

## 19. The final guidance and the three rows are built

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 123 - 138)

The refreshed class entity now has its Biology stream id. The registry finds Biology in data.streams.

The Subjects guidance takes the stream-present branch, filters the school's stream records against the class's streamIds (with the single-field fallback if needed), formats their names, and joins multiple labels with " + ".

Only Biology is selected here.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 138 - 141)

streamLabel trims the name, collapses repeated whitespace, converts it to uppercase, and appends STREAM unless the uppercase label already contains the whole word STREAM.

That produces **BIOLOGY STREAM** from Biology. It is display formatting, not a second saved stream or a database rename.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 138 - 152)

The manager paragraph still uses the saved class-manager relationship. The top Edit/Delete class actions and both tabs remain.

The subject section's rows come from items.map. For each item the registry sets:

| Row property | Result |
| --- | --- |
| id | String of this class-subject allocation's id. |
| title | subjectName. |
| detail | Staff name for personId, or No teacher assigned. |
| badge | undefined for a subject row. |
| actions | Assign teacher and Curriculum commands. |

String converts the allocation id for UI row identity. The displayed subject title remains ordinary text.

For the teacher detail, data.people.find has no match for null personId. The fallback object produces an empty name, and the || expression then supplies **No teacher assigned**.

That text is not an error response. It accurately reports that assigning a subject bundle and assigning a person to teach each subject are separate operations.

### The final row buttons are registered, not clicked

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 150 - 151)

**Assign teacher** describes a command with a Teacher select field and a run callback that could PATCH the allocation's teacher later. Rendering the command object does not call that PATCH.

**Curriculum** describes ClassCurriculum content for this allocation. React can store that element description without mounting the component's dialog content here. We do not execute its future loading/editing workflow during this task.

The principal has not clicked either action in your screenshots. Their detailed click-to-save workflows belong to a later task, rather than being invented as part of this stream assignment.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 171 - 185)

WorkspacePage renders the three rows.

It filters with the current query, which is empty. Every row title includes an empty search string, so all three remain. The count displayed beside Subjects & teachers is rows.length, **3**.

The rowText branch renders the subject name and its small teacher-detail line. There is no pageId on these rows, so the name is not turned into a navigation link by that branch.

The row-actions renderer uses MobileAction buttons with no icons for Subjects & teachers. That is why you see the written **Assign teacher** and **Curriculum** actions at the right.

No status badge is rendered for these subjects; Setup pending was a learner-row badge in the other tab.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 42 - 47)

The shared action component forwards the supplied onClick to a real button and renders the visible label when no icon is requested. It supplies accessible label/title defaults too.

These controls can look like underlined text through CSS while still being buttons. Appearance alone does not tell you whether an element is an anchor link, a button opening a dialog, or a submit control.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 79 - 145)

The workspace CSS supplies heading/section/row spacing, dividers, action styles and tab presentation. The text-button style gives the row actions their lightweight appearance.

The search rule still requires more than five rows. Three subject rows produce no search input.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 358)

The shell continues to show the Grade 9B contents selection, the Grade 9 / Grade 9B breadcrumb and the Page 2.1 footer.

Previous/Next, Navigation help, Sign out and the bookshelf remain available. Their own actions do not run simply because this refreshed view renders.

The URL still has tab=subjects. The left book structure still has 13 pages. The five learners remain in Grade 9B; this task has configured subjects, not changed its register.

![Screenshot 5 - Biology saved, three subjects with no teachers assigned](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-6-05-subjects-saved.png)

## 20. Follow the boundaries when reasoning about this screen

| Visible event | Code responsibility |
| --- | --- |
| Click Subjects | Tab callback → navigate with tab=subjects. |
| Empty subject page appears | Class-subject GET → empty items → subject view render. |
| Click Manage streams | activate → setCommand → CommandDialog mounts editor. |
| Science/Biology checkboxes appear | Editor effect fetches saved state and available subject bundles. |
| Tick Biology | Local selected state changes. |
| Three-subject preview appears | Derived chosen/union/common arrays render a list. |
| Click Save | FormData snapshot → command.run → JSON PUT. |
| Stream selection persists | saveClassStreams writes class_streams/classes. |
| Subjects become class allocations | syncClassSubjects writes/updates allocations and any missing curriculum links in the same transaction. |
| Dialog disappears | Successful submit starts close; modal cleanup restores background interaction/scrolling. |
| BIOLOGY STREAM and three rows appear | Book refresh + class-subject GET → formatted guidance and rows. |

At the ending screen, the subject names come from saved class allocations joined to subject definitions. The manager name comes from a separate class-manager relationship. The missing teacher text comes from each allocation's unassigned teacher relationship. Knowing those three sources explains why this particular combination of names and messages appears together.


