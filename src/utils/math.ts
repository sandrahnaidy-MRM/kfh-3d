import * as THREE from "three";
import type { Vec3 } from "../types";

export const toVec3 = (v: THREE.Vector3): Vec3 => [v.x, v.y, v.z];
export const toEuler = (e: THREE.Euler): Vec3 => [e.x, e.y, e.z];

export const radToDeg = (r: number) => (r * 180) / Math.PI;
export const degToRad = (d: number) => (d * Math.PI) / 180;

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
