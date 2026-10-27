"use client";

/**
 * Reusable overlay that becomes a centred panel on desktop and a bottom sheet on smaller
 * screens. It handles presentation and body-scroll locking; its children own their form
 * values and save actions.
 */
import { useEffect, useId } from "react";
import { lockModalScroll, useModalMotion, type ModalMotion } from "@/hooks/useModalMotion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "xl";
  busy?: boolean;
  motion?: ModalMotion;
}

export function BottomSheet({ isOpen, onClose, title, children, width = "sm", busy = false, motion: suppliedMotion }: BottomSheetProps) {
  const ownMotion = useModalMotion(onClose);
  const { ref, close } = suppliedMotion ?? ownMotion;
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (isOpen && dialog) { dialog.inert = false; dialog.removeAttribute("data-motion-closing"); dialog.showModal(); }
    else dialog?.close();
    const unlock = isOpen ? lockModalScroll() : () => {};
    return () => { dialog?.close(); unlock(); };
  }, [isOpen, ref]);
  return <dialog ref={ref} className="motion-dialog motion-sheet glass-panel modal-panel" data-width={width} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) close(); }} onClick={event => { if (event.target === ref.current && !busy) close(); }}>
    <div className="motion-sheet-body">
      <header className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h2 id={titleId} className="text-base font-semibold">{title}</h2>
        <button type="button" disabled={busy} onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full text-sm" aria-label="Close">✕</button>
      </header>
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
    </div>
  </dialog>;
}
