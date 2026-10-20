# Principal book workspace

The principal uses `/dashboard/principal?book=grades&page=class-11` as a single workspace. Existing principal routes redirect here. Query parameters identify the book, page and optional view tab, so links, refresh and browser history preserve location. With no selected book, the library opens with an empty contents panel.

`BookWorkspace.tsx` owns navigation, the ring spine, the bookshelf, loading and errors. `WorkspacePage` is the only content surface. It renders a `PageView`: headings, statistics, lists, tabs, actions and optional shared workflow widgets. Books do not supply their own page layouts or route components.

To add a feature, add a `BookDefinition` in `books/registry.ts`. Supply its shelf metadata, `load`, `pages` and `view` functions. To add a feature within a book, add a `BookPage` in its page tree and resolve that page into a `PageView`. Stable page IDs identify entities; display numbers come from the current tree. Flattening the tree supplies Previous and Next navigation at any depth.

The open book's `color` also supplies the workspace's `--book-accent`. CSS derives light selection backgrounds, darker text and button fills from it. Contents, tabs, the selected shelf book, page navigation, focus rings and shared workflow buttons inherit this palette. The neutral library uses the default accent. Active headings retain an inset marker and heavier text, so selection is not conveyed by color alone. New books inherit the theme from their registry color without additional styling.

Simple actions use one native dialog with declarative fields and API commands. Imports reuse the roster editor inline on dedicated pages, including editable preview and duplicate skipping. Subject curriculum uses the existing read-only curriculum widget. Requests are scoped to the current book and cancelled logically on navigation so late responses cannot overwrite the destination. A revision reloads the book after a mutation.

Turns use the Web Animations API and temporary inert DOM snapshots of the visible page, without mounting another page component. Forward turns lift the current content and rotate it toward the left spine until it disappears edge-on. Backward turns hold the outgoing content underneath while the incoming sheet unfolds from the spine and settles flat; destination content is copied onto it as soon as it is ready. Navigation starts the motion immediately, independently of data loading. Larger jumps show up to six sheets within 200 ms. Only transforms and opacity animate. Reduced-motion preferences disable or cancel the animation, and rapid navigation cancels and clears previous snapshots.

The timetable is excluded. System Streams has an explicit empty state because the backend has no system-stream catalogue. Learner transfers and curriculum timing/coverage metrics require backend support; the UI does not fabricate those actions or values. Curriculum is currently a browser of the existing library.

Run `node scripts/test-principal-books.cjs`, `npx tsc --noEmit`, and ESLint for the modified files. The model checks use an in-memory API and do not access or modify school records. The repository production build currently requires access to Google Fonts for the root layout's Geist font.
