"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LearningNotification } from "@/hooks/useNotifications";
import styles from "./notifications.module.css";

export function NotificationBadge({ count, cover = false, label = "unread notifications" }: { count: number; cover?: boolean; label?: string }) {
  return count > 0 ? <span data-notification-badge className={`${styles.badge}${cover ? ` ${styles.coverBadge}` : ""}`}><span aria-hidden="true">{count > 99 ? "99+" : count}</span><span className="sr-only">{count} {label}</span></span> : null;
}

export default function Notifications({ items, error, loading, saving, onRefresh, onRead, onOpen }: {
  items: LearningNotification[]; error: string; loading: boolean; saving: boolean;
  onRefresh: () => void; onRead: (ids: string[]) => Promise<void>; onOpen: (item: LearningNotification) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const unread = items.filter(item => !item.read);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={styles.container} ref={container}>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><span>Notifications</span><NotificationBadge count={unread.length} />
    </button>
    {open && <section id={panelId} className={styles.panel} aria-label="Notifications">
      <div className={styles.heading}><h2>Notifications</h2><button type="button" disabled={!unread.length || saving} onClick={() => void onRead(unread.map(item => item.id))}>Mark all as read</button></div>
      {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={onRefresh}>Try again</button></div>}
      {loading ? <p className={styles.empty} role="status">Loading notifications…</p> : !items.length ? <p className={styles.empty}>You’re up to date. New lesson and homework updates will appear here.</p> : <ul className={styles.list}>{items.map(item => <li key={item.id} className={item.read ? undefined : styles.unread}><button type="button" onClick={() => { if (!item.read) void onRead([item.id]); setOpen(false); onOpen(item); }}>
        {item.context && <span className={styles.context}>{item.context}</span>}<span>{item.message}</span><span className={styles.action}>{item.action} <span aria-hidden="true">→</span></span>{!item.read && <span className="sr-only">Unread</span>}
      </button></li>)}</ul>}
    </section>}
  </div>;
}
