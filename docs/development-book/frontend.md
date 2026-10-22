# Chapter 2 Building the frontend

## Begin with the tasks people can recognize

The backend can now describe a school and protect the teaching operations. The next problem is making those operations understandable to someone who should not need to know a table name. A principal needs to organize grades and classes, staff, learners, streams and announcements. A teacher needs the next useful teaching action. A learner needs the subjects and lessons belonging to the registered class. We begin with those responsibilities rather than placing every database table in a navigation menu.

React lets us describe the interface as components. A component is a function that returns a description of visible elements from its inputs and current state. A ClassCurriculum component can receive a class-subject identity, load its curriculum and show chapters and concepts. It does not need to own the entire principal dashboard. React DOM connects those descriptions to the browser's document elements and updates them as state changes.

We could implement the interface with plain HTML and JavaScript, Vue, Angular or a server-rendered template system. Plain JavaScript would reduce framework dependence but make shared interactive state and component composition more manual. Angular offers more built-in structure but brings a different framework model. React fits this application because the same conceptual pieces, such as registers, forms, task lists and curriculum disclosures, recur across roles. Its flexibility leaves us responsible for navigation, data fetching and design consistency.

Next.js adds the application framework around React. It supplies a route structure, rendering conventions, build tooling, navigation components, metadata and asset handling. The checked-out frontend declares Next 16.3.0 and React 19.2.8. We use the documentation installed with that Next package when describing route files and server/client boundaries. A tutorial for an earlier release can describe an API that has changed, so the repository's installed guide is the closest reference for this checkout.

The frontend is TypeScript too. A .ts file contains TypeScript logic, while .tsx also permits JSX, the element syntax used to describe React interfaces. JSX looks like HTML but can include components and expressions. Braces in <h1>{title}</h1> evaluate a JavaScript expression. A capitalized <ClassCurriculum /> refers to a component, while a lowercase <section> refers to a browser element. Props are the values passed into a component. children is the nested content a wrapper receives.

## Make folders explain addresses

We create src/app because this application uses Next's App Router. Folders describe route segments. A page.tsx makes the route display a page. A layout.tsx wraps the pages beneath its segment. src/app/page.tsx serves the main sign-in route. src/app/onboard/learner/page.tsx and src/app/onboard/staff/page.tsx provide the two claim entry points. dashboard/staff and dashboard/learner render role-specific workspaces. manager/login and dashboard/manager serve platform curriculum management.

The root src/app/layout.tsx establishes html and body, imports globals.css, loads Geist with next/font/google and exports the application metadata. It gives the browser a title, description and manifest location. The font is assigned to a CSS variable, allowing styles to use it without hardcoding the generated font-family name. The principal book workspace chooses Arial and Georgia locally, so changing the root font will not automatically change every part of the application.

A layout is useful when several pages share visible structure or providers. In the current principal routes, principal/layout.tsx and grades/layout.tsx simply return children. They are transparent wrappers. Their existence does not imply that they render a sidebar or enforce authorization. The main principal structure has moved into BookWorkspace. Following the actual returned JSX is more reliable than inferring behavior from a filename.

Now we reach the exact file in the IDE: src/app/dashboard/principal/grades/page.tsx. We originally need an address for grade management, so that path is meaningful. The current file imports redirect from next/navigation and exports BookEntry, which redirects to /dashboard/principal?book=grades. It has no local state, data fetch or grade list. Its job is compatibility and entry into the shared workspace. To change the visible grades book, editing this redirect alone is usually the wrong place.

Line 1 imports the framework's redirect function. The blank line separates imports from the page export. Line 3 declares the default page component. Line 4 calls redirect with the selected book in the query string. Line 5 closes the function. There is no return statement because this redirect transfers navigation control. The neighboring three-line layout accepts a children value typed as React.ReactNode and returns it unchanged. ReactNode means content React can render, including elements, text and empty values.

The dynamic route grades/[gradeId]/page.tsx keeps an older address for an individual grade. Its parameter is asynchronous in this Next version, so the page awaits params before building the destination page identifier. This is a concrete place where assuming older Next conventions can lead to incorrect edits. The other old principal route files redirect into the corresponding book too. The URL structure survives even though the main rendering architecture changes.

## Decide what must run in the browser

The App Router treats pages and layouts as Server Components by default. A Server Component can render on the server without bringing all of its implementation into the browser. Interactive controls, localStorage, window, event handlers and React state need a client boundary. Files that begin with "use client" declare that boundary. BookWorkspace, the login page, role dashboards, forms and the theme hook's consumers depend on browser interaction.

This distinction does not mean a Client Component is never rendered as initial HTML by the framework. It means the component participates in the client bundle and hydration, where the browser attaches behavior to rendered elements. A top-level localStorage access can still fail when code is evaluated without window. Helpers in auth.ts and api.ts therefore guard browser access with typeof window checks.

The principal page wraps BookWorkspace in Suspense. Suspense provides a fallback while a nested part of the rendering tree is waiting in a way React can suspend. Here it also provides the required boundary around the client component reading search parameters. The displayed fallback says the school library is opening. It is not the application's API error handler; the workspace still maintains explicit loading and error state for its own asynchronous requests.

## Connect the browser to one API helper

Every screen needs the API address, JSON encoding, tokens and readable errors. Repeating those mechanics in each form would cause inconsistent behavior. src/lib/api.ts centralizes them. API_BASE reads NEXT_PUBLIC_API_URL and defaults to http://localhost:3000. getAccessToken and getRefreshToken read browser storage only when window exists. request combines the path and base address, sets JSON content type and attaches a Bearer token when available.

The generic <T> in api.get<T> describes the response shape expected by the caller. It helps TypeScript check later property access. It does not prove the server returned that shape. The helper calls res.json without runtime schema validation. That is a deliberate simplicity boundary worth understanding before treating the frontend and backend types as a generated, guaranteed contract. The two repositories currently maintain response types separately.

When a non-auth request returns 401, the helper tries /auth/refresh and retries the original request with the new access token. refreshPromise is shared across requests in this browser module. If several requests discover an expired token at once, they await the same refresh attempt rather than all issuing separate refreshes. finally resets the promise so a later expiry can start another attempt.

Failed refresh clears local session data. Network failure while refreshing also clears it in the current implementation. That is convenient but can turn a temporary connection problem into a sign-in requirement. The browser's account and role values guide navigation, while the backend signature verification and resource checks supply actual authority. Decoding a token in auth.ts does not verify its signature.

Uploads use FormData through uploadRequest. We deliberately avoid setting Content-Type manually for FormData, because the browser must add the multipart boundary that separates file fields. JSON requests stringify their bodies, while uploads send the FormData object directly. Confusing these paths is a common reason a server reports that no file arrived.

parseError attempts to read an error JSON body and throws an Error. Some backend routes return structured validation objects rather than a simple string, so the helper can produce less readable messages for those cases. A future unified error format should be implemented on both sides. Fixing one screen's text cannot correct a transport contract that varies across routes.

## Make entry and claiming feel like one coherent process

The main login page holds username, password, loading, error and focusedField in state. State means values that affect rendering and cause React to update the interface when changed. handleSubmit prevents the browser's ordinary form navigation, starts the request, calls login, redirects according to account type and role, and clears the loading indicator in finally. Error state renders visible feedback rather than leaving the user wondering whether the click registered.

auth.ts first tries staff login, then learner login, then manager login. On success it stores tokens and selected identity fields, and getRedirectPath chooses the destination. This makes the initial interface simple because the user does not first choose an account category. It also costs extra requests when the first category does not match, and it treats errors broadly enough that a failed staff request can lead to attempts against the other account types. A unified backend identity lookup would be a different design, not a small visual adjustment.

AccountClaimPage is shared by the staff and learner onboarding routes. Its kind prop selects labels, official identifier and API operations. Step 1 finds the registered record. Step 2 confirms the identity and collects credentials. foundPerson connects those stages, password confirmation catches a common typing mistake, and a pending ref blocks a duplicate submission before a state update has time to render.

A ref is a mutable value whose update does not itself rerender the component. We use state for loading text because the user should see it change. We use a ref for a synchronous in-flight guard because two rapid events must see the same mutable lock immediately. These tools solve different problems. The account claim screen does not create a class or school; it attaches credentials to the existing administrative record.

The page's design is also responsive. On wider screens, a brand and explanatory panel can sit beside the form. On a small phone, the form must remain the priority. CSS media queries select layouts based on available width. The implementation does not need a separate iOS or Android page to provide those arrangements.

## Establish a visual vocabulary before drawing individual screens

globals.css imports Tailwind CSS and defines reusable CSS custom properties. A custom property, such as --color-background, is a named value that descendant styles can read with var(...). Tokens for background, text, border, focus and control dimensions keep related controls consistent. Changing a token can update many components at once. This is more maintainable than finding a slightly different hardcoded grey in every file.

Tailwind provides utility classes such as flex, grid, rounded-lg and text-sm. Utilities are convenient for local layout and simple styling near the JSX. CSS Modules provide locally scoped class names for larger design systems such as books.module.css, role-dashboard.module.css, account-claim.module.css and manager.module.css. Importing styles from a module turns class references into generated scoped names. This prevents a .header rule in one module from accidentally styling every header in the application.

The application uses both approaches. It also uses inline style objects for dynamic values and shared variables. This mixture can be sensible: utilities handle common spacing, modules express the custom workspace, and inline properties connect a selected book's data to its colour. The cost is that a visual bug can involve more than one styling source. Inspect the component's className, its inline styles, the imported module and inherited global tokens in that order.

useTheme reads a stored theme or the operating system's preference and sets data-theme on the root HTML element. globals.css overrides token values under data-theme="dark". The principal's current book workspace supplies its own local light palette and color-scheme. The staff workspace has its own dark palette. One global theme switch therefore does not promise that every specialized workspace changes appearance. Local theme ownership is part of the design.

Some global styles still describe the earlier principal glass design. Translucent panels, diagonal highlights, background blur, inset light edges and red accents create the appearance of layered glass on charcoal. Sidebars are deliberately more opaque for readability. Those rules explain older screenshots and retained components. The current principal route renders the book design, so we must not mistake surviving CSS for the main current screen.

## Give the principal a library rather than a pile of dashboards

The principal's tasks naturally group into six collections: Grades and Classes, Streams, Staff, Learners, Announcements and Curriculum. The current design gives each collection the identity of a book. The left panel becomes a table of contents, the center becomes the working sheet, and the right panel becomes the school library. This physical metaphor is implemented with ordinary browser elements and CSS. No 3D library or book-rendering package appears in the dependencies.

For teaching the architecture, we can call this a book and page grammar. The term names a local pattern rather than a React feature. A book defines what data to load and which pages exist. A page describes headings, sections, rows, filters, actions and optional embedded workflows. One renderer interprets that description. The creative decision is therefore also an engineering decision: visual consistency is enforced by a shared data contract.

types.ts defines BookDefinition with id, title, subtitle, description, color and mark for the shelf, plus load, pages and view functions for behavior. load retrieves the book's base data. pages converts that data into a nested BookPage tree. view takes the selected page, school, tab and loaded records, then produces a PageView. Separating those stages avoids rebuilding the whole layout for every feature.

BookPage has a stable id and a display number. Those must not be confused. A page named class-11 refers to a database entity identity. Its display number might be 2.3 because of its current position in the tree. Reordering classes can change display numbering without changing a saved page link. React keys similarly use stable identities so an update does not accidentally attach one row's local state to another row.

PageView does not promise arbitrary top-level action lists. In the current contract, titleActions belong beside the page heading, section actions belong beside that section's heading, and row actions belong beside the affected row. This placement gives a command visible scope. Add learner belongs by the class register. Assign stream belongs with Subjects. The design removes the older bottom Actions section and toolbar shortcut because they separate the action from its object.

Command describes an operation without writing a new dialog component for every small edit. It can specify fields, a confirmation message, an optional destination page, a visual variant and a run callback. Field describes the control type, default value, options and validation hints. Alternative links express the recurring Add learner or Bulk import learners pattern. This small declarative system is custom application code, not a third-party form library.

That abstraction has a limit. A simple rename fits declarative fields well. A spreadsheet editor or nested curriculum browser has richer interaction and should remain a dedicated component. PageView therefore permits content and an import descriptor. We retain one surrounding page surface while allowing specialized workflows inside it. Without this escape hatch, the generic schema would grow into a complicated imitation of React.

## Build the physical workspace in CSS

books.module.css begins with local palette variables: ink #30352f, muted #7c8076, line #e4e4db and paper #fffef9, over a pale #eeefe8 workspace. Georgia gives major headings and book titles a printed character; Arial keeps controls and lists compact and familiar. Small uppercase labels provide secondary hierarchy. These are concrete implementation choices behind the library's calm appearance.

The desktop layout uses CSS Grid with columns 214px, minmax(0, 1fr) and 244px, separated by 28px gaps. The middle expression means the paper receives remaining width but is allowed to shrink instead of forcing the grid wider than its container. min-width: 0 and min-height: 0 appear repeatedly because flex and grid children otherwise resist shrinking around long content. These small rules prevent horizontal overflow and make nested scrolling work.

The top bar is 86px high on the main desktop arrangement. The grid height is the dynamic viewport height minus that bar. Dynamic viewport units, written dvh, respond better to changing browser chrome on mobile than a rigid assumption about screen height. The central paper is a flex column with a toolbar, flexible body and footer. The content scrolls inside the body, while toolbar and footer remain part of the stable sheet.

The binder creates apparent page thickness with ::before and ::after pseudo-elements. A pseudo-element is a CSS-generated visual layer that does not need its own meaningful content node. Slightly shifted pale rectangles and borders look like sheets behind the current one. isolation: isolate establishes a local stacking context so their negative z-index values remain behind the binder rather than escaping into unrelated page layers.

The two metallic pins are decorative spans in a spine overlay. Gradients, contrasting borders and a small shadow suggest metal. Their position is outside the page's scrolling content and outside the moving snapshots. pointer-events: none keeps decorative layers from intercepting clicks. The pins remain stationary while the sheet turns, preserving the illusion of a bound workspace.

Book covers use an aspect ratio of .72, a colour supplied by the registry, a narrow spine gradient, rounded right corners and offset shadows that resemble page edges. A number, Georgia title and small seal provide a repeated cover layout. The cover rises three pixels on hover. It is CSS drawing, not a photograph or generated image. A new book inherits this treatment through the shared shelf component.

The selected book supplies --book-accent. color-mix derives darker ink and solid button colours, a 14 percent soft selection tint, an 8 percent hover tint and a border mixture. That single input themes contents, selected covers, navigation, controls, focus and shared widgets. If we change a book's color in registry.ts, several related visual details change together. The palette is a data-driven part of the book definition.

An active contents heading has a three-pixel vertical accent line covering the middle 75 percent of its left edge. Its tinted background and heavier text provide additional cues. Filter selections use tint and weight without the line. This distinction makes hierarchy selection and filter selection visually different while retaining the same colour family. Selection is not conveyed by hue alone.

The current CSS has several explicit width ranges. At 1500px and above, columns and padding expand. At 1150px and below, side columns and gaps shrink. At 850px and below, the shelf moves above a two-column contents-and-paper arrangement. At 550px and below, the structure becomes a vertical flex layout, covers disappear and book buttons form a compact three-column grid. The metaphor is simplified to fit the phone instead of forcing miniature desktop books onto a narrow screen.

The title area is sticky within pageScroll. position: sticky and top: 0 keep the heading and its controls visible while rows move underneath. This depends on the correct scrolling ancestor and available height. If a future style changes an ancestor's overflow or removes the flex child's min-height: 0, the sticky behavior can appear broken even though the heading rule is unchanged.

## Keep location in the URL and interaction in state

The principal workspace uses /dashboard/principal?book=grades&page=class-11&tab=subjects as a complete navigable location. Query parameters select the book, stable page and optional view. A copied link, refresh or browser Back action can recover that location. Search text and an open command dialog are local interaction state. Keeping every keystroke in the URL would create unnecessary navigation history for the current design.

BookWorkspace reads useSearchParams, finds the matching book, loads its data and computes its page tree. flattenPages recursively turns the tree into reading order for Previous and Next. findPagePath recursively returns the ancestry of a page. The toolbar displays the immediate parent and current page rather than the entire chain, retaining a useful way back without filling a small header with a long trail.

navigate builds a new query string with URLSearchParams, starts the turn animation, pushes the location without automatic page scrolling and clears the search query. It omits the tab when the default view is selected. That keeps ordinary links shorter and prevents a tab from one page leaking into another page that has different views. When the book has not been selected, the workspace shows a welcome sheet and the contents panel remains empty.

State tracks the loaded book data, current view, load errors, view errors, revision, search, dialog and selected book description. loaded stores both bookId and revision, not just the returned records. This matters because a late response for one book must not masquerade as data for another. Derived values such as the page tree are calculated from the selected book and valid data, with useMemo avoiding unnecessary recomputation.

useMemo is a performance tool for recalculating a derived value when its dependencies change. It is not a database cache or a security boundary. useEffect coordinates external work after rendering, such as fetching book data and registering a popstate listener. An effect cleanup marks an asynchronous operation cancelled or removes an event listener when dependencies change or the component unmounts. The dependency list identifies the values on which the effect relies.

Most cancellation in this code is logical cancellation. A cancelled boolean prevents a late result from updating the screen. It does not abort the underlying HTTP request. AbortController would be a separate mechanism for stopping supported network work. Distinguishing the two is useful when diagnosing a request that still appears in browser network tools after navigating away.

## Keep useful content visible while filters load

If a principal changes Staff from All staff to Setup pending, clearing the page immediately would make the interface jump. Keeping the old records fully interactive would be misleading. The workspace handles this with two keys. pageKey combines book, page and data revision. viewKey also includes tab and retry attempt. An old view may remain mounted only when its pageKey still matches the selected page.

While a new filter view is unresolved, the previous body is marked inert and aria-busy. Inert prevents normal interaction with stale content. The heading and filter controls remain usable. When the response arrives, it replaces the retained view. A result from a cancelled request cannot overwrite the latest selection. If the request fails, the heading and prior content remain visible with an inline Try again action.

Including revision in pageKey is essential. After an edit, old data must not survive just because the book and page IDs are unchanged. refresh increments revision, invalidating the loaded book and its view. This revision is local UI invalidation state, separate from the backend curriculum revision used to reject conflicting saves. The same word names two different mechanisms; their scope determines their meaning.

Search filters the already returned rows by lowercasing title, detail and badge text. It is a local display filter, not a server search across the entire database. Staff requests searchable: true so the control remains present even when the current subset is small or empty. The filterDisplay dropdown option renders Staff's five choices in one native select. Other pages use compact buttons with aria-pressed.

The request recovery model does not cover every possible asynchronous interaction perfectly. Base-book load errors and view errors have different retry paths. Import refresh failures can occur after a successful commit. The importer distinguishes saving records from refreshing the visible list, so it can tell the user the save succeeded without encouraging a duplicate submission. This distinction is more important than showing a single generic success toast.

## Turn pages without mounting duplicate applications

The book metaphor needs movement, but the movement must not create a second working form, duplicate network requests or delay navigation. usePageTurn solves this with temporary DOM snapshots. The DOM is the browser's tree of actual elements. cloneNode(true) copies the visible structure. The copy is a visual stand-in, not a newly mounted React component with its own effects and event handlers.

snapshot removes the existing animation layers and pin spine before cloning content into temporary layers. Otherwise a snapshot could contain an earlier snapshot and recursively copy the animation. It removes IDs from the clone to avoid duplicate document identifiers, sets inert and aria-hidden, disables pointer events and gives the copied surface absolute positioning. Decorative motion must not become a second keyboard or screen-reader interface.

Form values need special attention because a cloned element's attributes do not always represent its current live value. snapshot copies input, textarea and select values, along with checkbox state. It skips file inputs because browsers restrict setting their values. It also records the scroll offsets of content viewports. placeSnapshot restores outgoing scroll positions and starts incoming snapshots at the top. Without this work, a page could visually jump before the fold even begins.

usePageTurn stores the actual page surface and overlay in refs. active tracks browser Animation objects, the destination layer and the source content key. clear cancels previous animations, removes the turning flag and empties temporary children. A new navigation begins by clearing the prior turn. This keeps rapid clicks from accumulating hidden trees and stale animations.

useLayoutEffect updates the incoming visual snapshot as destination content becomes ready. A layout effect runs at a stage useful for synchronizing DOM reads and writes before paint. The movement starts immediately and does not wait for the API. The real page can still display its loading state while the visual sheet begins to turn. Navigation and animation are coordinated but are not the same operation.

pageTurnMotion.ts separates the geometry from the DOM hook. PAGE_TURN_DURATION is 340 milliseconds. The forwardFold array supplies seven moments with an edge position and fold width. At the start the edge is at 100 percent and the fold has zero width. Midway it moves across the sheet and grows; at the end it reaches zero and closes. Reversing those moments produces the backward reveal.

For each moment, pageTurnFrames calculates the fold's starting position and a sine-shaped strength. front uses an inset clip path to show the remaining face. back uses a polygon to show the reverse strip. curl translates and scales a gradient. shadow follows the free edge with changing scale and opacity. CSS mirrors reverse content faintly with scaleX(-1) and opacity .065. Together these layers suggest a rolling sheet rather than a single flat rectangle rotating at the spine.

The schedule uses the absolute navigation distance, with a maximum decorative stack of six sheets for jumps larger than four positions. Each successive sheet starts 18 milliseconds later and receives a correspondingly shorter duration, so all finish at the same 340-millisecond endpoint. These sheets communicate a jump; they are not six additional live page components or six data loads.

The hook uses the browser's Web Animations API through element.animate. There is no animation package dependency, canvas rendering loop or physical paper simulation. This keeps the mechanism close to the existing DOM and CSS. Animating clip paths can still require browser painting and should be checked on target devices. We should not claim it is automatically as cheap as a transform-only animation.

prefers-reduced-motion disables starting a turn and cancels an active one if the preference changes. The code catches rejected animation.finished promises after cancellation as expected behavior. The pins and sidebars remain stationary because only the sheet surface participates in the snapshot layers. To change the fold, edit pageTurnMotion.ts. To change capture and lifecycle behavior, edit usePageTurn.ts. To change gradients and layer appearance, edit books.module.css.

## Give each book specific behavior through the registry

registry.ts contains the six BookDefinition objects and helpers shared by their actions. structure loads grades, staff and classes. Class page trees are generated from those records. The Grades and Classes book gives each grade a parent page and each class a child page. A class view switches between Learners and Subjects. The Learners tab renders a register and add/import controls. The Subjects tab lists subjects and teachers and provides stream assignment and curriculum access.

The visible class manager comes from classes.classTeacherId. The teacher beside Mathematics comes from class_subjects.personId. Those labels must remain distinct because they answer different questions. Choosing a class manager does not automatically assign that person to teach every subject. The registry's field definitions and API payloads preserve the distinction.

The Streams book creates school bundles from the shared subject catalogue. It offers My Streams and a System Streams page. System Streams currently has an honest empty state because the backend has no system stream catalogue. Rendering a polished list of invented templates would disguise a missing capability. The book can explain what is available while preserving the design's navigation structure.

The Staff book provides All staff, Teaching assigned, Not assigned, Account active and Setup pending. Assigned-subject and chapter counts come from backend projections, not assumptions based only on the role field. The Learners book can show the school register or a particular class and filter pending account setup. learnerName excludes titles while nameOf retains them for staff. streamLabel uppercases a display name and appends STREAM where absent without rewriting the stored value.

Announcements use declarative fields for title, message and audience. The target select encodes its type and ID together, such as class:11. Before sending, the command verifies that a class target matches a class audience choice. A created or edited record returns a stable announcement page destination. Editing and deleting appear together at the page heading, with the destructive action outlined.

The Curriculum book calculates subjects actually used by streams assigned to classes in each grade. It fetches membership once per distinct assigned stream, indexes subject IDs by stream, then unions them by grade. Sets prevent the same subject from appearing twice because two classes use the same stream. Grades without assigned subjects stay visible with guidance instead of disappearing. This makes the curriculum browser reflect the school's setup.

The class subject Curriculum modal is a separate ClassCurriculum component. It calls the scoped backend endpoint and displays total shared concepts, unique confirmed taught concepts and coverage. Green marks confirmed concepts, and screen-reader text also identifies taught concepts. Nested details elements reveal chapters and topics. The component is read-only: the principal can inspect delivery without accidentally editing the platform curriculum.

## Make small commands consistent and large workflows reviewable

CommandDialog uses the native dialog element and showModal. The browser places it above the page and supplies native modal behavior. A form collects declarative fields into FormData, trims strings, checks required values and calls command.run. A submitting ref guards immediate duplicate events; busy state disables controls and updates the visible button. Failure leaves the dialog open with an error so the user can correct or retry.

Clicking the dialog backdrop closes it when not busy, and Escape uses the dialog cancellation event. A delete command includes confirmation text describing what will be removed. The generic dialog handles text, number, textarea, select and multiselect fields. A stream selection can display a preview of its subjects before committing, so the principal sees the consequences of the choice.

RosterImportModal has both a modal presentation and an inline mode. In the library it is embedded on its own page so the user can inspect and correct a table comfortably. Editable rows have a UI key distinct from their eventual database identity. Removing one row does not shift another row's input identity. useMemo computes validation issues from rows and existing identifiers. An inFlight ref prevents duplicate preview or commit requests.

The preview table has sticky headers and its own overflow region for wide records. Every input has a row-specific accessible label. Invalid rows show messages, not just a red border. The save operation sends only the reviewed fields rather than temporary keys. After commit, saved state prevents sending the same rows again. A later list-refresh failure is reported as a refresh problem, preserving the truth that insertion already succeeded.

BottomSheet supports retained older interfaces with a desktop centered modal and mobile sheet presentation. It locks document scrolling while open and provides a backdrop. It is a custom overlay, so its accessibility responsibilities differ from native dialog. We should review focus movement, focus containment and return when extending it rather than assuming a visual overlay automatically behaves like a complete modal.

FloatingLabelInput and FloatingLabelSelect keep labels visible while conserving space. active is true when the control is focused or has a value. The label moves from the vertical center to the top border and scales to .72. The control adds upper padding so entered text does not collide with the label. A proper label association through htmlFor and id preserves meaning beyond the visual effect. A placeholder alone would disappear when typing and would not provide the same durable label.

## Build a teacher workspace around the next action

RoleDashboard is shared by staff and learners, but it selects different data endpoints and visible tasks. Staff use /staff/me/dashboard, learners use /learners/me/dashboard. It checks stored account information to route the user appropriately, then loads the authoritative response. This browser routing is convenience; the server still checks the signed caller and actual records.

Home shows a greeting, task list, a short selection of subjects or classes, profile details and announcements. A staff member with no allocation sees Awaiting assignment and useful guidance rather than a blank grid. This is a first-class state of the system: registering a person and assigning teaching are separate administrative steps. The interface should make that distinction understandable.

StaffClasses provides a left class-subject selector and a working area. Planning and homework appear as prominent creation cards. Coverage, lesson history and homework history open focused panels in a native dialog. selectedId identifies the allocation, panel identifies the workflow and lessonId identifies the relevant occasion. Keeping those identities explicit prevents a button from accidentally using the previously selected class.

The staff design uses a dark charcoal surface, glass-like depth, muted text and red accents through role-dashboard.module.css. It is visually related to the earlier principal glass system but is a separate module. The center gives large, task-specific targets, while the sidebar makes the current teaching allocation persistent. A teacher should be able to answer both where am I working and what can I do next without inspecting several menus.

PlanLessonForm fetches planning context for its subject allocation. It initially selects up to two remaining concepts as a starting suggestion. The teacher can change them, revisit taught concepts, include flagged concepts, add class-specific concepts and choose the lesson date. Checkbox state is an array of concept IDs. Custom additions collect a name and topic ID. Saving sends a structured payload to the current staff plan endpoint.

ConfirmLessonForm begins with the planned concept IDs selected. Its instruction is concrete: uncheck anything not actually covered. It sends the retained IDs to the confirmation endpoint and displays a success state. If at least one concept remains, it offers Create homework. The backend checks date, assignment and planned membership again. The browser's form state is an expression of the workflow, not permission to bypass its rules.

HomeworkForm selects a confirmed lesson without homework and mounts HomeworkComposer with key={chosen}. Changing the key resets the composer's local state when the lesson changes. That is deliberate because questions and release settings from one lesson should not silently become the draft for another. The composer loads eligible concepts and whether AI generation is configured, then offers manual or AI-assisted drafting.

Each draft question has a temporary random key, concept ID, body, memo, correction note and optional candidate memo. Editing a question clears any candidate that was generated from its previous text. The teacher must keep or discard pending replacements before sending. Generated questions are appended to the draft for review. The send payload includes only publication fields, excluding UI flags and keys.

QuestionMemoEditor supports later editing of saved memoranda in homework history. It copies the current memo into local edit state, saves through the scoped staff endpoint and refreshes the dashboard. Changing the question body is not offered by this component. If that becomes a requirement, it requires a corresponding backend update contract and a decision about already seen learner work.

## Show learners the right work and name the unfinished interactions

The learner dashboard receives subjects derived from the learner's registered class, not a subject picker that changes enrolment. Coming up lists the next planned lesson for each allocation. Waiting for you summarizes feedback or homework tasks. The subject view lists lesson concepts, homework questions and the chapter-topic-concept curriculum. Announcements are filtered to relevant school audiences on the server.

The current learner screen is primarily a reader. Its task buttons select the relevant subject and lesson. It does not yet render complete controls for submitting preview reactions, post-lesson reactions, question completion or release-gated memorandum reveal. Those backend endpoints and database tables explain the intended journey, but their presence should not be confused with a finished end-to-end interface.

To finish post-lesson feedback, first strengthen ownership checks in the backend, expose the lessonConceptId values the form needs, add a component that captures an allowed reaction per target, call the endpoint and refresh task state. The displayed lesson concept id in the dashboard is currently the concept ID, while /lesson-feedback expects the occurrence's lessonConceptId. These are different identities. Sending the displayed ID unchanged would be an easy and consequential integration mistake.

To finish memorandum access, introduce a learner-authorized read that checks the question's class and release policy and returns only eligible memo content. The browser then offers a reveal control and records feedback separately. Hiding a memo with CSS while shipping its text in the response would not enforce release. The current dashboard avoids that leak by omitting learner memo text, but the full retrieval interaction still needs implementation.

## Give the manager an editor that respects identity

dashboard/manager/page.tsx implements the shared curriculum editor. It tracks selected subject and grade, the loaded library, editable chapters, preview worksheets, busy state and dirty state. dirty means local edits differ from the last loaded or saved version. It triggers navigation warnings so changing selection or leaving the page does not silently discard a long editing session.

The editor decorates chapters, topics and concepts with random UI keys. Existing database IDs remain attached too. A new unsaved concept has a key but no database ID. Rename preserves the ID. Replace removes the old ID from the edited position and creates a new unsaved item, which tells the backend to retire the old concept and insert another. This is how a visible editing action becomes a precise data-lifecycle decision.

Move controls adjust array positions. The backend later assigns orderIndex from the submitted order. Combining unsaved chapters merges topic arrays in the corresponding relative order. Upload shows a preview rather than saving immediately. Save sends the library's subject, grade, revision and nested edited content, then replaces local state with the server response. A 409 revision conflict must be resolved by reloading, not by blindly resending stale content.

The manager screen and API are separate from school principal administration. A school principal browsing a class curriculum should not accidentally replace the curriculum for every school. Older curriculum routes mean the boundary is not perfectly uniform yet, but the manager editor makes the intended platform responsibility visible in the interface.

## Make the app installable without inventing offline behavior

public/manifest.json gives the application a name, short name, start URL, standalone display preference, theme colours and icon paths. The root layout references it. next.config.ts wraps the configuration with next-pwa, writes service-worker output to public and disables that plugin during development. A service worker can participate in caching and installation behavior in a supported browser.

This configuration is evidence of a progressive web app intention. It is not evidence of an offline mutation queue, conflict resolution system or complete offline school register. Those would need explicit storage and synchronization code. The installed next-pwa package and the current Next/Turbopack combination also need an actual production build check. We should not infer successful compatibility solely from an installed dependency and a config wrapper.

Geist uses the framework's Google font loader, and the repository's design documentation records that the production build needs access to the font source. A restricted build environment can therefore fail before testing any database operation. Self-hosting a font or adopting system fonts would be a concrete alternative if deterministic offline builds become important. That choice affects packaging and appearance, not the school's data model.

## Follow the frontend redesign through evidence

The frontend history starts with Create Next App, followed by the initial login and PWA setup in August. An October dashboard commit adds role workflows and principal administration. On 20 October 2026, commit e3491f9 introduces the principal book workspace, page turns and book themes. Its diff replaces thousands of lines across separate principal screens with small route redirects and shared book files. That gives us evidence of a structural redesign rather than an invented memory of why every old line was written.

The revised story is straightforward. We first build grade, stream, staff, learner and announcement pages separately because each is a visible administrative requirement. As their layout and interaction patterns converge, maintaining them independently becomes expensive. We introduce BookDefinition and PageView, move behavior into the registry and keep one workspace renderer. Old addresses redirect so a bookmark does not depend on the old layout continuing to exist.

The 21 October commit refines the workspace and learner onboarding. Current uncommitted edits refine contextual actions, remove class photos, add curriculum coverage, retain filtered content during requests and change page turns into the rolling-fold model. The document describes the current files, including these edits, while the history section distinguishes committed evidence from working changes.

The page-turn revision is particularly instructive. The earlier documentation describes a flat rotation with transforms and opacity and a shorter total duration. The current working code extracts fold geometry into pageTurnMotion.ts and animates clipped front and reverse surfaces, curl and shadow within 340 milliseconds. It preserves the original requirements of immediate navigation, reduced-motion support and cancellation. A design refinement can change rendering technique without changing the user's page identity or backend API.

## Learn to locate a change from the visible interface

Suppose the Grades and Classes cover should have a different colour. Start at its BookDefinition in registry.ts and change color. The workspace's derived CSS palette follows. If every book needs different spacing, inspect books.module.css. If only a class's rows need different information, inspect the class branch of the grades view in registry.ts and confirm the backend supplies that field. A route redirect is not the source of the row markup.

Suppose the class register needs a guardian contact field. Begin with what the field means and whether it belongs to a learner, guardian or relationship table. Add schema and migration, update creation and import validation, update response projections and types, add a field to the appropriate command or richer editor, and render it in the register or profile. A visible column is the last link in a cross-layer requirement. It is not an isolated CSS change.

Suppose the next lesson appears on the wrong day. Trace browser datetime formatting, the submitted value, route validation, lessons.date and schoolDate. For a due-time problem, also inspect conversion to ISO and PostgreSQL timestamp behavior. Changing dateLabel can fix a display problem but cannot repair a wrongly stored instant. The data's meaning determines which layer owns the correction.

Suppose coverage is too high. Trace confirmed lessons for the exact classSubjectId, distinct concept IDs, active shared curriculum and the denominator. The principal ClassCurriculum view and teacher dashboard compute related summaries through different services. Verify both paths. Do not fix a data error by capping a progress bar at 100 percent, because that hides the disagreement rather than preserving the intended metric.

Suppose changing Staff filters briefly shows another page's rows. Inspect pageKey, viewKey, cancellation cleanup and revision checks in BookWorkspace. Suppose a fold flickers after rapid navigation. Inspect usePageTurn.clear, the source content key and the removal of cloned animation layers. Knowing the architecture lets a visible symptom point to a small set of candidate files.

## Verify the design and the implementation together

The frontend includes scripts/test-principal-books.cjs, which exercises the book model against an in-memory API and checks selected source contracts. It does not modify school records. Type checking through npx tsc --noEmit finds incompatible props and response assumptions that TypeScript can see. ESLint checks the configured rules. A successful build checks framework integration and packaging, subject to required network assets.

These checks do not replace browser inspection. Verify desktop, tablet and phone layouts, long names, empty registers, unavailable APIs, slow filters, rapid navigation, duplicate submit prevention, keyboard operation and reduced-motion preferences. A screenshot cannot prove authorization. A passing service test cannot prove that a sticky title remains readable at a narrow width. Each verification method answers a different question.

The resulting mental picture should be concrete. The URL identifies the principal's book and page. The registry obtains records and produces a PageView. BookWorkspace interprets that view. CSS supplies the paper, pins, shelf and typography. usePageTurn adds a temporary visual transition. Commands call api.ts, which reaches an Express route. The route validates identity and input, the service enforces the school rule, and PostgreSQL stores the result. After a successful change, a local revision reloads the visible records.

Once that path is familiar, the application becomes editable as a connected system. A file exists because it owns a responsibility, a table exists because a relationship or event needs durable identity, and a design detail exists because the user needs orientation, focus or feedback. The detailed references that follow let you move from this story to every current authored source file and its numbered lines.
