"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { getAccountType, getRedirectPath, getRole, isLoggedIn, logout } from "@/lib/auth";
import { usePageTurn } from "@/components/principal/books/usePageTurn";
import { TEACHER_BOOKS, allocationName, flattenTeacherPages, teacherPages, teacherPagePath, type TeacherDashboard, type TeacherPage } from "./registry";
import TeacherBookPage, { type Navigate } from "./TeacherBookPage";
import HomeworkMethodFilters, { type HomeworkMode } from "../HomeworkMethodFilters";
import LessonFeedback from "./LessonFeedback";
import TeacherPageHeading from "./TeacherPageHeading";
import styles from "@/components/principal/books/books.module.css";
import local from "./teacher-books.module.css";

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={back ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} /></svg>;
}

function Contents({ pages, current, navigate }: { pages: TeacherPage[]; current?: string; navigate: (id: string) => void }) {
  return <ol className={styles.contentsList}>{pages.map(page => <li key={page.id}><button type="button" className={page.id === current ? styles.currentHeading : undefined} aria-current={page.id === current ? "page" : undefined} onClick={() => navigate(page.id)}><span className={styles.pageNumber}>{page.number}</span><span>{page.title}</span></button>{!!page.children?.length && <Contents pages={page.children} current={current} navigate={navigate} />}</li>)}</ol>;
}

export default function TeacherBookWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const book = TEACHER_BOOKS.find(item => item.id === params.get("book"));
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(true);
  const [about, setAbout] = useState<string | null>(null);
  const [homeworkMode, setHomeworkMode] = useState<HomeworkMode>("manual");
  const requestId = useRef(0);
  const pages = useMemo(() => book && data ? teacherPages(book.id, data.subjects) : [], [book, data]);
  const flat = useMemo(() => flattenTeacherPages(pages), [pages]);
  const page = flat.find(item => item.id === params.get("page")) ?? flat[0];
  const breadcrumbs = page ? teacherPagePath(pages, page.id).slice(0, -1) : [];
  const index = flat.findIndex(item => item.id === page?.id);
  const selectedLessonId = Number(params.get("lesson")) || null;
  const location = `${book?.id ?? "library"}/${page?.id ?? ""}/${selectedLessonId ?? ""}`;
  const { source, layers, turn } = usePageTurn(location);
  const scroll = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
  const previous = useRef<{ location: string; book?: string; index: number } | null>(null);
  const animated = useRef("");
  const loadDashboard = useCallback((signal?: AbortSignal) => {
    const attempt = ++requestId.current;
    return api.get<TeacherDashboard>("/staff/me/dashboard").then(result => {
      if (!signal?.aborted && attempt === requestId.current) setData(result);
    }).catch(err => {
      if (!signal?.aborted && attempt === requestId.current) setError(err instanceof Error ? err.message : "Could not load your teaching workspace.");
    }).finally(() => {
      if (!signal?.aborted && attempt === requestId.current) setRefreshing(false);
    });
  }, []);
  function refresh() {
    setRefreshing(true);
    setError("");
    void loadDashboard();
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/"); return; }
    const account = getAccountType();
    if (account !== "person" || getRole() !== "teacher") { router.replace(account ? getRedirectPath(account, getRole()) : "/"); return; }
    const controller = new AbortController();
    void loadDashboard(controller.signal);
    return () => { controller.abort(); };
  }, [loadDashboard, router]);

  useEffect(() => {
    const prior = previous.current;
    if (prior && prior.location !== location) {
      if (animated.current !== location) turn(prior.book === book?.id ? index - prior.index : 1);
      animated.current = "";
      scroll.current?.scrollTo({ top: 0 });
      heading.current?.focus({ preventScroll: true });
    }
    previous.current = { location, book: book?.id, index };
  }, [book?.id, index, location, turn]);

  const navigate: Navigate = (bookId, pageId, lessonId) => {
    const search = new URLSearchParams();
    if (bookId) search.set("book", bookId);
    if (pageId) search.set("page", pageId);
    if (lessonId) search.set("lesson", String(lessonId));
    const nextPages = bookId && data ? flattenTeacherPages(teacherPages(bookId, data.subjects)) : [];
    const destination = nextPages.find(item => item.id === pageId) ?? nextPages[0];
    const nextLocation = `${bookId ?? "library"}/${destination?.id ?? ""}/${lessonId ?? ""}`;
    if (nextLocation !== location) {
      turn(bookId === book?.id ? nextPages.findIndex(item => item.id === destination?.id) - index : 1);
      animated.current = nextLocation;
    }
    router.push(`/dashboard/staff${search.size ? `?${search}` : ""}`, { scroll: false });
  };

  return <div className={`${styles.workspace} ${styles.boldLinks}`} style={{ "--book-accent": book?.color ?? "#435749" } as CSSProperties}>
    <header className={styles.topbar}><Link href="/dashboard/staff" className={styles.brand}>NEDECEN<span>School workspace</span></Link><span className={styles.role}>Teacher’s library</span><button onClick={() => { logout(); router.replace("/"); }}>Sign out <span aria-hidden="true">↗</span></button></header>
    <div className={styles.layout}>
      <aside className={styles.contents} aria-label="Chapters and headings"><details open><summary>Chapters &amp; Headings <span aria-hidden="true">⌄</span></summary><div className={styles.contentsIntro}>{book ? <><span className={styles.eyebrow}>Open book</span><h2>{book.title}</h2><span>{flat.length} {flat.length === 1 ? "page" : "pages"}</span></> : <p>No book is opened.</p>}</div><nav aria-label="Book contents">{book && <Contents pages={pages} current={page?.id} navigate={id => navigate(book.id, id)} />}</nav><p className={styles.sideNote}>Choose a heading to jump to a page, or use the arrows to turn.</p></details>
        {data && <details className={local.account}><summary>Your staff account <span aria-hidden="true">+</span></summary><h2>{[data.profile.title, data.profile.firstName, data.profile.surname].filter(Boolean).join(" ")}</h2><p>{data.profile.schoolName}</p><dl><dt>Staff number</dt><dd>{data.profile.number}</dd><dt>Username</dt><dd>{data.profile.username ?? "Not available"}</dd></dl></details>}
      </aside>
      <main className={styles.binder} aria-label="Teacher book workspace"><div className={styles.paper} ref={source}>
        <div className={styles.pageToolbar}><nav className={styles.breadcrumb} aria-label="Current book and page">{book ? <button onClick={() => navigate(book.id)}>{book.title}</button> : <span>Your teaching library</span>}{breadcrumbs.map(crumb => <span className={styles.breadcrumbPart} key={crumb.id}><span aria-hidden="true">/</span><button onClick={() => navigate(book!.id, crumb.id)}>{crumb.title}</button></span>)}{page && <><span aria-hidden="true">/</span><span aria-current="page">{page.title}</span></>}</nav><div className={styles.toolbarActions}><button disabled={refreshing} onClick={() => void refresh()}>{refreshing ? "Refreshing…" : "Refresh"}</button>{book && <button onClick={() => navigate()}>Close book ×</button>}</div></div>
        <div className={styles.pageBody}><div className={styles.spine} data-page-spine aria-hidden="true"><span /><span /></div><div className={styles.pageViewport}><div className={styles.pageScroll} data-page-scroll ref={scroll}>
          <div className={local.focusTarget} tabIndex={-1} ref={heading} aria-label={page?.title ?? "Your teaching library"} />
          {error && <div className={styles.viewError} role="alert"><span>{error}</span><button className={styles.textButton} onClick={() => void refresh()}>Try again</button></div>}
          {!data ? error ? <div className={styles.empty}><h1>We couldn’t open your library</h1><p>Try again to load your teaching allocations.</p></div> : <div className={styles.loading} role="status"><span className={styles.eyebrow}>Teacher’s library</span><h1>Preparing your library…</h1><div /><div /><div /></div> : book && page ? page.kind === "lesson-feedback" && page.subject ? <LessonFeedback key={location} subject={page.subject} onAdded={refresh} /> : <>
            <TeacherPageHeading title={page.title} subtitle={page.subject && page.kind !== "subject" ? allocationName(page.subject) : undefined} controls={page.kind === "compose" ? <HomeworkMethodFilters mode={homeworkMode} onChange={setHomeworkMode} /> : undefined} />
            <div className={local.pageContent} key={location}><TeacherBookPage bookId={book.id} page={page} navigate={navigate} refresh={() => void refresh()} selectedLessonId={selectedLessonId} homeworkMode={homeworkMode} /></div>
          </> : book ? <div className={styles.empty}><h1>No teaching assignments yet</h1><p>Your classes and subjects will appear here once your principal assigns them.</p></div> : <div className={styles.welcome}><span className={styles.eyebrow}>A little preparation. More possibility.</span><div className={styles.welcomeBook} aria-hidden="true">N<span>Teacher library</span></div><h1>Your teaching.<br />One page at a time.</h1><p>Lessons, homework and the learning in between.<br />Choose a book from your shelf to get started.</p><button className={styles.primary} onClick={() => navigate("lessons")}>Open Lessons <Arrow /></button><span className={styles.welcomeFoot}>{TEACHER_BOOKS.length} books. One workspace.</span></div>}
        </div></div></div>
        <footer className={styles.pageFooter}><button disabled={!book || index <= 0} onClick={() => navigate(book!.id, flat[index - 1].id)} aria-label="Previous page"><Arrow back /><span>Previous</span></button><span aria-live="polite">{page ? <>Page <strong>{page.number}</strong><span className={styles.footerTitle}> · {page.title}</span></> : "Your teaching library"}</span><button disabled={!book || index < 0 || index >= flat.length - 1} onClick={() => navigate(book!.id, flat[index + 1].id)} aria-label="Next page"><span>Next</span><Arrow /></button></footer>
        <div ref={layers} className={styles.turnLayers} data-page-turn-layers aria-hidden="true" inert><div className={styles.turnUnderlay} />{Array.from({ length: 6 }, (_, i) => <div className={styles.turnSheet} key={i} />)}</div>
      </div></main>
      <aside className={styles.shelf} aria-label="Bookshelf"><details open><summary>Your bookshelf <span className={styles.shelfCount}>{TEACHER_BOOKS.length}</span></summary><p className={styles.shelfIntro}>A book for every part of your teaching.</p><div className={`${styles.books} ${local.books}`}>{TEACHER_BOOKS.map(item => <div className={styles.bookTile} key={item.id}><button className={styles.bookButton} aria-label={`Open ${item.title}`} aria-pressed={book?.id === item.id} onClick={() => navigate(item.id)}><span className={styles.cover} style={{ "--book-color": item.color } as CSSProperties}><span className={styles.coverNumber}>{item.mark}</span><span className={styles.coverTitle}>{item.title}</span><span className={styles.coverSeal} aria-hidden="true">N</span><span className={styles.coverBottom}>NEDECEN</span></span><span className={styles.bookTitle}>{item.title}</span></button><button className={styles.bookInfo} aria-label={`About ${item.title}`} aria-expanded={about === item.id} onClick={() => setAbout(about === item.id ? null : item.id)}>ⓘ <span>About this book</span></button>{about === item.id && <p className={styles.bookDescription}>{item.description}</p>}</div>)}</div><p className={styles.shelfFoot}>Made for the way teachers work.</p></details></aside>
    </div>
  </div>;
}
