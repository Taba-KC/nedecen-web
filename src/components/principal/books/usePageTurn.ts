"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { pageTurnFrames, pageTurnSchedule } from "./pageTurnMotion";

/** A temporary, inert picture of the visible DOM, not another mounted page. */
function snapshot(source: HTMLElement) {
  const copy = source.cloneNode(true) as HTMLElement;
  // The animation lives inside the paper, but must never copy itself or pins.
  copy.querySelectorAll("[data-page-turn-layers], [data-page-spine]").forEach(element => element.remove());
  copy.inert = true;
  copy.setAttribute("aria-hidden", "true");
  copy.removeAttribute("id");
  copy.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
  Object.assign(copy.style, {
    position: "absolute", inset: "0", width: "100%", height: "100%",
    maxHeight: "none", overflow: "hidden", pointerEvents: "none", border: "0", boxShadow: "none",
  });
  // Preserve the visible position and any unsaved values in an import preview.
  const originals = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
  copy.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select").forEach((field, index) => {
    if (field instanceof HTMLInputElement && field.type === "file") return;
    field.value = originals[index].value;
    if (field instanceof HTMLInputElement && originals[index] instanceof HTMLInputElement) field.checked = (originals[index] as HTMLInputElement).checked;
  });
  const originalScrollers = source.querySelectorAll<HTMLElement>("[data-page-scroll]");
  const scrolls = Array.from(copy.querySelectorAll<HTMLElement>("[data-page-scroll]")).map((element, index) => ({ element, top: originalScrollers[index].scrollTop, left: originalScrollers[index].scrollLeft }));
  return { copy, scrolls };
}

function placeSnapshot(target: HTMLElement, source: HTMLElement, incoming = false) {
  const { copy, scrolls } = snapshot(source);
  target.replaceChildren(copy);
  for (const scroll of scrolls) {
    scroll.element.scrollTop = incoming ? 0 : scroll.top;
    scroll.element.scrollLeft = incoming ? 0 : scroll.left;
  }
}

export function usePageTurn(contentKey: string) {
  const source = useRef<HTMLDivElement>(null);
  const layers = useRef<HTMLDivElement>(null);
  const active = useRef<{ animations: Animation[]; incoming: HTMLElement; reverse: HTMLElement | null; sourceKey: string } | null>(null);
  const latestKey = useRef(contentKey);

  const clear = useCallback(() => {
    const previous = active.current;
    active.current = null;
    previous?.animations.forEach(animation => animation.cancel());
    if (layers.current) {
      layers.current.removeAttribute("data-turning");
      Array.from(layers.current.children).forEach(layer => layer.replaceChildren());
    }
  }, [layers]);

  useLayoutEffect(() => {
    latestKey.current = contentKey;
    const current = active.current;
    // A backward turn carries the destination content as soon as it is ready.
    // Its motion has already started and is never delayed or restarted by data.
    if (current?.incoming && current.sourceKey !== contentKey && source.current) {
      placeSnapshot(current.incoming, source.current, true);
      if (current.reverse) placeSnapshot(current.reverse, source.current, true);
    }
  }, [contentKey, source]);

  useLayoutEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopIfReduced = () => { if (preference.matches) clear(); };
    preference.addEventListener("change", stopIfReduced);
    return () => { preference.removeEventListener("change", stopIfReduced); clear(); };
  }, [clear]);

  const turn = useCallback((distance: number) => {
    clear();
    if (!distance || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !source.current || !layers.current) return;
    const [underlay, ...sheets] = Array.from(layers.current.children) as HTMLElement[];
    if (!underlay || !sheets.length) return;
    const backward = distance < 0;
    const schedule = pageTurnSchedule(distance);
    const frames = pageTurnFrames(backward);
    const current = { animations: [] as Animation[], incoming: underlay, reverse: null as HTMLElement | null, sourceKey: latestKey.current };
    active.current = current;
    layers.current.dataset.turning = backward ? "backward" : "forward";
    if (backward) placeSnapshot(underlay, source.current);

    for (let index = 0; index < schedule.length; index++) {
      const sheet = sheets[index];
      sheet.style.zIndex = String(backward ? index + 1 : schedule.length - index);
      const parts = Object.fromEntries(["front", "back", "curl", "shadow"].map(name => {
        const element = document.createElement("div");
        element.setAttribute(`data-turn-${name}`, "");
        sheet.append(element);
        return [name, element];
      }));
      if (!backward && index === 0) {
        placeSnapshot(parts.front, source.current);
        placeSnapshot(parts.back, source.current);
      } else if (backward && index === schedule.length - 1) {
        current.incoming = parts.front;
        current.reverse = parts.back;
      }
      const options = { ...schedule[index], fill: "both" as FillMode, easing: "linear" };
      current.animations.push(sheet.animate([{ opacity: 1 }, { opacity: 1 }], options));
      for (const name of ["front", "back", "curl", "shadow"] as const) {
        current.animations.push(parts[name].animate(frames[name], options));
      }
    }
    Promise.all(current.animations.map(animation => animation.finished)).then(() => {
      if (active.current === current) clear();
    }).catch(() => { /* A new navigation cancelled this turn. */ });
  }, [clear, layers, source]);
  return { source, layers, turn };
}
