"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import TeacherPageHeading from "./TeacherPageHeading";
import book from "@/components/principal/books/books.module.css";
import styles from "./accounts-management.module.css";

type Claim = { id: number; reference: string; kind: "claim" | "password"; status: "pending" | "confirmed"; createdAt: string };
type Account = { id: number; firstName: string; surname: string; admissionNumber: string; className: string; confirmed: boolean; suspended: boolean; claims: Claim[] };
type Accounts = { classes: { id: number; name: string }[]; accounts: Account[]; pendingCount: number };
const date = (value: string) => new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" }).format(new Date(value));

function AccountRow({ account, onSaved }: { account: Account; onSaved: () => Promise<void> }) {
  const [reference, setReference] = useState("");
  const [confirmation, setConfirmation] = useState<"revoke" | "suspend" | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const saving = useRef(false);
  const pending = account.claims.filter(item => item.status === "pending");
  async function review(action: "confirm" | "revoke" | "suspend" | "resume") {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try { await api.post(`/staff/me/accounts/${account.id}/review`, { action, ...(action === "confirm" ? { reference } : {}) }); setReference(""); setConfirmation(null); await onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update this account."); }
    finally { saving.current = false; setBusy(false); }
  }
  return <article className={styles.row} aria-label={`${account.firstName} ${account.surname}`}>
    <div className={styles.heading}><h2>{account.firstName} {account.surname}</h2><span className={book.badge}>{account.suspended ? "Temporarily deactivated" : !account.confirmed ? "Awaiting confirmation" : pending.length ? "Password change awaiting review" : "Active"}</span></div>
    <p>{account.className} · Admission number {account.admissionNumber}</p>
    {!!account.claims.length && <ul className={styles.references}>{account.claims.map(claim => <li key={claim.id}><code>{claim.reference}</code><span>{claim.status === "confirmed" ? "Confirmed" : claim.kind === "password" ? "Password request" : "Account claim"} · {date(claim.createdAt)}</span></li>)}</ul>}
    {pending.length > 0 && !account.suspended && <div className={styles.review}>
      <label htmlFor={`reference-${account.id}`}>Select the reference shown by the learner</label>
      <select id={`reference-${account.id}`} value={reference} disabled={busy} onChange={event => setReference(event.target.value)}><option value="">Choose a matching reference</option>{pending.map(claim => <option value={claim.reference} key={claim.id}>{claim.reference}</option>)}</select>
      <p>Check the reference on the learner’s own screen. Confirming removes every other set of credentials for this account.</p>
      <button type="button" className={book.primary} disabled={busy || !pending.some(claim => claim.reference === reference)} onClick={() => void review("confirm")}>{busy ? "Saving…" : account.confirmed ? "Confirm password change and resume" : "Confirm claim"}</button>
    </div>}
    <div className={styles.actions}><button type="button" className={book.textButton} disabled={busy} onClick={() => setConfirmation("revoke")}>Revoke claim</button>{account.confirmed && (account.suspended ? <button type="button" className={book.textButton} disabled={busy} onClick={() => void review("resume")}>Resume account</button> : <button type="button" className={book.textButton} disabled={busy} onClick={() => setConfirmation("suspend")}>Temporarily deactivate</button>)}</div>
    {confirmation && <div className={styles.confirmation}><p>{confirmation === "revoke" ? "Revoke this account’s claim? All associated credentials and sessions will be removed. The learner will need to claim again." : "Temporarily deactivate this account? Access stops until you resume it. The learner’s schoolwork stays safe."}</p><div className={styles.actions}><button type="button" className={book.primary} disabled={busy} onClick={() => void review(confirmation)}>{confirmation === "revoke" ? "Yes, revoke claim" : "Yes, deactivate"}</button><button type="button" className={book.textButton} disabled={busy} onClick={() => setConfirmation(null)}>Cancel</button></div></div>}
    {error && <p role="alert" className={book.error}>{error}</p>}
  </article>;
}

export default function AccountsManagement({ confirmed, onChanged }: { confirmed: boolean; onChanged: () => void }) {
  const [data, setData] = useState<Accounts | null>(null), [error, setError] = useState("");
  const sequence = useRef(0);
  const load = useCallback(async () => { const request = ++sequence.current; try { const next = await api.get<Accounts>("/staff/me/accounts"); if (request === sequence.current) { setData(next); setError(""); } } catch (err) { if (request === sequence.current) setError(err instanceof Error ? err.message : "Could not load accounts."); } }, []);
  useEffect(() => { const tracker = sequence; const initial = setTimeout(() => void load(), 0); const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000); window.addEventListener("focus", load); return () => { ++tracker.current; clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", load); }; }, [load]);
  const rows = data?.accounts.filter(item => item.confirmed === confirmed) ?? [];
  return <><TeacherPageHeading title={confirmed ? "Confirmed accounts" : "Claimed accounts"} /><div className={styles.content}>
    <p>{confirmed ? "Manage activated accounts and match new password references with learners before restoring full access." : "Ask each learner to show their claim reference, then select the matching reference before confirming."}</p>
    {error && <div role="alert" className={book.error}>{error} <button className={book.textButton} onClick={() => void load()}>Try again</button></div>}
    {!data ? <p role="status">Loading accounts…</p> : !rows.length ? <p>{confirmed ? "No confirmed accounts in your managed classes yet." : "No accounts are waiting for claim confirmation."}</p> : rows.map(account => <AccountRow key={account.id} account={account} onSaved={async () => { await load(); onChanged(); }} />)}
  </div></>;
}
