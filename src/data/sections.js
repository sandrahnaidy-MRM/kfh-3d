import * as THREE from "three";
import { makeSCurve } from "@utils/lerpHelpers";

const curve = makeSCurve();

export const SECTIONS = Array.from({ length: 10 }).map((_, i) => {
  const k = i / 9; // 0..1
  const p = curve.getPointAt(k);

  return {
    key: k,
    object: {
      pos: [p.x, p.y, p.z],
      rot: [-0.12 + k * 0.08, -0.2 + k * 0.4, 0],
      scale: 1.0,
    },
    lights: {
      ambient: 0.35,
      dir1: {
        pos: [-4 + k * 5, 9 + k * 2, 4 + k * 4],
        intensity: 1.1 - k * 0.2,
      },
      dir2: {
        pos: [3 + k * 3, 2 + k * 1, 4 - k * 2],
        intensity: 0.35 + k * 0.15,
      },
      back: {
        pos: [0 - k * 2, 3 + k * 1, -5 - k * 3],
        intensity: 0.15 + k * 0.2,
      },
    },
    env: { preset: "apartment", intensity: 1, rotationY: 0, background: false },
  };
});
