import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, View, useGLTF } from "@react-three/drei";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import * as THREE from "three";
import { useVelocity } from "framer-motion";

const MODEL_URL = "/models/kfh.glb";

useGLTF.preload(MODEL_URL);
const LIGHT_SCENES = {
  intro: {
    key: 0.0,
    dir1: { pos: [-4, 9, 4], intensity: 1.1 },
    dir2: { pos: [3, 2, 4], intensity: 0.35 },
    back: { pos: [0, 3, -5], intensity: 0.15 },
  },
  grow: {
    key: 0.25,
    dir1: { pos: [-2, 10, 6], intensity: 1.2 },
    dir2: { pos: [4, 3, 5], intensity: 0.45 },
    back: { pos: [-2, 4, -6], intensity: 0.25 },
  },
  move: {
    key: 0.7,
    dir1: { pos: [1, 8, 8], intensity: 0.95 },
    dir2: { pos: [6, 2, 3], intensity: 0.4 },
    back: { pos: [0, 2, -8], intensity: 0.3 },
  },
};
function getLightPose(progress) {
  if (progress < 0.25) return LIGHT_SCENES.intro;
  if (progress < 0.4) return LIGHT_SCENES.grow;
  return LIGHT_SCENES.move;
}

function centerAndNormalize(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  root.position.sub(center);

  const maxAxis = Math.max(size.x, size.y, size.z);
  if (maxAxis > 0) root.scale.setScalar(1 / maxAxis);
}

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

function ViewScene({ scrollYProgress, smooth = 8 }) {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef();
  const dir1 = useRef();
  const dir2 = useRef();
  const back = useRef();
  // scroll velocity (0..something) — positive when scrolling
  const v = useVelocity(scrollYProgress);

  useEffect(() => {
    centerAndNormalize(scene);
  }, [scene]);

  // Spin state (accumulator)
  const spinRef = useRef(0);

  useFrame((_, dt) => {
    if (!group.current) return;

    const p = scrollYProgress.get(); // 0..1
    const pose = getLightPose(p);
    if (!dir1.current) return;
    // --- dir1 ---
    dir1.current.position.x = damp(
      dir1.current.position.x,
      pose.dir1.pos[0],
      smooth,
      dt,
    );
    dir1.current.position.y = damp(
      dir1.current.position.y,
      pose.dir1.pos[1],
      smooth,
      dt,
    );
    dir1.current.position.z = damp(
      dir1.current.position.z,
      pose.dir1.pos[2],
      smooth,
      dt,
    );
    dir1.current.intensity = damp(
      dir1.current.intensity,
      pose.dir1.intensity,
      smooth,
      dt,
    );

    // --- dir2 ---
    dir2.current.position.x = damp(
      dir2.current.position.x,
      pose.dir2.pos[0],
      smooth,
      dt,
    );
    dir2.current.position.y = damp(
      dir2.current.position.y,
      pose.dir2.pos[1],
      smooth,
      dt,
    );
    dir2.current.position.z = damp(
      dir2.current.position.z,
      pose.dir2.pos[2],
      smooth,
      dt,
    );
    dir2.current.intensity = damp(
      dir2.current.intensity,
      pose.dir2.intensity,
      smooth,
      dt,
    );

    // --- back light ---
    back.current.position.x = damp(
      back.current.position.x,
      pose.back.pos[0],
      smooth,
      dt,
    );
    back.current.position.y = damp(
      back.current.position.y,
      pose.back.pos[1],
      smooth,
      dt,
    );
    back.current.position.z = damp(
      back.current.position.z,
      pose.back.pos[2],
      smooth,
      dt,
    );
    back.current.intensity = damp(
      back.current.intensity,
      pose.back.intensity,
      smooth,
      dt,
    );

    // blend from "initial" to "base" during first 8% scroll
    const introEnd = 0.08;
    const introT = THREE.MathUtils.clamp(p / introEnd, 0, 1);
    const easeIntro = introT * introT * (3 - 2 * introT); // smoothstep

    // --- Initial pose (NOT 0,0,0) ---
    const initialPos = new THREE.Vector3(0, 0, 0);
    const initialRot = new THREE.Euler(-0.6, -0.3, 0);
    const initialScale = 0.92;

    // --- Base pose (your "normal" pose) ---
    const basePos = new THREE.Vector3(0, 0, 0);
    const baseRot = new THREE.Euler(0.03, 0.0, 0.0);
    const baseScale = 1.0;

    // blend initial -> base
    const blendedPos = initialPos.clone().lerp(basePos, easeIntro);
    const blendedRot = new THREE.Euler(
      THREE.MathUtils.lerp(initialRot.x, baseRot.x, easeIntro),
      THREE.MathUtils.lerp(initialRot.y, baseRot.y, easeIntro),
      THREE.MathUtils.lerp(initialRot.z, baseRot.z, easeIntro),
    );
    const blendedScale = THREE.MathUtils.lerp(
      initialScale,
      baseScale,
      easeIntro,
    );

    // ---------------- Spin (your existing logic) ----------------
    const moveStart = 0.0;
    const moveEnd = 0.9;
    const inMoveWindow = p >= moveStart && p <= moveEnd;

    const vel = v.get();
    const speed = THREE.MathUtils.clamp(Math.abs(vel) * 10, 0, 3.4);

    if (inMoveWindow && speed > 0.01) {
      spinRef.current += speed * dt * (vel >= 0 ? 1 : -1);
    }

    // rotation targets (use Z for 2D-like spin)
    const targetRotX = blendedRot.x;
    const targetRotY = blendedRot.y;
    const targetRotZ = blendedRot.z + spinRef.current;

    // apply smooth position
    group.current.position.x = damp(
      group.current.position.x,
      blendedPos.x,
      smooth,
      dt,
    );
    group.current.position.y = damp(
      group.current.position.y,
      blendedPos.y,
      smooth,
      dt,
    );
    group.current.position.z = damp(
      group.current.position.z,
      blendedPos.z,
      smooth,
      dt,
    );

    // apply smooth rotation
    group.current.rotation.x = damp(
      group.current.rotation.x,
      targetRotX,
      smooth,
      dt,
    );
    group.current.rotation.y = damp(
      group.current.rotation.y,
      targetRotY,
      smooth,
      dt,
    );
    group.current.rotation.z = damp(
      group.current.rotation.z,
      targetRotZ,
      smooth,
      dt,
    );

    // apply smooth scale
    const s = damp(group.current.scale.x, blendedScale, smooth, dt);
    group.current.scale.setScalar(s);
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight ref={dir1} />
      <directionalLight ref={dir2} />
      <directionalLight ref={back} />

      <Suspense fallback={null}>
        <group ref={group}>
          <primitive object={scene} />
        </group>

        <Environment preset="apartment" />
      </Suspense>
    </>
  );
}

export default function KfhViewer() {
  const { scrollYProgress } = useScroll();
  const viewRef = useRef(null);

  const w = useTransform(
    scrollYProgress,
    [0, 0.25, 0.4, 0.7, 0.9],
    [400, 746.11, 746.11, 500, 500],
  );
  const h = useTransform(
    scrollYProgress,
    [0, 0.25, 0.4, 0.7, 0.9],
    [391, 729.89, 729.89, 489.13, 489.13],
  );

  const leftRaw = useTransform(
    scrollYProgress,
    [0, 0.25, 0.4, 0.7, 0.9],
    ["90%", "80%", "70%", "50%", "50%"],
  );

  const topRaw = useTransform(
    scrollYProgress,
    [0, 0.25, 0.4, 0.7, 0.9],
    ["100%", "100%", "100%", "120%", "135%"],
  );

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
            spinSpeed={0.3}
            spinSmooth={8}
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
