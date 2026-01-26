import React, { useRef } from "react";
import KfhViewer from "./Components/KfhViewer";
import Gold from "@assets/media/Gold.png";

export default function App() {
  const scrollTargetRef = useRef(null);

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

      {/* Fixed viewer */}
      <div
        className="fixed left-0 right-0 z-10"
        style={{ top: 0, height: `calc(100vh - ${0}px)` }}
      >
        <KfhViewer navH={0} scrollTargetRef={scrollTargetRef} />
      </div>

      {/* Scroll space drives animation */}
      <div
        ref={scrollTargetRef}
        className="relative z-0"
        style={{ height: "900vh" }}
      >
        <div className="h-screen bg-white/5" />
        <div className="h-screen bg-white/15" />
        <div className="h-screen bg-white/20" />
        <div className="h-screen bg-white/5" />
        <div className="h-screen bg-white/15" />
        <div className="h-screen bg-white/20" />
        <div className="h-screen bg-white/5" />
        <div className="h-screen bg-white/15" />
        <div className="h-screen bg-white/20" />
      </div>
    </div>
  );
}
