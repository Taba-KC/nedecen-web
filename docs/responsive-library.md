# Responsive library navigation

The principal, teacher and learner libraries share `src/components/principal/books/ResponsiveLibrary.tsx` and `responsive-library.module.css`. Existing book pages and the shared paper layout are retained.

## Behaviour

| Screen | Navigation |
| --- | --- |
| Phone | A first login opens **Your library**. Opening a book restores its last visited page (the first page for a new book) and slides its contents into view. The book title bar opens contents from the left and the shelf from the right. |
| Tablet portrait | A wide paper page stays centred with small outer margins, visible binder rings and layered page edges. Contents (360px) and the bookshelf (400px) slide in as floating panels with a 16px screen inset, rounded corners and soft shadows. A darker backdrop (45% opacity) dims the rest of the screen without moving the paper. |
| Tablet landscape / desktop | The existing three columns remain visible: contents, paper, bookshelf. |

Phone drawers leave 28 pixels of the underlying screen visible at the opposite edge. Opening a book on a phone or portrait tablet automatically slides its contents into view, introducing the pages available to explore. Choosing a page closes contents and shows that page; ordinary page changes do not reopen the menu. Selecting a book from the shelf closes the shelf and introduces that book's contents, including when reopening the current book. Tablet shelves are at most 400 pixels wide. The visible background is dimmed and cannot be interacted with until the drawer closes. Tapping the dimmed area, pressing Escape or using the close button dismisses a drawer.

All roles' book toolbars contain breadcrumbs without a Close book control. The library icon opens the bookshelf. Page-turn controls use icons on phones, and accessible names remain available to assistive technology.

On phones the paper fills the viewport width. Its outer binder trim is hidden, while inner reading padding remains. Learner concept actions use outlined buttons with regular-weight text.

Workspace titles use 28px on larger screens and 24px on phones. On phones, body and concept text use a 14–15px reading scale, with 16px form inputs to avoid focus-zoom.

## Remembering where you left off

`src/lib/libraryMemory.ts` stores the most recent dashboard address and the most recent address for each book. Storage is separated by account type, account ID, school and role, and stays on this browser/device. `src/hooks/useLibraryMemory.ts`, called by the shared shell, saves page and URL filter changes. The three workspace navigation functions restore a book's saved address when its cover is selected. Deleted subject pages fall back to the current first page.

Opening `/` while still signed in restores the last dashboard location. `src/lib/auth.ts` checks session expiry and uses the API client's existing refresh operation if necessary; unsuccessful renewal shows sign in. The API remains responsible for authorization. Explicit sign out resets the initial destination to the library but retains each book's page choice. A different account gets its own history.

Only known local dashboard addresses and navigation parameters can be restored. Unavailable/corrupted browser storage falls back to ordinary navigation. This is navigation memory, not autosave for unfinished forms. Teacher homework method and lesson-feedback selections, principal tabs and learner history filters are included in the URL.

When registering a new book, add its ID to the role's allowlist in `libraryMemory.ts` too. This keeps remembered destinations limited to supported books.

## Where to edit

- `ResponsiveLibrary.tsx` owns viewport mode, the title bar, temporary drawer state, focus trapping, background `inert`, focus restoration and scroll locking.
- `responsive-library.module.css` owns widths, animation, dimming, paper positioning and compact action presentation. Reduced-motion preferences disable sliding transitions.
- `BookWorkspace.tsx`, `teacher-books/TeacherBookWorkspace.tsx` and `learner-books/LearnerBookWorkspace.tsx` wrap their existing markup with the shared component. The `data-library-*` attributes identify their real contents, shelf and paper regions. They are not duplicate navigation trees.
- `shared/MobileAction.tsx` gives utility actions phone-only icons with full accessible names, tooltips and 44px touch targets. Add, import, confirm and homework actions keep written labels alongside their icons. Desktop and tablet labels remain. Learner concept actions, history filters, and principal class Subjects-tab actions retain their labels; class Edit/Delete actions become icons on phones.
- `LibraryDrawerClose` closes its corresponding panel. Only one drawer opens at a time; choosing a page dismisses contents on phones and portrait tablets.

Phone mode covers widths up to 600 pixels, and compact landscape windows up to 1000 pixels wide and 500 pixels high. Tablet portrait covers portrait widths from 601 through 1200 pixels. Other viewports retain the desktop layout. These are viewport rules rather than user-agent detection, so resizing and rotation work without a reload.

Registering another book in an existing role's book registry automatically gives it the same responsive navigation. Book-specific content and backend operations do not need to know which menu is open.

## Verification

`scripts/test-responsive-library.cjs` uses Playwright with isolated API fixtures. It checks all three roles, phone library-first navigation, drawer widths, book/page selection, backdrop and Escape dismissal, keyboard focus containment/restoration, centred portrait paper, overlay contents and shelves, retained page scroll, landscape columns, narrow phones, rotation and horizontal overflow. Screenshots are written to `.next/responsive-library-screenshots`.

With the frontend running at port 3001 and Playwright available:

```powershell
node scripts/test-responsive-library.cjs
```

`PLAYWRIGHT_MODULE` can point to an existing Playwright installation; `PLAYWRIGHT_CHANNEL` chooses an installed browser (default `msedge`). `LEARNER_UI_URL` changes the frontend URL. No real user feedback or account data is changed.

`node scripts/test-library-memory.cjs` checks account/school separation, safe destinations, explicit sign out, session renewal and storage failures. `node scripts/test-library-memory-browser.cjs` checks reopening each role's books, closing/reopening the app entry point, retained filters and homework methods, explicit deep links, removed-page fallback and mobile title sizes using isolated browser data.

Also run the existing principal, teacher and learner book checks, ESLint, TypeScript and the production build when modifying the shared shell.

All three bookshelf roles use `LibraryContents` in `src/components/principal/books/ResponsiveLibrary.tsx`. Its shared Sign out footer stays at the bottom of the left menu on every screen size; chapters and account details scroll independently above it. Sign out uses the existing logout handler to clear the session and return to sign in.


## Phone polish, 27 October 2026

The phone workspace retains the full-width paper, book accents and temporary menus. It now uses consistent 20px reading insets, readable secondary text, 44px or larger action targets, rounded controls and predictable spacing. Principal register actions sit below their record; longer teacher concepts wrap. Learner supporting buttons remain labelled and aligned with their concept statement. Forms stack labels and controls when space is limited.

Roster previews retain the desktop table but display labelled record cards on phones, using the same inputs and save logic. The curriculum manager and account setup screens have matching touch sizes and readable input text. Desktop layouts remain intact; familiar editing/deletion controls stay compact on phones.

`scripts/test-mobile-polish-browser.cjs` exercises principal books, teacher planning/confirmation/homework, learner lessons/homework/syllabus, the manager editor and entry screens with isolated API fixtures at 320, 360, 390, 768 and 1600 pixels. Screenshots are saved under `.next/mobile-polish-screenshots/`. Set `MOBILE_WIDTH` to inspect one workspace width, or `MOBILE_ENTRY_ONLY=1` to check entry screens alone.
