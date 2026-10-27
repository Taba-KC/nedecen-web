"use client";

/** Shared navigation around the existing book surface. Drawers reuse the real contents and shelf,
 * so colours, page numbering and navigation actions remain identical on every screen. */
import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "./responsive-library.module.css";
import bookStyles from "./books.module.css";
import { useRouter,usePathname } from "next/navigation";
import { useStaffAccess } from "@/components/dashboard/StaffAccess";
import { useLibraryMemory } from "@/hooks/useLibraryMemory";

type Mode = "desktop" | "portrait" | "phone";
type Drawer = "contents" | "shelf" | null;
const phoneQuery = "(max-width: 600px), (max-height: 500px) and (max-width: 1000px)";
const portraitQuery = "(min-width: 601px) and (max-width: 1200px) and (orientation: portrait)";
function currentMode(): Mode { return window.matchMedia(phoneQuery).matches ? "phone" : window.matchMedia(portraitQuery).matches ? "portrait" : "desktop"; }
function subscribeMode(changed: () => void) {
  const queries = [window.matchMedia(phoneQuery), window.matchMedia(portraitQuery)];
  queries.forEach(query => query.addEventListener("change", changed));
  return () => queries.forEach(query => query.removeEventListener("change", changed));
}
const CloseDrawer = createContext<(side: Exclude<Drawer, null>) => void>(() => {});

function MenuIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M3 5h18M3 12h12M3 19h6" /></svg>; }
function BooksIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="7" height="8" rx="1" /><rect x="14" y="3" width="7" height="8" rx="1" /><rect x="3" y="15" width="7" height="6" rx="1" /><rect x="14" y="15" width="7" height="6" rx="1" /><path d="M5.5 3v8M16.5 3v8M5.5 15v6M16.5 15v6" /></svg>; }
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>; }

export function LibraryDrawerClose({ side }: { side: Exclude<Drawer, null> }) {
  const close = useContext(CloseDrawer);
  return <button type="button" className={styles.drawerClose} onClick={() => close(side)} aria-label={side === "contents" ? "Close pages menu" : "Close library menu"}><CloseIcon /></button>;
}
export function LibraryShelfTitle() { return <><span className={styles.desktopShelfTitle}>Your bookshelf</span><span className={styles.compactShelfTitle}>Your library</span></>; }

/** Keep account access visible while the book's chapters scroll independently above it. */
export function LibraryContents({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  const access=useStaffAccess();const router=useRouter();const path=usePathname();const administration=path.includes("/principal");
  return <aside data-library-contents className={`${bookStyles.contents} ${styles.contentsMenu}`} aria-label="Chapters and headings">
    <LibraryDrawerClose side="contents" />
    <div className={styles.contentsBody}>{children}</div>
    <footer className={styles.menuFooter}>
      {access?.canTeach&&(access.isPrincipal||access.capabilities.length>0)&&<button type="button" className={styles.signOutButton} style={{marginBottom:10}} onClick={()=>router.push(administration?"/dashboard/staff":"/dashboard/principal")}>{administration?"Switch to teaching":"Switch to administration"} <span aria-hidden="true">⇄</span></button>}
      <button type="button" className={styles.signOutButton} onClick={onSignOut}>Sign out <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4H4v16h5M9 12h11m-4-4 4 4-4 4" /></svg></button>
    </footer>
  </aside>;
}

export default function ResponsiveLibrary({ bookTitle, location, children }: { bookTitle?: string; location: string; children: ReactNode }) {
  useLibraryMemory();
  const mode = useSyncExternalStore(subscribeMode, currentMode, () => "desktop" as Mode);
  const [drawerState, setDrawer] = useState<{ side: Drawer; location: string; introBook?: string }>({ side: null, location });
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const lastBook = useRef<string | undefined>(undefined);
  const id = useId();
  const bookOpen = !!bookTitle;
  // The initial contents view belongs to the book, so loading its first page does not dismiss it.
  const drawer = drawerState.side === "contents" && drawerState.introBook === bookTitle && bookOpen ? "contents" : drawerState.location === location ? drawerState.side : null;
  const overlay = mode === "desktop" || (mode === "phone" && !bookOpen) ? null : drawer;
  const close = () => setDrawer({ side: null, location });

  useEffect(() => {
    // Hydration initially uses the desktop snapshot. Wait for the actual viewport before
    // recording this book; ordinary page changes and rotation should not reopen contents.
    if (mode !== currentMode() || lastBook.current === bookTitle) return;
    if (mode === "desktop" || !bookTitle) { lastBook.current = bookTitle; return; }
    let reveal = 0;
    const paint = requestAnimationFrame(() => {
      reveal = requestAnimationFrame(() => {
        lastBook.current = bookTitle;
        setDrawer({ side: "contents", location: "", introBook: bookTitle });
      });
    });
    return () => { cancelAnimationFrame(paint); cancelAnimationFrame(reveal); };
  }, [bookTitle, mode]);

  // History/orientation changes dismiss temporary menus on both phones and portrait tablets.
  useEffect(() => {
    const dismiss = () => setDrawer({ side: null, location: "" });
    window.addEventListener("popstate", dismiss); window.addEventListener("resize", dismiss);
    return () => { window.removeEventListener("popstate", dismiss); window.removeEventListener("resize", dismiss); };
  }, []);

  useEffect(() => {
    const frame = root.current;
    if (!frame) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const contents = frame.querySelector<HTMLElement>("[data-library-contents]");
    const shelf = frame.querySelector<HTMLElement>("[data-library-shelf]");
    const workspace = frame.querySelector<HTMLElement>("[data-library-workspace]");
    const topbar = frame.querySelector<HTMLElement>("[data-library-topbar]");
    const active = overlay === "contents" ? contents : overlay === "shelf" ? shelf : null;
    const contentsHidden = mode !== "desktop" && (!bookOpen || overlay !== "contents");
    const shelfHidden = mode !== "desktop" && (mode !== "phone" || bookOpen) && overlay !== "shelf";
    if (contents) contents.id = `${id}-contents`;
    if (shelf) shelf.id = `${id}-shelf`;
    const regions: [HTMLElement | null, boolean][] = [[contents, contentsHidden], [shelf, shelfHidden], [workspace, mode === "phone" && !bookOpen], [topbar, mode === "phone" && bookOpen], [bar.current, false]];
    for (const [node, hidden] of regions) {
      if (!node) continue;
      node.inert = hidden || (!!active && node !== active);
      if (hidden || (!!active && node !== active)) node.setAttribute("aria-hidden", "true"); else node.removeAttribute("aria-hidden");
    }
    for (const aside of [contents, shelf]) {
      if (!aside) continue;
      if (aside === active) { aside.setAttribute("role", "dialog"); aside.setAttribute("aria-modal", "true"); const details = aside.querySelector("details"); if (details) details.open = true; }
      else { aside.removeAttribute("role"); aside.removeAttribute("aria-modal"); }
    }
    if (!active) return;
    const trigger = bar.current?.querySelector<HTMLButtonElement>(`button[aria-controls="${active.id}"]`) ?? previousFocus;
    active.scrollTop = 0;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [...active.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]')].filter(node => node.getClientRects().length && !node.closest("[inert]"));
    const focusFrame = requestAnimationFrame(() => focusable()[0]?.focus({ preventScroll: true }));
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setDrawer({ side: null, location }); return; }
      if (event.key !== "Tab") return;
      const items = focusable(), first = items[0], last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(focusFrame); document.removeEventListener("keydown", trap); document.body.style.overflow = originalOverflow;
      // Clear inert before restoring focus to the menu trigger on the same mounted page.
      regions.forEach(([node]) => { if (node) node.inert = false; });
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [mode, overlay, bookOpen, id, location]);

  return <CloseDrawer.Provider value={close}><div ref={root} className={styles.frame} data-library-mode={mode} data-book-open={bookOpen} data-drawer={overlay ?? "none"} onClickCapture={event => {
    const target = event.target instanceof Element ? event.target : null;
    const selectedBook = target?.closest<HTMLButtonElement>('[data-library-shelf] button[aria-label^="Open "]');
    if (selectedBook) {
      // Reopening the current book from the shelf should introduce its pages too.
      if (mode !== "desktop" && selectedBook.getAttribute("aria-label") === `Open ${bookTitle}`) setDrawer({ side: "contents", location: "", introBook: bookTitle });
      else setDrawer({ side: null, location });
    } else if (mode !== "desktop" && target?.closest("[data-library-contents] nav button")) setDrawer({ side: null, location });
  }}>
    <header className={styles.navigationBar} ref={bar} aria-label="Book navigation">
      <button type="button" aria-label="Open pages menu" aria-controls={`${id}-contents`} aria-expanded={overlay === "contents"} disabled={!bookOpen} onClick={() => setDrawer({ side: overlay === "contents" ? null : "contents", location })}><MenuIcon /></button>
      <span className={styles.bookName}>{bookTitle ?? "Your library"}</span>
      <button type="button" aria-label="Open library" aria-controls={`${id}-shelf`} aria-expanded={overlay === "shelf"} onClick={() => setDrawer({ side: overlay === "shelf" ? null : "shelf", location })}><BooksIcon /></button>
    </header>
    <h1 className={styles.libraryHeading}>Your library</h1>
    <button type="button" className={styles.backdrop} tabIndex={-1} aria-label="Dismiss navigation menu" data-open={!!overlay} aria-hidden={!overlay} inert={!overlay} onClick={() => setDrawer({ side: null, location })} />
    {children}
  </div></CloseDrawer.Provider>;
}
