export const SECTIONS = Array.from({ length: 10 }).map((_, i) => {
  const k = i / 9; // 0..1

  return {
    key: k,
    object: {
      pos: [0, 0, 0],
      rot: [-0.2 + k * 0.25, -0.3 + k * 0.6, 0],
      scale: 0.92 + k * 0.12,
    },
    lights: {
      ambient: 0.35,
      dir1: {
        pos: [-4 + k * 5, 9 + k * 2, 4 + k * 4],
        intensity: 1.1 - k * 0.2,
      },
      dir2: {
        pos: [3 + k * 3, 2 + k * 1, 4 - k * 2],
        intensity: 0.35 + k * 0.15,
      },
      back: {
        pos: [0 - k * 2, 3 + k * 1, -5 - k * 3],
        intensity: 0.15 + k * 0.2,
      },
    },
    env: {
      preset: "apartment", // or "city", "studio", ...
      intensity: 1,
      rotationY: 0,
      background: false,
    },
  };
});
