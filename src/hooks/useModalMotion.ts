"use client";

import { useCallback, useEffect, useRef } from "react";

let scrollLocks = 0;
let originalOverflow = "";
/** Nested dialogs may unmount in either order; restore the page only after the last one closes. */
export function lockModalScroll() {
  if (scrollLocks++ === 0) { originalOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--scrollLocks === 0) document.body.style.overflow = originalOverflow;
  };
}

/** Keep the actual modal mounted during its short exit; cancel pending callbacks on navigation. */
export function useModalMotion(onDismiss: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
  const close = useCallback(() => {
    if (timer.current) return;
    const node = ref.current;
    if (!node?.open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onDismiss(); return; }
    node.setAttribute("data-motion-closing", "");
    node.inert = true;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (node.isConnected) onDismiss();
    }, 140);
  }, [onDismiss]);
  return { ref, close };
}

export type ModalMotion = ReturnType<typeof useModalMotion>;
