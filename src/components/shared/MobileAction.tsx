import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./mobile-action.module.css";

export type ActionIcon = "edit" | "delete" | "view" | "add" | "upload" | "up" | "down" | "left" | "right" | "replace" | "confirm" | "refresh" | "homework";

/** Use familiar symbols only; ambiguous workflow decisions keep their written labels. */
export function actionIconFor(label: string): ActionIcon | undefined {
  if (/^(edit|rename)\b/i.test(label)) return "edit";
  if (/^(delete|remove)\b/i.test(label)) return "delete";
  if (/^(add|create|insert)\b/i.test(label)) return "add";
  if (/^view\b/i.test(label)) return "view";
  if (/^(upload|import|bulk import)\b/i.test(label)) return "upload";
  return undefined;
}

function Icon({ name }: { name: ActionIcon }) {
  const paths: Record<ActionIcon, ReactNode> = {
    edit: <><path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15z" /><path d="M13 20h7" /></>,
    delete: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
    view: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    add: <path d="M12 5v14M5 12h14" />,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" /></>,
    up: <path d="M12 20V4m-6 6 6-6 6 6" />,
    down: <path d="M12 4v16m-6-6 6 6 6-6" />,
    left: <path d="M20 12H4m6-6-6 6 6 6" />,
    right: <path d="M4 12h16m-6-6 6 6-6 6" />,
    replace: <><path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4" /></>,
    confirm: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    refresh: <><path d="M20 4v6h-6M4 20v-6h6" /><path d="M5 9a7 7 0 0 1 12-4l3 5M4 14l3 5a7 7 0 0 0 12-4" /></>,
    homework: <><path d="M14 2H5v20h14V7zM14 2v5h5M8 11h8M8 15h5" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

/** Shared content also works inside a full-row button without nesting another button. */
export function MobileActionContent({ icon, children }: { icon: ActionIcon; children: ReactNode }) {
  const prefixed = icon === "add" && typeof children === "string" && /^\+\s*/.test(children);
  return <span className={styles.content}><span className={styles.icon}><Icon name={icon} /></span><span className={styles.label}>{prefixed ? <><span className={styles.prefix}>+ </span>{children.replace(/^\+\s*/, "")}</> : children}</span></span>;
}

/** Important workflow actions keep their labels; familiar utility actions stay compact. */
export default function MobileAction({ icon, label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ActionIcon; label: string; children?: ReactNode }) {
  const labelled = icon && ["add", "upload", "confirm", "homework"].includes(icon);
  return <button type="button" {...props} aria-label={props["aria-label"] ?? label} title={props.title ?? label} className={`${className} ${icon ? styles.button : ""} ${labelled ? styles.labelled : ""}`} data-mobile-action={icon}>
    {icon ? <MobileActionContent icon={icon}>{children ?? label}</MobileActionContent> : children ?? label}
  </button>;
}
