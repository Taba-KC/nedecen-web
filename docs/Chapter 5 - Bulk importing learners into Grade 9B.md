# Chapter 5 - Bulk importing learners into Grade 9B

**Starts:** Grade 9B is open, its class manager is Mr Kgodiso Taba, and its class register contains zero learners. The principal clicks **Bulk import learners** underneath Grade 9B in the left navigation panel.

**Ends:** The principal has chosen a spreadsheet, previewed five rows, reviewed their impact, saved them, and clicked **Done**. Grade 9B is open again and its register displays five learners, each marked **Setup pending**.

This is a chronological walkthrough of the current source and your eleven screenshots. I have not imported anything into your database to write it. Screenshots establish what you saw; the source explains the successful path that produces those states. They do not reveal every intermediate browser event or network packet. Where an exact gesture is not captured, I say so.

We retain the valid principal login from earlier chapters. I use **S** for the principal's school id, which the screenshots do not disclose. In examples, S stands for the actual number. Class **179** is different: it is visible in your URL. An admission number such as **20240006** is a learner identifier, not the database-generated learner id.

## 1. The starting screen and the link you click

![Screenshot 1 - Grade 9B before importing](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-01-start.png)

The browser is already displaying:

~~~text
http://localhost:3001/dashboard/principal?book=grades&page=class-179
~~~

There is no new page load simply because we begin this chapter. React has already rendered the class page. The following references identify the code responsible for the controls currently on screen.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 135 - 152)

The class view describes its title, manager paragraph, **Edit class**, **Delete class**, and the **Learners** and **Subjects** tabs. A tab here selects a view within the class. It does not refer to a Chrome browser tab.

The view checks whether the selected tab is Subjects. On this screen it is not, so it supplies the **Class register** section. Its empty items array yields the count **0** and the empty-register message. The section also supplies **Add learner** and an alternative **Bulk import learners** action.

The **Move learners** action depends on there being learners to move. The condition is false at this starting point.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 175)

The workspace renders the view's header, actions, tabs and description. Passing a function as an event handler tells React which function to call later. Rendering an Edit class button does not execute the edit operation; displaying Subjects does not fetch its contents.

The search control is conditional too: absent an explicit searchable setting, a section must have more than five rows. Zero rows does not satisfy that condition.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 100 - 108)

The Grades & Classes book's page structure already includes a class page and an import child page for each class. For this class their ids are **class-179** and **import-179**. These are application navigation identifiers constructed from data. There is no separate import-179.tsx file.

That explains why the left navigation already contains **2.1.1 Bulk import learners** before any import happens.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 39 - 45)

The contents component renders each page as a button. Its click handler calls onNavigate with that page's id.

When your mouse clicks the import entry, the browser determines which element was clicked. React receives the click event and invokes the handler associated with that button. Your application does not run an SFML-style loop that manually compares mouse coordinates with a rectangle.

The handler passes **import-179** to the workspace's navigation function.

## 2. The workspace changes from the class page to its import page

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 310)

The navigate function executes in the browser.

It checks the import-change flag first. We have not saved an import yet, so there is no import change to refresh at this point.

It constructs URLSearchParams for the destination book and sets the page parameter. URLSearchParams is the browser's utility for managing the key-value pairs after a question mark in a URL.

Conceptually, the destination becomes:

~~~text
book=grades&page=import-179
~~~

The function also determines page order for the page-turn effect, clears the current search query, and calls router.push with scroll: false.

router is Next.js's navigation object. Calling push changes the route and adds a browser history entry. The option scroll: false tells Next.js not to perform its normal navigation scroll-to-top behavior. This navigation is not a direct call to the learner-import API.

The page-turn effect belongs to the workspace's presentation. It can run while the new view is being prepared; animations, React rendering, and asynchronous requests need not form one uninterrupted sequence.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 198 - 209)

On the resulting render, the component reads the current URL parameters. The selected book remains grades; the selected page becomes import-179. No tab parameter is needed for this page.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 237)

The workspace uses the already loaded book data to flatten the page tree and find the selected page.

An array's find method returns the first matching item. The recursive page-path helper supplies the breadcrumb trail. The component also associates view results with the current page key so an old class view is not mistaken for the new import view.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 115 - 129)

flattenPages walks the page tree and produces a flat sequence for navigation. findPagePath searches the tree for a matching id and returns the ancestor path to that page.

These are ordinary TypeScript functions working with arrays and objects. They do not query PostgreSQL.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

The view effect calls the selected book's view function for the selected page. A React effect is work scheduled after rendering, with dependencies controlling when it must run again.

The promise's completion callback stores the view result. Its cancellation check prevents an obsolete request/result from replacing a newer view after navigation.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 109 - 111)

The import-page condition matches. This branch returns a description and an import configuration containing:

~~~ts
{ kind: "learners", classId: "179" }
~~~

The object literal groups two named values. kind tells the shared importer which sort of record it handles. classId selects the target class.

This is an early return. The class-page learner-fetch branch below it is not executed for import-179. Opening this import page does not itself upload a file, fetch its rows, or insert a learner. It also does not require reloading the whole book's grade/class/staff data when that data is already current.

## 3. React mounts the inline importer

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 118 - 126)

WorkspacePage owns the selected import purpose. Its initial value is update. It also owns a boolean indicating whether the purpose control should be locked.

useState is a React function. It returns a pair: the current value and a setter. Calling the setter requests another render using the new value. The state survives ordinary renders while the same component remains mounted.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 164)

For a learner import, the header includes RosterImportPurpose. The workspace passes the current purpose, its setter, and the lock boolean into this child component.

Values passed from a parent component to a child are called **props**. Here the child reads the chosen purpose from its parent; it reports changes through the callback the parent supplied.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 188 - 189)

The body creates RosterImportModal with inline enabled, kind learners, schoolId S, initialClassId "179", and fixedClass true.

Despite its name, this component is being used **inside the book page**. Its name does not force a popup.

The parent maps class records into option objects. String converts each numeric class id into the string form used by controls. Number converts the academic year to a number, with a current-year fallback if necessary.

The component's key combines the import kind, class id and purpose. A React key helps identify a component instance. Changing this key replaces the old importer instance and initializes a new one. That is relevant if someone changes purpose before preparing a draft; the purpose remains update throughout your screenshots.

The onClose prop is a function that will navigate back to class-179. It is registered now, not called now.

The onSaved prop is the workspace's import-change notification callback. Its effect occurs after a successful save, much later in this chapter.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 28 - 45)

The importer function now runs to render its initial state.

Its parameters are destructured: named values are extracted from the props object. The notation onClose: onDismiss gives the received onClose value a local name, onDismiss.

The state at this point is:

| State | Value | What it represents |
| --- | --- | --- |
| file | null | No browser File object chosen. |
| classId | "179" | Fixed destination class. |
| localMode | "update" | Fallback purpose if no parent supplies one. |
| mode | "update" | The parent's purpose wins here. |
| academicYear | "2026" | The selected class's year, stored as input text. |
| impact | null | No server review received. |
| rows | null | No parsed preview received. |
| existing | [] | No returned identifiers loaded. |
| busy | false | No import request is running. |
| error | null | No error to display. |
| saved | null | No successful save result. |
| skipped | 0 | No skipped rows. |

File | null is a TypeScript union: the variable can hold a browser File object or null. TypeScript types help check the program during development; they do not themselves read or validate spreadsheet contents at runtime.

The expression purpose ?? localMode uses the right side only if purpose is null or undefined. The find call locates the selected class option; optional chaining, written ?., avoids reading a property from a missing result.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 46 - 58)

After rendering, the purpose-lock effect reports busy || rows !== null. Both parts are false initially, so the parent keeps Purpose enabled.

The importer creates two refs. A ref stores a value in .current across renders without making React render when the value changes.

mounted records whether the component is still present. inFlight guards against starting an overlapping import request. These are separate from busy: busy also drives visible disabled/loading states.

The number label becomes **Admission number**, and numberColumn becomes admissionNumber, because kind is learners.

The API base path is constructed as:

~~~text
/schools/S/classes/179/learners/import
~~~

This is a backend API path, different from the browser's /dashboard/principal page URL.

The fields array contains descriptors for firstName, surname and identifier. Each descriptor supplies a property key and visible label. The shared importer has a title field for staff imports, but this learner path does not add it.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 59 - 76)

The validation useMemo runs with rows still null. The expression rows ?? [] supplies an empty array so the loops and maps can run safely. There are no row errors and invalid is zero.

useMemo caches a computed value until its dependencies change. It is not a database cache and it does not save the draft.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 119 - 126)

The render builds content. The class label is found from the options and displayed as **Class: Grade 9B**.

Neither the error nor saved branches are active. rows is null, so the preview-table branch is also inactive. Rendering continues into the file-selection form.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 155 - 170)

The form is wired with onSubmit={preview}. That supplies a function reference; it does not call preview during this render.

fixedClass is true, so the class chooser is omitted. The destination is already Grade 9B. The parent supplies purpose, so the importer's alternative internal Purpose control is also omitted.

The Academic year input receives "2026". Its type is number, but its state value is text until conversion for the JSON requests later. Its minimum is the class's academic year and its maximum is 2100. It is disabled because mode is not progression. Seeing the number does not mean it is currently editable.

The update-mode paragraph explains that listed learners may be added, corrected or transferred while unlisted learners stay.

The form displays the required spreadsheet headings and advertised limits. The file input accepts .xlsx, .xls and .csv; the visible label says **Choose spreadsheet**.

Preview has type submit. It is disabled because file is null. disabled is a real control property, while disabled:opacity-50 supplies its faded appearance.

The final return chooses a section because inline is true. The BottomSheet alternative is not mounted on this path.

![Screenshot 2 - Initial bulk import page](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-02-import-page.png)

Your book's breadcrumb, selected contents entry and footer now identify the import page. The page count remains 13 because we selected an existing page.

## 4. The principal opens Purpose, then keeps Update class register

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 18 - 20)

RosterImportPurpose returns a label and AppSelect with two options:

| Stored value | Visible text |
| --- | --- |
| update | Update class register |
| progression | Grade progression |

ImportPurpose is a union of two string literals. The type assertion as ImportPurpose tells TypeScript how to treat the selected string. It does not itself enforce server authorization or validate a request.

The control is currently enabled. When its trigger is clicked, the custom selector takes over.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 22 - 50)

AppSelect reads the supplied value, identifies the matching option, and renders the trigger with combobox accessibility information.

Its showChoices handler derives the panel label from the associated label and sets open to true. That state update makes React render the selection panel. The selected option remains update; merely opening the options does not change it.

The underlying native select supports the value/change relationship; the visible trigger and choice panel provide this application's custom appearance.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 54 - 91)

SelectPanel initializes its active option from the current selection. Its layout effect calls showModal on an HTML dialog, locks background scrolling, measures the trigger, and positions the choices panel.

showModal is a browser library/API call: the browser puts the dialog in its top layer and treats the background as unavailable for normal interaction. The component's position and backdrop styling create the highlighted trigger and dimmed page in your screenshot.

These layout calculations run in the browser because they depend on screen geometry. They are unrelated to PostgreSQL.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 114 - 121)

The panel renders the Purpose heading and both options. The selected option receives its selected styling and tick. Search is conditional on having more than eight options, so a two-option Purpose selector has no search box.

![Screenshot 3 - Purpose choices](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-03-purpose.png)

The next screenshots still show **Update class register**. They do not show exactly how you dismissed this panel. You might have clicked outside it, pressed Escape, or selected the already-selected option. We cannot determine that from a still image.

For an outside click or Escape, the panel's dialog handlers call its close function. If you selected Update class register again, the option handler first reports that same value through the selector's change mechanism, then closes. Either way, the observed purpose is still update. There is no evidence that Grade progression ran.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 37 - 44)

In the option-selection case, choose updates the underlying selected option and dispatches a bubbling change event. The parent handler then reads event.target.value and stores update. This describes the selection route only; a simple dismissal does not need that value-change code.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

The panel's shared close helper either dismisses immediately if motion is reduced or there is no open dialog, or marks the open dialog as closing and completes dismissal after its 140 ms exit interval.

For the Purpose panel there is an actual dialog ref. Closing removes the panel and its cleanup restores scrolling. This is a UI transition, not an import request.


## 5. Choose spreadsheet opens a Windows file picker

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 163 - 165)

You click the large dotted **Choose spreadsheet** area. It is an HTML label containing a file input. The browser associates the label with that input, so clicking the visible label activates the input even though the input itself uses sr-only styling.

The browser asks Windows to display the file picker. Our source supplies type="file" and the extension filter. Windows supplies the folder navigation, file icons, filename field, Open button and Cancel button.

![Screenshot 4 - Windows file picker initially at Downloads](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-04-file-picker.png)

Navigating from Downloads to Desktop happens within the operating system's picker. It does not call a React handler for each file you look at and does not send the contents of those folders to the import endpoint.

The accept attribute helps filter selectable files. It is not sufficient protection for the backend; the server will apply its own limits and parsing checks after upload.

![Screenshot 5 - Selecting test_learners - Copy.xlsx](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-05-file-selected.png)

When you confirm **test_learners - Copy.xlsx**, the picker returns the selection to the browser. The file input emits a change event, and React calls its onChange handler.

The handler reads event.target.files?.[0] ?? null. files is the input's FileList; [0] selects its first entry. Optional chaining handles the case where files is missing. The fallback null handles no selected file.

setFile stores the File object and setError(null) clears a previous form error. The File object exposes metadata such as name and size and provides access to the selected file's bytes when needed. It is not a JavaScript array containing learner objects.

This handler does not call XLSX.read, does not upload the file, and does not save anything.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 165 - 167)

React renders again. file?.name now supplies **test_learners - Copy.xlsx** instead of the Choose spreadsheet fallback. The disabled expression is now false: the component has a file, a class id and no request in progress.

Preview becomes clickable and uses the full action colour.

![Screenshot 6 - File chosen, Preview enabled](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-06-ready-to-preview.png)

A screenshot of the picker is evidence of the selection and filename, not a complete dump of the workbook's original contents. The later preview is our evidence for the five parsed rows.

A browser may also fire ordinary focus events when the operating system's dialog closes. Existing application-wide access checks can react to focus independently. This chapter follows the import's own calls; it does not claim that no unrelated background request or development-tool request can occur.

## 6. Clicking Preview constructs an upload request

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 82 - 88)

Preview is a submit button inside the form. Clicking it submits that form, so React calls preview with the form event.

event.preventDefault() stops the browser's default form-navigation submission. Our handler performs the request instead.

The guard returns early if no file exists, if a learner import lacks a class id, or if another request is already in flight. A return here exits this function. On your successful path the guard passes.

inFlight.current becomes true immediately. setBusy(true) schedules the loading render and setError(null) clears any previous message.

The try block creates a FormData object and appends three entries:

~~~text
file          selected File object
mode          "update"
academicYear  "2026"
~~~

FormData is a browser API for request bodies that can include both ordinary text and files. It is different from JSON: a file upload contains the actual file bytes as a multipart part.

The call to api.upload supplies the endpoint ending in /preview and the FormData object. The generic type argument Preview describes the expected response shape to TypeScript:

~~~ts
{ rows: Row[]; existingIdentifiers: string[] }
~~~

It does not prove that a server response has that shape. Runtime validation is a separate responsibility.

await suspends this async function until the promise settles. It does not block the entire browser from painting or handling every other event.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 46 - 46)

busy changed, so the purpose-lock effect reports true to the parent. Purpose becomes disabled while this request is running.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 164 - 167)

The file input and submit button become disabled too. The submit caption changes to **Preparing preview...**. That transient state need not appear among your still screenshots to be part of the successful handler's state changes.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 218 - 233)

The shared api object's upload method delegates to uploadRequest. This lets components use a consistent request helper instead of repeating token handling and error handling in every form.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 6 - 6)

The helper uses the configured backend base URL, with http://localhost:3000 as the fallback. The frontend in your screenshots is on localhost:3001.

A port distinguishes listening services on the same computer. In this arrangement, the browser gets the app UI from port 3001 and sends these API requests to the configured backend, normally port 3000. A different environment setting can change the backend address.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 138 - 168)

uploadRequest obtains the current access token and calls fetch. For the normal valid-session path, the essential request is:

~~~text
POST http://localhost:3000/schools/S/classes/179/learners/import/preview
Authorization: Bearer <current access token>
Body: multipart/form-data containing file, mode, academicYear
~~~

The actual school number replaces S. The token is a credential, not the principal's password sent again with every action.

credentials: "include" allows applicable cookies to accompany the request. Cookie inclusion still depends on browser cookie rules.

The helper deliberately does not set Content-Type to application/json for this upload. The browser generates the multipart Content-Type, including its boundary. A boundary separates the parts in the encoded request.

If this cross-origin request requires a CORS preflight, the browser first sends OPTIONS to ask whether the frontend origin/method/headers are permitted. The authorization header makes preflight relevant here; a valid cached preflight can avoid repeating it. OPTIONS is not the spreadsheet import itself.

The helper also contains legacy-refresh and 401-retry paths. With a current valid access token those recovery paths are not needed. Their presence does not mean the user logs in again for Preview.

After a successful HTTP response, the helper will parse its JSON. We now follow the POST into the backend before returning to that browser continuation.

## 7. Express receives the multipart upload and checks access

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

Express is the backend's request-handling framework. When the request arrives, middleware registered on the application runs in order.

The CORS middleware deals with permitted cross-origin access. The response-header middleware sets the application's security/cache headers. The JSON parser is present, but a multipart body is not application/json: express.json does not turn this uploaded workbook into a JavaScript object.

The later multipart middleware handles that body.

The logger records the request method and path and passes control onward.

(File: [Project-Edu-Revo/src/middleware/logger.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/logger.ts), lines 11 - 14)

next() means “continue to the next matching middleware or route.” It does not start the next chapter or create a new request.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 80 - 84)

The roster import router is mounted in the application. Mounting occurred during server startup; this request now traverses the matching router. These lines are the wiring, not startup code being re-executed for each upload.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 38 - 50)

The learner route matches POST /schools/:schoolId/classes/:classId/learners/import/preview. Express fills req.params.schoolId and req.params.classId from the URL.

The route runs authentication, school-administration authorization, school/class parameter checks, and the file middleware before its final handler.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

requireAuth reads the bearer token and verifies it using the JWT library, including signature/expiry checks. It resolves the current staff identity and relevant account/school state, then attaches a caller object to the request.

This is server-side checking. Disabling a button in the browser would not provide equivalent authorization, because a caller can construct HTTP requests independently of the page.

For the principal's valid session, control continues. An invalid token would stop the route before workbook parsing or inserts.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

The school-administration middleware checks the caller's current rights and school scope. This learner import permits the relevant grades/learners administration access. The principal in our scenario passes.

The middleware distinguishes reading from writing; these POST operations require the appropriate administrative permission.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 17)

The middleware obtains those rights by calling staffAccess. That service reads the current staff record, administrative grants, active class-subject allocations, and, when allocations exist, chapter assignments. It returns schoolId, isPrincipal, capabilities and teaching-access information.

For this principal, isPrincipal is true and the capability list includes the school administration categories. These are database reads performed during the permission check; opening Preview does not assign new grants or teaching work.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 21 - 27)

authorise checks that schoolId is a valid positive safe integer and matches the caller's school. It also checks the class-id parameter for the learner route.

The class's actual school relationship is checked again by the service's database lookup. A syntactically valid number alone does not prove ownership.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 15 - 16)

The Multer upload handler uses memoryStorage, a maximum file size of 2 × 1024 × 1024 bytes, at most one file, and a limit on text fields. This configuration was created when the module loaded; the configured handler enforces it on this request.

Multer is a library for decoding multipart uploads. Its single("file") handler expects the same field name our FormData used. It collects the uploaded bytes into a Buffer accessible through req.file.buffer.

A Buffer is Node.js's byte-storage object. Node.js is the runtime executing this backend JavaScript outside the browser.

Using memoryStorage does not itself create a permanent uploaded spreadsheet file on the server.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 42 - 52)

The wrapper returns a 400 response if Multer rejects the upload. The route checks that a file exists and its filename has a supported extension.

On this successful learner path, it calls parseRosterWorkbook with the Buffer and the string learners.

The nearby generic staff preview path is not the function used for this learner upload. Following the actual branch matters: the learner route intentionally returns an empty existingIdentifiers array after its checks, rather than blocking every admission number already in the school.

## 8. The backend library parses the workbook

(File: [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts), lines 43 - 50)

parseRosterWorkbook calls XLSX.read(buffer, { type: "buffer", sheetRows: 502 }).

XLSX is the spreadsheet library. Our code supplies the bytes and parsing options; the library handles decoding supported spreadsheet formats. We do not write an Excel binary-format parser ourselves.

The try/catch converts an unreadable file into an application error. On success, the code chooses the workbook's first sheet by taking SheetNames[0] and looking up that sheet in Sheets.

It rejects a missing sheet. It then uses XLSX.utils.decode_range to inspect the worksheet range and enforce the row/column limits. Spreadsheet indexes are zero-based here: e.r is the last row index, so a header plus 500 data rows reaches index 500.

The range check also limits columns to 31. sheetRows constrains parsing; the worksheet's full range, where available, helps detect files exceeding the intended limit rather than silently treating a truncated portion as the entire import.

(File: [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts), lines 51 - 56)

XLSX.utils.sheet_to_json is called with header: 1. Despite the function's name, that option produces a matrix of row arrays, rather than immediately producing our final learner objects.

The options mean:

| Option | Effect used by this application |
| --- | --- |
| header: 1 | Read rows as arrays of cell values. |
| raw: false | Use formatted textual values. |
| defval: "" | Supply an empty value for an absent cell. |
| blankrows: false | Omit blank rows in this conversion. |

matrix.shift removes the first row to use as headings. String and trim convert/clean heading text.

For learners, the required headings are exactly firstName, surname and admissionNumber. Each must occur once. Header comparison is case-sensitive after trimming: FirstName is not the same spelling as firstName.

The function also inspects worksheet cell objects for formulas and rejects a formula-containing sheet. That is our own application policy applied to what the library parsed; it is not a claim that every Excel workbook inherently forbids formulas.

(File: [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts), lines 57 - 62)

The remaining rows are mapped into objects by looking up each required heading's column position.

Object.fromEntries builds an object from key-value pairs. The code renames admissionNumber to identifier in the returned object. Therefore the server-to-browser row shape differs from the spreadsheet heading:

~~~ts
{
  firstName: "Maropeng",
  surname: "Ramaputla",
  identifier: "20240006"
}
~~~

String conversion and trim clean the values. Empty rows are filtered out. The function rejects an empty import or more than 500 resulting rows.

The five parsed rows shown in your later preview are:

| First name | Surname | identifier |
| --- | --- | --- |
| Maropeng | Ramaputla | 20240006 |
| Kgaugelo | Mphelo | 20240007 |
| Dineo | Maepa | 20240008 |
| Lucky | Ramalekana | 20240009 |
| Tshephiso | Malepe | 20240010 |

Parsing produces proposed data in server memory. It is not an INSERT into learners.

## 9. Preview checks the destination and returns proposed rows

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 50 - 50)

After parsing, the route calls db.transaction with a callback that invokes reviewLearnerRoster.

Notice the rows argument for this particular call: it is **[]**, not the parsed five rows. This stage verifies the destination, mode and year through the service. The actual five-row reconciliation happens when you click Review changes later.

Drizzle's transaction method obtains a database transaction, passes its transaction object into our callback, and resolves when the transaction finishes. A transaction can contain reads only; “transaction” does not necessarily mean records were inserted.

(File: [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts), lines 17 - 26)

The backend uses the configured PostgreSQL connection pool through Drizzle. The pool and database wrapper were initialized earlier; this call uses them. It does not create a new PostgreSQL server or repeat application startup.

Drizzle builds SQL from the query calls, the PostgreSQL driver sends that SQL over its connection, and PostgreSQL performs the reads.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 11 - 19)

The service selects class 179 and joins grades to obtain its school id. The [target] syntax destructures the first item from the query-result array.

It rejects a missing class or a class outside school S. It verifies that mode is supported and academicYear is an integer in range. In update mode, 2026 must equal the class's current academic year.

It reads the school's existing learners and, if any exist, their latest recorded membership years. At this preview invocation, the incoming rows array is empty, so row validation has no proposed rows to report.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 20 - 30)

Mapping the empty rows array produces no matches or transfers. update mode produces no removed list. The function can compute an internal result/hash, but this initial route does not present that as the five-row review.

There are no learner INSERT statements in this function.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 50 - 50)

After the read transaction completes, res.json sends:

~~~ts
{
  rows: [ /* the five parsed learner objects */ ],
  existingIdentifiers: []
}
~~~

The comment here is an abbreviation for the five objects, not literal JSON. On the wire JSON uses quoted property names and has no comments.

An HTTP response contains a status, headers and a body. res.json serializes the JavaScript object into JSON text and sets the appropriate response type; this successful preview uses the normal 200 status.

The empty identifier list is deliberate on the learner reconciliation path. Updating a school register may legitimately refer to an existing learner. Existing-school identity handling is left to the review/commit service instead of treating every such number as a duplicate to reject.

It does **not** prove that the school has no existing learners.

## 10. The browser receives the preview and renders editable rows

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 163 - 168)

The upload helper checks the HTTP success status. On success, res.json parses the response body into JavaScript values and resolves the promise.

A server error would instead become a rejected operation through the helper's error handling. That would lead to the component's catch block and visible error message, rather than pretending there were five ready rows.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 89 - 97)

Execution resumes after await api.upload.

The mounted guard prevents applying this response after the importer has disappeared. On the observed path it is still mounted.

The component constructs a Set from existingIdentifiers, which is empty here. Its inline-staff filtering condition is false because kind is learners, so all five learner rows remain.

setSkipped stores zero. setRows maps the five objects to copies with an extra key: their zero-based array index. The object spread syntax ...row copies the original properties, then key adds a local identity for the editable table.

These keys are not admission numbers or saved database ids. They let the UI keep track of the same draft row even if another row is removed.

setExisting stores the empty returned list. finally clears the in-flight ref and busy state. finally executes after success or error, so the request guard/loading state can be released in either case.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 59 - 76)

Because rows changed, validation now examines the five draft objects.

It uses a Map to count normalized identifiers. trim removes leading/trailing whitespace, toLowerCase makes matching case-insensitive, and counts.get(id) ?? 0 supplies zero when no count exists.

For each row, it collects errors for required names/identifier, text longer than 200 characters, returned existing-number conflicts, and repeated identifiers within this preview.

The numeric key is ignored by the string-length test because it checks typeof value === "string".

On the five shown rows, each name is present and each admission number is distinct. The existing-number Set is empty. Each row's errors array is empty, and invalid is zero.

“Ready to save” at this point means the client-side draft checks pass. It does not mean the server has already compared these five proposed learners with school records or saved them.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 46 - 46)

The effect continues to lock Purpose because rows !== null is now true, even after busy returns to false. This protects a prepared draft from a purpose change.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 126 - 141)

saved is still null but rows is now an array, so the preview branch replaces the file-selection form.

The component renders the “Nothing has been saved yet” message, five-row status, and editable table.

The outer viewport allows overflow scrolling and limits height to 50vh, meaning half the browser viewport height. The table has a minimum width of 700px. Its header is sticky at the top of that scroll container and uses the light inline background.

fields.map creates three data headings after Row. rows.map creates a table row for each draft object. The displayed row number is index + 1, which is why the screen shows 1–5 even though the internal keys began at 0.

Each input receives its current value from the row object, with an empty-string fallback. This makes it a controlled input: React state supplies the displayed value. maxLength is 200; disabled reflects busy; aria-label combines the field label and row number for accessibility. aria-invalid and the border/error list expose validation failures when present.

![Screenshot 7 - Five editable rows, nothing saved](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-07-preview.png)

### The editable cells and Remove buttons are wired, but no edit is evidenced

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 134 - 139)

The render registers each input's onChange callback. If you typed in a cell, it would capture event.target.value, clear the error and prior impact, and update only the matching keyed row with a copied object.

The notation [field.key]: value is a computed property name: the key comes from the current field descriptor rather than literally being named field.key.

The Remove callback similarly clears the error/impact and filters out that keyed row. It removes a proposed row from this local draft; it does not call a delete-learner API.

Your screenshots show all five rows retained with the same values. Therefore these editing/removal bodies are **available handlers**, not operations I am claiming ran in this task.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 34 - 47)

MobileAction is our shared button wrapper used to render Remove. It forwards the supplied disabled state and click callback to an actual HTML button, supplies its accessible label/title, and renders label/icon content. The spread ...props forwards the remaining button properties; it does not invoke the callback.

(File: [src/components/shared/mobile-action.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/mobile-action.module.css), lines 1 - 12)

The icon is hidden by default, so this desktop table shows the written Remove label. Compact-screen media rules change utility-button presentation. They do not apply to your wide desktop screenshots. Thus the component name MobileAction does not mean your desktop click would use a different removal algorithm.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 151 - 154)

Back is also registered. It would clear rows, impact and error to return to the file form. It is different from the book footer's Previous control and the browser's Back button.

The primary button currently says Review changes because kind is learners and impact is still null. It is enabled because busy is false, there are five rows, and invalid is zero.

![Screenshot 8 - The same five-row preview before reviewing](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-08-preview-confirmed.png)

Screenshots 7 and 8 show the same draft state. There is no visible basis for inserting an extra edit, removal, save or navigation between them.


## 11. Review changes sends the draft rows as JSON

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 102 - 110)

Clicking **Review changes** calls the function named save. Its name covers both the review stage and the later commit stage; the conditional inside determines which operation runs.

The guard requires rows, no invalid rows, no request in flight, and no previous successful save. All conditions allow this call.

The function marks the request busy and builds payload:

~~~json
{
  "mode": "update",
  "academicYear": 2026,
  "rows": [
    { "firstName": "Maropeng", "surname": "Ramaputla", "identifier": "20240006" },
    { "firstName": "Kgaugelo", "surname": "Mphelo", "identifier": "20240007" },
    { "firstName": "Dineo", "surname": "Maepa", "identifier": "20240008" },
    { "firstName": "Lucky", "surname": "Ramalekana", "identifier": "20240009" },
    { "firstName": "Tshephiso", "surname": "Malepe", "identifier": "20240010" }
  ]
}
~~~

Number(academicYear) converts the form's "2026" string into the JSON number 2026.

The map callback destructures each draft row and creates a new object containing only the import fields. The local key property is not included. The staff-only title property is not added for learners.

Because kind is learners and impact is null, the function calls api.post on base + "/review". The commit branch is not reached on this click.

The spreadsheet is not uploaded a second time. We now send the proposed rows, allowing the latest editable values to be reviewed even if they differed from the original file.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 211)

The JSON request helper builds fetch options with Content-Type: application/json and the current bearer token, includes applicable cookies, and sends the supplied body.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 218 - 224)

api.post uses JSON.stringify to serialize payload. The request is now:

~~~text
POST /schools/S/classes/179/learners/import/review
Content-Type: application/json
Authorization: Bearer <current access token>
Body: the JSON object above
~~~

JSON is a text format for objects, arrays, strings, numbers, booleans and null. The backend will parse this text back into JavaScript values.

An API is the agreed way one part of the system requests work from another. Here the agreement includes the HTTP method, path, authentication, body fields and response structure. JSON is one format used within that agreement.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

The request traverses the same application middleware. This time express.json does apply, because the Content-Type is application/json. It parses the request body into req.body, subject to the configured JSON size limit.

Multer is not used for this JSON review request. There is no uploaded file to decode.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 65 - 68)

The review route again runs authentication, school-administration authorization and school/class parameter checks. These guards run for each protected request; passing Preview did not grant a permanent bypass for Review.

The route checks the expected kind and validates req.body using rosterRowsSchema.safeParse.

(File: [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts), lines 15 - 16)

The Zod schema requires an object containing rows, an array with 1–500 row objects. Each row has the expected string fields; title is optional, and text fields have a 200-character maximum.

Zod is a runtime validation library. Calling safeParse returns a success/failure result instead of relying only on TypeScript's compile-time types.

The schema does not by itself establish every business rule. For example, required nonblank text and school identity reconciliation are also checked by the service.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 65 - 68)

With valid rows, the handler opens a database transaction and calls reviewLearnerRoster with the **actual five rows**, mode update and numeric academic year 2026.

This is the difference from the earlier preview call that supplied an empty rows array.

## 12. The backend compares the five rows with the school register

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 11 - 17)

The service again looks up class 179 through its grade, verifies school S and the academic year, then reads existing learners within that school.

The query uses a left join to obtain each learner's current class name/year while preserving learners with no current class. A left join retains the left-side learner row even when a corresponding class is absent.

If there are existing learners, a grouped query retrieves each learner's greatest recorded membership year. This supports the check against moving a learner backwards from a later academic year.

All of these are backend database reads. The browser is awaiting the request; it is not itself running Drizzle queries.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 18 - 19)

The service calls validateRosterRows. For update mode it supplies an empty existing-number list. This means an admission number already belonging to a school learner is allowed to be reconciled, rather than automatically rejected.

This does not disable required-field or duplicate-within-upload validation.

(File: [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts), lines 21 - 38)

validateRosterRows constructs a normalized existing Set and a Map of incoming identifier counts.

It trims required fields, checks length, and identifies duplicate identifiers in the submitted batch. For learners, the staff-only title requirement is skipped.

It returns an array of row issues, retaining only rows with errors. The service would turn those into an error message and stop review. The five valid rows shown produce no issues.

Client validation improves the editing experience; this server validation is necessary because the backend cannot trust that every caller used our UI.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 20 - 25)

For each proposed row, matches searches existing school learners using a normalized admission number.

The helper key trims and lowercases the text. The identity rule is therefore **school + normalized admission number**, not “same first name” or “same row position.”

The service rejects ambiguous multiple matches and rejects moving a matched learner backwards from a later current/historical year.

Your review screenshot reports **5 new**. On this successful path, each of these five admission numbers has no matching learner in this school at review time. That finding says nothing about whether other classes or schools already contain other learners.

Each match result holds the proposed row and an undefined existing value.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 26 - 28)

The service derives transfers from matched existing learners in another current class. There are none here.

It constructs a Set of the desired identifiers. The removed list is populated only in progression mode. Since mode is update, removed is [] regardless of which other learners are absent from this spreadsheet.

That implements the page's promise that unlisted learners stay. This operation does not mean “replace every class list with only this file.”

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 29 - 30)

The service constructs a canonical payload containing the requested school/class/year/mode, cleaned proposed rows, target class year, and a selected baseline of existing school-learner fields.

It sorts the existing baseline by learner id so its hash is not changed merely by arbitrary query-return order.

createHash("sha256").update(JSON.stringify(payload)).digest("hex") calls Node's crypto library to produce a hexadecimal fingerprint called reviewHash.

The hash lets Commit detect a difference between the reviewed proposal/baseline and the proposal/baseline it sees when saving. It is not a password, login token or substitute for the authorization middleware.

It also is not a fingerprint of absolutely every field in every table. The code explicitly chooses what goes into payload; for example, password hashes are not included in this baseline.

Counts are computed from matches:

| Result | Why it has this value |
| --- | --- |
| added: 5 | All five rows lack an existing school learner. |
| retained: 0 | No matched learner is already in class 179. |
| assigned: 0 | No matched learner previously had no class. |
| transfers: [] | No matched learner comes from another class. |
| removed: [] | This is update mode. |

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 32 - 34)

rosterImpact creates the response-friendly form of that result. It includes reviewHash, counts, transfers, removals and academic year, while omitting the internal matching/query structures.

Awaited and ReturnType in its type annotation let TypeScript derive the resolved return shape of reviewLearnerRoster. They are type-level tools; they do not initiate another review call.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 67 - 68)

The read transaction finishes and Express responds with the impact as JSON. There are still no learner inserts: the review service computed proposed effects using SELECT results.

## 13. The browser adds the impact section and changes the button

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 211)

The helper checks the HTTP response and parses its JSON. The promise resolves to the impact object.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 107 - 117)

The save handler resumes. If the importer is still mounted, setImpact stores the review result.

Then return exits the try block's review branch. JavaScript still executes finally before this async function completes. The finally block releases inFlight and sets busy to false.

This return is important: one click on Review changes does not fall through into Commit.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 144 - 154)

React renders again with a non-null impact.

The existing five-row table stays in place. Beneath it, the conditional impact section now renders **Review changes before saving**, the counts, and the statement about keeping accounts/passwords/history.

Transfers and removals have their own conditional detail lists; neither is displayed because both arrays are empty.

The wording after the account/history sentence depends on mode. update produces **Unlisted learners stay in their current class.**

The primary button now says **Save 5 learners**, because an impact is available. It still calls the same save function.

![Screenshot 9 - Five new learners reviewed before saving](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-09-review.png)

If you edited a cell or removed a row now, the already-registered callbacks would clear impact. The button would go back to Review changes, so the edited proposal could be reviewed again. Your screenshots show no such edit.

The Back button would return to the file form; it does not undo database changes because no import changes have been committed yet.

## 14. Save 5 learners submits the reviewed proposal

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 102 - 113)

Clicking **Save 5 learners** enters save again. Its guard passes, busy becomes true, and the function reconstructs the same clean payload from current rows.

This time impact exists, so the Review-only condition is false. The function calls the /commit endpoint with the payload plus impact.reviewHash.

The object spread ...payload copies the payload's properties, and reviewHash adds the fingerprint received from Review. The actual long hash is not visible in the screenshots, so we do not invent one.

The request is conceptually:

~~~text
POST /schools/S/classes/179/learners/import/commit
Content-Type: application/json
Authorization: Bearer <current access token>

{
  "mode": "update",
  "academicYear": 2026,
  "rows": [the same five row objects],
  "reviewHash": "<the hash returned by Review>"
}
~~~

This display abbreviates rows for readability; the actual request contains the five full objects, with no explanatory placeholders.

The same JSON helper performs serialization, authentication attachment, fetch, status checking and response parsing. The table controls and action buttons are disabled while busy is true.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 57 - 62)

The backend Commit route repeats authentication, authorization, parameter checking and row-schema validation.

For a learner commit, it also requires reviewHash. A request without a review fingerprint receives a conflict response instead of bypassing the review step.

The handler calls commitLearnerRoster inside db.transaction. This is the transaction that will perform the persistent writes.

## 15. Commit locks the workflow and checks that Review is still valid

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 35 - 39)

The service first executes two PostgreSQL advisory transaction-lock statements:

~~~sql
select pg_advisory_xact_lock(7411, 0)
select pg_advisory_xact_lock(7412, S)
~~~

These are coordination locks identified by application-chosen numeric keys, including a school-specific key. They last until the transaction ends. Other code cooperating with the same locks waits its turn, reducing conflicting workflow changes.

They do not freeze every database operation performed by every possible client.

The sql tagged-template helper passes interpolated values such as schoolId as query values. This is not browser string concatenation into executable SQL.

Next, Commit calls reviewLearnerRoster again with the five submitted rows. The destination checks, validations, matching, impact calculations and hash construction described in step 12 execute again inside this transaction.

It compares the newly calculated hash with the supplied reviewHash. If the included baseline or submitted proposal changed, it throws a 409 conflict asking for another review.

On your successful path they match, so execution continues.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 40 - 50)

now stores a Date for any membership endings needed by this commit.

The affected array collects existing matched learner ids and removals. Both categories are empty for five entirely new learners. Consequently, the conditional existing-learner SELECT ... FOR UPDATE is skipped.

The progression branch is also skipped because mode is update. The class academic year/stream revision is not advanced, and the subject synchronization call in that branch is not made.

The removed loop has no entries, so no learner is detached from a class on this task's path.

These are evaluated conditions, not extra mutations hidden behind the Save button.

## 16. The transaction creates each new learner and its membership

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 51 - 54)

The for...of loop now executes once per proposed learner, in the submitted order.

For the first iteration, row is Maropeng Ramaputla with identifier 20240006. existing is undefined. The existing-learner update branch is therefore skipped.

The else branch calls tx.insert(learners).values(...).returning() with:

~~~text
firstName       Maropeng
surname         Ramaputla
admissionNumber 20240006
schoolId        S
classId         179
~~~

trim cleans the text again. The identifier field becomes the admissionNumber database column value.

Drizzle translates this builder call into a parameterized INSERT. PostgreSQL inserts the row and returning retrieves the created record. [created] takes the first returned object, and learnerId becomes its generated id.

That generated learner id is not 20240006 just because the admission number is 20240006.

(File: [Project-Edu-Revo/src/db/schema/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/learners.ts), lines 9 - 22)

These schema definitions describe the table used by the INSERT. They are not a new CREATE TABLE command run by every import.

The id is generated by the database. Names, admission number and school relationship have their declared constraints. classId links to the class.

The import does not supply a username or password hash. Those optional columns remain null for these newly created records. accountSetUp uses its default false, and createdAt uses its database default.

Creating a register record is therefore distinct from completing the learner's account setup. This is why the final screen can show five saved learners while marking them Setup pending.

(File: [Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql), lines 15 - 20)

The migration defines a unique index for school id plus lower(btrim(admission_number)). Once this migration is applied, PostgreSQL enforces that normalized admission-number uniqueness when inserts/updates occur.

It also defines the learner school/class relationship check. On a learner INSERT with a class id, the trigger function looks up the class through its grade and checks the school relationship. Here class 179 must belong to S.

(File: [Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql), lines 30 - 32)

The installed BEFORE INSERT/UPDATE trigger calls that function for learners.

The distinction is timing: the migration file's installation statements ran when migrations were applied. During this Save operation, PostgreSQL executes the already-installed constraints/trigger as part of handling the INSERT. The application does not run the migration file after every upload.

This walkthrough assumes the checkout's migrations have been applied to the running database; screenshots alone cannot verify migration installation.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 55 - 61)

moved is true because !existing is true. In this implementation that means membership work is required even for a newly created learner.

The code tries to close any open membership history for learnerId. For a new learner there are no such records, so that UPDATE changes zero rows.

Then it inserts learnerClassHistory with the new learner id, class 179 and academic year 2026.

(File: [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts), lines 18 - 22)

The membership table records the learner/class/year relationship and its time interval. startedAt defaults to now; endedAt is initially null, indicating an open membership. A unique index limits each learner to one open membership.

This separates the learner's lasting identity from the history of which class they belonged to.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 61 - 61)

The service also invalidates prior stream confirmations for that learner/class/year by setting revision to -1. No matching selection rows exist for this newly created learner, so this UPDATE also changes zero rows.

It does not choose a stream or create a subject choice for the new learner.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 51 - 63)

The loop repeats the same insert-and-membership sequence for Kgaugelo, Dineo, Lucky and Tshephiso.

For this five-new-learner path, the persistent result is five learner records and five membership-history records. The conditional updates for old history/stream confirmations find no rows for these new identities.

All five iterations belong to the same database transaction. If an insert or constraint fails partway through, the transaction rolls back the import's writes instead of leaving a partially imported set.

The existing-learner path in this function would update selected name/class fields while preserving credentials and other history. That explains the UI's general preservation message, but your five-new-row result takes the creation path.

(File: [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts), lines 64 - 64)

The service returns saved: rows.length, the reviewed impact and academicYear. rows.length is 5.

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 61 - 61)

The transaction promise resolves after successful completion. The route responds with HTTP **201 Created** and the result as JSON.

This is the point where the successful response confirms the persistent import. Neither the original file choice nor the earlier Ready to save message did that.

### If Commit failed, what would the page do?

(File: [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts), lines 32 - 36)

Known roster errors are returned with their status/message. A database uniqueness conflict is translated into a conflict response explaining that nothing was saved and the register should be reviewed again.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 116 - 117)

A rejected request reaches catch. The browser clears impact, sets the error message, and finally releases busy/inFlight. The draft can be reviewed again; it does not render the success count.

That is an explanation of the failure handling connected to this operation, not a claim that a failure occurred in your screenshots.


## 17. The success screen appears, and the app waits for Done

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 112 - 117)

The browser's JSON helper resolves the successful Commit response. The mounted check passes and setSaved(result.saved) stores 5.

The component then awaits onSaved. We must follow the callback actually supplied on this page, rather than assuming every callback with this name immediately reloads data.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 341 - 341)

The callback supplied to WorkspacePage sets:

~~~ts
importChanged.current = true;
~~~

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 188 - 189)

WorkspacePage passes that callback through to the importer as onSaved.

Changing a ref does not itself request a render. This flag records that a future navigation must refresh book data. It lets the success message remain visible until you decide to leave.

It is not a call to router.refresh(), and it is not the class-dialog refresh function merely because those also deal with changes.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 119 - 126)

React renders the saved branch because saved !== null is true.

That branch replaces the editable table/review controls with:

~~~text
5 learner records saved.
Existing accounts and learning history have been preserved.
Done
~~~

The paragraph has role="status" for assistive technology. Done is type button, spans the available width, uses the action styling, and calls onClose when clicked.

busy is cleared in finally after the callback completes, so Done is enabled. The class label remains above the result.

Purpose remains disabled because the component still retains a non-null rows array. Displaying the saved branch does not automatically clear rows or change mode.

![Screenshot 10 - Import saved, waiting for Done](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-10-saved.png)

The URL is still page=import-179. The selected sidebar entry is still Bulk import learners. That matches the code: successful Commit does not automatically navigate back.

The preservation statement is general wording for an importer that can reconcile existing accounts. Here five new records were created; their own account setup has not been completed.

## 18. Done closes the inline importer by navigating back

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 47 - 50)

Clicking Done invokes onClose, which was assigned motion.close. That shared helper ultimately calls the supplied onDismiss callback if no request is in flight.

The inFlight ref is now false.

(File: [src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx), lines 170 - 170)

The importer is inline, so its returned section has no dialog attached to motion.ref. The BottomSheet alternative, which would attach modal machinery, is not rendered.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

The close helper checks the referenced dialog. Here there is no open dialog node, so it invokes its dismissal callback immediately.

This differs from closing the Purpose dialog earlier. We must not assume that the inline Done button runs a 140 ms modal exit just because it shares useModalMotion.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 188 - 189)

The parent's onClose callback sees the import configuration's class id and calls onNavigate("class-179").

The fallback destinations for a school-wide learner/staff import are present in the expression, but not chosen here: this is a class-specific import.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 310)

navigate runs again. This time importChanged.current is true.

The function clears the flag and increments revision using setRevision(value => value + 1). This functional setter receives the prior revision and returns the next one. Incrementing revision tells the workspace that the loaded book data must be refreshed.

It builds the class destination, triggers the page-turn presentation, clears search text and pushes:

~~~text
/dashboard/principal?book=grades&page=class-179
~~~

No Subjects tab is supplied. The destination therefore uses the default Learners view.

The browser now has another history entry. Done is not browser Back: it deliberately navigates to the class page and consumes the pending import-change flag.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 239 - 246)

revision is a dependency of the book-loading effect. The changed revision makes the effect call book.load again.

Its cancellation flag prevents a late obsolete load from replacing newer data. If school identity were absent it would navigate to the login route; the principal's valid school identity is retained on our successful path.

Asynchronous operations can overlap with visual transitions. The page may briefly show its preparation state; the final screenshot is the settled state after the relevant load/view promises complete.

## 19. The workspace refreshes the book's supporting data

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 100 - 102)

The Grades & Classes load function starts structure, streams and people through Promise.all.

Promise.all waits for all supplied promises and returns their results in the same order as the supplied array. It allows independent requests to be in progress together. It does not mean the server responses arrive in a guaranteed order.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 47 - 50)

structure first requests the school's grades and sorts them numerically. Once the grades response is available, it requests each grade's classes in parallel, then flattens the arrays.

With the five grades visible in this book, the supporting-data calls are:

| Request | Why it is reloaded |
| --- | --- |
| GET /schools/S/grades | Rebuild the parent grade pages. |
| GET /schools/S/streams | Obtain current stream data used by class views. |
| GET /schools/S/people | Obtain staff, including the class manager. |
| GET /schools/S/grades/G8/classes | Current classes/counts in Grade 8. |
| GET /schools/S/grades/G9/classes | Current classes/counts in Grade 9. |
| GET /schools/S/grades/G10/classes | Current classes/counts in Grade 10. |
| GET /schools/S/grades/G11/classes | Current classes/counts in Grade 11. |
| GET /schools/S/grades/G12/classes | Current classes/counts in Grade 12. |

G8–G12 stand for actual grade database ids, not necessarily the numbers 8–12. These eight calls describe this book loader's five-grade case; they are not a promise about the total count of all browser/background/development requests.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 15 - 16)

The registry's get helper calls api.get for each path, using the school-prefixed base path.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 224)

The request helper performs authenticated GET requests and parses the returned JSON. GET retrieves data; the helper does not resend the uploaded spreadsheet or call Commit.

On the backend these requests again pass through the application middleware and each route's access checks. The following handlers perform the supporting reads; independent requests can interleave.

### Grades

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 12 - 27)

The grades router verifies the school request and handles the grade-list GET. After access checks it calls getSchoolById to ensure the school exists, then getGradesBySchool to retrieve its grades.

(File: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts), lines 33 - 36)

getSchoolById selects the school by id and returns the first result, or null if it does not exist. On this path the school exists.

(File: [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts), lines 14 - 16)

getGradesBySchool directly queries grade records belonging to school S and orders them by grade number. The route serializes that result as its JSON response.

### Streams

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 26 - 31)

The streams router's school-prefix middleware verifies authentication/school access for matching stream routes.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 82 - 96)

The list handler checks the permitted read access and calls getStreamsBySchool.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 21 - 23)

The service selects school stream records. Reloading these does not assign a stream to any imported learner.

### People

(File: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts), lines 57 - 64)

The people-list route checks access and calls the school staff listing service.

(File: [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts), lines 27 - 61)

getPeopleBySchool builds the staff result used by the book, including the fields needed to display names and account/access information.

This provides the manager's display record again. The import's inserts did not change the class's manager relationship.

### Classes in each grade

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 31 - 38)

The nested grade/class route has its own parameter/authentication/administration checks before the list operation.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 107 - 123)

The classes-list handler resolves the requested grade within the school and delegates to getClassesByGrade.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 90 - 125)

The service reads class records and their related information, including learner counts.

The Grade 9 result now describes class 179 with five learners. Class id, label, description and manager are still the same class's stored fields.

Each successful route serializes its result to JSON. The frontend Promise.all collects those results into the refreshed BookData object.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 246)

The loader stores the returned data with the new revision. The workspace accepts that current data, rebuilds the page list and finds class-179 again.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 103 - 108)

The page-tree builder still produces one Grade 9B class node and one Bulk import learners child node.

Importing learners did not create another class or a navigation page for each learner. The book still has **13 pages**, as your final screenshot shows.

## 20. The selected class view fetches its register

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

With current book data and class page selected, the view effect calls the book's view function again.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 118 - 122)

The registry finds Grade 9B's parent grade, finds its manager in the refreshed people list, and constructs the class API path.

subjectsSelected is false because tab is not subjects. The function awaits:

~~~text
GET /schools/S/classes/179/learners
~~~

This request supplies the actual register rows. The class-list learner count and the selected-class learner listing serve different purposes; a count alone cannot display the learners' names and setup states.

(File: [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts), lines 69 - 79)

The backend learner-list handler requires authentication and school-administration access.

It joins class/grade data to verify that class 179 belongs to the requested school and that the caller can read that school. It then calls getLearnersByClass and sends the returned records as JSON.

(File: [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts), lines 34 - 40)

getLearnersByClass selects the learner fields required by the UI, joins relevant class/current-stream-choice information, filters by class id and orders by surname.

The SQL orderBy is why the final register is not in the spreadsheet's original order.

The returned order is:

1. Dineo **Maepa** — 20240008
2. Tshephiso **Malepe** — 20240010
3. Kgaugelo **Mphelo** — 20240007
4. Lucky **Ramalekana** — 20240009
5. Maropeng **Ramaputla** — 20240006

No JavaScript code has secretly reassigned admission numbers to match display positions. Each learner retains the identifier paired with their own inserted record.

The stream-related joins let the list include an applicable selected stream name if one exists. These five new learners have no such confirmed selection from this import.

The API returns register data; it does not return password hashes for this display.

## 21. React renders the five-learner class page

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 135 - 152)

The view function now receives five learner items.

It supplies the manager paragraph **Class manager: Mr Kgodiso Taba** because the saved classTeacherId still resolves to that staff record.

Its title actions remain Edit class and Delete class. The Learners/Subjects tabs remain available, and the guidance still says to use Subjects to manage class subjects. Importing learners did not activate the Subjects tab.

The Class register section now contains five rows. For each learner:

- id becomes the record's string id for UI identity.
- title comes from learnerName.
- detail combines admissionNumber and any selectedStreamName, filtering out absent values.
- badge chooses Account active only if accountSetUp is true; otherwise it chooses Setup pending.

All five inserted records began with accountSetUp false. The displayed badge therefore follows directly from their saved state.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 130 - 132)

learnerName combines firstName and surname with a space, omitting absent parts. nameOf is the related staff-name helper used for the manager, and classLabel supplies the Grade prefix for class headings.

These formatting functions operate on returned objects. They do not make separate requests for each name.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 141 - 150)

Add learner and Bulk import learners remain present. Because items.length is now greater than zero, the view also includes **Move learners**.

The Move learners action stores a renderContent function capable of creating its management UI when invoked. Returning this function in an action object does not mount MoveLearners now or move anyone automatically.

Its eventual destination options are filtered to other classes in the same grade and academic year. Explaining that stored configuration is different from tracing a Move learners click, which is outside this task.

The row action for resetting subject choices is conditional on the class having more than one stream. No such row action is visible in your final screenshot.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 189)

WorkspacePage turns the view description into the header, tabs, actions, count and learner rows.

The register count derives from the section's rows length: **5**. The empty-message branch no longer applies.

The default search condition requires **more than five** rows, not five or more. With exactly five, no search box appears. This explains another small visual detail of your ending screen.

The section rows are mapped into display elements with their titles/details and right-hand badges. Styling controls alignment, spacing, borders and typography; it does not determine whether an account is set up.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 79 - 145)

The workspace's CSS module supplies the header, section/action, tab, row and empty/footer presentation rules used by this view. A CSS module gives locally scoped class names to elements through the imported styles object.

The active Learners tab receives its selected presentation. The five row dividers come from row styling; they are not five separate database operations.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 346)

The shell renders the left contents with class-179 active, the breadcrumb back on Grade 9 / Grade 9B, and the page footer showing **Page 2.1 · Grade 9B**.

Previous and Next have handlers to navigate to adjacent entries in the flattened page list. They have not been clicked in this task.

Navigation help and Sign out also remain available. Their registered handlers do not execute merely because the page re-renders. Likewise, the bookshelf remains on the right; saving learners does not open another book.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 279 - 288)

The workspace's location effect records the new location and scrolls its sheet viewport to the top when the page changes. It also coordinates page-turn animation so a navigation already animated is not needlessly animated a second time.

Browser layout computes the sizes and positions of the resulting DOM elements; painting draws them. React describes and updates the element tree, while the browser performs layout, painting, pointer targeting and scrolling.

At this settled point the importer's inline UI is gone from the selected page, and the class register is visible.

![Screenshot 11 - Grade 9B with five learners and Setup pending badges](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-5-11-register.png)

## 22. Connect an observed action to its running code

This table is a recap of the chronology already followed, rather than another execution of the functions.

| What you do or see | Where to reason about it |
| --- | --- |
| Click the import heading | Contents click → workspace navigate → URL page selection. |
| Import form appears | Registry's import view → WorkspacePage → inline RosterImportModal. |
| Open Purpose | AppSelect state → SelectPanel's browser dialog. |
| Browse Desktop in the file picker | Browser/Windows native picker; no per-folder import handler. |
| Filename appears | File input change → setFile → form render. |
| Click Preview | Form submit → multipart upload → workbook parser → proposed rows response. |
| Five editable rows appear | setRows → validation memo → preview-table render. |
| Click Review changes | JSON /review → school-identity reconciliation → impact/hash response. |
| Click Save 5 learners | JSON /commit → lock/review-hash check → transaction inserts. |
| Success message appears | setSaved(5); parent marks pending book refresh. |
| Click Done | Inline close → navigate class-179 → revision change. |
| Register shows five learners | Refreshed book + class-learners GET → surname order → row render. |

The distinction to keep while reading the app is between **a rendered control**, **a callback registered on that control**, **a callback actually invoked by an event**, **an asynchronous server request**, and **a database write committed by that server request**. Your screenshots cross each of those boundaries, but they are separate steps with separate code responsible for them.

