"use client";

import { useEffect, useRef } from "react";

const AMBER    = "108, 103, 92";
const CONNECT  = 130;
const COUNT    = 65;
const SPEED    = 0.3;
const MOUSE_R  = 170;
const MAX_PART = 200;
const BURST    = 7;

interface Particle { x: number; y: number; vx: number; vy: number; r: number; }
interface Ripple   { x: number; y: number; r: number; alpha: number; }

export function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let ripples:   Ripple[]   = [];
    let mouse = { x: -9999, y: -9999 };
    let raf: number;

    function resize() {
      const p = canvas!.parentElement;
      if (!p) return;
      canvas!.width  = p.offsetWidth;
      canvas!.height = p.offsetHeight;
    }

    function make() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: Math.random() * 1.2 + 0.5,
      }));
    }

    function burst(cx: number, cy: number) {
      ripples.push({ x: cx, y: cy, r: 0, alpha: 0.5 });
      const slots = Math.min(BURST, MAX_PART - particles.length);
      for (let i = 0; i < slots; i++) {
        const a = (i / BURST) * Math.PI * 2 + Math.random() * 0.5;
        const s = SPEED * (1.5 + Math.random() * 1.8);
        particles.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 1.2 + 0.5 });
      }
    }

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const d  = Math.hypot(dx, dy);
        if (d < MOUSE_R && d > 0) { p.vx += (dx / d) * 0.015; p.vy += (dy / d) * 0.015; }

        const spd = Math.hypot(p.vx, p.vy);
        if (spd > SPEED * 2.5) { p.vx = (p.vx / spd) * SPEED * 2.5; p.vy = (p.vy / spd) * SPEED * 2.5; }
        p.vx *= 0.993; p.vy *= 0.993;
        p.x  += p.vx;  p.y  += p.vy;

        if (p.x < -10) p.x = canvas!.width + 10;
        if (p.x > canvas!.width  + 10) p.x = -10;
        if (p.y < -10) p.y = canvas!.height + 10;
        if (p.y > canvas!.height + 10) p.y = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${AMBER}, 0.45)`;
        ctx!.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.hypot(dx, dy);
          if (d < CONNECT) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(${AMBER}, ${(1 - d / CONNECT) * 0.16})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        ctx!.beginPath();
        ctx!.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${AMBER}, ${rp.alpha})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
        rp.r     += 3;
        rp.alpha -= 0.022;
        if (rp.alpha <= 0) ripples.splice(i, 1);
      }

      raf = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top + (canvas!.parentElement?.scrollTop ?? 0);
    }

    function onClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest("button,input,a,label")) return;
      const r = canvas!.getBoundingClientRect();
      burst(e.clientX - r.left, e.clientY - r.top + (canvas!.parentElement?.scrollTop ?? 0));
    }

    function onResize() { resize(); make(); }

    resize(); make(); tick();

    const parent = canvas.parentElement;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    parent?.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      parent?.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full z-0" />;
}
