# Follow the principal through NEDECEN

## What you see, what runs, and what gets saved

Written against the working source on **28 October 2026**, after the security hardening pass. This is a source-based walkthrough, not a record of changes to live school data. Names and numeric IDs below are examples. No accounts, classes, streams, or learners were created to write it.

This guide follows the principal's **administration workspace**, from sign-in through every book currently available there. It also explains the switch to teaching and identifies that separate implementation. Manager-only tools, learner actions, old unused components, and framework internals do not all run just because a principal is signed in.

Line references are a snapshot. Adding a comment tomorrow moves later numbers. References include filenames and recognizable code so you can still find them. `nedecen-web/` is the frontend; `Project-Edu-Revo/` is the backend. Clickable links point to your local source. The final source atlas records line counts and fingerprints of the inspected files.

### Reading route

1. [A few ideas that make the code readable](#a-few-ideas-that-make-the-code-readable)
2. [Enter localhost and sign in](#enter-localhost-and-sign-in)
3. [How the library becomes a screen](#how-the-library-becomes-a-screen)
4. [Phone, tablet, and PC](#phone-tablet-and-pc)
5. [The common click, dialog, save, and error journey](#the-common-click-dialog-save-and-error-journey)
6. [Grades & Classes: one complete Grade 9 walkthrough](#grades--classes-one-complete-grade-9-walkthrough)
7. [Streams](#streams)
8. [Staff](#staff)
9. [Learners](#learners)
10. [Curriculum](#curriculum)
11. [Announcements](#announcements)
12. [Remembering, renewal, sign-out, and shared interactions](#remembering-renewal-sign-out-and-shared-interactions)
13. [Where the database enforces the rules](#where-the-database-enforces-the-rules)
14. [Configuration and libraries you encounter while following the principal](#configuration-and-libraries-you-encounter-while-following-the-principal)
15. [Current limitations to keep in your head](#current-limitations-to-keep-in-your-head)
16. [A practical way to follow this in your editor](#a-practical-way-to-follow-this-in-your-editor)
17. [Small helpers and exact screen styling](#small-helpers-and-exact-screen-styling-a-closer-look)
18. [Source atlas and import decoder](#source-atlas-and-import-decoder)

Read a scenario, reproduce it with suitable test data, and open its cited files. You do not need to memorize the source atlas.

## A few ideas that make the code readable

### Two applications, plus the database

For these examples, `http://localhost:3001` serves the Next.js frontend and `http://localhost:3000` serves the Express backend. `localhost` means your own computer. Different ports are different origins. PostgreSQL is a separate program reached by the backend through private `DATABASE_URL` configuration.

Opening a browser address normally asks **Next.js** for a page. A later `fetch('http://localhost:3000/schools/7/grades')` asks **Express** for JSON data. The browser does not run a PostgreSQL query or receive the database password.

The frontend chooses its API address in [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:6), line 6. The backend begins listening in [Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:6), lines 6–19. `dotenv/config` loads environment values; Express's `app.listen` opens the network port. It does not draw the browser UI.

The connection is [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts:7), lines 7–29. `pg` supplies a pool of reusable PostgreSQL connections. Drizzle wraps that pool in a TypeScript query builder. `db.select().from(people).where(eq(people.id,12))` constructs parameterized SQL, sends it through the pool, and resolves to rows. Importing a schema does **not** create tables; migrations set up the actual database.

### What React changes

A component is a function describing screen content. JSX looks like HTML but contains JavaScript expressions. React turns that description into browser elements. `useState` remembers values between renders. Calling a setter asks React to render again; it does not immediately change the database.

For example, `command` initially equals null. Clicking an action calls `setCommand(action)`. The next render includes `{command && <CommandDialog ... />}`. Opening that dialog is not a new browser route. See [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:221), line 221 and [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:358), line 358.

`useEffect` runs work after a committed render; cleanup removes listeners or marks previous requests irrelevant. `useMemo` caches a calculation while dependencies stay the same. `useRef` holds a browser node or flag without itself triggering a render. `await` waits for a Promise in that function, not by freezing the browser.

`onClick={() => navigate(...)}` waits for a click; it does not call navigate during rendering. `map` produces elements for items; `filter` retains matches. `key={item.id}` helps React recognize the same record after updates. TypeScript interfaces help developers and compilation; they do not validate HTTP JSON. Zod checks on the server do that.

### Book, page, subpage, URL

The contract is [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:99), lines 99–111. A book supplies `load(schoolId)` to fetch records, `pages(data)` to build navigation, and `view(context)` to describe the selected content/actions.

A `BookPage` is [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:18), lines 18–25: stable ID, displayed title/number, kind, optional entity, optional children. A subpage is simply a node in `children`. There is no general database table of bookshelf pages.

One class can have database ID **42**, book page ID **class-42**, visible name **Grade 9A**, and displayed page number **2.1**. Number 2.1 may change when a class is inserted earlier; class-42 still identifies the same class. `/dashboard/principal?book=grades&page=class-42&tab=subjects` is one Next route with three query selections. There is no separate `9A/page.tsx` file.

### Our imaginary school

Assume principal person ID **12**, school ID **7**, Grade 9 database ID **18**, class 9A ID **42**, teacher Ms Lerato Mokoena ID **27**, Mathematics subject ID **3**, and its class-subject allocation ID **91**. Substitute the real IDs returned by your database. Grade number 9 is not necessarily database ID 9.

## Enter localhost and sign in

### Before typing

1. Browser requests `/` from Next on port 3001. Root layout [nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:6), lines 6–36 imports globals and motion CSS, loads Geist through `next/font/google`, sets metadata/manifest, and wraps the route in HTML/body. The font loader is part of Next, not a backend school request.
2. Next resolves `/` to [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:13), lines 13–48. `use client` allows interactive browser code. Initial markup can come from Next; hydration connects React handlers. Development rendering/effect setup may repeat, so cleanup matters. Do not imagine components execute exactly once in one rigid order.
3. Initially `checkingSession=true`; the screen says “Opening your workspace…”. An effect calls `restoreSavedSession`. A browser with valid remembered metadata and a refresh cookie may resume without entering details. Here we assume a fresh session.
4. With no resumable session, setting checkingSession false reveals the form. [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:50), lines 50–75 includes the branch and desktop panel. Tailwind's `hidden lg:flex` hides the marketing panel below its large breakpoint. No school records are needed to draw this form.
5. [nedecen-web/src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:7), lines 7–31 reads stored theme or browser preference, puts `data-theme` on HTML, and lets global CSS variables choose colors. The bookshelf later supplies its own light paper theme.

Username/password use controlled inputs: value comes from state, and onChange updates that state. [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:153), lines 153–171 and [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:200), lines 200–218 show this. Focus changes `focusedField`; active labels move/shrink with inline padding/top/transform and 0.15-second transitions. Password masking is a browser input behavior, not hashing.

### Submit a principal's details

Imagine username `principal_demo` and the correct password.

1. `handleSubmit` [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:33), lines 33–46 prevents the normal browser form reload, clears error, sets loading. The button becomes disabled and says Signing in before any response arrives.
2. `login(username,password)` [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:30), lines 30–65 first tries `/auth/people/login`. A principal is a **person account** with role principal. If this fails, it tries learner then manager login. That explains several requests when credentials are wrong.
3. `api.post` delegates to [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:174), lines 174–229. Browser fetch sends JSON to API_BASE, with `credentials:include` for cookies. A fresh login has no bearer token. A legacy token may first be migrated. The exported API methods are [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:218), lines 218–233.
4. Express middleware runs in registration order: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:48), lines 48–78. Proxy configuration, CORS, protective headers, JSON parsing with 1 MB limit, uploads static path (only if matched), logger, IP limiting, then auth routes. A browser preflight OPTIONS request may occur before POST. CORS allows a browser origin to read a response; it is not principal authorization.
5. [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:7), lines 7–20 hashes a scope plus IP/normalized username and atomically increments a PostgreSQL fixed-window counter. Exceeding it returns 429 and Retry-After. Login has IP and username/category limits, configured in app.ts and [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:15), lines 15–21. These counters are shared across backend processes.
6. Auth middleware [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:17), lines 17–21 rejects foreign browser origins. The people login route [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:29), lines 29–43 uses a Zod schema for bounded username/password strings. `safeParse` produces validated data or validation errors.
7. `loginPerson` [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:45), lines 45–56 queries people by username, rejects unclaimed/missing credentials, and uses **bcrypt**'s compare to test the password against a stored hash.
8. `generateAccessToken` [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:25), lines 25–27 uses **jsonwebtoken** to sign person/account/school/role claims with a 15-minute expiry. Node crypto generates a separate 64-byte random refresh credential. [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:33), lines 33–40 hashes it with SHA-256 and inserts the hash with account details and seven-day expiry. Only the hash is saved in PostgreSQL.
9. [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:4), lines 4–16 sets the refresh cookie: HttpOnly, host-only, Path /auth, SameSite Lax by default, Secure in production. The response JSON contains only accessToken. The browser processes Set-Cookie; JavaScript cannot read the HttpOnly credential.
10. Frontend `decodeToken` reads claims for routing, and `rememberAccessToken` keeps accessToken in module memory while removing legacy localStorage token keys: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:17), lines 17–25, [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:25), lines 25–35. Account ID/type/school/role metadata stays in localStorage. Decoding claims is not verifying their signature.
11. The helper returns person; submit calls `getResumePath(accountType,getRole())`. [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:124), lines 124–142 selects principal dashboard, optionally refined to its remembered safe book/page. Next router.push changes route without another password submission.
12. Finally loading clears; the dashboard mounts.

### Wrong password

`bcrypt.compare` returns false, loginPerson throws, and the route returns generic 401 Invalid credentials. [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:121), lines 121–124 turns failed HTTP into an Error. The login helper tries other account categories; when all fail, the form's catch sets “Incorrect username or password. Please try again.” The conditional error box [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:128), lines 128–142 uses error CSS variables for its background/text.

Current limitation: this form catch also uses that message for a rate limit/network failure, although the API can distinguish them. This guide describes the code now, not an improved hypothetical form.

## How the library becomes a screen

### Actual access checks before the covers

Entry [nedecen-web/src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx:6), lines 6–12 nests Suspense → StaffAccessBoundary in administration mode → BookWorkspace. Suspense gives search-parameter reading a loading boundary; it is not permission enforcement. [nedecen-web/src/app/dashboard/principal/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/layout.tsx:5), lines 5–7 returns children without duplicating the shell.

`StaffAccessBoundary` [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:10), lines 10–20:

1. Checks local session/category hints; otherwise replaces route with `/`.
2. GETs `/staff/me/access`. If the in-memory token disappeared on reload, an initial protected 401 can trigger cookie renewal and one retry.
3. [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:9), lines 9–11 runs requireAuth then staffAccess.
4. [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:33), lines 33–57 verifies bearer signature/expiry with HS256, loads the live staff account in the token's school, rejects unavailable accounts, and replaces the token role with the current database role. It sets req.caller.
5. [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:8), lines 8–18 queries person, grants, current active allocations and chapter assignments. Returns isPrincipal, canTeach, capabilities, schoolId. A principal gets all five admin capabilities even without grant rows.
6. Context shares this result with the workspace. Window focus reloads it. Every protected API still checks permissions independently.
7. Errors show Try again/Sign out. A teaching-only person is redirected to teaching; no assignments shows an explanation. Our principal passes and the library renders.

### Six covers are data, not a picture

[nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:94), lines 94–104 defines Grades & Classes, Streams, Staff, Learners, Announcements, Curriculum in that order. Each has color/title/mark/description plus load/pages/view. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:204), lines 204–212 filters them by live access; a principal sees six.

Without `book` in the URL, no selected book load runs. Desktop welcome content and shelf are available. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:350), lines 350–358 maps definitions into buttons; count comes from books.length.

Follow the red cover:

1. [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:100), line 100 supplies #8b413d.
2. Shelf JSX sets `--book-color` on that cover. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:320), line 320 sets `--book-accent` from the open book. These are separate variables: each cover stays its color; actions inherit the open book's color.
3. [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:170), line 170 combines that variable with a spine gradient, flex-column layout, aspect-ratio .72, 100% width, padding, corners and shadows. JavaScript does not paint it pixel by pixel.
4. [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:163), line 163 creates a two-column grid; cover fills its cell. [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:175), line 175 controls Georgia type, wrapping and top margin. Later responsive rules can override it.
5. Selected ID produces aria-pressed=true. [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:172), lines 172–173 draws the outline/label emphasis. Hover lifts it visually; click opens it.

CSS Modules imports such as `styles.cover` become scoped class names at build time. They avoid another component's `.cover` accidentally receiving this styling.

### Open Grades & Classes

1. Cover handler calls `navigate('grades')`, [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:294), lines 294–312. It checks this account's remembered location for the book, constructs query parameters, starts an appropriate turn, pushes history with scroll:false and clears local search.
2. useSearchParams sees the URL. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:214), lines 214–240 separates fetched data, current view, revisions, errors, query and command state. Query parameters do not contain the actual records.
3. Loading effect [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:244), lines 244–246 calls load(7). Grades loader runs structure, streams and people in parallel.
4. [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:47), lines 47–51 GETs sorted grades then concurrently GETs each grade's classes and flattens responses. Parallel requests have no fixed completion order; Promise.all waits for required results.
5. [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:14), lines 14–28 authenticates, checks school/permission, then [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts:14), lines 14–16 queries grades of school 7 in numeric order. Opening the book does not create grades.
6. [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:31), lines 31–45 checks IDs, school, grade ownership and class parent where relevant. [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:90), lines 90–137 joins class manager/learner counts, includes year/streams and returns grouped rows. Stream/people loads are explained later.
7. Data arrives → setLoaded → pages(data). [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:103), lines 103–109 makes Grade 8 page 1, Grade 9 page 2, sorted classes 2.1/2.2, import descendants 2.1.1, etc. These are positional labels.
8. [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:115), lines 115–117 gives parent-before-children reading order. Matching page ID or first fallback becomes active. [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:122), lines 122–129 finds ancestors. Current breadcrumbs use the last two page nodes plus book, rather than necessarily every ancestor.
9. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:253), lines 253–255 calls view with school/data/page/tab/isPrincipal. Grade summaries need no extra request; class views request learners or subjects. Result becomes viewState.
10. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:158), lines 158–190 renders header/actions/sections; [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:39), lines 39–46 recursively renders headings. Footer index/number and shelf selection agree because they share URL-derived state.

### Paper, rings, header and scrolling

[nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:6), line 6 defines paper/ink/line/muted/accent variables, with color-mix variants for soft backgrounds, darker text and filled buttons. CSS color-mix is a browser feature, not a library function.

[nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:24), line 24 defines three desktop columns, max width and auto centering. minmax(0,1fr) lets the middle shrink without long text forcing overflow. Responsive rules override dimensions.

[nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:51), lines 51–57 draws stacked edges using decorative ::before/::after boxes. Paper is a full-height flex column. Toolbar/footer do not shrink; body/viewport bound the middle; [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:71), line 71 is the real vertical scroller.

Two spine spans get gradients/borders/shadows from [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:72), lines 72–73. They have pointer-events:none. [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:79), lines 79–82 keeps the title sticky with top:0, z-index and opaque background. Description is rendered after the sticky header and scrolls; not everything below a title is sticky.

Right-edge actions use flex and margin-left:auto, [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:87), lines 87–89, not spaces. Horizontal lines are CSS borders. They do not indicate database transactions.

## Phone, tablet, and PC

### How the app knows

It does not ask whether the device is an iPad. [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:15), lines 15–22 uses browser matchMedia:

| Mode | Condition | Presentation |
|---|---|---|
| Phone | Width ≤600px, or height ≤500px and width ≤1000px | Edge-to-edge paper, temporary navigation drawers |
| Portrait | Width 601–1200px and portrait orientation, if phone rule did not win | Centered inset paper with rings, floating drawers |
| Desktop | Everything else | Contents, workspace and shelf together |

[nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:53), line 53 subscribes React to media-query changes. Its server snapshot is desktop because the server does not know viewport size. Hydration may briefly start from that snapshot before browser measurement. Resize/rotation updates mode without another login.

[nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:137), lines 137–148 outputs data-library-mode/book-open/drawer. Responsive CSS matches these attributes. The same book data stays in use: these are not separate phone/tablet/desktop applications.

### Phone

Before a book opens, [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:18), lines 18–32 hides workspace/contents and shows shelf as the main screen with Your library. The string is an actual heading in ResponsiveLibrary; no API sends it. LibraryShelfTitle emits desktop/compact labels and CSS chooses which is visible.

After a book opens, the frame becomes a viewport-height flex column, ordinary topbar hides, compact navigation appears. [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:38), lines 38–44 removes binder trim, side borders/shadows/rings. Full-width paper still has an inner reading inset—20px content padding is not an outer page margin.

The compact bar uses 44px / flexible center / 44px grid columns. [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:26), lines 26–28 draws local SVGs. Left path M3 5h18/M3 12h12/M3 19h6 gives long/medium/short bars. Right draws four little books. No external icon service is contacted.

Opening a different book automatically reveals contents using a two-animation-frame effect [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:68), lines 68–83. lastBook prevents repeated opening during ordinary page changes. introBook keeps this introductory menu visible while the first page loads.

Clicking a heading closes the drawer and navigates. Books icon toggles shelf. The dim background and translated fixed panels are [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:48), lines 48–60. They overlay the existing page and leave a visible strip on the far side. They do not create new browser routes. Tapping dim background or Escape dismisses them.

### Portrait tablet and landscape

[nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:82), lines 82–99 keeps desktop paper/rings, centered at min(980px,100% minus 64px) with top/bottom inset. Drawers float with 16px outside space, 18px corners, border/shadow. Left max width 360px, right 400px, both bounded to viewport. They overlay instead of compressing paper. Portrait backdrop is darker than the base backdrop.

Landscape uses desktop unless short-height phone condition wins. [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:101), lines 101–109 retains three columns for narrower desktop-mode windows. A resized laptop can behave like a phone because geometry, not device branding, selects mode.

### Focus, scrolling and action icons

The drawer effect [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:90), lines 90–137 finds real contents/shelf/workspace regions; marks hidden/background parts inert and aria-hidden; assigns dialog semantics; locks body scrolling; moves focus inside; traps Tab/Shift+Tab; handles Escape; restores focus/overflow on cleanup. History/resize dismiss temporary drawers. The inner contents body scrolls while its footer stays available.

[nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:7), lines 7–15 maps recognizable labels to SVG utility symbols. [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:42), lines 42–47 keeps accessible labels/title. [nedecen-web/src/components/shared/mobile-action.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/mobile-action.module.css:1), lines 1–12 hides some text only at phone conditions. Add/upload/confirm/homework retain words; edit/delete/view can be compact symbols. Subjects & teachers opts out of automatic row icons in WorkspacePage. Same handler, different appearance.

## The common click, dialog, save, and error journey

Later scenarios plug specific commands into this machinery. This is part of every scenario, not a separate optional feature.

### From a description to a button

[nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:72), lines 72–83 supplies title actions, tabs, sections, content/import slots. [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:44), lines 44–56 describes navigation, fields, warning, custom component or run(values,formData).

WorkspacePage.contextAction draws header/section buttons. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:141), lines 141–144 calls onNavigate for a pageId, otherwise onCommand/setCommand. React then mounts CommandDialog. A button's location comes from its slot (title, section, row) and CSS, not a coordinate embedded in the backend response.

### Open, fill, save, cancel

1. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:68), lines 68–77 receives command/onClose/onSaved; creates busy/error/selection state and submission ref. Its effect calls native dialog.showModal and locks scroll.
2. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:100), lines 100–110 turns field descriptions into inputs/textarea/selects. name becomes the FormData key; defaultValue initializes uncontrolled fields. Unlike login's controlled inputs, ordinary text fields need not set React state after every keystroke.
3. Header uses command.title or label. Cancel/Close only dismisses. A delete warning has no effect until confirmation submit.
4. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:79), lines 79–96 prevents default, blocks duplicate submission, builds browser FormData, converts string entries to values, trims and checks required fields. Repeated checkbox/select values require formData.getAll; an object alone would lose repeats.
5. Submission ref blocks a rapid second click before busy renders. Controls disable, then run(values,formData) executes the registry's feature function. A custom renderContent such as MoveLearners owns its submit process; generic submit deliberately returns.
6. A successful run may return a new page ID. [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:315), lines 315–318 navigates there and increments revision. Load/view effects run again using real saved records; the modal exits. Awaiting refresh schedules state changes; it does not guarantee all later effect requests finished before dismissal.
7. A thrown error sets modal error text with role=alert, keeps it open and clears busy. The user can correct inputs. A whole-book load error instead uses the workspace retry/error branch.

The common flow does not pretend a row was saved before receiving success. Save causes HTTP work; opening, typing and canceling do not.

### Protected administration request chain

For POST /schools/7/grades/18/classes:

1. Shared api.request attaches memory bearer token, JSON and credentials.
2. app.ts middleware parses/labels the request; mounted routers are checked in order. Nonmatches pass along. Creating a route file without app.use does not expose it.
3. requireAuth verifies signature/expiry and live staff account/role, attaches req.caller.
4. [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:4), lines 4–14 calls staffAccess, checks URL school matches authorized school, chooses GET/read versus write requirements, and permits principal or matching current grant. Context/localStorage cannot grant permission.
5. Feature router validates IDs, parent relationships and Zod input. Services receive numbers/strings from validated parameters/body.
6. Service queries PostgreSQL through Drizzle/pg, checks business rules and writes inside a transaction where appropriate. PostgreSQL constraints/triggers still apply. Exception rolls back a transaction; success commits.
7. Router sends JSON/status (400 bad input, 401 no valid authentication, 403 denied, 404 absent in accessible scope, 409 conflict/stale review, 201 created). Express 5 forwards rejected async handlers. Unexpected failures are not all converted into friendly JSON today.
8. Frontend parses success or throws from parseError. The awaiting command updates state, then React redraws.

Drizzle imports and/eq/inArray/count/sql combine conditions, equality, set membership, aggregates and parameterized SQL. returning gets generated/changed records; for('update') locks rows within a transaction. PostgreSQL pg_advisory_xact_lock coordinates related writes until commit/rollback. It is not the same as disabling a browser button.

### A routing detail that makes the exact order less obvious

Express `router.use` prefix middleware can match a deeper path even when that router has no final handler for it. For `/schools/7/grades/18/classes`, the grades router is mounted earlier than the classes router in app.ts. Its [grades prefix middleware](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:14) first verifies authentication/administration/school and passes through because no grade endpoint finishes that deeper class path. The later [classes prefix middleware](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:31) runs authentication/administration again and checks the parent grade. A class-specific prefix also checks the class when present. The final class method handler currently repeats requireAuth/requireSchoolAdmin once more before its body. Those repeated live account/grant queries are real, even though the common-chain explanation groups them by purpose.

Streams similarly has a guarded prefix plus guards on individual method handlers. By contrast, the staff-access handler responds before the later teaching router's broad /staff prefix is reached. Nonmatching manager/learner/teacher routers do not execute their service bodies for a class request. Once a handler sends the final response without next(), Express does not continue running every router in the app. This is why tracing both app.ts registration order and router.use prefixes matters when counting which code actually ran.

### Custom dropdown journey

[nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:22), lines 22–57 reads option children with React Children/isValidElement; a visible button shows selection. A hidden real select preserves FormData names and required validation.

Opening mounts SelectPanel [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:54), lines 54–90. Layout effect showModal measures the trigger rectangle, constrains panel width/position, and builds an SVG-mask backdrop leaving the trigger lit while darkening the rest. Phone CSS makes a bottom panel. The trigger is not moved or duplicated.

Choosing updates the hidden options, internal state and a dispatched native change event. Existing onChange gets target.value. Single selection closes; multiple selection toggles until Done. More than eight options enables search. [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:98), lines 98–120 handles keyboard arrows, Home/End, Enter/Space, Escape and typeahead. [nedecen-web/src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css:1), lines 1–45 wraps long labels and supplies sizes/motion.

[nedecen-web/src/components/shared/WrappingSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/WrappingSelect.tsx:7), lines 7–18 and [nedecen-web/src/components/shared/FloatingLabelSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/FloatingLabelSelect.tsx:5), lines 5–16 are labelled wrappers around this same chooser. A filter can change the view immediately; a form selection does not save until its action submits.

## Grades & Classes: one complete Grade 9 walkthrough

### Click Grade 9

You opened Grades & Classes as described earlier. Click the Grade 9 contents heading, or its entry in a navigation list.

1. Contents.onClick calls navigate('grades','grade-18'). Browser URL becomes ?book=grades&page=grade-18. Page-turn starts and local search clears.
2. Book identity/revision did not change, so the book loader need not refetch all records. The page selection changes within cached loaded data.
3. Registry view's grade branch [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:112), lines 112–118 filters classes with gradeId 18, sums learnerCount, creates the summary sentence and Classes in this grade section. `figure` uses React createElement to put counts in strong tags. No DOM query looks for a Grade 9 heading to guess its ID.
4. WorkspacePage displays page.title=Grade 9 as h1, summary, count, class rows, and Create a class in Grade 9. Sidebar highlight and footer become page 2. Rows come from pageRows, which gives them pageIds for navigation.
5. findPagePath constructs Grades & Classes / Grade 9 breadcrumb. It is computed from tree ancestry, not parsing the title string.

No generic grade rename/create/delete exists in this UI. Grades 8–12 are provisioned by [Project-Edu-Revo/src/db/migrations/0016_fixed_school_grades.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0016_fixed_school_grades.sql:1), lines 1–31. It inserts missing rows, enforces supported numbers, provisions grades for newly inserted schools, and prevents deleting/renumbering/moving grade rows. [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:31), lines 31–42 returns 405 for grade creation/deletion. Managing a class is different from adding Grade 13.

### Create Grade 9A

Click Create a class in Grade 9. `classCommand(7,data,grade18)` [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:57), lines 57–74 describes Class label, optional Class manager, optional Description. The generic dialog renders them. Enter A, choose person 27, description Junior science group.

On Save:

1. Generic submit trims strings and checks label required.
2. classCommand.run builds name='9'+'A'. It checks loaded classes for the same grade and case-insensitive same name. This is quick client feedback, not sufficient concurrency protection.
3. Converts selected class manager string to number 27 or null; empty description becomes null. POST /schools/7/grades/18/classes receives `{name:'9A',classTeacherId:27,description:'Junior science group'}`.
4. Common auth/administration chain runs. Classes router prefix checks school7/grade18 relationship; Zod create schema checks types/positive optional IDs and description ≤200. [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:67), lines 67–110 verifies school then calls createClass.
5. [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:71), lines 71–85 loads grade18, calls normalizeClassName and ensureUniqueClassName. [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:37), lines 37–50 strips Grade/grade prefix and spaces, uppercases letters, requires letters-only class suffix, and rebuilds 9A. [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:55), lines 55–67 checks the same grade except optional current record.
6. Transaction takes lifecycle advisory lock, inserts classes and gets generated ID42, then calls syncClassSubjects. Without a stream there may be no desired subjects yet; the class can exist before its subjects are configured. Academic year defaults in PostgreSQL. Class manager is not automatically teacher for every subject.
7. Router sends 201 with the created row. Command returns class-42. Generic save calls refresh(class-42), reloads grades/classes/streams/people, rebuilds tree and opens Grade 9A. New tree contains class-42 and import-42, numbered according to sorted position.

Try label 123 or A! instead. Client may allow it as nonempty, but normalizeClassName throws InvalidClassNameError; route sends 400; modal shows the service message and remains open. Try A twice: client duplicate check can reject before HTTP. If another administrator created it after your load, backend duplicate check/unique constraint is the final defense. A rare concurrent raw constraint error is not as consistently friendly as the explicit service error—do not assume all SQL errors have custom text.

### Open the class: Learners versus Subjects

The class branch [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:118), lines 118–142 finds parent grade/manager and builds /schools/7/classes/42. Default tab is learners because tab==='subjects' is false. It GETs learners for that class. The return object supplies Learners/Subjects tabs, edit/delete title actions, class manager description and register actions.

Changing Subjects calls MotionTabs button → onTab → navigate with same book/page and tab=subjects. Registry view reruns and GETs /schools/7/classes/42/subjects instead. It does not reauthenticate with a password. While awaiting a different tab's view, BookWorkspace can retain the old surface but marks it stale/inert; when new view arrives MotionPanel fades the content. It never reuses a previous *different page's* view as the current class.

Learners GET: [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:69), lines 69–83 validates class belongs to school, then [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:34), lines 34–42 returns names/admission/account status, joining only a stream selection matching class/year/revision. Password hashes are absent from the list response.

Subjects GET: [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:17), lines 17–36 scopes the request; [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:63), lines 63–71 joins subject and optional teacher, returns active allocations, ordered by subject name. The registry's row detail resolves personId against loaded people, or says No teacher assigned.

Search, when offered, filters current loaded rows by title/detail/badge in WorkspacePage. Typing is local state and does not query PostgreSQL per letter. Row count reflects the filtered rows. Empty register/no matches have separate text.

### Edit Grade 9A

Edit class runs classCommand with cls present. Input initializes to A, current manager, description; run sends PATCH /schools/7/grades/18/classes/42. [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:160), lines 160–203 parses optional changes and invokes [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:145), lines 145–172. It finds the record, normalizes/uniqueness-checks a changed name excluding itself, then updates in a transaction.

Rename to B: saved ID stays42; new name9B; page remains class-42. Reloaded tree sorts again, so page number may move. Change class manager: only classTeacherId changes, not default subject teachers. Description is an optional string capped at200. Nothing in this dialog moves learners to another class; the stable class record still owns them.

### Manage streams: one stream or a master-class split

On Subjects, Manage streams creates a command with ClassStreamsEditor content. [nedecen-web/src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx:8), lines 8–31 takes schoolId/classId/stream summaries. Its effect GETs current class streams and loads subjects for every candidate stream in parallel. Only after all loads succeed does ready become true and the fieldset enable. Hidden streamEditorReady prevents submitting before that.

Select Science with shared subjects Mathematics/English/Life Orientation/Physical Sciences plus Geography. With one stream, no split configuration is needed. The selected checkboxes contribute repeated streamIds fields. Registry command [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:124), lines 124–136 collects them and any primarySubjectId/building-N/classroom-N values, then PUTs class streams.

Backend [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:20), lines 20–23 validates shape then runs saveClassStreams and syncClassSubjects inside one transaction. [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:23), lines 23–46:

1. Takes lifecycle lock, locks class joined to grade, verifies school.
2. Requires1–10 distinct school streams, rejects foreign/missing/duplicate IDs.
3. Reads old options; replaces class_streams links; keeps streamId as first-link compatibility field.
4. Reads new union/intersection/difference using streamOptions [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:9), lines 9–25. Union is all subject IDs; common is present in every selected stream; different is the remainder.
5. If several streams differ, requires primary subject among different subjects and exactly one nonempty building/classroom pair for each secondary subject. Saves configuration or null, increments streamRevision when stream composition changed.
6. Calls syncClassSubjects [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:19), lines 19–51: desired subject IDs come from the union, old unwanted/year-mismatched allocations become inactive, wanted current allocations remain, missing ones are inserted. Active shared chapters are linked. Older allocation/lesson IDs survive.
7. Commit returns saved:true. Modal refreshes the book; class Subjects now lists derived subjects once each.

Now also select a stream with the same shared subjects plus Agricultural Sciences instead of Geography. UI computes same union/intersection locally, displays shared subjects, asks primary (say Agricultural Sciences), and secondary location for Geography (Building B / Room12). Only those named controls enter the payload. Backend recomputes; it does not trust the client's split calculation.

Missing Room12: browser required validation may block submission; backend configuration checks also reject an incomplete/tampered payload. No half-replaced stream links commit because the exception rolls back the transaction.

Learners stay in class42 after a stream change. Their current subject choices may become stale because revision changed. The learner setup code [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:44), lines 44–60 demands a selection for the current class/year/revision, or waits for missing class configuration. Subject visibility then follows their choice. This is an effect of the principal's action, not a learner being deleted/recreated. Classroom text provides directions, not a timetable scheduler or another class membership.

### Assign a subject teacher

On Mathematics row click Assign teacher. Registry action supplies a personId select; choose27 and Save. PATCH /schools/7/classes/42/subjects/91/teacher receives personId27. [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:50), lines 50–62 validates integer/null and calls assignSubjectTeacher in a transaction.

[Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:76), lines 76–104 locks class/allocation, verifies accessible active allocation and same-school teacher/principal role. It updates default personId; updates chapter links using the previous default or null, preserving explicit chapter overrides. Pending review-concept drafts for chapters now owned by the replacement teacher are merged (unique focus goals, capped5) and handed over. It does not reassign the original authorship of old lessons. Empty selection submits null to unassign the default.

Response includes fresh subjects; generic command then reloads book data so teacher names update. Selecting another school's forged person ID returns SetupError rather than assigning it. The real database trigger also checks teacher-school relationships.

### Inspect the class curriculum

Curriculum action on Mathematics opens a read-only CommandDialog containing ClassCurriculum, not an editor. [nedecen-web/src/components/principal/ClassCurriculum.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassCurriculum.tsx:18), lines 18–36 GETs /schools/7/classes/42/subjects/91/curriculum on mount. It ignores late responses after unmount and exposes a retry attempt on failure.

[Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:36), lines 36–46 calls [Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:17), lines 17–44. Inside a consistent read transaction it derives subject/grade from accessible active current-year allocation (not from client labels), calls getCurriculum, selects distinct confirmed lesson concept IDs, marks shared concepts isTaught and computes counts/percentage rounded to one decimal.

[Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:116), lines 116–127 reads active chapters/topics/noncustom concepts and guidance, ordered by stored curriculum indices. ClassCurriculum renders coverage plus native chapter/topic/concept details elements; click summary changes browser open state, revealing nested lists, prerequisites and learning outcomes. Taught concepts get inline #166534; untaught get #171717. No coverage flag is written when you open a disclosure. A missing curriculum gives an explanatory empty state.

### Add one learner

On Learners click Add learner. [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:78), lines 78–91 supplies firstName/surname/admission/class fields, preselecting42. Enter Neo / Molefe / 00091. Identifier stays text so leading zeros survive. Submit POST /schools/7/learners with classId42.

[Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:45), lines 45–67 authenticates/admin-scopes, verifies school, validates names/admission/class ID, proves class42 belongs to school7, then calls [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:12), lines 12–30. Transaction takes lifecycle and school-roster locks, rechecks target, inserts learner and an open learner_class_history row for the class year. It does not create a password/activated account. Response201 triggers reload; row says Setup pending.

Try admission00091 again: normalized school admission unique index can reject; route translates PostgreSQL23505 to409 with advice to use reviewed class-register update for transfer. It will not silently make a second account. Blank required text is blocked in generic form; backend validates too. Another school's target class is404 in this scope.

### Bulk import: choose, preview, edit, review, commit

Click Bulk import learners, which is navigation to import-42, not immediate upload. Registry returns import descriptor; WorkspacePage mounts inline RosterImportModal [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:188), lines 188–190. Purpose lives in the title-row RosterImportPurpose; fixedClass prevents changing42 on this class-specific page. School-register import instead permits a class choice.

Take a spreadsheet with headings firstName,surname,admissionNumber and rows Neo/Molefe/00091 and Naledi/Selepe/00092.

1. [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:28), lines 28–63 holds file, class, purpose, year, editable rows, impact, existing IDs, busy/error/saved state. Update default uses current year; progression allows current/later year. Selecting a file only saves a browser File object in state.
2. Preview [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:82), lines 82–101 builds FormData with file/mode/year and calls api.upload. Multipart upload intentionally does not manually set Content-Type: the browser supplies a boundary. No accounts are created.
3. [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:16), line 16 uses Multer memory storage: one file, ≤2MB, ≤3 ordinary fields. Middleware auth/admin/school/class checks run before accepting file parsing. Extension must be xlsx/xls/csv. Upload errors produce400.
4. [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:43), lines 43–63 uses SheetJS xlsx.read on the first worksheet, bounds rows/columns, requires exact expected headings once, rejects formula cells, trims plain values and ignores empty rows. It converts admissionNumber to common identifier for later logic. For learners, preview route checks target/mode/year via reviewLearnerRoster with no proposed rows and returns rows/existingIdentifiers:[]; existing learners are allowed to match during a reconciliation update.
5. Frontend sets editable keyed rows. [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:59), lines 59–77 counts normalized duplicate identifiers and missing/oversize fields; Save/Review stays disabled when invalid. Editing a cell or removing a row changes only state and clears any old impact. Desktop renders table; roster CSS turns it into labelled mobile rows.
6. First save for learners [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:102), lines 102–125 calls /review with edited JSON rows, mode and year. [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:65), lines 65–69 validates rows and calls reviewLearnerRoster in a transaction.
7. [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:11), lines 11–37 verifies target/year, loads school learner identities/current classes/history, validates normalized duplicate rows, matches each admission within this school, rejects ambiguous identity or backwards-year movement, computes added/retained/assigned/transfers/removals. It hashes relevant current records plus edited input/target/mode/year with SHA-256 into reviewHash.
8. UI displays that impact: counts, transfer origins, learners losing current class. This is still a preview. A hash is a stale-review consistency check, not an authorization token; normal authentication still runs.
9. Confirm save POSTs /commit with same payload/reviewHash. [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:57), lines 57–66 rejects missing review; [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:35), lines 35–65 takes lifecycle/school locks, recomputes review, rejects changed hash409, locks affected learners, then applies all updates/history in one transaction.
10. Success sets saved count, shows preserved-history message/Done. Parent import callback marks importChanged rather than remounting the form immediately. Leaving the page or browser history later increments book revision, so registers reload without losing the just-saved result panel. This deferred refresh is different from ordinary CommandDialog Save.

**Update example:** Neo already belongs here; Naledi belongs in9B. Update corrects listed names, retains Neo and transfers Naledi into9A; unlisted learners in9A stay. Same identity keeps passwords/account/feedback history. It closes previous membership history, opens the destination membership where necessary, invalidates reused split choices for a new membership.

**Progression example:** choose2027 and upload the complete intended9A roster. Unlisted current9A learners get classId=null and their open history ends; accounts remain. Listed existing learners move/retain as appropriate; new ones are inserted. Advancing class year increments streamRevision and syncClassSubjects creates/activates year-specific allocations while preserving prior-year teaching records. This is spreadsheet-driven progression, not automatic pass/fail inference.

**Wrong input:** duplicate00091 twice flags preview rows; missing surname flags required; a formula rejects file; >2MB rejects upload; a class from another school rejects scope. If another admin moves Naledi after impact review, commit recomputes a different hash →409 → UI clears impact and asks for review again. Direct old upload endpoint returns400 telling clients to preview/confirm; it cannot bypass review.

### Move learners without a spreadsheet

Move learners appears only when register has items. Registry constructs destinations from other classes with same grade/year. It mounts MoveLearners through renderContent, giving school/class/source learners/destinations/onSaved/onClose/setBusy. [nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:9), lines 9–35 initially selects all learners. Choose9B or uncheck individuals; any selection/destination change clears previous review.

Review move → perform(false) → POST /schools/7/classes/42/learner-transfers/review. [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:11), lines 11–25 Zod-validates positive IDs,1–500 learners, permissions. Review is repeatable-read/read-only. [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:10), lines 10–27 verifies different accessible classes, same grade/year, no duplicates, all selected learners still in source. It builds target update rows, reuses reviewLearnerRoster, and hashes source/target/revisions/source roster/selected IDs/roster review.

UI shows how many move/remain. Confirm move → perform(true) sends hash. [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:25), lines 25–32 locks lifecycle/roster, recomputes hash, rejects stale selection, and delegates commitLearnerRoster(update). Accounts/history survive; destination subjects apply; a split requires fresh subject confirmation. Target's unlisted learners stay. onSaved refreshes book and modal closes. Selecting another grade/year is rejected even with a forged request; use progression for that.

### Reset a learner's subject choice

This row action is present in a class with multiple stream IDs. Its command asks confirmation, then DELETEs /schools/7/classes/42/learners/learnerID/stream-selection. [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:28), lines 28–37 scopes learner to this school/class, locks, deletes their selection rows. It does not remove learner/account/lesson feedback. Generic refresh updates register details; next learner use must satisfy current split setup. The button's visibility is based on multiple streams, even if those streams happen to contain identical subjects.

### Delete an unused class

Delete class opens warning; confirmation DELETEs /schools/7/grades/18/classes/42. [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:202), lines 202–235 calls deleteClassById. [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:280), lines 280–311 borrows a pg connection, BEGINs, locks lifecycle, validates exact school/grade/class, calls deleteClassContents, deletes class, COMMITs; errors ROLLBACK and finally releases connection.

[Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:176), lines 176–189 refuses when current learners, membership history or lessons exist. ClassHistoryError becomes409. The later cleanup SQL removes dependent unused setup in foreign-key-safe order; it does not grant permission to delete meaningful teaching history because the guard ran first. Even moving every learner out can leave history that prevents class deletion. For successful deletion, refreshed tree drops class/import pages, recalculates numbering and falls back if the selected page no longer exists.

## Streams

### Open My Streams and System Streams

Click Streams cover. Same navigate → selected book → load → pages → view → render chain runs. Streams registry definition begins [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:160), lines 160–164. It concurrently GETs school streams and public /subjects. [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:28), lines 28–44 authenticates, checks live capability/school, then validates stream and stream-membership ownership for deeper routes. This is why changing streamId in a request cannot reach another school's stream.

School GET [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:82), lines 82–100 checks school and calls [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:21), lines 21–23, which filters streams.schoolId. Public subject catalogue [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:35), lines 35–39 calls getAllSubjects. These are read requests; opening Streams does not create a subject or a stream.

Page tree contains My Streams number1 with stream children1.1/1.2, then System Streams number2. Current stream-child order follows returned data; there is no drag-to-reorder control or explicit stream order column. My Streams view reports counts and rows. System Streams gives an empty explanatory page; no platform templates are loaded today.

### Create one Science stream

In My Streams, Create a stream opens generic CommandDialog. Registry create definition [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:169), lines 169–177 requests name plus subject multiselect. Enter Science and choose Mathematics/English/Life Orientation/Physical Sciences/Geography. No need to create several examples to understand the loop.

1. generic submit collects name and repeated subjects via FormData.
2. command first POSTs /schools/7/streams with name. [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:56), lines 56–80 validates school/nonempty name then [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:13), lines 13–16 inserts stream, gets ID10.
3. command loops chosen subject IDs, POSTing /schools/7/streams/10/subjects once each. These are sequential within the loop, **not one atomic HTTP operation**. [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:146), lines 146–170 validates subjectId; [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:62), lines 62–70 takes lifecycle lock, locks stream, inserts membership, synchronizes affected classes in a transaction.
4. For a new stream there are no assigned classes yet. For an existing assigned stream, syncStreamClasses [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:53), lines 53–57 finds every affected class via primary/link relation, increments revisions and syncs subjects. It is not merely a change to a visual list.
5. After all succeed, return stream-10 → reload data → tree includes child → selected stream page opens. streamLabel [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:138), lines 138–141 uppercases display and adds STREAM when needed; database name remains what was entered.

If the first POST succeeds but a subject POST fails, a stream already exists. The command remembers createdStream and successfully added IDs in its closure, displays a partial-save/retry message, and retries remaining memberships when Save is clicked again in the same dialog. Closing it loses that temporary retry memory; reopen the saved stream to inspect/add missing subjects. This is an important exception to “one Save is one transaction.”

### Add/remove subject, rename/delete stream

Open Science child. Registry fetches GET /schools/7/streams/10/subjects; [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:106), lines 106–119 joins membership IDs to subject names and orders alphabetically. Membership ID differs from subject ID: delete uses the membership row ID.

- **Add subject:** registry filters choices to catalogue subjects not already in this stream. Save POSTs positive subjectId. Membership unique(streamId,subjectId) rejects a duplicate race; stream router's final handler translates23505 to409 “This subject is already in the stream”. Sync runs for all classes using the stream, preserving historical inactive allocations and revising split confirmations.
- **Remove:** row Delete opens warning. Confirm DELETE /streams/10/subjects/membershipID. [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:90), lines 90–101 locks, reads membership, removes it, synchronizes associated classes. It does not delete the global subject record or old lessons.
- **Rename:** title action sends PATCH /streams/10 with name. [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:102), lines 102–127 calls [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:28), lines 28–35. ID10 stays stable; sidebar/title changes after refresh. No automatic alphabetical resort is specified by current stream pages code.
- **Delete stream:** confirmation DELETEs /streams/10. [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:41), lines 41–57 locks stream/lifecycle, finds affected classes, removes this class-stream link, picks a remaining first stream or null as compatibility field, bumps revision, syncs allocations, deletes stream subjects then stream. Existing accounts stay; removed subject allocations become inactive rather than destroying history. After refresh stream page disappears; invalid selected ID falls back.

Backend also has PATCH membership replacement [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:75), lines 75–86, but current bookshelf exposes add/remove, not a direct Replace subject button. Having an endpoint is not the same as a visible principal interaction.

Stream names currently have no unique school-name constraint. You can create two streams with the same visible name. Membership duplication is protected; name duplication is a different rule. A stream edit can also invalidate previously sufficient split location configuration; learners wait for setup until the principal revisits Manage streams. The app does not infer classroom choices on behalf of the principal.

## Staff

### Open/filter/search the register

Staff registry definition [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:192), lines 192–200 loads /schools/7/people and makes Staff register page1, Bulk import staff page2. [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:57), lines 57–66 runs auth/current staff-or-grades read grant and school lookup; [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:27), lines 27–70 selects explicit display fields, current activation, administrative capability list, assigned chapter/subject counts, joins chapter allocations, groups and orders surname. Password hashes are not selected for this listing.

Rows show formatted title/firstName/surname, staff number, assigned chapter count, Account active or Setup pending. Registry tabs are All staff, Teaching assigned, Not assigned, Account active, Setup pending; filterDisplay dropdown instructs WorkspacePage to use AppSelect in the title row.

Choose Account active → custom chooser change → onTab → navigate(...,tab='active') → view filters already-loaded people by accountSetUp. No new people GET is needed just for that view change. Search further filters row title/detail/badge locally, case-insensitively. Removing search restores rows. A change of page resets search through navigate. Empty result says no staff match.

“Teaching assigned” currently checks assignedChapterCount >0, not assignedSubjectCount. A default subject teacher in an allocation with no linked curriculum chapters can therefore appear unassigned by this particular filter even though staffAccess.canTeach is true. Keep this distinction when reading the screen; it is recorded in the limitations section.

### Add Ms Lerato Mokoena

Add staff member uses personCommand with kind staff, giving Title, First name, Surname, Staff number. Enter Ms/Lerato/Mokoena/ST027. Generic dialog run POSTs /schools/7/people. It includes role:'teacher' in the client object, but addPersonSchema only accepts roster fields; Zod's object parsing discards unknown role. The database default role teacher is the effective normal creation rule.

[Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:41), lines 41–52 checks school and schema then [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:12), lines 12–21 inserts roster record and returns it. PostgreSQL defaults accountSetUp=false; username/passwordHash remain unset. Response201 triggers book reload; new row is Setup pending. This does not sign the new staff member in, send an invitation email, or grant administration automatically.

Required generic text trims before request, but these single-add backend schemas are less bounded than reviewed import schemas. Duplicate school/staff number is prevented by a unique constraint; the single-add route does not have the same polished duplicate translation as learner creation. See limitations; do not infer missing protections from a pleasant form.

No Edit staff, Delete staff, Reset password or Make principal button is defined in current Staff PageView. They are not hidden in another tab of this book.

### Bulk import staff

Bulk import staff navigates to import-staff and reuses RosterImportModal(kind='staff'). It does not offer progression purpose or class year. Spreadsheet headings are title,firstName,surname,staffNumber.

1. File selection → preview FormData upload /schools/7/people/import/preview → common permissions/Multer limits.
2. Backend previewRoster [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:88), lines 88–95 starts a transaction, checks school, parses first worksheet, reads existing staff numbers and validates rows. Still no inserted staff.
3. Inline staff preview deliberately filters already-existing identifiers out and reports skipped count [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:90), lines 90–95. It does not edit existing staff names. Remaining rows can be edited/removed; required/title/name/number and duplicate preview checks disable Save when invalid.
4. Save sends edited JSON directly to /commit; staff has no learner-impact reviewHash step. saveRoster [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:100), lines 100–118 revalidates row bounds, locks lifecycle/school imports, checks school and current identifiers, trims and validates again, inserts all remaining people in a transaction. Race duplicates abort entire staff commit, not half save. Import route converts23505 to409 with preview-again message.
5. saved state shows completion; Done leaves to Staff register. Deferred import refresh makes the updated list available. Accounts are roster entries ready to claim, not activated passwords.

Wrong heading staffnumber instead of staffNumber fails exact-heading check; empty Title fails validation; repeated ST027 in preview is invalid unless those existing rows were all skipped. Formula, file size and count rules match learner imports. None of this calls the older bulkAddPeople loop; current reviewed importer uses saveRoster's atomic batch.

### Assign administrative work

Principal row action opens AdministrativeWorkEditor [nedecen-web/src/components/principal/AdministrativeWorkEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/AdministrativeWorkEditor.tsx:1), lines 1–5. ADMIN_WORK contains grades/streams/staff/learners/curriculum labels. Existing capabilities initialize checkbox defaultChecked; names='capabilities' repeat in FormData. Deselecting all is an intentional revocation.

Registry run PUTs /schools/7/people/27/administrative-work with capabilities from getAll. [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:12), lines 12–29:

1. requireAuth establishes current account.
2. staffAccess requires isPrincipal and same school. Delegated staff cannot grant themselves further permissions.
3. Strict Zod object allows only the supported enum, bounded count. It verifies target staff in school and teacher/principal role.
4. Transaction locks target person, removes their old grant rows, deduplicates selection with Set, inserts selected grants if any.
5. Response saved:true causes generic book refresh; later requests by that staff member see current grants. This does not change their role to principal or assign subject teaching.

For an admin-only staff account, filtered administrative books form their library. Someone with teaching and admin can switch via left footer. The principal likewise gets Switch to teaching only when canTeach is true. This means teaching assignment and administrative permission are separate relationships, not one “staff type” string.

## Learners

### School register and per-class pages

Learners definition [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:210), lines 210–219 runs structure(school7), so it loads fixed grades and their classes. It makes School register1, class descendants1.1/etc, Bulk import learners2. Class child order follows data.classes assembled from grade results; unlike Grades & Classes, this builder has no explicit additional per-class sort.

Open School register: registry view picks all data.classes and GETs each class roster concurrently; it decorates rows with className and flattens. Open Grade9A child: it requests only class42. These are the same protected learner list service described earlier, not a separate schoolwide learner table.

Page summary counts enrolled/activated. All learners/Setup pending tabs filter locally after those roster loads; row displays name, className/admission, activation badge. This book does not define searchable:true, but the shared renderer automatically offers search when a section has >5 rows. Search again filters loaded strings, not an endpoint query.

Add learner opens personCommand with all available classes; class page preselects42. Same POST/addLearner/history/duplicate rules apply as in Grades & Classes. Bulk import navigates to the general import page; choose target class, purpose/year, then the same preview→review→commit workflow. No second implementation creates a second account for the same learner merely because you used another book.

Current school register builds from *current class rosters*. A preserved learner with classId=null after progression is not returned by any of those per-class GETs and does not appear here. Import matching still finds that account at school scope and can assign it again. There is no current “unassigned learners” page/action in this book; that is a gap, not evidence the account was deleted.

Direct Move learners and Reset subject choice live on the class Learners tab under Grades & Classes; they are not repeated as actions on this School register PageView. Do not search for UI controls that the registry never supplies.

## Curriculum

### What appears in this book

Click Curriculum. [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:233), lines 233–247 concurrently obtains structure and public subject catalogue, gathers distinct assigned stream IDs across classes, loads each stream's memberships, and returns streamSubjects.

Its pages builder [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:244), lines 244–267 builds two maps: stream→subject IDs, then grade→union of subjects from the streams assigned to its classes. Each grade becomes a main page; only matching catalogue subjects become children. It does not show every platform subject for every grade automatically. With no stream assigned to Grade9 classes, Grade9 has no subject child and explains what setup is missing.

Open Grade9 → view describes subject rows from child pages. Click Mathematics → navigate to curriculum-18-3 (grade database ID18, subject3), whose entity carries gradeNumber9. API is /subjects/3/grades/9/chapters: this endpoint wants **grade number**, not grade record ID18.

1. [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:64), lines 64–72 runs requireAuth plus requireCurriculumReader. That reader [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:16), lines 16–19 obtains live staffAccess, allowing principal or curriculum grant.
2. [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:30), lines 30–35 selects active chapter rows for subject3/grade9 ordered by orderIndex.
3. Registry view runs Promise.all across chapters, GETting /chapters/chapterID/concepts. [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:40), lines 40–45 authenticates/authorizes then calls [Project-Edu-Revo/src/services/conceptService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/conceptService.ts:28), lines 28–33. It joins active topics/chapters, filters active concepts and orders topic order/id, concept order/id.
4. Registry makes one PageView section per chapter, each concept a row title. WorkspacePage renders them, no class-specific taught flag. Empty chapters/subjects have explicit empty text. The main Curriculum bookshelf view is simpler than the class Curriculum modal.

The generic chapter concept reader here does not apply the isCustom=false filter used by getCurriculum. Class-scoped custom concepts are therefore a source-level distinction to investigate when deciding whether this plain catalogue endpoint should show exactly shared concepts; do not assume both readers are identical. The class Curriculum modal's nested guidance uses getCurriculum and excludes custom concepts.

### What the principal cannot edit here

This book has no Add chapter, Edit concept, upload curriculum or guidance editor command. Shared curriculum editing belongs to the platform manager, not the principal. The legacy shared chapter/concept creation endpoints now use requireAppManager. A principal forging POST /subjects/.../chapters or /chapters/.../concepts gets403 rather than gaining authority through the URL.

Principal can read shared prerequisites/outcomes through class Curriculum disclosures. Editing the shared guidance is not a principal interaction today, despite older discussion about making everything editable. The manager editor and saveCurriculum service exist, but are not silently executed when this principal browses.

Class coverage is a *derived read*: only concepts in confirmed lessons for this class's allocation count. Planning a lesson is not confirming it, and reading a chapter does not mark it taught. Advancing year creates a distinct allocation, so previous-year coverage is not treated as the new year's progress.

## Announcements

The principal's Announcements definition calls underDevelopmentBook [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:224), lines 224–227. Factory [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:30), lines 30–42 makes load resolve an empty object, one Still under development page number1, feature description, and a paragraph explaining tools are not ready.

Clicking the cover follows normal navigate/pages/view/render. There is **no announcement database GET/POST** from this book. The explanatory words about publishing to everyone/grade/class/stream describe future intent, not currently exposed functionality. Backend announcement routes/services and older UI components are not evidence those controls run in this book. Their absence from this active registry is why the screen is informational.

## Remembering, renewal, sign-out, and shared interactions

### Previous/Next, breadcrumbs, browser Back

Footer callbacks use flat[index−1]/flat[index+1]; boundaries disable buttons. Parent-before-child flattening means an import page can be the next reading-order page, not merely the next grade. Contents buttons go straight to their stable IDs. Breadcrumb ancestors use navigate; current node is plain text with aria-current=page. Desktop brand Link goes to /dashboard/principal, clearing the book query and showing the welcome/library state.

BookWorkspace's popstate listener and location effect [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:263), lines 263–295 animate browser-history changes, reset page scroller when book/page changed, and refresh deferred imports when leaving. Next's router/useSearchParams drive the actual selected content; the animation is decorative. Invalid/deleted page ID falls back to first available page. The address is not always rewritten to that fallback, so visible page can differ from an obsolete page query until another navigation.

### Resume after closing the browser

ResponsiveLibrary calls [nedecen-web/src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts:8), lines 8–17. It watches pathname/search, saves completed location changes and subscribes pagehide to capture the latest URL. [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:11), lines 11–25 builds storage keys per account ID/school/mode, keeping administration and teaching locations distinct.

[nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:25), lines 25–44 accepts only expected dashboard paths/books and bounded safe parameter characters, rebuilding a local URL. It does not redirect to arbitrary saved text. [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:50), lines 50–66 stores last overall location and per-book location; [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:66), lines 66–76 revalidates when reading.

After reopening app, login page restoreSavedSession [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:142), lines 142–155 checks remembered category/account, accesses memory token if present, refreshes missing/expiring token via cookie, verifies returned claims match stored account, and returns safe resume path. Unsaved form text/file/checkbox edits are not remembered; only navigation is. A session cookie can expire even though page memory remains.

### Expired access token while using a page

Imagine you leave the library open for20 minutes, then open another class.

1. api.request sends old bearer; requireAuth rejects expiry401.
2. shouldRefresh allows one renewal for a non-auth request, [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:130), lines 130–132. refreshAccessToken [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:82), lines 82–122 uses a shared refreshPromise so concurrent401s await one request. It POSTs /auth/refresh with HttpOnly cookie, optionally legacy raw token only during migration.
3. Backend IP limit and trusted Origin run. [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:61), lines 61–79 validates optional legacy input, chooses cookie first, calls service.
4. Backend refreshAccessToken [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:77), lines 77–110 hashes credential, finds matching stored hash, rejects/deletes expired entry, verifies current account still active/claimed and school still matches. Staff role is loaded fresh. It signs new access token; it does not extend stored absolute seven-day expiry or rotate the raw credential.
5. Route sets cookie and returns accessToken. Client checks session generation so a late response cannot overwrite a newer login/sign-out state, stores token in memory and retries original request once. A failed refresh clears local session metadata; original API path still surfaces failure. Not every workspace error automatically redirects to login.

Cookies provide renewal; localStorage account metadata only helps routing. Someone editing role='principal' in developer tools cannot pass live server authorization.

### Navigation tutorial

[nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:9), lines 9–17 chooses account/school-specific local preference key. Its mount effect [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:25), lines 25–41 uses sessionStorage timestamp and localStorage visit count: refresh/switching books within30 minutes does not consume another visit; a new tab or later mount can. First three counted visits prompt unless completed/dismissed. This is a browser visit heuristic, not a server-wide login count or continuous activity tracker.

Show me starts step0; menu opens shelf. Next opens contents if book exists; next shows switching-books explanation; Finish records completion. Maybe later/Skip closes; Don't ask again records dismissed. [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:53), lines 53–68 persists those choices. Manual Navigation help in LibraryContents footer increments helpRequest and starts the tutorial even later. Tutorial highlight rules use data-tutorial-step in responsive CSS. No school data writes occur. TeacherDialog is reused for the prompt despite its name; that does not enter teaching mode.

### Switch to teaching

[nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:37), lines 37–49 puts Navigation help, conditional Switch and Sign out in left footer on all sizes. Switch is shown only with teaching access plus admin/principal access. It router.pushes /dashboard/staff; the staff page uses StaffAccessBoundary teaching mode and TeacherBookWorkspace. Your principal role remains principal in people; no role update endpoint runs. Returning to administration changes route again.

The separate teaching workspace entry is [nedecen-web/src/app/dashboard/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/staff/page.tsx:1), lines 1–11; implementation [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:1), lines 1–169 uses the teacher registry, services and book shell. A principal allocated as a teacher can use that teacher workflow; it is not an extra hidden administrative book. This guide's detailed simulations cover administration, not a duplicate of the full teacher lesson/homework manual.

### Sign out

Footer handler calls logout and router.replace('/'). Desktop topbar also contains a sign-out handler in current JSX. [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:63), lines 63–73 resets remembered overall library landing and calls revokeBrowserSession; it clears account metadata. [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:36), lines 36–44 sends /auth/logout with credentials and keepalive, immediately clears memory/legacy tokens, and clears old CacheStorage entries. Other tabs detect account storage change, clear memory and reload.

Backend [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:80), lines 80–90 applies origin check, reads cookie/legacy token, calls [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:110), lines 110–113 to delete its stored hash, and expires cookie. Replay refresh fails. An already copied access token can still live up to15 minutes, subject to live endpoint checks. Offline sign-out clears this browser but cannot promise server revocation. No account or learner history is deleted.

### Motion: what actually moves

- usePageTurn [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:57), lines 57–130 clones an inert visual snapshot of outgoing paper, preserves displayed field values/scroll, removes duplicate IDs/rings/animation nodes, animates sheet layers and cleans them. The clones are not a second React form and cannot save.
- pageTurnMotion [nedecen-web/src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts:1), lines 1–45 computes fold clipping/curl/shadow keyframes and a staggered schedule from navigation distance; base duration340ms. URL/data work is separate and is not delayed waiting for a turn.
- MotionTabs [nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:13), lines 13–38 measures active button offsets/size using ResizeObserver and writes CSS variables for a sliding indicator. MotionPanel fades/translates arriving content160ms. They don't change the active filter's business rules.
- useModalMotion [nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:19), lines 19–37 keeps dialog mounted for140ms exit, marks it inert while closing, then invokes dismissal. lockModalScroll reference-counts nested locks. CommandDialog/TeacherDialog/BottomSheet integrate that hook.
- [nedecen-web/src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css:1), lines 1–45 provides modal entry180ms, exit140ms, tab/collapse motion and native details interpolation when browser supports it. Reduced-motion media preference disables motion. Curriculum details may snap in a browser lacking the relevant CSS support; semantics still work.

### Retry, stale data and failure boundaries

Book loader/view use cancelled flags to ignore late responses after selection changes. Data is keyed by book/revision; view is keyed by page/tab/attempt. Stale views are inert while new data loads. View Try again increments attempt; full-book retry increments revision. ClassCurriculum has a separate retry counter. Error text is React-rendered, not HTML injected with dangerouslySetInnerHTML.

These guards stop several UI races, but they are not a real-time subscription system. Another administrator's changes do not automatically stream into every open register. Refresh after successful local mutation, focus-based access reload, or reopening a book updates particular data. Server commit validations remain necessary even when a stale screen looked valid.

## Where the database enforces the rules

Think of database definitions as another part of the process, even though PostgreSQL already installed them before this browser click. A constraint executes when a write reaches the database; the schema TypeScript module does not rerun a CREATE TABLE on every Save.

### The main records and how they connect

| Record | What one row means | Why the principal's action needs it |
|---|---|---|
| schools | One school | All school administration is scoped here |
| grades | One fixed grade number in one school | Class parent; Grade9 number and ID are separate |
| classes | A named current-year class | Name, description, manager, year, split revision/configuration |
| people | One school staff account/roster identity | Principal/teacher role, staff number, credentials/status |
| learners | One learner identity in a school | Admission, credentials/status, nullable current class |
| subjects | One global subject name | Shared catalogue, not a teacher allocation |
| streams | One school-specific subject bundle | Principal's named stream |
| stream_subjects | One subject in one stream | Many-to-many membership; own membership ID |
| class_streams | One stream assigned to a class | Multiple-stream master classes |
| class_subjects | One subject allocated to a class in a year | Default teacher, active flag, lesson numbering; history attaches here |
| class_chapters | One chapter linked to an allocation | Default/chapter-specific teacher relationships |
| chapters/topics/concepts | Shared curriculum structure plus scoped custom concept metadata | Curriculum reading and coverage reference these identities |
| curriculum_libraries | Subject/grade library revision | Shared manager edits and consistent reads |
| learner_class_history | One period of class membership | Move/progression closes old and opens new membership |
| learner_stream_selections | Learner's class/year subject confirmation at a revision | Split setup must be reconfirmed when obsolete |
| administrative_work | A person's granted administrative capability | Delegation, separately from teaching assignment |
| lessons/lesson_concepts | A planned/confirmed lesson and its linked concepts | Class coverage and retained teaching history |
| lesson_review_concepts | A pending correction concept/focus | Teacher changes hand over pending work appropriately |
| refresh_tokens | Hash of one renewal credential and absolute expiry | Session renewal/revocation |
| auth_attempt_windows | A hashed throttle key/count/expiry | Shared login/claim/refresh limits |

Read the actual columns in [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:11), lines 11–24, [Project-Edu-Revo/src/db/schema/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/people.ts:8), lines 8–21, [Project-Edu-Revo/src/db/schema/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/learners.ts:9), lines 9–22, [Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts:11), lines 11–22, and [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:1), lines 1–26.

In Drizzle pg-core, pgTable names a table; serial supplies an auto-generated integer ID; integer/text/boolean/timestamp/jsonb describe stored values; notNull rejects missing values; default/defaultNow provide omitted values; references define foreign keys; unique/uniqueIndex/check define constraints. `$type` describes a JSON value to TypeScript and is not itself a runtime JSON validator. Route/service checks and SQL constraints still matter.

Examples of actual enforced rules:

- grades unique(schoolId,number); fixed supported8–12; migration trigger rejects renumber/move/delete.
- classes unique(gradeId,name). Same suffix can exist in different grades because normalized names contain grade number and scope differs.
- people unique(schoolId,staffNumber); separate username uniqueness within people. This is not necessarily the same normalization policy as learner admissions.
- learners original school/admission unique plus migration0027's lower(trim(admissionNumber)) school-unique index. New record00091 and spaced/case-variant equivalents cannot coexist within a school.
- classSubjects unique(classId,subjectId,academicYear). Prior-year rows can survive without colliding with this year's row.
- streamSubjects unique(streamId,subjectId); classStreams unique(classId,streamId).
- learner history has one open row per learner via a partial unique index WHERE ended_at IS NULL. This is why transfers close previous membership before opening the new one.
- learner selections unique(learnerId,classId,academicYear); revision says whether it still matches current class subjects.
- administrativeWork unique(personId,capability) plus a capability CHECK. Unknown capability cannot be granted by inventing a string.

[Project-Edu-Revo/src/db/migrations/0026_school_workflows.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0026_school_workflows.sql:1), lines 1–15 installs year/split/grant/history relations. [Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql:1), lines 1–33 adds the normalized admission index and triggers validating learner-school/class and teacher-school/current-year allocation relationships. A foreign key by itself would prove that class42 exists, **not** that class42 belongs to learner's school; the added trigger covers that relationship.

Migration0027 also adds a confirmed lesson audience snapshot. Future transfers/stream changes should not rewrite who a previously confirmed lesson was for. Legacy snapshots were reconstructed from available data once; exact historical attendance not captured earlier cannot be recovered with certainty. That is a historical limit, not fixed by changing a CSS class or moving a current roster.

[Project-Edu-Revo/src/db/migrations/0028_auth_attempt_limits.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0028_auth_attempt_limits.sql:1), lines 1–2 creates auth attempt windows/index; [Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:12), lines 12–13 cleans expired windows hourly. No passwords or raw IP addresses are stored in those keys. Other schema files are indexed in the atlas.

### A precise input/output example

With source9A=42, destination9B=43, selected learner IDs501/502:

```text
UI checkboxes → [501,502]
MoveLearners.perform(false)
  → POST /schools/7/classes/42/learner-transfers/review
    { targetClassId:43, learnerIds:[501,502] }
route auth → live school capability → Zod IDs
  → reviewLearnerTransfer(tx,7,42,43,[501,502])
    → select classes + source roster
    → reviewLearnerRoster(tx,7,43,convertedRows,'update',2026)
    → hash reviewed state
  ← { reviewHash, count:2, remaining:18, source, target, learners }
UI shows review, no changed accounts
Confirm → same payload + reviewHash
  → commitLearnerTransfer transaction + locks + re-review
    → commitLearnerRoster update
      → learners.class_id changes to43
      → old history ended, new class/year history inserted
      → obsolete destination subject confirmation invalidated
  ← { moved:2, sourceClassId:42, targetClassId:43, remaining:18 }
onSaved → book revision → fresh class/learner reads → rendered new counts
```

Every arrow is a return/call within the previously cited functions. There is no invisible database “move user” magic. Parameters are values passed by the caller; tx is a transaction-bound query object, so the operations participate in one commit/rollback.

## Configuration and libraries you encounter while following the principal

These files support the runtime but are not all executed afresh on every click.

| File or package | Plain-English job | Where you meet it |
|---|---|---|
| Frontend package.json | Lists dependencies and commands: dev starts Next, build compiles, start serves built app | [nedecen-web/package.json](C:/Users/Kgodiso/source/repos/nedecen-web/package.json:1), lines 1–27 |
| Frontend tsconfig.json | TypeScript checking/module setup, JSX mode, alias @/* → src/* | [nedecen-web/tsconfig.json](C:/Users/Kgodiso/source/repos/nedecen-web/tsconfig.json:1), lines 1–34 |
| React / react-dom | Component/state/effect system and browser rendering integration | BookWorkspace, login, imported hooks |
| Next / next/navigation / next/link | File routes, router/query reading, navigation links, root layout | Principal entry and navigate |
| next/font/google | Build-integrated Geist font loading | Root layout |
| Tailwind + PostCSS | Builds utility class rules such as flex, px-6, text-sm | Global CSS import and JSX utility classes |
| CSS Modules | Scoped class names in imported .module.css objects | styles.paper, styles.cover |
| next-pwa | Production service-worker build integration | [nedecen-web/next.config.ts](C:/Users/Kgodiso/source/repos/nedecen-web/next.config.ts:1), lines 1–33 |
| Backend package.json | Express/Drizzle/pg/Zod/bcrypt/JWT/xlsx/Multer dependencies; build/migrate/test scripts | [Project-Edu-Revo/package.json](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/package.json:1), lines 1–71 |
| Express | Ordered middleware, request/response/router/server plumbing | app.ts and routes |
| cors | Allows configured browser frontend origins to read credentialed responses | app.ts |
| dotenv | Loads backend environment configuration | server.ts |
| pg | PostgreSQL driver/pool, direct SQL transaction in deletion | db/index, classService |
| Drizzle ORM | Parameterized typed SQL queries/transactions and table definitions | Services/schema |
| drizzle-kit | Migration generation/application development command | Backend package scripts/config |
| Zod | Runtime request/row validation | Route schemas, roster rows |
| bcrypt | Tests supplied password against stored slow hash; account setup hashes passwords | authService/people onboarding |
| jsonwebtoken | Signs/verifies expiring access tokens | authService/middleware/auth |
| Node crypto | Random refresh tokens; SHA-256 review hashes/token hashes/throttle keys | Auth and reconciliation services |
| Multer | Reads multipart file data with size/count limits | rosterImport router |
| SheetJS xlsx | Reads first spreadsheet worksheet into plain rows | rosterImportService |
| TypeScript, tsx | Type checking and backend TypeScript development/script execution | Build/dev scripts |
| ESLint | Developer checks; not an authorization layer | Frontend lint script |

Browser features such as fetch, URLSearchParams, FormData, matchMedia, localStorage, sessionStorage, requestAnimationFrame, ResizeObserver, HTMLElement.animate, dialog, details and CSS custom properties are **not npm libraries**. You do not import them from Drizzle or React. Node path/crypto are built-in server modules; they are not browser database access tools.

Private .env contents are intentionally not reproduced. Frontend NEXT_PUBLIC_API_URL is public build configuration; backend DATABASE_URL/JWT_SECRET remain private. [Project-Edu-Revo/src/securityConfig.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/securityConfig.ts:1), lines 1–6 requires explicit production FRONTEND_ORIGINS and defaults localhost3001/127.0.0.1:3001 locally. Same-site cookie configuration must match hosting; production needs HTTPS and a strong signing secret. The dedicated security notes contain deployment details.

[nedecen-web/next.config.ts](C:/Users/Kgodiso/source/repos/nedecen-web/next.config.ts:23), lines 23–31 sends nosniff/frame/referrer/permissions headers. PWA setup caches Next build assets at runtime, not authenticated API data; it is disabled during development. It does not implement offline database edits. Auth API responses send no-store. A Content Security Policy with strict nonces has not been implemented by these few headers.

### Old route files: why the active IDE file can mislead you

Opening src/app/dashboard/principal/grades/page.tsx in your editor does not mean it draws the modern Grade9 screen. [nedecen-web/src/app/dashboard/principal/grades/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/page.tsx:1), lines 1–10 is a compatibility redirect to ?book=grades. [nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx:1), lines 1–11 awaits the Next params Promise and redirects to grade-ID. Streams/staff/learners/announcements child route entry files similarly redirect to their book query. Principal/grades/layout passes children through.

GradeRow/ClassRow/GradesSidebar and older standalone feature components may remain in the repository. They are not automatically part of this route because their filenames sound relevant. The active chain imports registry/shared shell plus the custom editors described here. The atlas distinguishes called shared modules from compatibility entries and boundary-only teaching code. Read actual imports/callers before editing an old component expecting this bookshelf to change.

## Current limitations to keep in your head

This guide is descriptive, not a claim that every edge case is solved. No application behavior was changed as part of writing it.

1. **Announcements and System Streams:** informational/empty pages; no principal publishing/templates workflow.
2. **Shared curriculum editing:** principal administration is read-only. Manager has the editor. Main book and class modal use different readers; generic getConceptsByChapter does not explicitly exclude custom concepts as getCurriculum does.
3. **Unassigned learners:** preserved accounts with no current class do not appear in class-built school register. Reconciliation imports can find/reassign them, but there is no dedicated unassigned account page.
4. **Progression:** explicit spreadsheet/year operation, not automatic academic promotion decisions. No pass/fail computation or learner-controlled promotion is implied.
5. **Staff assigned filter:** chapter-count based, so can differ from actual teaching availability where a subject has no chapter links.
6. **Stream creation:** parent plus each membership are multiple requests. Retry memory reduces duplicate work but is not an all-or-nothing whole-stream transaction. Duplicate stream names are allowed.
7. **Stream edits and splits:** membership changes revise classes, but new classroom configuration may require admin correction. Directions are not a scheduling/conflict-detection engine.
8. **No real-time feed:** another admin's work may leave your screen stale. Review hashes protect important commits, but not every edit has an explicit optimistic version check. Ordinary rename is not a merge editor.
9. **Error presentation:** not every database exception has a custom message; structured Zod error objects passed to the shared Error helper may display poorly. Login catch does not distinguish rate limit/outage from incorrect credentials.
10. **Single-add versus imports:** single person/learner route validation is not identical to bounded/trimmed batch validation. Do not assume UI required fields are sufficient API protection.
11. **Session limits:** account claiming identity proof was intentionally left unchanged; refresh cookies reduce token exposure but do not eliminate XSS. Offline logout cannot guarantee server revocation; copied access token can live to15-minute expiry. Production setup still matters.
12. **Historical accuracy:** backfilled lesson audiences cannot recreate information never recorded. History-preserving delete guards intentionally mean some empty classes remain undeletable.
13. **Tutorial/device preferences:** per-browser storage, not a centrally synchronized preference. Browser storage can be cleared/blocked. “First three times” is implemented as a visit heuristic, not a permanent account-wide server counter.
14. **Class manager scope:** the class manager foreign key proves a person exists, but current class create/update service does not explicitly enforce the same-school teacher/principal check used by subject-teacher assignment. UI options are school-scoped; that alone is not equivalent to an API rule.
15. **Semantic progression:** roster review prevents backwards academic-year movement, but does not decide whether a learner passed or whether a particular grade move is academically correct. The reviewed spreadsheet is the administrator’s instruction.
16. **Scope:** principal acting in teaching mode uses the separate teacher workflow. This guide fully traces administration rather than claiming to describe every executable statement in the browser, React, Next, Node, PostgreSQL and installed libraries.

## A practical way to follow this in your editor

Use test school data. In browser developer tools, keep Network open and filter Fetch/XHR. Enter Grade9A and predict whether there will be a request: opening a class yes; typing Search no; opening Edit dialog no save; Save yes; Cancel no save. Read the URL separately from Network API paths. A page query changing is not proof of a database write.

Place a development breakpoint in handleSubmit, loginPerson, BookWorkspace.navigate, the registry command.run, and the corresponding service. Watch values become strings in FormData, numbers in payload, IDs in SQL, and rows back in React. Do not log passwords, tokens or database credentials to learn this.

When the UI is wrong, first locate the PageView/slot or CSS rule. When a save is wrong, start with the command payload and matching route/service. When a relationship must never be invalid, inspect both service validation and actual SQL constraints/migrations. This lets you choose the right file before changing anything.

## Small helpers and exact screen styling: a closer look

### Registry helpers that run before the screen exists

These short functions are easy to overlook because they do not have their own file. They are called while constructing book descriptions, not by the database automatically.

- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:15), lines 15–15: get(path) returns api.get typed as an array of flexible records. It still uses the same HTTP/auth machinery.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:16), lines 16–16: base(schoolId) returns /schools/ID for endpoint strings; it does not select a school record.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:21), lines 21–21: text(name,label,value="",required=true) returns a Field description, not an input element. Generic dialog later renders it.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:22), lines 22–22: select(name,label,items,value="",required=false) returns a select Field; optionsOf maps records to string values/labels.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:23), lines 23–23: remove(label,path,warning) returns a Delete Command with a confirmation string and async run that awaits api.delete(path). No deletion while the helper is constructing that object.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:24), lines 24–24: pageRows(pages) maps navigation nodes to PageRow data with pageId. Clicking such row is navigation, not a write.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:26), lines 26–26: figure(number) calls React createElement("strong",null,number) to emphasize an inline count.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:27), lines 27–27: sentence(...parts) uses a span around strings and generated strong elements, preserving inline text flow.

Name formatting helpers in [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:130), lines 130–132 join nonempty name parts. classLabel adds Grade only if absent. optionsOf turns database IDs into string option values because browser form fields submit strings. Number(...) in a command converts selected ID back before JSON is sent.

### What to open when a visible element looks wrong

CSS is declarative: the browser matches selectors against rendered elements and computes layout/paint. It is misleading to imagine every CSS rule executing like an ordered service call. Cascade/specificity, inheritance, media conditions and later overrides decide the final value. The values below describe the base rules, with phone differences noted. ResponsiveLibrary attribute rules can override the older media rules in books.module.css.

| Visible thing | What determines it | Source rule |
|---|---|---|
| Cover red/green/blue | registry color → cover --book-color → gradient/background; selected workspace uses --book-accent. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:170), lines 170–170 |
| Cover width/height | Parent .books grid makes two cells; width:100% fills a cell, aspect-ratio:.72 determines height from width. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:163), lines 163–163 |
| Book title font | Georgia serif with font size/line height; later viewport rules override font size. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:175), lines 175–175 |
| Page background | Paper CSS variable #fffef9, border #dfe0d5, flex column, height:100%; parent supplies available height. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:54), lines 54–54 |
| Large page title | Base 28px Georgia/1.25, negative letter-spacing; phone override24px. This is a style rule, not an h1 default size. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:81), lines 81–81 |
| Summary and description | 13px, muted #7a8072, line-height1.65 and pre-wrap; phone14px. Values come from PageView.description/guidance. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:99), lines 99–99 |
| Row title/description | Base13px/11px and 5px detail margin; phone title15px, detail12px. Data comes from row.title/detail. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:120), lines 120–120 |
| Count chip | Separate span in sectionHeading, pale background, small padding and rounded corners; number is filtered rows.length. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:111), lines 111–111 |
| Filled action | Border/background inherit accent-solid, light text, padding; outline class overrides background/color. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:93), lines 93–93 |
| Right-side controls | A flex group with margin-left:auto consumes available space; wrapping protects narrow screens. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:87), lines 87–87 |
| Active contents | Stable-ID comparison adds currentHeading; soft accent background/text and a3px ::before stripe. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:43), lines 43–43 |
| Search control | Width/max-width, border/padding; phone min-height44px and font16px for usable entry. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:140), lines 140–140 |
| Modal size | min(520px,viewport minus32px), max-height85dvh, padding28px; phone width minus24px, padding20px and radius16px. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:198), lines 198–198 |
| Modal inputs | 100% width, border, padding and margin-top; different checkbox overrides prevent full-width checkboxes. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:205), lines 205–205 |
| Footer | Nonshrinking flex row below scroll body, min-height60px, border-top; phone navigation hides words and keeps targets. | [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:142), lines 142–142 |

Import-purpose label and box sit in a flex row, gap12px, box width230px; phone box flexes to remaining width: [nedecen-web/src/components/principal/roster-import.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/roster-import.module.css:1), lines 1–3. The purpose control appears beside the title because WorkspacePage puts it in headingControls, rather than above the upload form.

On phone, a preview table becomes cards through [nedecen-web/src/components/principal/roster-import.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/roster-import.module.css:5), lines 5–19: thead hides, tbody becomes a grid, tr displays as a bordered block, td::before prints each data-label, and inputs keep the same state/onChange handlers. This is a presentation transformation, not spreadsheet data being reparsed.

Transfer dialog checkbox/name alignment comes from [nedecen-web/src/components/principal/move-learners.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/move-learners.module.css:6), lines 6–14. Checkbox width18px plus10px gap leaves room for text. Name and admission number share a span with small displayed as block. The list is capped32dvh and scrolls; the action review box uses accent-soft and its phone button fills available width.

### Follow an entire render in your head

With a selected class and Subjects tab, the chain is: URL strings → chosen registry book/page/tab → async PageView → JSX header and section rows → CSS-module class names and inherited custom properties → browser layout and paint. With an edit, add this earlier chain: button → CommandDialog fields → FormData → command payload → API → authentication/permissions → route schema → service transaction → database → JSON → revision/reload. The final render then uses fresh records. Keeping these two chains connected is more helpful than assuming one giant function paints and saves everything.

## Source atlas and import decoder

The following index is generated from the current source, not guessed line numbers. A function range includes its complete declaration/body; the signature shows real parameter names and types. Some file-local callbacks are explained in the scenario and live inside their enclosing function range. Router callbacks and registry definitions are indexed as top-level statements because they are not named exported functions.

Imported names from another local file are links into this same application; package imports are identified below. An import makes a definition available—it does not mean that every exported function in that module runs on the current click. Types disappear from emitted JavaScript. Schemas describe table/query objects; database constraints execute in PostgreSQL after migrations are applied.

### File-by-file execution and declaration index


#### Backend: drizzle.config.ts

[Project-Edu-Revo/drizzle.config.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/drizzle.config.ts:1), lines 1–24. Source fingerprint SHA-256 prefix: `ed1c5b305a7bd078`.

Supporting module referenced by the scenarios; its complete source range is linked above.

Imports at the point you encounter them:

- [Project-Edu-Revo/drizzle.config.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/drizzle.config.ts:6), line 6: `import { defineConfig } from 'drizzle-kit';` — Drizzle migration configuration tooling. Used by migration commands, not by a principal click.

#### Backend: package.json

[Project-Edu-Revo/package.json](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/package.json:1), lines 1–71. Source fingerprint SHA-256 prefix: `0b2e96a8c0a16906`.

Supporting module referenced by the scenarios; its complete source range is linked above.

#### Backend: src/app.ts

[Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:1), lines 1–98. Source fingerprint SHA-256 prefix: `dad53c97e4edc2dc`.

Ordered shared middleware and router registration. Most mounted routes do not match a given request.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:1), line 1: `import { frontendOrigins } from './securityConfig';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:2), line 2: `import { attemptLimit } from './middleware/authRateLimit';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:8), line 8: `import express from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:9), line 9: `import { StreamChoiceError } from './services/classStreamService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:10), line 10: `import cors from 'cors';` — CORS middleware emits allowed-origin/credential response headers for browser requests. It does not authenticate users.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:11), line 11: `import path from 'path';` — Built-in Node path joins filesystem paths for the uploads static directory. A filesystem path is different from a browser book query.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:12), line 12: `import { requestLogger } from './middleware/logger';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:13), line 13: `import healthRouter from './routes/health';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:14), line 14: `import schoolsRouter from './routes/schools';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:15), line 15: `import gradesRouter from './routes/grades';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:16), line 16: `import subjectsRouter from './routes/subjects';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:17), line 17: `import streamsRouter from './routes/streams';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:18), line 18: `import classesRouter from './routes/classes';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:19), line 19: `import peopleRouter from './routes/people';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:20), line 20: `import learnersRouter from './routes/learners';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:21), line 21: `import chaptersRouter from './routes/chapters';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:22), line 22: `import conceptsRouter from './routes/concepts';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:23), line 23: `import lessonsRouter from './routes/lessons';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:24), line 24: `import homeworkRouter from './routes/homework';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:25), line 25: `import learnerFeedbackRouter from './routes/learnerFeedback';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:26), line 26: `import authRouter from './routes/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:27), line 27: `import rosterImportRouter from './routes/rosterImport';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:28), line 28: `import chapterImportRouter from './routes/chapterImport';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:29), line 29: `import announcementsRouter from './routes/announcements';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:31), line 31: `import classSubjectsRouter from './routes/classSubjects';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:33), line 33: `import managerRouter from './routes/manager';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:34), line 34: `import dashboardsRouter from './routes/dashboards';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:35), line 35: `import teacherWorkspaceRouter from './routes/teacherWorkspace';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:37), line 37: `import learnerWorkspaceRouter from './routes/learnerWorkspace';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:39), line 39: `import classStreamsRouter from './routes/classStreams';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:40), line 40: `import staffAccessRouter from './routes/staffAccess';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:41), line 41: `import learnerTransfersRouter from './routes/learnerTransfers';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/db/index.ts

[Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts:1), lines 1–53. Source fingerprint SHA-256 prefix: `9bbd077bece37c38`.

Creates connection pool and Drizzle query wrapper; does not create tables.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts:7), line 7: `import { drizzle } from 'drizzle-orm/node-postgres';` — Drizzle adapter wraps the pg Pool in typed query/transaction methods.
- [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts:10), line 10: `import { Pool } from 'pg';` — pg Pool connects to PostgreSQL and reuses connections. PoolClient is only a TypeScript type for a borrowed connection used by explicit BEGIN/COMMIT/ROLLBACK code.

#### Backend: src/db/migrations/0016_fixed_school_grades.sql

[Project-Edu-Revo/src/db/migrations/0016_fixed_school_grades.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0016_fixed_school_grades.sql:1), lines 1–31. Source fingerprint SHA-256 prefix: `3a4fadac66aa1571`.

SQL installed by migration tooling before runtime. These statements are not rerun on each principal click.

#### Backend: src/db/migrations/0026_school_workflows.sql

[Project-Edu-Revo/src/db/migrations/0026_school_workflows.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0026_school_workflows.sql:1), lines 1–15. Source fingerprint SHA-256 prefix: `ea372d6e75f37ef5`.

SQL installed by migration tooling before runtime. These statements are not rerun on each principal click.

#### Backend: src/db/migrations/0027_lifecycle_integrity.sql

[Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0027_lifecycle_integrity.sql:1), lines 1–33. Source fingerprint SHA-256 prefix: `141fc4e41fdb2dc9`.

SQL installed by migration tooling before runtime. These statements are not rerun on each principal click.

#### Backend: src/db/migrations/0028_auth_attempt_limits.sql

[Project-Edu-Revo/src/db/migrations/0028_auth_attempt_limits.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0028_auth_attempt_limits.sql:1), lines 1–2. Source fingerprint SHA-256 prefix: `da53ce201bba8082`.

SQL installed by migration tooling before runtime. These statements are not rerun on each principal click.

#### Backend: src/db/schema/appManagers.ts

[Project-Edu-Revo/src/db/schema/appManagers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/appManagers.ts:1), lines 1–12. Source fingerprint SHA-256 prefix: `6ef903470d861b05`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/appManagers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/appManagers.ts:5), line 5: `import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.

#### Backend: src/db/schema/authAttemptWindows.ts

[Project-Edu-Revo/src/db/schema/authAttemptWindows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/authAttemptWindows.ts:1), lines 1–4. Source fingerprint SHA-256 prefix: `e30b0138c9c32c88`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/authAttemptWindows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/authAttemptWindows.ts:1), line 1: `import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.

#### Backend: src/db/schema/chapters.ts

[Project-Edu-Revo/src/db/schema/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/chapters.ts:1), lines 1–58. Source fingerprint SHA-256 prefix: `8b34e0701e43b133`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/chapters.ts:5), line 5: `import { pgTable, serial, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/chapters.ts:6), line 6: `import { subjects } from './subjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/classChapters.ts

[Project-Edu-Revo/src/db/schema/classChapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classChapters.ts:1), lines 1–16. Source fingerprint SHA-256 prefix: `d45574b9203ac45d`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/classChapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classChapters.ts:5), line 5: `import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/classChapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classChapters.ts:6), line 6: `import { classSubjects } from './classSubjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/classChapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classChapters.ts:7), line 7: `import { chapters } from './chapters';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/classChapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classChapters.ts:8), line 8: `import { people } from './people';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/classes.ts

[Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:1), lines 1–69. Source fingerprint SHA-256 prefix: `de94312884f8c737`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:5), line 5: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:6), line 6: `import { pgTable, serial, integer, text, timestamp, unique, jsonb } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:7), line 7: `import { grades } from './grades';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:8), line 8: `import { streams } from './streams';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts:9), line 9: `import { people } from './people';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/classSubjects.ts

[Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts:1), lines 1–56. Source fingerprint SHA-256 prefix: `14e24ef3977eb892`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts:5), line 5: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts:6), line 6: `import { pgTable, serial, integer, timestamp, unique, boolean } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts:7), line 7: `import { classes } from './classes';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts:8), line 8: `import { subjects } from './subjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classSubjects.ts:9), line 9: `import { people } from './people';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/concepts.ts

[Project-Edu-Revo/src/db/schema/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/concepts.ts:1), lines 1–67. Source fingerprint SHA-256 prefix: `4502883cc6c6ee7e`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/concepts.ts:6), line 6: `import { pgTable, serial, integer, text, boolean, timestamp, foreignKey, jsonb, check } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/concepts.ts:7), line 7: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/db/schema/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/concepts.ts:8), line 8: `import { chapters } from './chapters';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/concepts.ts:9), line 9: `import { topics } from './topics';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/concepts.ts:10), line 10: `import { classSubjects } from './classSubjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/curriculumLibraries.ts

[Project-Edu-Revo/src/db/schema/curriculumLibraries.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/curriculumLibraries.ts:1), lines 1–13. Source fingerprint SHA-256 prefix: `f961146e04dc01f5`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/curriculumLibraries.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/curriculumLibraries.ts:5), line 5: `import { pgTable, serial, integer, timestamp, unique } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/curriculumLibraries.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/curriculumLibraries.ts:6), line 6: `import { subjects } from './subjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/grades.ts

[Project-Edu-Revo/src/db/schema/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/grades.ts:1), lines 1–48. Source fingerprint SHA-256 prefix: `c65305bf869a1f74`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/grades.ts:5), line 5: `import { pgTable, serial, integer, timestamp, unique, check } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/grades.ts:6), line 6: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/db/schema/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/grades.ts:7), line 7: `import { schools } from './schools';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/index.ts

[Project-Edu-Revo/src/db/schema/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/index.ts:1), lines 1–53. Source fingerprint SHA-256 prefix: `1fbfabcaba839c3b`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

#### Backend: src/db/schema/learners.ts

[Project-Edu-Revo/src/db/schema/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/learners.ts:1), lines 1–51. Source fingerprint SHA-256 prefix: `007b1ada9fede98e`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/learners.ts:5), line 5: `import { pgTable, serial, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/learners.ts:6), line 6: `import { classes } from './classes';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/learners.ts:7), line 7: `import { schools } from './schools';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/lessonConcepts.ts

[Project-Edu-Revo/src/db/schema/lessonConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonConcepts.ts:1), lines 1–51. Source fingerprint SHA-256 prefix: `f2edb9ce33e6fb72`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/lessonConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonConcepts.ts:6), line 6: `import { pgTable, serial, integer, timestamp, unique, jsonb } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/lessonConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonConcepts.ts:7), line 7: `import { lessons } from './lessons';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/lessonConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonConcepts.ts:8), line 8: `import { concepts } from './concepts';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/lessonConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonConcepts.ts:9), line 9: `import type { LessonBriefContent } from '../../services/lessonBrief';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/lessonReviewConcepts.ts

[Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts:1), lines 1–18. Source fingerprint SHA-256 prefix: `71497b821d0f3dd0`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts:5), line 5: `import { pgTable, serial, integer, timestamp, unique, jsonb } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts:6), line 6: `import { classSubjects } from './classSubjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts:7), line 7: `import { people } from './people';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessonReviewConcepts.ts:8), line 8: `import { concepts } from './concepts';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/lessons.ts

[Project-Edu-Revo/src/db/schema/lessons.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessons.ts:1), lines 1–41. Source fingerprint SHA-256 prefix: `607b9795acec588d`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/lessons.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessons.ts:5), line 5: `import { pgTable, serial, integer, text, date, timestamp, unique, jsonb } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/lessons.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessons.ts:6), line 6: `import { chapters } from './chapters';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/lessons.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/lessons.ts:7), line 7: `import { classSubjects } from './classSubjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/people.ts

[Project-Edu-Revo/src/db/schema/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/people.ts:1), lines 1–22. Source fingerprint SHA-256 prefix: `bfa2b7ba71114fb7`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/people.ts:5), line 5: `import { pgTable, serial, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/people.ts:6), line 6: `import { schools } from './schools';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/refreshTokens.ts

[Project-Edu-Revo/src/db/schema/refreshTokens.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/refreshTokens.ts:1), lines 1–15. Source fingerprint SHA-256 prefix: `7960fd26b36424ff`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/refreshTokens.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/refreshTokens.ts:5), line 5: `import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.

#### Backend: src/db/schema/schools.ts

[Project-Edu-Revo/src/db/schema/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schools.ts:1), lines 1–55. Source fingerprint SHA-256 prefix: `4e16599a67d2cf88`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schools.ts:5), line 5: `import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schools.ts:6), line 6: `import { circuits } from './circuits';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/schoolWorkflows.ts

[Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:1), lines 1–26. Source fingerprint SHA-256 prefix: `13ec13cfebc869ce`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:1), line 1: `import { pgTable, serial, integer, text, timestamp, unique, uniqueIndex, check } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:2), line 2: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:3), line 3: `import { classes } from './classes';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:4), line 4: `import { streams } from './streams';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:5), line 5: `import { people } from './people';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:6), line 6: `import { learners } from './learners';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/schoolWorkflows.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/schoolWorkflows.ts:7), line 7: `import { schools } from './schools';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/streams.ts

[Project-Edu-Revo/src/db/schema/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streams.ts:1), lines 1–33. Source fingerprint SHA-256 prefix: `f26321ed1e150974`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streams.ts:5), line 5: `import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streams.ts:6), line 6: `import { schools } from './schools';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/streamSubjects.ts

[Project-Edu-Revo/src/db/schema/streamSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streamSubjects.ts:1), lines 1–32. Source fingerprint SHA-256 prefix: `c71f22b44963f849`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/streamSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streamSubjects.ts:5), line 5: `import { pgTable, serial, integer, timestamp, unique } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/streamSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streamSubjects.ts:6), line 6: `import { streams } from './streams';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.
- [Project-Edu-Revo/src/db/schema/streamSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/streamSubjects.ts:7), line 7: `import { subjects } from './subjects';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/db/schema/subjects.ts

[Project-Edu-Revo/src/db/schema/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/subjects.ts:1), lines 1–24. Source fingerprint SHA-256 prefix: `a005c1e03ee06f7b`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/subjects.ts:5), line 5: `import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/subjects.ts:7), line 7: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.

#### Backend: src/db/schema/topics.ts

[Project-Edu-Revo/src/db/schema/topics.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/topics.ts:1), lines 1–14. Source fingerprint SHA-256 prefix: `05f15804a385023e`.

Database/query schema definitions. References/constraints/defaults describe real relationships after migrations; exported table objects are used by Drizzle queries.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/db/schema/topics.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/topics.ts:5), line 5: `import { pgTable, serial, integer, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core';` — Drizzle PostgreSQL schema builders describe tables, columns, defaults, keys, indexes and checks. They are query/schema definitions; importing them does not apply migrations.
- [Project-Edu-Revo/src/db/schema/topics.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/topics.ts:6), line 6: `import { chapters } from './chapters';` — Local table/schema dependency: references link this table to those table identities. A type-only import is erased; table objects help build queries/foreign keys.

#### Backend: src/middleware/appManager.ts

[Project-Edu-Revo/src/middleware/appManager.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/appManager.ts:1), lines 1–13. Source fingerprint SHA-256 prefix: `efe6a63faee454a1`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **requireAppManager** — [Project-Edu-Revo/src/middleware/appManager.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/appManager.ts:6), lines 6–13. Shared catalogue writes belong to enabled platform managers, never school principals.
  - Signature: `export async function requireAppManager(req: Request, res: Response, next: NextFunction)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/middleware/appManager.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/appManager.ts:1), line 1: `import type { Request, Response, NextFunction } from 'express';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/middleware/appManager.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/appManager.ts:2), line 2: `import { and, eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/middleware/appManager.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/appManager.ts:3), line 3: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/middleware/appManager.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/appManager.ts:4), line 4: `import { appManagers } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/middleware/auth.ts

[Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:1), lines 1–109. Source fingerprint SHA-256 prefix: `fd904e5f050d8eb4`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **requireAuth** — [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:33), lines 33–52. Express req/res/next → verifies bearer/live staff, attaches caller, then next; returns error response on failure.
  - Signature: `export async function requireAuth(req: Request, res: Response, next: NextFunction)`.

- **requirePerson** — [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:58), lines 58–63. Allow staff account types through; finer role and record ownership checks still belong in the following middleware/service.
  - Signature: `export function requirePerson(req: Request, res: Response, next: NextFunction)`.

- **requireLearner** — [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:69), lines 69–74. Require a learner token. The service must still check which class/lesson this learner may access.
  - Signature: `export function requireLearner(req: Request, res: Response, next: NextFunction)`.

- **requireDeveloper** — [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:79), lines 79–84. Limit this endpoint to a person account with the developer role.
  - Signature: `export function requireDeveloper(req: Request, res: Response, next: NextFunction)`.

- **requirePrincipal** — [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:90), lines 90–95. Require a principal role before a principal-only handler runs. School ownership is a separate check.
  - Signature: `export function requirePrincipal(req: Request, res: Response, next: NextFunction)`.

- **requireTeacher** — [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:101), lines 101–109. Allow teaching staff roles, including principals where supported. The teacher service then checks the actual allocation owner.
  - Signature: `export function requireTeacher(req: Request, res: Response, next: NextFunction)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:1), line 1: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:2), line 2: `import { people } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:3), line 3: `import { and, eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:9), line 9: `import { Request, Response, NextFunction } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:10), line 10: `import jwt from 'jsonwebtoken';` — jsonwebtoken signs access tokens in authService and verifies allowed signatures/expiry in requireAuth.

#### Backend: src/middleware/authCookie.ts

[Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:1), lines 1–21. Source fingerprint SHA-256 prefix: `e966b96da6cb0fe7`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **options** — [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:4), lines 4–8. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function options(): CookieOptions`.

- **readRefreshCookie** — [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:9), lines 9–13. Request → decoded named refresh cookie string|null.
  - Signature: `export function readRefreshCookie(req: Request)`.

- **writeRefreshCookie** — [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:14), line 14. Response + raw token → adds configured HttpOnly Set-Cookie header.
  - Signature: `export function writeRefreshCookie(res: Response, token: string)`.

- **clearRefreshCookie** — [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:15), line 15. Response → expiry header with same cookie scope.
  - Signature: `export function clearRefreshCookie(res: Response)`.

- **trustedAuthOrigin** — [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:17), lines 17–21. req/res/next → rejects untrusted Origin or cookie-auth request without Origin, otherwise next.
  - Signature: `export function trustedAuthOrigin(req: Request,res: Response,next:NextFunction)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:1), line 1: `import type { Request, Response, NextFunction, CookieOptions } from 'express';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:2), line 2: `import { frontendOrigins } from '../securityConfig';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/middleware/authRateLimit.ts

[Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:1), lines 1–20. Source fingerprint SHA-256 prefix: `67d2bfaaaaafeefb`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **attemptLimit** — [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:7), lines 7–20. scope/limit/window seconds/optional identity function → Express middleware backed by atomic database upsert; next or429.
  - Signature: `export function attemptLimit(scope: string, limit: number, seconds: number, identity?: (req:Request)=>string)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:1), line 1: `import { createHash } from 'node:crypto';` — Built-in Node cryptography; createHash SHA-256 turns reviewed state or throttle identities into deterministic digests. It is not password hashing or encryption.
- [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:2), line 2: `import type { Request, Response, NextFunction } from 'express';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:3), line 3: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:4), line 4: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/middleware/logger.ts

[Project-Edu-Revo/src/middleware/logger.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/logger.ts:1), lines 1–28. Source fingerprint SHA-256 prefix: `0c5c5481a809d105`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **requestLogger** — [Project-Edu-Revo/src/middleware/logger.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/logger.ts:11), lines 11–14. req/res/next → logs method/path, then next. It is not a durable principal audit log.
  - Signature: `export function requestLogger(req: Request, res: Response, next: NextFunction)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/middleware/logger.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/logger.ts:5), line 5: `import { Request, Response, NextFunction } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.

#### Backend: src/middleware/schoolAdministration.ts

[Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:1), lines 1–19. Source fingerprint SHA-256 prefix: `c587b2efaef2e5d3`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **requireSchoolAdministration** — [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:4), lines 4–14. Write capabilities and optional read capabilities → async middleware; school-scoped live access checked on each call.
  - Signature: `export function requireSchoolAdministration(write: Capability[], read = write)`.

- **requireCurriculumReader** — [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:16), lines 16–19. req/res/next → live principal/curriculum grant gate for catalogue paths without schoolId.
  - Signature: `export async function requireCurriculumReader(req: Request, res: Response, next: NextFunction)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:1), line 1: `import type { Request, Response, NextFunction } from 'express';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts:2), line 2: `import { staffAccess, AccessError, type Capability } from '../services/staffAccessService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/auth.ts

[Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:1), lines 1–99. Source fingerprint SHA-256 prefix: `4922d9a40b332434`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.use('/auth')` — [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:14), line 14. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/auth/people/login')` — [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:29), lines 29–40. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/auth/learners/login')` — [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:45), lines 45–56. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/auth/refresh')` — [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:61), lines 61–75. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/auth/logout')` — [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:80), lines 80–88. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/auth/managers/login')` — [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:93), lines 93–98. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:1), line 1: `import { writeRefreshCookie, clearRefreshCookie, readRefreshCookie, trustedAuthOrigin } from '../middleware/authCookie';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:2), line 2: `import { attemptLimit } from '../middleware/authRateLimit';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:9), line 9: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:10), line 10: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:11), line 11: `import { loginPerson, loginLearner, loginManager, refreshAccessToken, logout } from '../services/authService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/chapters.ts

[Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:1), lines 1–115. Source fingerprint SHA-256 prefix: `6d995513099b222c`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.use('/class-subjects/:classSubjectId/chapters')` — [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:25), lines 25–29. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/subjects/:subjectId/grades/:gradeNumber/chapters')` — [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:49), lines 49–58. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/subjects/:subjectId/grades/:gradeNumber/chapters')` — [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:64), lines 64–70. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/class-subjects/:classSubjectId/chapters/assign')` — [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:77), lines 77–85. Registers this handler; the HTTP request must match for its body to run.
- `router.patch('/class-subjects/:classSubjectId/chapters/:chapterId/person')` — [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:92), lines 92–102. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/class-subjects/:classSubjectId/chapters')` — [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:108), lines 108–112. Registers this handler; the HTTP request must match for its body to run.
- `router.use((error: unknown, _req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => { if (error instanceof SetupError) return void res.status(error.status).json({ error: error.message }); next(error); })` — [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:114), line 114. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:1), line 1: `import { requireAppManager } from '../middleware/appManager';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:2), line 2: `import { SetupError } from '../services/classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:3), line 3: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:4), line 4: `import { classSubjects, classes, grades } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:5), line 5: `import { and, eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:11), line 11: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:12), line 12: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:13), lines 13–19: `import { createChapter, getChaptersBySubjectGrade, assignChapterToClass, assignPersonToClassChapter, getClassChapters, } from '../services/chapterService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:20), line 20: `import { requireAuth, requirePrincipal } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/chapters.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/chapters.ts:21), line 21: `import { requireCurriculumReader } from '../middleware/schoolAdministration';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/classes.ts

[Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:1), lines 1–235. Source fingerprint SHA-256 prefix: `c0483a2c9323d014`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.use('/schools/:schoolId/grades/:gradeId/classes')` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:31), lines 31–38. Registers this handler; the HTTP request must match for its body to run.
- `router.use('/schools/:schoolId/grades/:gradeId/classes/:classId')` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:39), lines 39–44. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/schools/:schoolId/grades/:gradeId/classes')` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:67), lines 67–102. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/grades/:gradeId/classes')` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:107), lines 107–124. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/schools/:schoolId/grades/:gradeId/classes/:classId/stream')` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:130), lines 130–154. Registers this handler; the HTTP request must match for its body to run.
- `router.patch('/schools/:schoolId/grades/:gradeId/classes/:classId')` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:160), lines 160–196. Registers this handler; the HTTP request must match for its body to run.
- `router.delete('/schools/:schoolId/grades/:gradeId/classes/:classId')` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:202), lines 202–229. Registers this handler; the HTTP request must match for its body to run.
- `router.use((err: unknown, _req: Request, res: Response, next: import('express').NextFunction) => {
  if (err instanceof SetupError) return res.status(err.status).json({ error: err.message });
  next(err);
})` — [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:231), lines 231–234. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:1), line 1: `import { ClassHistoryError } from '../services/classService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:8), line 8: `import { Router, Request, Response } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:9), line 9: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:10), lines 10–19: `import { createClass, getClassesByGrade, assignStreamToClass, deleteClassById, updateClass, ClassNotFoundError, DuplicateClassNameError, InvalidClassNameError, } from '../services/classService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:20), line 20: `import { getSchoolById } from '../services/schoolService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:21), line 21: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:23), line 23: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:24), line 24: `import { grades, classes } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:25), line 25: `import { and, eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:26), line 26: `import { SetupError } from '../services/classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts:28), line 28: `import { requireSchoolAdministration } from "../middleware/schoolAdministration";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/classStreams.ts

[Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:1), lines 1–51. Source fingerprint SHA-256 prefix: `b5f70ba9805ca176`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.get('/schools/:schoolId/classes/:classId/streams')` — [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:12), lines 12–19. Registers this handler; the HTTP request must match for its body to run.
- `router.put('/schools/:schoolId/classes/:classId/streams')` — [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:20), lines 20–23. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/learners/me/learning-setup')` — [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:24), lines 24–26. Registers this handler; the HTTP request must match for its body to run.
- `router.delete('/schools/:schoolId/classes/:classId/learners/:learnerId/stream-selection')` — [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:28), lines 28–36. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/learners/me/learning-setup')` — [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:37), lines 37–50. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:1), line 1: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:2), line 2: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:3), line 3: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:4), line 4: `import { and, eq, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:5), line 5: `import { classes, grades, learners, learnerStreamSelections } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:6), line 6: `import { requireAuth, requireLearner } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:7), line 7: `import { requireSchoolAdministration } from '../middleware/schoolAdministration';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:8), line 8: `import { saveClassStreams, streamOptions, learnerLearningSetup, StreamChoiceError } from '../services/classStreamService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classStreams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classStreams.ts:9), line 9: `import { syncClassSubjects } from '../services/classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/classSubjects.ts

[Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:1), lines 1–62. Source fingerprint SHA-256 prefix: `314b34a80b8cd073`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.use('/schools/:schoolId/classes/:classId/subjects')` — [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:17), lines 17–25. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/classes/:classId/subjects')` — [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:29), lines 29–31. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/classes/:classId/subjects/:classSubjectId/curriculum')` — [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:36), lines 36–45. Registers this handler; the HTTP request must match for its body to run.
- `router.patch('/schools/:schoolId/classes/:classId/subjects/:classSubjectId/teacher')` — [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:50), lines 50–61. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:6), line 6: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:7), line 7: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:8), line 8: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:9), line 9: `import { classes, grades } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:10), line 10: `import { eq, and } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:11), line 11: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:12), line 12: `import { getClassSubjects, assignSubjectTeacher, SetupError } from '../services/classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:13), line 13: `import { getClassCurriculum } from '../services/classCurriculumService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/classSubjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classSubjects.ts:14), line 14: `import { requireSchoolAdministration } from "../middleware/schoolAdministration";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/concepts.ts

[Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:1), lines 1–46. Source fingerprint SHA-256 prefix: `0de63ea0254f4a8b`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.post('/chapters/:chapterId/concepts')` — [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:26), lines 26–34. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/chapters/:chapterId/concepts')` — [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:40), lines 40–44. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:1), line 1: `import { requireAppManager } from '../middleware/appManager';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:8), line 8: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:9), line 9: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:10), line 10: `import { createConcept, getConceptsByChapter } from '../services/conceptService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:11), line 11: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/concepts.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/concepts.ts:12), line 12: `import { requireCurriculumReader } from '../middleware/schoolAdministration';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/grades.ts

[Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:1), lines 1–42. Source fingerprint SHA-256 prefix: `8237b0c01d29f53a`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.use('/schools/:schoolId/grades')` — [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:14), lines 14–19. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/grades')` — [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:23), lines 23–27. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/schools/:schoolId/grades')` — [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:31), lines 31–34. Registers this handler; the HTTP request must match for its body to run.
- `router.delete('/schools/:schoolId/grades/:gradeId')` — [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:38), lines 38–41. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:6), line 6: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:7), line 7: `import { getGradesBySchool } from '../services/gradeService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:8), line 8: `import { getSchoolById } from '../services/schoolService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:9), line 9: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts:11), line 11: `import { requireSchoolAdministration } from "../middleware/schoolAdministration";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/learners.ts

[Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:1), lines 1–124. Source fingerprint SHA-256 prefix: `6b8c3395eb865b4d`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.post('/schools/:schoolId/learners')` — [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:45), lines 45–63. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/classes/:classId/learners')` — [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:69), lines 69–80. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/learners/onboarding/lookup')` — [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:86), lines 86–102. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/learners/onboarding')` — [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:108), lines 108–122. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:7), line 7: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:8), line 8: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:9), line 9: `import { getSchoolById } from '../services/schoolService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:10), lines 10–15: `import { addLearner, getLearnersByClass, findLearnerForOnboarding, completeLearnerOnboarding, } from '../services/learnerService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:16), line 16: `import bcrypt from 'bcrypt';` — bcrypt compares passwords with slow hashes (login) or produces hashes (claiming). It is different from SHA-256 hashing a random refresh credential.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:17), line 17: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:18), line 18: `import { classes, grades } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:19), line 19: `import { and,eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:20), line 20: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts:22), line 22: `import { requireSchoolAdministration } from "../middleware/schoolAdministration";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/learnerTransfers.ts

[Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:1), lines 1–25. Source fingerprint SHA-256 prefix: `13dfd823050a5cf8`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:1), line 1: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:2), line 2: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:3), line 3: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:4), line 4: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:5), line 5: `import { requireSchoolAdministration } from '../middleware/schoolAdministration';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:6), line 6: `import { reviewLearnerTransfer, commitLearnerTransfer } from '../services/learnerTransferService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/learnerTransfers.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learnerTransfers.ts:7), line 7: `import { RosterImportError } from '../services/rosterImportService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/people.ts

[Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:1), lines 1–108. Source fingerprint SHA-256 prefix: `bd0f713629482b5c`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.post('/schools/:schoolId/people')` — [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:41), lines 41–51. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/people')` — [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:57), lines 57–64. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/people/onboarding/lookup')` — [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:70), lines 70–86. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/people/onboarding')` — [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:92), lines 92–106. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:6), line 6: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:7), line 7: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:8), line 8: `import { getSchoolById } from '../services/schoolService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:9), lines 9–14: `import { addPerson, getPeopleBySchool, findPersonForOnboarding, completePeopleOnboarding, } from '../services/peopleService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:15), line 15: `import bcrypt from 'bcrypt';` — bcrypt compares passwords with slow hashes (login) or produces hashes (claiming). It is different from SHA-256 hashing a random refresh credential.
- [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:16), line 16: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts:18), line 18: `import { requireSchoolAdministration } from "../middleware/schoolAdministration";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/rosterImport.ts

[Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:1), lines 1–75. Source fingerprint SHA-256 prefix: `821f59dc7a1564b4`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

- **authorise** — [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:21), lines 21–27. Verify principal access to the school named in the import request before parsing or writing roster data.
  - Signature: `function authorise(req: Request, res: Response, next: NextFunction)`.

- **handleError** — [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:32), lines 32–37. Return expected import/validation failures as useful client messages and forward unexpected errors.
  - Signature: `function handleError(error: unknown, res: Response)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:7), line 7: `import { Router, Request, Response, NextFunction } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:8), line 8: `import multer from 'multer';` — Multer parses multipart file upload into memory under explicit size/count limits, after authorization middleware.
- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:9), line 9: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:10), line 10: `import { previewRoster, saveRoster, RosterImportError, RosterKind, rosterRowsSchema } from '../services/rosterImportService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:11), line 11: `import { requireSchoolAdministration } from '../middleware/schoolAdministration';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:12), line 12: `import { reviewLearnerRoster,commitLearnerRoster,rosterImpact,type LearnerImportMode } from '../services/learnerRosterService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:13), line 13: `import { parseRosterWorkbook } from '../services/rosterImportService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/rosterImport.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/rosterImport.ts:14), line 14: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/schools.ts

[Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:1), lines 1–135. Source fingerprint SHA-256 prefix: `22cb6a1d81f456a0`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

- **publicSchool** — [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:18), lines 18–21. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function publicSchool(school: NonNullable<Awaited<ReturnType<typeof getSchoolById>>>)`.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.post('/schools/seed')` — [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:38), lines 38–47. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/schools/activate')` — [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:52), lines 52–66. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools')` — [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:71), lines 71–74. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:id')` — [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:79), lines 79–93. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:1), line 1: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:2), line 2: `import { requireAppManager } from '../middleware/appManager';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:8), line 8: `import { Router, Request, Response } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:9), line 9: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/schools.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/schools.ts:10), lines 10–15: `import { seedSchool, getAllSchools, getSchoolById, activateSchool, } from '../services/schoolService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/staffAccess.ts

[Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:1), lines 1–29. Source fingerprint SHA-256 prefix: `ff93303a639d6329`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.get('/staff/me/access')` — [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:9), lines 9–11. Registers this handler; the HTTP request must match for its body to run.
- `router.put('/schools/:schoolId/people/:personId/administrative-work')` — [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:12), lines 12–28. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:1), line 1: `import { Router } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:2), line 2: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:3), line 3: `import { and, eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:4), line 4: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:5), line 5: `import { people, administrativeWork } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:6), line 6: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:7), line 7: `import { CAPABILITIES, staffAccess, AccessError } from '../services/staffAccessService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/streams.ts

[Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:1), lines 1–233. Source fingerprint SHA-256 prefix: `2f547777f15a9553`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.use('/schools/:schoolId/streams')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:28), lines 28–31. Registers this handler; the HTTP request must match for its body to run.
- `router.use('/schools/:schoolId/streams/:streamId')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:32), lines 32–37. Registers this handler; the HTTP request must match for its body to run.
- `router.use('/schools/:schoolId/streams/:streamId/subjects/:streamSubjectId')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:38), lines 38–43. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/schools/:schoolId/streams')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:56), lines 56–77. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/streams')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:82), lines 82–97. Registers this handler; the HTTP request must match for its body to run.
- `router.patch('/schools/:schoolId/streams/:streamId')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:102), lines 102–124. Registers this handler; the HTTP request must match for its body to run.
- `router.delete('/schools/:schoolId/streams/:streamId')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:129), lines 129–140. Registers this handler; the HTTP request must match for its body to run.
- `router.post('/schools/:schoolId/streams/:streamId/subjects')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:146), lines 146–166. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/schools/:schoolId/streams/:streamId/subjects')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:171), lines 171–180. Registers this handler; the HTTP request must match for its body to run.
- `router.patch('/schools/:schoolId/streams/:streamId/subjects/:streamSubjectId')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:186), lines 186–210. Registers this handler; the HTTP request must match for its body to run.
- `router.delete('/schools/:schoolId/streams/:streamId/subjects/:streamSubjectId')` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:216), lines 216–226. Registers this handler; the HTTP request must match for its body to run.
- `router.use((err: unknown, _req: Request, res: Response, next: import('express').NextFunction) => {
  const error = err as { code?: string; cause?: { code?: string } };
  if (error.code === '23505' || error.cause?.code === '23505') return res.status(409).json({ error: 'This subject is already in the stream' });
  next(err);
})` — [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:228), lines 228–232. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:6), line 6: `import { Router, Request, Response } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:7), line 7: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:8), lines 8–17: `import { createStream, getStreamsBySchool, updateStream, deleteStream, addSubjectToStream, updateStreamSubject, removeSubjectFromStream, getStreamSubjects, } from '../services/streamService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:18), line 18: `import { getSchoolById } from '../services/schoolService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:19), line 19: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:21), line 21: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:22), line 22: `import { streams as streamTable, streamSubjects as streamSubjectTable } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:23), line 23: `import { and, eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts:25), line 25: `import { requireSchoolAdministration } from "../middleware/schoolAdministration";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/routes/subjects.ts

[Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:1), lines 1–40. Source fingerprint SHA-256 prefix: `7028992d05d67f4d`.

HTTP method/path callbacks. The scenario identifies which route matches; each matching callback validates scope/input, calls services and sends a response.

Route/middleware registration blocks (callbacks receive req/res and sometimes next):

- `router.post('/subjects')` — [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:21), lines 21–30. Registers this handler; the HTTP request must match for its body to run.
- `router.get('/subjects')` — [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:35), lines 35–38. Registers this handler; the HTTP request must match for its body to run.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:1), line 1: `import { requireAuth } from '../middleware/auth';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:2), line 2: `import { requireAppManager } from '../middleware/appManager';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:8), line 8: `import { Router, Request, Response } from 'express';` — Express Router registers method/path handlers; express() builds the app; json/static are middleware. Request/Response/NextFunction are types for req/res/next and do not run.
- [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:9), line 9: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/routes/subjects.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/subjects.ts:10), line 10: `import { createSubject, getAllSubjects, DuplicateSubjectError } from '../services/subjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/securityConfig.ts

[Project-Edu-Revo/src/securityConfig.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/securityConfig.ts:1), lines 1–6. Source fingerprint SHA-256 prefix: `70884b9160aef658`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **frontendOrigins** — [Project-Edu-Revo/src/securityConfig.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/securityConfig.ts:2), lines 2–6. No args → configured origin array or development defaults; missing production configuration throws.
  - Signature: `export function frontendOrigins()`.

#### Backend: src/server.ts

[Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:1), lines 1–19. Source fingerprint SHA-256 prefix: `5cac2d6d755fadfc`.

Environment/bootstrap/listen and expired throttle cleanup, once per backend process.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:6), line 6: `import 'dotenv/config';` — Side-effect import loads backend environment variables before configuration/database/auth modules use them.
- [Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:7), line 7: `import app from './app';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:8), line 8: `import { db } from './db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:9), line 9: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.

#### Backend: src/services/authService.ts

[Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:1), lines 1–124. Source fingerprint SHA-256 prefix: `34286ee1c54e759a`.

Password checks, random/hash session credentials, signed access claims, refresh and logout.

- **generateAccessToken** — [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:25), lines 25–27. Account ID/type/school and optional role → signed JWT string with15-minute expiry.
  - Signature: `export function generateAccessToken(accountId: number, accountType: string, schoolId: number | null, role?: string)`.

- **storeRefreshToken** — [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:33), lines 33–39. Raw random token + account details → Promise of raw token after storing SHA-256 hash and expiry.
  - Signature: `async function storeRefreshToken(rawToken: string, accountId: number, accountType: string, schoolId: number | null)`.

- **loginPerson** — [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:45), lines 45–54. username/password → Promise of access/refresh pair after bcrypt and claimed-account checks. Route hides refresh pair from JSON.
  - Signature: `export async function loginPerson(username: string, password: string)`.

- **loginLearner** — [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:59), lines 59–71. Separate account category; not reached on successful principal login. Username/password → token pair after learner bcrypt check.
  - Signature: `export async function loginLearner(username: string, password: string)`.

- **refreshAccessToken** — [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:77), lines 77–104. Browser version takes no args, returns Promise<token|null> using shared request/cookie. Server version takes raw credential, checks stored hash/current account and returns Promise<new access token>.
  - Signature: `export async function refreshAccessToken(rawToken: string)`.

- **logout** — [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:110), lines 110–113. No input in browser helper; resets location, dispatches cookie revocation and removes metadata. Backend same-name function instead takes raw token and returns Promise<void> after deleting its hash.
  - Signature: `export async function logout(rawToken: string)`.

- **loginManager** — [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:118), lines 118–124. username/password → Promise<void> after manager authentication and memory/metadata storage.
  - Signature: `export async function loginManager(username: string, password: string)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:6), line 6: `import jwt from 'jsonwebtoken';` — jsonwebtoken signs access tokens in authService and verifies allowed signatures/expiry in requireAuth.
- [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:7), line 7: `import crypto from 'crypto';` — Built-in Node cryptography: randomBytes produces refresh credentials; createHash SHA-256 protects stored token hashes and constructs reviewed-state/throttle hashes.
- [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:8), line 8: `import bcrypt from 'bcrypt';` — bcrypt compares passwords with slow hashes (login) or produces hashes (claiming). It is different from SHA-256 hashing a random refresh credential.
- [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:9), line 9: `import { eq, and } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:10), line 10: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:11), line 11: `import { people, learners, refreshTokens, appManagers } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/chapterService.ts

[Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:1), lines 1–76. Source fingerprint SHA-256 prefix: `642c68058c573370`.

Current book calls chapter reader; legacy class chapter links/overrides remain available through separate APIs.

- **createChapter** — [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:16), lines 16–25. Insert a shared chapter for its subject and grade; orderIndex determines its curriculum position. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function createChapter(data: { subjectId: number; gradeNumber: number; name: string; orderIndex: number; label?: string; })`.

- **getChaptersBySubjectGrade** — [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:30), lines 30–34. Subject ID and grade number → Promise of active ordered chapters.
  - Signature: `export async function getChaptersBySubjectGrade(subjectId: number, gradeNumber: number)`.

- **assignChapterToClass** — [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:40), lines 40–51. Link a shared chapter to an existing class-subject allocation instead of copying the chapter content. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function assignChapterToClass(classSubjectId: number, chapterId: number)`.

- **assignPersonToClassChapter** — [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:56), lines 56–66. Update the teacher for a particular class-chapter assignment. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function assignPersonToClassChapter(classSubjectId: number, chapterId: number, personId: number)`.

- **getClassChapters** — [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:71), lines 71–76. Read the chapter links for one class-subject allocation. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function getClassChapters(classSubjectId: number)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:1), line 1: `import { people, classes, grades } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:2), line 2: `import { SetupError } from './classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:3), line 3: `import { sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:8), line 8: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:9), line 9: `import { chapters, classChapters, classSubjects } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/chapterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/chapterService.ts:10), line 10: `import { eq, and } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.

#### Backend: src/services/classCurriculumService.ts

[Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:1), lines 1–44. Source fingerprint SHA-256 prefix: `9a1d4036fecf7bc5`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **getClassCurriculum** — [Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:17), lines 17–44. school/class/allocation IDs and optional database dependency → Promise of shared tree plus current class taught flags/counts/percentage.
  - Signature: `export async function getClassCurriculum(schoolId: number, classId: number, classSubjectId: number, database: Pick<typeof db, 'transaction'> = db)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:6), line 6: `import { and, eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:7), line 7: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:8), line 8: `import { classes, grades, classSubjects, subjects, lessons, lessonConcepts } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:9), line 9: `import { getCurriculum } from './curriculumService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classCurriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classCurriculumService.ts:10), line 10: `import { SetupError } from './classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/classService.ts

[Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:1), lines 1–311. Source fingerprint SHA-256 prefix: `6dbf24d0db38ebc3`.

Class normalization, uniqueness, reads, mutations and history-protected direct-pg deletion.

- **normalizeClassName** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:37), lines 37–49. Raw name and grade number → normalized grade+letters string; throws for invalid suffix.
  - Signature: `function normalizeClassName(rawName: string, gradeNumber: number)`.

- **ensureUniqueClassName** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:55), lines 55–65. Grade ID/name/optional excluded class ID → Promise<void>; throws DuplicateClassNameError on conflict.
  - Signature: `async function ensureUniqueClassName(gradeId: number, name: string, exceptClassId?: number)`.

- **createClass** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:71), lines 71–85. ClassInput → Promise of saved class after normalization and transaction/synchronization.
  - Signature: `export async function createClass(data: ClassInput)`.

- **getClassesByGrade** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:90), lines 90–125. Grade ID → Promise of class records with aggregate learners/manager names/year/stream IDs.
  - Signature: `export async function getClassesByGrade(gradeId: number)`.

- **assignStreamToClass** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:131), lines 131–140. Legacy single stream class ID/stream ID → Promise of class rows after same-school stream save/sync; not current multistream UI endpoint.
  - Signature: `export async function assignStreamToClass(classId: number, streamId: number)`.

- **updateClass** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:145), lines 145–170. Class ID + partial update → Promise of saved class; preserves ID and synchronizes if stream changes.
  - Signature: `export async function updateClass(classId: number, data: ClassUpdateInput)`.

- **deleteClassContents** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:176), lines 176–275. Borrowed PoolClient + class ID array → Promise<void>; refuses learners/history before dependent cleanup.
  - Signature: `export async function deleteClassContents(client: PoolClient, classIds: number[])`.

- **deleteClassById** — [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:280), lines 280–311. Class/grade/school IDs → Promise<{id}>; explicit SQL transaction, rollback on failure, client always released.
  - Signature: `export async function deleteClassById(classId: number, gradeId: number, schoolId: number)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:6), line 6: `import { db, pool } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:7), line 7: `import { classes, grades, learners, people, streams, classStreams } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:8), line 8: `import { eq, and, count, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:9), line 9: `import type { PoolClient } from 'pg';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. pg Pool connects to PostgreSQL and reuses connections. PoolClient is only a TypeScript type for a borrowed connection used by explicit BEGIN/COMMIT/ROLLBACK code.
- [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:10), line 10: `import { saveClassStreams } from './classStreamService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts:11), line 11: `import { syncClassSubjects } from './classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/classStreamService.ts

[Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:1), lines 1–82. Source fingerprint SHA-256 prefix: `d223a61811542ebd`.

Class stream union/intersection/configuration/revision plus learner setup and roster effects.

- **streamOptions** — [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:9), lines 9–22. tx + class ID → Promise of class/options/common/different/split computed from current memberships.
  - Signature: `export async function streamOptions(tx: Tx, classId: number)`.

- **saveClassStreams** — [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:23), lines 23–43. tx,classId,schoolId,stream IDs,configuration|null → Promise of new option summary; validates/replaces links and revision within caller transaction.
  - Signature: `export async function saveClassStreams(tx: Tx, classId: number, schoolId: number, streamIds: number[], configuration: SplitConfiguration | null)`.

- **learnerLearningSetup** — [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:44), lines 44–56. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function learnerLearningSetup(tx: Tx, caller: AuthPayload)`.

- **learnerSubjectIds** — [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:57), lines 57–62. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function learnerSubjectIds(tx: Tx, caller: AuthPayload)`.

- **subjectRoster** — [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:64), lines 64–73. The teacher's subject roster excludes learners taking the other optional subject. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function subjectRoster(tx: Tx, classSubjectId: number)`.

- **lessonRoster** — [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:77), lines 77–82. A taught lesson keeps its original audience when learners transfer or streams change. Null is reserved for legacy/imported records lacking a confirmation snapshot. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function lessonRoster(tx: Tx, lessonId: number)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:1), line 1: `import { and, eq, inArray, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:2), line 2: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:3), line 3: `import { classes, grades, streams, streamSubjects, subjects, classStreams, learners, learnerStreamSelections, classSubjects, lessons } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classStreamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classStreamService.ts:4), line 4: `import type { AuthPayload } from '../middleware/auth';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/classSubjectService.ts

[Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:1), lines 1–104. Source fingerprint SHA-256 prefix: `4c430ff0951e0ca7`.

Synchronizes active year allocations, chapter links, teacher assignments and pending correction handover.

- **syncClassSubjects** — [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:19), lines 19–48. tx,classId → Promise<void>; reconciles year-scoped active allocations and chapter links without deleting past teaching history.
  - Signature: `export async function syncClassSubjects(tx: SetupTransaction, classId: number)`.

- **syncStreamClasses** — [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:53), lines 53–57. tx,streamId → Promise<void>; revises/synchronizes all classes using that stream.
  - Signature: `export async function syncStreamClasses(tx: SetupTransaction, streamId: number)`.

- **getClassSubjects** — [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:63), lines 63–70. school/class IDs → Promise of active subject/teacher display rows.
  - Signature: `export async function getClassSubjects(schoolId: number, classId: number)`.

- **assignSubjectTeacher** — [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:76), lines 76–104. tx,school/class/allocation IDs,personId|null → Promise<void>; validates teacher scope, updates defaults/links and hands pending drafts over.
  - Signature: `export async function assignSubjectTeacher(tx: SetupTransaction, schoolId: number, classId: number, classSubjectId: number, personId: number | null)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:6), line 6: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:7), line 7: `import { classes, grades, streams, streamSubjects, classSubjects, subjects, people, chapters, classChapters, classStreams, lessonReviewConcepts, concepts } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:8), line 8: `import { eq, and, inArray, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/classSubjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classSubjectService.ts:9), line 9: `import { streamOptions } from './classStreamService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/conceptService.ts

[Project-Edu-Revo/src/services/conceptService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/conceptService.ts:1), lines 1–33. Source fingerprint SHA-256 prefix: `211c3580098fc44d`.

Current book uses active concept reader; shared creation is manager-authorized.

- **createConcept** — [Project-Edu-Revo/src/services/conceptService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/conceptService.ts:13), lines 13–24. Insert a chapter concept through this low-level helper; shared import/edit validation has a separate service. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function createConcept(data: { chapterId: number; topicId?: number; name: string; orderIndex: number })`.

- **getConceptsByChapter** — [Project-Edu-Revo/src/services/conceptService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/conceptService.ts:28), lines 28–33. Chapter ID and optional select provider → Promise of active chapter/topic concepts ordered by curriculum indices.
  - Signature: `export async function getConceptsByChapter(chapterId: number, database: Pick<typeof db, 'select'> = db)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/conceptService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/conceptService.ts:6), line 6: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/conceptService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/conceptService.ts:7), line 7: `import { concepts, topics, chapters } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/conceptService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/conceptService.ts:8), line 8: `import { eq, and, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.

#### Backend: src/services/curriculumService.ts

[Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:1), lines 1–211. Source fingerprint SHA-256 prefix: `47d4f5dca5fd3979`.

Principal class coverage uses getCurriculum; workbook editing/saving functions belong to manager workflows.

- **similar** — [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:33), lines 33–42. Compare heading spelling with edit distance to suggest possible duplicates. A warning is not an automatic merge. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `function similar(a: string, b: string)`.

- **previewWorkbook** — [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:47), lines 47–111. Parse supported spreadsheet layouts into a chapter/topic/concept tree and warnings. Preview performs no database writes. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export function previewWorkbook(buffer: Buffer)`.

- **getCurriculum** — [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:116), lines 116–125. Subject ID/grade number/optional transaction provider → Promise of active shared chapter/topic/noncustom concept guidance tree and revision.
  - Signature: `export async function getCurriculum(subjectId: number, gradeNumber: number, database: Pick<typeof db, 'transaction'> = db)`.

- **saveCurriculum** — [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:130), lines 130–211. Validate labels/IDs and revision, preserve existing identities, archive removals, save ordered content and advance the library revision atomically. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function saveCurriculum(input: CurriculumInput, database: Pick<typeof db, 'transaction'> = db)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:7), line 7: `import { and, eq, inArray, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:8), line 8: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:9), line 9: `import * as XLSX from 'xlsx';` — SheetJS reads workbook bytes and extracts worksheet cells/rows; it does not save roster records.
- [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:10), line 10: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/curriculumService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/curriculumService.ts:11), line 11: `import { chapters, topics, concepts, curriculumLibraries, subjects, classes, grades, classSubjects, classChapters } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/gradeService.ts

[Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts:1), lines 1–16. Source fingerprint SHA-256 prefix: `3537d6263de4e0d1`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **getGradesBySchool** — [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts:14), lines 14–16. School ID → Promise of grade rows filtered to that school, numeric order.
  - Signature: `export async function getGradesBySchool(schoolId: number)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts:5), line 5: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts:6), line 6: `import { grades } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts:7), line 7: `import { eq } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.

#### Backend: src/services/learnerRosterService.ts

[Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:1), lines 1–65. Source fingerprint SHA-256 prefix: `e22798d3a104407e`.

Admission-based review/impact/hash and transactional update/progression/history reconciliation.

- **reviewLearnerRoster** — [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:11), lines 11–31. tx,schoolId,classId,rows,mode,year → Promise of current matches/removals/transfers/counts/reviewHash; does not apply proposed roster.
  - Signature: `export async function reviewLearnerRoster(tx: Tx, schoolId: number, classId: number, rows: RosterRow[], mode: LearnerImportMode, academicYear: number)`.

- **rosterImpact** — [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:32), lines 32–34. Internal detailed review result → JSON-safe impact subset, without internal matching records.
  - Signature: `export function rosterImpact(result: Awaited<ReturnType<typeof reviewLearnerRoster>>)`.

- **commitLearnerRoster** — [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:35), lines 35–65. tx,schoolId,classId,rows,mode,year,hash → Promise of saved count/impact; re-review then names/membership/year updates.
  - Signature: `export async function commitLearnerRoster(tx: Tx, schoolId: number, classId: number, rows: RosterRow[], mode: LearnerImportMode, academicYear: number, reviewHash: string)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:1), line 1: `import { createHash } from 'node:crypto';` — Built-in Node cryptography; createHash SHA-256 turns reviewed state or throttle identities into deterministic digests. It is not password hashing or encryption.
- [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:2), line 2: `import { and, eq, isNull, sql, inArray } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:3), line 3: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:4), line 4: `import { classes, grades, learners, learnerClassHistory, learnerStreamSelections } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:5), line 5: `import { RosterImportError, validateRosterRows, type RosterRow } from './rosterImportService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerRosterService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerRosterService.ts:6), line 6: `import { syncClassSubjects } from './classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/learnerService.ts

[Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:1), lines 1–99. Source fingerprint SHA-256 prefix: `3105821f0cacfea4`.

Principal uses add/list; claiming/older bulk exports are separate callers.

- **addLearner** — [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:12), lines 12–28. Names/admission/school/class object → Promise of inserted identity after membership-history transaction.
  - Signature: `export async function addLearner(data: { firstName: string; surname: string; admissionNumber: string; schoolId: number; classId: number; })`.

- **getLearnersByClass** — [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:34), lines 34–40. Class ID → Promise of credential-free register fields and current revision selection name, surname order.
  - Signature: `export async function getLearnersByClass(classId: number)`.

- **findLearnerForOnboarding** — [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:45), lines 45–57. Find the roster record matching the learner's claim details before credential setup. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function findLearnerForOnboarding(schoolCode: string, admissionNumber: string, initials: string)`.

- **completeLearnerOnboarding** — [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:62), lines 62–68. Claim a learner record with validated login details and a hashed password. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function completeLearnerOnboarding(learnerId: number, username: string, passwordHash: string)`.

- **bulkAddLearners** — [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:74), lines 74–99. Insert multiple learner roster records through the older bulk helper; current reviewed imports use rosterImportService. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function bulkAddLearners( learners: { firstName: string; surname: string; admissionNumber: string }[], schoolId: number, classId: number, )`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:5), line 5: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:6), line 6: `import { learners, schools, classes, grades, learnerClassHistory, learnerStreamSelections, streams } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts:7), line 7: `import { eq, and, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.

#### Backend: src/services/learnerTransferService.ts

[Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:1), lines 1–32. Source fingerprint SHA-256 prefix: `b030308075659fdf`.

Same-grade/year direct moves reuse roster reconciliation after source/target review.

- **reviewLearnerTransfer** — [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:10), lines 10–24. tx,school,source,target,selected IDs → Promise of reviewed source/target/counts/rows/hash; enforces same grade/year.
  - Signature: `export async function reviewLearnerTransfer(tx: Tx, schoolId: number, sourceId: number, targetId: number, learnerIds: number[])`.

- **commitLearnerTransfer** — [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:25), lines 25–32. Same IDs plus reviewHash → Promise of moved count/source/target/remaining after locks and reconciled commit.
  - Signature: `export async function commitLearnerTransfer(tx: Tx, schoolId: number, sourceId: number, targetId: number, learnerIds: number[], reviewHash: string)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:1), line 1: `import { createHash } from 'node:crypto';` — Built-in Node cryptography; createHash SHA-256 turns reviewed state or throttle identities into deterministic digests. It is not password hashing or encryption.
- [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:2), line 2: `import { and, eq, inArray, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:3), line 3: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:4), line 4: `import { classes, grades, learners } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:5), line 5: `import { reviewLearnerRoster, commitLearnerRoster } from './learnerRosterService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/learnerTransferService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerTransferService.ts:6), line 6: `import { RosterImportError } from './rosterImportService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/peopleService.ts

[Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:1), lines 1–119. Source fingerprint SHA-256 prefix: `7aacc9987238fc27`.

Principal uses add/list; older bulk and claiming exports are not called by current principal register.

- **addPerson** — [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:12), lines 12–21. Title/name/staffNumber/school object → Promise of inserted staff roster row; no password setup.
  - Signature: `export async function addPerson(data: { title: string; firstName: string; surname: string; staffNumber: string; schoolId: number; })`.

- **getPeopleBySchool** — [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:27), lines 27–62. School ID → Promise of explicit staff display/activation/grant/assignment aggregate rows.
  - Signature: `export async function getPeopleBySchool(schoolId: number)`.

- **bulkAddPeople** — [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:67), lines 67–91. Insert staff roster rows through the lower-level bulk helper. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function bulkAddPeople( staff: { title: string; firstName: string; surname: string; staffNumber: string }[], schoolId: number, )`.

- **findPersonForOnboarding** — [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:96), lines 96–108. Find an existing staff record from its school and claim details. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function findPersonForOnboarding(schoolCode: string, staffNumber: string, initials: string)`.

- **completePeopleOnboarding** — [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:113), lines 113–119. Save claimed staff credentials with a password hash rather than a plaintext password. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function completePeopleOnboarding(personId: number, username: string, passwordHash: string)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:5), line 5: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:6), line 6: `import { classChapters, classSubjects, chapters, people, schools } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts:7), line 7: `import { and, count, eq, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.

#### Backend: src/services/rosterImportService.ts

[Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:1), lines 1–118. Source fingerprint SHA-256 prefix: `6eebc9816fa44a3b`.

Workbook parsing, row checks, target checks and atomic staff insertion.

- **validateRosterRows** — [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:21), lines 21–38. Rows + existing identifier array + kind → issue array of row numbers/error strings; pure validation.
  - Signature: `export function validateRosterRows(rows: RosterRow[], existingIdentifiers: string[], kind: RosterKind = 'staff')`.

- **parseRosterWorkbook** — [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:43), lines 43–62. Buffer + staff/learners kind → normalized RosterRow[] or RosterImportError; no writes.
  - Signature: `export function parseRosterWorkbook(buffer: Buffer, kind: RosterKind): RosterRow[]`.

- **checkTarget** — [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:67), lines 67–75. tx,schoolId,kind,optional classId → Promise<void> or scoped target error.
  - Signature: `async function checkTarget(tx: Transaction, schoolId: number, kind: RosterKind, classId?: number)`.

- **existingNumbers** — [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:80), lines 80–84. tx,schoolId,kind → Promise<string[]> of school staff/admission identifiers.
  - Signature: `async function existingNumbers(tx: Transaction, schoolId: number, kind: RosterKind)`.

- **previewRoster** — [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:88), lines 88–95. schoolId,kind,buffer,optional classId/database → Promise of rows/existingIdentifiers/issues; no roster insertion.
  - Signature: `export async function previewRoster(schoolId: number, kind: RosterKind, buffer: Buffer, classId?: number, database: Pick<typeof db, 'transaction'> = db)`.

- **saveRoster** — [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:100), lines 100–118. schoolId,kind,rows,optional classId/database → Promise<{saved}>; rechecks under locks, commits all or none.
  - Signature: `export async function saveRoster(schoolId: number, kind: RosterKind, rows: RosterRow[], classId?: number, database: Pick<typeof db, 'transaction'> = db)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:1), line 1: `import { learnerClassHistory } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:7), line 7: `import * as XLSX from 'xlsx';` — SheetJS reads workbook bytes and extracts worksheet cells/rows; it does not save roster records.
- [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:8), line 8: `import { and, eq, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:9), line 9: `import { z } from 'zod';` — Zod z builds runtime validation schemas. safeParse returns success/data or an error object; it does not merely provide editor types.
- [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:10), line 10: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/rosterImportService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/rosterImportService.ts:11), line 11: `import { people, learners, classes, grades, schools } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/staffAccessService.ts

[Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:1), lines 1–18. Source fingerprint SHA-256 prefix: `4a0e1865c1e7cd90`.

Live principal/capability/teaching availability calculation.

- **staffAccess** — [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:8), lines 8–18. Verified AuthPayload → Promise of isPrincipal/canTeach/capabilities/schoolId from live records.
  - Signature: `export async function staffAccess(caller: AuthPayload)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:1), line 1: `import { and, eq, inArray } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:2), line 2: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:3), line 3: `import { people, administrativeWork, classSubjects, classChapters, classes, grades, chapters } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:4), line 4: `import type { AuthPayload } from '../middleware/auth';` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/streamService.ts

[Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:1), lines 1–119. Source fingerprint SHA-256 prefix: `e868579c7110887b`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **createStream** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:13), lines 13–16. schoolId/name object → Promise of inserted stream; membership requests are separate.
  - Signature: `export async function createStream(data: { schoolId: number; name: string })`.

- **getStreamsBySchool** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:21), lines 21–23. School ID → Promise of matching stream records.
  - Signature: `export async function getStreamsBySchool(schoolId: number)`.

- **updateStream** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:28), lines 28–35. Stream ID/name object → Promise of renamed row|undefined; ID remains.
  - Signature: `export async function updateStream(streamId: number, data: { name: string })`.

- **deleteStream** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:41), lines 41–56. Stream ID → Promise<{id}>; transaction removes links/memberships, revises/syncs classes, preserves historical allocations.
  - Signature: `export async function deleteStream(streamId: number)`.

- **addSubjectToStream** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:62), lines 62–70. streamId/subjectId object → Promise of inserted membership with affected-class sync.
  - Signature: `export async function addSubjectToStream(data: { streamId: number; subjectId: number })`.

- **updateStreamSubject** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:75), lines 75–85. Legacy membership ID/replacement subject ID → Promise of changed membership|undefined and class sync; current book uses add/remove.
  - Signature: `export async function updateStreamSubject(data: { streamSubjectId: number; subjectId: number })`.

- **removeSubjectFromStream** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:90), lines 90–101. Membership ID → Promise<{id}> after transaction/delete/sync.
  - Signature: `export async function removeSubjectFromStream(streamSubjectId: number)`.

- **getStreamSubjects** — [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:106), lines 106–119. Stream ID → Promise of membership/subject-name rows ordered by subject name.
  - Signature: `export async function getStreamSubjects(streamId: number)`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:5), line 5: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:6), line 6: `import { streams, streamSubjects, subjects, classes, classStreams } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:7), line 7: `import { eq, sql } from 'drizzle-orm';` — Drizzle query helpers: eq equality; and combined conditions; inArray set membership; isNull null checks; count aggregate; sql parameterized SQL templates; other imported operators express SQL conditions, not JavaScript filtering of already-fetched rows.
- [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts:8), line 8: `import { syncStreamClasses, syncClassSubjects } from './classSubjectService';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Backend: src/services/subjectService.ts

[Project-Edu-Revo/src/services/subjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/subjectService.ts:1), lines 1–24. Source fingerprint SHA-256 prefix: `859cb143e810f6ff`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **createSubject** — [Project-Edu-Revo/src/services/subjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/subjectService.ts:11), lines 11–20. Insert a subject catalogue record; class teaching assignments are separate records. This is a separate/legacy/related-effect function, not an additional direct click exposed by the current principal administration book; the walkthrough states when a shared reader or effect is relevant.
  - Signature: `export async function createSubject(data: { name: string }, database: Pick<typeof db, 'insert'> = db)`.

- **getAllSubjects** — [Project-Edu-Revo/src/services/subjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/subjectService.ts:24), line 24. No arguments → Promise of global subject catalogue rows ordered by name.
  - Signature: `export async function getAllSubjects()`.

Imports at the point you encounter them:

- [Project-Edu-Revo/src/services/subjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/subjectService.ts:5), line 5: `import { db } from '../db';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [Project-Edu-Revo/src/services/subjectService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/subjectService.ts:6), line 6: `import { subjects } from '../db/schema';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: next.config.ts

[nedecen-web/next.config.ts](C:/Users/Kgodiso/source/repos/nedecen-web/next.config.ts:1), lines 1–33. Source fingerprint SHA-256 prefix: `1a9132ceea5cdaec`.

Supporting module referenced by the scenarios; its complete source range is linked above.

Imports at the point you encounter them:

- [nedecen-web/next.config.ts](C:/Users/Kgodiso/source/repos/nedecen-web/next.config.ts:6), line 6: `import type { NextConfig } from "next";` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Next configuration/metadata types describe framework settings and are erased as TypeScript types.

#### Frontend: package.json

[nedecen-web/package.json](C:/Users/Kgodiso/source/repos/nedecen-web/package.json:1), lines 1–27. Source fingerprint SHA-256 prefix: `20647e5b8c97490e`.

Supporting module referenced by the scenarios; its complete source range is linked above.

#### Frontend: postcss.config.mjs

[nedecen-web/postcss.config.mjs](C:/Users/Kgodiso/source/repos/nedecen-web/postcss.config.mjs:1), lines 1–11. Source fingerprint SHA-256 prefix: `6d93a83a2bf0975b`.

Supporting module referenced by the scenarios; its complete source range is linked above.

#### Frontend: src/app/dashboard/principal/announcements/page.tsx

[nedecen-web/src/app/dashboard/principal/announcements/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/announcements/page.tsx:1), lines 1–10. Source fingerprint SHA-256 prefix: `a288b6df94defaef`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **BookEntry** — [nedecen-web/src/app/dashboard/principal/announcements/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/announcements/page.tsx:8), lines 8–10. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function BookEntry()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/principal/announcements/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/announcements/page.tsx:6), line 6: `import { redirect } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.

#### Frontend: src/app/dashboard/principal/grades/[gradeId]/page.tsx

[nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx:1), lines 1–11. Source fingerprint SHA-256 prefix: `2405e26216be5b35`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **GradeEntry** — [nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx:8), lines 8–11. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default async function GradeEntry({ params }: { params: Promise<{ gradeId: string }> })`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/[gradeId]/page.tsx:6), line 6: `import { redirect } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.

#### Frontend: src/app/dashboard/principal/grades/layout.tsx

[nedecen-web/src/app/dashboard/principal/grades/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/layout.tsx:1), lines 1–7. Source fingerprint SHA-256 prefix: `364fa31c7ae13555`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **GradesLayout** — [nedecen-web/src/app/dashboard/principal/grades/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/layout.tsx:5), lines 5–7. Compatibility layout for older grade URLs. It passes children through; the current grade/class bookshelf is rendered by the principal workspace.
  - Signature: `export default function GradesLayout({ children }: { children: React.ReactNode })`.

#### Frontend: src/app/dashboard/principal/grades/page.tsx

[nedecen-web/src/app/dashboard/principal/grades/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/page.tsx:1), lines 1–10. Source fingerprint SHA-256 prefix: `89ddd4e6a08cca24`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **BookEntry** — [nedecen-web/src/app/dashboard/principal/grades/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/page.tsx:8), lines 8–10. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function BookEntry()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/principal/grades/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/grades/page.tsx:6), line 6: `import { redirect } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.

#### Frontend: src/app/dashboard/principal/layout.tsx

[nedecen-web/src/app/dashboard/principal/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/layout.tsx:1), lines 1–7. Source fingerprint SHA-256 prefix: `9c83c0187a1534b0`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **PrincipalLayout** — [nedecen-web/src/app/dashboard/principal/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/layout.tsx:5), lines 5–7. Pass child routes through without adding another principal shell. BookWorkspace already draws the bookshelf, so placing one here would duplicate the interface.
  - Signature: `export default function PrincipalLayout({ children }: { children: React.ReactNode })`.

#### Frontend: src/app/dashboard/principal/learners/page.tsx

[nedecen-web/src/app/dashboard/principal/learners/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/learners/page.tsx:1), lines 1–10. Source fingerprint SHA-256 prefix: `e9efe115bb54d5f0`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **BookEntry** — [nedecen-web/src/app/dashboard/principal/learners/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/learners/page.tsx:8), lines 8–10. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function BookEntry()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/principal/learners/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/learners/page.tsx:6), line 6: `import { redirect } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.

#### Frontend: src/app/dashboard/principal/page.tsx

[nedecen-web/src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx:1), lines 1–12. Source fingerprint SHA-256 prefix: `d6a052c04ba6a8c9`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **PrincipalHome** — [nedecen-web/src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx:10), lines 10–12. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function PrincipalHome()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx:6), line 6: `import { Suspense } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx:7), line 7: `import { BookWorkspace } from "@/components/principal/books/BookWorkspace";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx:8), line 8: `import { StaffAccessBoundary } from "@/components/dashboard/StaffAccess";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/app/dashboard/principal/staff/page.tsx

[nedecen-web/src/app/dashboard/principal/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/staff/page.tsx:1), lines 1–10. Source fingerprint SHA-256 prefix: `059d453b976208c5`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **BookEntry** — [nedecen-web/src/app/dashboard/principal/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/staff/page.tsx:8), lines 8–10. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function BookEntry()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/principal/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/staff/page.tsx:6), line 6: `import { redirect } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.

#### Frontend: src/app/dashboard/principal/streams/page.tsx

[nedecen-web/src/app/dashboard/principal/streams/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/streams/page.tsx:1), lines 1–10. Source fingerprint SHA-256 prefix: `d9847dca1be478ba`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **BookEntry** — [nedecen-web/src/app/dashboard/principal/streams/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/streams/page.tsx:8), lines 8–10. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function BookEntry()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/principal/streams/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/streams/page.tsx:6), line 6: `import { redirect } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.

#### Frontend: src/app/dashboard/staff/page.tsx

[nedecen-web/src/app/dashboard/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/staff/page.tsx:1), lines 1–11. Source fingerprint SHA-256 prefix: `1a1a16cbbbe44ce7`.

Route entry/compatibility or mode boundary. See the route discussion before assuming this renders a modern book itself.

- **Page** — [nedecen-web/src/app/dashboard/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/staff/page.tsx:9), lines 9–11. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function Page()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/dashboard/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/staff/page.tsx:5), line 5: `import { Suspense } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/app/dashboard/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/staff/page.tsx:6), line 6: `import TeacherBookWorkspace from "@/components/dashboard/teacher-books/TeacherBookWorkspace";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/app/dashboard/staff/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/staff/page.tsx:7), line 7: `import { StaffAccessBoundary } from "@/components/dashboard/StaffAccess";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/app/globals.css

[nedecen-web/src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css:1), lines 1–386. Source fingerprint SHA-256 prefix: `f91c5936deee97b2`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/app/layout.tsx

[nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:1), lines 1–36. Source fingerprint SHA-256 prefix: `eee00de72476936a`.

Root document, font, global styles and metadata around the route.

- **RootLayout** — [nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:22), lines 22–36. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function RootLayout({ children, }: { children: React.ReactNode; })`.

Imports at the point you encounter them:

- [nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:6), line 6: `import type { Metadata } from "next";` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Next configuration/metadata types describe framework settings and are erased as TypeScript types.
- [nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:7), line 7: `import { Geist } from "next/font/google";` — Next Geist font integration prepares the font and CSS variable. It does not call the Express API.
- [nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:8), line 8: `import "./globals.css";` — Global CSS side-effect import; rules become available across routes, including Tailwind/reset/theme/motion rules.
- [nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:9), line 9: `import "./motion.css";` — Global CSS side-effect import; rules become available across routes, including Tailwind/reset/theme/motion rules.

#### Frontend: src/app/motion.css

[nedecen-web/src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css:1), lines 1–45. Source fingerprint SHA-256 prefix: `b5299438c58cea7e`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/app/page.tsx

[nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:1), lines 1–299. Source fingerprint SHA-256 prefix: `a25530095c3adf25`.

Sign-in state, inputs, submit/loading/error branches and initial session restoration.

- **LoginPage** — [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:13), lines 13–299. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function LoginPage()`.

Imports at the point you encounter them:

- [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:8), line 8: `import { useEffect, useState } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:9), line 9: `import { useRouter } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.
- [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:10), line 10: `import { login, getRole, getResumePath, restoreSavedSession } from "@/lib/auth";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:11), line 11: `import { useTheme } from "@/hooks/useTheme";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/dashboard/StaffAccess.tsx

[nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:1), lines 1–20. Source fingerprint SHA-256 prefix: `631324ee76c4c9b5`.

Loads current access from the server and shares it through React Context.

- **StaffAccessBoundary** — [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:10), lines 10–20. Capabilities come from live server grants, never editable localStorage role labels.
  - Signature: `export function StaffAccessBoundary({ mode, children }: { mode: 'teaching' | 'administration'; children: ReactNode })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:2), line 2: `import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:3), line 3: `import { useRouter } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.
- [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:4), line 4: `import { api } from "@/lib/api";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:5), line 5: `import { getAccountType, isLoggedIn, logout } from "@/lib/auth";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx

[nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:1), lines 1–169. Source fingerprint SHA-256 prefix: `c9544db739d48166`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **Arrow** — [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:28), lines 28–30. Input back toggles a local SVG direction; returns decorative JSX, no navigation itself.
  - Signature: `function Arrow({ back = false }: { back?: boolean })`.

- **Contents** — [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:36), lines 36–38. Input pages/active/onNavigate; maps nodes recursively, invokes callback with stable ID on click; returns ordered-list JSX.
  - Signature: `function Contents({ pages, current, navigate }: { pages: TeacherPage[]; current?: string; navigate: (id: string) => void })`.

- **TeacherBookWorkspace** — [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:44), lines 44–169. Load the teacher dashboard, derive page nodes and select a body from the URL. Request sequence IDs stop an older refresh from replacing newer data.
  - Signature: `export default function TeacherBookWorkspace()`.

Imports at the point you encounter them:

- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:8), line 8: `import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:9), line 9: `import Link from "next/link";` — Next Link renders an anchor with client-navigation support. It is used for brand/import navigation, not saving database records.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:10), line 10: `import { useRouter, useSearchParams } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:11), line 11: `import { api } from "@/lib/api";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:12), line 12: `import { rememberedLibraryLocation } from "@/lib/libraryMemory";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:13), line 13: `import { getAccountType, getRedirectPath, getRole, isLoggedIn, logout } from "@/lib/auth";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:14), line 14: `import { usePageTurn } from "@/components/principal/books/usePageTurn";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:15), line 15: `import { TEACHER_BOOKS, allocationName, flattenTeacherPages, teacherPages, teacherPagePath, type TeacherDashboard, type TeacherPage } from "./registry";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:16), line 16: `import TeacherBookPage, { type Navigate } from "./TeacherBookPage";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:17), line 17: `import HomeworkMethodFilters, { type HomeworkMode } from "../HomeworkMethodFilters";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:18), line 18: `import LessonFeedback from "./LessonFeedback";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:19), line 19: `import TeacherPageHeading from "./TeacherPageHeading";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:20), line 20: `import ResponsiveLibrary, { LibraryContents, LibraryDrawerClose, LibraryShelfTitle } from "@/components/principal/books/ResponsiveLibrary";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:21), line 21: `import styles from "@/components/principal/books/books.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherBookWorkspace.tsx:22), line 22: `import local from "./teacher-books.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/dashboard/teacher-books/TeacherDialog.tsx

[nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx:1), lines 1–27. Source fingerprint SHA-256 prefix: `9a026669ba2e7fef`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **TeacherDialog** — [nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx:12), lines 12–27. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function TeacherDialog({ title, onClose, busy = false, children, motion }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode; motion?: ModalMotion })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx:8), line 8: `import { useEffect, useId, type ReactNode } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx:9), line 9: `import { lockModalScroll, useModalMotion, type ModalMotion } from "@/hooks/useModalMotion";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx:10), line 10: `import styles from "@/components/principal/books/books.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/principal/AdministrativeWorkEditor.tsx

[nedecen-web/src/components/principal/AdministrativeWorkEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/AdministrativeWorkEditor.tsx:1), lines 1–5. Source fingerprint SHA-256 prefix: `e12f51fee45b7132`.

Named capability checkboxes submitted by the generic command dialog.

- **AdministrativeWorkEditor** — [nedecen-web/src/components/principal/AdministrativeWorkEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/AdministrativeWorkEditor.tsx:3), lines 3–5. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function AdministrativeWorkEditor({ selected }: { selected: string[] })`.

#### Frontend: src/components/principal/books/books.module.css

[nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:1), lines 1–267. Source fingerprint SHA-256 prefix: `7629a2869c03e2b1`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/principal/books/BookWorkspace.tsx

[nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:1), lines 1–361. Source fingerprint SHA-256 prefix: `e9d9d7f0a4b21a4e`.

Coordinates query selection, data/view state, shared dialogs and screen rendering.

- **Arrow** — [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:31), lines 31–33. Input back toggles a local SVG direction; returns decorative JSX, no navigation itself.
  - Signature: `function Arrow({ back = false }: { back?: boolean })`.

- **Contents** — [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:39), lines 39–46. Input pages/active/onNavigate; maps nodes recursively, invokes callback with stable ID on click; returns ordered-list JSX.
  - Signature: `function Contents({ pages, active, onNavigate }: { pages: BookPage[]; active?: string; onNavigate: (id: string) => void })`.

- **SelectionPreview** — [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:52), lines 52–62. Input selected value and async load function; effect obtains labels and ignores late response; returns loading/error/list JSX.
  - Signature: `function SelectionPreview({ value, load }: { value: string; load: (value: string) => Promise<string[]> })`.

- **CommandDialog** — [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:68), lines 68–111. Input command/onClose/onSaved; manages native dialog/form state; submit executes command.run then refresh callback. Returns modal JSX, not saved data.
  - Signature: `function CommandDialog({ command, onClose: onDismiss, onSaved }: { command: Command; onClose: () => void; onSaved: (pageId?: string) => Promise<void> })`.

- **WorkspacePage** — [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:118), lines 118–192. Input PageView/title/query/tab/navigation/command/refresh/data callbacks; returns shared header, filters, sections and optional importer. It does not independently know class business rules.
  - Signature: `function WorkspacePage({ view, title, query, onQuery, tab, onTab, onNavigate, onCommand, schoolId, data, onRefresh, stale, error, onRetry }: { view: PageView; title: string; query: string; onNavigate: (id: string) => void; onCommand: (command: Command) => void; onQuery: (query: string) => void; tab: string; onTab: (tab?: string) => void; schoolId: number; data: BookData; onRefresh: () => Promise<void>; stale: boolean; error: string | null; onRetry: () => void; })`.

- **BookWorkspace** — [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:198), lines 198–361. No props; reads URL/access, loads registry data/view via effects, holds command/revision state, returns the whole principal library.
  - Signature: `export function BookWorkspace()`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:3), line 3: `import AppSelect from "@/components/shared/AppSelect";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:11), line 11: `import { useEffect, useMemo, useRef, useState } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:12), line 12: `import { useRouter, useSearchParams } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:13), line 13: `import Link from "next/link";` — Next Link renders an anchor with client-navigation support. It is used for brand/import navigation, not saving database records.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:14), line 14: `import { getSchoolId, logout } from "@/lib/auth";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:15), line 15: `import { rememberedLibraryLocation } from "@/lib/libraryMemory";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:16), line 16: `import { RosterImportModal, RosterImportPurpose, type ImportPurpose } from "@/components/principal/RosterImportModal";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:17), line 17: `import { useStaffAccess } from "@/components/dashboard/StaffAccess";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:18), line 18: `import { BOOKS } from "./registry";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:19), line 19: `import { classLabel, findPagePath, flattenPages, type BookData, type BookPage, type Command, type PageView } from "./types";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:20), line 20: `import ResponsiveLibrary, { LibraryContents, LibraryDrawerClose, LibraryShelfTitle } from "./ResponsiveLibrary";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:21), line 21: `import MobileAction, { actionIconFor } from "@/components/shared/MobileAction";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:22), line 22: `import styles from "./books.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:23), line 23: `import { usePageTurn } from "./usePageTurn";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:24), line 24: `import { lockModalScroll, useModalMotion } from "@/hooks/useModalMotion";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:25), line 25: `import { MotionPanel, MotionTabs } from "@/components/shared/Motion";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/principal/books/library-tutorial.module.css

[nedecen-web/src/components/principal/books/library-tutorial.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/library-tutorial.module.css:1), lines 1–7. Source fingerprint SHA-256 prefix: `2c811de390de3aa2`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/principal/books/LibraryTutorial.tsx

[nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:1), lines 1–80. Source fingerprint SHA-256 prefix: `4afd2a19f975be36`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **accountKey** — [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:9), lines 9–12. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function accountKey()`.

- **read** — [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:13), lines 13–16. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function read(key: string): Progress`.

- **LibraryTutorial** — [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:17), lines 17–80. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function LibraryTutorial({ request, compact, bookOpen, openMenu, closeMenu, stepChanged }: { request: number; compact: boolean; bookOpen: boolean; openMenu: (side: "contents" | "shelf") => void; closeMenu: () => void; stepChanged: (step: number | null) => void; })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:3), line 3: `import { useEffect, useState } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:4), line 4: `import TeacherDialog from "@/components/dashboard/teacher-books/TeacherDialog";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:5), line 5: `import book from "./books.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.
- [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:6), line 6: `import styles from "./library-tutorial.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/principal/books/pageTurnMotion.ts

[nedecen-web/src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts:1), lines 1–45. Source fingerprint SHA-256 prefix: `04d0ab5be6f93ec8`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **pageTurnFrames** — [nedecen-web/src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts:22), lines 22–37. Calculate front/back/curl/shadow keyframes for the requested direction, keeping motion math separate from React rendering.
  - Signature: `export function pageTurnFrames(backward: boolean)`.

- **pageTurnSchedule** — [nedecen-web/src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts:42), lines 42–45. Stagger sheet timing to make the visual layers behave like pages turning together.
  - Signature: `export function pageTurnSchedule(distance: number)`.

#### Frontend: src/components/principal/books/registry.ts

[nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:1), lines 1–268. Source fingerprint SHA-256 prefix: `8a7b2185a81e206a`.

Defines every current principal book, dynamic page tree and command payload.

- **underDevelopmentBook** — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:30), lines 30–41. Book identity/description/color fields → BookDefinition with empty load and one information page.
  - Signature: `function underDevelopmentBook(details: Pick<BookDefinition, "id" | "title" | "subtitle" | "mark" | "color" | "description">): BookDefinition`.

- **structure** — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:47), lines 47–51. schoolId → Promise<BookData> containing ordered grades and flattened class results.
  - Signature: `async function structure(schoolId: number): Promise<BookData>`.

- **classCommand** — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:57), lines 57–72. schoolId, loaded BookData, grade, optional existing class → Command. Its run turns label into canonical name, POST/PATCHes and returns class-page ID.
  - Signature: `function classCommand(schoolId: number, data: BookData, grade: RecordItem, cls?: RecordItem): Command`.

- **personCommand** — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:78), lines 78–88. schoolId, staff-or-learners kind, optional classes/default class → Command with correct roster fields and POST payload.
  - Signature: `function personCommand(schoolId: number, kind: "staff" | "learners", classes: RecordItem[] = [], classId = ""): Command`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:1), line 1: `import MoveLearners from "../MoveLearners";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:7), line 7: `import { api } from "@/lib/api";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:8), line 8: `import { createElement } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:9), line 9: `import ClassStreamsEditor from "../ClassStreamsEditor";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:10), line 10: `import AdministrativeWorkEditor from "../AdministrativeWorkEditor";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:11), line 11: `import { ClassCurriculum } from "@/components/principal/ClassCurriculum";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:12), line 12: `import type { BookData, BookDefinition, BookPage, Command, Field, PageRow, RecordItem } from "./types";` — Type-only import: erased at build time; describes shapes for checking and does not run a function. Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:13), line 13: `import { classLabel, learnerName, nameOf, optionsOf, streamLabel } from "./types";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/principal/books/responsive-library.module.css

[nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:1), lines 1–135. Source fingerprint SHA-256 prefix: `8bef197078eae7a3`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/principal/books/ResponsiveLibrary.tsx

[nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:1), lines 1–156. Source fingerprint SHA-256 prefix: `c73ad030b69b36f1`.

Viewport mode, temporary drawers, focus handling, account footer and tutorial connection.

- **currentMode** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:17), line 17. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function currentMode(): Mode`.

- **subscribeMode** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:18), lines 18–22. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function subscribeMode(changed: () => void)`.

- **MenuIcon** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:26), line 26. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function MenuIcon()`.

- **BooksIcon** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:27), line 27. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function BooksIcon()`.

- **CloseIcon** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:28), line 28. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function CloseIcon()`.

- **LibraryDrawerClose** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:30), lines 30–33. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function LibraryDrawerClose({ side }: { side: Exclude<Drawer, null> })`.

- **LibraryShelfTitle** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:34), line 34. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function LibraryShelfTitle()`.

- **LibraryContents** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:37), lines 37–49. Keep account access visible while the book's chapters scroll independently above it.
  - Signature: `export function LibraryContents({ children, onSignOut }: { children: ReactNode; onSignOut: () => void })`.

- **ResponsiveLibrary** — [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:51), lines 51–156. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function ResponsiveLibrary({ bookTitle, location, children }: { bookTitle?: string; location: string; children: ReactNode })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:5), line 5: `import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:6), line 6: `import styles from "./responsive-library.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.
- [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:7), line 7: `import LibraryTutorial from "./LibraryTutorial";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:8), line 8: `import bookStyles from "./books.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.
- [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:9), line 9: `import { useRouter,usePathname } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.
- [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:10), line 10: `import { useStaffAccess } from "@/components/dashboard/StaffAccess";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:11), line 11: `import { useLibraryMemory } from "@/hooks/useLibraryMemory";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/principal/books/types.ts

[nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:1), lines 1–142. Source fingerprint SHA-256 prefix: `a4a8e12165bb12ad`.

Book/PageView/Command contracts plus tree and display helpers.

- **flattenPages** — [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:115), lines 115–117. BookPage[] → flat parent-first BookPage[] recursively, used for footer order.
  - Signature: `export function flattenPages(pages: BookPage[]): BookPage[]`.

- **findPagePath** — [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:122), lines 122–129. Page tree plus selected page ID → ancestor-to-node array, or empty array.
  - Signature: `export function findPagePath(pages: BookPage[], pageId: string): BookPage[]`.

- **streamLabel** — [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:138), lines 138–141. Stored name string → display-only normalized uppercase name with STREAM suffix if absent.
  - Signature: `export function streamLabel(name: string): string`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts:6), line 6: `import type { ReactNode } from "react";` — Type-only import: erased at build time; describes shapes for checking and does not run a function. React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.

#### Frontend: src/components/principal/books/usePageTurn.ts

[nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:1), lines 1–131. Source fingerprint SHA-256 prefix: `d2680401982cc7cf`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **snapshot** — [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:16), lines 16–38. Clone the current visual page for animation, including displayed form values. A clone is presentation only and must not become another live editable form. A temporary, inert picture of the visible DOM, not another mounted page.
  - Signature: `function snapshot(source: HTMLElement)`.

- **placeSnapshot** — [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:44), lines 44–51. Put an outgoing-page copy into an animation layer with the correct dimensions and scroll offsets.
  - Signature: `function placeSnapshot(target: HTMLElement, source: HTMLElement, incoming = false)`.

- **usePageTurn** — [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:57), lines 57–131. Own temporary animation layers and cleanup. The caller changes the real URL/content separately; this hook only makes the transition visible.
  - Signature: `export function usePageTurn(contentKey: string)`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:8), line 8: `import { useCallback, useLayoutEffect, useRef } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:9), line 9: `import { pageTurnFrames, pageTurnSchedule } from "./pageTurnMotion";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/principal/ClassCurriculum.tsx

[nedecen-web/src/components/principal/ClassCurriculum.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassCurriculum.tsx:1), lines 1–67. Source fingerprint SHA-256 prefix: `25ecd5714f8be073`.

Read-only class coverage and curriculum disclosures with guidance.

- **ClassCurriculum** — [nedecen-web/src/components/principal/ClassCurriculum.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassCurriculum.tsx:18), lines 18–67. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function ClassCurriculum({ schoolId, classId, classSubjectId, subjectName, onBack }: { schoolId: number; classId: number; classSubjectId: number; subjectName: string; onBack?: () => void; })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/ClassCurriculum.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassCurriculum.tsx:8), line 8: `import { useEffect, useState } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/ClassCurriculum.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassCurriculum.tsx:9), line 9: `import { api } from "@/lib/api";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/principal/ClassStreamsEditor.tsx

[nedecen-web/src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx:1), lines 1–31. Source fingerprint SHA-256 prefix: `21d25398bc45a41b`.

Fetches stream choices and computes shared/different subjects for split form fields.

- **ClassStreamsEditor** — [nedecen-web/src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx:8), lines 8–31. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function ClassStreamsEditor({ schoolId, classId, streams }: { schoolId: number; classId: number; streams: { id: number; name: string }[] })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx:2), line 2: `import { useEffect, useState } from 'react';` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx:3), line 3: `import { api } from '@/lib/api';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx:4), line 4: `import WrappingSelect from '@/components/shared/WrappingSelect';` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/ClassStreamsEditor.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/ClassStreamsEditor.tsx:5), line 5: `import styles from './books/books.module.css';` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/principal/move-learners.module.css

[nedecen-web/src/components/principal/move-learners.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/move-learners.module.css:1), lines 1–14. Source fingerprint SHA-256 prefix: `abbedffd549f5e86`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/principal/MoveLearners.tsx

[nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:1), lines 1–44. Source fingerprint SHA-256 prefix: `712e424db9e798da`.

Selected source learners and target class, reviewed transfer, confirmation and errors.

- **MoveLearners** — [nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:9), lines 9–44. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export default function MoveLearners({ schoolId, classId, sourceName, learners, destinations, onSaved, onClose, setBusy }: { schoolId: number; classId: number; sourceName: string; learners: Learner[]; destinations: { id: number; label: string }[]; onSaved: () => Promise<void>; onClose: () => void; setBusy: (busy: boolean) => void; })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:2), line 2: `import { useRef, useState } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:3), line 3: `import { api } from "@/lib/api";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:4), line 4: `import WrappingSelect from "@/components/shared/WrappingSelect";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:5), line 5: `import book from "./books/books.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.
- [nedecen-web/src/components/principal/MoveLearners.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/MoveLearners.tsx:6), line 6: `import styles from "./move-learners.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/principal/roster-import.module.css

[nedecen-web/src/components/principal/roster-import.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/roster-import.module.css:1), lines 1–19. Source fingerprint SHA-256 prefix: `613c719fc89cc2bc`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/principal/RosterImportModal.tsx

[nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:1), lines 1–171. Source fingerprint SHA-256 prefix: `fb193eaab1ec6e6e`.

File selection, editable preview, learner impact review, save and success state.

- **RosterImportPurpose** — [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:19), lines 19–21. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function RosterImportPurpose({ value, onChange, disabled }: { value: ImportPurpose; onChange: (value: ImportPurpose) => void; disabled?: boolean })`.

- **RosterImportModal** — [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:28), lines 28–171. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function RosterImportModal({ schoolId, kind, onClose: onDismiss, onSaved, classOptions = [], initialClassId = "", fixedClass = false, inline = false, purpose, onPurposeLocked }: { schoolId: number; kind: "staff" | "learners"; onClose: () => void; onSaved: () => Promise<void>; classOptions?: { value: string; label: string; academicYear?: number }[]; initialClassId?: string; fixedClass?: boolean; inline?: boolean; purpose?: ImportPurpose; onPurposeLocked?: (locked: boolean) => void; })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:3), line 3: `import AppSelect from "@/components/shared/AppSelect";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:10), line 10: `import MobileAction from "@/components/shared/MobileAction";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:11), line 11: `import { useEffect, useMemo, useRef, useState } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:12), line 12: `import { api } from "@/lib/api";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:13), line 13: `import { BottomSheet } from "@/components/shared/BottomSheet";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:14), line 14: `import { FloatingLabelSelect } from "@/components/shared/FloatingLabelSelect";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:15), line 15: `import { useModalMotion } from "@/hooks/useModalMotion";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/principal/RosterImportModal.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/RosterImportModal.tsx:16), line 16: `import styles from "./roster-import.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/shared/app-select.module.css

[nedecen-web/src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css:1), lines 1–45. Source fingerprint SHA-256 prefix: `11e85d24337177b8`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/shared/AppSelect.tsx

[nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:1), lines 1–123. Source fingerprint SHA-256 prefix: `651352961cf9ebcb`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **textOf** — [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:9), lines 9–11. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function textOf(node: ReactNode): string`.

- **readOptions** — [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:12), lines 12–18. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function readOptions(children: ReactNode): Option[]`.

- **AppSelect** — [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:22), lines 22–52. One chooser for every role. The hidden select preserves FormData and native required-field validation; the visible control never opens an operating-system dropdown.
  - Signature: `export default function AppSelect({ children, value, defaultValue, onChange, multiple, disabled, required, name, id: suppliedId, className = "", style, ...props }: SelectHTMLAttributes<HTMLSelectElement>)`.

- **SelectPanel** — [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:54), lines 54–123. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function SelectPanel({ id, label, options, selected, multiple, anchorRef, onChoose, onClose }: { id: string; label: string; options: Option[]; selected: string[]; multiple?: boolean; anchorRef: RefObject<HTMLButtonElement | null>; onChoose: (values: string[]) => void; onClose: () => void })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:3), line 3: `import { Children, isValidElement, useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes, type KeyboardEvent, type CSSProperties, type RefObject } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:4), line 4: `import { lockModalScroll, useModalMotion } from "@/hooks/useModalMotion";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx:5), line 5: `import styles from "./app-select.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/shared/BottomSheet.tsx

[nedecen-web/src/components/shared/BottomSheet.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/BottomSheet.tsx:1), lines 1–42. Source fingerprint SHA-256 prefix: `ced92ae49cc26717`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **BottomSheet** — [nedecen-web/src/components/shared/BottomSheet.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/BottomSheet.tsx:21), lines 21–42. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function BottomSheet({ isOpen, onClose, title, children, width = "sm", busy = false, motion: suppliedMotion }: BottomSheetProps)`.

Imports at the point you encounter them:

- [nedecen-web/src/components/shared/BottomSheet.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/BottomSheet.tsx:8), line 8: `import { useEffect, useId } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/shared/BottomSheet.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/BottomSheet.tsx:9), line 9: `import { lockModalScroll, useModalMotion, type ModalMotion } from "@/hooks/useModalMotion";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/shared/FloatingLabelSelect.tsx

[nedecen-web/src/components/shared/FloatingLabelSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/FloatingLabelSelect.tsx:1), lines 1–16. Source fingerprint SHA-256 prefix: `bad5a51505c38208`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **FloatingLabelSelect** — [nedecen-web/src/components/shared/FloatingLabelSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/FloatingLabelSelect.tsx:5), lines 5–16. Preserve the existing form API while sharing the app's accessible custom chooser.
  - Signature: `export function FloatingLabelSelect({ id, label, value, onChange, options, required, disabled }: { id: string; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; required?: boolean; disabled?: boolean; })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/shared/FloatingLabelSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/FloatingLabelSelect.tsx:2), line 2: `import AppSelect from "./AppSelect";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/components/shared/mobile-action.module.css

[nedecen-web/src/components/shared/mobile-action.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/mobile-action.module.css:1), lines 1–12. Source fingerprint SHA-256 prefix: `b54cb317301ac44d`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/shared/MobileAction.tsx

[nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:1), lines 1–47. Source fingerprint SHA-256 prefix: `24b6d8de20eb3f46`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **actionIconFor** — [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:7), lines 7–14. Use familiar symbols only; ambiguous workflow decisions keep their written labels.
  - Signature: `export function actionIconFor(label: string): ActionIcon | undefined`.

- **Icon** — [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:16), lines 16–33. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function Icon({ name }: { name: ActionIcon })`.

- **MobileActionContent** — [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:36), lines 36–39. Shared content also works inside a full-row button without nesting another button.
  - Signature: `export function MobileActionContent({ icon, children }: { icon: ActionIcon; children: ReactNode })`.

- **MobileAction** — [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:42), lines 42–47. Important workflow actions keep their labels; familiar utility actions stay compact.
  - Signature: `export default function MobileAction({ icon, label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ActionIcon; label: string; children?: ReactNode })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:1), line 1: `import type { ButtonHTMLAttributes, ReactNode } from "react";` — Type-only import: erased at build time; describes shapes for checking and does not run a function. React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx:2), line 2: `import styles from "./mobile-action.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/components/shared/Motion.tsx

[nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:1), lines 1–48. Source fingerprint SHA-256 prefix: `1a8ae5e305e15bf8`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **Collapse** — [nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:6), lines 6–10. A real height transition pushes following content down; closed controls leave the tab order immediately.
  - Signature: `export function Collapse({ open, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { open: boolean; children: ReactNode })`.

- **MotionTabs** — [nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:13), lines 13–34. Measure the actual selected button, including wrapped tabs and resized text. No fixed tab widths.
  - Signature: `export function MotionTabs({ active, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { active: string; children: ReactNode })`.

- **MotionPanel** — [nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:37), lines 37–48. Fade in the new view after data arrives, without cloning forms or delaying their state updates.
  - Signature: `export function MotionPanel({ changeKey, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { changeKey?: string | number; children: ReactNode })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx:3), line 3: `import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.

#### Frontend: src/components/shared/wrapping-select.module.css

[nedecen-web/src/components/shared/wrapping-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/wrapping-select.module.css:1), lines 1–12. Source fingerprint SHA-256 prefix: `c5272d36efb95df0`.

Presentation rules loaded by the importing component/root. CSS matching and cascade determine which declaration applies; no database mutation occurs.

#### Frontend: src/components/shared/WrappingSelect.tsx

[nedecen-web/src/components/shared/WrappingSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/WrappingSelect.tsx:1), lines 1–18. Source fingerprint SHA-256 prefix: `406b11de0f241d93`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **WrappingSelect** — [nedecen-web/src/components/shared/WrappingSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/WrappingSelect.tsx:7), lines 7–18. Labelled form variant of the same overlay chooser used throughout the app.
  - Signature: `export default function WrappingSelect({ label, value, options, onChange, disabled = false, placeholder = "Choose an option" }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; disabled?: boolean; placeholder?: string; })`.

Imports at the point you encounter them:

- [nedecen-web/src/components/shared/WrappingSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/WrappingSelect.tsx:2), line 2: `import { useId } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/components/shared/WrappingSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/WrappingSelect.tsx:3), line 3: `import AppSelect from "./AppSelect";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/components/shared/WrappingSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/WrappingSelect.tsx:4), line 4: `import styles from "./wrapping-select.module.css";` — Scoped CSS-module class map. styles.x selects a generated class, and the stylesheet supplies dimensions/colors/spacing; no API call occurs.

#### Frontend: src/hooks/useLibraryMemory.ts

[nedecen-web/src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts:1), lines 1–17. Source fingerprint SHA-256 prefix: `fb7f5836e0cd8e70`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **useLibraryMemory** — [nedecen-web/src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts:8), lines 8–17. Save completed URL changes, including filters; closing a tab also captures its latest URL.
  - Signature: `export function useLibraryMemory()`.

Imports at the point you encounter them:

- [nedecen-web/src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts:3), line 3: `import { useEffect } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.
- [nedecen-web/src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts:4), line 4: `import { usePathname, useSearchParams } from "next/navigation";` — Next routing imports: useRouter supplies push/replace; useSearchParams reads book/page/tab; usePathname reads the current route; redirect ends a server route by sending navigation. Reading a query is not a database request.
- [nedecen-web/src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts:5), line 5: `import { rememberLibraryLocation } from "@/lib/libraryMemory";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/hooks/useModalMotion.ts

[nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:1), lines 1–37. Source fingerprint SHA-256 prefix: `f8f067a3bc5e7925`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **lockModalScroll** — [nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:8), lines 8–16. Nested dialogs may unmount in either order; restore the page only after the last one closes.
  - Signature: `export function lockModalScroll()`.

- **useModalMotion** — [nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:19), lines 19–35. Keep the actual modal mounted during its short exit; cancel pending callbacks on navigation.
  - Signature: `export function useModalMotion(onDismiss: () => void)`.

Imports at the point you encounter them:

- [nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:3), line 3: `import { useCallback, useEffect, useRef } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.

#### Frontend: src/hooks/useTheme.ts

[nedecen-web/src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:1), lines 1–31. Source fingerprint SHA-256 prefix: `0d00174a3707b2c2`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **useTheme** — [nedecen-web/src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:7), lines 7–31. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function useTheme()`.

Imports at the point you encounter them:

- [nedecen-web/src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:5), line 5: `import { useEffect, useState } from "react";` — React imports describe/render components and their state. useState stores render state; useEffect starts post-render work/cleanup; useLayoutEffect measures before paint; useRef holds nodes/flags; useMemo caches derived values; useCallback keeps a callable identity; createContext/useContext share access/menu callbacks; useSyncExternalStore subscribes to viewport; useId creates stable accessibility IDs; Children/isValidElement inspect option elements; createElement builds JSX-equivalent nodes. ReactNode/HTMLAttributes/RefObject and other type-only names constrain code but do not execute.

#### Frontend: src/lib/api.ts

[nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:1), lines 1–233. Source fingerprint SHA-256 prefix: `675207357926a09a`.

JSON/multipart HTTP, in-memory token, cookie refresh, retry and revocation.

- **rememberAccessToken** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:25), lines 25–29. Token string and optional renewal flag → updates module memory/generation, removes old persisted tokens; no database write.
  - Signature: `export function rememberAccessToken(token: string, renewal = false)`.

- **currentAccessToken** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:30), lines 30–35. No args → in-memory token|null, with one-time legacy localStorage adoption.
  - Signature: `export function currentAccessToken()`.

- **revokeBrowserSession** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:36), lines 36–43. No args → fetch Promise; starts keepalive logout and immediately clears local session/cache.
  - Signature: `export function revokeBrowserSession()`.

- **getAccessToken** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:49), lines 49–52. Read the short-lived access token only in a browser. The window guard also allows this module to be imported during server rendering.
  - Signature: `function getAccessToken()`.

- **getRefreshToken** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:58), lines 58–61. Read only a legacy renewal credential for the one-time migration. New sessions use the HttpOnly cookie, which JavaScript cannot read.
  - Signature: `function getRefreshToken()`.

- **clearSession** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:67), lines 67–76. No args → clears memory, generation and local metadata; no account deletion.
  - Signature: `function clearSession()`.

- **refreshAccessToken** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:82), lines 82–115. Browser version takes no args, returns Promise<token|null> using shared request/cookie. Server version takes raw credential, checks stored hash/current account and returns Promise<new access token>.
  - Signature: `export async function refreshAccessToken(): Promise<string | null>`.

- **parseError** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:121), lines 121–124. Response → reads JSON if possible then throws Error, so awaiting form code enters catch.
  - Signature: `async function parseError(res: Response)`.

- **shouldRefresh** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:130), lines 130–132. Path and HTTP Response → boolean allowing one non-auth401 retry.
  - Signature: `function shouldRefresh(path: string, res: Response)`.

- **uploadRequest** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:138), lines 138–168. Path, FormData, optional retry flag → Promise of parsed JSON after optional single auth renewal/retry.
  - Signature: `async function uploadRequest<T>(path: string, formData: FormData, retry = true): Promise<T>`.

- **request** — [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:174), lines 174–212. Path, RequestInit options, retry flag → Promise of parsed JSON or thrown error.
  - Signature: `async function request<T>( path: string, options: RequestInit = {}, retry = true, ): Promise<T>`.

#### Frontend: src/lib/auth.ts

[nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:1), lines 1–167. Source fingerprint SHA-256 prefix: `09f2f231a4ded0f5`.

Login/category routing, metadata, resume validation and shared logout.

- **decodeToken** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:17), lines 17–24. Token string → parsed claim object or empty object; decoding does not verify signature.
  - Signature: `function decodeToken(token: string): Record<string, unknown>`.

- **login** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:30), lines 30–58. username/password → Promise of account category after staff, learner, manager attempts; remembers memory token and navigation metadata.
  - Signature: `export async function login( username: string, password: string ): Promise<"person" | "learner" | "manager">`.

- **logout** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:63), lines 63–72. No input in browser helper; resets location, dispatches cookie revocation and removes metadata. Backend same-name function instead takes raw token and returns Promise<void> after deleting its hash.
  - Signature: `export function logout()`.

- **getAccountType** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:77), lines 77–80. Read the remembered account category for UI routing, or null during server rendering.
  - Signature: `export function getAccountType(): "person" | "learner" | "manager" | null`.

- **getRole** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:86), lines 86–89. Read the stored staff role for display/routing. Never use this browser value as the backend's authorization decision.
  - Signature: `export function getRole(): string | null`.

- **getSchoolId** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:95), lines 95–100. Convert the stored school string back into a number. Missing/non-numeric values mean there is no usable school selection.
  - Signature: `export function getSchoolId(): number | null`.

- **getAccountId** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:105), lines 105–110. Read the numeric account identity remembered after login, with a browser-only guard.
  - Signature: `export function getAccountId(): number | null`.

- **isLoggedIn** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:116), lines 116–119. No arguments → boolean local UI session hint, not server proof.
  - Signature: `export function isLoggedIn(): boolean`.

- **getRedirectPath** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:124), lines 124–132. Account category and role → base local dashboard path.
  - Signature: `export function getRedirectPath( accountType: "person" | "learner" | "manager", role: string | null ): string`.

- **getResumePath** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:135), lines 135–138. Account category and role → remembered safe local library path or base route.
  - Signature: `export function getResumePath(accountType: "person" | "learner" | "manager", role: string | null): string`.

- **restoreSavedSession** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:142), lines 142–154. No arguments → Promise<local path|null>; renews cookie session when needed and verifies account match.
  - Signature: `export async function restoreSavedSession(): Promise<string | null>`.

- **loginManager** — [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:159), lines 159–167. username/password → Promise<void> after manager authentication and memory/metadata storage.
  - Signature: `export async function loginManager(username: string, password: string)`.

Imports at the point you encounter them:

- [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:6), line 6: `import { api, refreshAccessToken, rememberAccessToken, currentAccessToken, revokeBrowserSession } from "./api";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.
- [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:7), line 7: `import { rememberedLibraryLocation, resetActiveLibraryLocation, type LibraryRole } from "./libraryMemory";` — Local application dependency. The imported named helper/component/type is implemented in the corresponding source module indexed here or identified in the scenario. Components are invoked when rendered; service functions when called; type-only names do not execute.

#### Frontend: src/lib/libraryMemory.ts

[nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:1), lines 1–84. Source fingerprint SHA-256 prefix: `ac8c5c77c5cfdd1b`.

Supporting module referenced by the scenarios; its complete source range is linked above.

- **identity** — [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:11), lines 11–22. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function identity(mode?:LibraryRole)`.

- **libraryLocation** — [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:25), lines 25–41. Rebuild a local URL from known navigation parameters. Never redirect to arbitrary saved text.
  - Signature: `export function libraryLocation(role: LibraryRole, value: string): string | null`.

- **read** — [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:43), lines 43–48. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `function read(key: string): Memory`.

- **rememberLibraryLocation** — [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:50), lines 50–64. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function rememberLibraryLocation(value: string)`.

- **rememberedLibraryLocation** — [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:66), lines 66–76. This supporting declaration is available to its callers. Its parameters are shown verbatim below; the cited source contains its body. Only the calls named in the walkthrough are part of the principal scenario.
  - Signature: `export function rememberedLibraryLocation(role: LibraryRole, book?: string): string | null`.

- **resetActiveLibraryLocation** — [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:79), lines 79–84. Explicit sign out returns to the library next time; per-book page choices are retained.
  - Signature: `export function resetActiveLibraryLocation()`.

#### Frontend: tsconfig.json

[nedecen-web/tsconfig.json](C:/Users/Kgodiso/source/repos/nedecen-web/tsconfig.json:1), lines 1–34. Source fingerprint SHA-256 prefix: `5c51df4c59f4510d`.

Supporting module referenced by the scenarios; its complete source range is linked above.

### Reading/verification record

The main walkthrough was resolved from 226 source-reference markers, with further helper/style references added during review. The atlas indexes 123 source/configuration files across the two working repositories. References were resolved from actual file text; complete function/import ranges were read from the TypeScript syntax tree. Source fingerprints above identify the working-copy versions rather than claiming uncommitted work is a released Git commit.

No live data was changed, no app behavior was edited, and no server was started to produce this document. The walkthrough was checked against the active registry, routes, services, styles and migration source. It is not a claim of a new live end-to-end test of every scenario or a full security audit.
