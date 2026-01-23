import Gold from "@assets/media/Gold.png";
import KfhViewer from "@components/KfhViewer";

const SECTIONS = 10;

const SECTION_VH = 110;

export default function App() {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Background image */}
      <div className="fixed inset-0 z-0">
        <img
          src={Gold}
          className="absolute inset-0 h-full w-full object-cover"
          alt=""
        />
      </div>

      {/* Fullscreen canvas area */}
      <div
        className="fixed inset-0 z-10"
        style={{
          height: "100svh",
        }}
      >
        <KfhViewer sections={SECTIONS} />
      </div>

      {/* Scroll space to drive animation */}
      <div
        className="relative z-0"
        style={{
          height: `${SECTIONS * SECTION_VH}vh`,
        }}
      />
    </div>
  );
}
