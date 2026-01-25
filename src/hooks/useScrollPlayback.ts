import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import * as THREE from "three";
import type { Keyframe } from "../types";

gsap.registerPlugin(ScrollTrigger);

type Args = {
  frames: Keyframe[];
  objectRef: React.MutableRefObject<THREE.Object3D | null>;
  enabled: boolean;
  container: React.RefObject<HTMLDivElement | null>;
  onPoseTick?: () => void;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function useScrollPlayback({
  frames,
  objectRef,
  enabled,
  container,
  onPoseTick,
}: Args) {
  const stRef = useRef<ScrollTrigger | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    stRef.current?.kill();
    tlRef.current?.kill();
    stRef.current = null;
    tlRef.current = null;

    if (!enabled) return;

    const el = container.current;

    if (!el || frames.length === 0) return;
    console.log("[SCROLLER STYLE]", {
      overflowY: getComputedStyle(el).overflowY,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    });
    const onScroll = () => {
      console.log("[EL SCROLL EVENT] top=", el.scrollTop);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;

    const init = () => {
      const obj = objectRef.current;
      console.log("[WAIT OBJ]", !!obj);

      if (!obj) {
        raf = requestAnimationFrame(init);
        return;
      }

      const tl = gsap.timeline({ paused: true });
      const proxy = { t: 0 };

      for (const f of frames) {
        tl.to(obj.position, {
          x: f.position[0],
          y: f.position[1],
          z: f.position[2],
          duration: f.duration,
          ease: "none",
          onUpdate: () => onPoseTick?.(),
        });

        tl.to(
          obj.scale,
          {
            x: f.scale[0],
            y: f.scale[1],
            z: f.scale[2],
            duration: f.duration,
            ease: "none",
            onUpdate: () => onPoseTick?.(),
          },
          "<",
        );

        const startQ = obj.quaternion.clone();
        const endQ = new THREE.Quaternion(
          f.quaternion[0],
          f.quaternion[1],
          f.quaternion[2],
          f.quaternion[3],
        );

        proxy.t = 0;

        tl.to(
          proxy,
          {
            t: 1,
            duration: f.duration,
            ease: "none",
            onUpdate: () => {
              obj.quaternion.copy(startQ).slerp(endQ, proxy.t);
              onPoseTick?.();
            },
          },
          "<",
        );
      }

      tlRef.current = tl;

      stRef.current = ScrollTrigger.create({
        scroller: el,
        start: 0,
        end: () => el.scrollHeight - el.clientHeight,
        scrub: 1,
        onUpdate: (self) => {
          debugger; //  الآن سيتنفّذ
          console.log("[SCROLL UPDATE]", {
            progress: self.progress,
            scrollTop: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
          });

          tl.progress(clamp01(self.progress));
          onPoseTick?.();
        },
      });

      console.log("[SCROLLTRIGGER CREATED]", { frames: frames.length });

      ScrollTrigger.refresh();
    };

    init();

    return () => {
      cancelAnimationFrame(raf);
      stRef.current?.kill();
      tlRef.current?.kill();
      stRef.current = null;
      tlRef.current = null;
      el.removeEventListener("scroll", onScroll);
    };
  }, [enabled, frames, objectRef, container, onPoseTick]);
}
