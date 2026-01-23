import React, { useMemo } from "react";
import * as THREE from "three";
import { makeSCurve } from "@utils/lerpHelpers";

export default function TrackStreet({ user }) {
  const curve = useMemo(
    () =>
      makeSCurve({
        z: user?.trackZ ?? -1.4,
        sx: user?.trackSX ?? 0.6,
        sy: user?.trackSY ?? 0.35,
      }),
    [user?.trackZ, user?.trackSX, user?.trackSY],
  );

  const geom = useMemo(() => {
    const segments = user?.trackSegments ?? 120;
    const halfW = (user?.trackWidth ?? 0.08) / 2;

    const pts = curve.getPoints(segments);

    // build ribbon: for each point compute left/right using tangent in XY
    const positions = new Float32Array(segments * 6 * 3); // 2 triangles per segment => 6 verts
    let o = 0;

    for (let i = 0; i < segments; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];

      const t0 = curve.getTangent(i / segments).normalize();
      const t1 = curve.getTangent((i + 1) / segments).normalize();

      // normal in XY plane: (-ty, tx, 0)
      const n0 = new THREE.Vector3(-t0.y, t0.x, 0)
        .normalize()
        .multiplyScalar(halfW);
      const n1 = new THREE.Vector3(-t1.y, t1.x, 0)
        .normalize()
        .multiplyScalar(halfW);

      const a = new THREE.Vector3().copy(p0).add(n0); // left0
      const b = new THREE.Vector3().copy(p0).sub(n0); // right0
      const c = new THREE.Vector3().copy(p1).add(n1); // left1
      const d = new THREE.Vector3().copy(p1).sub(n1); // right1

      // two triangles: a-b-c and b-d-c
      // tri1 (a,b,c)
      positions[o++] = a.x;
      positions[o++] = a.y;
      positions[o++] = a.z;
      positions[o++] = b.x;
      positions[o++] = b.y;
      positions[o++] = b.z;
      positions[o++] = c.x;
      positions[o++] = c.y;
      positions[o++] = c.z;

      // tri2 (b,d,c)
      positions[o++] = b.x;
      positions[o++] = b.y;
      positions[o++] = b.z;
      positions[o++] = d.x;
      positions[o++] = d.y;
      positions[o++] = d.z;
      positions[o++] = c.x;
      positions[o++] = c.y;
      positions[o++] = c.z;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  }, [curve, user?.trackSegments, user?.trackWidth]);

  const mat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(user?.trackColor ?? "#E6E6E6"),
      transparent: true,
      opacity: user?.trackOpacity ?? 0.85,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }, [user?.trackColor, user?.trackOpacity]);

  if ((user?.backgroundFx ?? "track") !== "track") return null;

  return <mesh geometry={geom} material={mat} />;
}
