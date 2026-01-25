import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import type { Keyframe, SceneRecording, Quat, Vec3 } from "../types";
import { toVec3 } from "../utils/math";

type UseSceneRecorderArgs = {
  modelUrl: string;
  objectRef: React.MutableRefObject<THREE.Object3D | null>;
  onPoseTick?: () => void;
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
  const [scrub, setScrubState] = useState(0); // 0..1

  const tlRef = useRef<gsap.core.Timeline | null>(null);

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

  const resetToInitialPose = useCallback(() => {
    const obj = objectRef.current;
    const init = initialPoseRef.current;
    if (!obj || !init) return;

    obj.position.set(init.position[0], init.position[1], init.position[2]);
    obj.scale.set(init.scale[0], init.scale[1], init.scale[2]);
    obj.quaternion.set(
      init.quaternion[0],
      init.quaternion[1],
      init.quaternion[2],
      init.quaternion[3],
    );
  }, [objectRef]);

  const recording: SceneRecording = useMemo(
    () => ({ version: 2, modelUrl, frames }),
    [modelUrl, frames],
  );

  const stop = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }
  }, []);

  //  Build (or rebuild) GSAP timeline based on current frames
  const buildTimeline = useCallback(() => {
    const obj = objectRef.current;
    if (!obj) return null;
    if (frames.length === 0) return null;

    ensureInitialPose();

    // Start from initial pose for deterministic scrubbing
    resetToInitialPose();

    const tl = gsap.timeline({
      paused: true,
      defaults: { overwrite: "auto" },
    });

    const proxy = { t: 0 };

    for (const f of frames) {
      let startQ = obj.quaternion.clone();
      const endQ = quatFromArray(f.quaternion);

      tl.add(() => {
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
            obj.quaternion.copy(startQ).slerp(endQ, proxy.t);
            onPoseTick?.();
          },
        },
        "<",
      );
    }

    return tl;
  }, [frames, objectRef, ensureInitialPose, resetToInitialPose, onPoseTick]);

  const rebuildTimeline = useCallback(() => {
    const obj = objectRef.current;

    //  save current pose so we don't disturb user pose
    const savedPose = obj
      ? {
          position: obj.position.clone(),
          quaternion: obj.quaternion.clone(),
          scale: obj.scale.clone(),
        }
      : null;

    stop();

    const tl = buildTimeline();
    if (!tl) {
      setScrubState(0);

      //  restore pose
      if (obj && savedPose) {
        obj.position.copy(savedPose.position);
        obj.quaternion.copy(savedPose.quaternion);
        obj.scale.copy(savedPose.scale);
      }

      onPoseTick?.();
      return;
    }

    tlRef.current = tl;

    // keep scrub position (clamped)
    const p = Math.max(0, Math.min(1, scrub));
    tl.progress(p).pause();

    //  restore pose after rebuilding timeline
    if (obj && savedPose) {
      obj.position.copy(savedPose.position);
      obj.quaternion.copy(savedPose.quaternion);
      obj.scale.copy(savedPose.scale);
    }

    onPoseTick?.();
  }, [buildTimeline, stop, scrub, onPoseTick, objectRef]);

  //  rebuild whenever frames change
  useEffect(() => {
    rebuildTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

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

  //  NEW: delete step by id
  const deleteFrame = useCallback((id: string) => {
    setFrames((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const removeLastFrame = useCallback(() => {
    setFrames((prev) => prev.slice(0, -1));
  }, []);

  const clearFrames = useCallback(() => {
    setFrames([]);
  }, []);

  //  NEW: scrub to any progress 0..1
  const setScrub = useCallback(
    (p: number) => {
      const tl = tlRef.current;
      const v = Math.max(0, Math.min(1, p));
      setScrubState(v);

      if (!tl) {
        // if no timeline, just ensure initial pose (if any)
        ensureInitialPose();
        resetToInitialPose();
        onPoseTick?.();
        return;
      }

      tl.pause();
      tl.progress(v);
      onPoseTick?.();
    },
    [ensureInitialPose, resetToInitialPose, onPoseTick],
  );

  const play = useCallback(() => {
    const tl = tlRef.current;

    // if timeline not built yet, try build now
    if (!tl) {
      const newTl = buildTimeline();
      if (!newTl) return;
      tlRef.current = newTl;
    }

    tlRef.current!.play();
  }, [buildTimeline]);

  const exportJSON = useCallback(
    () => JSON.stringify(recording, null, 2),
    [recording],
  );

  const importJSON = useCallback((json: string) => {
    const parsed = JSON.parse(json);

    if (!parsed || !Array.isArray(parsed.frames))
      throw new Error("Invalid recording JSON");

    if (parsed.version === 2) {
      setFrames(parsed.frames as Keyframe[]);
      return;
    }

    if (parsed.version === 1) {
      // upgrade v1 (Euler) => v2 (quat + scale)
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

  const setPose = useCallback(
    (index: number) => {
      const obj = objectRef.current;
      const f = frames[index];
      if (!obj || !f) return;

      stop(); // stop playback when jumping
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
    [frames, objectRef, stop, onPoseTick],
  );

  const resetPose = useCallback(() => {
    ensureInitialPose();
    stop();
    resetToInitialPose();
    setScrub(0);
    onPoseTick?.();
  }, [ensureInitialPose, stop, resetToInitialPose, setScrub, onPoseTick]);

  return {
    frames,
    setFrames,
    captureFrame,
    updateFrame,
    deleteFrame,
    removeLastFrame,
    clearFrames,

    play,
    stop,
    setPose,
    resetPose,

    scrub,
    setScrub,

    exportJSON,
    importJSON,

    rebuildTimeline,
    DEFAULT_EASES,
  };
}
