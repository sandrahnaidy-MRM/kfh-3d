import { SECTIONS } from "@data/sections";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

import { getSectionProgress } from "@/utils/lerpHelpers";

const MODEL_URL = "/models/kfh.glb";
useGLTF.preload(MODEL_URL);

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

export function ViewScene({ scrollYProgress, sections, smooth = 10, user }) {
  const { scene } = useGLTF(MODEL_URL);

  const group = useRef();
  const dir1 = useRef();
  const dir2 = useRef();
  const back = useRef();

  useEffect(() => {
    // centerAndNormalize(scene) — خليه كما هو عندك
  }, [scene]);

  useFrame((_, dt) => {
    if (!group.current) return;

    const p = scrollYProgress.get(); // 0..1
    const { index, nextIndex, t } = getSectionProgress(p, sections);

    const a = SECTIONS[index];
    const b = SECTIONS[nextIndex];

    // ---------- OBJECT ----------
    const pos = [
      THREE.MathUtils.lerp(a.object.pos[0], b.object.pos[0], t),
      THREE.MathUtils.lerp(a.object.pos[1], b.object.pos[1], t),
      THREE.MathUtils.lerp(a.object.pos[2], b.object.pos[2], t),
    ];

    const rot = [
      THREE.MathUtils.lerp(a.object.rot[0], b.object.rot[0], t),
      THREE.MathUtils.lerp(a.object.rot[1], b.object.rot[1], t),
      THREE.MathUtils.lerp(a.object.rot[2], b.object.rot[2], t),
    ];

    const scale = THREE.MathUtils.lerp(a.object.scale, b.object.scale, t);

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

    group.current.rotation.x = damp(
      group.current.rotation.x,
      rot[0],
      smooth,
      dt,
    );
    group.current.rotation.y = damp(
      group.current.rotation.y,
      rot[1],
      smooth,
      dt,
    );
    group.current.rotation.z = damp(
      group.current.rotation.z,
      rot[2],
      smooth,
      dt,
    );

    const s = damp(group.current.scale.x, scale, smooth, dt);
    group.current.scale.setScalar(s);

    // ---------- LIGHTS ----------
    const follow = user?.followSections ?? true;

    const dir1Pos = follow
      ? a.lights.dir1.pos.map((v, i) =>
          THREE.MathUtils.lerp(v, b.lights.dir1.pos[i], t),
        )
      : [user.dir1X, user.dir1Y, user.dir1Z];

    const dir1Intensity = follow
      ? THREE.MathUtils.lerp(
          a.lights.dir1.intensity,
          b.lights.dir1.intensity,
          t,
        )
      : user.dir1Intensity;

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

    // نفس المنطق لـ dir2 و back (كما عندك)
  });

  // ====== Environment controlled outside (below) ======
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
