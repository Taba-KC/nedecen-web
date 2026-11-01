# Chapter 4 - Assigning a class manager to Grade 9B

**Starts:** The completed Chapter 3 screen is open: Grade 9B, class id 179, Learners selected, no class manager assigned.

**Ends:** After Edit class → Class manager → Mr Kgodiso Taba → Save, the page displays **Class manager: Mr Kgodiso Taba**, matching your last screenshot.

This chapter explains the tabs, buttons, fields, chooser rows, messages, and navigation involved. When a control is rendered, I explain its appearance and handler wiring. I enter a handler's body only when that action occurs in this task. For example, Subjects is visible, but these screenshots do not show a Subjects click, so I will not pretend its request ran.

The lesson is based on this checkout's source and your screenshots, not a new live assignment performed for this document. I have not edited school data. Copies of the five supplied screenshots are preserved alongside this chapter.

We retain the valid signed-in principal session and desktop layout. The school and Grade 9 database ids are not visible; I call them S and G9. The selected staff member's numeric id is also not visible; I call it M. These stand for actual numeric values, not strings sent literally in a request.

The description shown in your edit screenshots is ABCDEFGHIJKLMNOPQRSTUVWXYZ. In this task you keep that text and class label B unchanged, choose the manager, and save successfully.

This distinction matters throughout:

~~~text
The user-facing name: Mr Kgodiso Taba
The selected form value: String(M)
The saved relationship: classes.class_teacher_id = M
~~~

## 1. At the starting screen, where did the controls come from?

We begin after the page has already rendered. The following is the code that produced the UI at that render boundary, not a new fetch triggered by simply looking at the screen.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 118 - 122)

For a class page, the view function used the current class record as entity, found its parent grade, and searched data.people for a person matching entity.classTeacherId.

At the start that relationship is null. No staff id equals null, so manager is undefined.

The URL has book=grades&page=class-179 and no tab parameter. subjectsSelected is false, so the view used the class's learners endpoint. Its returned items list is empty, as established in Chapter 3.

### Guidance, manager text, actions, and tabs

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 135 - 152)

The returned view describes:

| Visible element | Value supplied by the view |
| --- | --- |
| Instruction paragraph | To manage subjects in this class, click the Subjects tab. |
| Manager paragraph | No class manager assigned. Use Edit class to choose one. |
| Top actions | Edit class, Delete class. |
| Tabs | Learners, Subjects. |
| Section heading/count | Class register, with zero rows. |
| Section action/link | Add learner, or Bulk import learners. |
| Empty-state paragraph | Your class register is empty. Choose Add learner or Bulk import learners to get started. |

These are ordinary object properties describing what the shared renderer should display. The class view does not contain a separate handcrafted HTML page for each school class.

The manager paragraph is view.description. It is not the class's saved description text. The saved text is entity.description, used to prefill the edit form.

### Rendering the two tabs

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 175)

WorkspacePage renders its title and controls. Because this view has tabs and does not request a dropdown, it maps tabs to buttons inside MotionTabs.

tab is empty, so both active and aria-pressed calculations fall back to the first tab's id, learners. This is why Learners is selected without a tab=learners URL parameter.

The buttons receive onClick callbacks that would call onTab. The first tab supplies undefined, meaning the default; the second supplies subjects. These callbacks are registered, not called now.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 341 - 341)

The parent supplied onTab as a callback to navigate with the same book/page and a chosen tab. Assigning a class manager does not invoke it.

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 13 - 33)

MotionTabs renders a container and indicator span. Its layout effect finds the selected button, reads its offsets and dimensions, and sets CSS properties describing the indicator's position/size.

A layout effect runs after DOM changes and before the browser's next paint. ResizeObserver keeps the measurement current when elements resize; it is a browser API, not a server request.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 11 - 13)

These rules use --tab-x, --tab-y, --tab-width, and --tab-height to position the moving highlight. The data-tab-ready attribute tells the CSS when measurement is available.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 130 - 132)

The local rules supply tab spacing, text sizes, selected colour/background, and stronger selected weight.

Although they look like tabs, the current implementation renders a group of buttons with aria-pressed. It is the React state/URL plus the view function that selects content; there are not two independent browser pages already loaded side by side.

### Rendering Edit and Delete

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 145 - 155)

contextAction passes each action to MobileAction. actionClass chooses filled or outline styling.

The edit action's explicit filled variant gives it the solid accent treatment. Delete's explicit outline variant gives it the outlined treatment. An onClick arrow function is stored for each.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 7 - 14)

actionIconFor recognises Edit and Delete and supplies their icon identifiers.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 16 - 46)

MobileAction creates a type=button element with accessible label/title, forwarded event props, and optional SVG/icon/text spans.

The SVG path describes vector geometry; it is not an image request. Desktop styling hides the compact icon span and shows the action text.

(File: [src/components/shared/mobile-action.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/mobile-action.module.css), lines 1 - 12)

The base .icon rule hides those icons on desktop. Compact media rules can reveal them and adjust which labels remain visible.

Rendering Delete does not call DELETE. Its command merely contains a function that could be run after a later confirmation workflow.

### Rendering the empty register and import link

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 177 - 189)

The section renderer filters rows by the current search query and renders the count. Empty rows produce count 0 and the view's empty-state paragraph.

The Add learner action has an alternative, so contextAction renders the word or and a Bulk import learners Link beside it.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 131 - 135)

pageHref constructs that link's address by copying current query parameters, setting page=import-179, and removing tab. Building a URL does not open it.

The class view has no import property, so RosterImportModal is not mounted merely because the link or sidebar child exists.

Search is not displayed for this empty register because there is neither an explicit searchable flag nor more than five rows.

## 2. You click Edit class

The browser finds the button under the pointer. React dispatches the click through capture and bubble phases.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 145)

The surrounding library's capture handler runs first. An Edit class button is neither a shelf book button nor, on our desktop path, a compact contents-menu selection, so its drawer-changing branches do not affect this action.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 151 - 154)

The clicked action's onClick callback invokes activate(action).

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 141 - 144)

activate checks whether the action has a pageId. The edit action does not; it calls onCommand with the command object rather than changing pages.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 341 - 341)

onCommand is the parent's setCommand state setter.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

After React renders with command set, CommandDialog mounts. The parent supplies refresh as its onSaved callback and a callback that clears command as dismissal.

There is no edit-form network request here. The command already has defaults constructed from the loaded class/staff records.

### The existing class determines the initial field values

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 139 - 140)

The edit action was prepared with classCommand(schoolId,data,grade,entity). The fourth argument is the existing class, which distinguishes this invocation from Chapter 3's create invocation.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 57 - 62)

The helper chooses the label Edit class.

For the class-label field it takes the stored name 9B, removes an optional Grade prefix, then removes this grade's numeric prefix. The displayed editable part is B.

The manager default is String(cls.classTeacherId ?? ""). It is "" because the saved relationship is null.

The description default is String(cls.description ?? ""), which contains your saved alphabet text. This confirms why that text reappears here even though the class page displays manager information instead.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 21 - 22)

text/select construct field-description objects. Manager is optional and Description is an optional textarea with maximum length 200.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 130 - 142)

optionsOf maps the already fetched school staff records to choices. Each option has:

- value: the person's id converted to a string.
- label: its readable name, built where needed from title, firstName, and surname.

For Mr Kgodiso Taba the value is String(M), not the displayed words. The screenshot does not disclose M, so we do not invent a number.

The option list comes from the earlier /schools/S/people response. Clicking Edit does not fetch each person's name again.

## 3. The native Edit class dialog mounts

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 68 - 74)

The dialog calls useModalMotion and renames the returned ref to dialog and close to onClose.

It establishes busy=false, error="", selection={}, and a submitting ref set to false. State controls rendering; refs hold mutable values without requesting their own renders.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

The motion hook creates the dialog/timer refs and its close callback, and registers timer cleanup. Creating the callback does not close the dialog.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 94 - 110)

The JSX contains:

- A dialog with accessible title linkage.
- A form whose onSubmit is submit.
- Edit class heading and an × button.
- The label input, manager AppSelect, and description textarea.
- Cancel and Save controls.
- An error paragraph only if an error exists.

The fields use defaultValue. For native label/description controls this means browser-owned current values rather than per-keystroke React state. We leave both unchanged.

Save is type=submit. Cancel and × are type=button, so they do not submit the form.

The dialog-level click handler only requests closure when event.target is the dialog itself and busy is false, such as an appropriate backdrop-area click. Clicking an ordinary input is not the same target.

onCancel handles the native cancel request, normally Escape, prevents its default and calls animated close when not busy. No cancel happens on our path.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

After commit the effect calls showModal and lockModalScroll.

showModal is the browser's native modal API. It places the dialog in the top layer and prevents ordinary interaction with the outside document. The browser manages modal focus behaviour.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

The first scroll lock remembers the body's prior overflow and sets overflow:hidden. Its returned release function will only release once, and restores scrolling only after the final active lock ends.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 198 - 206)

CSS centres the paper-coloured dialog, limits width/height, adds border/radius/shadow/padding, styles the header and controls, and dims the backdrop.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 15 - 22)

The shared open-modal animation plays unless reduced motion disables it.

![Screenshot 1: Edit class with saved label and description, before choosing a manager](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-4-01-edit-class.png)

## 4. AppSelect initially displays Choose an option

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 102 - 102)

The manager field creates AppSelect with name=classTeacherId, defaultValue="", disabled linked to busy, and an onChange callback for the dialog's selection dictionary.

Its children start with an empty-valued Choose an option, then the staff options.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 22 - 29)

AppSelect uses an id for accessible linkage, refs for its trigger/native select, and internal state holding selected value [""].

No controlled value prop was supplied, so selected comes from internal. open is false and invalid is false.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 9 - 18)

readOptions walks React children using Children.toArray and isValidElement. It extracts values/text/disabled state. textOf recursively extracts readable text from children.

These React library calls inspect element descriptions. They do not look up database records.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 36 - 50)

summary finds the selected empty option and displays Choose an option.

The visible trigger is a type=button combobox with a chevron. A hidden native select carries the actual named field and current value for FormData.

The trigger references the future option-list id through aria-controls and reports aria-expanded=false. open=false means the SelectPanel component is not mounted yet.

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 1 - 9)

CSS hides the native select and styles the trigger, text truncation, chevron, focus, and disabled state. The closed chevron has no rotation.

The manager relationship remains null in PostgreSQL. We have only opened an edit form.


## 5. You click the manager trigger

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 46 - 46)

The visible button's onClick invokes showChoices. Because type is button, this action does not submit Edit class.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 30 - 35)

showChoices obtains the trigger's associated label, clones it, and removes nested custom-select/SVG elements from that copy. This leaves the text Class manager rather than including every option label.

cloneNode creates a temporary DOM copy for reading; the clone is not inserted as a visible second control.

The label is selected from aria-label when supplied, otherwise the cleaned label text, otherwise Select an option.

setLabel stores Class manager and setOpen(true) requests another render.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 45 - 50)

The trigger now reports aria-expanded=true and the conditional includes SelectPanel. It passes current options/selected state, an anchor ref, onChoose, and onClose callbacks.

The original Edit class dialog stays mounted. The chooser is an additional dialog, not a replacement route.

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 5 - 6)

The expanded attribute rotates the chevron 180 degrees with a 160ms transition, unless reduced-motion styling removes that transition.

## 6. The chooser computes its option state

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 54 - 68)

SelectPanel creates refs for its native dialog, list, and optional search input.

It uses useModalMotion for animated closing, with a custom dismissal callback that closes the native panel before telling AppSelect to hide it.

It establishes:

| Value | Initial result here |
| --- | --- |
| query | Empty string. |
| active | Index of the currently selected empty option, normally 0. |
| position | Empty style object before measurement. |
| typeahead.current | Empty text/time bookkeeping for future keyboard actions. |
| visible | All options, since every label includes an empty search string. |
| available | Visible choices that are not disabled. |
| current | active clamped to a valid available index. |

selected and active are different:

- selected identifies the form's current value.
- active identifies the highlighted/focused choice in the chooser.

A highlighted person need not yet be selected.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 114 - 121)

The component returns a native dialog with a heading, optional search, and a scrollable listbox.

Each option div gets a unique id, role=option, aria-selected from selected.includes(value), aria-disabled, and data-active from the active row.

The second span shows a tick only for a selected value. Since this is single-select, unselected people do not get the multi-select circle marker.

Your displayed choices are Choose an option plus six staff entries. The options.length>8 condition is false for those seven choices, so the search input is absent. No Done button is shown because multiple is false.

The list is focusable with tabIndex=0 and describes its active descendant by id. Keyboard callbacks are registered, but our task uses pointer movement and clicking, not typing/arrow-key selection.

## 7. After commit, the second modal is positioned and opened

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 69 - 90)

The layout effect gets the mounted chooser dialog, stores it in panelNode, and calls showModal.

The browser places this second modal above the existing Edit class modal. Only the active top modal is normally interactive.

It calls lockModalScroll again.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

The lock count increases from the edit dialog's existing lock to a second lock. The original body's overflow is not overwritten because the function only captures it for the first lock.

Later, closing the chooser will release one lock while leaving the edit dialog's lock in place.

### Measuring the anchor

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 75 - 81)

place reads anchorRef.current, the original manager trigger.

getBoundingClientRect returns its viewport-relative position and dimensions. The width calculation clamps the panel width between an intended minimum of 320px, maximum of 480px, and available viewport width minus 32px.

These are CSS pixels; screenshot pixels can differ with display scaling/browser zoom.

getComputedStyle reads the trigger's calculated border radius. parseFloat obtains its numeric value, using 0 if none is usable.

These are browser layout/style APIs. Reading them requires a mounted element, which is why this work belongs in a layout effect rather than before rendering.

### Why the original field stays visually lit

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 82 - 86)

place constructs an SVG string covering the viewport. Its mask contains:

- A white rectangle covering the mask.
- A black rounded rectangle matching the trigger's position and size.

The dark overlay is drawn through that mask, leaving a cut-out at the trigger. encodeURIComponent embeds the SVG safely inside a data:image/svg+xml URL.

**This is locally generated vector markup, not a downloaded screenshot, a server request, or an AI-generated image.**

The computed background URL is stored in --select-backdrop. This CSS custom property controls the panel's backdrop.

The underlying trigger remains the real field. A visual hole in the overlay does not make it a second active control above the modal; the chooser's backdrop still governs interaction there.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 84 - 86)

Our desktop path skips the phone placement return.

The function reads dialog.scrollHeight, caps the height estimate to viewport height minus 32px, then calculates left/top:

- left tracks the trigger but stays within a 16px viewport margin.
- top prefers 8px below the trigger, adjusting upward if the panel would extend beyond the bottom.

setPosition supplies those measured inline styles and the backdrop custom property.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 88 - 90)

The effect calls place immediately, registers a resize listener for later repositioning, and focuses the list. It would focus a search input only for more than eight options.

It returns cleanup to remove the listener, close the chooser, and release its scroll lock.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 92 - 92)

A normal effect then finds the active option and calls scrollIntoView with block:nearest, making that option visible if needed without forcing an unnecessary large scroll.

This can run again when the active row or search query changes.

### The chooser's CSS

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 10 - 24)

The panel has fixed positioning, a paper background, rounded border, shadow, and Arial-based text. Its open state uses flex layout so the options region can scroll.

The backdrop uses --select-backdrop supplied by the SVG calculation. The options list has a capped height, overflow-y:auto, and overscroll containment.

data-active gives a row its soft accent background. aria-selected gives the selected row its accent text/background. These can match different rows at the same time.

The marker span reserves room for the tick, keeping labels aligned.

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 28 - 39)

The entrance uses opacity and a small vertical translation. Separate exit/backdrop keyframes are available for closing. Reduced-motion preference disables these animations.

![Screenshot 2: the manager chooser is open, with the empty option still selected](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-4-02-manager-chooser.png)

No API request has been needed to open or position this chooser. It is displaying the staff options already in memory.

## 8. You move the pointer over Mr Kgodiso Taba

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 118 - 118)

The row's onPointerMove handler finds that option's index in available and calls setActive.

React renders again with that active index. data-active moves to Mr Kgodiso Taba, and aria-activedescendant identifies that row.

The selected array has not changed. The tick can remain next to Choose an option.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 92 - 92)

The active-index change can run the scroll-into-view effect again.

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 20 - 24)

The active background makes Mr Kgodiso Taba look highlighted while the selected-empty row retains its own selection treatment and tick.

![Screenshot 3: Mr Kgodiso Taba is highlighted, while the tick still marks Choose an option](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-4-03-manager-hover.png)

The third image is consistent with active-row highlighting. It is not evidence of a database assignment by itself. This is why hover, selection, and Save must be followed separately.

## 9. You click that person: the form selection changes

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 118 - 118)

The option's click handler calls preventDefault and invokes the local choose(option).

The chooser dialog's bubbling onClick handler stops propagation. The surrounding library's capture handler has already had its chance to inspect the event; on this desktop chooser click it has no matching shelf action.

Stopping propagation helps contain this interaction within the chooser rather than forwarding an ordinary bubbling click to surrounding dialog handlers.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 93 - 97)

The chosen person is not disabled. With multiple false, choose calls onChoose with a one-element array containing the option value:

~~~text
[String(M)]
~~~

The visible label is not the submitted value.

This onChoose prop points to AppSelect's outer choose function. We enter it before returning to the panel's close call.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 37 - 44)

The outer choose reads native.current, its hidden select.

It loops through the native option elements, setting option.selected according to whether their value is included in the new array.

It calls setInternal(next) and setInvalid(false), then dispatches:

~~~ts
new Event("change", { bubbles: true })
~~~

Event is a browser constructor. dispatchEvent synchronously sends that native event through the DOM event system. bubbles:true allows React's change-event handling to receive it.

The code deliberately synchronises both layers: a native select that works with forms and React internal state that controls the visible summary.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 102 - 102)

The onChange passed by CommandDialog receives the select's current value and updates selection:

- current => ... is a functional state updater.
- ...current copies other dictionary entries.
- [field.name] is a computed property name.
- Here that name is classTeacherId and its value is String(M).

This selection dictionary supports optional previews. The class-manager field has no preview, so it does not mount SelectionPreview or start a preview request.

The form's selected native value is what Save will later read. selection is not a database write.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 25 - 36)

On rerender, internal contains String(M), so selected contains that value and summary becomes Mr Kgodiso Taba.

The defaultValue prop still originally came from the null saved relationship, but a default is only the initial value. It does not reset the internal selection on every rerender.

Label B and the description textarea retain their DOM values. No class has been saved yet.

## 10. Only the chooser closes

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 93 - 97)

Returning to SelectPanel.choose, !multiple is true, so it calls its motion close callback.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 23 - 33)

With ordinary motion, close marks the chooser data-motion-closing and inert and starts a 140ms timer. With reduced motion it can dismiss immediately.

The inert marker prevents another interaction while the exit remains visible.

(File: [src/components/shared/app-select.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/app-select.module.css), lines 14 - 15)

Those attributes activate the chooser's exit animation and backdrop fade. The parent Edit class dialog has not received its own close request.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 56 - 60)

When the motion hook invokes this panel's dismissal callback, it calls panelNode.current.close() first, releasing the top modal's native restrictions before restoring focus.

It then invokes the AppSelect onClose callback.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 50 - 50)

That callback sets open=false and calls trigger.current.focus(). Focus returns to the actual manager field.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 69 - 91)

The chooser unmounts. Its cleanup removes resize handling, closes its native dialog if needed, and releases its scroll lock.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

The lock count drops by one. It does not restore body scrolling yet because Edit class is still open and owns the remaining lock.

(File: [src/components/shared/AppSelect.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/AppSelect.tsx), lines 45 - 50)

The trigger's summary remains Mr Kgodiso Taba, aria-expanded is false, and the chevron rotates back.

![Screenshot 4: the chooser is closed, but the selected manager has not yet been saved](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-4-04-manager-selected.png)

The background page can still say No class manager assigned… at this moment. That page reflects loaded saved data, while the dialog contains an unsaved selection.

Cancel or × would discard this selection if used now. We proceed with Save.


## 11. Save collects the complete form, not just the changed field

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 108 - 108)

You click the edit form's submit button. Native form validation checks required controls before a submit event proceeds. B is present; Class manager and Description are optional.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 79 - 88)

submit prevents native navigation, skips the custom-content branch, and checks the immediate submitting ref.

It constructs FormData from event.currentTarget, the form. The hidden native select is named classTeacherId and enabled, so it participates despite being visually hidden.

Array.from, string filtering, and Object.fromEntries produce the values dictionary. The loop trims every configured field and checks required ones.

The resulting values are:

~~~text
label          = "B"
classTeacherId = String(M)
description    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
~~~

This dictionary contains the complete form fields. It is not a description of just the field that changed.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 89 - 90)

submitting.current becomes true, busy becomes true, and error is cleared. The controls/dismissal buttons can now rerender as disabled, and Save says Saving….

FormData was collected before disabling the controls. The subsequent disabled state does not erase the values already read.

The handler awaits command.run(values,formData).

## 12. The edit command builds a PATCH request

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 63 - 65)

The run callback uses its remembered Grade 9 and existing class entity.

It uppercases/trims B and combines it with grade.number, giving name="9B".

The duplicate check excludes item.id===cls.id. This matters: finding the very class being edited is not a duplicate conflict. Another matching class in the grade would cause a local error before fetch, but there is none on this successful path.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 66 - 69)

The payload includes:

| Property | Value |
| --- | --- |
| name | "9B" |
| classTeacherId | Numeric M |
| description | "ABCDEFGHIJKLMNOPQRSTUVWXYZ" |

Number(values.classTeacherId) converts the string option value to its numeric id. That positive id is truthy, so the OR fallback does not choose null.

The description remains non-empty after trimming, so it is preserved rather than replaced with null.

Because cls exists, the ternary chooses api.patch at:

~~~text
/schools/S/grades/G9/classes/179
~~~

It does not use the create POST branch. The staff member's displayed name is not sent as the relationship value.

There is no streamId property. Omission means this form is not requesting a stream update.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 226 - 227)

api.patch serialises the payload to JSON and calls the shared request helper with method PATCH.

**PATCH** represents editing the existing resource identified by the URL. This form happens to send all three of its editable fields even though you only changed the manager.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 190)

request checks the legacy refresh value and obtains the current access token. For this normal valid session there is no preliminary refresh call.

fetch receives the configured API base plus the class path, JSON text, Content-Type:application/json, Authorization:Bearer [token], and credentials:include.

This is an HTTP API call to the Express backend, distinct from a Next.js route navigation. The browser may perform an OPTIONS preflight first if needed for the cross-origin PATCH.

While it waits, the browser can paint Saving…. await pauses this handler's continuation, not the browser's entire event/rendering machinery.

## 13. Backend middleware authenticates and checks the class's scope

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

CORS handles the relevant preflight/response headers. The actual PATCH passes security/no-store response headers, JSON parsing into req.body, and method/path logging.

Middleware registration occurred at startup; the registered functions execute now for the request.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 66 - 86)

The login/refresh/onboarding-specific limiters do not match this resource. Router mount order sends the longer class URL through the earlier matching grades prefix before the classes router.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 12 - 19)

The grades prefix invokes requireAuth and requireSchoolAdmin, validates the school id, and checks it against caller.schoolId.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

requireAuth verifies the bearer signature/expiry using jwt.verify with HS256 allowed, queries the current staff row for the account/school, checks account setup, updates the role, attaches req.caller, and calls next.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

The administrative middleware computes live access, checks the requested school, and selects write capabilities because the method is PATCH.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 17)

staffAccess reads the current person, administrative grants, active allocations, and eligible chapter assignments. A principal passes based on the live role.

The selected manager is not the caller used here. The caller authenticates the principal performing the edit; M identifies the person being assigned.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 29 - 38)

The classes prefix repeats token/access checks, validates the grade id and caller school, and confirms the grade row belongs to that school.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 39 - 44)

This edit URL also includes :classId, unlike the creation URL in Chapter 3.

The more specific middleware validates class id and queries for class 179 with gradeId=G9. It calls next only when that relationship exists.

Thus the target is checked through school → grade → class, not just by accepting any numeric class id.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 160 - 179)

The PATCH handler itself repeats requireAuth and requireSchoolAdmin, converts all three URL parameters to numbers, and confirms the school exists through getSchoolById.

On the current mounting path these common permission checks can run three times: grades prefix, classes prefix, and PATCH route.

(File: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts), lines 33 - 36)

The school-existence helper selects the matching school and returns the row or null. It returns the existing school on our path, so execution continues in the PATCH handler.

It calls updateClassSchema.safeParse(req.body).

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 52 - 57)

This Zod schema allows optional fields for name, streamId, classTeacherId, and description.

name must be non-empty if supplied; the numeric relationships must be positive integers or null; description is trimmed and limited to 200 characters or null.

Our submitted name/manager/description pass. streamId remains absent. TypeScript types do not do this checking; safeParse performs runtime validation.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 182 - 184)

The handler awaits updateClass(179,result.data).

## 14. updateClass changes the existing row

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 145 - 155)

The service selects the existing class and rejects if absent. It copies the submitted fields into updates.

Because data.name is present—even though unchanged—it reads the current grade, normalises the name, and checks uniqueness while excluding this same class id.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 37 - 49)

normalizeClassName strips optional Grade/grade-number prefixes and whitespace, uppercases the identifier, requires letters, and rebuilds the canonical name.

For 9B in Grade 9 it still returns 9B.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 55 - 65)

ensureUniqueClassName queries rows with this grade/name. The existing class is present in the result, but its id equals the exceptClassId argument, 179, so it is excluded from the duplicate decision.

This is why saving an unchanged label does not fail with “already exists”.

### The transaction

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 158 - 169)

db.transaction creates a transaction-bound tx. It acquires the workflow advisory lock pg_advisory_xact_lock(7411,0).

The truthy-streamId branch is skipped because streamId was not supplied.

The update query sets updates on the row where classes.id=179 and requests the updated row with returning(). It does not insert a new class or generate a new id.

Conceptually its changed relationship is:

~~~text
Before: class 179 → class_teacher_id null
After:  class 179 → class_teacher_id M
~~~

The same statement also writes the supplied unchanged name/description fields.

(File: [Project-Edu-Revo/src/db/schema/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/classes.ts), lines 15 - 23)

The pre-existing schema maps classTeacherId to class_teacher_id, a nullable foreign key referencing people.id. PostgreSQL checks that a non-null referenced person id exists.

The class row stores M, not a copy of “Mr Kgodiso Taba”. The person's name continues to live in the people record.

The actual updateClass code does not perform an additional selected-manager school/role query here. The chooser supplied school staff from data.people; the route checked the caller and target class; the foreign key checks the referenced person's existence. These checks have different jobs.

### Why subject synchronisation does not run for this edit

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 163 - 167)

The entire stream-related block is guarded by:

~~~ts
if (data.streamId !== undefined)
~~~

Our payload omitted streamId, so this is false.

The service therefore does not delete/change stream links, increment streamRevision for a stream change, call saveClassStreams, or call syncClassSubjects on this path.

This differs from creation in Chapter 3, where syncClassSubjects ran after every insertion. Assigning the class manager is also not assigning a subject teacher: those use other relationships and workflows.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 168 - 169)

The callback returns updated. Drizzle commits on success and resolves the transaction Promise with that row. A transaction error would roll back instead.

At commit the manager relationship is persistent even if the browser has not yet shown the new name.

## 15. The server responds, then the dialog requests refresh

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 182 - 195)

The route serialises the updated class with res.json. Its ordinary successful status is 200, rather than creation's 201.

The duplicate/invalid-name catches do not run on our successful path.

The response row contains classTeacherId=M and still has id 179, name 9B, and the saved description.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 192 - 211)

The successful Response does not trigger token refresh or parseError. res.json parses its body and fulfils api.patch.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 68 - 69)

saved receives the updated record, and run returns class-179 again. This string still identifies the same book page.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 90 - 92)

submit awaits onSaved(class-179), then calls the motion-aware onClose. finally resets the immediate submitting guard and busy.

The catch would show an Error message if save failed; it does not run here. Seeing the chosen person in the input before Save was not this success boundary; the server response/commit is.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 315 - 318)

onSaved is refresh. It requests navigate(book.id,class-179) and increments revision.

Despite async, refresh has no await for the subsequent load effect. Its Promise resolves after scheduling navigation/state changes. Awaiting it does not mean every reload request or final paint has completed.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 309)

navigate constructs the same book/page URL. Because the destination equals the current page, its selection-change condition does not request a page-turn animation.

It still calls router.push with scroll:false and clears the search query. Exact handling of a same-URL navigation/history entry is Next.js/browser behaviour; the crucial refresh trigger here is the revision increment.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 23 - 33)

The edit dialog's own close callback marks it inert/data-motion-closing and starts its 140ms exit timer, or dismisses immediately with reduced motion.

This is now the outer modal closing, unlike the chooser-only closure earlier.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 358 - 358)

The timer's dismissal calls setCommand(null), removing the dialog on the next render.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 74 - 74)

Effect cleanup closes the native dialog and releases its scroll lock.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

The final lock release restores the original body overflow. The data reload can finish before or after this short exit. We wait for the settled page, not just the disappearing dialog.


## 16. The revision change reloads the saved records

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 237)

loaded has the previous revision; current revision is now incremented. The equality check fails, so the old data is not treated as the new successful dataset.

The selected URL is still class-179, but matching fresh data/view may not be ready. Loading output can appear. React may batch updates and the modal may still be exiting, so this is not a guaranteed separately visible screenshot.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 239 - 246)

The load effect reruns because revision is a dependency. Cleanup marks an old invocation cancelled; the new invocation calls book.load with the school id.

The cancelled flag ignores obsolete results. It does not itself cancel a fetch already on the network.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 95 - 100)

The school helper reads and converts the stored school id. The backend will still verify it.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 100 - 102)

Promise.all starts structure(S), the school's streams GET, and its people GET.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 47 - 50)

structure retrieves/sorts grades, then requests class lists per grade and flattens the arrays.

The normal five-grade book reload therefore performs eight feature GETs:

~~~text
/schools/S/grades
/schools/S/streams
/schools/S/people
/schools/S/grades/[each of five grade ids]/classes
~~~

No second PATCH is needed to paint the result, and the chooser does not need to stay open while these reads happen.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 224)

The shared helpers attach the current bearer token, use fetch, check statuses, and parse JSON. Promise.all preserves result positions even if network responses finish in a different order.

### Backend paths used by the reload

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 87)

The shared middleware and mounted routers process these new GETs.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

Each applicable requireAuth again verifies the token/current staff account.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

Each administrative guard again checks current access and school ownership, using read capabilities for GET.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 14 - 27)

The grades prefix and exact GET validate the request and school, then return its grades.

(File: [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts), lines 14 - 16)

The grade service selects and orders those rows.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 26 - 31)

The stream prefix checks access and matching school.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 82 - 96)

Its GET repeats route-level checks, confirms the school, and calls the stream-list service.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 21 - 23)

The service returns this school's streams.

(File: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts), lines 57 - 64)

The staff-list GET checks token/access/school and invokes getPeopleBySchool.

(File: [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts), lines 27 - 61)

That service returns the staff display fields and related counts/grants, including each person's id/title/firstName/surname. It does not expose password hashes.

Mr Kgodiso Taba's row is available in this returned array as id M.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 31 - 38)

Class-list requests also pass grades-prefix checks, then this classes-prefix ownership check.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 107 - 123)

Their exact GET confirms parameters/school and calls getClassesByGrade.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 90 - 125)

This query returns Grade 9B with classTeacherId=M. The left-joined class-manager fields can now contain the person's names instead of null.

The query also returns the saved alphabet description and learnerCount 0. The particular view we are following uses data.people for the manager lookup, rather than the joined manager-name columns.

After the routes serialise responses and the browser parses them, the combined load result contains both sides needed for the relationship:

~~~text
Class 179: classTeacherId = M
Staff row: id = M, title = "Mr", firstName = "Kgodiso", surname = "Taba"
~~~

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 243 - 245)

The load callback stores the new data/revision and clears load errors. React renders with a matching loaded object.

## 17. The same navigation tree selects the same class

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 103 - 108)

book.pages rebuilds grade/class/import nodes from the returned records.

The manager edit does not add a class or import child. It produces the same ids and hierarchy as before, with updated entity data.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 115 - 129)

flattenPages creates reading order, and findPagePath finds the selected node's ancestors.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 236)

flat.find matches the same page id class-179. Its new pageKey includes the new revision, so a view generated for the old revision is not taken as the completed new view.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 326)

The left panel remains Grade 9 → Grade 9B → Bulk import learners, with Grade 9B active and 13 pages in this captured tree.

The page count is unchanged because assigning a manager changes a relationship, not the number of navigation nodes.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 39 - 45)

Contents recursively renders its buttons. Matching active gives Grade 9B aria-current="page" and currentHeading. These buttons are available for future navigation; no heading click is part of this edit.

## 18. The new class view resolves the manager's name

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

With book, data, and page ready, the view effect calls book.view again for class-179 with tab="".

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 118 - 122)

This time data.people.find(person=>person.id===entity.classTeacherId) finds the row with id M.

manager is now an object rather than undefined.

subjectsSelected remains false. The same view invocation awaits:

~~~text
GET /schools/S/classes/179/learners
~~~

The manager was found before this await, but the view does not return its final paragraph until the awaited register result arrives. That is one reason there can be a delay after the book's class/staff arrays have returned.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 224)

The standard API path sends the bearer-authenticated GET and parses its result.

(File: [Project-Edu-Revo/src/routes/learners.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/learners.ts), lines 69 - 79)

The learners route authenticates/authorises, confirms class 179 belongs to school S by joining classes and grades, confirms the school exists, and calls getLearnersByClass.

This URL has no /grades/ segment, so it does not match the earlier grade/classes prefix path used by PATCH.

(File: [Project-Edu-Revo/src/services/learnerService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/learnerService.ts), lines 34 - 40)

The service queries the class register, with class/stream-selection joins, and orders learner rows by surname.

No learner was added in this task, so the array is still empty.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 135 - 143)

The view keeps the Learners guidance, actions, tabs, and empty register, but its manager-dependent description now takes the successful branch:

~~~text
"Class manager: " + nameOf(manager)
~~~

This is the meaning of the source template literal.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 130 - 130)

nameOf builds an array [title,firstName,surname], filters absent/falsy parts, and joins the remaining strings with spaces.

For the row in your screenshot it produces Mr Kgodiso Taba.

The name was not recovered from the selected text that happened to remain in the closed dialog. It is rebuilt from freshly loaded saved relationship data.

### Other action objects are prepared again, not executed

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 139 - 152)

The view prepares Edit class, Delete class, Add learner, and the import alternative again.

Edit's next default manager value will now be String(M). The description default remains the alphabet text.

The potential Manage streams command is not selected for the Learners section. Creating its element/command description does not mount a stream editor or assign subject teachers.

items is empty, so no Move learners action or learner-row actions are produced.

## 19. React returns the finished page and the browser paints it

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 253 - 254)

The completed view is stored with matching keys and no view error. React requests another render.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 333 - 346)

The parent renders the same breadcrumbs and class title and supplies the refreshed PageView to WorkspacePage.

Pagination still says Page 2.1 · Grade 9B. Previous and Next correspond to neighbouring nodes in flat; they do not add/subtract decimal numbers from 2.1.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 158 - 175)

The header still renders Learners selected, Subjects unselected, Edit class filled, and Delete class outlined.

The paragraph expression renders view.description, now:

~~~text
Class manager: Mr Kgodiso Taba
~~~

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 177 - 189)

The section still has Class register, zero count, Add learner, Bulk import learners, and the empty-register paragraph.

There is still no roster-import component mounted and no learner row to display.

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 13 - 33)

After these controls are committed, MotionTabs measures the selected Learners button and positions its indicator. Its ResizeObserver maintains correct placement if dimensions change.

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 37 - 47)

MotionPanel can play the short opacity/translation entrance for the ready, non-stale view. It skips that for reduced motion and cleans up animations/listeners appropriately.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 79 - 145)

CSS styles the sticky header, Georgia title, flex action layout, description paragraphs, register count/empty message, tabs, and pagination.

CSS controls the paragraph's appearance, not whether it names a manager. The view's data lookup and conditional produced that content.

The browser calculates layout, paints, and composites the settled result. It is not continuously calling updateClass or rerunning the PATCH while the screen is idle.

![Screenshot 5: the saved manager is displayed on the Grade 9B page](C:/Users/Kgodiso/source/repos/nedecen-web/docs/assets/chapter-4-05-manager-saved.png)

## 20. Accounting for the rest of the visible controls

The following source produces the surrounding controls when this workspace renders. We identify their wiring without following unperformed clicks into additional workflows.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 320 - 333)

The top bar supplies:

- NEDECEN / School workspace: a Next.js Link to the principal library root.
- Principal's library: selected from the live access value.
- Sign out: a button with the registered logout-and-return callback.

The breadcrumb displays the book and its last two page-path nodes. Grade 9 is a parent navigation button; Grade 9B is current text with aria-current. Merely showing that button does not navigate back to Grade 9.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 329)

The contents area uses details/summary for Chapters & Headings, the book title/page count, the recursively rendered heading buttons, and the short navigation instruction.

The browser owns native details disclosure behaviour. No disclosure click is performed here.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 37 - 49)

The bottom contents menu provides Navigation help and Sign out. A teaching/administration switch is conditional on access.canTeach and the additional access condition.

The screenshots do not show a teaching switch; this screen is not proof that every principal always gets one. Class-manager assignment alone does not create a teaching allocation.

Navigation help's callback is registered to request the guide. It is not invoked in this task, so there is no tutorial restart.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 346 - 356)

The bottom page controls register Previous/Next navigation callbacks.

The right bookshelf maps book definitions to cover buttons and descriptions. Each cover carries a readable Open [book] label and selected state. Clicking another book is a separate action; rendering these six covers does not fetch all six books.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 131 - 155)

The class register's Bulk import learners link points to import-179. Its onNavigate callback would prevent default framework navigation and delegate to the workspace navigation helper. It is not a file upload and it is not clicked here.

A production Link may prefetch framework route data. Such prefetching is not the same as mounting an import form or creating database learners.

### The two kinds of “tabs”

Learners and Subjects are application controls rendered by WorkspacePage. The browser tabs/address bar/toolbars in the screenshots belong to the browser itself, outside this application's React tree.

The lesson's application source references account for the school UI. They do not claim that your browser's tab-strip buttons are implemented in this repository.

## 21. The complete change, traced through its representations

| Stage | Value or behaviour |
| --- | --- |
| Starting saved class | classTeacherId is null. |
| Opening Edit | Empty manager default is shown; saved label/description are prefilled. |
| Hovering over the person | active changes; the empty option can still have the selected tick. |
| Clicking the person | AppSelect/native select holds String(M); no save request yet. |
| Clicking Save | FormData supplies String(M); the command converts it to numeric M. |
| Request | PATCH the existing class 179 with name, manager id, and description. |
| Database | Update classes.class_teacher_id to M; retain the same class identity. |
| Refresh | Read current class/staff data and the class register again. |
| View | Find staff row id M, then format its title/first name/surname. |
| Final paragraph | Class manager: Mr Kgodiso Taba. |

The request sequence caused by this successful logical path is one class PATCH, a normal eight-GET book reload for five grades, and the class learner GET. Framework requests, preflights, development Strict Mode, refocusing the browser window, and retries can add activity; these static screenshots do not establish a packet-by-packet count.

Opening, highlighting, selecting, and closing the chooser were local browser/React work using existing option data. Saving was the persistent backend operation.

The URL is still book=grades&page=class-179, the navigation still has 13 pages, the description text is retained for editing, and the register still has zero learners. We end after the manager's name is visible on the settled page.

