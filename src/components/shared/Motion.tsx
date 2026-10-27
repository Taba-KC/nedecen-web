"use client";

import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

/** A real height transition pushes following content down; closed controls leave the tab order immediately. */
export function Collapse({ open, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { open: boolean; children: ReactNode }) {
  return <div {...props} className={`motion-collapse ${className}`} data-open={open} aria-hidden={!open} inert={!open}>
    <div className="motion-collapse-clip"><div>{children}</div></div>
  </div>;
}

/** Measure the actual selected button, including wrapped tabs and resized text. No fixed tab widths. */
export function MotionTabs({ active, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { active: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const selected = root.querySelector<HTMLElement>('button[aria-selected="true"], button[aria-pressed="true"]');
      if (!selected) return;
      root.style.setProperty("--tab-x", `${selected.offsetLeft}px`);
      root.style.setProperty("--tab-y", `${selected.offsetTop}px`);
      root.style.setProperty("--tab-width", `${selected.offsetWidth}px`);
      root.style.setProperty("--tab-height", `${selected.offsetHeight}px`);
      root.dataset.tabReady = "true";
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll("button").forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [active, children]);
  return <div {...props} ref={ref} className={`motion-tabs ${className}`}><span className="motion-tab-indicator" aria-hidden="true" />{children}</div>;
}

/** Fade in the new view after data arrives, without cloning forms or delaying their state updates. */
export function MotionPanel({ changeKey, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { changeKey?: string | number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (changeKey === undefined || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = ref.current?.animate([{ opacity: .35, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 160, easing: "cubic-bezier(.2,.7,.3,1)" });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { if (preference.matches) animation?.cancel(); };
    preference.addEventListener("change", stop);
    return () => { animation?.cancel(); preference.removeEventListener("change", stop); };
  }, [changeKey]);
  return <div {...props} ref={ref} className={className}>{children}</div>;
}
