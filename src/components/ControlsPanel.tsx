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

  scrub: number;
  onScrub: (p: number) => void;

  onDeleteStep: (id: string) => void;

  onSnapToNearest: () => void;
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
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function computeMarkers(frames: { duration: number }[]) {
  const total = frames.reduce((s, f) => s + (Number(f.duration) || 0), 0) || 0;
  let acc = 0;

  // marker at the start of each step
  const markers = frames.map((f) => {
    const t = acc; // seconds from start
    acc += Number(f.duration) || 0;
    const p = total > 0 ? t / total : 0; // 0..1
    return { t, p };
  });

  // optional: add end marker at 100%
  return { total, markers };
}

function findNearestMarker(markers: { p: number }[], progress: number) {
  if (!markers.length) return null;
  let best = markers[0];
  let bestD = Math.abs(progress - markers[0].p);
  for (let i = 1; i < markers.length; i++) {
    const d = Math.abs(progress - markers[i].p);
    if (d < bestD) {
      bestD = d;
      best = markers[i];
    }
  }
  return { marker: best, dist: bestD };
}

export default function ControlsPanel(props: Props) {
  const { total, markers } = computeMarkers(props.frames);
  const snapThreshold = 0.012; // ✅ قرب ~1.2% من طول التايملاين = Snap (عدلها حسب رغبتك)

  // for label (sec)
  const curSec = total > 0 ? props.scrub * total : 0;
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

      <div className="mt-3 rounded-xl bg-white/5 p-3">
        <div className="flex items-center justify-between text-sm">
          <span>Timeline</span>
          <span className="opacity-80">
            {Math.round(props.scrub * 100)}% • {curSec.toFixed(2)}s
            {total > 0 ? ` / ${total.toFixed(2)}s` : ""}
          </span>
        </div>

        <div className="relative mt-2">
          {/* ✅ Range */}
          <input
            className="w-full"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={props.scrub}
            onChange={(e) => {
              const v = clamp01(Number(e.target.value));
              // ✅ snap automatically if close to marker
              const near = findNearestMarker(markers, v);
              if (near && near.dist <= snapThreshold) {
                props.onScrub(near.marker.p);
              } else {
                props.onScrub(v);
              }
            }}
          />

          {/* ✅ Markers overlay */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0">
            {markers.map((m, idx) => (
              <div
                key={idx}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${m.p * 100}%` }}
              >
                <div className="h-2 w-2 rounded-full bg-white/70 shadow" />
                {/* tooltip time */}
                <div className="mt-2 whitespace-nowrap text-[10px] opacity-70">
                  {m.t.toFixed(1)}s
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-blue-500 hover:bg-white/90"
            onClick={props.onSnapToNearest}
            disabled={!markers.length}
            title="Snap to the nearest step marker"
          >
            Snap to nearest
          </button>

          <button
            type="button"
            className="rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            onClick={() => props.onScrub(0)}
            disabled={props.scrub === 0}
          >
            Start
          </button>

          <button
            type="button"
            className="rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            onClick={() => props.onScrub(1)}
            disabled={!markers.length}
          >
            End
          </button>
        </div>
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{f.label}</div>

                    <div className="flex items-center gap-2">
                      <div className="text-xs opacity-70">#{i + 1}</div>
                      <button
                        type="button"
                        className="rounded-lg bg-red-600/80 px-2 py-1 text-xs hover:bg-red-600"
                        onClick={() => props.onDeleteStep(f.id)}
                        title="Delete step"
                      >
                        Delete
                      </button>
                    </div>
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
