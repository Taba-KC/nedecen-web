import { api } from "./api";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(
  username: string,
  password: string
): Promise<"person" | "learner"> {
  try {
    const res = await api.post<LoginResponse>("/auth/people/login", {
      username,
      password,
    });
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    localStorage.setItem("accountType", "person");
    return "person";
  } catch {
    const res = await api.post<LoginResponse>("/auth/learners/login", {
      username,
      password,
    });
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    localStorage.setItem("accountType", "learner");
    return "learner";
  }
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accountType");
}

export function getAccountType(): "person" | "learner" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accountType") as "person" | "learner" | null;
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}