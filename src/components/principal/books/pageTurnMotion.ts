/**
 * Pure animation calculations: given a turning direction and progress, build page-sheet
 * motion values. These functions do not save data or change the selected URL.
 */
export const PAGE_TURN_DURATION = 340;

// The free edge rolls from right to left; the reverse side widens mid-turn.
const forwardFold = [
  { offset: 0, edge: 100, width: 0 },
  { offset: .12, edge: 99, width: 4 },
  { offset: .32, edge: 88, width: 17 },
  { offset: .5, edge: 60, width: 32 },
  { offset: .7, edge: 25, width: 21 },
  { offset: .88, edge: 5, width: 5 },
  { offset: 1, edge: 0, width: 0 },
];

/**
 * Calculate front/back/curl/shadow keyframes for the requested direction, keeping motion
 * math separate from React rendering.
 */
export function pageTurnFrames(backward: boolean) {
  const folds = backward ? forwardFold.toReversed().map(frame => ({ ...frame, offset: 1 - frame.offset })) : forwardFold;
  const front: Keyframe[] = [];
  const back: Keyframe[] = [];
  const curl: Keyframe[] = [];
  const shadow: Keyframe[] = [];
  for (const { offset, edge, width } of folds) {
    const start = Math.max(0, edge - width);
    const strength = Number(Math.sin(offset * Math.PI).toFixed(5));
    front.push({ offset, clipPath: `inset(0 ${100 - start}% 0 0)` });
    back.push({ offset, clipPath: `polygon(${start}% 0, ${edge}% ${strength * .7}%, ${edge}% ${100 - strength * .7}%, ${start}% 100%)` });
    curl.push({ offset, transform: `translateX(${start}%) scaleX(${width / 100})`, opacity: width ? 1 : 0 });
    shadow.push({ offset, transform: `translateX(${edge}%) scaleX(${.02 + strength * .025})`, opacity: strength * .5 });
  }
  return { front, back, curl, shadow };
}

/**
 * Stagger sheet timing to make the visual layers behave like pages turning together.
 */
export function pageTurnSchedule(distance: number) {
  const count = Math.abs(distance) > 4 ? 6 : Math.abs(distance);
  return Array.from({ length: count }, (_, index) => ({ delay: index * 18, duration: PAGE_TURN_DURATION - index * 18 }));
}
