import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

type Props = {
  url: string;
};

export default function Model({ url }: Props) {
  const { scene } = useGLTF(url);

  // clone so we can safely mutate transforms
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Optional: improve materials a bit (safe)
  cloned.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  return <primitive object={cloned} />;
}

useGLTF.preload("/models/model.glb");
