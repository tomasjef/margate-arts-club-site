"use client";

import { useEffect } from "react";

// The tab icon: a coloured shape (blue triangle, green square, gold circle) that cuts, with no transition and no rotation, from triangle to square to
// circle and round again, each filling the whole icon. Browsers do not animate SVG icons, so each shape is
// drawn on a canvas and set as the icon's image. The static icon.svg (a triangle) stays as the first paint,
// with scripts off, and for people who ask for reduced motion.
const SIZE = 64;
export const HOLD = 1000; // ms each shape stays before the cut to the next (the header mark keeps the same beat)

export const shapes: { color: string; draw: (ctx: CanvasRenderingContext2D) => void }[] = [
  // triangle, point at the top and base along the bottom
  {
    color: "#2230a0",
    draw: (ctx) => {
      ctx.moveTo(SIZE / 2, 0);
      ctx.lineTo(SIZE, SIZE);
      ctx.lineTo(0, SIZE);
      ctx.closePath();
    },
  },
  // square
  { color: "#00a35c", draw: (ctx) => ctx.rect(0, 0, SIZE, SIZE) },
  // circle
  { color: "#c9ad4e", draw: (ctx) => ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, 2 * Math.PI) },
];

export function AnimatedFavicon() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // one image per shape, made once
    const images = shapes.map(({ color, draw }) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = color;
      ctx.beginPath();
      draw(ctx);
      ctx.fill();
      return canvas.toDataURL("image/png");
    });

    const show = (href: string) => {
      let links = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]');
      if (links.length === 0) {
        const link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
        links = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]');
      }
      links.forEach((link) => {
        link.type = "image/png";
        link.removeAttribute("sizes");
        link.href = href;
      });
    };

    let i = 0;
    show(images[i]);
    const id = window.setInterval(() => {
      i = (i + 1) % images.length;
      show(images[i]);
    }, HOLD);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
