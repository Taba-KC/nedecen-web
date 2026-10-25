/** Remember navigation on this device, separately for each school/account/role.
 * Only page addresses are stored here; forms, answers and credentials are not copied. */
export type LibraryRole = "principal" | "staff" | "learner";
const books: Record<LibraryRole, readonly string[]> = {
  principal: ["grades", "streams", "staff", "learners", "announcements", "curriculum"],
  staff: ["lessons", "homework", "curriculum", "announcements"],
  learner: ["lessons", "homework", "syllabus"],
};
type Memory = { last?: string; books: Record<string, string> };

function identity() {
  if (typeof window === "undefined") return null;
  const account = localStorage.getItem("accountType");
  const id = localStorage.getItem("accountId");
  const school = localStorage.getItem("schoolId");
  const role: LibraryRole | null = account === "learner" ? "learner" : account === "person" ? (localStorage.getItem("role") === "principal" ? "principal" : "staff") : null;
  if (!role || !/^\d+$/.test(id ?? "") || !/^\d+$/.test(school ?? "")) return null;
  return { role, key: `nedecen.library.v1:${account}:${id}:${school}:${role}` };
}

/** Rebuild a local URL from known navigation parameters. Never redirect to arbitrary saved text. */
export function libraryLocation(role: LibraryRole, value: string): string | null {
  if (!value.startsWith(`/dashboard/${role}`) || value.length > 1000) return null;
  const url = new URL(value, "https://library.invalid");
  if (url.pathname !== `/dashboard/${role}` || url.hash) return null;
  const book = url.searchParams.get("book");
  if (!book) return url.search ? null : url.pathname;
  if (!books[role].includes(book)) return null;
  const search = new URLSearchParams({ book });
  for (const key of ["page", "tab", "lesson", "activity", "method"]) {
    const item = url.searchParams.get(key);
    if (!item) continue;
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(item)) return null;
    if ((key === "lesson" || key === "activity") && !/^[1-9]\d*$/.test(item)) return null;
    search.set(key, item);
  }
  return `${url.pathname}?${search}`;
}

function read(key: string): Memory {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
    return { last: typeof saved.last === "string" ? saved.last : undefined, books: saved.books && typeof saved.books === "object" && !Array.isArray(saved.books) ? saved.books : {} };
  } catch { return { books: {} }; }
}

export function rememberLibraryLocation(value: string) {
  // Storage can be disabled or full; navigation must still work without it.
  try {
    const user = identity();
    if (!user) return;
    const location = libraryLocation(user.role, value);
    if (!location) return;
    const saved = read(user.key);
    saved.last = location;
    const book = new URL(location, "https://library.invalid").searchParams.get("book");
    if (book) saved.books[book] = location;
    localStorage.setItem(user.key, JSON.stringify(saved));
  } catch { /* Remembering a page is optional when browser storage is unavailable. */ }
}

export function rememberedLibraryLocation(role: LibraryRole, book?: string): string | null {
  try {
    const user = identity();
    if (!user || user.role !== role) return null;
    const saved = read(user.key);
    const location = book ? saved.books[book] : saved.last;
    if (typeof location !== "string") return null;
    const safe = libraryLocation(role, location);
    return safe && (!book || new URL(safe, "https://library.invalid").searchParams.get("book") === book) ? safe : null;
  } catch { return null; }
}

/** Explicit sign out returns to the library next time; per-book page choices are retained. */
export function resetActiveLibraryLocation() {
  try {
    const user = identity();
    if (user) rememberLibraryLocation(`/dashboard/${user.role}`);
  } catch { /* Sign out should succeed even if storage is unavailable. */ }
}
