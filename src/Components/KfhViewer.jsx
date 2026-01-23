import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

import { ViewScene } from "@components/ViewScene";
import { useUserControls } from "@components/useUserControls";

import StarfieldEndless from "@components/StarfieldEndless";
import TrackStreet from "@components/TrackStreet";
function EnvRig({ preset, intensity, rotationY, background }) {
  const envRef = useRef();

  useFrame((_, dt) => {
    if (!envRef.current) return;
    envRef.current.rotation.y = THREE.MathUtils.damp(
      envRef.current.rotation.y,
      rotationY,
      10,
      dt,
    );
  });

  return (
    <group ref={envRef}>
      <Environment
        preset={preset}
        environmentIntensity={intensity}
        background={background}
      />
    </group>
  );
}

export default function KfhViewer({ sections = 10 }) {
  const user = useUserControls();

  return (
    <div className="relative h-full w-full">
      <Canvas
        frameloop="always"
        className="absolute inset-0"
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: true, // ✅ transparent canvas over your Gold bg
        }}
        camera={{ position: [0, 0.8, 2.6], fov: 45 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // ✅ keep transparent
        }}
      >
        {user.backgroundFx === "stars" && <StarfieldEndless user={user} />}
        {user.backgroundFx === "track" && <TrackStreet user={user} />}

        <ViewScene sections={sections} smooth={10} user={user} />

        <EnvRig
          preset={user.envPreset}
          intensity={user.envIntensity}
          rotationY={user.envRotationY}
          background={
            user.motionMode === "sphereStars" ? false : user.envBackground
          }
        />
      </Canvas>
    </div>
  );
}
