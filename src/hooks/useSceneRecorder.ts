import { useCallback, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import type { Keyframe, SceneRecording } from "../types";
import { toEuler, toVec3 } from "../utils/math";

type UseSceneRecorderArgs = {
  modelUrl: string;
  objectRef: React.MutableRefObject<THREE.Object3D | null>;
};

export function useSceneRecorder({
  modelUrl,
  objectRef,
}: UseSceneRecorderArgs) {
  const [frames, setFrames] = useState<Keyframe[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const recording: SceneRecording = useMemo(
    () => ({ version: 1, modelUrl, frames }),
    [modelUrl, frames],
  );

  const captureFrame = useCallback(
    (opts?: Partial<Pick<Keyframe, "duration" | "ease" | "label">>) => {
      const obj = objectRef.current;
      if (!obj) return;

      const id = crypto.randomUUID();
      const position = toVec3(obj.position);
      const rotation = toEuler(obj.rotation);

      const frame: Keyframe = {
        id,
        label: opts?.label ?? `Step ${frames.length + 1}`,
        duration: opts?.duration ?? 1.2,
        ease: opts?.ease ?? "power2.inOut",
        position,
        rotation,
      };
      debugger;
      console.log("[CAPTURE]", {
        position: position,
        rotation: rotation,
      });
      setFrames((prev) => [...prev, frame]);
    },
    [objectRef, frames.length],
  );

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

  const play = useCallback(() => {
    const obj = objectRef.current;
    if (!obj || frames.length === 0) return;

    stop();

    const tl = gsap.timeline({
      defaults: { overwrite: "auto" },
    });

    for (const f of frames) {
      tl.to(
        obj.position,
        {
          x: f.position[0],
          y: f.position[1],
          z: f.position[2],
          duration: f.duration,
          ease: f.ease,
        },
        ">",
      );

      tl.to(
        obj.rotation,
        {
          x: f.rotation[0],
          y: f.rotation[1],
          z: f.rotation[2],
          duration: f.duration,
          ease: f.ease,
        },
        "<",
      );
    }

    tlRef.current = tl;
  }, [frames, objectRef, stop]);

  const exportJSON = useCallback(() => {
    return JSON.stringify(recording, null, 2);
  }, [recording]);

  const importJSON = useCallback((json: string) => {
    const parsed = JSON.parse(json) as SceneRecording;

    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.frames)) {
      throw new Error("Invalid recording JSON");
    }

    setFrames(parsed.frames);
  }, []);

  const setPose = useCallback(
    (index: number) => {
      const obj = objectRef.current;
      const f = frames[index];
      if (!obj || !f) return;

      obj.position.set(f.position[0], f.position[1], f.position[2]);
      obj.rotation.set(f.rotation[0], f.rotation[1], f.rotation[2]);
    },
    [frames, objectRef],
  );

  return {
    frames,
    setFrames,
    captureFrame,
    removeLastFrame,
    clearFrames,
    play,
    stop,
    exportJSON,
    importJSON,
    setPose,
  };
}
