"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import styles from "@/components/onboarding/account-claim.module.css";

/** New credentials remain a separate proposal until the class manager matches its reference. */
export default function ForgotPassword() {
  const [schoolCode, setSchoolCode] = useState(""), [admissionNumber, setNumber] = useState(""), [initials, setInitials] = useState("");
  const [username, setUsername] = useState(""), [password, setPassword] = useState(""), [confirm, setConfirm] = useState("");
  const [reference, setReference] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const pending = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending.current) return;
    setError(""); if (password !== confirm) { setError("Passwords do not match."); return; }
    pending.current = true; setBusy(true);
    try { const result = await api.post<{ reference: string }>("/learners/password-recovery", { schoolCode, admissionNumber, initials, username, password }); setReference(result.reference); setPassword(""); setConfirm(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not submit your password request."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <main className={styles.page}><div className={styles.shell} style={{ maxWidth: 640 }}><header className={styles.header}><Link href="/" className={styles.brand}>NEDECEN</Link><Link href="/" className={styles.backLink}>← Back to sign in</Link></header><section className={styles.card}>
    <div className={styles.formHeading}><h1 style={{ fontSize: 26, fontWeight: 600 }}>{reference ? "Password request awaiting confirmation" : "Reset your learner password"}</h1><p>{reference ? "Show your private reference to your class manager. The selected credentials will become your active login after confirmation." : "Use the school details you used to claim your account. Keep your username or choose a new one, then choose a new password. Your confirmed login keeps working until your class manager confirms the new reference."}</p></div>
    {reference ? <><div className={styles.accountSummary}><span>Your private password reference</span><strong>{reference}</strong><span>Requested username</span><strong>{username}</strong></div><p className={styles.help}>Signing in with the requested credentials gives you limited access to your latest lesson and homework while you wait. Keep this reference private and show it only to your class manager.</p><Link href="/" className={styles.primary}>Sign in</Link></> : <form onSubmit={event => void submit(event)}><fieldset className={styles.fields} disabled={busy}>
      {([{ label: "School code", value: schoolCode, set: setSchoolCode, id: "school-code", min: 1, max: 100 }, { label: "Admission number", value: admissionNumber, set: setNumber, id: "admission-number", min: 1, max: 100 }, { label: "Initials", value: initials, set: setInitials, id: "initials", min: 1, max: 20 }, { label: "Requested username", value: username, set: setUsername, id: "requested-username", min: 3, max: 100 }, { label: "New password", value: password, set: setPassword, id: "new-password", min: 6, max: 72 }, { label: "Confirm new password", value: confirm, set: setConfirm, id: "confirm-password", min: 6, max: 72 }]).map(field => <div className={styles.field} key={field.id}><label htmlFor={field.id}>{field.label}</label><input id={field.id} type={field.id.includes("password") ? "password" : "text"} autoComplete={field.id.includes("password") ? "new-password" : field.id === "requested-username" ? "username" : "off"} value={field.value} onChange={event => field.set(event.target.value)} minLength={field.min} maxLength={field.max} required /></div>)}
      {error && <p role="alert" className={styles.error}>{error}</p>}<button type="submit" className={styles.primary}>{busy ? "Submitting…" : "Request password reset"}</button>
    </fieldset><p className={styles.help}>A maximum of two claim or password requests can be made per account per day. Staff members should contact their school administrator for password assistance.</p></form>}
  </section></div></main>;
}
