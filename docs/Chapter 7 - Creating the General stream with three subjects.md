# Chapter 7 - Creating the General stream with three subjects

**Starts:** The Chapter 6 ending screen is open: Grade 9B's Subjects tab shows BIOLOGY STREAM and three subjects. The principal clicks the **Streams** book on the right bookshelf.

**Ends:** A new stream named General has been saved with English Home Language, Geography and Life Sciences. Its page is open at page=stream-57, the title is GENERAL STREAM, and the book now has five pages.

This chapter follows the current source and your screenshots. I have not created a stream in the running database to write it. I include the previous chapter's ending image as the starting reference and all six screenshots you supplied for this chapter.

We keep the valid principal session. **S** stands for the actual school id. Science's id **19** and General's new id **57** are visible in the screenshots. **E**, **G** and **L** stand for the unknown numeric subject ids of English Home Language, Geography and Life Sciences. The actual requests contain numbers, not these letters.

Two small gaps in the images require care:

- The first new screenshot already shows Science after opening Streams. The app can restore a remembered page. I follow that supported route, while acknowledging that a still image cannot prove the contents of browser storage or rule out an unshown Science click.
- The next screenshot shows My Streams. The contents heading, breadcrumb and Previous button can all lead there from Science. I use a click on the **My Streams** contents heading for the walkthrough, since the screenshot does not identify the particular control clicked.

There is no need to invent a new login or a change to Grade 9B between these screens.

## 1. The starting page already contains a Streams book button

![Starting reference - Chapter 6 ending screen](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-6-05-subjects-saved.png)

The current URL is:

~~~text
/dashboard/principal?book=grades&page=class-179&tab=subjects
~~~

This page is already rendered. The principal moves the pointer to the bookshelf and clicks Streams. Pointer movement itself does not save anything or fetch stream records.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 350 - 356)

The bookshelf maps the available book definitions into buttons. Each button has onClick={() => navigate(item.id)}.

For Streams, item.id is streams. Its cover number, title and descriptive text come from the book definition. The handler supplies the book id without a page id.

This is a real HTML button with an accessible name such as Open Streams. The browser identifies which element was clicked; React calls its registered handler. The app does not manually compare pointer coordinates to the drawn cover.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 310)

navigate receives nextBook="streams" and no nextPage. That missing page is significant: the function asks rememberedLibraryLocation for this book.

The import-change flag is not set on this completed path, so it does not add an import-driven refresh.

## 2. The navigation code checks the remembered Streams location

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 66 - 75)

rememberedLibraryLocation looks up navigation memory for the requested role and book. It does not query the backend.

It calls identity to obtain a browser-storage key, reads the saved memory, chooses saved.books.streams, and validates the location before returning it.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 11 - 22)

identity reads accountType, accountId, schoolId and role from localStorage, verifies the expected basic shape, and builds a key separated by account, school and selected library role.

localStorage is a browser API for persistent key-value strings on this browser/origin. It is not PostgreSQL, and another device need not have the same remembered page.

The identity values select navigation memory here. Server authorization still checks requests independently; storing a role string does not grant backend rights.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 43 - 47)

read obtains the saved string and uses JSON.parse to turn it into a JavaScript object. Missing or malformed storage falls back to an empty books object.

try/catch prevents broken optional memory from breaking navigation.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 25 - 40)

libraryLocation checks that the saved address belongs to the expected dashboard role and an allowed book, rejects an unexpected pathname/hash, validates known parameter values, and rebuilds the local query string.

new URL uses a fixed dummy base to parse a relative address. That parsing call does not contact library.invalid.

For the remembered-Science route, the validated location is:

~~~text
/dashboard/principal?book=streams&page=stream-19
~~~

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 296 - 309)

navigate uses the remembered query, obtains the remembered page, prepares the book/page turn and calls router.push with scroll: false.

router is the Next.js navigation object. push updates the route and browser history without a traditional full-document reload. URLSearchParams handles the query parameters; the option avoids Next.js's normal navigation scrolling.

Without a valid remembered Streams location, this same code would open the book's default first page, My Streams. It would then take an additional Science selection to reach your first new screenshot. We follow the remembered-page case because it accounts for that screenshot directly.

Changing books discards the Grades & Classes tab selection from this destination query; tab=subjects does not become a filter on the Streams book.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 91 - 129)

The called turn function clears earlier animation, checks distance/reduced-motion/DOM availability, prepares temporary layers and calls the browser's animate API on them. It uses the requested distance to choose a schedule and direction. Animation completion removes the temporary layers.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 16 - 49)

For the visual snapshot it clones the visible page DOM, removes duplicate ids and animation/spine elements, copies visible control values and scroll positions, and marks the copy inert and hidden from assistive technology. It is a presentation copy, not another mounted React form. It does not submit old forms or save Grade 9B again.

These animations can overlap the new book's data loading. Reduced-motion preference can skip them.

## 3. The workspace selects Streams and loads its data

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 198 - 209)

On rendering for the new query, the workspace reads book=streams and page=stream-19.

It filters the book catalogue by current access. A principal can see the relevant book. It finds the Streams definition using its id.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 160 - 163)

The definition supplies the book title, cover mark 02, green colour, loader and page builder.

It defines two kinds of parent page: **My Streams** and **System Streams**. School-created streams will be child pages under My Streams.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 246)

The previously loaded data belongs to grades, not streams, so data is temporarily null for this destination.

The book-loading effect calls book.load with the school id. Effects schedule work in response to dependencies; the changed selected book makes this loader run.

The cancellation flag prevents an obsolete response from overwriting a newer selection. During loading, the workspace can display its preparing/opening UI.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 162 - 162)

The Streams loader uses Promise.all to request two independent resources:

~~~text
GET /schools/S/streams
GET /subjects
~~~

The first supplies the school's named bundles. The second supplies the shared subject catalogue from which this school can choose.

Promise.all waits for both and returns their results in its input order, regardless of which request finishes first.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 6 - 6)

The shared API base defaults to http://localhost:3000 unless configured otherwise. The browser UI in your screenshots is at localhost:3001.

Ports distinguish services listening on the same computer. The navigation URL and backend API paths serve different purposes.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 224)

api.get delegates to the common fetch helper. It includes the current bearer token when present, applicable cookies through credentials: "include", and its shared headers.

The browser can send a CORS preflight where needed for this cross-origin request. A cached preflight may avoid repeating it. Neither GET nor a preflight creates a stream.

The helper also supports token recovery; our retained valid session follows the normal successful path.

## 4. The backend returns school streams and the subject catalogue

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

Express receives each request. Application middleware handles CORS, response headers, applicable JSON-body parsing and request logging. There is no stream creation body in these GETs.

The middleware was registered at server startup; the registered functions now run for arriving requests.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 81 - 82)

The subjects and streams routers handle their respective paths.

### School stream list

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 25 - 31)

The streams prefix middleware authenticates the request, checks school-administration access and verifies the requested school matches the caller.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

requireAuth verifies the JWT bearer token with the configured secret/algorithm and checks the current staff account still exists and is set up. It attaches req.caller on success.

The JWT library performs signature/expiry verification; our own middleware decides what current staff information to check and how to attach it to the request.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

The administration guard obtains current access and checks the school. GET uses the configured read capabilities; the principal passes the isPrincipal branch.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 17)

staffAccess reads current staff/grants/teaching-assignment data and returns capabilities, schoolId and principal status. These are database reads for access decisions, not permission values trusted from the visible cover.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 82 - 96)

The GET handler repeats its registered authentication/administration middleware, parses the school id, checks the school exists and calls getStreamsBySchool.

Because both prefix and handler register guards, those guards can run more than once on this path. next() advances within the request's handler chain; it does not make a new browser request.

(File: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts), lines 33 - 36)

getSchoolById selects the school and returns its first row or null. Here the school exists.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 21 - 23)

getStreamsBySchool selects stream records whose schoolId equals S. It does not explicitly order them.

That detail matters for page numbering: the frontend uses the returned order rather than sorting stream names alphabetically. Your screenshots show Science first and Biology second.

### Shared subject catalogue

(File: [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts), lines 34 - 38)

GET /subjects calls getAllSubjects and returns the catalogue as JSON.

This GET handler is public in the current source; it does not attach requireAuth even though the shared frontend helper may send its token. The protected POST for creating subject definitions is a different route and does not run here.

(File: [Project-Edu-Revo/src/services/subjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/subjectService.ts), lines 24 - 24)

getAllSubjects selects subjects ordered by name.

Your chooser later shows the five returned subjects:

1. English Home Language
2. Geography
3. Life Sciences
4. Mathematics
5. Physical Sciences

(File: [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts), lines 17 - 26)

Drizzle's query builders use the backend's existing PostgreSQL connection pool. The driver sends SQL; PostgreSQL reads records and returns rows.

The pool was initialized earlier. Opening a book does not start a new database server or recreate tables.

The routes serialize their results with res.json. The frontend helper checks the response status and parses JSON back into JavaScript arrays/objects. The loader returns { streams, subjects } when both reads complete.

## 5. The book builds four pages and opens Science

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 163 - 163)

The page builder creates:

~~~text
My Streams                 page 1
  SCIENCE STREAM           page 1.1, id stream-19
  BIOLOGY STREAM           page 1.2
System Streams             page 2
~~~

That is four pages when flattened, not four school-created streams.

The map uses each stream's database id for a stable page id and its array position for the printed number. The word STREAM and uppercase label are formatting.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 138 - 141)

streamLabel trims/collapses whitespace, converts the name to uppercase and appends STREAM unless the whole word already appears. It can display SCIENCE STREAM even when the saved name is Science.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 225 - 237)

The workspace flattens the page tree, finds stream-19, obtains its breadcrumb path and calculates the selected index/view key.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 115 - 129)

flattenPages recursively traverses parent/child pages. findPagePath returns the ancestors and selected page. They operate on JavaScript data and do not fetch each page from a matching physical file.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

The view effect calls the Streams view function for Science.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 164 - 178)

page.entity is the Science stream record, so stream is truthy.

The function initializes local create-command state and describes a create callback, but that callback does not execute. Since this is a stream detail page, the view proceeds to:

~~~text
GET /schools/S/streams/19/subjects
~~~

The catalogue GET supplied all available subjects; this different GET supplies subjects linked specifically to Science.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 28 - 37)

The school guards run, then the stream-id middleware verifies that 19 is a valid id for a stream belonging to S.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 171 - 179)

The GET handler calls getStreamSubjects for stream 19.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 106 - 118)

The service joins stream_subjects to subject definitions, filters by stream id and orders by subject name.

Each result has a membership-link id as well as subjectId and subjectName. A membership id is distinct from a subject id: the same subject can belong to several streams through different links.

This read returns Science's three subjects shown in your image. It does not assign Science to Grade 9B.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 179 - 183)

The view maps those results into rows and registers Rename stream, Delete stream, Add subject and row Delete commands.

Rendering them does not run their write callbacks. There are no class-teacher assignment controls here because we are editing a school bundle, not Grade 9B's class-specific allocations.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 185)

WorkspacePage renders the title, explanatory paragraph, Subjects count 3 and three rows. There are no tabs in this view, and three rows do not meet the default “more than five” search rule.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 320 - 320)

The workspace applies the selected book's colour as --book-accent.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 6 - 10)

CSS derives solid, soft, border and text accent colours from that value. This is why the active contents, actions and other accents now use the Streams green instead of the Grades & Classes red.

The workspace's ordinary text uses Arial/Helvetica/sans-serif. Heading rules provide their own typography; colour changes do not mean a different application was loaded.

![Screenshot 1 - Science open inside the Streams book](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-7-01-science-stream.png)

The title, breadcrumb and contents agree on Science. The Streams cover is highlighted on the shelf.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 52 - 52)

The responsive library invokes the shared navigation-memory hook while the library is mounted.

(File: [src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts), lines 8 - 16)

When the URL changes, its effect calls rememberLibraryLocation with the current pathname/query. It also registers a pagehide callback for leaving the page.

pagehide is registered here; it has not fired merely because the book changed.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 50 - 63)

The memory helper validates the local address, updates last and the per-book address, and JSON-stringifies the memory into localStorage.

This stores navigation, not the stream's subject records. It does not save an unsaved form or send a backend request.


## 6. The principal returns to My Streams

For the working path described at the start, the principal clicks the **My Streams** heading in the left contents. If the actual click was its breadcrumb or Previous instead, the destination and following view are the same.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 39 - 45)

The contents button calls onNavigate with my-streams.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 329)

The parent supplies a callback that calls navigate with the current book and chosen page.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 310)

navigate receives an explicit page this time, so it does not restore the remembered Science page.

It constructs:

~~~text
/dashboard/principal?book=streams&page=my-streams
~~~

It starts the page-turn presentation, pushes the destination URL, and clears search. The selected book and data revision stay the same, so the supporting loader need not refetch streams/subjects for this page selection.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 255)

The workspace finds the parent page and calls book.view for it. Cancellation/key checks prevent a late Science view replacing this destination.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 164 - 177)

My Streams has no stream entity. The view initializes:

~~~ts
let createdStream = null;
const addedSubjects = new Set<number>();
~~~

The source gives createdStream an explicit RecordItem | null type. let permits reassignment after a future creation response.

addedSubjects is a Set of numeric subject ids. A Set retains unique values. Its role will matter during Save and retries; constructing it now does not add any subjects.

The create command is an object containing a label, field descriptions and a run function. Its two fields are Stream name and Subjects. The name uses the text helper; Subjects uses the special subjects field type with options from the loaded catalogue.

The view takes the !stream branch and returns the school-stream overview. It returns before the detail-page subject GET, so opening My Streams does not need to fetch Science's subjects again.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 21 - 26)

text builds a field description, making the name required by default. pageRows turns child pages into navigation rows with Page 1.1 / Page 1.2 detail strings.

The sentence/figure helpers describe React elements for the overview's count text. They do not make a new request to count streams.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 142 - 142)

optionsOf converts catalogue records to { value, label } objects. It stringifies each subject id for HTML control values and uses each subject's name as its label.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 171 - 185)

The overview renders **There are 2 streams…5 available subjects**, Your streams count 2, and two navigable rows.

The numbers come from data.streams.length and data.subjects.length. They are different counts: two bundles can share subjects from one five-subject catalogue.

Each row's pageId makes it a button opening the corresponding detail page. Its arrow SVG is presentation, not a separate request.

The Create a stream command is rendered as an action button with its callback registered.

![Screenshot 2 - My Streams before creating General](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-7-02-my-streams.png)

System Streams is present because the page builder always includes it. Its placeholder view has not run in this task; the principal has not clicked it.

Previous is disabled on this first flattened page. Next can advance to Science. Those controls are separate from the browser's history Back/Forward buttons.

## 7. Create a stream opens a form

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 148 - 155)

The action button's click callback invokes activate with the create command.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 141 - 145)

The command has no pageId, so activate calls onCommand instead of navigating.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 221 - 221)

setCommand stores that command object in state, requesting another render.

The stored run function retains access to the createdStream and addedSubjects variables from the My Streams view invocation. This retained access is called a **closure**. Its significance becomes visible when the command eventually saves; it is not a database transaction or persistent browser storage.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

The conditional command expression mounts CommandDialog with onSaved={refresh} and an onClose callback that clears the command.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 68 - 73)

CommandDialog creates its modal ref/close helper, busy/error/selection state and submitting ref.

busy is false. error is empty. submitting.current is false, so the form is not being saved.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 94 - 110)

The dialog renders its title from command.title ?? command.label. No explicit title was supplied, so the heading is **Create a stream**.

The fields array is mapped into controls:

- Stream name becomes a text input with name="name", defaultValue="", required=true and maxLength=200.
- Subjects becomes AppSelect with multiple and name="subjects". Its child options use the five catalogue values/labels.

The Subjects descriptor does not set required=true. The current command can therefore create a stream without selecting subjects. Your path chooses three.

The ordinary name input uses defaultValue rather than value, and has no app-specific onChange callback here. That makes it **uncontrolled** by React: the browser holds its typed value until FormData reads it.

There is no selection-preview loader on these field descriptors. Opening this form uses the catalogue already fetched for the book.

The × and Cancel buttons call the close helper; Save is a submit button. Their handlers are registered now. We do not invoke Save while describing the initial render.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 9 - 28)

AppSelect reads its option children. Children.toArray and isValidElement are React helpers used to interpret those child descriptions. readOptions builds string values, readable labels and disabled flags.

useId creates a component identifier for accessibility relationships. Refs point to the visible trigger and hidden native select.

No value/defaultValue was passed for these choices. internal initializes from the empty fallback; none of the actual subject ids is selected. selected uses that internal state because there is no controlled value prop.

The summary expression filters selected options, joins their labels, and falls back to **Choose an option**.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 45 - 50)

The visible trigger is a type="button" combobox. Clicking it will open this app's custom selection panel.

A hidden native select has name="subjects" and multiple. It preserves selected option values for the form. The visible trigger is not itself the submitted subject-id list.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

After the form's DOM is committed, the dialog effect calls showModal and locks page scrolling. The browser puts the HTML dialog in its modal top layer.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

The scroll-lock helper saves the old body overflow and sets it to hidden. It returns a cleanup function. Counting locks permits the subject chooser to open as a second modal later without incorrectly unlocking the page when only that inner chooser closes.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 198 - 206)

The dialog CSS supplies its centered size, pale background, shadow, dim backdrop, field spacing and footer alignment. Its heading explicitly uses Georgia, serif.

The input limit, required status and submit behavior are HTML/React properties; the CSS supplies appearance.

![Screenshot 3 - Empty Create a stream form](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-7-03-create-stream.png)

## 8. The principal clicks the name field and types General

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 100 - 104)

The browser focuses the text input. Keystrokes insert G, e, n, e, r, a, l at the caret.

There is no custom name-field focus/keypress/change handler in this render path. The browser implements caret placement, text editing and the input's current value.

React does not need to re-render for each character in this uncontrolled field. The value is still available to the eventual FormData collection.

The maxLength property prevents ordinary editing beyond 200 characters. The required property participates in native form validation at submit.

An empty required name could prevent a submit event before our submit function runs. The name General satisfies that constraint.

No backend request is made just by typing this name.

## 9. Clicking Subjects opens a nested chooser

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 30 - 36)

The trigger's showChoices handler derives its panel label from the associated label and sets open=true.

It clones label text and removes custom-control/SVG content from the clone so the heading is Subjects rather than a mixture of label and current selection text.

setOpen requests a render with SelectPanel. It does not submit the outer form because the trigger is type button.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 54 - 68)

SelectPanel initializes refs, query="", active option index, position and typeahead state.

visible filters option labels against query. The empty query leaves all five options visible. available removes any disabled options. These subject options are available.

active indicates keyboard/pointer focus within the list. It is separate from selected: pointing at a subject can highlight it without selecting it.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 69 - 91)

The layout effect calls showModal on the nested dialog, acquires another scroll lock and measures the trigger with getBoundingClientRect.

It computes a bounded panel width and position. The SVG backdrop mask leaves a transparent cut-out around the trigger while dimming the rest of the screen. encodeURIComponent prepares the SVG for a data URL; this is generated local presentation, not an external image download.

The desktop branch places the choices near the trigger and clamps them within the viewport. A resize listener recalculates placement.

With five options, the list receives focus. The search input is only rendered for more than eight options, so no search box appears here.

These browser DOM/layout APIs position the panel. They do not look up more subject records.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 114 - 121)

The panel renders a Subjects heading, a listbox with aria-multiselectable=true, five option rows, and a **Done** button.

Each option reports aria-selected from selected.includes(option.value). Selected options show a tick. Unselected options in a multiple chooser show a small circle.

A row's pointer-move handler changes the active index; its click handler prevents default and calls choose(option). Those callbacks are registered for the actual interactions that follow.

## 10. The principal selects three subjects

The images show the final selected set, not every intermediate click. We trace selecting English Home Language, Geography and Life Sciences, with no evidence of selecting Mathematics or Physical Sciences.

The exact order of the three clicks is not established by the images. It does not change the final set, and the submission order follows the native option order.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 93 - 97)

For each selected option, SelectPanel.choose checks disabled, then calls onChoose.

Because multiple is true, an unselected value is appended to the selected array. An already-selected value would be filtered out instead, giving toggle behavior.

The condition if (!multiple) close() is false. Therefore selecting one subject leaves this multi-select chooser open for the next selection.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 37 - 44)

The parent's choose function iterates the underlying native select's options and sets each selected property according to the new list.

It stores the internal string array, clears invalid, and dispatches a bubbling change event. The native select's onChange fallback is a no-op here; AppSelect's own internal state already records the selection.

This is ordinary client-side state/DOM work. It does not add a stream-subject row to PostgreSQL yet.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 25 - 36)

Each internal-state update re-renders the summary from the selected catalogue options.

The displayed names use catalogue order, so the summary becomes:

~~~text
English Home Language, Geography, Life Sciences
~~~

That order need not be the order in which the three choices were clicked.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 117 - 121)

The chosen rows get their ticks; Mathematics and Physical Sciences retain circles. The Done button remains available.

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 19 - 27)

The chooser CSS supplies scrollable options, spacing, selected/active backgrounds, tick alignment and the footer button.

The selected presentation comes from aria-selected; pointer highlight comes from data-active. A highlighted row alone would not prove it was selected, but the ticks and summary establish your three selected subjects.

![Screenshot 4 - General entered and three subjects selected](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-7-04-subject-choices.png)

The darker outer page and still-visible Create a stream form reflect two nested dialogs. We have not saved the form.

## 11. Done closes only the subject chooser

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 121 - 121)

Clicking Done calls the nested panel's close function. Its type is button, so it does not submit Create a stream.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

For an open dialog with ordinary motion enabled, close marks it as closing/inert and schedules dismissal after 140 ms. Reduced-motion preference can make dismissal immediate.

The function guards against duplicate scheduled closes. This is a modal transition, not a database operation.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 54 - 60)

The dismissal callback closes the native nested dialog and invokes the supplied panel onClose.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 49 - 49)

That callback sets open=false and restores focus to the visible subject trigger. React removes SelectPanel.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 89 - 91)

The layout-effect cleanup removes the resize listener, closes the panel and releases its scroll lock.

The outer Create a stream dialog is still open and keeps its own lock. The selected values remain in AppSelect/native select; closing the choices does not reset them.

![Screenshot 5 - Ready to save General](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-7-05-ready-to-save.png)

The name and three choices are prepared. **Done** completed choosing; **Save** will request persistent creation.


## 12. Save collects the name and all selected subject values

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 79 - 92)

Clicking Save submits the outer form after native validation succeeds.

submit calls event.preventDefault so the browser does not navigate with a default form submission.

This command has no renderContent handler, so it uses the shared submit path. The submitting ref prevents overlapping submissions.

new FormData(event.currentTarget) reads the actual form controls. The relevant entries are:

~~~text
name      General
subjects  String(E)
subjects  String(G)
subjects  String(L)
~~~

A multiple select contributes repeated entries with the same name. FormData preserves them.

The handler also creates values through Object.fromEntries after filtering string entries. An object can hold only one property per key, so values.subjects alone would not represent all three choices. The command deliberately uses formData.getAll("subjects") later.

The ordinary fields loop trims the Stream name value and checks its required status. Subjects is not marked required, so its absence would not fail this loop. Your form has three subject entries.

submitting.current becomes true, busy becomes true and error is cleared.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 94 - 108)

The form controls receive the busy disabled state. Cancel, × and Save are disabled, and Save displays Saving….

The subject panel is already closed. The saved submission uses the FormData snapshot, not the panel's visual labels.

The handler awaits command.run(values, formData).

## 13. The command first creates the stream record

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 169 - 170)

createdStream is still null in this command's closure, so the first branch executes:

~~~text
POST /schools/S/streams
Body: {"name":"General"}
~~~

The selected subjects are not included in this first request. They will be added after the stream's new id is known.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 218 - 221)

api.post JSON-stringifies the supplied object and calls the common request helper with method POST.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 211)

The helper attaches Content-Type: application/json, the current bearer token and applicable credentials, then sends fetch to the configured backend.

JSON is the text format used to send this object. It is not a database table or a separate server.

await pauses this command's continuation until the response arrives. The backend must finish creating the stream before the command can address its membership endpoints.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

Express applies its CORS/header/logger middleware, and express.json parses this JSON request body into req.body.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 25 - 31)

The streams prefix guards authenticate the principal, obtain current school-administration rights and verify school S. These checks run again for this write; the earlier GETs did not permanently authorize it.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 54 - 78)

The POST handler also has its own requireAuth/requireSchoolAdmin chain. On this route, the configured write capability is streams, and the principal passes.

It parses the school id and checks the school exists. It then validates req.body with createStreamSchema.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 45 - 47)

The Zod schema requires name to be a string with at least one character. safeParse returns a success/failure result rather than relying on browser TypeScript types.

The shared UI has already trimmed this name and limited ordinary input to 200 characters. Those browser behaviors are distinct from the checks this particular backend schema implements.

General passes, so the handler calls createStream.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 13 - 16)

createStream calls db.insert(streams).values({ schoolId, name }).returning().

Drizzle produces a parameterized INSERT. PostgreSQL creates the row and returning returns its data. The [stream] syntax takes the first result from the returned array.

(File: [Project-Edu-Revo/src/db/schema/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streams.ts), lines 8 - 13)

The existing streams table has a generated id, school foreign key, name and default created timestamp.

This INSERT stores the name **General** and links the stream to school S. It does not create new English/Geography/Life Sciences definitions, assign a class or add subject membership yet.

PostgreSQL allocates id **57**, as confirmed by your final URL. The frontend did not choose 57 in advance or derive it from the stream's name.

The schema file describes the table used by this INSERT. Its CREATE TABLE/migration work happened earlier; it is not executed by every Save.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 75 - 77)

The handler responds with HTTP 201 Created and the stream record as JSON.

At this point the named stream exists persistently even though the subject-link requests have not run. This workflow is not one transaction spanning all four HTTP requests.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 207 - 211)

The helper checks the response status and parses the stream JSON.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 170 - 172)

The awaited result is assigned to createdStream in the command's closure. It now contains id 57 and name General.

The else-if rename branch is skipped on this first save because the initial create branch was taken.

The code enters the for...of loop over formData.getAll("subjects").

## 14. Each subject is linked through its own POST

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 172 - 172)

For the first selected native option, Number(selected) converts E's form string to its numeric subject id.

addedSubjects is empty, so has(E) is false. The command sends:

~~~text
POST /schools/S/streams/57/subjects
Body: {"subjectId": E}
~~~

E is a numeric placeholder here; the actual JSON contains the English Home Language id.

This is not a call to create an English subject. It requests a link between the existing subject and new stream 57.

Each await is inside the loop, so the next selected subject is not posted by this command until the current POST completes.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 28 - 37)

The request runs the school-level guards again. The stream-id middleware selects stream 57 within S, rejecting an invalid id or cross-school stream.

There is no streamSubjectId parameter on this collection POST, so the middleware for an existing individual membership is not needed here.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 146 - 167)

The POST handler repeats its registered guards, parses school/stream ids and validates the JSON body with addSubjectSchema.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 49 - 51)

That schema requires subjectId to be a positive integer. The database relationship also requires the referenced subject record to exist.

The handler calls addSubjectToStream with { streamId: 57, subjectId: E }.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 62 - 71)

addSubjectToStream opens a transaction for **this one membership operation**.

It takes the advisory transaction lock (7411, 0), then reads/locks stream 57 using FOR UPDATE. The workflow lock coordinates cooperating operations; the row lock protects the selected stream row within the transaction.

The function inserts a stream_subjects row and obtains it through returning.

(File: [Project-Edu-Revo/src/db/schema/streamSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streamSubjects.ts), lines 9 - 16)

The link table has its own generated id, streamId and subjectId foreign keys, timestamp and unique stream/subject pair.

The same English Home Language subject can belong to Science, Biology and General through three separate links. There is no need to duplicate the English catalogue record.

A link id is not the same as subjectId. Later the row Delete action will address the link id.

### The membership save checks classes using General

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 67 - 69)

After inserting the membership, the function awaits syncStreamClasses within the same transaction.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 52 - 56)

syncStreamClasses looks for classes using stream 57 through either classes.streamId or class_streams.

For each affected class it would increment streamRevision, then call syncClassSubjects to reconcile its allocations while preserving historical teaching records.

On the scenario's newly created General path, no class has been assigned General. The affected list is empty, so both loops execute zero iterations.

Grade 9B was assigned Biology in Chapter 6, not General. Creating this new bundle does not silently switch that class to it.

The SELECT still runs even when it finds no affected classes. The nested synchronization body does not run for an empty result.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 69 - 71)

The membership transaction returns its inserted link and commits successfully.

This membership and any synchronization work it required are atomic together. That does not make the stream-name request and the other subject POSTs one larger atomic transaction.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 162 - 167)

The route responds with 201 Created and the membership record.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 172 - 172)

The browser helper resolves, and the command adds E to addedSubjects.

Only after that successful response does the set record the subject as successfully added.

The loop repeats the same request/validation/transaction/response sequence for:

~~~text
POST /schools/S/streams/57/subjects  {"subjectId": G}
POST /schools/S/streams/57/subjects  {"subjectId": L}
~~~

The form/native option order is English Home Language, Geography, Life Sciences. That order is independent of any different click order used to produce the same selections.

After all three responses succeed:

~~~text
createdStream.id = 57
addedSubjects = Set containing E, G, L
~~~

The database now has the General stream plus three membership rows linking it to the existing subjects.

## 15. What the command would do if a subject addition failed

This successful screenshot sequence does not show a failure. The following explains the error handling surrounding the operation we just followed.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 170 - 174)

If a membership request fails after the stream name or earlier links have committed, catch throws the specific message explaining that the stream was created but some subjects could not be added.

The earlier successful HTTP operations are not automatically rolled back by this browser catch.

The command keeps createdStream and addedSubjects in its closure while that same dialog command remains active. Saving again can reuse id 57 and skip ids whose POSTs already succeeded in this command.

If the user changes the name before retrying, the else-if branch can PATCH the created stream name rather than create another stream.

This is the intended retry behavior for the active command, not a guarantee that the browser knows every possible server outcome. For example, a lost response can leave uncertainty about an operation the server committed.

Closing/reloading the form does not preserve this in-memory closure as a durable pending transaction. The message accordingly offers closing and refreshing the book to review what exists.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 90 - 92)

A command failure would reach the dialog's catch, display an error and release busy/submitting in finally. It would not follow the successful refresh/close sequence.

On your observed successful path, all three memberships finish and the command returns **stream-57**.

## 16. The successful command selects the new page and refreshes the book

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 174 - 174)

The return string uses the new record's id. It is an application page identifier, not a new physical stream-57.tsx file generated on disk.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 89 - 92)

The submit handler receives pageId="stream-57" and awaits onSaved(pageId). The parent supplied refresh as that callback.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 315 - 318)

refresh has a nextPage this time. It calls navigate with the current book and stream-57, then increments revision.

That differs from Chapter 6's stream-assignment save, which returned no new page id and kept class-179 selected.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 310)

navigate prepares:

~~~text
/dashboard/principal?book=streams&page=stream-57
~~~

The old page tree still contains only two streams, so it does not yet know this new page's index. The navigation code handles that temporary missing-index case while the revision-triggered reload obtains the new data.

It starts the turn, pushes the URL and clears search. It does not need a human click on a new sidebar entry that has not been rendered yet.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 246)

The revision invalidates the old loaded book data and makes the loader run again.

refresh schedules this React update; it does not await all the network requests launched by the effect. Its async promise can resolve before the book finishes loading.

The dialog's successful submit continuation starts closing while refreshed data can still be in flight. A loading/preparation state may occur before the final screenshot.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 162 - 163)

The loader repeats:

~~~text
GET /schools/S/streams
GET /subjects
~~~

The route/helper/service paths described in steps 3–4 run again. The school's streams result now includes General, and the shared catalogue still contains the same five subjects.

The new bundle did not create a sixth catalogue subject.

The page builder maps the refreshed stream array into child pages. In your observed response order General is third, so it becomes page **1.3**. There is no alphabetical sort here that would place General before Science.

The flattened count becomes five:

~~~text
1    My Streams
1.1  SCIENCE STREAM
1.2  BIOLOGY STREAM
1.3  GENERAL STREAM
2    System Streams
~~~

These are five navigable pages, of which three represent the school's streams.


## 17. The creation dialog closes

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 90 - 92)

After onSaved resolves, submit calls onClose and then releases busy/submitting in finally.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

The outer dialog's close helper marks the open node as closing/inert and schedules dismissal after the 140 ms exit interval, unless reduced motion requests immediate dismissal.

This is the Create a stream dialog, not the subject chooser we already closed with Done.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

The dismissal callback clears command. React removes CommandDialog.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

Its effect cleanup closes the native node and releases its remaining page-scroll lock.

The command's local form/closure state is no longer the active editor. The saved records remain in PostgreSQL.

Animation, URL changes, request completion and React rendering can overlap. The source defines these dependencies, but still screenshots cannot establish the exact millisecond ordering of their paints.

## 18. The new General page fetches its three saved links

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 255)

When the refreshed data is stored with the new revision, the workspace finds page stream-57 and invokes the book view for it.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 164 - 178)

page.entity is now General. The view takes the detail branch and requests:

~~~text
GET /schools/S/streams/57/subjects
~~~

This is a read of the saved result. It does not rerun the create command or add the selected subjects again.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 28 - 37)

The school/access guards and stream-ownership middleware verify stream 57 belongs to S.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 171 - 179)

The GET handler calls getStreamSubjects.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 106 - 118)

The query joins stream_subjects to subjects and orders by subject name. It returns English Home Language, Geography and Life Sciences.

This ordering explains the final rows. They are not sorted by the order in which the user happened to click choices or by the membership ids.

The API's membership ids let the frontend identify each link if a later Delete is requested. The subjectId field identifies the shared catalogue subject for tasks such as excluding it from Add subject choices.

The helper parses the successful JSON response, and the registry can finish constructing the view.

## 19. The final controls and subject rows are rendered

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 179 - 183)

The view supplies the guidance about managing subjects and preserving existing class teaching records.

It creates three row descriptions, each with its membership id as UI id, subjectName as title, and a Delete command.

The section's **Add subject** command filters the catalogue to subjects not already in this stream. At this ending point, Mathematics and Physical Sciences are the remaining choices. This filter is computed for the action; the Add subject dialog has not been opened.

**Rename stream** registers an editing command with the current saved name. **Delete stream** registers a stream-deletion command.

These are descriptions and callbacks awaiting future interaction. Merely rendering the final page does not rename/delete General or remove any membership.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 21 - 24)

The remove helper describes a confirmation command and an async run callback that would call api.delete. The stream-subject rows use their specific Remove this subject from the stream? confirmation.

That callback is not invoked during this task. A Delete control here refers to removing the stream membership; it does not imply deleting English Home Language from the shared catalogue.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 138 - 141)

streamLabel formats General as **GENERAL STREAM**. The stored name remains General.

The same formatting is used for the main page title, sidebar label and breadcrumb. Matching text in several places does not mean several duplicate stream records exist.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 185)

WorkspacePage renders the title actions, guidance, Subjects section and three rows.

The row count is the filtered rows array's length: **3**. With an empty query all three remain, and the default search threshold is not met.

There are no stream-page tabs. The Learners/Subjects tabs belonged to the class view in the previous book.

Each row uses the rowText branch, because it is a membership display rather than a page-navigation row. Its Delete button receives the stored command through activate.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 42 - 47)

MobileAction renders the actual action button with the supplied callback, label and accessible title. Desktop styling can give a button the appearance of a text action; its behavior still comes from its click handler.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 93 - 96)

The book's filled/outline action styles distinguish Rename stream and Delete stream, and supply the solid Add subject action.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 117 - 129)

The row/text-button rules supply spacing, dividers and the underlined Delete presentation. Colours come from the current book accent.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 358)

The shell renders GENERAL STREAM selected in the contents, the Streams / My Streams / GENERAL STREAM breadcrumb and **Page 1.3 · GENERAL STREAM** footer.

Previous can go to Biology, and Next can go to System Streams in the flattened page order. Neither is clicked before this task ends.

The right shelf still highlights Streams. Navigation help and Sign out remain wired to their own actions, which have not run here.

The current URL is now:

~~~text
http://localhost:3001/dashboard/principal?book=streams&page=stream-57
~~~

(File: [src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts), lines 8 - 16)

The completed URL change also triggers the navigation-memory effect.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 50 - 63)

It stores this validated location as the current Streams-book address for this browser/account/school/role. A later click on the Streams cover can therefore reopen General, just as a remembered Science page could explain the opening screenshot.

This address memory does not contain the subject selections as a draft. The stream and memberships are loaded from the backend.

![Screenshot 6 - General stream saved with three subjects](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-7-06-general-stream.png)

## 20. Map the actions to the code you would inspect

| What the principal sees or does | Running path |
| --- | --- |
| Click Streams cover | Shelf handler → navigate → optional per-book memory lookup → router.push. |
| Science page appears | Streams/catalogue load → page tree → Science memberships GET → detail view. |
| Open My Streams | Page navigation → overview using already-loaded book data. |
| Click Create a stream | activate → setCommand → CommandDialog form. |
| Type General | Native text input holds the edited value. |
| Choose three subjects | AppSelect/SelectPanel update internal state and native multiple select. |
| Click Done | Inner chooser closes; the outer form and chosen values remain. |
| Click Save | FormData snapshot → name POST → three sequential membership POSTs. |
| General page opens | Returned stream-57 → refresh/navigation → new tree → memberships GET. |
| See three Delete controls | Registered future commands, with no deletion performed. |

At this endpoint there is one new school bundle and three links to existing subjects. Assigning that bundle to a class is a separate operation, like the Biology assignment in Chapter 6. Nothing in this creation path replaces Grade 9B's Biology selection.

