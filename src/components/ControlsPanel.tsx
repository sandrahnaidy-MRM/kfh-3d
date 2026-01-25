import { motion } from "framer-motion";
import type { Keyframe } from "../types";
import type { ControlMode } from "./SceneCanvas";

type Props = {
  mode: ControlMode;
  setMode: (m: ControlMode) => void;
  space: "world" | "local";
  setSpace: (s: "world" | "local") => void;
  snapMove: number;
  setSnapMove: (n: number) => void;
  snapRotateDeg: number;
  setSnapRotateDeg: (n: number) => void;

  enabled: boolean;
  setEnabled: (b: boolean) => void;

  frames: Keyframe[];
  onAddStep: () => void;
  onUndo: () => void;
  onClear: () => void;

  onPlay: () => void;
  onStop: () => void;

  onResetPose: () => void;

  onJumpTo: (index: number) => void;

  onExport: () => void;
  onImport: () => void;

  onUpdateFrame: (id: string, patch: Partial<Keyframe>) => void;
  eases: string[];

  currentPoseText: string;
};

function Btn({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger" | "ghost";
}) {
  const base =
    "rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.98]";
  const styles =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "ghost"
        ? "bg-white/5 text-white hover:bg-white/10"
        : "bg-white text-blue-500 hover:bg-white/90";
  return (
    <button className={`${base} ${styles}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export default function ControlsPanel(props: Props) {
  return (
    <motion.aside
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full max-w-md rounded-2xl bg-zinc-950/70 p-4 text-white shadow-xl backdrop-blur"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Scene Recorder</h2>
        <Btn variant="ghost" onClick={() => props.setEnabled(!props.enabled)}>
          {props.enabled ? "Controls: ON" : "Controls: OFF"}
        </Btn>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs opacity-70">Mode</div>
          <div className="mt-2 flex gap-2 flex-col">
            <Btn
              variant={props.mode === "translate" ? "default" : "ghost"}
              onClick={() => props.setMode("translate")}
            >
              Translate
            </Btn>
            <Btn
              variant={props.mode === "rotate" ? "default" : "ghost"}
              onClick={() => props.setMode("rotate")}
            >
              Rotate
            </Btn>
            <Btn
              variant={props.mode === "scale" ? "default" : "ghost"}
              onClick={() => props.setMode("scale")}
            >
              Scale
            </Btn>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs opacity-70">Space</div>
          <div className="mt-2 flex flex-col gap-2">
            <Btn
              variant={props.space === "world" ? "default" : "ghost"}
              onClick={() => props.setSpace("world")}
            >
              World
            </Btn>
            <Btn
              variant={props.space === "local" ? "default" : "ghost"}
              onClick={() => props.setSpace("local")}
            >
              Local
            </Btn>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/5 p-3">
        <div className="text-xs opacity-70">Snapping</div>

        <div className="mt-2">
          <div className="flex items-center justify-between text-sm">
            <span>Move snap</span>
            <span className="opacity-80">{props.snapMove.toFixed(2)}</span>
          </div>
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={props.snapMove}
            onChange={(e) => props.setSnapMove(Number(e.target.value))}
          />
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span>Rotate snap (deg)</span>
            <span className="opacity-80">{props.snapRotateDeg}</span>
          </div>
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={45}
            step={1}
            value={props.snapRotateDeg}
            onChange={(e) => props.setSnapRotateDeg(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/5 p-3">
        <div className="text-xs opacity-70">Current Pose</div>
        <div className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed opacity-90">
          {props.currentPoseText}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Btn onClick={props.onAddStep}>Add</Btn>
        <Btn variant="ghost" onClick={props.onUndo}>
          Undo
        </Btn>
        <Btn variant="ghost" onClick={props.onResetPose}>
          Reset
        </Btn>
        <Btn variant="danger" onClick={props.onClear}>
          Clear
        </Btn>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Btn onClick={props.onPlay}>Play</Btn>
        <Btn variant="ghost" onClick={props.onStop}>
          Stop
        </Btn>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Btn variant="ghost" onClick={props.onExport}>
          Export JSON
        </Btn>
        <Btn variant="ghost" onClick={props.onImport}>
          Import JSON
        </Btn>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium">Steps</div>

        <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">
          {props.frames.length === 0 ? (
            <div className="rounded-xl bg-white/5 p-3 text-sm opacity-70">
              No steps yet. Move/rotate/scale then click <b>Add</b>.
            </div>
          ) : (
            props.frames.map((f, i) => (
              <div
                key={f.id}
                className="rounded-xl bg-white/5 p-3 hover:bg-white/10"
              >
                <button
                  type="button"
                  onClick={() => props.onJumpTo(i)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-xs opacity-70">#{i + 1}</div>
                  </div>
                  <div className="mt-2 text-xs opacity-80">
                    pos: {f.position.map((n) => n.toFixed(2)).join(", ")}
                  </div>
                  <div className="mt-1 text-xs opacity-80">
                    scale: {f.scale.map((n) => n.toFixed(2)).join(", ")}
                  </div>
                </button>

                {/* ✅ duration editor */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-xs opacity-80">
                    Duration (s)
                    <input
                      className="mt-1 w-full rounded-lg bg-black/30 px-2 py-1 text-sm outline-none"
                      type="number"
                      min={0.05}
                      step={0.05}
                      value={f.duration}
                      onChange={(e) =>
                        props.onUpdateFrame(f.id, {
                          duration: Number(e.target.value),
                        })
                      }
                    />
                  </label>

                  {/* ✅ ease selector */}
                  <label className="text-xs opacity-80">
                    Ease
                    <select
                      className="mt-1 w-full rounded-lg bg-black/30 px-2 py-1 text-sm outline-none"
                      value={f.ease}
                      onChange={(e) =>
                        props.onUpdateFrame(f.id, { ease: e.target.value })
                      }
                    >
                      {props.eases.map((ez) => (
                        <option key={ez} value={ez}>
                          {ez}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.aside>
  );
}
