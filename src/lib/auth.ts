import { api } from "./api";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

function decodeToken(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export async function login(
  username: string,
  password: string
): Promise<"person" | "learner"> {
  try {
    const res = await api.post<LoginResponse>("/auth/people/login", { username, password });
    const payload = decodeToken(res.accessToken);
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    localStorage.setItem("accountType", "person");
    localStorage.setItem("role", (payload.role as string) ?? "teacher");
    localStorage.setItem("schoolId", String(payload.schoolId ?? ""));
    localStorage.setItem("accountId", String(payload.accountId ?? ""));
    return "person";
  } catch {
    const res = await api.post<LoginResponse>("/auth/learners/login", { username, password });
    const payload = decodeToken(res.accessToken);
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    localStorage.setItem("accountType", "learner");
    localStorage.setItem("schoolId", String(payload.schoolId ?? ""));
    localStorage.setItem("accountId", String(payload.accountId ?? ""));
    localStorage.removeItem("role");
    return "learner";
  }
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accountType");
  localStorage.removeItem("role");
  localStorage.removeItem("schoolId");
  localStorage.removeItem("accountId");
}

export function getAccountType(): "person" | "learner" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accountType") as "person" | "learner" | null;
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function getSchoolId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("schoolId");
  const n = parseInt(raw ?? "", 10);
  return isNaN(n) ? null : n;
}

export function getAccountId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("accountId");
  const n = parseInt(raw ?? "", 10);
  return isNaN(n) ? null : n;
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}

export function getRedirectPath(
  accountType: "person" | "learner",
  role: string | null
): string {
  if (accountType === "learner") return "/dashboard/learner";
  if (role === "principal") return "/dashboard/principal";
  return "/dashboard/staff";
}