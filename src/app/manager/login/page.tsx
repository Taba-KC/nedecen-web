"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginManager } from "@/lib/auth";
import styles from "../../dashboard/manager/manager.module.css";
export default function ManagerLogin() {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return <main className={styles.page}><section className={styles.login}><h1>App manager sign in</h1><p>Manage the shared curriculum for subjects and grades.</p>
    <form onSubmit={async event => { event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError(""); try { await loginManager(String(data.get("username")), String(data.get("password"))); router.replace("/dashboard/manager"); } catch (e) { setError(e instanceof Error ? e.message : "Sign in failed"); } finally { setBusy(false); } }}>
      <label>Username<input name="username" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p role="alert" className={styles.error}>{error}</p>}<button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form></section></main>;
}
