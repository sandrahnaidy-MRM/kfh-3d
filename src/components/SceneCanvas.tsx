import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  TransformControls,
} from "@react-three/drei";
import React, { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { TransformControls as TransformControlsImpl } from "three-stdlib";
import Model from "./Model";

export type ControlMode = "translate" | "rotate";

type Props = {
  modelUrl: string;
  mode: ControlMode;
  space: "world" | "local";
  enabled: boolean;
  snapMove: number;
  snapRotateDeg: number;
  objectRef: React.MutableRefObject<THREE.Object3D | null>;
  onDraggingChange?: (dragging: boolean) => void;
  onPoseTick?: () => void;
};

function SceneContent({
  modelUrl,
  mode,
  space,
  enabled,
  snapMove,
  snapRotateDeg,
  objectRef,
  onDraggingChange,
  onPoseTick,
}: Props) {
  const orbitRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const tcRef = useRef<TransformControlsImpl | null>(null);

  // initial pose
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(0, -0.5, 0);
    groupRef.current.rotation.set(0, 0, 0);
  }, []);

  // expose group to parent
  useEffect(() => {
    objectRef.current = groupRef.current;
    return () => {
      if (objectRef.current === groupRef.current) objectRef.current = null;
    };
  }, [objectRef]);

  // ✅ CRITICAL: attach TransformControls to the group (guaranteed)
  useEffect(() => {
    const tc = tcRef.current;
    const g = groupRef.current;
    if (!tc || !g) return;

    // Attach now
    tc.attach(g);
    // Ensure correct mode/space on attach
    tc.setMode(mode);
    tc.setSpace(space);

    // Cleanup
    return () => {
      try {
        tc.detach();
      } catch {}
    };
  }, [mode, space]);

  // ✅ robust dragging toggle (disable orbit while dragging)
  useEffect(() => {
    const tc = tcRef.current;
    if (!tc) return;

    const onDragChanged = (e: any) => {
      const dragging = !!e?.value;
      console.log("[NEW DRAG]", dragging);

      if (orbitRef.current) orbitRef.current.enabled = !dragging;
      onDraggingChange?.(dragging);

      if (!dragging) onPoseTick?.();
    };

    (tc as any).addEventListener("dragging-changed", onDragChanged);
    return () =>
      (tc as any).removeEventListener("dragging-changed", onDragChanged);
  }, [onDraggingChange, onPoseTick]);

  // ✅ When the object actually changes (move/rotate), tick
  const handleObjectChange = () => {
    const g = groupRef.current;
    if (!g) return;
    console.log("[OBJECT CHANGE]", g.position.toArray(), [
      g.rotation.x,
      g.rotation.y,
      g.rotation.z,
    ]);
    onPoseTick?.();
  };

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 9, 4]} intensity={1.05} castShadow />
      <directionalLight position={[3, 2, 4]} intensity={0.35} />
      <directionalLight position={[0, 3, -5]} intensity={0.25} />

      {/* ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.05, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial />
      </mesh>

      {/* Transform gizmo (it controls the attached group) */}
      <TransformControls
        ref={tcRef}
        enabled={enabled}
        mode={mode}
        space={space}
        size={2.2} // make gizmo big/visible
        translationSnap={snapMove > 0 ? snapMove : undefined}
        rotationSnap={
          snapRotateDeg > 0
            ? THREE.MathUtils.degToRad(snapRotateDeg)
            : undefined
        }
        onObjectChange={handleObjectChange}
      />

      {/* Actual model */}
      <group ref={groupRef}>
        <Suspense fallback={null}>
          <Model url={modelUrl} />
        </Suspense>
      </group>

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
      />
      <Environment preset="city" />
    </>
  );
}

export default function SceneCanvas(props: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.6, 4.2], fov: 45, near: 0.1, far: 100 }}
      className="h-full w-full"
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
