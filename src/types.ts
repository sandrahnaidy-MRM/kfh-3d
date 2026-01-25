export type Vec3 = [number, number, number];

export type Keyframe = {
  id: string;
  label: string;
  duration: number; // seconds
  position: Vec3;
  rotation: Vec3; // Euler radians
  ease: string; // GSAP ease string
};

export type SceneRecording = {
  version: 1;
  modelUrl: string;
  frames: Keyframe[];
};
