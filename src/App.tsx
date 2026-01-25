import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import SceneCanvas, { type ControlMode } from "./components/SceneCanvas";
import ControlsPanel from "./components/ControlsPanel";
import { useSceneRecorder } from "./hooks/useSceneRecorder";
import { useScrollPlayback } from "./hooks/useScrollPlayback";

const MODEL_URL = "/models/model.glb";

export default function App() {
  const objectRef = useRef<THREE.Object3D | null>(null);

  const [mode, setMode] = useState<ControlMode>("translate");
  const [space, setSpace] = useState<"world" | "local">("world");
  const [enabled, setEnabled] = useState(true);
  const [snapMove, setSnapMove] = useState(0);
  const [snapRotateDeg, setSnapRotateDeg] = useState(0);

  //  tick to refresh pose text (driven by onObjectChange + play updates)
  const [poseTick, setPoseTick] = useState(0);

  const recorder = useSceneRecorder({
    modelUrl: MODEL_URL,
    objectRef,
    onPoseTick: () => setPoseTick((x) => x + 1),
  });

  //  mode switch
  const [pageMode, setPageMode] = useState<"editor" | "scroll">("editor");
  const isScrollMode = pageMode === "scroll";

  //  scroll container (we scroll inside this div, not the whole page)
  const scrollWrapRef = useRef<HTMLDivElement | null>(null);

  //  enable scroll playback only in scroll mode
  useScrollPlayback({
    frames: recorder.frames,
    objectRef,
    enabled: isScrollMode,
    container: scrollWrapRef,
    onPoseTick: () => setPoseTick((x) => x + 1),
  });

  //  disable BODY scroll in scroll mode
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = isScrollMode ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [isScrollMode]);

  const currentPoseText = useMemo(() => {
    const obj = objectRef.current;
    if (!obj) return "Loading...";
    const p = obj.position;
    const r = obj.rotation;
    const s = obj.scale;
    return [
      `position: x=${p.x.toFixed(2)}  y=${p.y.toFixed(2)}  z=${p.z.toFixed(2)}`,
      `rotation(rad): x=${r.x.toFixed(2)}  y=${r.y.toFixed(2)}  z=${r.z.toFixed(2)}`,
      `scale: x=${s.x.toFixed(2)}  y=${s.y.toFixed(2)}  z=${s.z.toFixed(2)}`,
    ].join("\n");
  }, [poseTick, recorder.frames.length]);

  const onExport = () => {
    const json = recorder.exportJSON();
    navigator.clipboard.writeText(json).catch(() => {});
    alert("Recording JSON copied to clipboard ");
  };

  const onImport = () => {
    const json = prompt("Paste recording JSON here:");
    if (!json) return;
    try {
      recorder.importJSON(json);
      setPoseTick((x) => x + 1);
      alert("Imported ");
    } catch (e: any) {
      alert(e?.message || "Invalid JSON");
    }
  };

  const snapToNearest = () => {
    const frames = recorder.frames;
    const total =
      frames.reduce((s, f) => s + (Number(f.duration) || 0), 0) || 0;
    if (!frames.length || total <= 0) return;

    let acc = 0;
    const markers = frames.map((f) => {
      const t = acc;
      acc += Number(f.duration) || 0;
      return { p: t / total };
    });

    const cur = recorder.scrub;

    let best = markers[0];
    let bestD = Math.abs(cur - markers[0].p);
    for (let i = 1; i < markers.length; i++) {
      const d = Math.abs(cur - markers[i].p);
      if (d < bestD) {
        bestD = d;
        best = markers[i];
      }
    }

    recorder.setScrub(best.p);
  };

  return (
    <div className="h-full w-full bg-zinc-900 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-semibold">3D Scene Builder</div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-sm ${
              pageMode === "editor" ? "bg-white text-blue-600" : "bg-white/10"
            }`}
            onClick={() => setPageMode("editor")}
          >
            Editor
          </button>

          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-sm ${
              pageMode === "scroll" ? "bg-white text-blue-600" : "bg-white/10"
            }`}
            onClick={() => setPageMode("scroll")}
          >
            Scroll
          </button>
        </div>
      </div>

      {/* Main layout: Canvas left + Controls right ALWAYS */}
      <div className="flex h-[calc(100vh-68px)] w-full flex-col md:flex-row">
        {/* LEFT */}
        <div className="relative flex-1">
          {/* tip */}
          <div className="absolute left-4 top-4 z-10 rounded-xl bg-blue-500/40 px-3 py-2 text-xs text-white backdrop-blur">
            {isScrollMode
              ? "Scroll Mode: scroll the content to drive the animation"
              : "Tip: Use gizmo (arrows/rings) → Add → repeat → Play"}
          </div>

          {/*  Canvas is ALWAYS mounted */}
          <SceneCanvas
            modelUrl={MODEL_URL}
            mode={mode}
            space={space}
            enabled={!isScrollMode && enabled} //  disable TransformControls in scroll mode
            snapMove={snapMove}
            snapRotateDeg={snapRotateDeg}
            objectRef={objectRef}
            onPoseTick={() => setPoseTick((x) => x + 1)}
            //  you MUST implement these two props in SceneCanvas
            orbitEnabled={!isScrollMode} // stop zoom/pan/rotate
            transformEnabled={!isScrollMode} // hide/disable gizmo
          />

          {/*  Scroll mode: overlay scroll container (Canvas stays visible) */}
          {isScrollMode && (
            <div
              ref={scrollWrapRef}
              className="absolute inset-0 z-0 overflow-y-auto"
            >
              {/* give enough scroll length */}
              <div className="h-[70vh]" />

              <div className="mx-auto max-w-3xl space-y-16 px-6 py-12">
                <section className="rounded-2xl bg-white/5 p-6">
                  <h2 className="text-xl font-semibold">Scroll to animate</h2>
                  <p className="mt-2 opacity-80">
                    The model follows your recorded steps as you scroll (0% →
                    100%).
                  </p>
                </section>

                {Array.from({ length: 10 }).map((_, i) => (
                  <section key={i} className="rounded-2xl bg-white/5 p-6">
                    <h3 className="text-lg font-semibold">Section {i + 1}</h3>
                    <p className="mt-2 opacity-80">
                      Scroll progress drives the timeline.
                    </p>
                    <div className="mt-4 h-24 rounded-xl bg-black/30" />
                  </section>
                ))}

                <section className="rounded-2xl bg-white/5 p-6">
                  <h3 className="text-lg font-semibold">End</h3>
                  <p className="mt-2 opacity-80">
                    You reached 100% of the animation.
                  </p>
                </section>

                <div className="h-[25vh]" />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="h-full overflow-y-auto p-3 md:w-[420px] md:p-4">
          <ControlsPanel
            mode={mode}
            setMode={setMode}
            space={space}
            setSpace={setSpace}
            enabled={enabled}
            setEnabled={setEnabled}
            snapMove={snapMove}
            setSnapMove={setSnapMove}
            snapRotateDeg={snapRotateDeg}
            setSnapRotateDeg={setSnapRotateDeg}
            frames={recorder.frames}
            onAddStep={() => recorder.captureFrame()}
            onUndo={recorder.removeLastFrame}
            onClear={recorder.clearFrames}
            onPlay={recorder.play}
            onStop={recorder.stop}
            onResetPose={recorder.resetPose}
            onJumpTo={recorder.setPose}
            onExport={onExport}
            onImport={onImport}
            onUpdateFrame={recorder.updateFrame}
            eases={recorder.DEFAULT_EASES}
            currentPoseText={currentPoseText}
            scrub={recorder.scrub}
            onScrub={recorder.setScrub}
            onDeleteStep={recorder.deleteFrame}
            onSnapToNearest={snapToNearest}
          />

          {isScrollMode && (
            <div className="mt-3 rounded-xl bg-white/5 p-3 text-xs opacity-80">
              In Scroll Mode: Transform + Orbit are disabled. Use the scroll
              area on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
