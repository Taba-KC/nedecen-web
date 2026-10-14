export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface RefreshResponse {
  accessToken: string;
}

let refreshPromise: Promise<string | null> | null = null;

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accountType");
  localStorage.removeItem("role");
  localStorage.removeItem("schoolId");
  localStorage.removeItem("accountId");
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearSession();
          return null;
        }

        const body = await res.json() as RefreshResponse;
        localStorage.setItem("accessToken", body.accessToken);
        return body.accessToken;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  throw new Error(body.error ?? `Request failed: ${res.status}`);
}

function shouldRefresh(path: string, res: Response) {
  return res.status === 401 && !path.startsWith("/auth/");
}

async function uploadRequest<T>(path: string, formData: FormData, retry = true): Promise<T> {
  const token = getAccessToken();

  let res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (retry && shouldRefresh(path, res)) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${nextToken}` },
      });
    }
  }

  if (!res.ok) {
    await parseError(res);
  }

  return res.json();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (retry && shouldRefresh(path, res)) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nextToken}`,
          ...options.headers,
        },
      });
    }
  }

  if (!res.ok) {
    await parseError(res);
  }

  return res.json();
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  get: <T>(path: string) =>
    request<T>(path, { method: "GET" }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),

  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),
};
