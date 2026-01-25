import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import SceneCanvas, { type ControlMode } from "./components/SceneCanvas";
import ControlsPanel from "./components/ControlsPanel";
import { useSceneRecorder } from "./hooks/useSceneRecorder";

const MODEL_URL = "/models/model.glb";

export default function App() {
  const objectRef = useRef<THREE.Object3D | null>(null);

  const [mode, setMode] = useState<ControlMode>("translate");
  const [space, setSpace] = useState<"world" | "local">("world");
  const [enabled, setEnabled] = useState(true);
  const [snapMove, setSnapMove] = useState(0);
  const [snapRotateDeg, setSnapRotateDeg] = useState(0);

  // ✅ tick to refresh pose text (driven by onObjectChange + play updates)
  const [poseTick, setPoseTick] = useState(0);

  const recorder = useSceneRecorder({
    modelUrl: MODEL_URL,
    objectRef,
    onPoseTick: () => setPoseTick((x) => x + 1),
  });

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
    alert("Recording JSON copied to clipboard ✅");
  };

  const onImport = () => {
    const json = prompt("Paste recording JSON here:");
    if (!json) return;
    try {
      recorder.importJSON(json);
      setPoseTick((x) => x + 1);
      alert("Imported ✅");
    } catch (e: any) {
      alert(e?.message || "Invalid JSON");
    }
  };

  return (
    <div className="h-full w-full bg-zinc-900">
      <div className="flex h-full w-full flex-col md:flex-row">
        <div className="relative flex-1">
          <div className="absolute left-4 top-4 z-10 rounded-xl bg-blue-500/40 px-3 py-2 text-xs text-white backdrop-blur">
            Tip: Use gizmo (arrows/rings) → Add → repeat → Play
          </div>

          <SceneCanvas
            modelUrl={MODEL_URL}
            mode={mode}
            space={space}
            enabled={enabled}
            snapMove={snapMove}
            snapRotateDeg={snapRotateDeg}
            objectRef={objectRef}
            onPoseTick={() => setPoseTick((x) => x + 1)}
          />
        </div>

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
          />
        </div>
      </div>
    </div>
  );
}
