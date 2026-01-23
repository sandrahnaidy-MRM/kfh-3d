import { useControls } from "leva";

export function useUserControls() {
  return useControls("Lighting & Env", {
    /* =========================
     * Ambient Light
     * ========================= */
    ambient: { value: 0.35, min: 0, max: 2, step: 0.01 },

    /* =========================
     * Directional Lights
     * ========================= */
    dir1Intensity: { value: 1.1, min: 0, max: 5, step: 0.01 },
    dir1X: { value: -4, min: -20, max: 20, step: 0.1 },
    dir1Y: { value: 9, min: -20, max: 20, step: 0.1 },
    dir1Z: { value: 4, min: -20, max: 20, step: 0.1 },

    dir2Intensity: { value: 0.35, min: 0, max: 5, step: 0.01 },
    dir2X: { value: 3, min: -20, max: 20, step: 0.1 },
    dir2Y: { value: 2, min: -20, max: 20, step: 0.1 },
    dir2Z: { value: 4, min: -20, max: 20, step: 0.1 },

    backIntensity: { value: 0.15, min: 0, max: 5, step: 0.01 },
    backX: { value: 0, min: -20, max: 20, step: 0.1 },
    backY: { value: 3, min: -20, max: 20, step: 0.1 },
    backZ: { value: -5, min: -20, max: 20, step: 0.1 },

    /* =========================
     * Environment
     * ========================= */
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

    /* =========================
     * Spin / Motion
     * ========================= */
    enableSpin: { value: true },
    spinDirection: { value: "cw", options: ["cw", "ccw"] },
    spinStrength: { value: 1, min: 0, max: 5, step: 0.05 },
    spinDamping: { value: 10, min: 1, max: 30, step: 1 },

    motionMode: {
      value: "curveS",
      options: ["sections", "curveS"],
    },

    /* =========================
     * Background FX
     * ========================= */
    backgroundFx: {
      value: "stars",
      options: ["stars", "track", "none"],
    },

    /* =========================
     * Track FX
     * ========================= */
    trackVisible: { value: true },
    trackWidth: { value: 0.08, min: 0.01, max: 0.5, step: 0.005 },
    trackOpacity: { value: 0.85, min: 0, max: 1, step: 0.01 },
    trackSegments: { value: 120, min: 20, max: 300, step: 10 },
    trackColor: { value: "#E6E6E6" },
    trackZ: { value: -1.4, min: -4, max: 0, step: 0.05 },
    trackSX: { value: 0.6, min: 0.1, max: 2, step: 0.05 },
    trackSY: { value: 0.35, min: 0.1, max: 2, step: 0.05 },

    /* =========================
     * Floating / Parallax
     * ========================= */
    macFloatAmp: { value: 0.08, min: 0, max: 0.5, step: 0.01 },
    macFloatSpeed: { value: 0.9, min: 0, max: 4, step: 0.05 },
    macParallaxX: { value: 0.18, min: 0, max: 1, step: 0.01 },
    macParallaxY: { value: 0.1, min: 0, max: 1, step: 0.01 },
    macTilt: { value: 0.12, min: 0, max: 1, step: 0.01 },

    /* =========================
     * Docking
     * ========================= */
    dockX: { value: 0.55, min: 0, max: 2, step: 0.01 },
    dockY: { value: 0.08, min: 0, max: 1, step: 0.01 },
    dockZ: { value: -1.3, min: -4, max: 0, step: 0.01 },
    dockEase: { value: 0.85, min: 0, max: 1, step: 0.01 },

    /* =========================
     * Stars / Sphere
     * ========================= */
    starsCount: { value: 6000, min: 500, max: 20000, step: 500 },
    starsRadius: { value: 18, min: 6, max: 60, step: 1 },
    starsShell: { value: 8, min: 2, max: 30, step: 1 },
    starsSpeed: { value: 0.6, min: 0, max: 4, step: 0.05 },
    starsSize: { value: 0.025, min: 0.001, max: 0.2, step: 0.001 },
    starsOpacity: { value: 0.9, min: 0, max: 1, step: 0.01 },
    starsSwirl: { value: 0.06, min: 0, max: 0.5, step: 0.01 },
    starsColor: { value: "#ffffff" },

    sphereRadius: { value: 0.35, min: 0, max: 2, step: 0.01 },
    sphereSpeed: { value: 0.35, min: 0, max: 2, step: 0.01 },

    /* =========================
     * Scale Lock
     * ========================= */
    lockScale: { value: true },
    fixedScale: { value: 1, min: 0.1, max: 3, step: 0.01 },
  });
}
