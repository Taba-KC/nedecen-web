"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/** A temporary, inert picture of the visible DOM, not another mounted page. */
function snapshot(source: HTMLElement) {
  const copy = source.cloneNode(true) as HTMLElement;
  copy.inert = true;
  copy.setAttribute("aria-hidden", "true");
  copy.removeAttribute("id");
  copy.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
  Object.assign(copy.style, {
    position: "absolute", inset: "0", width: "100%", height: "100%",
    maxHeight: "none", overflow: "hidden", pointerEvents: "none",
  });
  // Preserve the visible position and any unsaved values in an import preview.
  const originals = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
  copy.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select").forEach((field, index) => {
    if (field instanceof HTMLInputElement && field.type === "file") return;
    field.value = originals[index].value;
    if (field instanceof HTMLInputElement && originals[index] instanceof HTMLInputElement) field.checked = (originals[index] as HTMLInputElement).checked;
  });
  return { copy, scrollTop: source.scrollTop, scrollLeft: source.scrollLeft };
}

function placeSnapshot(target: HTMLElement, source: HTMLElement, incoming = false) {
  const { copy, scrollTop, scrollLeft } = snapshot(source);
  target.replaceChildren(copy);
  copy.scrollTop = incoming ? 0 : scrollTop;
  copy.scrollLeft = incoming ? 0 : scrollLeft;
}

export function usePageTurn(contentKey: string) {
  const source = useRef<HTMLDivElement>(null);
  const layers = useRef<HTMLDivElement>(null);
  const active = useRef<{ animations: Animation[]; incoming: HTMLElement | null; sourceKey: string } | null>(null);
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
    const count = Math.abs(distance) > 4 ? 6 : Math.abs(distance);
    const current = { animations: [] as Animation[], incoming: backward ? sheets[count - 1] : null, sourceKey: latestKey.current };
    active.current = current;
    layers.current.dataset.turning = backward ? "backward" : "forward";
    if (backward) placeSnapshot(underlay, source.current);
    else placeSnapshot(sheets[0], source.current);

    for (let index = 0; index < count; index++) {
      const sheet = sheets[index];
      const delay = index * 12;
      sheet.style.zIndex = String(backward ? index + 1 : count - index);
      const flat = "translate3d(0, 0, 0) rotateY(0deg)";
      const lifted = "translate3d(0, -3px, 26px) rotateY(-28deg)";
      const edge = "translate3d(-2px, 0, 4px) rotateY(-89deg)";
      const keyframes: Keyframe[] = backward ? [
        { transform: edge, opacity: 0, offset: 0 },
        { transform: "translate3d(0, -5px, 32px) rotateY(-68deg)", opacity: 1, offset: .16 },
        { transform: lifted, opacity: 1, offset: .58 },
        { transform: flat, opacity: 1, offset: 1 },
      ] : [
        { transform: flat, opacity: 1, offset: 0 },
        { transform: lifted, opacity: 1, offset: .32 },
        { transform: "translate3d(-1px, -3px, 18px) rotateY(-76deg)", opacity: 1, offset: .82 },
        { transform: edge, opacity: 0, offset: 1 },
      ];
      current.animations.push(sheet.animate(keyframes, {
        duration: 200 - delay, delay, fill: "both", easing: "cubic-bezier(.22,.61,.36,1)",
      }));
    }
    Promise.all(current.animations.map(animation => animation.finished)).then(() => {
      if (active.current === current) clear();
    }).catch(() => { /* A new navigation cancelled this turn. */ });
  }, [clear, layers, source]);
  return { source, layers, turn };
}
