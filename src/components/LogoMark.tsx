"use client";

import { useEffect, useState } from "react";
import { HOLD, shapes } from "@/components/AnimatedFavicon";

// The tab icon's shapes (blue triangle, green square, gold circle) in front of the name, cutting from one
// to the next on the same beat as the tab. Reduced motion keeps the first shape still. It is decoration:
// the name beside it says everything. It is the height of the capitals (Archivo: 0.686em) and sits on the
// baseline, so it is centred on the words.
const clip = ["polygon(50% 0, 100% 100%, 0 100%)", "none", "circle(50%)"];

export function LogoMark() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % shapes.length), HOLD);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      aria-hidden
      className="mr-[0.35em] inline-block h-[0.686em] w-[0.686em] align-baseline"
      style={{ background: shapes[i].color, clipPath: clip[i] }}
    />
  );
}
