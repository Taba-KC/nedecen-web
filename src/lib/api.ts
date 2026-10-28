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
let accessToken: string | null = null;
let sessionGeneration = 0;
if (typeof window !== "undefined") window.addEventListener("storage", event => {
  if (event.storageArea === localStorage && ["accountType", "accountId"].includes(event.key ?? "") && event.oldValue !== event.newValue) {
    accessToken = null; sessionGeneration++; refreshPromise = null;
    window.location.reload();
  }
});
/** Tokens live in memory; the server keeps renewal credentials in an HttpOnly cookie. */
export function rememberAccessToken(token: string, renewal = false) {
  if (!renewal) { sessionGeneration++; refreshPromise = null; }
  accessToken = token;
  if (typeof window !== "undefined") { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); }
}
export function currentAccessToken() {
  if (typeof window === "undefined") return null;
  // One-time migration for sessions opened before HttpOnly cookies were introduced.
  if (!accessToken) { accessToken = localStorage.getItem("accessToken"); localStorage.removeItem("accessToken"); }
  return accessToken;
}
export function revokeBrowserSession() {
  const legacy = typeof window === "undefined" ? null : localStorage.getItem("refreshToken");
  // keepalive lets revocation finish even when sign out immediately navigates away.
  const request = fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify(legacy ? { refreshToken: legacy } : {}) });
  clearSession();
  if (typeof window !== "undefined" && "caches" in window) void caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).catch(() => {});
  return request;
}

/**
 * Read the short-lived access token only in a browser. The window guard also allows this
 * module to be imported during server rendering.
 */
function getAccessToken() {
  if (typeof window === "undefined") return null;
  return currentAccessToken();
}

/**
 * Read only a legacy renewal credential for the one-time migration. New sessions use
 * the HttpOnly cookie, which JavaScript cannot read.
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
  accessToken = null; sessionGeneration++; refreshPromise = null;
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

  if (!refreshPromise) {
    const generation = sessionGeneration;
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    })
      .then(async (res) => {
        if (!res.ok) {
          if (generation === sessionGeneration) clearSession();
          return null;
        }

        const body = await res.json() as RefreshResponse;
        if (generation !== sessionGeneration) return null;
        rememberAccessToken(body.accessToken, true);
        return body.accessToken;
      })
      .catch(() => {
        if (generation === sessionGeneration) clearSession();
        return null;
      })
      .finally(() => {
        if (generation === sessionGeneration) refreshPromise = null;
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
  if (getRefreshToken()) await refreshAccessToken();
  const token = getAccessToken();

  let res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
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
        credentials: "include",
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
  if (getRefreshToken()) await refreshAccessToken();
  const token = getAccessToken();

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
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
        credentials: "include",
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
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
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
