# Teacher UI design

The Create homework page is the reference for the teacher workspace. Keep the four-book hierarchy and the shared principal book shell.

- Use serif page titles and restrained sans-serif section headings and body text.
- Use short contextual sentences, with the current lesson, chapter or allocation in bold.
- Put filters beside the page title and the main section action at the right of its heading.
- Lesson feedback uses a title-row dropdown for the latest 10 confirmed lessons. Default to the latest lesson and show its concepts, already expanded. Learners respond with “I get it” or “I don’t get it”; homework has no understanding feedback.
- Frame section headings with thin horizontal rules. Separate rows with spacing, rather than a border or card for every item.
- Give every page body a shared 24px inset below the title divider. When a section is the first body element, reuse that divider as its top rule instead of drawing a second nearby line. Forms do not add another top inset.
- Use the active book colour for filled primary buttons. Text actions are bold with no underline.
- Show compact summaries on the page. Truncate long names to one line and provide View for full details in a native modal.
- Align dates and select controls beside their labels; allow wrapping on narrow screens.
- Put creation and editing fields in focused Save/Cancel modals. Closing a modal does not save its unsaved values.
- Planning shows the first 10 untaught concepts across chapter boundaries in curriculum order. Concepts added from lesson feedback appear in addition, checked by default and freely uncheckable. Saving respects the selection and consumes the reviewed suggestions without changing the original confirmed lesson or its coverage.
- Adding a custom concept offers all currently assigned chapters, followed by topics belonging to the selected chapter. Switching chapters resets the topic; editing restores both choices. The wrapping dropdowns stay inside the dialog on small screens. Modal Save stages a class-specific concept; Save lesson plan persists it under its actual chapter and topic without changing the shared curriculum.
- Concepts carry shared prerequisite skills and measurable learning outcomes, with at most five of each. Planning reads them directly from the curriculum. View opens them without generation status, AI requests or per-class edits. Curriculum manager edits the shared source, including after saving or uploading it.
- Planned lessons reflect current shared guidance. Confirming a lesson records a historical snapshot; earlier confirmed lessons keep their original history. Expand a planned lesson to show its concepts indented beneath its title, then use each concept's View button for guidance. Long concept names wrap in this list. The confirmation modal only selects what was taught; it has no duplicate View actions. Prerequisites are advisory and never automatically select concepts or change coverage.

Shared section headings, compact concept rows and modal styling live in `src/components/dashboard/teacher-books`. Shared styles apply only to the teacher workspace; the principal workspace remains the source of the book shell.
