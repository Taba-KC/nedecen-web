# Chapter 3 - Creating Grade 9B with a description and no class manager

**Starts:** An already signed-in principal clicks the Grades & Classes book, selects Grade 9, and starts creating a class.

**Ends:** Grade 9B is saved and open. The left navigation contains Grade 9 → Grade 9B → Bulk import learners, as in your screenshot.

We enter the class label **B**, enter a description, leave Class manager at Choose an option, and click Save.

This is a source-code trace checked against your supplied endpoint screenshot. I have not created another class, changed school data, or inspected your live database to write it. The screenshot shows the URL ending in page=class-179, so **179 is the class id in your captured result**. A new run would receive whatever id PostgreSQL generates; it must not hard-code 179.

The screenshot does not reveal the school id, Grade 9's database id, or the text of the description you entered. I will call these S, G9, and “your description”. These are explanatory placeholders, not values sent literally by the application.

The principal is authorised, the API is reachable, the token remains valid, and Grade 9B does not already exist when Save is submitted. We use the desktop presentation in your screenshot, with the tutorial completed.

This chapter starts at your requested book click rather than repeating login. For the main opening trace, the book is not currently selected. If you are continuing directly from Chapter 2 with this book already open, clicking the same cover can reuse its existing data; it does not inherently force another load. Selecting Grade 9 and creating the class then follow the same path below.

## 1. Clicking the book identifies the Grades & Classes definition

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 145)

The browser hit-tests your click, and React's capture handler on the surrounding library runs before the clicked book's own handler.

event.target can be a span within the cover. closest walks its ancestors to find the matching shelf button.

On desktop, this handler clears temporary drawer state. It does not close the permanent bookshelf column and does not prevent the button's handler from running.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 350 - 355)

The cover button calls navigate(item.id). For this book item.id is grades. The label, cover colour, and id were already supplied by the book registry; the click does not create a new book object.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 300)

navigate receives nextBook="grades" and no nextPage/nextTab.

It checks importChanged, which is false in this task. It then looks for a remembered location for this account's principal/grades book.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 66 - 75)

rememberedLibraryLocation reads the account-specific browser memory, choosing its books.grades entry. It returns a validated saved URL if present, otherwise null.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 11 - 22)

identity determines the storage key from account type, account id, school id, and principal mode. This browser memory separates users/schools; it is not a database query.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 43 - 48)

read parses the stored JSON or supplies empty memory. Invalid JSON is caught and treated as empty.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 25 - 40)

If a saved address exists, libraryLocation checks the path/book and allowed query parameters and reconstructs a local URL. Parsing with new URL does not contact its dummy base address.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 297 - 309)

navigate constructs URLSearchParams from the remembered query, or starts with book=grades. It preserves a remembered page when applicable.

If changing the selection, it calls turn to animate the outgoing paper, records that animated destination, and pushes /dashboard/principal?[query] with scroll:false. That option avoids scrolling the entire window to its top.

This is a Next.js client navigation. It changes the browser history and route/query state without logging in again.

The particular page first resumed is immaterial to our next explicit Grade 9 click. If there is no remembered page, the loaded book defaults to its first grade.

### The visual turn runs independently of data

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 91 - 128)

turn clears an older animation, checks reduced-motion preference and mounted DOM refs, calculates direction/timing, and creates temporary front/back/curl/shadow elements.

It calls placeSnapshot for visual copies and the browser's Element.animate for motion. It waits on animation.finished Promises to clean up. It does not load classes or change the database.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 16 - 50)

snapshot deeply clones the current paper DOM, removes animation/spine decorations and ids, makes the copy inert and aria-hidden, and records displayed values/scroll positions. placeSnapshot inserts that visual copy into an animation layer.

These are non-interactive pictures made from DOM, not second React workspaces.

(File: [src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts), lines 22 - 45)

The helper functions build clipping polygons, transforms, opacities, and staggered timing. A single-sheet turn lasts 340ms. The magnitude of the requested distance determines how many layers are used.

With reduced motion the hook skips the turn, while navigation proceeds normally.

## 2. The book loads records and constructs pages

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 198 - 237)

When search parameters select grades, books.find identifies that definition. React derives data only when loaded matches both this book and the current revision.

Initially there may be no matching data or view, so the component returns its Preparing your page… state.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 239 - 246)

After commit, the load effect reads the school id and calls book.load(S). It uses a cancelled flag so a late result for an obsolete selection cannot replace current data.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 95 - 100)

getSchoolId converts the stored school string to a number using parseInt with base 10 and returns null for NaN. The backend will still verify school ownership.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 100 - 102)

The book's load function starts structure(S), a streams GET, and a people GET inside Promise.all.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 15 - 16)

base builds /schools/S; get delegates to the shared api.get expecting a record array.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 47 - 50)

structure first requests grades, sorts them by educational number, then requests each grade's class list in parallel and flattens the results.

The feature URLs are:

~~~text
GET /schools/S/grades
GET /schools/S/streams
GET /schools/S/people

After grades arrive:
GET /schools/S/grades/[each returned grade id]/classes
~~~

S and the bracketed expression stand for actual numeric values. With five normal grades, this is eight feature GET requests. They do not all finish in a predetermined order.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 223 - 224)

api.get delegates to request with method GET.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 211)

request checks legacy refresh storage, obtains the current in-memory token, and calls fetch with credentials included and an Authorization: Bearer header.

It declares JSON content, checks whether an expired-token retry is needed, rejects unsuccessful responses through parseError, and parses successful response JSON.

Our valid-token path does not call refreshAccessToken. Cross-origin preflights can precede the feature requests; their exact number depends on browser preflight caching.

### Backend handling for this initial load

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

Each request passes through registered CORS, response-header, JSON-parser, and request-logger middleware where applicable. CORS may answer OPTIONS before later handlers. The security middleware sets no-store, preventing normal reuse of these protected responses as a shared HTTP cache.

These registration statements ran at server startup; now their middleware functions handle incoming traffic.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

Protected route checks verify the JWT's signature/expiry, read the current staff account and school, update its current role, attach req.caller, and continue.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

The administrative middleware calls staffAccess, compares the requested school, chooses GET read capabilities, and allows the current principal.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 17)

staffAccess reads the staff row, grants, active teaching allocations, and eligible chapter assignments. Its returned isPrincipal comes from the current database role, not editable browser metadata.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 12 - 27)

For grades, prefix middleware performs token/access/school-id checks. The exact GET checks that the school exists and returns its grade rows.

(File: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts), lines 33 - 36)

getSchoolById selects the matching school and returns its first row or null.

(File: [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts), lines 14 - 16)

getGradesBySchool selects rows for the school and orders by grade number. Grade 9's educational number 9 and its database id G9 are different concepts.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 26 - 31)

Streams requests pass their prefix's token/access/school checks.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 82 - 96)

Their exact GET repeats token/access checks, confirms the school, and calls the stream-list service.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 21 - 23)

The service reads this school's stream rows.

(File: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts), lines 57 - 64)

The people GET checks token/access and school existence, then calls getPeopleBySchool.

(File: [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts), lines 27 - 61)

That service selects staff display/account-status fields, administrative grants, and assignment counts with joins/grouping. It omits password hashes. These staff records supply the class-manager chooser later.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 14 - 19)

Each longer grade/classes URL also matches the grades-router prefix, so its authentication and administrative checks execute there before processing moves on.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 29 - 38)

The classes-router prefix repeats those checks and confirms the requested grade belongs to the school.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 107 - 123)

The exact class-list GET repeats authentication/access checks, validates parameters, confirms the school, and invokes getClassesByGrade. Thus this mounted path can run those shared permission checks three times for one class-list request.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 90 - 125)

The service selects classes, stream membership ids, description, manager information, and learner counts, joining people/learners and grouping by class-related fields. It returns even classes without managers/learners because those are left joins.

Each route serialises its result as JSON. The frontend parses the arrays; Promise.all resolves when all branches succeed, and the load effect stores the combined records.

### Building the tree

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 103 - 108)

The pages function maps grade records into parent nodes, class records into children, and one Bulk import learners node into each class's children.

No .tsx file is created for these nodes. They are objects describing navigation within the same workspace.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 115 - 129)

flattenPages creates parent-before-descendant reading order. findPagePath finds ancestors for breadcrumbs.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 237)

The component selects a page from the URL or falls back to the first flattened page and prepares its view keys.

The sidebar can now show the tree. We next explicitly select Grade 9, regardless of which page the book initially resumed.

## 3. You click the Grade 9 heading

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 39 - 45)

Contents rendered each heading as a button. Clicking Grade 9 calls its onNavigate(page.id) with grade-G9, where G9 is that record's id.

The displayed 2 beside Grade 9 is a book page number. It is not G9 and is not the educational grade number.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 145)

The wrapper's capture handler sees a contents button. On desktop the compact-menu dismissal condition is false, so it leaves the permanent column in place.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 326)

The supplied onNavigate callback calls navigate(book.id,id): grades and grade-G9.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 309)

Because an explicit page is supplied, navigate does not need a remembered per-book page.

It constructs book=grades&page=grade-G9, computes the page-turn distance from flat indices, starts the turn, pushes the query, and clears the search filter.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 255)

The same loaded book data is still usable: neither book nor revision changed. Therefore selecting Grade 9 does not itself require the eight book-load GETs again.

The selected page and pageKey change. The previous page's view is not reused under a different pageKey. The view effect calls book.view for Grade 9.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 109 - 117)

The grade branch filters this grade's classes, sums learnerCount values, and describes the grade page. It returns a Classes in this grade section with a classCommand action.

The grade branch does not fetch the learners of every class. Its counts came from the class-list data already loaded.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 57 - 62)

classCommand is called with the school, loaded data, and Grade 9 record, **without** a cls argument. It produces:

| Field name | Display label | Initial value | Required? |
| --- | --- | --- | --- |
| label | Class label (for example A) | Empty | Yes |
| classTeacherId | Class manager | Empty | No |
| description | Description | Empty | No |

The description field's type is textarea and its maximum length is 200.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 21 - 22)

text and select are helper functions returning field-description objects. Their default parameters supply empty values and required flags.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 130 - 142)

optionsOf maps staff to string ids and readable names, using nameOf where needed. It creates choices, not a manager assignment.

The command's run arrow function is created but not executed yet. Its **closure** remembers the grade/data values from this call so a later Save can use the right grade.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

The view result is stored in viewState. React renders the successful Grade 9 page.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 157 - 185)

WorkspacePage renders the title, grade description, class-list section, and create action. A fresh empty Grade 9 shows its empty-state text; an existing list would be rendered from rows.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 145 - 155)

contextAction passes the create action to MobileAction and registers a handler that will call activate(action).

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 7 - 14)

actionIconFor recognises Create and supplies the add icon.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 42 - 46)

MobileAction returns the real button with the action label, classes, accessible text, and forwarded onClick callback.

The visible action is Create a class in Grade 9. It has not saved anything.

## 4. Clicking Create a class in Grade 9 opens the command dialog

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 151 - 154)

The button's handler calls activate with its command object.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 141 - 144)

activate checks action.pageId. This create action has none, so it calls onCommand(action), rather than navigating to another page.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 341 - 341)

WorkspacePage received setCommand as onCommand. This setter stores the selected command in the parent component's state.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

A rerender now includes CommandDialog because command is no longer null. It supplies the command, a callback that clears command on dismissal, and refresh as onSaved.

Mounting a dialog is a state change; it is not opening a new URL.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 68 - 74)

CommandDialog receives onClose renamed locally to onDismiss, then calls useModalMotion. Its returned ref is named dialog and its close function is named onClose.

This is object destructuring with aliases. The parent dismissal callback and animated close function have different responsibilities.

busy starts false, error is empty, selection is an empty dictionary, and submitting is a ref initially false.

The ref is an immediate mutable guard against duplicate submissions; busy is state for rendering disabled controls and feedback.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

useModalMotion creates dialog/timer refs, a cleanup for pending timers, and a close callback. The close callback does not run during opening.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 94 - 110)

The returned native dialog contains a form, header, generated fields, optional error paragraph, Cancel, and Save.

The title uses command.title if present, otherwise command.label: Create a class in Grade 9 here. The close button and Cancel register callbacks; no cancel occurs in our task.

command.confirm, command.content, and command.renderContent are absent, so those optional sections do not produce custom content or a delete confirmation.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

After the dialog DOM mounts, the effect calls showModal and lockModalScroll. The browser puts the native dialog in its top layer, handles modal focus behaviour, and prevents ordinary interaction with the background.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

lockModalScroll stores the original body overflow when taking the first lock, increments its lock count, sets overflow:hidden, and returns a one-use unlock callback.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 198 - 206)

The dialog is centred, width-limited, padded, bordered, rounded, and shadowed. Its backdrop dims the workspace. Its heading uses Georgia; labels and controls have their own spacing and sizing.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 15 - 22)

The shared open-dialog animation supplies its entrance. Reduced-motion rules can remove animation without changing form functionality.

## 5. The generated form contains three different controls

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 100 - 106)

The command.fields array is mapped to labels and controls. Each control's name is important: FormData will later collect values by that name.

### Class label: a native input with defaultValue

The label field has no special type, so it takes the final input branch. It is a text input named label, required, initially empty, with a default maximum length of 200.

**defaultValue differs from the login form's value={state}.** This text input is uncontrolled: its current editable value lives in the browser's DOM. Typing does not call a label-state setter in CommandDialog.

The browser handles click focus, caret movement, keyboard editing, and native validation. There are no custom onFocus/onChange handlers on this input. The form will read its current value when submitted.

### Class manager: a custom chooser backed by a native select

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 102 - 102)

The select field renders AppSelect, with defaultValue="", required=false, and a first option whose value is empty and text is Choose an option. Staff options follow it.

The property name classTeacherId is historical/internal naming. The UI calls the same relationship Class manager.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 22 - 29)

AppSelect creates an id, button/select refs, internal selected-value state containing the empty string, parsed options, and open=false.

Because no controlled value prop is supplied, its selected values come from its internal state.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 9 - 18)

readOptions walks the React option elements and extracts string values, text labels, and disabled flags. textOf recursively extracts text from React children.

React.Children and isValidElement are library functions used to inspect the option descriptions, not DOM queries to PostgreSQL.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 36 - 50)

The summary matches the empty option and displays Choose an option.

The component returns a visible combobox button plus a **hidden native select** carrying name=classTeacherId and the selected empty value. That native select lets FormData collect a value even though the visible control is a button.

open is false, so SelectPanel is not mounted. We do not open the chooser or select a person in this task. Its showChoices/choose callbacks and the parent's selection update are not invoked.

Leaving the manager unassigned does not mean omitting all manager-related markup; the control exists and retains its empty value.

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 1 - 9)

CSS sizes/styles the visible trigger, hides the native select, positions the chevron, and supplies focus/disabled states. It does not assign a manager.

### Description: a native textarea

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 103 - 103)

The description branch returns a textarea named description, using defaultValue, five visible rows, optional required status, and maxLength=200.

Like the label input, it is uncontrolled. Its current text is not copied into React state on every keystroke.


## 6. You type B and a description, leaving the manager unchanged

Clicking the class-label input gives it native browser focus. You type **B**, not Grade 9B. This field asks for the letter part; the application supplies the grade number.

Clicking Description moves focus to the textarea. You enter your description.

There is no per-character React setter for either control. The browser edits their DOM values, paints the caret/text, and applies matching CSS focus styling. This is different from the controlled login inputs in Chapter 2.

The manager remains Choose an option with a selected value of "". We assume you leave the chooser closed; opening and closing it without selecting a person would leave the same submitted empty value but add chooser-specific events.

No API request has been made by typing these values. Closing/cancelling now would discard this unsaved dialog without creating a class.

## 7. You click Save: collect current form values

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 108 - 108)

The button is type=submit. The browser performs native validation: the class-label field is required, while manager and description are optional. Our non-empty B passes. The description control permits up to 200 characters.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 95 - 95)

The submit event invokes the registered submit handler.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 79 - 84)

The handler:

1. Calls preventDefault to stop native form navigation.
2. Skips a custom-content branch because command.renderContent is absent.
3. Returns early only if submitting.current is already true; it is false here.
4. Constructs new FormData(event.currentTarget).

event.currentTarget is the form whose handler is executing, not whichever input or button was the original event target. FormData reads the form's current successful named controls.

It includes the hidden native manager select even though it is not displayed. Hidden and disabled are different: a disabled control would not be collected, but these controls are not disabled yet.

Array.from(formData.entries()) produces name/value pairs. The filter keeps strings rather than File values. The destructured empty first slot ignores each key while testing its value.

Object.fromEntries converts the remaining pairs into a dictionary-like object. The TypeScript assertion Record<string,string> describes the expected shape; the preceding filtering is the runtime work.

At this point its meaningful values are:

~~~text
label          → "B"
classTeacherId → ""
description    → your entered description
~~~

FormData has not uploaded anything. It is a browser object used to collect values locally.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 85 - 88)

The for-of loop visits each field description. It retrieves the corresponding value, supplies an empty-string fallback, trims leading/trailing whitespace, and writes the trimmed result into values.

The required-field check applies to label. B is non-empty, so no error is set and the function continues. Description is optional, but because you entered it, its trimmed text remains.

Whitespace inside the description is not generally removed by trim. It only removes whitespace at the ends.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 89 - 90)

submitting.current becomes true immediately, then busy state becomes true and error is cleared.

React can now render all controls and dismissal buttons disabled, with Save changed to Saving…. The immediate ref guard also catches a second handler invocation before the busy rerender commits.

Importantly, FormData was collected **before** disabling these controls. Disabling them now does not remove values from the already constructed object.

The handler calls command.run?.(values,formData) and awaits its result. Optional chaining calls run only if present. It is present for class creation.

Passing formData as a second argument is allowed even though this particular run callback only declares a values parameter; it simply does not use the extra argument.

## 8. The create-class command builds the name and JSON payload

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 63 - 65)

Now the command's previously created run callback executes.

It uses the grade remembered by the closure: Grade 9, whose educational number is 9.

It trims the label, uppercases it, and builds the name from grade.number plus that label:

~~~text
9 + "B" → "9B"
~~~

The plus sign here illustrates concatenation inside the source's template literal. The actual stored name is the string 9B. Grade 9B is the display label added later.

The duplicate check runs some over data.classes, requiring the same grade id and a case-insensitive matching name, while excluding a current class id during editing.

This is creation, so cls is undefined and there is no existing id to exclude. We assume no Grade 9B, so the predicate never finds a duplicate and the local error branch does not run.

This is an early usability check using already loaded data, not sufficient authority against every simultaneous request. The backend and database also check uniqueness.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 66 - 68)

The path becomes /schools/S/grades/G9/classes.

The payload contains:

| Property | Result | Reason |
| --- | --- | --- |
| name | "9B" | Grade number plus uppercased label. |
| classTeacherId | null | Number("") is 0, and 0 is falsy, so the OR fallback selects null. |
| description | Your trimmed, non-empty text | Its truthy string is retained instead of the null fallback. |

An illustrative JSON body, using an example description rather than claiming your exact words, is:

~~~json
{
  "name": "9B",
  "classTeacherId": null,
  "description": "Example description for this class."
}
~~~

null is a JSON null value, not the string "null". It expresses no manager relationship.

There is no streamId property in this creation form. Leaving class manager empty and leaving stream unassigned are separate facts; the form simply offers no stream selector here.

Because cls is absent, the conditional chooses api.post. Editing an existing class would choose api.patch instead, but that branch does not execute.

## 9. The browser sends the create request

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 220 - 221)

api.post serialises the payload with JSON.stringify and calls request with method POST.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 190)

request checks for a legacy refresh credential and obtains the current access token.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 58 - 61)

getRefreshToken reads legacy localStorage state. It is absent for this normal current session, so no preliminary refresh is called.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 49 - 52)

getAccessToken delegates to currentAccessToken.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 30 - 35)

The current valid in-memory access token is returned. Its value is not added to the JSON class object.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 182 - 190)

fetch is called with:

~~~text
POST [API_BASE]/schools/S/grades/G9/classes
Authorization: Bearer [current access token]
Content-Type: application/json
credentials: include
body: the serialised class object
~~~

The brackets are explanatory placeholders. The actual URL/header uses the real configured address and values.

The browser may first send an OPTIONS preflight if origins differ and no applicable cached preflight exists. CORS middleware handles that before the actual POST. It does not create a class during OPTIONS.

fetch returns a Promise. The form remains mounted and can display Saving… while the network and database work runs.

## 10. Express validates who is creating a class, and where

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

For the POST, registered middleware supplies CORS headers, security/no-store headers, parses the JSON body up to its size limit, and logs the method/path.

express.json turns JSON text back into req.body: a JavaScript object. Parsing JSON is not the same as validating its allowed fields.

The /uploads static-file middleware does not match this request.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 66 - 86)

The login/refresh/onboarding limiters do not match this class URL. The request traverses routers in their mounted order, including the earlier grades router before the classes router.

The auth router's /auth origin guard does not match a class path; this request's protected-route token and school checks are the relevant authorisation steps.

### First matching prefix: grades

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 12 - 19)

The longer /schools/S/grades/G9/classes path still matches the grades prefix.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

requireAuth checks the Bearer header, verifies the token's signature and expiry using jwt.verify, reads the current person row for its account/school, checks setup, updates its role, attaches caller, and calls next.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

The administrative check asks staffAccess for current rights, confirms the requested school, chooses write capabilities because this is POST, and permits the principal.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 17)

That computation queries the current person, grants, active allocations, and eligible chapter assignments as in the initial reads. Live role/ownership are used rather than trusting the form's browser state.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 15 - 19)

The prefix validates the positive safe-integer school id and caller-school match. No exact grades endpoint handles this longer URL, so Express continues.

### Second matching prefix: classes

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 29 - 38)

This prefix repeats requireAuth and requireSchoolAdmin and validates grade id, school match, and a database grade row matching both ids.

G9 belongs to S, so it calls next.

The more specific middleware requiring a :classId does not match this creation URL; the class does not have an id yet.

### The POST handler

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 67 - 85)

The route itself again specifies requireAuth and requireSchoolAdmin, then its handler converts the URL parameter strings to numbers.

On this mounted path the shared authentication/administrative checks can therefore run three times, just as for class-list reads.

The invalid-number branch is skipped. getSchoolById confirms the school exists.

(File: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts), lines 33 - 36)

The school lookup selects its row or returns null. It returns our existing school.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 82 - 85)

Now createClassSchema.safeParse(req.body) validates the parsed object.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 45 - 50)

The Zod schema accepts:

- A non-empty name string.
- An optional positive-integer or null streamId.
- An optional positive-integer or null classTeacherId.
- An optional, trimmed description string of at most 200 characters, or null.

Our missing streamId is permitted, null manager is permitted, and the entered description is retained.

nullable permits null; optional permits a missing/undefined value. They are different conditions. Without nullable, an explicit null manager would fail even though omission was permitted.

safeParse performs runtime validation. TypeScript types alone could not protect this endpoint from arbitrary browser input.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 88 - 90)

The handler calls createClass with gradeId from the URL plus the validated body. It does not accept an unverified grade id from an arbitrary form field.

## 11. The class service checks and normalises the name

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 71 - 76)

createClass queries the grade by id and verifies it exists. The preceding route already checked its school.

It calls normalizeClassName(data.name,grade.number) and then ensureUniqueClassName.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 37 - 49)

normalizeClassName:

1. Trims the raw name and removes a leading word Grade if present.
2. Removes the selected grade's numeric prefix and following whitespace.
3. Removes remaining whitespace.
4. Uppercases the identifier.
5. Requires one or more A–Z letters.
6. Returns the grade number plus the identifier.

For rawName="9B" and gradeNumber=9, the intermediate identifier becomes B and the return value is 9B.

The regular-expression i flag ignores case; g means all matches; ^ and $ anchor the beginning and end. new RegExp constructs a pattern containing the current grade number.

Entering B in our label field avoids double-prefixing before this service. The frontend already adds 9; the backend independently canonicalises the resulting full name.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 55 - 65)

ensureUniqueClassName queries classes matching gradeId and canonical name. It searches results for a row other than an optional edited-class exception.

There is no existing row in our successful case, so it returns without throwing DuplicateClassNameError.

No database insertion has occurred yet.

## 12. A transaction inserts the class and synchronises its subjects

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 78 - 84)

db.transaction calls our async callback with tx, a transaction-bound query interface.

A **transaction** groups database operations so they commit together on success or roll back on failure. Drizzle manages the transaction commands and connection; we use tx for the related statements.

The first SQL call acquires pg_advisory_xact_lock(7411,0), a transaction-scoped PostgreSQL advisory lock used by these school workflow operations. It coordinates with other code using the same lock and is released at transaction end.

This is a database synchronisation mechanism, not a browser lock or a row created for the class.

The if(data.streamId) branch is false because streamId is absent. No stream row is locked by that branch.

Then tx.insert(classes).values({...data,name}).returning() inserts the class.

The spread copies the validated properties, and the final name property supplies the canonical name. returning asks PostgreSQL to return the inserted row, including generated/default values. Array destructuring takes its first row as cls.

### What the insert means in the database

(File: [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts), lines 11 - 24)

This schema mapping was loaded before the request; it does not create a table now. It describes the columns used by the query:

- id is a generated serial primary key.
- gradeId links to the grade.
- classTeacherId is nullable and links to people when present.
- description is nullable text.
- streamId/configuration can remain null.
- academicYear defaults from the database's current year.
- streamRevision defaults to 0.
- createdAt defaults to the database's current time.
- A unique constraint prevents duplicate gradeId/name combinations.

The typed description is an ordinary stored column value. No class-manager row needs to be created for null.

In your captured result the generated id is 179. PostgreSQL assigned that identity; B did not map to 179, and 179 is not the Grade 9 id.

The grade relationship also lets the application determine the class's school indirectly: class → grade → school.

### Subject synchronisation still runs, although no stream was chosen

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 81 - 83)

After the insert, createClass awaits syncClassSubjects(tx,cls.id). It does not commit and respond before this call succeeds.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 19 - 29)

syncClassSubjects reacquires the same transaction-scoped advisory lock, reads/locks the class FOR UPDATE, and reads its grade.

A row lock coordinates concurrent modifications of that row. The repeated advisory lock call within this transaction does not require a second independent transaction.

cls.streamId is null, so the stream-ownership lookup inside that branch is skipped.

The function calls streamOptions(tx,classId).

(File: [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts), lines 9 - 21)

streamOptions reads the new class and its classStreams links. A just-created class has no links.

The fallback would add a legacy streamId if one existed, but none does. ids is empty, so the conditional stream/subject join is skipped.

options, union, common, and different become empty arrays. split becomes false. The function returns the class plus this empty configuration.

(File: [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts), lines 30 - 47)

syncClassSubjects flattens the configuration's desired subjects, deduplicates them with Map, makes a Set for membership checks, and queries existing classSubjects.

For this new stream-less class:

~~~text
desired subjects  = []
existing subjects = []
~~~

Both for-of loops have zero iterations. No class-subject or chapter allocation is inserted, updated, or deleted on this path.

The function finishes successfully.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 81 - 84)

The transaction callback returns cls. Drizzle commits the transaction and resolves its Promise with that row. On an error it would roll back instead.

The class is now saved persistently, with your description and a null manager. A UI repaint did not create it; the successful database transaction did.

## 13. The server returns 201; the frontend receives the saved id

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 88 - 101)

The route sends res.status(201).json(cls). 201 means Created.

Its duplicate-name and invalid-name catches would send 409 or 400 for those handled errors. They do not run on this successful save.

The response contains the inserted row, including description and null classTeacherId. A row may also contain the generated/default fields described above.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 192 - 211)

fetch resolves to a Response. res.ok is true for 201, so no error parser runs and no expired-token retry is needed.

res.json parses the body and returns the class object to api.post and the command callback.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 68 - 69)

saved receives that object. The callback returns a **navigation id string** built from saved.id.

For your captured class:

~~~text
saved.id = 179
returned page id = "class-179"
~~~

The callback does not append a sidebar entry itself. It supplies the id of the destination the workspace should open after reloading its data.


## 14. The dialog asks the workspace to open the saved class

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 90 - 90)

The dialog's await command.run fulfils with class-179.

It next calls onSaved(pageId || undefined). The non-empty string is truthy, so class-179 is passed through.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

The parent supplied refresh as this onSaved callback.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 315 - 318)

refresh is declared async, but its body contains **no await**:

~~~ts
async function refresh(nextPage?: string) {
  if (nextPage && book) navigate(book.id, nextPage);
  setRevision(value => value + 1);
}
~~~

The code first requests navigation to class-179, then increments the local revision.

Its Promise resolves after scheduling those changes. It does **not** wait for book.load, the next learner GET, or the final paint.

The dialog's nearby comment says refresh before closing; the important distinction is that the code requests a refresh before closing, not that it awaits every fetched record.

### Navigating to an id absent from the old page list

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 309)

navigate receives grades and class-179.

Because a nextPage is supplied, it does not restore a previously remembered page. It builds:

~~~text
/dashboard/principal?book=grades&page=class-179
~~~

This matches the address in your screenshot.

At this moment flat still describes the **old** records. It does not contain class-179 yet. findIndex therefore returns -1 for that destination.

The same-book animation calculation falls back to index 0 when the target is not found, then subtracts the old current index. Consequently the visual turn can run backwards here even though you are opening a newly created class. The animation is based on an old list position, not the semantic meaning of “create”.

In the tree shown by your screenshot, Grade 9 follows Grade 8, Grade 8A, and its import page; it would have flat index 3 before this insertion. The fallback calculation could then request turn(-3). This follows the visible tree and source calculation, not a claim that the screenshot records an animation frame.

The final selection is determined by page=class-179 plus refreshed records, independently of that visual turn direction.

navigate records the animated destination, calls router.push with scroll:false, and clears search query. The query change and revision update may commit together or in separate renders; React/Next.js scheduling determines the intermediate frames.

## 15. The dialog begins closing while data can still be loading

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 90 - 92)

Once await onSaved completes, the handler calls its local onClose: the animation-aware callback returned by useModalMotion.

The finally block then resets submitting.current and busy. It does not undo the saved database row.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 23 - 33)

The close callback:

1. Returns if a close timer is already pending.
2. Retrieves the native dialog node.
3. Calls onDismiss immediately if it is not open or reduced motion is requested.
4. Otherwise adds data-motion-closing, marks the dialog inert, and schedules a 140ms timeout.
5. When the timeout runs, clears the timer ref and calls onDismiss if the dialog is still connected.

Making the dialog inert prevents further interaction while its exit is visible. A timer schedules work; it is not a blocking sleep on the browser thread.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 15 - 22)

The data-motion-closing selector selects the short fade/scale/translation exit animation. The browser performs the interpolation.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

onDismiss is the parent callback that calls setCommand(null). After its render, CommandDialog is no longer returned.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

Its effect cleanup closes the native dialog and releases the scroll lock.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

The unlock function restores the previous body overflow after the last lock is released.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 20 - 22)

The motion hook cleanup clears any remaining timeout. Background interaction becomes available as the modal is removed.

A fast reload could finish before the exit does; a slower reload could finish after it. **The chapter ends at the settled class page, not merely when the modal disappears.**

## 16. Incrementing revision forces a book reload

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 237)

The loaded object still has the old revision. After setRevision increments state, the equality check for loaded.revision===revision fails.

data becomes null, pages/flat cannot yet include the new class, and the old view is not treated as the successful view of the new destination.

The URL may already contain class-179 even before its data exists. The component can show loading; temporary selection fallback depends on the relative routing/data commits. It must not be described as instantly knowing every property from the page id alone.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 239 - 246)

revision is a dependency of the load effect, so React cleans up the old invocation and starts another with the new revision.

The old cancelled flag becomes true; late completion from that invocation is ignored. The new invocation calls book.load(S).

**The app does not simply trust the POST response as its entire new navigation tree.** It reads current school data again.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 100 - 102)

Promise.all again starts structure, streams, and people requests.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 47 - 50)

structure again retrieves/sorts grades, then fetches class lists for each grade.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 224)

The shared helpers again attach the valid bearer token, issue GETs, check responses, and parse JSON. There is no second create POST from this reload.

### What executes on the backend during this reload?

These are the same routes and services traced at this chapter's initial book load, now receiving fresh requests after the transaction committed:

| Request | Route handling | Final data read |
| --- | --- | --- |
| Grades | Grades prefix guards, school check, grades GET. | Grade rows ordered by number. |
| Streams | Stream prefix guards and GET-level guards, school check. | School streams. |
| People | GET-level guards and school check. | Staff records/options and status/counts. |
| Each grade's classes | Grades prefix, classes prefix, GET-level guards and ownership checks. | Classes, descriptions, manager fields, stream ids, learner counts. |

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

Each applicable requireAuth invocation again verifies the token and current person.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

Each administrative check again calls staffAccess and validates school/current rights. GET uses the read capability set.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 14 - 27)

The grades path and prefix behave as previously traced.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 82 - 96)

The stream-list handler repeats its school read and returns the stream service result.

(File: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts), lines 57 - 64)

The people-list handler repeats the school check and staff-list query.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 31 - 38)

The class-list prefix again validates the school/grade relationship.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 107 - 123)

The class-list GET retrieves each grade's current classes.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 90 - 125)

**Grade 9's class list now includes the committed 9B row.**

The query explicitly selects description, so your entered description travels back to the frontend during this reload. It also returns classTeacherId:null and learnerCount 0.

A left join to people does not discard the class just because no manager matches. That is why unassigned classes remain visible.

The class row was inserted in one request; the sidebar is built from this later read. These are two separate stages.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 102 - 102)

After all arrays arrive, load combines them and fulfils.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 243 - 245)

The effect stores {bookId,data,revision} with the new revision and clears its load error. React renders again.

## 17. The refreshed row becomes two navigation entries

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 228)

The revision check now succeeds. data is available, so book.pages(data), flattenPages, and findPagePath run with the new records.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 103 - 108)

For Grade 9, the page builder:

1. Makes the grade node.
2. Filters classes whose gradeId equals G9.
3. Sorts them by name.
4. Maps the 9B record to a class node.
5. Adds an import node as that class's child.

For the result in your screenshot, the relevant structure is:

~~~text
Grade 9                         id: grade-G9    number: 2
└── Grade 9B                    id: class-179   number: 2.1
    └── Bulk import learners    id: import-179  number: 2.1.1
~~~

These identifiers are strings used inside the workspace, except the unknown G9 placeholder. They are not filenames or extra database tables.

The import entry is generated for every class by the page-builder function. **Saving a class does not upload a spreadsheet, create learners, or create a separate “import page” row.**

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 132 - 132)

classLabel sees the stored name 9B does not already start with Grade and formats it as Grade 9B.

The regular expression here checks a display prefix. It does not rename the saved row.

### Why B is numbered 2.1 rather than 2.2

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 103 - 106)

The grade's number comes from its position in sorted grades: index 1 plus 1 becomes 2.

The class's number is based on childIndex+1. In your screenshot, 9B is the first class listed under Grade 9, so its suffix is 1.

**B is part of the class's name, not its list index.** The system does not infer that an A must exist before you may create B.

The import suffix .1 means it is the first child page under that class.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 115 - 117)

flattenPages counts every generated node: grades, class pages, and their import children.

The screenshot shows five grade nodes and four classes: 8A, 9B, 11A, 11B. Each class contributes its own page plus an import page:

~~~text
5 grade pages + (4 × 2 class/import pages) = 13 pages
~~~

If the only structural change was adding 9B, that action increased this count by 2. The count is not a count of .tsx files.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 325 - 326)

The sidebar displays flat.length as 13 pages and passes the rebuilt tree to Contents.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 39 - 45)

Contents recursively renders the new class button and its child import button. React keys use stable ids to reconcile the list.

The active class gets aria-current="page" and currentHeading. The parent Grade 9 is an ancestor but is not itself marked as the current class page.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 39 - 46)

Nested lists get indentation and a left border. The current heading gets the tinted background, accent text, heavier weight, and a narrow vertical accent from its ::before pseudo-element.

That is the highlighted Grade 9B row in your screenshot. CSS supplies its shape; no custom drawing loop paints the selection.

## 18. The URL selects the new class, and the class view starts

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 236)

The URL's pageId is class-179. The refreshed flat list now contains that exact id, so flat.find selects it instead of falling back to the first grade.

findPagePath returns Grade 9 then Grade 9B. The component uses these for breadcrumbs.

The new pageKey includes the new revision and class node id. It will not reuse Grade 9's earlier view as Grade 9B content.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

The view effect calls book.view({schoolId,data,page,tab,isPrincipal}) for the selected class.

tab is "" because the created-class URL has no tab parameter.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 109 - 123)

The import and grade branches do not match kind="class", so execution continues into the class branch.

It finds the parent grade and searches data.people for a person whose id equals entity.classTeacherId.

That id is null, so no person matches. manager becomes undefined. This is a search in already-loaded staff data, not an extra manager-specific request.

The API path is /schools/S/classes/179.

subjectsSelected compares tab with subjects. With tab="", it is false, so the awaited get requests:

~~~text
GET /schools/S/classes/179/learners
~~~

**This is why the new class opens on Learners.** The default is defined by this branch and the first tab, not by a server-generated new HTML page.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 224)

The request helper uses the current access token, fetches the learner endpoint, checks the response, and parses JSON. The view function waits for this result before returning its final content description.

## 19. The backend retrieves the new class's register

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 87)

The learner GET passes shared CORS/headers/parser/logger middleware and reaches the learners router.

This path has /schools/S/classes/179/learners, with no /grades/ segment. It does not match the earlier grades/classes prefix used by class creation.

(File: [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts), lines 69 - 73)

The matching GET runs requireAuth and requireSchoolAdmin.

Those functions perform the token/current-account and current-administrative-access checks already traced. The route then joins classes to grades to confirm class 179 belongs to school S. It returns 404 if no such class exists; our committed class is found.

(File: [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts), lines 75 - 79)

The handler confirms the school exists and calls getLearnersByClass(179).

(File: [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts), lines 34 - 40)

The query selects learner identity/register/account-status fields, joins classes, and left-joins current stream selections and streams using class year and stream revision.

It restricts rows to learners.classId=179 and orders by surname. It does not include password hashes.

We have just created this class without adding learners, so the returned list is [].

(File: [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts), lines 78 - 79)

res.json serialises the empty array.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 207 - 211)

The frontend parses it. The awaited items variable in the class view now holds [].

## 20. The class view explains your screenshot's text

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 123 - 134)

The function looks up a stream and constructs a potential Manage streams command.

Constructing createElement(ClassStreamsEditor,...) creates an element description held in that potential command. It does not mount ClassStreamsEditor or execute its effects. That command is not selected for the Learners section.

No stream was assigned during class creation, but this task is not opening a stream-management dialog.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 135 - 142)

The returned view contains these choices:

| View property | Result on this path |
| --- | --- |
| guidance.text | To manage subjects in this class, click the Subjects tab. |
| description | No class manager assigned. Use Edit class to choose one. |
| titleActions | Edit class, Delete class. |
| tabs | Learners, Subjects. |
| section title | Class register. |
| empty section message | Your class register is empty. Choose Add learner or Bulk import learners to get started. |

### Where did the description you typed go?

The source's view.description property and the database's entity.description property are different pieces of data.

At line 138, this view assigns description from the manager lookup. It **does not use entity.description as the paragraph on this class page**.

Your entered text was passed in JSON, accepted by Zod, inserted in classes.description, and returned in the refreshed class-list data. It is saved even though this screen does not display it.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 57 - 62)

Creating the Edit class command now supplies cls=entity. Its description textarea default is String(cls.description ?? ""), so opening that dialog later can show the saved text.

The create/edit helper also sets the label default from the existing class name and the manager default from its nullable id.

**We are only constructing that edit action now.** The edit dialog is not mounted, and its save callback is not called during this endpoint render.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 23 - 23)

remove constructs a Delete command with a run callback. Creating that object does not send DELETE.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 139 - 140)

The view overrides the edit/delete action labels and variants. Edit is filled; Delete is outline. Its warning describes deletion constraints but no deletion happens here.

### The learner section and import link

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 142 - 152)

subjectsSelected is false, so the section uses the learner-register branch.

It constructs Add learner using personCommand and attaches alternative.pageId="import-179" with the label Bulk import learners.

Because items.length is 0, the conditional spread contributes no Move learners action. Mapping items produces an empty rows array; learner-specific row callbacks do not execute.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 78 - 87)

personCommand prepares fields and a future run callback for learner creation, using the current class id as its initial class selection. It does not call api.post now.

That is why the screen can offer Add learner while the register remains empty.

## 21. React commits the complete Grade 9B screen

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 253 - 254)

The class-view Promise fulfils. The effect checks its cancellation flag, stores the new PageView with matching keys, and clears its view error.

React now has all three required pieces: selected page, loaded data, and the completed view.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 333 - 346)

The workspace renders breadcrumbs, WorkspacePage, and pagination.

Breadcrumbs contain Grades & Classes / Grade 9 / Grade 9B. Grade 9B is the current crumb; Grade 9 is a parent navigation button.

Pagination shows Page 2.1 · Grade 9B. The Previous/Next buttons use positions in flat, not arithmetic on the visible decimal-looking string 2.1.

The next flattened node is import-179; the previous node is the Grade 9 parent in this visible tree. These callbacks remain uncalled at our endpoint.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 157 - 176)

WorkspacePage renders the Grade 9B title, tab controls, title actions, guidance, and description.

The tab display chooses ordinary buttons, not AppSelect, because filterDisplay is not dropdown. active falls back to the first tab id, learners, when tab is empty.

Each tab's aria-pressed marks the current choice. The Subjects callback is registered but not invoked.

### How the active-tab background is placed

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 13 - 33)

MotionTabs renders a container and an indicator span. After commit its layout effect locates the selected button, measures offset/size, and writes --tab-x, --tab-y, --tab-width, and --tab-height.

It marks the root data-tab-ready and observes the root/buttons with ResizeObserver so wrapping or text resizing can trigger remeasurement.

These are DOM measurements used for styling, not server requests.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 11 - 13)

CSS positions the indicator using those custom properties and animates changes. The ready-state rule allows the indicator to supply the selected background.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 130 - 132)

Local tab rules supply spacing, typography, colours, and selected weight. This produces Learners as the active tab in your screenshot.

### Actions, zero count, and empty state

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 145 - 155)

contextAction renders the Edit/Delete actions and the learner section's Add learner / alternative link.

It computes filled/outline classes and, where relevant, a small “or” separator. Add learner has an alternative, so Bulk import learners is rendered as a Link.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 131 - 135)

pageHref copies the current query, changes page to import-179, removes tab, and builds the destination URL. Computing an href does not navigate there.

Next.js Link may prefetch route/framework data in production, but that does not mount the import feature or upload a spreadsheet. The link's onNavigate handler is reserved for a later navigation action.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 177 - 189)

The section heading displays Class register and rows.length, which is 0.

The row filter receives an empty array, so no rows appear. The empty branch displays the register-empty message. There are no badges or learner controls because there are no learner rows.

The view has no import property, so RosterImportModal is not rendered on Grade 9B. Merely seeing its link or sidebar child does not open it.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 79 - 126)

CSS makes the page heading sticky, sets Georgia for the title, arranges actions with flexbox, supplies filled/outlined button styling, and styles the count and empty-state text.

The description paragraph is styled just like other page descriptions; CSS does not determine whether its content is the saved class description or the manager message. The view function made that content choice.

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 37 - 47)

MotionPanel's layout effect supplies the short arrival fade/translation when the non-stale view appears, unless reduced motion is requested. It cancels previous animations and cleans up preference listeners as needed.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 279 - 288)

The location effect coordinates the already-requested turn, updates remembered indices, and resets the paper's own scroll position. The explicit navigation marker helps avoid starting a duplicate turn for the same URL transition.

(File: [src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts), lines 8 - 16)

The memory effect saves the completed current URL and registers an up-to-date pagehide callback.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 50 - 62)

rememberLibraryLocation validates and stores the class URL as the account's last location and the grades book's remembered page.

The import child is not stored as last merely because it exists in the tree. The open location is class-179.

### Wide-screen positioning

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 24 - 25)

The grid keeps contents, paper, and shelf in separate columns, within a maximum layout width and centred margins. Contents and shelf can scroll independently.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 208 - 208)

If the browser's CSS viewport is at least 1500px wide, this media rule enlarges columns/gaps/padding and the paper inset. Screenshot pixel dimensions alone do not establish CSS viewport width because display scaling/browser zoom can differ.

The browser computes layout, paints text/colours/borders/shadows, and composites the result. React does not draw every frame in a hand-written SFML-style loop.

## 22. Matching the supplied endpoint

![Your supplied endpoint: Grade 9B open with its empty register and generated navigation entries](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-3-grade-9b-end.png)

The image above is a preserved copy of your supplied screenshot, not a screenshot from a new run performed for this chapter.

| Visible result | Cause |
| --- | --- |
| URL page=class-179 | The POST returned id 179; the command returned class-179; refresh requested that destination. |
| Grade 9 → Grade 9B | Refreshed class data was mapped into the navigation tree. |
| Bulk import learners under Grade 9B | The page builder generated import-179 as a child, without creating/importing learners. |
| Number 2.1 | Grade 9 is the second grade node and 9B is its first listed class. |
| 13 pages | Five grade nodes plus four class nodes and four import nodes. |
| No class manager assigned… | Saved classTeacherId is null; the view's manager search found no person. |
| Your entered description is not shown here | The class view's description property contains manager text; saved entity.description is used in the edit form instead. |
| Learners selected | No subjects tab parameter was supplied; the class view/default tab selects Learners. |
| Class register 0 | The class's learner GET returned an empty list. |
| Edit class / Delete class / Add learner / Bulk import learners | The view returned action descriptions and the renderer created the controls. |

### Follow the important values through the task

~~~text
"B"
  → frontend adds the grade number
"9B"
  → backend validates/normalises
classes.name = "9B"
  → classLabel formats it
"Grade 9B"

Manager chooser value ""
  → Number("") is 0
  → OR fallback chooses null
classes.class_teacher_id = null
  → manager lookup has no match
"No class manager assigned. Use Edit class to choose one."

Typed description
  → FormData
  → trimmed values.description
  → JSON payload.description
  → Zod validation
  → classes.description
  → refreshed entity.description
  → future Edit class textarea default

Returned database id 179
  → "class-179"
  → URL selection
  → refreshed class node
  → generated child "import-179"
~~~

The persistent create operation was one successful POST, including its database transaction. The interface then reloaded book data and fetched the selected class's learner list. Opening Grade 9 from already loaded book data did not itself require another full book load.

We stop after the modal has gone, the data/view requests have settled, and Grade 9B is the active complete screen. No learner has been added and the import page has not been opened.

