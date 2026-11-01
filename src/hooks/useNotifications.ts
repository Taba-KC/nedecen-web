"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export type LearningNotification = {
  id: string; message: string; action: string; bookId: "lessons" | "homework";
  pageId: string; subjectId?: number; lessonId?: number; activityId?: number;
  tab?: "upcoming" | "completed" | "latest" | "previous";
  context?: string; date: string; read: boolean;
};

/** Notification failures stay separate from lesson loading and saving. */
export function useNotifications(role: "staff" | "learners", data: unknown, onChanged: () => void) {
  const [items, setItems] = useState<LearningNotification[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const changed = useRef(onChanged);
  const signature = useRef<string | null>(null);
  const sequence = useRef(0);
  const pending = useRef(false);
  useEffect(() => { changed.current = onChanged; }, [onChanged]);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    const attempt = ++sequence.current;
    try {
      const next = await api.get<LearningNotification[]>(`/${role}/me/notifications`);
      if (attempt !== sequence.current) return;
      const nextSignature = next.map(item => item.id).sort().join("|");
      if (signature.current !== null && signature.current !== nextSignature) changed.current();
      signature.current = nextSignature;
      setItems(next); setError("");
    } catch (err) { if (attempt === sequence.current) setError(err instanceof Error ? err.message : "Could not load notifications."); }
    finally { if (attempt === sequence.current) setLoading(false); }
  }, [role]);
  useEffect(() => {
    if (!data) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const check = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { ++sequence.current; clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, [data, refresh]);
  const markRead = useCallback(async (ids: string[]) => {
    if (!ids.length || pending.current) return;
    pending.current = true; setSaving(true);
    // Invalidate an older poll before applying confirmed read receipts.
    ++sequence.current;
    try {
      for (let offset = 0; offset < ids.length; offset += 500) {
        const result = await api.post<{ ids: string[] }>(`/${role}/me/notifications/read`, { ids: ids.slice(offset, offset + 500) });
        setItems(previous => previous.map(item => result.ids.includes(item.id) ? { ...item, read: true } : item));
      }
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not mark notifications as read."); }
    finally { pending.current = false; setSaving(false); }
  }, [role]);
  const unread = items.filter(item => !item.read);
  return { items, unread, error, loading, saving, refresh, markRead };
}

/** Clear only alerts whose actual content is visible, after a short reading interval. */
export function useViewedNotifications(ids: string[], markRead: (ids: string[]) => Promise<void>) {
  const key = JSON.stringify(ids.sort());
  useEffect(() => {
    const visible = JSON.parse(key) as string[];
    if (!visible.length) return;
    const workspace = document.querySelector<HTMLElement>("[data-library-workspace]");
    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible" && workspace && !workspace.inert && workspace.getClientRects().length) void markRead(visible);
      }, 1500);
    };
    // Compact layouts cover the page with a contents drawer when a book first opens.
    const observer = new MutationObserver(schedule);
    if (workspace) observer.observe(workspace, { attributes: true, attributeFilter: ["inert", "aria-hidden"] });
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener("visibilitychange", schedule); };
  }, [key, markRead]);
}
