import { useControls } from "leva";

export function useUserControls() {
  return useControls("Lighting & Env", {
    // ambient
    ambient: { value: 0.35, min: 0, max: 2, step: 0.01 },

    // dir1
    dir1Intensity: { value: 1.1, min: 0, max: 5, step: 0.01 },
    dir1X: { value: -4, min: -20, max: 20, step: 0.1 },
    dir1Y: { value: 9, min: -20, max: 20, step: 0.1 },
    dir1Z: { value: 4, min: -20, max: 20, step: 0.1 },

    // dir2
    dir2Intensity: { value: 0.35, min: 0, max: 5, step: 0.01 },
    dir2X: { value: 3, min: -20, max: 20, step: 0.1 },
    dir2Y: { value: 2, min: -20, max: 20, step: 0.1 },
    dir2Z: { value: 4, min: -20, max: 20, step: 0.1 },

    // back
    backIntensity: { value: 0.15, min: 0, max: 5, step: 0.01 },
    backX: { value: 0, min: -20, max: 20, step: 0.1 },
    backY: { value: 3, min: -20, max: 20, step: 0.1 },
    backZ: { value: -5, min: -20, max: 20, step: 0.1 },

    // environment
    envPreset: {
      value: "apartment",
      options: [
        "apartment",
        "city",
        "studio",
        "sunset",
        "dawn",
        "forest",
        "warehouse",
        "night",
        "lobby",
        "park",
      ],
    },
    envIntensity: { value: 1, min: 0, max: 5, step: 0.01 },
    envRotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    envBackground: { value: false },
    followSections: { value: true },
  });
}
