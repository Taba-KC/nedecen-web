# Shared dropdowns

All selectable dropdown fields now use `src/components/shared/AppSelect.tsx`.
This includes principal forms and filters, roster import purpose and class choices,
teacher homework fields and lesson filters, and the curriculum manager's selectors.
`WrappingSelect` and `FloatingLabelSelect` are labelled variants of the same control.

On larger screens the choices slide into a rounded floating panel beside the field.
On phones they slide up in a sheet with space around its edges. Both use a dark
backdrop while open. Text wraps, long lists scroll, and lists of more than eight
options include search. Opening takes 180 ms and closing takes 140 ms; reduced-motion
preferences disable those animations.

The active field stays illuminated through a rounded cut-out in the backdrop. It stays
in its original position. Clicking that field again, clicking outside the choices, or
pressing Escape dismisses the chooser. The chooser header has no redundant cross icon.

The chooser supports arrow keys, Home/End, type-ahead, Enter/Space, Escape and focus
return. Multi-select fields show a selection mark and a Done button. Escape closes
only the chooser, leaving any underlying form dialog open.

The component accepts the existing select-style props and option children. Its hidden
native select exists only to preserve FormData, repeated values in multi-selects,
change events and required-field validation. It is never shown or used to open the
operating system's option popup. A required-field failure focuses the custom chooser.

Use `AppSelect` for future dropdowns instead of adding another visible native select.
Keep labels visible or supply `aria-label`. Existing lesson/activity browsing dialogs
remain custom dialogs; date and time inputs retain their existing behavior.

On the inline learner import page, `WorkspacePage` owns the selected purpose and puts
`RosterImportPurpose` beside the title. Its label and box stay together as a row. On
narrow screens the row wraps below the title. Purpose is locked while an import is
being previewed or saved, so changing it cannot discard reviewed work accidentally.

Browser checks: `scripts/test-custom-dropdowns-browser.cjs` covers desktop, portrait
tablet and phone geometry, backdrop opacity, keyboard use, focus return, searchable
multi-select FormData, required validation inside dialogs, and teacher/manager fields.
Screenshots are written to `.next/custom-dropdown-screenshots/` using mocked API data.
