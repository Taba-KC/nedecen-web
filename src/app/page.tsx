"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const accountType = await login(username, password);
      if (accountType === "person") {
        router.push("/dashboard/staff");
      } else {
        router.push("/dashboard/learner");
      }
    } catch {
      setError("Incorrect username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 text-sm px-3 py-1 rounded-full border"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        {theme === "light" ? "Dark" : "Light"}
      </button>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-md"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <div
            className="inline-block w-12 h-12 rounded-xl mb-4"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            NEDECEN
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Sign in to your account
          </p>
        </div>

        {/* Error box */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "var(--color-error-bg)",
              color: "var(--color-error-text)",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="username"
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-btn-primary-bg)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}