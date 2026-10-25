/**
 * The frontend's shared doorway to the Express backend. Components call
 * api.get/post/patch/delete rather than repeating token and error handling. A request
 * travels to API_BASE; it is not a Next.js book-page navigation.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface RefreshResponse {
  accessToken: string;
}

/**
 * One shared Promise means simultaneous 401 responses wait for the same refresh request.
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Read the short-lived access token only in a browser. The window guard also allows this
 * module to be imported during server rendering.
 */
function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/**
 * Read the longer-lived renewal credential from this browser session. It is sent to the
 * refresh endpoint, not on every API request.
 */
function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

/**
 * Remove all locally remembered session details together when token renewal fails. This is
 * browser cleanup, not a database deletion.
 */
function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accountType");
  localStorage.removeItem("role");
  localStorage.removeItem("schoolId");
  localStorage.removeItem("accountId");
}

/**
 * Share one in-flight refresh request between simultaneous failures. This avoids multiple
 * components renewing the same session at once.
 */
export async function refreshAccessToken(): Promise<string | null> {
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

/**
 * Turn an unsuccessful HTTP response into an Error the calling form can display. A failed
 * request must not look like a successful Save.
 */
async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  throw new Error(body.error ?? `Request failed: ${res.status}`);
}

/**
 * Retry expired-session failures outside the auth endpoints. Retrying auth itself here could
 * create a refresh loop.
 */
function shouldRefresh(path: string, res: Response) {
  return res.status === 401 && !path.startsWith("/auth/");
}

/**
 * Send multipart FormData for spreadsheet uploads. Let fetch set its boundary instead of
 * forcing a JSON Content-Type; retry authentication at most once.
 */
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

/**
 * Send a JSON API request, attach the current bearer token, and retry once after successful
 * renewal. The result is expected to be JSON.
 */
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

/**
 * Public helpers used by forms and workspaces. <T> describes the expected response to
 * TypeScript; it does not validate JSON at runtime.
 */
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
