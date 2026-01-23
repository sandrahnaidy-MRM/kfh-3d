import { motion, useScroll, useTransform } from "framer-motion";
import Gold from "@assets/media/Gold.png";
import KfhViewer from "@components/KfhViewer";
export default function App() {
  const { scrollYProgress } = useScroll();

  // parallax بسيط للخلفية
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div className="relative min-h-screen bg-zinc-950">
      <div className="fixed inset-0 z-0">
        <motion.img
          src={Gold}
          className="absolute inset-0 h-full w-full object-cover"
          alt=""
          style={{ y: bgY, scale: bgScale }}
        />
        {/* طبقة تعطي depth */}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="fixed inset-0 z-10" style={{ height: "100svh" }}>
        <KfhViewer sections={10} />
      </div>

      <div className="relative z-0" style={{ height: `${10 * 110}vh` }} />
    </div>
  );
}
