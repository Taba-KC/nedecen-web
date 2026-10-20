"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSchoolId, logout } from "@/lib/auth";
import { RosterImportModal } from "@/components/principal/RosterImportModal";
import { BOOKS } from "./registry";
import { classLabel, flattenPages, type BookData, type BookPage, type Command, type PageView } from "./types";
import styles from "./books.module.css";
import { usePageTurn } from "./usePageTurn";

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={back ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} /></svg>;
}

function Contents({ pages, active, onNavigate }: { pages: BookPage[]; active?: string; onNavigate: (id: string) => void }) {
  return <ol className={styles.contentsList}>{pages.map(page => <li key={page.id}>
    <button type="button" onClick={() => onNavigate(page.id)} aria-current={active === page.id ? "page" : undefined} className={active === page.id ? styles.currentHeading : undefined}>
      <span className={styles.pageNumber}>{page.number}</span><span>{page.title}</span>
    </button>
    {page.children && <Contents pages={page.children} active={active} onNavigate={onNavigate} />}
  </li>)}</ol>;
}

function SelectionPreview({ value, load }: { value: string; load: (value: string) => Promise<string[]> }) {
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (value) load(value).then(items => { if (!cancelled) setItems(items); }).catch(() => { if (!cancelled) setError("Could not load the subjects. Close and reopen to try again."); });
    return () => { cancelled = true; };
  }, [value, load]);
  if (!value) return null;
  return <div className={styles.selectionPreview}><strong>Subjects in this stream</strong>{error ? <p role="alert">{error}</p> : !items ? <p>Loading subjects…</p> : items.length ? <ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p>This stream has no subjects.</p>}</div>;
}

function CommandDialog({ command, onClose, onSaved }: { command: Command; onClose: () => void; onSaved: (pageId?: string) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<Record<string, string>>({});
  const submitting = useRef(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(Array.from(formData.entries()).filter(([, value]) => typeof value === "string")) as Record<string, string>;
    for (const field of command.fields ?? []) {
      if (field.type === "file") continue;
      values[field.name] = (values[field.name] ?? "").trim();
      if (field.required && !values[field.name]) { setError(`${field.label} is required.`); return; }
    }
    submitting.current = true; setBusy(true); setError("");
    try { const pageId = await command.run?.(values, formData); await onSaved(pageId || undefined); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save. Please try again."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} className={styles.dialog} onCancel={event => { if (busy) event.preventDefault(); else onClose(); }} onClick={event => { if (event.target === dialog.current && !busy) onClose(); }} aria-labelledby="book-dialog-title">
    <form onSubmit={submit}>
      <header><h2 id="book-dialog-title">{command.title ?? command.label}</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Close dialog">×</button></header>
      {command.confirm && <p>{command.confirm}</p>}
      {command.content}
      {(command.fields ?? []).map(field => <label key={field.name}>{field.label}
        {field.type === "subjects" ? <select multiple name={field.name} required={field.required} disabled={busy} size={8}>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : field.type === "select" ? <select name={field.name} defaultValue={field.value ?? ""} required={field.required} disabled={busy} onChange={event => setSelection(current => ({ ...current, [field.name]: event.target.value }))}><option value="">Choose an option</option>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : field.type === "textarea" ? <textarea name={field.name} defaultValue={field.value} required={field.required} disabled={busy} rows={5} maxLength={field.maxLength ?? 10000} />
            : <input name={field.name} type={field.type ?? "text"} accept={field.type === "file" ? "image/*" : undefined} defaultValue={field.value} required={field.required} disabled={busy} maxLength={field.maxLength ?? 200} />}
        {field.preview && <SelectionPreview key={selection[field.name] ?? field.value ?? ""} value={selection[field.name] ?? field.value ?? ""} load={field.preview} />}
      </label>)}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <footer><button type="button" onClick={onClose} disabled={busy}>{command.run ? "Cancel" : "Close"}</button>{command.run && <button type="submit" disabled={busy} className={styles.primary}>{busy ? "Saving…" : command.confirm ? "Confirm delete" : "Save"}</button>}</footer>
    </form>
  </dialog>;
}

/** The single page surface. Books provide data and actions, never their own layout. */
function WorkspacePage({ view, title, query, onNavigate, onCommand, schoolId, data, onRefresh }: {
  view: PageView; title: string; query: string; onNavigate: (id: string) => void; onCommand: (command: Command) => void;
  schoolId: number; data: BookData; onRefresh: () => Promise<void>;
}) {
  return <>
    <div className={styles.pageTitle}><span className={styles.eyebrow}>{view.eyebrow ?? "Principal’s workspace"}</span><h1>{title}</h1>{view.description && <p>{view.description}</p>}{view.image && <Image unoptimized width={800} height={180} className={styles.classImage} src={view.image} alt={`${title} profile`} />}</div>
    {view.stats && <dl className={styles.stats}>{view.stats.map(stat => <div key={stat.label}><dd>{stat.value}</dd><dt>{stat.label}</dt></div>)}</dl>}
    {view.sections?.map(section => {
      const rows = section.rows.filter(row => `${row.title} ${row.detail ?? ""} ${row.badge ?? ""}`.toLowerCase().includes(query.toLowerCase()));
      return <section key={section.title} className={styles.section} aria-label={section.title}><div className={styles.sectionHeading}><h2>{section.title}</h2><span>{rows.length}</span></div>
        {rows.length ? <ul className={styles.rows}>{rows.map(row => <li key={row.id}>
          {row.pageId ? <button className={styles.rowLink} onClick={() => onNavigate(row.pageId!)}><span><strong>{row.title}</strong><small>{row.detail}</small></span><Arrow /></button> : <div className={styles.rowText}><strong>{row.title}</strong>{row.detail && <small>{row.detail}</small>}</div>}
          {row.badge && <span className={styles.badge}>{row.badge}</span>}
          {row.actions?.map(action => <button className={styles.textButton} key={action.label} onClick={() => onCommand(action)}>{action.label}</button>)}
        </li>)}</ul> : <p className={styles.empty}>{query ? "No matches on this page." : section.empty ?? "Nothing here yet."}</p>}
      </section>;
    })}
    {view.content}
    {view.import && <RosterImportModal key={`${view.import.kind}-${view.import.classId ?? "all"}`} inline schoolId={schoolId} kind={view.import.kind} initialClassId={view.import.classId} fixedClass={!!view.import.classId}
      classOptions={(data.classes ?? []).map(cls => ({ value: String(cls.id), label: classLabel(cls) }))} onClose={() => onNavigate(view.import?.classId ? `class-${view.import.classId}` : view.import?.kind === "staff" ? "staff" : "learners")} onSaved={onRefresh} />}
    {(!!view.actions?.length || !!view.links?.length) && <div className={styles.pageActions}>{view.actions?.map((action, index) => <button className={index === 0 ? styles.primary : undefined} key={action.label} onClick={() => onCommand(action)}>{action.label}</button>)}{view.links?.map(link => <button key={link.pageId} onClick={() => onNavigate(link.pageId)}>{link.label}<Arrow /></button>)}</div>}
  </>;
}

export function BookWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const bookId = params.get("book");
  const pageId = params.get("page");
  const tab = params.get("tab") ?? "";
  const book = BOOKS.find(item => item.id === bookId);
  const [loaded, setLoaded] = useState<{ bookId: string; data: BookData; revision: number } | null>(null);
  const [viewState, setViewState] = useState<{ key: string; view: PageView } | null>(null);
  const [loadError, setLoadError] = useState<{ bookId: string; message: string } | null>(null);
  const [viewError, setViewError] = useState<{ key: string; message: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [command, setCommand] = useState<Command | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const importChanged = useRef(false);
  const data = loaded && book && loaded.bookId === book.id && loaded.revision === revision ? loaded.data : null;
  const pages = useMemo(() => book && data ? book.pages(data) : [], [book, data]);
  const flat = useMemo(() => flattenPages(pages), [pages]);
  const page = flat.find(item => item.id === pageId) ?? flat[0];
  const index = flat.findIndex(item => item.id === page?.id);
  const viewKey = `${bookId}/${page?.id}/${tab}/${revision}`;
  const view = viewState?.key === viewKey ? viewState.view : null;
  const error = loadError && book && loadError.bookId === book.id ? loadError.message : viewError?.key === viewKey ? viewError.message : null;
  const { source: sheet, layers: turnLayers, turn } = usePageTurn(view ? viewKey : `${bookId}/${pageId}/${tab}/loading`);

  useEffect(() => {
    if (!book) return;
    const schoolId = getSchoolId();
    if (!schoolId) { router.replace("/"); return; }
    let cancelled = false;
    book.load(schoolId).then(data => { if (!cancelled) { setLoaded({ bookId: book.id, data, revision }); setLoadError(null); } }).catch(err => { if (!cancelled) setLoadError({ bookId: book.id, message: err instanceof Error ? err.message : "Could not open this book." }); });
    return () => { cancelled = true; };
  }, [book, revision, router]);

  useEffect(() => {
    if (!book || !data || !page) return;
    const schoolId = getSchoolId();
    if (!schoolId) return;
    let cancelled = false;
    book.view({ schoolId, data, page, tab }).then(view => { if (!cancelled) { setViewState({ key: viewKey, view }); setViewError(null); } }).catch(err => { if (!cancelled) setViewError({ key: viewKey, message: err instanceof Error ? err.message : "Could not load this page." }); });
    return () => { cancelled = true; };
  }, [book, data, page, tab, viewKey]);

  useEffect(() => {
    const updateAfterImport = () => { if (importChanged.current) { importChanged.current = false; setRevision(value => value + 1); } };
    window.addEventListener("popstate", updateAfterImport);
    return () => window.removeEventListener("popstate", updateAfterImport);
  }, []);

  const previousLocation = useRef("");
  const previousIndex = useRef(0);
  const animatedLocation = useRef("");
  useEffect(() => {
    const onHistory = () => {
      const search = new URLSearchParams(window.location.search);
      const nextPage = search.get("page");
      const nextBook = search.get("book");
      if (nextBook === bookId && (nextPage ?? flat[0]?.id) === page?.id) return;
      const nextIndex = flat.findIndex(item => item.id === nextPage);
      turn(nextBook === bookId && nextIndex >= 0 ? nextIndex - index : 1);
      animatedLocation.current = `${nextBook}/${nextPage}`;
    };
    window.addEventListener("popstate", onHistory);
    return () => window.removeEventListener("popstate", onHistory);
  }, [bookId, flat, index, page?.id, turn]);
  useEffect(() => {
    const location = `${bookId}/${pageId}`;
    if (previousLocation.current && location !== previousLocation.current) {
      if (animatedLocation.current !== location) turn(index - previousIndex.current);
      animatedLocation.current = "";
      sheet.current?.scrollTo({ top: 0 });
    }
    previousLocation.current = location;
    previousIndex.current = index;
  }, [bookId, pageId, index, sheet, turn]);

  function navigate(nextBook: string, nextPage?: string, nextTab?: string) {
    if (importChanged.current) { importChanged.current = false; setRevision(value => value + 1); }
    const search = new URLSearchParams({ book: nextBook });
    if (nextPage) search.set("page", nextPage);
    if (nextTab) search.set("tab", nextTab);
    // Paint the turn immediately, before the router or the destination data finishes.
    const nextIndex = flat.findIndex(item => item.id === nextPage);
    const destination = nextPage ?? (nextBook === bookId ? flat[0]?.id : undefined);
    if (nextBook !== bookId || destination !== page?.id) {
      turn(nextBook === bookId ? (nextIndex >= 0 ? nextIndex : 0) - index : 1);
      animatedLocation.current = `${nextBook}/${nextPage ?? null}`;
    }
    router.push(`/dashboard/principal?${search}`, { scroll: false });
    setQuery("");
  }
  async function refresh(nextPage?: string) {
    if (nextPage && book) navigate(book.id, nextPage);
    setRevision(value => value + 1);
  }

  return <div className={styles.workspace} style={book ? { "--book-accent": book.color } as React.CSSProperties : undefined}>
    <header className={styles.topbar}><Link href="/dashboard/principal" className={styles.brand}>NEDECEN<span>School workspace</span></Link><span className={styles.role}>Principal’s library</span><button onClick={() => { logout(); router.replace("/"); }}>Sign out <span aria-hidden="true">↗</span></button></header>
    <div className={styles.layout}>
      <aside className={styles.contents} aria-label="Chapters and headings"><details open><summary>Chapters &amp; Headings <span aria-hidden="true">⌄</span></summary>
        <div className={styles.contentsIntro}>{book ? <><span className={styles.eyebrow}>Open book</span><h2>{book.title}</h2><span>{flat.length} pages</span></> : <p>No book is opened.</p>}</div>
        <nav aria-label="Book contents">{pages.length > 0 && <Contents pages={pages} active={page?.id} onNavigate={id => navigate(book!.id, id)} />}</nav>
        {book && !data && !error && <p className={styles.sideNote}>Opening chapters…</p>}
        <p className={styles.sideNote}>Choose a heading to jump to a page, or use the arrows to turn.</p>
      </details></aside>
      <main className={styles.binder} aria-label="Book workspace">
        <div className={styles.paper}>
          <div className={styles.pageToolbar}><span>{book ? book.title : "Your school library"}</span>{book && <button onClick={() => router.push("/dashboard/principal", { scroll: false })} aria-label="Close book">Close book ×</button>}</div>
          <div className={styles.pageBody}>
          <div className={styles.spine} aria-hidden="true"><span /><span /></div>
          <div className={styles.pageViewport}>
          <div className={styles.pageScroll} ref={sheet} aria-busy={!!book && !view && !error}>
            {!book ? <div className={styles.welcome}><span className={styles.eyebrow}>A little order. More possibility.</span><div className={styles.welcomeBook} aria-hidden="true">N<span>School library</span></div><h1>Your school.<br />One page at a time.</h1><p>Grades, people and everything in between.<br />Choose a book from your shelf to get started.</p><button className={styles.primary} onClick={() => navigate("grades")}>Open Grades &amp; Classes <Arrow /></button><span className={styles.welcomeFoot}>{BOOKS.length} books. One workspace.</span></div>
              : error ? <div className={styles.empty}><h1>We couldn’t open this page</h1><p role="alert">{error}</p><button onClick={() => void refresh()}>Try again</button></div>
                : view && page && data ? <>
                  <div className={styles.tools}>{view.tabs && <div className={styles.tabs} aria-label="Page view">{view.tabs.map((item, index) => <button key={item.id} aria-pressed={(tab || view.tabs![0].id) === item.id} onClick={() => navigate(book.id, page.id, index === 0 ? undefined : item.id)}>{item.label}</button>)}</div>}
                    {!!view.sections?.some(section => section.rows.length > 5) && <label className={styles.search}><span className="sr-only">Search this page</span><input placeholder="Search this page…" value={query} onChange={event => setQuery(event.target.value)} /></label>}</div>
                  <WorkspacePage view={view} title={page.title} query={query} onNavigate={id => navigate(book.id, id)} onCommand={setCommand} schoolId={getSchoolId()!} data={data} onRefresh={async () => { importChanged.current = true; }} />
                </> : <div className={styles.loading} role="status"><span className={styles.eyebrow}>{page?.title ?? "Opening book"}</span><h1>Preparing your page…</h1><div /><div /><div /></div>}
          </div>
          <div ref={turnLayers} className={styles.turnLayers} aria-hidden="true" inert><div className={styles.turnUnderlay} />{Array.from({ length: 6 }, (_, index) => <div className={styles.turnSheet} key={index} />)}</div>
          </div>
          </div>
          <footer className={styles.pageFooter}><button disabled={!book || index <= 0} onClick={() => navigate(book!.id, flat[index - 1].id)} aria-label="Previous page"><Arrow back /><span>Previous</span></button><span aria-live="polite">{page ? <>Page <strong>{page.number}</strong><span className={styles.footerTitle}> · {page.title}</span></> : "No book opened"}</span><button disabled={!book || index < 0 || index >= flat.length - 1} onClick={() => navigate(book!.id, flat[index + 1].id)} aria-label="Next page"><span>Next</span><Arrow /></button></footer>
        </div>
      </main>
      <aside className={styles.shelf} aria-label="Bookshelf"><details open><summary>Your bookshelf <span className={styles.shelfCount}>{BOOKS.length}</span></summary><p className={styles.shelfIntro}>A book for every part of your school.</p><div className={styles.books}>{BOOKS.map(item => <div key={item.id} className={styles.bookTile}>
        <button className={styles.bookButton} onClick={() => navigate(item.id)} aria-label={`Open ${item.title}`} aria-pressed={book?.id === item.id}>
          <span className={styles.cover} style={{ "--book-color": item.color } as React.CSSProperties}><span className={styles.coverNumber}>{item.mark}</span><span className={styles.coverTitle}>{item.title}</span><span className={styles.coverSeal} aria-hidden="true">N</span><span className={styles.coverBottom}>NEDECEN</span></span>
          <span className={styles.bookTitle}>{item.title}</span>
        </button><button className={styles.bookInfo} aria-label={`About ${item.title}`} aria-expanded={description === item.id} onClick={() => setDescription(description === item.id ? null : item.id)}>ⓘ <span>About this book</span></button>
        {description === item.id && <p className={styles.bookDescription}>{item.description}</p>}
      </div>)}</div><p className={styles.shelfFoot}>Made for the way schools work.</p></details></aside>
    </div>
    {command && <CommandDialog command={command} onClose={() => setCommand(null)} onSaved={refresh} />}
  </div>;
}
