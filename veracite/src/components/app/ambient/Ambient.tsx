"use client";

import { useEffect, useRef } from "react";
import { rosette } from "./rosette";

const LARGE = [...rosette(330, 46, 12, 7), ...rosette(228, 34, 18, 6), ...rosette(146, 26, 9, 5)];

const Engraving = ({ className }: { className: string }) => (
  <svg className={className} viewBox="-400 -400 800 800">
    {LARGE.map((d, i) => <path key={i} d={d} />)}
  </svg>
);

/**
 * The paper behind every app page: slow engraved rosettes, soft security tints and a UV torch glow that follows
 * the pointer. It also tells the card under the pointer, and the page banner, where the pointer is.
 * Purely decorative. Positions go straight to CSS variables, so nothing re-renders while the mouse moves.
 */
export default function Ambient() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" || frame) return;
      const { clientX: x, clientY: y, target } = e;
      frame = requestAnimationFrame(() => {
        frame = 0;
        layer.style.setProperty("--px", `${x}px`);
        layer.style.setProperty("--py", `${y}px`);
        const banner = layer.parentElement?.querySelector<HTMLElement>(".vx-banner");
        banner?.style.setProperty("--tx", ((x / window.innerWidth) * 2 - 1).toFixed(3));
        banner?.style.setProperty("--ty", ((y / window.innerHeight) * 2 - 1).toFixed(3));
        const card = target instanceof Element ? target.closest<HTMLElement>(".vx-card") : null;
        if (!card) return;
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${x - box.left}px`);
        card.style.setProperty("--my", `${y - box.top}px`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div ref={ref} className="vx-ambient" aria-hidden>
      <Engraving className="vx-engraving one" />
      <Engraving className="vx-engraving two" />
      <i className="vx-torch" />
    </div>
  );
}
