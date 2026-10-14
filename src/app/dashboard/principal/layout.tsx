"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { logout } from "@/lib/auth";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGrades({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function IconLayers({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="4" rx="1" />
      <rect x="2" y="10" width="20" height="4" rx="1" />
      <rect x="2" y="16" width="20" height="4" rx="1" />
    </svg>
  );
}


function IconBriefcase({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconLearners({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconBell({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconSettings({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 1 1-2.98 2.98l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V21.4a2.1 2.1 0 1 1-4.2 0v-.06A1.8 1.8 0 0 0 8.4 19.7a1.8 1.8 0 0 0-1.98.36l-.04.04A2.1 2.1 0 1 1 3.4 17.1l.04-.04A1.8 1.8 0 0 0 3.8 15.1a1.8 1.8 0 0 0-1.66-1.1H2.1a2.1 2.1 0 1 1 0-4.2h.06A1.8 1.8 0 0 0 3.8 8.7a1.8 1.8 0 0 0-.36-1.98L3.4 6.68A2.1 2.1 0 1 1 6.38 3.7l.04.04A1.8 1.8 0 0 0 8.4 4.1 1.8 1.8 0 0 0 9.5 2.44V2.1a2.1 2.1 0 1 1 4.2 0v.06a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.04-.04A2.1 2.1 0 1 1 19.8 6.4l-.04.04A1.8 1.8 0 0 0 19.4 8.4a1.8 1.8 0 0 0 1.66 1.1h.34a2.1 2.1 0 1 1 0 4.2h-.06A1.8 1.8 0 0 0 19.4 15z" />
    </svg>
  );
}

function IconUser({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconMoon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconSun({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconLogout({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  Icon: (props: { size?: number }) => React.ReactElement;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { label: "Grades & Classes", href: "/dashboard/principal/grades",    Icon: IconGrades },
  { label: "Streams",          href: "/dashboard/principal/streams",   Icon: IconLayers },
  { label: "Staff",            href: "/dashboard/principal/staff",     Icon: IconBriefcase },
  { label: "Learners",      href: "/dashboard/principal/learners",     Icon: IconLearners },
  { label: "Announcements", href: "/dashboard/principal/announcements",Icon: IconBell },
];

function isActive(href: string, pathname: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <div className="grades-glass relative isolate min-h-screen flex overflow-hidden lg:h-screen">
      <div className="grades-backdrop" aria-hidden="true" />
      {/* ── Sidebar — tablet only (md → lg) ──────────────────────────────── */}
      <aside
        className="glass-panel principal-sidebar hidden md:flex lg:hidden fixed left-0 top-0 bottom-0 w-52 flex-col z-20"
        style={{
          backgroundColor: "var(--color-card)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-5 h-16 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            NEDECEN
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.href, pathname, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? "var(--color-accent-muted)" : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                }}
              >
                <item.Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme + logout */}
        <div
          className="px-3 py-4 flex flex-col gap-0.5 flex-shrink-0"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            {theme === "light" ? <IconMoon size={18} /> : <IconSun size={18} />}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            <IconLogout size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-52 lg:ml-0 lg:min-h-0">

        {/* Top bar — mobile + desktop. Hidden on tablet (sidebar owns it). */}
        <header
          className="flex h-16 items-center justify-between sticky top-0 z-10 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)] px-6 md:hidden lg:flex lg:h-[96px] lg:items-start lg:border-b-0 lg:bg-transparent lg:px-12 lg:pb-3 lg:pt-6"
        >
          <div className="flex items-center gap-2 lg:hidden">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Thuto Le <span style={{ color: "var(--color-accent)" }}>Bokgoni</span>
            </span>
          </div>

          <Link
            href="/dashboard/principal/grades"
            className="hidden lg:flex items-center text-[22px] font-black tracking-[-0.02em]"
            style={{ color: "var(--color-accent)", fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            ANELOC
          </Link>

          <nav
            className="glass-panel hidden lg:flex items-center rounded-full px-3 py-2"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(37, 37, 37, 0.06)",
              boxShadow: "0 8px 20px rgba(37, 37, 37, 0.04)",
            }}
          >
            {NAV.map((item) => {
              const active = isActive(item.href, pathname, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="glass-nav-item rounded-full px-5 py-2 text-[14px] font-semibold leading-none transition-all hover:bg-black/5"
                  style={{
                    backgroundColor: active ? "rgba(171, 38, 49, 0.55)" : "transparent",
                    color: active ? "#ffffff" : "var(--color-school-black)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              className="glass-nav-item rounded-full px-5 py-2 text-[14px] font-semibold leading-none transition-all hover:bg-black/5"
              style={{ color: "var(--color-school-black)" }}
            >
              More &gt;
            </button>
          </nav>

          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1.5px solid var(--color-border)",
              }}
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>

          <div
            className="glass-panel glass-utility-bar hidden lg:flex items-center gap-2 rounded-full px-3 py-2"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(37, 37, 37, 0.06)",
              boxShadow: "0 8px 20px rgba(37, 37, 37, 0.04)",
            }}
          >
            <button
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: "var(--color-school-grey)", border: "1px solid var(--color-school-panel)" }}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              <IconSettings size={21} />
            </button>
            <Link
              href="/dashboard/principal/announcements"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: "var(--color-school-grey)", border: "1px solid var(--color-school-panel)" }}
              title="Announcements"
              aria-label="Announcements"
            >
              <IconBell size={20} />
            </Link>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: "var(--color-school-grey)", border: "1px solid var(--color-school-panel)" }}
              title="Sign out"
              aria-label="Sign out"
            >
              <IconUser size={21} />
            </button>
          </div>
        </header>

        {/* Page content — pad bottom on mobile for the bottom nav */}
        <main className="flex-1 min-h-0 overflow-hidden pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Bottom nav — mobile only (<md) ───────────────────────────────── */}
      <nav
        className="glass-panel fixed bottom-0 left-0 right-0 flex md:hidden z-20"
        style={{
          backgroundColor: "var(--color-card)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        {NAV.map((item) => {
          const active = isActive(item.href, pathname, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="flex-1 flex items-center justify-center py-3.5"
              style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}
            >
              <item.Icon size={20} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
