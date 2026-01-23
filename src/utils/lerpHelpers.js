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

export function centerAndNormalize(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  root.position.sub(center);
  const maxAxis = Math.max(size.x, size.y, size.z);
  if (maxAxis > 0) root.scale.setScalar(1 / maxAxis);
}

export function makeSCurve({
  z = -1.4, // عمق ثابت
  sx = 0.6, // عرض الـS على X
  sy = 0.35, // ارتفاع الـS على Y
} = {}) {
  const points = [
    new THREE.Vector3(+0.45 * sx, +0.55 * sy, z),
    new THREE.Vector3(+0.15 * sx, +0.55 * sy, z),
    new THREE.Vector3(-0.25 * sx, +0.2 * sy, z),
    new THREE.Vector3(+0.1 * sx, -0.05 * sy, z),
    new THREE.Vector3(+0.35 * sx, -0.35 * sy, z),
    new THREE.Vector3(-0.45 * sx, -0.55 * sy, z),
  ];

  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.6);
}
