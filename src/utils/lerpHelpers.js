import * as THREE from "three";

export const lerpNum = (a, b, t) => a + (b - a) * t;

export const lerpArr3 = (a, b, t) => [
  lerpNum(a[0], b[0], t),
  lerpNum(a[1], b[1], t),
  lerpNum(a[2], b[2], t),
];

export const lerpEuler = (a, b, t) => [
  lerpNum(a[0], b[0], t),
  lerpNum(a[1], b[1], t),
  lerpNum(a[2], b[2], t),
];

export function getSectionBlend(sections, p) {
  const n = sections.length;
  if (n === 1) return { a: sections[0], b: sections[0], t: 0 };

  const x = THREE.MathUtils.clamp(p, 0, 1) * (n - 1);
  const idx = Math.floor(x);
  const t = x - idx;

  const a = sections[idx];
  const b = sections[Math.min(idx + 1, n - 1)];

  // smoothstep for nicer feel
  const tt = t * t * (3 - 2 * t);
  return { a, b, t: tt };
}
export function getSectionProgress(p, sections) {
  const total = sections - 1;
  const x = THREE.MathUtils.clamp(p, 0, 1) * total;

  const index = Math.floor(x);
  const t = x - index;

  // smoothstep لنعومة أعلى
  const smoothT = t * t * (3 - 2 * t);

  return {
    index,
    t: smoothT,
    nextIndex: Math.min(index + 1, sections - 1),
  };
}
