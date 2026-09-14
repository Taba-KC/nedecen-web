"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { lookupStaff, claimStaffAccount, type PersonName } from "@/lib/onboarding";
import { useTheme } from "@/hooks/useTheme";

type Step = 1 | 2;

export default function StaffOnboardPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const [step, setStep] = useState<Step>(1);
  const [schoolCode, setSchoolCode] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [initials, setInitials] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [foundPerson, setFoundPerson] = useState<PersonName | null>(null);

  const schoolCodeActive      = focusedField === "schoolCode"      || schoolCode !== "";
  const staffNumberActive     = focusedField === "staffNumber"     || staffNumber !== "";
  const initialsActive        = focusedField === "initials"        || initials !== "";
  const usernameActive        = focusedField === "username"        || username !== "";
  const passwordActive        = focusedField === "password"        || password !== "";
  const confirmPasswordActive = focusedField === "confirmPassword" || confirmPassword !== "";

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!schoolCode || !staffNumber || !initials) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const person = await lookupStaff({ schoolCode, staffNumber, initials });
      setFoundPerson(person);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No matching record found. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await claimStaffAccount({ schoolCode, staffNumber, initials, username, password });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldWrapperStyle = (focused: boolean): React.CSSProperties => ({
    height: "var(--control-height)",
    border: `1.5px solid ${focused ? "var(--color-focus)" : "var(--color-border)"}`,
    backgroundColor: "var(--color-card)",
    transition: "border-color 0.15s ease",
  });

  const labelStyle = (active: boolean, focused: boolean): React.CSSProperties => ({
    left: "var(--control-px)",
    top: active ? "0" : "50%",
    transform: active ? "translateY(-50%) scale(0.72)" : "translateY(-50%)",
    transformOrigin: "left center",
    fontSize: "0.875rem",
    lineHeight: "1",
    color: focused ? "var(--color-focus)" : "var(--color-text-muted)",
    backgroundColor: "var(--color-card)",
    padding: "0 4px",
    zIndex: 2,
    transition: "top 0.15s ease, transform 0.15s ease, color 0.15s ease",
  });

  const inputStyle = (active: boolean): React.CSSProperties => ({
    padding: active ? "14px var(--control-px) 0" : "0 var(--control-px)",
    color: "var(--color-text)",
    transition: "padding 0.15s ease",
  });

  if (success) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="w-full max-w-sm text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "var(--color-accent-muted)" }}
          >
            <span style={{ color: "var(--color-accent)", fontSize: "1.5rem" }}>✓</span>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Account ready
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Your staff account has been set up. You can now sign in with your username and password.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full text-sm font-bold tracking-wide rounded-lg"
            style={{
              height: "var(--control-height)",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            Sign in now
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen lg:flex"
      style={{ backgroundColor: "var(--color-background)" }}
    >

      {/* Left panel — desktop only */}
      <div
        className="hidden lg:flex lg:flex-col lg:w-[48%] min-h-screen"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <div className="flex flex-col justify-between flex-1 p-12">

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-accent)" }} />
            <span className="text-white text-sm font-medium">NEDECEN</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Your profile is already here.{" "}
              <span style={{ color: "var(--color-accent)" }}>Just claim it.</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Your school has already registered you. Claiming your account takes less than a minute — you just need your school code, staff number, and initials.
            </p>
          </div>

          <p className="text-sm tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>
            South African secondary schools · CAPS aligned
          </p>

        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--color-background)] sm:bg-[var(--color-canvas)] lg:bg-[var(--color-background)]">

        {/* Top bar */}
        <div className="flex justify-between items-center p-4 sm:p-6 lg:p-8">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-medium transition-all"
            style={{ color: "var(--color-text-muted)" }}
          >
            ← Back to sign in
          </button>
          <button
            onClick={toggle}
            className="text-xs font-semibold px-4 py-2 rounded-full transition-all"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
              border: "1.5px solid var(--color-border)",
            }}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 pb-10 sm:px-10">
          <div
            className="w-full max-w-sm sm:rounded-2xl sm:shadow-md sm:p-8 lg:shadow-none lg:rounded-none lg:p-0"
            style={{ backgroundColor: "var(--color-card)" }}
          >

            {/* Brand — mobile and tablet only */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-accent)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>NEDECEN</span>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor: step >= s ? "var(--color-accent)" : "var(--color-surface)",
                      color: step >= s ? "#ffffff" : "var(--color-text-muted)",
                    }}
                  >
                    {s}
                  </div>
                  {s < 2 && (
                    <div
                      className="w-8 h-px transition-all"
                      style={{ backgroundColor: step > 1 ? "var(--color-accent)" : "var(--color-border)" }}
                    />
                  )}
                </div>
              ))}
              <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>
                Step {step} of 2
              </span>
            </div>

            {/* Error box */}
            {error && (
              <div
                className="mb-6 px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-3"
                style={{ backgroundColor: "var(--color-error-bg)", color: "var(--color-error-text)" }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Find your account
                </h2>
                <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                  Enter the details your school registered you with.
                </p>

                <form onSubmit={handleNext} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>

                  <div className="relative rounded-lg" style={fieldWrapperStyle(focusedField === "schoolCode")}>
                    <input
                      id="schoolCode"
                      type="text"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      onFocus={() => setFocusedField("schoolCode")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full h-full text-sm outline-none bg-transparent"
                      style={inputStyle(schoolCodeActive)}
                    />
                    <label htmlFor="schoolCode" className="absolute pointer-events-none" style={labelStyle(schoolCodeActive, focusedField === "schoolCode")}>
                      School code
                    </label>
                  </div>

                  <div className="relative rounded-lg" style={fieldWrapperStyle(focusedField === "staffNumber")}>
                    <input
                      id="staffNumber"
                      type="text"
                      value={staffNumber}
                      onChange={(e) => setStaffNumber(e.target.value)}
                      onFocus={() => setFocusedField("staffNumber")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full h-full text-sm outline-none bg-transparent"
                      style={inputStyle(staffNumberActive)}
                    />
                    <label htmlFor="staffNumber" className="absolute pointer-events-none" style={labelStyle(staffNumberActive, focusedField === "staffNumber")}>
                      Staff number
                    </label>
                  </div>

                  <div className="relative rounded-lg" style={fieldWrapperStyle(focusedField === "initials")}>
                    <input
                      id="initials"
                      type="text"
                      value={initials}
                      onChange={(e) => setInitials(e.target.value)}
                      onFocus={() => setFocusedField("initials")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full h-full text-sm outline-none bg-transparent"
                      style={inputStyle(initialsActive)}
                    />
                    <label htmlFor="initials" className="absolute pointer-events-none" style={labelStyle(initialsActive, focusedField === "initials")}>
                      Initials
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-sm font-bold tracking-wide rounded-lg transition-all disabled:opacity-50"
                    style={{
                      height: "var(--control-height)",
                      backgroundColor: "var(--color-accent)",
                      color: "var(--color-btn-primary-text)",
                    }}
                  >
                    {loading ? "Looking up..." : "Next"}
                  </button>

                </form>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  Set up your login
                </h2>
                {foundPerson && (
                  <div
                    className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg"
                    style={{ backgroundColor: "var(--color-surface)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: "var(--color-accent-muted)", color: "var(--color-accent)" }}
                    >
                      {foundPerson.firstName[0]}{foundPerson.surname[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {foundPerson.title} {foundPerson.firstName} {foundPerson.surname}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        Staff account found
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                  Choose a username and password. You'll use these every time you sign in.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>

                  <div className="relative rounded-lg" style={fieldWrapperStyle(focusedField === "username")}>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full h-full text-sm outline-none bg-transparent"
                      style={inputStyle(usernameActive)}
                    />
                    <label htmlFor="username" className="absolute pointer-events-none" style={labelStyle(usernameActive, focusedField === "username")}>
                      Username
                    </label>
                  </div>

                  <div className="relative rounded-lg" style={fieldWrapperStyle(focusedField === "password")}>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full h-full text-sm outline-none bg-transparent"
                      style={inputStyle(passwordActive)}
                    />
                    <label htmlFor="password" className="absolute pointer-events-none" style={labelStyle(passwordActive, focusedField === "password")}>
                      Password
                    </label>
                  </div>

                  <div className="relative rounded-lg" style={fieldWrapperStyle(focusedField === "confirmPassword")}>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full h-full text-sm outline-none bg-transparent"
                      style={inputStyle(confirmPasswordActive)}
                    />
                    <label htmlFor="confirmPassword" className="absolute pointer-events-none" style={labelStyle(confirmPasswordActive, focusedField === "confirmPassword")}>
                      Confirm password
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-sm font-bold tracking-wide rounded-lg transition-all disabled:opacity-50"
                    style={{
                      height: "var(--control-height)",
                      backgroundColor: "var(--color-accent)",
                      color: "var(--color-btn-primary-text)",
                    }}
                  >
                    {loading ? "Setting up..." : "Claim account"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null); }}
                    className="w-full text-sm font-medium rounded-lg transition-all"
                    style={{
                      height: "var(--control-height)",
                      border: "1.5px solid var(--color-border)",
                      color: "var(--color-text)",
                      backgroundColor: "transparent",
                    }}
                  >
                    Back
                  </button>

                </form>
              </>
            )}

          </div>
        </div>

      </div>

    </main>
  );
}
