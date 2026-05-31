"use client";

import { useEffect, useRef, useState } from "react";

interface Enemy    { x: number; y: number; vx: number; vy: number; r: number; type: 0|1; hp: number; fireTimer: number; }
interface EBullet  { x: number; y: number; vx: number; vy: number; r: number; t: 0|1; }
interface PBullet  { x: number; y: number; vx: number; vy: number; angle: number; }
interface Obstacle { x: number; y: number; half: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; r: number; }
interface Ring     { x: number; y: number; r: number; a: number; }

export function BulletHell() {
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const [lives, setLives]       = useState(3);
  const [score, setScore]       = useState(0);
  const [time, setTime]         = useState(0);
  const [showRecal, setShowRecal] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let px = 0, py = 0;
    let livesV = 3, scoreV = 0, timeV = 0;
    let aimAngle = -Math.PI / 2;
    let enemies:   Enemy[]    = [];
    let eBullets:  EBullet[]  = [];
    let pBullets:  PBullet[]  = [];
    let obstacles: Obstacle[] = [];
    let particles: Particle[] = [];
    let rings:     Ring[]     = [];
    let frame = 0;
    let playerFireTimer = 0;
    let invincible = 0;
    let raf: number;

    function resize() {
      W = canvas!.offsetWidth || 800;
      H = canvas!.offsetHeight || 500;
      canvas!.width  = W;
      canvas!.height = H;
      if (!px) { px = W / 2; py = H * 0.7; }
      placeObstacles();
    }

    function placeObstacles() {
      obstacles = [
        { x: W * 0.2,  y: H * 0.35, half: 18 },
        { x: W * 0.35, y: H * 0.55, half: 14 },
        { x: W * 0.5,  y: H * 0.3,  half: 20 },
        { x: W * 0.65, y: H * 0.5,  half: 16 },
        { x: W * 0.8,  y: H * 0.38, half: 14 },
        { x: W * 0.28, y: H * 0.65, half: 12 },
        { x: W * 0.72, y: H * 0.62, half: 15 },
      ];
    }

    function spawnEnemy() {
      const side = Math.floor(Math.random() * 3);
      let ex = 0, ey = 0;
      if (side === 0)      { ex = W * 0.1 + Math.random() * W * 0.8; ey = -20; }
      else if (side === 1) { ex = -20; ey = H * 0.1 + Math.random() * H * 0.5; }
      else                 { ex = W + 20; ey = H * 0.1 + Math.random() * H * 0.5; }
      const type = (Math.random() < 0.6 ? 0 : 1) as 0|1;
      enemies.push({
        x: ex, y: ey, vx: 0, vy: 0,
        r: type === 0 ? 14 : 16,
        type, hp: type === 0 ? 2 : 4,
        fireTimer: 60 + Math.random() * 60,
      });
    }

    function isInObstacle(x: number, y: number, r: number) {
      for (const o of obstacles) {
        if (Math.abs(x - o.x) < o.half + r && Math.abs(y - o.y) < o.half + r) return true;
      }
      return false;
    }

    function fireEnemy(e: Enemy) {
      if (e.type === 0) {
        const base = Math.atan2(py - e.y, px - e.x);
        for (let i = -2; i <= 2; i++) {
          const a = base + i * 0.22;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 1.3, vy: Math.sin(a) * 1.3, r: 9, t: 0 });
        }
      } else {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, r: 11, t: 1 });
        }
      }
    }

    function drawObstacle(o: Obstacle) {
      const h = o.half, d = 7;
      ctx!.strokeStyle = "#b0aca0";
      ctx!.lineWidth = 0.8;
      // front
      ctx!.fillStyle = "#dedad0";
      ctx!.fillRect(o.x - h, o.y - h, h * 2, h * 2);
      ctx!.strokeRect(o.x - h, o.y - h, h * 2, h * 2);
      // top
      ctx!.fillStyle = "#b4b0a4";
      ctx!.beginPath();
      ctx!.moveTo(o.x - h, o.y - h);
      ctx!.lineTo(o.x - h + d, o.y - h - d);
      ctx!.lineTo(o.x + h + d, o.y - h - d);
      ctx!.lineTo(o.x + h, o.y - h);
      ctx!.closePath();
      ctx!.fill(); ctx!.stroke();
      // right
      ctx!.fillStyle = "#c8c4b8";
      ctx!.beginPath();
      ctx!.moveTo(o.x + h, o.y - h);
      ctx!.lineTo(o.x + h + d, o.y - h - d);
      ctx!.lineTo(o.x + h + d, o.y + h - d);
      ctx!.lineTo(o.x + h, o.y + h);
      ctx!.closePath();
      ctx!.fill(); ctx!.stroke();
    }

    function drawEnemy(e: Enemy) {
      ctx!.save();
      ctx!.translate(e.x, e.y);
      if (e.type === 0) {
        const ang = Math.atan2(py - e.y, px - e.x) + Math.PI * 0.5;
        ctx!.rotate(ang);
        const s = 13;
        ctx!.beginPath();
        ctx!.moveTo(0, -s);
        ctx!.lineTo(s * 0.55, s * 0.5);
        ctx!.lineTo(s * 0.2,  s * 0.2);
        ctx!.lineTo(s * 0.2,  s);
        ctx!.lineTo(-s * 0.2, s);
        ctx!.lineTo(-s * 0.2, s * 0.2);
        ctx!.lineTo(-s * 0.55, s * 0.5);
        ctx!.closePath();
        ctx!.fillStyle = "#4a4840";
        ctx!.fill();
        ctx!.strokeStyle = "#2a2820";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx!.fillStyle = "#5a5850";
        ctx!.fill();
        ctx!.strokeStyle = "#3a3830";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(0, 0, e.r * 0.6, 0, Math.PI * 2);
        ctx!.strokeStyle = "#7a7870";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }
      ctx!.restore();
      // HP bar
      const maxHp = e.type === 0 ? 2 : 4;
      ctx!.fillStyle = "rgba(200,72,72,0.3)";
      ctx!.fillRect(e.x - e.r, e.y - e.r - 6, e.r * 2, 3);
      ctx!.fillStyle = "#c84848";
      ctx!.fillRect(e.x - e.r, e.y - e.r - 6, e.r * 2 * (e.hp / maxHp), 3);
    }

    function drawPlayer() {
      ctx!.beginPath();
      ctx!.arc(px, py, 16, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(150,146,136,0.3)";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      const s = 14;
      ctx!.save();
      ctx!.translate(px, py);
      ctx!.rotate(aimAngle);
      ctx!.beginPath();
      ctx!.moveTo(0, -s);
      ctx!.lineTo(s * 0.55,  s * 0.5);
      ctx!.lineTo(s * 0.2,   s * 0.2);
      ctx!.lineTo(s * 0.2,   s);
      ctx!.lineTo(-s * 0.2,  s);
      ctx!.lineTo(-s * 0.2,  s * 0.2);
      ctx!.lineTo(-s * 0.55, s * 0.5);
      ctx!.closePath();
      const flash = invincible > 0 && Math.floor(invincible / 4) % 2 === 0;
      ctx!.fillStyle = flash ? "rgba(255,255,255,0.3)" : "#f0ece0";
      ctx!.fill();
      ctx!.strokeStyle = "#a0a090";
      ctx!.lineWidth = 1;
      ctx!.stroke();
      ctx!.restore();

      ctx!.beginPath();
      ctx!.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx!.fillStyle = "#a0a090";
      ctx!.fill();
    }

    function drawGrid() {
      const g = 28;
      ctx!.strokeStyle = "rgba(100,96,86,0.15)";
      ctx!.lineWidth = 0.5;
      for (let x = 0; x <= W; x += g) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke();
      }
      for (let y = 0; y <= H; y += g) {
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke();
      }
    }

    function spawnParticles(x: number, y: number) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 2;
        particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, r: 2 + Math.random() * 2 });
      }
    }

    function tick() {
      frame++;
      timeV += 1 / 60;
      if (frame % 60 === 0) setTime(Math.floor(timeV));

      const spawnRate = Math.max(180 - Math.floor(timeV / 10) * 10, 80);
      if (frame % spawnRate === 0 && enemies.length < 6) spawnEnemy();

      // update enemies
      for (const e of enemies) {
        const dx = px - e.x, dy = py - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 80) {
          const spd = e.type === 0 ? 0.04 : 0.025;
          e.vx += (dx / dist) * spd;
          e.vy += (dy / dist) * spd;
        }
        for (const o of obstacles) {
          const ox = e.x - o.x, oy = e.y - o.y;
          const od = Math.hypot(ox, oy);
          if (od < o.half + e.r + 10 && od > 0) {
            e.vx += (ox / od) * 0.3;
            e.vy += (oy / od) * 0.3;
          }
        }
        const spd = Math.hypot(e.vx, e.vy);
        const maxSpd = e.type === 0 ? 0.8 : 0.5;
        if (spd > maxSpd) { e.vx = (e.vx / spd) * maxSpd; e.vy = (e.vy / spd) * maxSpd; }
        e.vx *= 0.96; e.vy *= 0.96;
        e.x += e.vx; e.y += e.vy;
        e.x = Math.max(-30, Math.min(W + 30, e.x));
        e.y = Math.max(-30, Math.min(H + 30, e.y));

        e.fireTimer--;
        if (e.fireTimer <= 0) {
          fireEnemy(e);
          e.fireTimer = e.type === 0 ? 90 + Math.random() * 60 : 120 + Math.random() * 80;
        }
      }

      // player auto-fire toward nearest enemy
      playerFireTimer++;
      let nearest: Enemy | null = null;
      let nearestDist = Infinity;
      for (const e of enemies) {
        const d = Math.hypot(e.x - px, e.y - py);
        if (d < nearestDist) { nearestDist = d; nearest = e; }
      }
      if (nearest) {
        const nearestAngle = Math.atan2(nearest.y - py, nearest.x - px);
        aimAngle = nearestAngle + Math.PI * 0.5;
        if (playerFireTimer >= 20) {
          playerFireTimer = 0;
          pBullets.push({ x: px, y: py, vx: Math.cos(nearestAngle) * 6, vy: Math.sin(nearestAngle) * 6, angle: nearestAngle });
        }
      }

      // update player bullets
      pBullets = pBullets.filter(pb => {
        pb.x += pb.vx; pb.y += pb.vy;
        if (pb.x < -20 || pb.x > W + 20 || pb.y < -20 || pb.y > H + 20) return false;
        if (isInObstacle(pb.x, pb.y, 5)) return false;
        // cancel enemy bullets
        let cancelled = false;
        eBullets = eBullets.filter(eb => {
          if (cancelled) return true;
          if (Math.hypot(eb.x - pb.x, eb.y - pb.y) < eb.r + 5) {
            cancelled = true;
            rings.push({ x: eb.x, y: eb.y, r: 0, a: 0.5 });
            return false;
          }
          return true;
        });
        if (cancelled) return false;
        // hit enemies
        for (const e of enemies) {
          if (Math.hypot(e.x - pb.x, e.y - pb.y) < e.r) {
            e.hp--;
            rings.push({ x: pb.x, y: pb.y, r: 0, a: 0.4 });
            return false;
          }
        }
        return true;
      });

      // remove dead enemies
      const dead = enemies.filter(e => e.hp <= 0);
      for (const de of dead) {
        scoreV += de.type === 0 ? 100 : 250;
        rings.push({ x: de.x, y: de.y, r: 0, a: 0.7 });
        spawnParticles(de.x, de.y);
      }
      if (dead.length > 0) setScore(scoreV);
      enemies = enemies.filter(e => e.hp > 0);

      // update enemy bullets
      eBullets = eBullets.filter(eb => {
        eb.x += eb.vx; eb.y += eb.vy;
        if (eb.x < -40 || eb.x > W + 40 || eb.y < -40 || eb.y > H + 40) return false;
        if (isInObstacle(eb.x, eb.y, eb.r)) return false;
        return true;
      });

      // player hit check
      if (invincible === 0) {
        for (const eb of eBullets) {
          if (Math.hypot(eb.x - px, eb.y - py) < eb.r + 4) {
            livesV = Math.max(0, livesV - 1);
            setLives(livesV);
            invincible = 90;
            rings.push({ x: px, y: py, r: 0, a: 0.8 });
            eBullets = [];
            if (livesV <= 0) setShowRecal(true);
            break;
          }
        }
      }
      if (invincible > 0) invincible--;

      rings     = rings.filter(rg => { rg.r += 3; rg.a -= 0.025; return rg.a > 0; });
      particles = particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04; return pt.life > 0; });

      // draw
      ctx!.fillStyle = "#cac6b6";
      ctx!.fillRect(0, 0, W, H);
      drawGrid();
      for (const o of obstacles) drawObstacle(o);

      for (const eb of eBullets) {
        ctx!.beginPath();
        ctx!.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
        ctx!.fillStyle = eb.t === 0 ? "rgba(224,104,32,0.85)" : "rgba(72,56,160,0.85)";
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(eb.x, eb.y, eb.r * 0.55, 0, Math.PI * 2);
        ctx!.fillStyle = eb.t === 0 ? "rgba(255,180,100,0.6)" : "rgba(160,140,255,0.6)";
        ctx!.fill();
      }

      for (const e of enemies) drawEnemy(e);

      for (const pb of pBullets) {
        ctx!.save();
        ctx!.translate(pb.x, pb.y);
        ctx!.rotate(pb.angle);
        ctx!.fillStyle = "#f0ece0";
        ctx!.strokeStyle = "#c0bcb0";
        ctx!.lineWidth = 0.5;
        ctx!.fillRect(-2, -5, 4, 10);
        ctx!.strokeRect(-2, -5, 4, 10);
        ctx!.restore();
      }

      drawPlayer();

      for (const rg of rings) {
        ctx!.beginPath();
        ctx!.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(74,70,60,${rg.a})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      for (const pt of particles) {
        ctx!.beginPath();
        ctx!.arc(pt.x, pt.y, pt.r * pt.life, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(74,70,60,${pt.life * 0.8})`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
    }

    resize();
    tick();

    const onResize = () => resize();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const mins = Math.floor(time / 60);
  const secs = time % 60;

  return (
    <div className="relative h-full w-full" style={{ background: "#cac6b6", cursor: "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 border border-[#8a8575]/40 bg-[#26211a]/80 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#c8a84b]">HULL</span>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`font-mono text-xs ${i < lives ? "text-[#c8a84b]" : "text-[#4a4535]"}`}>◆</span>
          ))}
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 border border-[#8a8575]/40 bg-[#26211a]/80 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#c8a84b]">
          {String(score).padStart(6, "0")}
        </span>
      </div>

      <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 border border-[#8a8575]/40 bg-[#26211a]/80 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#c8a84b]">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>

      {showRecal && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#cac6b6]/80">
          <div className="border border-[#4a4535] bg-[#26211a] px-8 py-6 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c84848]">■ RECALIBRATING</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#7a7560]">NEURAL LINK SEVERED</p>
          </div>
        </div>
      )}
    </div>
  );
}
