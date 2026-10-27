"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccountType, isLoggedIn, logout } from "@/lib/auth";
export type StaffAccess = { isPrincipal: boolean; canTeach: boolean; capabilities: string[]; schoolId: number };
const Context = createContext<StaffAccess | null>(null);
export const useStaffAccess = () => useContext(Context);
/** Capabilities come from live server grants, never editable localStorage role labels. */
export function StaffAccessBoundary({ mode, children }: { mode: 'teaching' | 'administration'; children: ReactNode }) {
  const router = useRouter(); const [access, setAccess] = useState<StaffAccess | null>(null), [error, setError] = useState('');
  const load = useCallback(() => { api.get<StaffAccess>('/staff/me/access').then(value => { setAccess(value); setError(''); }).catch(err => setError(err instanceof Error ? err.message : 'Could not load your assignments.')); }, []);
  useEffect(() => { if (!isLoggedIn() || getAccountType() !== 'person') { router.replace('/'); return; } load(); window.addEventListener('focus', load); return () => window.removeEventListener('focus', load); }, [load, router]);
  const allowed = access && (mode === 'teaching' ? access.canTeach : access.isPrincipal || access.capabilities.length > 0);
  useEffect(() => { if (!access || allowed) return; if (mode === 'teaching' && (access.isPrincipal || access.capabilities.length)) router.replace('/dashboard/principal'); else if (mode === 'administration' && access.canTeach) router.replace('/dashboard/staff'); }, [access, allowed, mode, router]);
  if (error) return <main style={{ padding: 28 }}><p role="alert">{error}</p><button onClick={load}>Try again</button><button onClick={() => { logout(); router.replace('/'); }}>Sign out</button></main>;
  if (!access) return <p style={{ padding: 28 }} role="status">Loading your work assignments…</p>;
  if (!allowed) return <main style={{ padding: 28 }}><p>Your school has not assigned teaching or administrative work yet. Please contact your principal.</p><button onClick={() => { logout(); router.replace('/'); }}>Sign out</button></main>;
  return <Context.Provider value={access}>{children}</Context.Provider>;
}
