/**
 * Browser session helpers: sign in, remember tokens and choose the correct dashboard.
 * Reading a role here controls the interface only. The backend must verify the token and
 * permissions again for every protected request.
 */
import { api } from "./api";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Read token claims to choose UI/session values. Decoding is not signature verification; the
 * backend performs the security check.
 */
function decodeToken(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/**
 * Try the supported account types and remember the successful session. Each branch stores
 * the account details needed by that dashboard.
 */
export async function login(
  username: string,
  password: string
): Promise<"person" | "learner" | "manager"> {
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
    try {
      const res = await api.post<LoginResponse>("/auth/learners/login", { username, password });
      const payload = decodeToken(res.accessToken);
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("accountType", "learner");
      localStorage.setItem("schoolId", String(payload.schoolId ?? ""));
      localStorage.setItem("accountId", String(payload.accountId ?? ""));
      localStorage.removeItem("role");
      return "learner";
    } catch {
      await loginManager(username, password);
      return "manager";
    }
  }
}

/**
 * Clear this browser's session values. This helper does not call the backend logout endpoint
 * to revoke a refresh token.
 */
export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accountType");
  localStorage.removeItem("role");
  localStorage.removeItem("schoolId");
  localStorage.removeItem("accountId");
}

/**
 * Read the remembered account category for UI routing, or null during server rendering.
 */
export function getAccountType(): "person" | "learner" | "manager" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accountType") as "person" | "learner" | "manager" | null;
}

/**
 * Read the stored staff role for display/routing. Never use this browser value as the
 * backend's authorization decision.
 */
export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

/**
 * Convert the stored school string back into a number. Missing/non-numeric values mean there
 * is no usable school selection.
 */
export function getSchoolId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("schoolId");
  const n = parseInt(raw ?? "", 10);
  return isNaN(n) ? null : n;
}

/**
 * Read the numeric account identity remembered after login, with a browser-only guard.
 */
export function getAccountId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("accountId");
  const n = parseInt(raw ?? "", 10);
  return isNaN(n) ? null : n;
}

/**
 * Check whether this browser has an access token. This does not prove the token is valid or
 * unexpired; API requests verify that.
 */
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}

/**
 * Map account category and staff role to the appropriate browser dashboard URL.
 */
export function getRedirectPath(
  accountType: "person" | "learner" | "manager",
  role: string | null
): string {
  if (accountType === "manager") return "/dashboard/manager";
  if (accountType === "learner") return "/dashboard/learner";
  if (role === "principal") return "/dashboard/principal";
  return "/dashboard/staff";
}
/**
 * Use the manager endpoint and store a manager session without carrying over a previous
 * school selection.
 */
export async function loginManager(username: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/managers/login", { username, password });
  const payload = decodeToken(res.accessToken);
  localStorage.setItem("accessToken", res.accessToken);
  localStorage.setItem("refreshToken", res.refreshToken);
  localStorage.setItem("accountType", "manager");
  localStorage.setItem("accountId", String(payload.accountId));
  localStorage.setItem("role", "app_manager");
  localStorage.removeItem("schoolId");
}
