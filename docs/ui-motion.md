# Interaction motion

All roles share `src/app/motion.css`, imported by the root layout. Standard changes take 140–220ms: dialogs enter in 180ms and exit in 140ms; tab highlights and disclosures move in 200ms; new content fades in over 160ms. Existing book page turns keep their 340ms treatment.

`src/components/shared/Motion.tsx` provides:

- `Collapse`: wraps content that should push following content down while opening. Keep it mounted and pass `open`; do not conditionally remove it or add `hidden`. Closed children become inert and hidden from assistive technology immediately. Put padding inside its inner content so the collapsed height can reach zero.
- `MotionTabs`: measures the selected button and slides the book-coloured highlight to it, including when labels wrap or the screen resizes. Buttons still own their existing ARIA state, keyboard handling and callbacks. Keep the tabs mounted across view changes.
- `MotionPanel`: fades changed content without remounting its form. Change `changeKey` when the displayed view changes, not on every keystroke. For remote views, supply the new key after data arrives.

`src/hooks/useModalMotion.ts` keeps the real dialog mounted during dismissal, then calls the existing close callback. All close paths in one dialog should use that same hook: header, footer, Escape and successful Save. `TeacherDialog` can own the hook or receive a caller's `motion` object when its form needs to close itself. Closing makes the dialog inert, blocks duplicate interaction, and cancels pending close callbacks if navigation unmounts it. Save/validation logic still runs immediately; closing never saves a draft.

Principal commands, teacher/learner dialogs, roster import sheets and the older staff workspace use the same native dialog effects. Side-menu backdrops fade while the existing menus slide. Curriculum manager and other native `details` disclosures use progressive CSS height transitions where supported; older browsers retain normal instant disclosures. See [the browser API documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::details-content).

Reduced-motion preferences disable CSS transitions/animations and content fades; modal dismissal is immediate. Manager remove, replace and discard confirmations use the same animated sheets. Only the browser’s own leave/reload warning remains browser-controlled.

Check `scripts/test-ui-motion-browser.cjs` for actual intermediate animation states, cancellation, form preservation and reduced motion. Existing role/book, learner workflow, responsive navigation and lesson-confirmation checks remain relevant.
