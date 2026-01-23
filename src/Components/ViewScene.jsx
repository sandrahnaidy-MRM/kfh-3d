import { SECTIONS } from "@data/sections";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  centerAndNormalize,
  getSectionProgress,
  makeSCurve,
} from "@utils/lerpHelpers";
import { useVelocity } from "framer-motion";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { useScroll } from "framer-motion";
const MODEL_URL = "/models/kfh.glb";
useGLTF.preload(MODEL_URL);

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

export function ViewScene({ sections = 10, smooth = 10, user }) {
  const curveRef = useRef(makeSCurve());

  const { scene } = useGLTF(MODEL_URL);

  const group = useRef();
  const dir1 = useRef();
  const dir2 = useRef();
  const back = useRef();

  const { scrollYProgress } = useScroll();
  const v = useVelocity(scrollYProgress);

  useEffect(() => {
    centerAndNormalize(scene);
  }, [scene]);

  const spinRef = useRef(0); // accumulated spin angle
  const spinVelRef = useRef(0); // smoothed spin velocity

  useFrame((_, dt) => {
    if (!group.current) return;

    const p = scrollYProgress.get(); // 0..1

    const { index, nextIndex, t } = getSectionProgress(p, sections);

    const a = SECTIONS[index];
    const b = SECTIONS[nextIndex];

    // ---------- OBJECT BASE (from sections) ----------
    // let pos = [
    //   THREE.MathUtils.lerp(a.object.pos[0], b.object.pos[0], t),
    //   THREE.MathUtils.lerp(a.object.pos[1], b.object.pos[1], t),
    //   THREE.MathUtils.lerp(a.object.pos[2], b.object.pos[2], t),
    // ];

    // let rot = [
    //   THREE.MathUtils.lerp(a.object.rot[0], b.object.rot[0], t),
    //   THREE.MathUtils.lerp(a.object.rot[1], b.object.rot[1], t),
    //   THREE.MathUtils.lerp(a.object.rot[2], b.object.rot[2], t),
    // ];

    // let scale = THREE.MathUtils.lerp(a.object.scale, b.object.scale, t);

    // ---------- MOTION MODE ----------
    const mode = user?.motionMode ?? "sections";

    let pos, rot, scale;

    if (mode === "sphereStars") {
      // ✅ لا تكبير
      const fixedScale = user?.fixedScale ?? 1.0;
      scale = fixedScale;

      // امشِ على المسار (0..1)
      const u = p; // أو THREE.MathUtils.smoothstep(p,0,1) إذا بدك
      const curve = curveRef.current;

      const point = curve.getPointAt(u);

      // حركة إضافية بسيطة (left/right up/down) فوق المسار
      const floatAmpX = user?.floatAmpX ?? 0.08;
      const floatAmpY = user?.floatAmpY ?? 0.06;
      const floatSpeed = user?.floatSpeed ?? 2.0;

      point.x += Math.sin(u * Math.PI * 2 * floatSpeed) * floatAmpX;
      point.y += Math.cos(u * Math.PI * 2 * floatSpeed * 1.2) * floatAmpY;

      pos = [point.x, point.y, point.z];

      // rotation base (بدون grow) — وخلي spin Z يشتغل فوقها مثل ما أصلحناه سابقاً
      rot = [rot[0], rot[1], rot[2]];
    }
    if (mode === "macFloat") {
      const u = p;
      const amp = user?.macFloatAmp ?? 0.08;
      const spd = user?.macFloatSpeed ?? 0.9;

      // Parallax مع السكرول
      const px = (user?.macParallaxX ?? 0.18) * (u - 0.5);
      const py = (user?.macParallaxY ?? 0.1) * (0.5 - u);

      // Float ناعم
      const floatY = Math.sin(u * Math.PI * 2 * spd) * amp;
      const floatX = Math.cos(u * Math.PI * 2 * spd * 0.8) * (amp * 0.6);

      // Position ثابت + parallax + float
      pos = [px + floatX, py + floatY, -1.2];

      // Micro tilt (Apple-like)
      const tilt = user?.macTilt ?? 0.12;
      rot = [
        -0.08 + (0.5 - u) * tilt,
        -0.1 + (u - 0.5) * tilt,
        rot[2], // z spin optional separately
      ];

      // Scale ثابت غالبًا
      scale = user?.fixedScale ?? 1.0;
    }
    if (mode === "macDockSlide") {
      const ease = user?.dockEase ?? 0.85;

      // quantize progress for "sections" feeling
      const steps = sections ?? 10;
      const x = THREE.MathUtils.clamp(p, 0, 1) * (steps - 1);
      const idx = Math.floor(x);
      const t0 = x - idx;
      const t = THREE.MathUtils.smoothstep(t0, 0, 1) * ease + t0 * (1 - ease);

      // slide left <-> right across steps
      const span = user?.dockX ?? 0.55;
      const targetX = THREE.MathUtils.lerp(
        span,
        -span,
        (idx + t) / (steps - 1),
      );
      const targetY = Math.sin((idx + t) * 0.6) * (user?.dockY ?? 0.08);

      pos = [targetX, targetY, user?.dockZ ?? -1.3];

      // clean tilt
      rot = [
        -0.06,
        THREE.MathUtils.lerp(-0.25, 0.25, (idx + t) / (steps - 1)),
        rot[2],
      ];
      scale = user?.fixedScale ?? 1.0;
    }
    // ===== A) Sections mode (لازم sections.pos تكون مختلفة) =====
    if (mode === "sections") {
      const { index, nextIndex, t } = getSectionProgress(p, sections);
      const a = SECTIONS[index];
      const b = SECTIONS[nextIndex];

      pos = [
        THREE.MathUtils.lerp(a.object.pos[0], b.object.pos[0], t),
        THREE.MathUtils.lerp(a.object.pos[1], b.object.pos[1], t),
        THREE.MathUtils.lerp(a.object.pos[2], b.object.pos[2], t),
      ];
      rot = [
        THREE.MathUtils.lerp(a.object.rot[0], b.object.rot[0], t),
        THREE.MathUtils.lerp(a.object.rot[1], b.object.rot[1], t),
        THREE.MathUtils.lerp(a.object.rot[2], b.object.rot[2], t),
      ];
      scale = THREE.MathUtils.lerp(a.object.scale, b.object.scale, t);
    }

    // ===== B) Curve S mode =====
    if (mode === "curveS") {
      const curve = curveRef.current;

      const u = THREE.MathUtils.smoothstep(p, 0, 1);
      const pt = curve.getPointAt(u);

      // float لطيف فوق المسار
      const floatAmpX = user?.floatAmpX ?? 0.05;
      const floatAmpY = user?.floatAmpY ?? 0.04;
      const floatSpeed = user?.floatSpeed ?? 1.2;

      const fx = Math.sin(u * Math.PI * 2 * floatSpeed) * floatAmpX;
      const fy = Math.cos(u * Math.PI * 2 * floatSpeed * 1.1) * floatAmpY;

      // ✅ S على X/Y — Z ثابت
      pos = [pt.x + fx, pt.y + fy, pt.z];

      // ✅ no grow
      scale = user?.fixedScale ?? 1.0;

      // دوران بسيط (اختياري)
      rot = [-0.1, -0.1, 0];
    }

    // position
    group.current.position.x = damp(
      group.current.position.x,
      pos[0],
      smooth,
      dt,
    );
    group.current.position.y = damp(
      group.current.position.y,
      pos[1],
      smooth,
      dt,
    );
    group.current.position.z = damp(
      group.current.position.z,
      pos[2],
      smooth,
      dt,
    );

    // scale
    const s = damp(group.current.scale.x, scale, smooth, dt);
    group.current.scale.setScalar(s);

    // ---------- SPIN on Z (optional, clockwise/counter) ----------
    const vel = v.get(); // scroll velocity
    const enabled = user?.enableSpin ?? true;
    const dirSign = (user?.spinDirection ?? "cw") === "cw" ? 1 : -1;

    const strength = user?.spinStrength ?? 1;
    const damping = user?.spinDamping ?? 10;

    // make velocity useful (tweak multiplier if needed)
    const targetSpinVel = enabled
      ? THREE.MathUtils.clamp(Math.abs(vel) * 0.08, 0, 2.5) * dirSign * strength
      : 0;

    spinVelRef.current = THREE.MathUtils.damp(
      spinVelRef.current,
      targetSpinVel,
      damping,
      dt,
    );

    spinRef.current += spinVelRef.current * dt;

    // rotation (apply once)
    const targetRotX = rot[0];
    const targetRotY = rot[1];
    const targetRotZ = rot[2] + spinRef.current; // ✅ spin on Z

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

    // ---------- LIGHTS ----------
    // ensure refs exist before using them
    if (!dir1.current || !dir2.current || !back.current) return;

    const follow = user?.followSections ?? true;

    // dir1
    const dir1Pos = follow
      ? a.lights.dir1.pos.map((v, i) =>
          THREE.MathUtils.lerp(v, b.lights.dir1.pos[i], t),
        )
      : [user?.dir1X ?? -4, user?.dir1Y ?? 9, user?.dir1Z ?? 4];

    const dir1Intensity = follow
      ? THREE.MathUtils.lerp(
          a.lights.dir1.intensity,
          b.lights.dir1.intensity,
          t,
        )
      : (user?.dir1Intensity ?? 1.1);

    dir1.current.position.x = damp(
      dir1.current.position.x,
      dir1Pos[0],
      smooth,
      dt,
    );
    dir1.current.position.y = damp(
      dir1.current.position.y,
      dir1Pos[1],
      smooth,
      dt,
    );
    dir1.current.position.z = damp(
      dir1.current.position.z,
      dir1Pos[2],
      smooth,
      dt,
    );
    dir1.current.intensity = damp(
      dir1.current.intensity,
      dir1Intensity,
      smooth,
      dt,
    );

    // dir2
    const dir2Pos = follow
      ? a.lights.dir2.pos.map((v, i) =>
          THREE.MathUtils.lerp(v, b.lights.dir2.pos[i], t),
        )
      : [user?.dir2X ?? 3, user?.dir2Y ?? 2, user?.dir2Z ?? 4];

    const dir2Intensity = follow
      ? THREE.MathUtils.lerp(
          a.lights.dir2.intensity,
          b.lights.dir2.intensity,
          t,
        )
      : (user?.dir2Intensity ?? 0.35);

    dir2.current.position.x = damp(
      dir2.current.position.x,
      dir2Pos[0],
      smooth,
      dt,
    );
    dir2.current.position.y = damp(
      dir2.current.position.y,
      dir2Pos[1],
      smooth,
      dt,
    );
    dir2.current.position.z = damp(
      dir2.current.position.z,
      dir2Pos[2],
      smooth,
      dt,
    );
    dir2.current.intensity = damp(
      dir2.current.intensity,
      dir2Intensity,
      smooth,
      dt,
    );

    // back
    const backPos = follow
      ? a.lights.back.pos.map((v, i) =>
          THREE.MathUtils.lerp(v, b.lights.back.pos[i], t),
        )
      : [user?.backX ?? 0, user?.backY ?? 3, user?.backZ ?? -5];

    const backIntensity = follow
      ? THREE.MathUtils.lerp(
          a.lights.back.intensity,
          b.lights.back.intensity,
          t,
        )
      : (user?.backIntensity ?? 0.15);

    back.current.position.x = damp(
      back.current.position.x,
      backPos[0],
      smooth,
      dt,
    );
    back.current.position.y = damp(
      back.current.position.y,
      backPos[1],
      smooth,
      dt,
    );
    back.current.position.z = damp(
      back.current.position.z,
      backPos[2],
      smooth,
      dt,
    );
    back.current.intensity = damp(
      back.current.intensity,
      backIntensity,
      smooth,
      dt,
    );
  });

  return (
    <>
      <ambientLight intensity={user?.ambient ?? 0.35} />
      <directionalLight ref={dir1} />
      <directionalLight ref={dir2} />
      <directionalLight ref={back} />

      <Suspense fallback={null}>
        <group ref={group}>
          <primitive object={scene} />
        </group>
      </Suspense>
    </>
  );
}
