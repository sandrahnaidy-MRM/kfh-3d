import KfhViewer from "./Components/KfhViewer";
import Gold from "@assets/media/Gold.png";
import Navigation from "./Components/Navigation";

const NAV_H = 176;

export default function App() {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Background image */}
      <div className="fixed inset-0 z-0">
        <div className="relative h-full w-full overflow-hidden">
          <img
            src={Gold}
            className="absolute inset-0 h-full w-full object-cover"
            alt=""
          />
        </div>
      </div>

      {/* Nav */}
      <div className="relative z-20">
        <Navigation />
      </div>

      {/* Fullscreen canvas area except nav */}
      <div
        className="fixed left-0 right-0 z-10"
        style={{ top: NAV_H, height: `calc(100vh - ${NAV_H}px)` }}
      >
        <KfhViewer navH={NAV_H} />
      </div>

      {/* Scroll space to drive the animation (2 screens) */}
      <div className="relative z-0" style={{ height: "220vh" }} />
    </div>
  );
}
