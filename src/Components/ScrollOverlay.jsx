import React, { useMemo } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function getIndex(p, sections) {
  const x = clamp(p, 0, 1) * (sections - 1);
  return Math.round(x);
}

export default function ScrollOverlay({ scrollYProgress, sections = 10 }) {
  const titles = useMemo(
    () =>
      Array.from({ length: sections }).map((_, i) => ({
        title: `Section ${i + 1}`,
        subtitle: `Scroll to explore changes`,
      })),
    [sections],
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.02, 0.98, 1],
    [0, 1, 1, 0],
  );

  // نص ديناميكي (بدون state كثير)
  const titleY = useTransform(scrollYProgress, [0, 1], ["0px", "20px"]);

  // نستخدم MotionValueEvent لتحديث index بسيط
  const [active, setActive] = React.useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = getIndex(p, sections);
    setActive(idx);
  });

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
    >
      {/* Right dots indicator */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {Array.from({ length: sections }).map((_, i) => (
          <div
            key={i}
            className={[
              "h-2 w-2 rounded-full transition-all",
              i === active ? "bg-white/90 scale-125" : "bg-white/30",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="text-white/80 text-sm">Scroll</div>
        <div className="h-6 w-[2px] bg-white/50 rounded" />
        <motion.div
          className="h-3 w-3 rounded-full border border-white/60"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Title block */}
      <motion.div
        className="absolute left-8 top-16 max-w-[520px]"
        style={{ y: titleY }}
      >
        <div className="text-white/90 text-3xl font-semibold">
          {titles[active]?.title}
        </div>
        <div className="mt-2 text-white/70 leading-relaxed">
          {titles[active]?.subtitle}
        </div>

        {/* tiny progress */}
        <div className="mt-4 h-[2px] w-48 bg-white/15 rounded">
          <motion.div
            className="h-full bg-white/70 rounded"
            style={{
              width: `${((active + 1) / sections) * 100}%`,
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
