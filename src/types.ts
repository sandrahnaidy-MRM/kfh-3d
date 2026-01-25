export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export type Keyframe = {
  id: string;
  label: string;
  duration: number; // seconds
  ease: string;

  position: Vec3;
  quaternion: Quat; //  smooth rotation
  scale: Vec3; //  include scale
};

export type SceneRecording = {
  version: 2; //  bump version
  modelUrl: string;
  frames: Keyframe[];
};
