"use client";

/**
 * Role-scoped dashboard data and subject selection, used by the learner route. It
 * coordinates refreshes and delegates workflow details to smaller forms. Subject types here
 * also describe data used by the teacher bookshelf.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccountType, getRedirectPath, getRole, isLoggedIn, logout } from "@/lib/auth";
import styles from "./role-dashboard.module.css";
import LessonFeedbackForm from "./LessonFeedbackForm";
import StaffClasses, { type StaffPanel } from "./StaffClasses";

type Concept = { id: number; name: string; prerequisites?: string[]; learningOutcomes?: string[]; teachingBrief?: { conceptName: string; prerequisites: string[]; learningOutcomes: string[] } | null };
type Chapter = { id: number; name: string; total: number; taught: number; topics: { id: number; name: string; concepts: Concept[] }[] };
type Lesson = { id: number; lessonNumber?: number; date: string; status: string; chapterName: string; concepts: Concept[]; homework: { id: number; dueDate: string; questions: { id: number; body: string; conceptId: number; memo?: string | null }[] }[] };
export type Subject = { id: number; subjectName: string; className: string; classId: number; gradeNumber: number; totalConcepts: number; taughtConcepts: number; currentChapter: { name: string } | null; curriculum: Chapter[]; lessons: Lesson[] };
type Task = { id: string; classSubjectId: number; lessonId: number; subjectName: string; className: string; kind: string; date: string };
type Dashboard = { profile: { firstName: string; surname: string; title?: string | null; username: string | null; number: string; schoolName: string; className: string | null }; subjects: Subject[]; needsYou: Task[]; waitingForYou: Task[]; comingUp: Task[]; announcements: { id: number; title: string; body: string; createdAt: string }[] };
/**
 * Format a stored date for display. Formatting a label does not change the saved lesson or
 * due time.
 */
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date(value.length === 10 ? value + "T12:00:00+02:00" : value));
}

export default function RoleDashboard({ role }: { role: "staff" | "learner" }) {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"home" | "subjects" | "history">("home");
  const [selected, setSelected] = useState<number | null>(null);
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [staffPanel, setStaffPanel] = useState<StaffPanel | null>(null);
  const staff = role === "staff";
  const section = staff ? "Classes" : "Subjects";
  const fetchDashboard = useCallback(() => api.get<Dashboard>(role === "staff" ? "/staff/me/dashboard" : "/learners/me/dashboard"), [role]);
  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/"); return; }
    const account = getAccountType();
    if (account !== (role === "staff" ? "person" : "learner") || (role === "staff" && getRole() !== "teacher")) {
      router.replace(account ? getRedirectPath(account, getRole()) : "/"); return;
    }
    let active = true;
    fetchDashboard().then(dashboard => { if (active) setData(dashboard); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load your dashboard."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchDashboard, role, router]);
  const subject = data?.subjects.find(item => item.id === selected);
  const tasks = data ? (staff ? data.needsYou : data.waitingForYou) : [];
  /**
   * Load a fresh role-specific dashboard after an operation changes its records.
   */
  function refresh() {
    setLoading(true); setError("");
    fetchDashboard().then(setData)
      .catch(err => setError(err instanceof Error ? err.message : "Could not load your dashboard."))
      .finally(() => setLoading(false));
  }
  /**
   * Select an allocation and optional lesson in local state, then open its subject view. This
   * component does not update the browser URL for that selection.
   */
  function openSubject(id: number, lesson: number | null = null) { setSelected(id); setLessonId(lesson); setTab("subjects"); setStaffPanel(staff && lesson !== null ? "confirm" : null); }
  /**
   * Change the local tab and clear the prior subject/lesson/panel selection. This is a UI
   * state change, not a database write.
   */
  function openTab(next: "home" | "subjects" | "history") { setTab(next); setSelected(null); setLessonId(null); setStaffPanel(null); }
  function taskList(items: Task[], empty: string) {
    return items.length ? <ul className={styles.taskList}>{items.map(item => <li key={item.id}><button className={styles.task} onClick={() => { openSubject(item.classSubjectId, item.lessonId); if (staff && item.kind === "Create homework") setStaffPanel("createHomework"); }}><span><strong>{item.kind}</strong><span className={styles.meta}>{item.subjectName} · {item.className}</span></span><span className={styles.taskDate}>{dateLabel(item.date)} <span aria-hidden="true">→</span></span></button></li>)}</ul> : <p className={styles.empty}>{empty}</p>;
  }
  return <div className={styles.shell}>
    <header className={styles.header}>
      <a href={staff ? "/dashboard/staff" : "/dashboard/learner"} className={styles.brand}>ANELOC</a>
      <nav className={styles.nav} aria-label={staff ? "Staff navigation" : "Learner navigation"}>
        <button aria-current={tab === "home" ? "page" : undefined} onClick={() => openTab("home")}>Home{tasks.length > 0 && <span className={styles.badge}>{tasks.length}<span className={styles.srOnly}> waiting items</span></span>}</button>
        <button aria-current={tab === "subjects" ? "page" : undefined} onClick={() => openTab("subjects")}>{section}</button>
        {staff && <button aria-current={tab === "history" ? "page" : undefined} onClick={() => openTab("history")}>History</button>}
      </nav>
      <button className={styles.signOut} onClick={() => { logout(); router.replace("/"); }}>Sign out</button>
    </header>
    <main className={styles.main + (tab !== "home" ? " " + styles.fullWidth : "")}>
      {loading && !data ? <section className={styles.panel} aria-live="polite"><h1>Loading your workspace…</h1></section> : error ? <section className={styles.panel} role="alert"><h1>We couldn’t load your workspace</h1><p>{error}</p><button className={styles.button} onClick={refresh}>Try again</button></section> : data && staff && tab !== "home" ? <StaffClasses history={tab === "history"} subjects={data.subjects} selectedId={selected} onSelect={id => openSubject(id)} onBack={() => { setSelected(null); setStaffPanel(null); }} panel={staffPanel} onPanelChange={setStaffPanel} lessonId={lessonId} onRefresh={refresh} refreshing={loading} /> : data && <>
        <div className={styles.content}>
          <div className={styles.heading}><div><p className={styles.eyebrow}>{staff ? "Staff workspace" : data.profile.className || "Learner workspace"}</p><h1>{tab === "home" ? "Hello, " + data.profile.firstName : subject ? subject.subjectName : "Your " + section.toLowerCase()}</h1><p>{tab === "home" ? (staff ? "Your teaching day, in one place." : "Your lessons, feedback and homework.") : subject ? subject.className + " · Grade " + subject.gradeNumber : staff ? "The subjects and classes assigned to you." : "Subjects from your class. Your school manages this list."}</p></div><button className={styles.button} onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
          {tab === "home" ? <>
            {staff && data.subjects.length === 0 ? <section className={styles.panel}><span className={styles.status}>Awaiting assignment</span><h2>You’re registered. Your teaching assignments are next.</h2><p>Your principal hasn’t assigned you to a subject in a class yet. Once they do, your classes and teaching tasks will appear here.</p><p className={styles.muted}>You can still read school announcements on this page.</p></section> : <section className={styles.panel}><div className={styles.sectionTitle}><h2>{staff ? "Needs you" : "Waiting for you"}</h2>{tasks.length > 0 && <span className={styles.badge}>{tasks.length}</span>}</div>{taskList(tasks, staff ? "You’re up to date. No lesson confirmations or homework preparation are waiting." : "You’re up to date. Nothing is waiting for your response.")}</section>}
            {!staff && <section className={styles.panel}><h2>Coming up</h2><p className={styles.muted}>A look at your next planned lessons.</p>{taskList(data.comingUp, "Your teachers haven’t shared an upcoming lesson yet.")}</section>}
            {data.subjects.length > 0 && <section><div className={styles.sectionTitle}><h2>Your {section.toLowerCase()}</h2><button className={styles.textButton} onClick={() => openTab("subjects")}>View all →</button></div><div className={styles.grid}>{data.subjects.slice(0, 4).map(item => <SubjectCard key={item.id} subject={item} staff={staff} onOpen={() => openSubject(item.id)} />)}</div></section>}
          </> : subject ? <>
            <button className={styles.textButton} onClick={() => { setSelected(null); setLessonId(null); }}>← All {section.toLowerCase()}</button>
            {staff && <section className={styles.panel}><h2>Curriculum coverage</h2><Progress subject={subject} /><p className={styles.muted}>Only confirmed lessons count as taught. Planned lessons do not change coverage.</p></section>}
            <section className={styles.panel}><h2>Lessons & homework</h2>{subject.lessons.length ? subject.lessons.map(lesson => <details key={lesson.id} open={lessonId === lesson.id ? true : undefined} className={styles.disclosure}><summary><span>{lesson.chapterName}<small>{dateLabel(lesson.date)} · {lesson.status === "confirmed" ? "Confirmed" : "Planned"}</small></span></summary><div className={styles.details}><h3>Concepts</h3>{!staff && lesson.status === "confirmed" ? <LessonFeedbackForm key={lesson.id} lessonId={lesson.id} /> : <ul>{lesson.concepts.map(concept => <li key={concept.id}>{concept.name}</li>)}</ul>}{lesson.homework.map(hw => <div key={hw.id}><h3>Homework · due {dateLabel(hw.dueDate)}</h3><ol>{hw.questions.map(question => <li key={question.id}>{question.body}</li>)}</ol></div>)}</div></details>) : <p className={styles.empty}>No lessons have been shared for this subject yet.</p>}</section>
            <section className={styles.panel}><h2>Curriculum</h2><p className={styles.muted}>{staff ? "Chapters, topics and concepts in your teaching allocation." : "Explore the chapters, topics and concepts for this subject in your grade."}</p>{subject.curriculum.length ? subject.curriculum.map(chapter => <details className={styles.disclosure} key={chapter.id}><summary><span>{chapter.name}<small>{staff ? chapter.taught + " / " + chapter.total + " concepts taught" : chapter.total + " concepts"}</small></span></summary><div className={styles.details}>{chapter.topics.map(topic => <details className={styles.topic} key={topic.id}><summary>{topic.name}<small>{topic.concepts.length} concepts</small></summary><ol>{topic.concepts.map(concept => <li key={concept.id}>{concept.name}</li>)}</ol></details>)}</div></details>) : <p className={styles.empty}>Curriculum hasn’t been published for this allocation yet.</p>}</section>
          </> : <div className={styles.grid}>{data.subjects.length ? data.subjects.map(item => <SubjectCard key={item.id} subject={item} staff={staff} onOpen={() => openSubject(item.id)} />) : <section className={styles.panel}><h2>{staff ? "No teaching assignments yet" : "No subjects yet"}</h2><p>{staff ? "Ask your principal to assign you to a subject in a class. Your assignments will appear here automatically." : "Your school hasn’t added subjects to your class yet. Contact your principal if this looks wrong."}</p></section>}</div>}
        </div>
        {tab === "home" && <aside className={styles.aside}>
          <section className={styles.profile}><p className={styles.eyebrow}>{staff ? "Staff account" : "Learner account"}</p><h2>{[staff ? data.profile.title : null, data.profile.firstName, data.profile.surname].filter(Boolean).join(" ")}</h2><p>{data.profile.schoolName}</p><dl><dt>{staff ? "Staff number" : "Admission number"}</dt><dd>{data.profile.number}</dd>{data.profile.className && <><dt>Class</dt><dd>{data.profile.className}</dd></>}<dt>Username</dt><dd>{data.profile.username}</dd></dl></section>
          <section className={styles.panel}><h2>Announcements</h2>{data.announcements.length ? data.announcements.map(notice => <article className={styles.announcement} key={notice.id}><time>{dateLabel(notice.createdAt)}</time><h3>{notice.title}</h3><p>{notice.body}</p></article>) : <p className={styles.empty}>No school announcements yet.</p>}</section>
        </aside>}
      </>}
    </main>
  </div>;
}
/**
 * Display a progress indicator from supplied totals; calculation of permitted/taught records
 * belongs to the data source.
 */
function Progress({ subject }: { subject: Subject }) { return <><div className={styles.progressLabel}><span>{subject.taughtConcepts} / {subject.totalConcepts} concepts taught</span><span>{subject.totalConcepts ? Math.round(subject.taughtConcepts / subject.totalConcepts * 100) : 0}%</span></div><progress value={subject.taughtConcepts} max={subject.totalConcepts || 1} aria-label="Confirmed curriculum coverage" /></>; }
/**
 * Render one supplied class-subject allocation and its action for opening details.
 */
function SubjectCard({ subject, staff, onOpen }: { subject: Subject; staff: boolean; onOpen: () => void }) { return <article className={styles.subjectCard}><p className={styles.eyebrow}>{subject.className} · Grade {subject.gradeNumber}</p><h2>{subject.subjectName}</h2>{staff && <><p className={styles.muted}>{subject.currentChapter?.name ?? "Curriculum pending"}</p><Progress subject={subject} /></>}<button className={styles.button} onClick={onOpen}>{staff ? "Open class subject" : "Explore subject"}<span aria-hidden="true"> →</span></button></article>; }
