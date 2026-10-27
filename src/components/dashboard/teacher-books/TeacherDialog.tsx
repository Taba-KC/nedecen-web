"use client";

/**
 * Reusable native modal for teacher workflows. The parent opens it by rendering it and
 * closes it by removing it. showModal runs after mounting; busy can block accidental
 * dismissal during a save.
 */
import { useEffect, useId, type ReactNode } from "react";
import { lockModalScroll, useModalMotion, type ModalMotion } from "@/hooks/useModalMotion";
import styles from "@/components/principal/books/books.module.css";

export default function TeacherDialog({ title, onClose, busy = false, children, motion }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode; motion?: ModalMotion }) {
  const ownMotion = useModalMotion(onClose);
  const { ref, close } = motion ?? ownMotion;
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog) dialog.inert = false;
    dialog?.showModal();
    const unlock = lockModalScroll();
    return () => { dialog?.close(); unlock(); };
  }, [ref]);
  return <dialog ref={ref} className={`${styles.dialog} motion-dialog`} aria-labelledby={titleId} onCancel={event => { event.stopPropagation(); event.preventDefault(); if (!busy) close(); }} onClick={event => { if (event.target === ref.current && !busy) close(); }}>
    <header><h2 id={titleId}>{title}</h2><button type="button" disabled={busy} onClick={close} aria-label="Close dialog">×</button></header>
    {children}
  </dialog>;
}
