"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { lookupLearner, lookupStaff, claimLearnerAccount, claimStaffAccount, type PersonName } from "@/lib/onboarding";
import styles from "./account-claim.module.css";

export function AccountClaimPage({ kind }: { kind: "staff" | "learner" }) {
  const isStaff = kind === "staff";
  const numberLabel = isStaff ? "Staff number" : "Admission number";
  const [step, setStep] = useState<1 | 2>(1);
  const [schoolCode, setSchoolCode] = useState("");
  const [number, setNumber] = useState("");
  const [initials, setInitials] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [foundPerson, setFoundPerson] = useState<PersonName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const pending = useRef(false);

  async function findAccount(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    setError(null);
    if (!schoolCode.trim() || !number.trim() || !initials.trim()) { setError("Please fill in all fields."); return; }
    pending.current = true; setLoading(true);
    try {
      const details = { schoolCode: schoolCode.trim(), initials: initials.trim().toUpperCase() };
      const person = isStaff ? await lookupStaff({ ...details, staffNumber: number.trim() }) : await lookupLearner({ ...details, admissionNumber: number.trim() });
      setFoundPerson(person); setStep(2);
    } catch (err) { setError(err instanceof Error ? err.message : "No matching record found. Check your details and try again."); }
    finally { pending.current = false; setLoading(false); }
  }

  async function claimAccount(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    setError(null);
    if (username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    pending.current = true; setLoading(true);
    try {
      const details = { schoolCode: schoolCode.trim(), initials: initials.trim().toUpperCase(), username: username.trim(), password };
      if (isStaff) await claimStaffAccount({ ...details, staffNumber: number.trim() });
      else await claimLearnerAccount({ ...details, admissionNumber: number.trim() });
      setPassword(""); setConfirmPassword(""); setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not set up your account. Please try again."); }
    finally { pending.current = false; setLoading(false); }
  }

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="ANELOC sign in">ANELOC</Link>
        <Link href="/" className={styles.backLink}>← Back to sign in</Link>
      </header>
      <div className={styles.layout}>
        <aside className={styles.intro}>
          <span className={styles.eyebrow}>{isStaff ? "Staff" : "Learner"} account setup</span>
          <div className={styles.introCopy}>
            <h1>Your school has<br />a place for you.</h1>
            <p>Claim your account and make it yours.</p>
          </div>
          <div className={styles.checklist}>
            <h2>Before you begin</h2>
            <p>Your school must have registered you first. Have these details ready:</p>
            <ul><li>Your school code</li><li>Your {numberLabel.toLowerCase()}</li><li>Your first name and surname initials</li></ul>
          </div>
          <p className={styles.introFooter}>South African schools · CAPS aligned</p>
        </aside>
        <section className={styles.card} aria-label={isStaff ? "Claim staff account" : "Claim learner account"}>
          {success ? <div className={styles.success}>
            <span className={styles.successIcon} aria-hidden="true">✓</span>
            <span className={styles.eyebrow}>You’re all set</span>
            <h2 tabIndex={-1} ref={element => { element?.focus(); }}>Account ready</h2>
            <p>Your {kind} account is set up. Sign in with your new username and password.</p>
            <div className={styles.accountSummary}><span>Your username</span><strong>{username.trim()}</strong></div>
            <Link href="/" className={styles.primary}>Sign in now <span aria-hidden="true">→</span></Link>
          </div> : <>
            <ol className={styles.steps} aria-label="Account setup progress">
              <li className={step === 1 ? styles.currentStep : styles.completedStep} aria-current={step === 1 ? "step" : undefined}><span>{step > 1 ? "✓" : "1"}</span> Find your account</li>
              <li className={step === 2 ? styles.currentStep : ""} aria-current={step === 2 ? "step" : undefined}><span>2</span> Set up your login</li>
            </ol>
            <div className={styles.formHeading}>
              <span className={styles.eyebrow}>Step {step} of 2</span>
              <h2>{step === 1 ? "Find your account" : "Set up your login"}</h2>
              <p>{step === 1 ? "Enter the details your school registered you with." : "Confirm this is you, then choose your sign-in details."}</p>
            </div>
            {error && <div role="alert" className={styles.error}><strong>Let’s check those details</strong><p>{error}</p></div>}
            {step === 1 ? <form onSubmit={findAccount}>
              <fieldset className={styles.fields} disabled={loading}>
                <div className={styles.field}><label htmlFor="school-code">School code</label><input id="school-code" value={schoolCode} onChange={event => setSchoolCode(event.target.value)} autoCapitalize="characters" autoCorrect="off" spellCheck={false} required aria-describedby="school-code-help" /><p id="school-code-help">Use the code provided by your school.</p></div>
                <div className={styles.field}><label htmlFor="account-number">{numberLabel}</label><input id="account-number" value={number} onChange={event => setNumber(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} required aria-describedby="account-number-help" /><p id="account-number-help">Enter it exactly as registered, including any leading zeros.</p></div>
                <div className={styles.field}><label htmlFor="initials">Initials</label><input id="initials" value={initials} onChange={event => setInitials(event.target.value)} autoCapitalize="characters" autoCorrect="off" spellCheck={false} required aria-describedby="initials-help" /><p id="initials-help">First letter of your first name + surname. John Doe → JD, without dots.</p></div>
                <button className={styles.primary} type="submit">{loading ? "Finding your account…" : "Continue"}<span aria-hidden="true">→</span></button>
              </fieldset>
            </form> : <form onSubmit={claimAccount}>
              {foundPerson && <div className={styles.person}><span className={styles.avatar} aria-hidden="true">{foundPerson.firstName[0]}{foundPerson.surname[0]}</span><div><strong>{isStaff && foundPerson.title ? `${foundPerson.title} ` : ""}{foundPerson.firstName} {foundPerson.surname}</strong><p>{isStaff ? "Staff" : "Learner"} account found · {schoolCode.trim()}</p></div><span className={styles.foundCheck} aria-label="Account found">✓</span></div>}
              <fieldset className={styles.fields} disabled={loading}>
                <div className={styles.field}><label htmlFor="username">Username</label><input id="username" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={3} required aria-describedby="username-help" /><p id="username-help">At least 3 characters. You’ll use this to sign in.</p></div>
                <div className={styles.field}><div className={styles.labelRow}><label htmlFor="password">Password</label><button type="button" className={styles.textButton} onClick={() => setShowPassword(value => !value)} aria-pressed={showPassword}>{showPassword ? "Hide passwords" : "Show passwords"}</button></div><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={6} required aria-describedby="password-help" /><p id="password-help">At least 6 characters.</p></div>
                <div className={styles.field}><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={6} required /></div>
                <button className={styles.primary} type="submit">{loading ? "Setting up your account…" : "Claim account"}<span aria-hidden="true">→</span></button>
                <button className={styles.secondary} type="button" onClick={() => { setStep(1); setError(null); setPassword(""); setConfirmPassword(""); setShowPassword(false); }}>← Check my details</button>
              </fieldset>
            </form>}
            <p className={styles.help}>Can’t find your account? Ask your school administrator to check your registration details.</p>
          </>}
        </section>
      </div>
    </div>
  </main>;
}
