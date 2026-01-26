import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, View, useGLTF } from "@react-three/drei";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useMotionValueEvent,
} from "framer-motion";
import * as THREE from "three";

const MODEL_URL = "/models/kfh.glb";
useGLTF.preload(MODEL_URL);

// More scenes + smooth interpolation (no jumping)
const LIGHT_SCENES = [
  {
    key: 0.0,
    dir1: { pos: [-4, 9, 4], intensity: 1.1 },
    dir2: { pos: [3, 2, 4], intensity: 0.35 },
    back: { pos: [0, 3, -5], intensity: 0.15 },
  },
  {
    key: 0.12,
    dir1: { pos: [-3.5, 9.5, 4.8], intensity: 1.12 },
    dir2: { pos: [3.2, 2.2, 4.2], intensity: 0.36 },
    back: { pos: [-0.2, 3.2, -5.4], intensity: 0.16 },
  },
  {
    key: 0.25,
    dir1: { pos: [-2, 10, 6], intensity: 1.2 },
    dir2: { pos: [4, 3, 5], intensity: 0.45 },
    back: { pos: [-2, 4, -6], intensity: 0.25 },
  },
  {
    key: 0.4,
    dir1: { pos: [-0.5, 9.2, 7.2], intensity: 1.05 },
    dir2: { pos: [5.2, 2.4, 4.2], intensity: 0.42 },
    back: { pos: [-1.0, 3.2, -7.0], intensity: 0.28 },
  },
  {
    key: 0.55,
    dir1: { pos: [0.2, 8.6, 7.8], intensity: 1.0 },
    dir2: { pos: [5.8, 2.2, 3.6], intensity: 0.41 },
    back: { pos: [-0.4, 2.6, -7.6], intensity: 0.29 },
  },
  {
    key: 0.7,
    dir1: { pos: [1, 8, 8], intensity: 0.95 },
    dir2: { pos: [6, 2, 3], intensity: 0.4 },
    back: { pos: [0, 2, -8], intensity: 0.3 },
  },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerp3(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function getLightPose(progress) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);

  if (p <= LIGHT_SCENES[0].key) return LIGHT_SCENES[0];
  if (p >= LIGHT_SCENES[LIGHT_SCENES.length - 1].key)
    return LIGHT_SCENES[LIGHT_SCENES.length - 1];

  let i = 0;
  for (; i < LIGHT_SCENES.length - 1; i++) {
    if (p >= LIGHT_SCENES[i].key && p <= LIGHT_SCENES[i + 1].key) break;
  }

  const a = LIGHT_SCENES[i];
  const b = LIGHT_SCENES[i + 1];

  const tRaw = (p - a.key) / (b.key - a.key);
  const t = smoothstep(THREE.MathUtils.clamp(tRaw, 0, 1));

  return {
    key: p,
    dir1: {
      pos: lerp3(a.dir1.pos, b.dir1.pos, t),
      intensity: lerp(a.dir1.intensity, b.dir1.intensity, t),
    },
    dir2: {
      pos: lerp3(a.dir2.pos, b.dir2.pos, t),
      intensity: lerp(a.dir2.intensity, b.dir2.intensity, t),
    },
    back: {
      pos: lerp3(a.back.pos, b.back.pos, t),
      intensity: lerp(a.back.intensity, b.back.intensity, t),
    },
  };
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

/**
 * Auto-densify keyframes
 */
function densifyKeyframes(coarseKeys, coarseVals, steps = 180) {
  const keys = [];
  const vals = [];

  const isPercent =
    typeof coarseVals[0] === "string" && coarseVals[0].trim().endsWith("%");

  const parseVal = (v) => (isPercent ? parseFloat(v) : Number(v));
  const formatVal = (n) => (isPercent ? `${n}%` : n);

  const minK = coarseKeys[0];
  const maxK = coarseKeys[coarseKeys.length - 1];

  const sample = (k) => {
    let i = 0;
    for (; i < coarseKeys.length - 1; i++) {
      if (k >= coarseKeys[i] && k <= coarseKeys[i + 1]) break;
    }
    const k0 = coarseKeys[i];
    const k1 = coarseKeys[i + 1];
    const tRaw = (k - k0) / (k1 - k0);
    const t = smoothstep(THREE.MathUtils.clamp(tRaw, 0, 1));

    const v0 = parseVal(coarseVals[i]);
    const v1 = parseVal(coarseVals[i + 1]);
    return formatVal(lerp(v0, v1, t));
  };

  for (let s = 0; s <= steps; s++) {
    const k = minK + (s / steps) * (maxK - minK);
    keys.push(Number(k.toFixed(5)));
    vals.push(sample(k));
  }

  return { keys, vals };
}

/**
 * ✅ PointPicker that works anywhere (sides included)
 * - listens on window pointerdown
 * - computes NDC relative to canvas rect
 * - Shift+Click to pick
 */
function PointPicker({ enabled = true, onPick }) {
  const { camera, scene, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement;

    const handler = (e) => {
      if (!e.shiftKey) return;

      const rect = canvas.getBoundingClientRect();
      const insideX = e.clientX >= rect.left && e.clientX <= rect.right;
      const insideY = e.clientY >= rect.top && e.clientY <= rect.bottom;

      // Allow clicks even if you click "near sides" of the screen,
      // but still need a valid rect size to compute.
      // If you want to ONLY pick when inside canvas, uncomment:
      // if (!insideX || !insideY) return;

      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(scene.children, true);
      if (!hits.length) return;

      const hit = hits[0];
      const world = hit.point.clone();

      const local = world.clone();
      if (hit.object) hit.object.worldToLocal(local);

      const payload = {
        world: { x: world.x, y: world.y, z: world.z },
        local: { x: local.x, y: local.y, z: local.z },
        uv: hit.uv ? { u: hit.uv.x, v: hit.uv.y } : null,
        faceIndex: hit.faceIndex ?? null,
        objectName: hit.object?.name ?? null,
      };

      console.log("📍 PICKED POINT:", payload);

      const pretty = JSON.stringify(payload, null, 2);
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(pretty).catch(() => {});
      }

      onPick?.(payload);
    };

    window.addEventListener("pointerdown", handler, { passive: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [enabled, camera, scene, gl, raycaster, mouse, onPick]);

  return null;
}

function ViewScene({ scrollYProgress, smooth = 12 }) {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef();
  const dir1 = useRef();
  const dir2 = useRef();
  const back = useRef();

  const v = useVelocity(scrollYProgress);
  const spinRef = useRef(0);

  useEffect(() => {
    centerAndNormalize(scene);
  }, [scene]);

  useFrame((_, dt) => {
    if (!group.current || !dir1.current || !dir2.current || !back.current)
      return;

    const p = scrollYProgress.get(); // 0..1
    const pose = getLightPose(p);

    // lights
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

    // intro blend
    const introEnd = 0.14;
    const introT = THREE.MathUtils.clamp(p / introEnd, 0, 1);
    const easeIntro = smoothstep(introT);

    const initialPos = new THREE.Vector3(0.08, -0.06, 0.0);
    const initialRot = new THREE.Euler(-0.6, -0.3, 0);
    const initialScale = 0.92;

    const basePos = new THREE.Vector3(0, 0, 0);
    const baseRot = new THREE.Euler(0.03, 0.0, 0.0);
    const baseScale = 1.0;

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

    const rotateEnd = 0.3;
    const allowSpin = p <= rotateEnd;

    const vel = v.get();
    const speed = THREE.MathUtils.clamp(Math.abs(vel) * 10, 0, 3.4);

    if (allowSpin && speed > 0.01) {
      spinRef.current += speed * dt * (vel >= 0 ? 1 : -1);
    }

    const targetRotX = blendedRot.x;
    const targetRotY = blendedRot.y;
    const targetRotZ = blendedRot.z + spinRef.current;

    // position
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

    // rotation
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

    // scale
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
function PercentPicker({ enabled = true, containerRef, onPick }) {
  useEffect(() => {
    if (!enabled) return;
    const el = containerRef?.current;
    if (!el) return;

    const handler = (e) => {
      if (!e.shiftKey) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // clamp داخل الكونتينر
      const cx = Math.max(0, Math.min(rect.width, x));
      const cy = Math.max(0, Math.min(rect.height, y));

      const leftPct = (cx / rect.width) * 100;
      const topPct = (cy / rect.height) * 100;

      const left = `${leftPct.toFixed(2)}%`;
      const top = `${topPct.toFixed(2)}%`;

      const payload = { left, top };

      console.log("🟦 PICKED %:", payload);

      // copy as two lines OR as array item (اختار اللي تحبه)
      const pretty = `left: "${left}", top: "${top}"`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(pretty).catch(() => {});
      }

      onPick?.(payload);
    };

    window.addEventListener("pointerdown", handler, { passive: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [enabled, containerRef, onPick]);

  return null;
}

export default function KfhViewer({ navH = 0, scrollTargetRef }) {
  const viewRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollTargetRef, // ✅ the 880vh div
    offset: ["start start", "end end"], // ✅ 0..1 from top to bottom
  });

  const rootRef = useRef(null);
  const [currentStep, setCurrentStep] = React.useState(0);

  const [coarseLeft, setCoarseLeft] = React.useState([
    "10.98%",
    "40%",
    "50%",
    "68%",
    "78%",
    "85%",
    "90%",
    "80%",
    "70%",
    "60%",
    "55%",
    "45%", //center
  ]);

  const [coarseTop, setCoarseTop] = React.useState([
    "100%",
    "80%",
    "70%",
    "60%",
    "75%",
    "80%",
    "100%",
    "120%",
    "110%",
    "100%",
    "80%",
    "90%", //center
  ]);
  const [picked, setPicked] = React.useState([]);

  const scrollSmooth = useSpring(scrollYProgress, {
    stiffness: 38,
    damping: 26,
    mass: 1.35,
  });
  // shows smoothed value (recommended)
  useMotionValueEvent(scrollSmooth, "change", (v) => {
    setCurrentStep(v);
  });
  const coarseKeys = useMemo(() => {
    const n = coarseLeft.length;
    const end = 0.9;
    if (n < 2) return [0, end];
    return Array.from({ length: n }, (_, i) => (i / (n - 1)) * end);
  }, [coarseLeft.length]);

  const STEPS = 220;

  const frames = useMemo(() => {
    // make W/H arrays match length of coarseLeft
    const n = coarseLeft.length;
    const coarseW = Array.from({ length: n }, (_, i) => 700);
    const coarseH = Array.from({ length: n }, (_, i) => 700);

    const w = densifyKeyframes(coarseKeys, coarseW, STEPS);
    const h = densifyKeyframes(coarseKeys, coarseH, STEPS);
    const left = densifyKeyframes(coarseKeys, coarseLeft, STEPS);
    const top = densifyKeyframes(coarseKeys, coarseTop, STEPS);

    return { w, h, left, top };
  }, [coarseKeys, coarseLeft, coarseTop, STEPS]);

  const w = useTransform(scrollSmooth, frames.w.keys, frames.w.vals);
  const h = useTransform(scrollSmooth, frames.h.keys, frames.h.vals);

  const leftRaw = useTransform(
    scrollSmooth,
    frames.left.keys,
    frames.left.vals,
  );
  const topRaw = useTransform(scrollSmooth, frames.top.keys, frames.top.vals);

  const left = useSpring(leftRaw, { stiffness: 50, damping: 30, mass: 1.2 });
  const top = useSpring(topRaw, { stiffness: 50, damping: 30, mass: 1.2 });

  return (
    <motion.div ref={rootRef} className="relative h-full w-full">
      <PercentPicker
        enabled
        containerRef={rootRef}
        onPick={({ left, top }) => {
          setCoarseLeft((prev) => [...prev, left]);
          setCoarseTop((prev) => [...prev, top]);
        }}
      />

      {/* overlay show arrays */}
      <div className="absolute z-50 top-3 right-3 bg-black/60 text-white text-xs p-3 rounded-md max-w-[520px] ">
        <div className="font-semibold mb-2">Percent Picker (Shift + Click)</div>

        <div className="mb-2 opacity-80">Copied: left/top on each click</div>

        <div className="space-y-2 ">
          <div>
            <div className="font-semibold">coarseLeft</div>
            <pre className="whitespace-pre-wrap wrap-break-word overflow-x-hidden">
              {JSON.stringify(coarseLeft)}
            </pre>
          </div>
          <div>
            <div className="font-semibold">coarseTop</div>
            <pre className="whitespace-pre-wrap wrap-break-word overflow-x-hidden">
              {JSON.stringify(coarseTop)}
            </pre>
          </div>
          <div>
            <div className="font-semibold">coarseKeys</div>
            <pre className="whitespace-pre-wrap wrap-break-word overflow-x-hidden">
              {JSON.stringify(coarseKeys)}
            </pre>
          </div>

          <div>
            <div className="font-semibold">current step</div>
            <pre className="whitespace-pre-wrap wrap-break-word overflow-x-hidden">
              {currentStep.toFixed(4)}
            </pre>
          </div>
        </div>
      </div>

      <Canvas
        frameloop="always"
        className="absolute inset-0"
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.8, 2.6], fov: 45 }}
      >
        <View track={viewRef}>
          <ViewScene scrollYProgress={scrollSmooth} smooth={12} />
          <PointPicker
            enabled
            onPick={(p) => setPicked((prev) => [...prev, p])}
          />
        </View>
      </Canvas>

      {/* View window - keep pointer-events-none so it doesn't block clicks */}
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
