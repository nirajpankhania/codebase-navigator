"use client";

import { useEffect, useRef } from "react";

const VIOLET = "139, 92, 246";
const CONNECT = 140;
const COUNT = 72;
const SPEED = 0.35;
const MOUSE_R = 180;
const MAX_PARTICLES = 220;
const BURST_COUNT = 8;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let ripples: Ripple[] = [];
    let mouse = { x: -9999, y: -9999 };
    let rafId: number;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      canvas!.width = parent.offsetWidth;
      canvas!.height = parent.offsetHeight;
    }

    function makeParticles() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: Math.random() * 1.4 + 0.6,
      }));
    }

    function spawnBurst(cx: number, cy: number) {
      ripples.push({ x: cx, y: cy, r: 0, alpha: 0.6 });
      const slots = Math.min(BURST_COUNT, MAX_PARTICLES - particles.length);
      for (let i = 0; i < slots; i++) {
        const angle = (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.5;
        const speed = SPEED * (1.5 + Math.random() * 2);
        particles.push({
          x: cx + (Math.random() - 0.5) * 8,
          y: cy + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: Math.random() * 1.4 + 0.6,
        });
      }
    }

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_R && dist > 0) {
          p.vx += (dx / dist) * 0.018;
          p.vy += (dy / dist) * 0.018;
        }

        const spd = Math.hypot(p.vx, p.vy);
        if (spd > SPEED * 2.5) {
          p.vx = (p.vx / spd) * SPEED * 2.5;
          p.vy = (p.vy / spd) * SPEED * 2.5;
        }
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = canvas!.width + 10;
        if (p.x > canvas!.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas!.height + 10;
        if (p.y > canvas!.height + 10) p.y = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${VIOLET}, 0.55)`;
        ctx!.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECT) {
            const alpha = (1 - dist / CONNECT) * 0.22;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(${VIOLET}, ${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        ctx!.beginPath();
        ctx!.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${VIOLET}, ${rp.alpha})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
        rp.r += 3;
        rp.alpha -= 0.025;
        if (rp.alpha <= 0) ripples.splice(i, 1);
      }

      rafId = requestAnimationFrame(tick);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top + (canvas!.parentElement?.scrollTop ?? 0);
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("button, input, a, label")) return;
      const rect = canvas!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top + (canvas!.parentElement?.scrollTop ?? 0);
      spawnBurst(cx, cy);
    }

    function onResize() {
      resize();
      makeParticles();
    }

    resize();
    makeParticles();
    tick();

    const parent = canvas.parentElement;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    parent?.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      parent?.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
