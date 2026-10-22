# Worked readings of the code

## Read a request from click to committed record

Take an illustrative principal action: create class A inside Grade 11. The browser already has a school ID and the selected grade's database ID. They are not interchangeable with grade number 11. The class command in registry.ts builds a request to /schools/{schoolId}/grades/{gradeId}/classes with a body such as {"name":"A","streamId":null,"classTeacherId":null,"description":null}. Braces here describe an object. null means deliberately unassigned, while an omitted optional property can mean leave it unchanged during an update.

api.post serializes the object and attaches the access token. Express parses the JSON. requireAuth verifies the token, requirePrincipal checks the staff role, and the classes router verifies that the URL school is the caller's school and the grade actually belongs to it. createClassSchema validates the body. createClass loads the grade, normalizes A to 11A, checks for a duplicate, then starts the setup transaction. The insert generates the class ID. Subject synchronization runs in the same transaction, and returning() supplies the inserted record for the response.

The frontend's command returns a destination such as class-42 using the newly returned ID. onSaved navigates to that page and increments the local data revision. The book reloads school structure, rebuilds the contents tree and resolves the new class page. A visible new row is therefore the outcome of transport, authorization, validation, normalization, a transaction and view invalidation. Any one of those steps can explain why a click does not produce the expected row.

## Read a Drizzle declaration one expression at a time

Consider gradeId: integer('grade_id').notNull().references(() => grades.id). gradeId is the property name used in TypeScript. 'grade_id' is the actual SQL column name. integer chooses the database value type. notNull requires a value. references identifies the parent key. The arrow function delays obtaining the parent declaration until the schema machinery needs it. The expression describes a column and its constraints; it does not query a grade when the file is imported.

Consider unique().on(table.classId, table.subjectId). It protects the pair, not either column alone. A class can have many subjects and a subject can be in many classes, but the same class-subject pair appears once. Consider timestamp('created_at').defaultNow().notNull(). It records creation automatically when a value is not supplied. It does not update itself whenever another column changes. The updatedAt writes in feedback services are explicit for that reason.

Consider const [school] = await db.insert(schools).values(data).returning(). const introduces a binding that will not be reassigned. [school] destructures the first item from a result array. await waits for this asynchronous operation within the function while the runtime can service other waiting work. returning asks PostgreSQL to return inserted data, including generated values. If no result exists, the destructured value can be undefined; callers need to consider whether the operation guarantees a row.

Consider and(eq(grades.schoolId, schoolId), eq(classes.id, classId)). eq builds a SQL equality condition. and combines conditions. It is not a JavaScript comparison between the entire table and a value. Keeping a school's ID in the condition helps preserve resource scope. Parameterized values are sent separately from SQL structure through the database library.

## Read the modern planning mutation in order

Open teacherWorkspaceService.ts at savePlan. The signature defines caller identity, allocation ID, a structured payload and an optional database argument. The default database is the real db; tests can supply a transaction-compatible substitute. The function returns database.transaction with an async callback. Every query through tx belongs to that transaction.

teacherScope checks account, school, allocation and chapter ownership before an insert occurs. chapter is selected from the owned shared curriculum. valid is a Set of allowed concept IDs, which makes membership checking direct and removes duplicate membership from that lookup. Existing active custom concepts for this exact class subject are added to the allowed set. The selected IDs are rejected if any are outside it or if the submitted array repeats an ID.

customConcepts defaults to an empty array with ??, meaning use the fallback when the left value is null or undefined. At least one selected or new concept is required. Every new custom concept must point to a topic in the chosen chapter. New custom rows are marked isCustom and scoped to classSubjectId. Their returned IDs are combined with the selected existing IDs. The lesson is inserted as planned, then lesson_concepts receives one pair per concept. The transaction returns the lesson only after those writes succeed together.

The function's exclamation marks, such as plan!.id, are TypeScript non-null assertions. They do not check the database result at runtime. They record the programmer's expectation that a successful insert returns a row. The spread operator in [...data.conceptIds, ...created.map(...)] combines arrays. map transforms each concept ID into the lessonId/conceptId object needed by the join table.

## Read confirmation as a state transition

confirmPlan begins by locking the lesson row with FOR UPDATE so two confirmations serialize. lessonScope then obtains and authorizes the lesson. The status check allows only planned to proceed. The date check uses the school's calendar date and rejects future confirmation. A Set size check detects duplicate requested concepts, and membership checks reject concepts outside the original plan.

The omitted array identifies planned links the teacher did not confirm. Those links are deleted, while retained links keep their IDs. Finally, the lesson status becomes confirmed and returning provides the updated row. Keeping retained lesson-concept IDs is useful because feedback refers to those occurrences. Replacing all links with new rows would unnecessarily disturb those references. The older helper in lessonService deletes all links, which is another reason not to bypass the newer operation.

## Read the shared page contract before editing its renderer

Open types.ts at PageView. A question mark after a property name means the property is optional. titleActions can be absent when a page has no heading command. sections is an array of sections, each with a heading and repeated PageRow records. description is ReactNode rather than string because the registry can bold numbers inside an otherwise ordinary sentence. This small type choice enables rich text without giving each book its own layout.

Command.run is an optional async callback. It receives trimmed string values and the original FormData so multiselect values can be read with getAll. Its result can be a page ID or nothing. A pageId command instead navigates without opening a form. The type distinguishes two kinds of user action in a form the generic renderer can interpret consistently.

flattenPages uses flatMap to return each page followed by the recursive flattening of its children. findPagePath checks each page, recursively searches children and prepends the parent when a match appears. The default [] means a page with no children is safe to traverse. Both helpers are pure: they return derived values without modifying server records or navigating the browser.

## Read the workspace identities before changing loading behavior

Open BookWorkspace.tsx at loaded, pageKey and viewKey. loaded contains the source book ID and revision alongside records. data is non-null only if those values match the current selection. pages derives the nested tree, flat derives reading order, page selects the requested ID or first page, and index locates it for navigation. These are related values rather than independent copies of state that could drift apart.

pageKey identifies the underlying content entity and data revision. viewKey adds the filter and retry attempt. view may retain old content only within the matching pageKey. viewStale compares the full requested viewKey. This lets us keep the page mounted during a filter request while preventing a different class or book from inheriting its rows. The effect closure's cancelled flag blocks a previous request's completion from writing after the dependencies change.

The first effect loads base book data. The next resolves the selected PageView. Their dependency arrays determine when they rerun. Removing a dependency to silence a repeated request can create stale closures, where an effect continues using an older selection. Before changing the array, identify which values belong to the operation's identity. A repeated request may instead come from unstable object or function identity.

## Read a floating label as geometry linked to state

Open FloatingLabelInput.tsx. focused is local state. active combines focus and a nonempty value. The wrapper uses a fixed shared control height and a border whose colour depends on focus. The input is controlled: value comes from the parent and onChange reports a new string upward. The component cannot silently invent its own lasting value because the parent remains the source of truth.

When active, top changes from 50 percent to zero and transform changes from vertical centering to centering plus a .72 scale. transformOrigin anchors the scaling at the left. Input padding changes at the same time, leaving space below the raised label. pointer-events: none lets clicks reach the control beneath the visual label, while htmlFor still associates the label with the input's ID. The design is the coordinated behavior of state, attributes and geometry.

## Read the page fold as a bounded visual function

Open pageTurnMotion.ts. forwardFold is data describing key moments. For each frame, start is the edge minus the fold width, clamped to zero with Math.max. strength uses sin(offset times pi), giving zero at the endpoints and a peak midway. The front clip, back polygon, curl transform and shadow transform are derived from those same values, keeping the visual parts aligned.

pageTurnSchedule turns navigation distance into one or more animation timing records. A sheet's delay grows by 18 milliseconds and its duration shrinks by the same amount. Delay plus duration remains 340 milliseconds. This is a useful invariant to preserve when editing timing. Changing only delay can accidentally stretch large jumps. Changing the duration constant can be tested without requiring live school data because this file contains pure functions.

## Trace an edit across all layers

For a new optional learner field, start by deciding whether it is one value per learner and whether historical changes matter. If it belongs on learners, add the schema property and a migration that leaves existing rows valid. Update registration validation and insert types. Decide explicitly whether spreadsheets need a new required header or an optional one. Add the field to lookup and profile projections only if that caller should see it. Extend frontend response types, form fields and display rows. Verify both manual registration and reviewed import.

For a new book, first ensure the required API exists and is authorized. Add a BookDefinition with stable ID, metadata, load, pages and view. Reuse the PageView structure where appropriate. Supply one colour and inherit the shared visual system. Add a focused model check for generated page identities and commands. Inspect narrow layouts and empty/error states. Only add a dedicated widget when interaction is too rich for declarative fields.

For an additional supported grade, changing a frontend array is insufficient. Review the grades check and provisioning/protection triggers, curriculum grade validation, manager selectors, migrations and fixed-grade tests. Decide how existing schools receive the new grade and how curriculum publication is scoped. A product-boundary change must move through storage, service, API and interface together.
