"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, getRole, getRedirectPath } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const accountType = await login(username, password);
      router.push(getRedirectPath(accountType, getRole()));
    } catch {
      setError("Incorrect username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const usernameActive = focusedField === "username" || username !== "";
  const passwordActive = focusedField === "password" || password !== "";

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
              No learner falls behind unnoticed.{" "}
              <span style={{ color: "var(--color-accent)" }}>Real feedback, for every lesson.</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Lesson feedback, homework insights, and curriculum coverage unified in
              one place for every learner, teacher, subject, concept, and class.
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
        <div className="flex justify-end p-4 sm:p-6 lg:p-8">
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

            {/* Heading */}
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              Sign in to your account
            </h2>
            <p className="text-sm mb-7" style={{ color: "var(--color-text-muted)" }}>
              Enter your username and password to continue.
            </p>

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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "var(--field-gap)" }}>

              {/* Username */}
              <div
                className="relative rounded-lg"
                style={{
                  height: "var(--control-height)",
                  border: `1.5px solid ${focusedField === "username" ? "var(--color-focus)" : "var(--color-border)"}`,
                  backgroundColor: "var(--color-card)",
                  transition: "border-color 0.15s ease",
                }}
              >
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
                  style={{
                    padding: usernameActive ? "14px var(--control-px) 0" : "0 var(--control-px)",
                    color: "var(--color-text)",
                    transition: "padding 0.15s ease",
                  }}
                />
                <label
                  htmlFor="username"
                  className="absolute pointer-events-none"
                  style={{
                    left: "var(--control-px)",
                    top: usernameActive ? "0" : "50%",
                    transform: usernameActive ? "translateY(-50%) scale(0.72)" : "translateY(-50%)",
                    transformOrigin: "left center",
                    fontSize: "0.875rem",
                    lineHeight: "1",
                    color: focusedField === "username" ? "var(--color-focus)" : "var(--color-text-muted)",
                    backgroundColor: "var(--color-card)",
                    padding: "0 4px",
                    zIndex: 2,
                    transition: "top 0.15s ease, transform 0.15s ease, color 0.15s ease",
                  }}
                >
                  Username
                </label>
              </div>

              {/* Password */}
              <div
                className="relative rounded-lg"
                style={{
                  height: "var(--control-height)",
                  border: `1.5px solid ${focusedField === "password" ? "var(--color-focus)" : "var(--color-border)"}`,
                  backgroundColor: "var(--color-card)",
                  transition: "border-color 0.15s ease",
                }}
              >
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full h-full text-sm outline-none bg-transparent"
                  style={{
                    padding: passwordActive ? "14px var(--control-px) 0" : "0 var(--control-px)",
                    color: "var(--color-text)",
                    transition: "padding 0.15s ease",
                  }}
                />
                <label
                  htmlFor="password"
                  className="absolute pointer-events-none"
                  style={{
                    left: "var(--control-px)",
                    top: passwordActive ? "0" : "50%",
                    transform: passwordActive ? "translateY(-50%) scale(0.72)" : "translateY(-50%)",
                    transformOrigin: "left center",
                    fontSize: "0.875rem",
                    lineHeight: "1",
                    color: focusedField === "password" ? "var(--color-focus)" : "var(--color-text-muted)",
                    backgroundColor: "var(--color-card)",
                    padding: "0 4px",
                    zIndex: 2,
                    transition: "top 0.15s ease, transform 0.15s ease, color 0.15s ease",
                  }}
                >
                  Password
                </label>
              </div>

              {/* Submit */}
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
                {loading ? "Signing in..." : "Sign in"}
              </button>

            </form>

            {/* Footer hint */}
            <p className="mt-6 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
              Contact your school administrator if you cannot access your account.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>First time here?</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            </div>

            {/* Claim account buttons */}
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={() => router.push("/onboard/learner")}
                className="w-full text-sm font-medium rounded-lg transition-all"
                style={{
                  height: "var(--control-height)",
                  border: "1.5px solid var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: "transparent",
                }}
              >
                Claim learner account
              </button>
              <button
                onClick={() => router.push("/onboard/staff")}
                className="w-full text-sm font-medium rounded-lg transition-all"
                style={{
                  height: "var(--control-height)",
                  border: "1.5px solid var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: "transparent",
                }}
              >
                Claim staff account
              </button>
            </div>

          </div>
        </div>

      </div>

    </main>
  );
}
