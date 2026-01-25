import { useCallback, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import type { Keyframe, SceneRecording, Quat, Vec3 } from "../types";
import { toVec3 } from "../utils/math";

type UseSceneRecorderArgs = {
  modelUrl: string;
  objectRef: React.MutableRefObject<THREE.Object3D | null>;
  onPoseTick?: () => void; // ✅ lets UI refresh during play/edit
};

const DEFAULT_EASES = [
  "none",
  "power1.inOut",
  "power2.inOut",
  "power3.inOut",
  "expo.inOut",
];

function toQuat(q: THREE.Quaternion): Quat {
  return [q.x, q.y, q.z, q.w];
}
function quatFromArray(a: Quat): THREE.Quaternion {
  return new THREE.Quaternion(a[0], a[1], a[2], a[3]);
}

export function useSceneRecorder({
  modelUrl,
  objectRef,
  onPoseTick,
}: UseSceneRecorderArgs) {
  const [frames, setFrames] = useState<Keyframe[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // ✅ store initial pose once we have an object
  const initialPoseRef = useRef<{
    position: Vec3;
    quaternion: Quat;
    scale: Vec3;
  } | null>(null);

  const ensureInitialPose = useCallback(() => {
    const obj = objectRef.current;
    if (!obj) return;
    if (initialPoseRef.current) return;

    initialPoseRef.current = {
      position: toVec3(obj.position),
      quaternion: toQuat(obj.quaternion),
      scale: toVec3(obj.scale),
    };
  }, [objectRef]);

  const recording: SceneRecording = useMemo(
    () => ({ version: 2, modelUrl, frames }),
    [modelUrl, frames],
  );

  const captureFrame = useCallback(
    (opts?: Partial<Pick<Keyframe, "duration" | "ease" | "label">>) => {
      const obj = objectRef.current;
      if (!obj) return;

      ensureInitialPose();

      const id = crypto.randomUUID();
      const position: Vec3 = toVec3(obj.position);
      const scale: Vec3 = toVec3(obj.scale);
      const quaternion: Quat = toQuat(obj.quaternion);

      const frame: Keyframe = {
        id,
        label: opts?.label ?? `Step ${frames.length + 1}`,
        duration: opts?.duration ?? 1.2,
        ease: opts?.ease ?? "power2.inOut",
        position,
        quaternion,
        scale,
      };

      setFrames((prev) => [...prev, frame]);
      onPoseTick?.();
    },
    [objectRef, frames.length, ensureInitialPose, onPoseTick],
  );

  const updateFrame = useCallback((id: string, patch: Partial<Keyframe>) => {
    setFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }, []);

  const removeLastFrame = useCallback(() => {
    setFrames((prev) => prev.slice(0, -1));
  }, []);

  const clearFrames = useCallback(() => {
    setFrames([]);
  }, []);

  const stop = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }
  }, []);

  // ✅ Smooth quaternion slerp per segment
  const play = useCallback(() => {
    const obj = objectRef.current;
    if (!obj) return;
    if (frames.length === 0) return;

    stop();

    // Ensure we have a baseline initial pose
    ensureInitialPose();

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });

    // We slerp from startQ to endQ using a proxy value t:0..1
    const proxy = { t: 0 };

    for (const f of frames) {
      // Capture start quaternion at segment start (important!)
      let startQ = obj.quaternion.clone();
      const endQ = quatFromArray(f.quaternion);

      tl.add(() => {
        // refresh startQ at runtime (timeline point)
        startQ = obj.quaternion.clone();
        proxy.t = 0;
      }, ">");

      tl.to(
        obj.position,
        {
          x: f.position[0],
          y: f.position[1],
          z: f.position[2],
          duration: f.duration,
          ease: f.ease,
          onUpdate: () => onPoseTick?.(),
        },
        ">",
      );

      tl.to(
        obj.scale,
        {
          x: f.scale[0],
          y: f.scale[1],
          z: f.scale[2],
          duration: f.duration,
          ease: f.ease,
          onUpdate: () => onPoseTick?.(),
        },
        "<",
      );

      tl.to(
        proxy,
        {
          t: 1,
          duration: f.duration,
          ease: f.ease,
          onUpdate: () => {
            // Smooth rotation
            obj.quaternion.copy(startQ).slerp(endQ, proxy.t);
            onPoseTick?.();
          },
        },
        "<",
      );
    }

    tlRef.current = tl;
  }, [frames, objectRef, stop, ensureInitialPose, onPoseTick]);

  const setPose = useCallback(
    (index: number) => {
      const obj = objectRef.current;
      const f = frames[index];
      if (!obj || !f) return;

      obj.position.set(f.position[0], f.position[1], f.position[2]);
      obj.scale.set(f.scale[0], f.scale[1], f.scale[2]);
      obj.quaternion.set(
        f.quaternion[0],
        f.quaternion[1],
        f.quaternion[2],
        f.quaternion[3],
      );
      onPoseTick?.();
    },
    [frames, objectRef, onPoseTick],
  );

  const resetPose = useCallback(() => {
    const obj = objectRef.current;
    if (!obj) return;

    ensureInitialPose();
    const init = initialPoseRef.current;
    if (!init) return;

    stop();

    obj.position.set(init.position[0], init.position[1], init.position[2]);
    obj.scale.set(init.scale[0], init.scale[1], init.scale[2]);
    obj.quaternion.set(
      init.quaternion[0],
      init.quaternion[1],
      init.quaternion[2],
      init.quaternion[3],
    );
    onPoseTick?.();
  }, [objectRef, ensureInitialPose, stop, onPoseTick]);

  const exportJSON = useCallback(() => {
    return JSON.stringify(recording, null, 2);
  }, [recording]);

  // ✅ supports importing old v1 recordings (Euler-only) and upgrades to v2
  const importJSON = useCallback((json: string) => {
    const parsed = JSON.parse(json);

    if (!parsed || !Array.isArray(parsed.frames))
      throw new Error("Invalid recording JSON");

    // v2
    if (parsed.version === 2) {
      setFrames(parsed.frames as Keyframe[]);
      return;
    }

    // v1 upgrade (if you had old format)
    if (parsed.version === 1) {
      // v1 had: position, rotation(euler), ease, duration, label
      const upgraded: Keyframe[] = (parsed.frames as any[]).map((f) => {
        const e = new THREE.Euler(
          f.rotation?.[0] ?? 0,
          f.rotation?.[1] ?? 0,
          f.rotation?.[2] ?? 0,
        );
        const q = new THREE.Quaternion().setFromEuler(e);
        return {
          id: f.id ?? crypto.randomUUID(),
          label: f.label ?? "Step",
          duration: f.duration ?? 1.2,
          ease: f.ease ?? "power2.inOut",
          position: f.position ?? [0, 0, 0],
          scale: [1, 1, 1],
          quaternion: toQuat(q),
        };
      });
      setFrames(upgraded);
      return;
    }

    throw new Error("Unsupported recording version");
  }, []);

  return {
    frames,
    setFrames,
    captureFrame,
    updateFrame,
    removeLastFrame,
    clearFrames,
    play,
    stop,
    setPose,
    resetPose,
    exportJSON,
    importJSON,
    DEFAULT_EASES,
  };
}
