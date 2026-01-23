import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function StarfieldEndless({ user }) {
  const pointsRef = useRef();

  const count = user?.starsCount ?? 6000;
  const radius = user?.starsRadius ?? 18; // حجم الكرة
  const shell = user?.starsShell ?? 8; // سماكة الطبقة
  const size = user?.starsSize ?? 0.02;

  const { geometry, base } = useMemo(() => {
    const base = new Float32Array(count * 3);

    // نجوم في “قشرة” حول الكاميرا (بين rMin و rMax)
    const rMin = Math.max(1, radius - shell);
    const rMax = radius;

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();

      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      // r داخل القشرة (uniform-ish)
      const r = THREE.MathUtils.lerp(rMin, rMax, Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      base[i * 3 + 0] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
    return { geometry: g, base };
  }, [count, radius, shell]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(user?.starsColor ?? "#ffffff"),
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity: user?.starsOpacity ?? 0.9,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [size, user?.starsColor, user?.starsOpacity],
  );

  // حركة “مرور” + wrap داخل الكرة
  const drift = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera }, dt) => {
    const pts = pointsRef.current;
    if (!pts) return;

    // النجوم حول الكاميرا دائماً
    pts.position.copy(camera.position);

    // drift خفيف (X/Y) + swirl
    const spd = user?.starsSpeed ?? 0.6; // ليس 18، هذا sphere drift
    drift.current.x += spd * dt * 0.15;
    drift.current.y += spd * dt * 0.1;

    const attr = geometry.getAttribute("position");
    const arr = attr.array;

    // wrap: لو خرجت النجمة عن radius نرجعها للجهة المقابلة
    const rMax = radius;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;

      let x = base[ix + 0] + drift.current.x;
      let y = base[ix + 1] + drift.current.y;
      let z = base[ix + 2];

      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > rMax) {
        const s = rMax / len;
        x *= s * -1;
        y *= s * -1;
        z *= s * -1;
      }

      arr[ix + 0] = x;
      arr[ix + 1] = y;
      arr[ix + 2] = z;
    }

    attr.needsUpdate = true;

    pts.rotation.y += (user?.starsSwirl ?? 0.03) * dt;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
