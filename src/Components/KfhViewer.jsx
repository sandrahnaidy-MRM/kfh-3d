import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, View } from "@react-three/drei";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ViewScene } from "./ViewScene";
import { useUserControls } from "./useUserControls";

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
  const { scrollYProgress } = useScroll();
  const viewRef = useRef(null);

  const user = useUserControls();

  const w = useTransform(scrollYProgress, [0, 1], [400, 700]);
  const h = useTransform(scrollYProgress, [0, 1], [391, 700]);
  const leftRaw = useTransform(scrollYProgress, [0, 1], ["80%", "50%"]);
  const topRaw = useTransform(scrollYProgress, [0, 1], ["100%", "120%"]);
  const left = useSpring(leftRaw, { stiffness: 120, damping: 30, mass: 0.8 });
  const top = useSpring(topRaw, { stiffness: 120, damping: 30, mass: 0.8 });

  return (
    <motion.div className="relative h-full w-full">
      <Canvas
        frameloop="always"
        className="absolute inset-0"
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.8, 2.6], fov: 45 }}
      >
        <View track={viewRef}>
          <ViewScene
            scrollYProgress={scrollYProgress}
            sections={sections}
            smooth={10}
            user={user}
          />
          <EnvRig
            preset={user.envPreset}
            intensity={user.envIntensity}
            rotationY={user.envRotationY}
            background={user.envBackground}
          />
        </View>
      </Canvas>

      <motion.div
        ref={viewRef}
        className="absolute pointer-events-none"
        style={{
          width: w,
          height: h,
          left,
          top,
          transform: "translate(-50%, -100%)",
        }}
      />
    </motion.div>
  );
}
