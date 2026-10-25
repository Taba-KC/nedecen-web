"use client";

/**
 * Reusable native modal for teacher workflows. The parent opens it by rendering it and
 * closes it by removing it. showModal runs after mounting; busy can block accidental
 * dismissal during a save.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "@/components/principal/books/books.module.css";

export default function TeacherDialog({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onCancel={event => { event.stopPropagation(); if (busy) event.preventDefault(); else onClose(); }} onClick={event => { if (event.target === ref.current && !busy) onClose(); }}>
    <header><h2 id={titleId}>{title}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close dialog">×</button></header>
    {children}
  </dialog>;
}
