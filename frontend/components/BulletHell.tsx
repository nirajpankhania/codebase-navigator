"use client";

import { useEffect, useRef, useState } from "react";

interface Enemy    { x: number; y: number; vx: number; vy: number; r: number; type: 0|1; hp: number; fireTimer: number; }
interface EBullet  { x: number; y: number; vx: number; vy: number; r: number; t: 0|1; }
interface PBullet  { x: number; y: number; vx: number; vy: number; angle: number; }
interface Obstacle { x: number; y: number; half: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; r: number; col: string; }
interface Ring     { x: number; y: number; r: number; a: number; sp: number; }

export function BulletHell() {
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const [lives, setLives]       = useState(3);
  const [score, setScore]       = useState(0);
  const [kills, setKills]       = useState(0);
  const [time,  setTime]        = useState(0);
  const [showRecal, setShowRecal] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let mx = 0, my = 0;
    let livesV = 3, scoreV = 0, killsV = 0, timeV = 0;
    let enemies:   Enemy[]    = [];
    let eBullets:  EBullet[]  = [];
    let pBullets:  PBullet[]  = [];
    let obstacles: Obstacle[] = [];
    let parts:     Particle[] = [];
    let rings:     Ring[]     = [];
    let aimAngle = -Math.PI / 2;
    let frame = 0;
    let playerFireTimer = 0;
    let hitFlash = 0;
    let invincible = 0;
    let raf: number;

    function h2r(hex: string, a: number) {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    }

    function resize() {
      W = canvas!.offsetWidth || 800;
      H = canvas!.offsetHeight || 500;
      canvas!.width  = W;
      canvas!.height = H;
      if (!mx) { mx = W / 2; my = H / 2; }
      placeObstacles();
    }

    function placeObstacles() {
      const spots: [number, number][] = [
        [0.18, 0.22], [0.76, 0.18], [0.14, 0.67],
        [0.82, 0.72], [0.46, 0.16], [0.54, 0.82], [0.88, 0.44],
      ];
      obstacles = spots.map(([fx, fy]) => ({
        x: W * fx, y: H * fy, half: 18 + Math.random() * 8,
      }));
    }

    function spawnEnemy() {
      const edge = Math.floor(Math.random() * 4);
      let ex = 0, ey = 0;
      if (edge === 0)      { ex = Math.random() * W; ey = -30; }
      else if (edge === 1) { ex = W + 30; ey = Math.random() * H; }
      else if (edge === 2) { ex = Math.random() * W; ey = H + 30; }
      else                 { ex = -30; ey = Math.random() * H; }
      const type = (Math.floor(Math.random() * 2)) as 0|1;
      enemies.push({
        x: ex, y: ey, vx: 0, vy: 0,
        r: type === 0 ? 13 : 18,
        type, hp: type === 0 ? 2 : 4,
        fireTimer: 90 + Math.floor(Math.random() * 80),
      });
    }

    function isInObstacle(x: number, y: number, r: number) {
      for (const o of obstacles) {
        if (x + r > o.x - o.half && x - r < o.x + o.half &&
            y + r > o.y - o.half && y - r < o.y + o.half) return true;
      }
      return false;
    }

    function fireEnemy(e: Enemy) {
      const base = Math.atan2(my - e.y, mx - e.x);
      if (e.type === 0) {
        for (let i = -2; i <= 2; i++) {
          const a = base + i * 0.26, sp = 1.5 + Math.abs(i) * 0.07;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 7, t: 0 });
        }
      } else {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.4, r: 5.5, t: 1 });
        }
      }
    }

    function drawObstacle(o: Obstacle) {
      const h = o.half, off = h * 0.38;
      // front face
      ctx!.fillStyle = "#dedad0";
      ctx!.fillRect(o.x - h, o.y - h, h * 2, h * 2);
      // top face
      ctx!.fillStyle = "#b4b0a4";
      ctx!.beginPath();
      ctx!.moveTo(o.x - h,     o.y - h);
      ctx!.lineTo(o.x - h + off, o.y - h - off);
      ctx!.lineTo(o.x + h + off, o.y - h - off);
      ctx!.lineTo(o.x + h,     o.y - h);
      ctx!.closePath();
      ctx!.fill();
      // right face
      ctx!.fillStyle = "#c8c4b8";
      ctx!.beginPath();
      ctx!.moveTo(o.x + h,     o.y - h);
      ctx!.lineTo(o.x + h + off, o.y - h - off);
      ctx!.lineTo(o.x + h + off, o.y + h - off);
      ctx!.lineTo(o.x + h,     o.y + h);
      ctx!.closePath();
      ctx!.fill();
    }

    function drawEnemy(e: Enemy) {
      ctx!.save();
      ctx!.translate(e.x, e.y);
      if (e.type === 0) {
        const ang = Math.atan2(my - e.y, mx - e.x) + Math.PI * 0.5;
        ctx!.rotate(ang);
        const r = e.r;
        ctx!.beginPath();
        ctx!.moveTo(0, -r);
        ctx!.lineTo(r * 0.62, r * 0.48);
        ctx!.lineTo(0, r * 0.08);
        ctx!.lineTo(-r * 0.62, r * 0.48);
        ctx!.closePath();
        ctx!.fillStyle = "rgba(68,64,58,0.88)";
        ctx!.fill();
        if (e.hp < 2) {
          ctx!.strokeStyle = "rgba(200,55,55,0.7)";
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
        }
      } else {
        const dmgFrac = (4 - e.hp) / 4;
        ctx!.beginPath();
        ctx!.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(90,86,78,${0.75 - dmgFrac * 0.25})`;
        ctx!.fill();
        // specular highlight
        ctx!.beginPath();
        ctx!.arc(-e.r * 0.22, -e.r * 0.22, e.r * 0.32, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(148,144,134,0.35)";
        ctx!.fill();
        if (dmgFrac > 0) {
          ctx!.strokeStyle = `rgba(200,55,55,${dmgFrac * 0.7})`;
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
        }
      }
      ctx!.restore();
    }

    function drawPlayer() {
      // Hitbox ring
      ctx!.beginPath();
      ctx!.arc(mx, my, 16, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(130,126,116,0.45)";
      ctx!.lineWidth = 1;
      ctx!.stroke();
      // Arrow shape — rotates to face nearest enemy
      const ps = 12;
      ctx!.save();
      ctx!.translate(mx, my);
      ctx!.rotate(aimAngle);
      ctx!.beginPath();
      ctx!.moveTo(0, -ps);
      ctx!.lineTo(ps * 0.6,  ps * 0.5);
      ctx!.lineTo(0,         ps * 0.12);
      ctx!.lineTo(-ps * 0.6, ps * 0.5);
      ctx!.closePath();
      const flash = invincible > 0 && Math.floor(invincible / 4) % 2 === 0;
      ctx!.fillStyle = flash ? "rgba(255,100,100,0.5)" : "rgba(255,252,248,0.95)";
      ctx!.fill();
      ctx!.strokeStyle = "rgba(180,176,168,0.4)";
      ctx!.lineWidth = 0.6;
      ctx!.stroke();
      ctx!.restore();
    }

    function killEnemy(e: Enemy, idx: number) {
      enemies.splice(idx, 1);
      killsV++;
      scoreV += 100;
      setScore(scoreV);
      setKills(killsV);
      rings.push({ x: e.x, y: e.y, r: 0, a: 0.65, sp: 2.8 });
      const col = e.type === 0 ? "#888078" : "#9c9890";
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
        const sp = 1.2 + Math.random() * 2.5;
        parts.push({ x: e.x, y: e.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, r: 2 + Math.random() * 2, col });
      }
    }

    function onHit() {
      livesV--;
      setLives(livesV);
      hitFlash = 22;
      invincible = 90;
      eBullets = [];
      if (livesV <= 0) {
        livesV = 3; scoreV = 0; killsV = 0;
        setLives(livesV); setScore(scoreV); setKills(killsV);
        setShowRecal(true);
        setTimeout(() => setShowRecal(false), 1400);
      }
    }

    function tick() {
      frame++;
      if (frame % 60 === 0) { timeV++; scoreV += 5; setScore(scoreV); setTime(timeV); }
      if (frame % 110 === 0 && enemies.length < 8) spawnEnemy();

      ctx!.clearRect(0, 0, W, H);

      // Grid
      ctx!.strokeStyle = "rgba(100,96,86,0.07)";
      ctx!.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke(); }

      // Obstacles
      for (const o of obstacles) drawObstacle(o);

      // Update + draw enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const cx = W * 0.5, cy = H * 0.5;
        const dx = cx - e.x, dy = cy - e.y, d = Math.max(Math.hypot(dx, dy), 1);
        const targetD = Math.min(W, H) * 0.3;
        if (d > targetD) { e.vx += (dx / d) * 0.055; e.vy += (dy / d) * 0.055; }
        else { const tx = -dy/d, ty = dx/d; e.vx += tx * 0.03; e.vy += ty * 0.03; }
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > 1.4) { e.vx = (e.vx / sp) * 1.4; e.vy = (e.vy / sp) * 1.4; }
        e.vx *= 0.94; e.vy *= 0.94;
        e.x += e.vx; e.y += e.vy;
        for (const o of obstacles) {
          const odx = e.x - o.x, ody = e.y - o.y, od = Math.hypot(odx, ody);
          if (od < o.half + e.r + 4 && od > 0) { e.vx += (odx/od) * 0.12; e.vy += (ody/od) * 0.12; }
        }
        e.fireTimer--;
        if (e.fireTimer <= 0) { e.fireTimer = 90 + Math.floor(Math.random() * 60); fireEnemy(e); }
        drawEnemy(e);
      }

      // Enemy bullets
      for (let i = eBullets.length - 1; i >= 0; i--) {
        const b = eBullets[i];
        b.x += b.vx; b.y += b.vy;
        if (b.x < -20 || b.x > W+20 || b.y < -20 || b.y > H+20) { eBullets.splice(i,1); continue; }
        if (isInObstacle(b.x, b.y, b.r)) { eBullets.splice(i,1); continue; }
        ctx!.beginPath(); ctx!.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx!.fillStyle = h2r(b.t === 0 ? "#e06820" : "#4838a0", 0.88); ctx!.fill();
        ctx!.beginPath(); ctx!.arc(b.x, b.y, b.r * 0.45, 0, Math.PI*2);
        ctx!.fillStyle = "rgba(255,255,255,0.42)"; ctx!.fill();
        if (invincible === 0 && Math.hypot(b.x - mx, b.y - my) < b.r + 4) {
          eBullets.splice(i, 1); onHit(); continue;
        }
      }

      // Player auto-fire
      playerFireTimer++;
      if (playerFireTimer >= 20 && enemies.length > 0) {
        playerFireTimer = 0;
        let nearest: Enemy | null = null, minD = Infinity;
        for (const e of enemies) { const d = Math.hypot(e.x-mx, e.y-my); if (d < minD) { minD = d; nearest = e; } }
        if (nearest) {
          const a = Math.atan2(nearest.y - my, nearest.x - mx);
          aimAngle = a + Math.PI * 0.5;
          pBullets.push({ x: mx, y: my, vx: Math.cos(a) * 4.5, vy: Math.sin(a) * 4.5, angle: a });
        }
      }

      // Player bullets
      for (let i = pBullets.length - 1; i >= 0; i--) {
        const b = pBullets[i];
        b.x += b.vx; b.y += b.vy;
        if (b.x < -10 || b.x > W+10 || b.y < -10 || b.y > H+10) { pBullets.splice(i,1); continue; }
        if (isInObstacle(b.x, b.y, 4)) { pBullets.splice(i,1); continue; }
        // Cancel enemy bullets
        let cancelled = false;
        for (let j = eBullets.length - 1; j >= 0; j--) {
          if (Math.hypot(b.x - eBullets[j].x, b.y - eBullets[j].y) < eBullets[j].r + 4) {
            eBullets.splice(j, 1); pBullets.splice(i, 1); cancelled = true; break;
          }
        }
        if (cancelled) continue;
        // Hit enemies
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
          if (Math.hypot(b.x - enemies[j].x, b.y - enemies[j].y) < enemies[j].r + 4) {
            enemies[j].hp--;
            if (enemies[j].hp <= 0) killEnemy(enemies[j], j);
            pBullets.splice(i, 1); hit = true; break;
          }
        }
        if (hit) continue;
        // Draw rectangle
        ctx!.save();
        ctx!.translate(b.x, b.y);
        ctx!.rotate(b.angle + Math.PI * 0.5);
        ctx!.fillStyle = "rgba(255,252,244,0.92)";
        ctx!.fillRect(-2, -5, 4, 10);
        ctx!.restore();
      }

      // Particles
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.91; p.vy *= 0.91; p.life -= 0.03;
        if (p.life <= 0) { parts.splice(i,1); continue; }
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
        ctx!.fillStyle = h2r(p.col, p.life * 0.8); ctx!.fill();
      }

      // Rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const s = rings[i];
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx!.strokeStyle = `rgba(120,115,105,${s.a})`; ctx!.lineWidth = 1.5; ctx!.stroke();
        s.r += s.sp; s.a -= 0.022;
        if (s.a <= 0) rings.splice(i, 1);
      }

      drawPlayer();

      // Hit flash overlay (handled via CSS on the div wrapper)
      if (hitFlash > 0) hitFlash--;

      raf = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }

    resize();
    tick();

    const onResize = () => { resize(); };
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative h-full w-full" style={{ background: "#cac6b6", cursor: "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Score — top left */}
      <div className="absolute left-5 top-5 z-10 border border-[#c8a84b]/30 bg-[#14120e]/90 px-3.5 py-2.5 backdrop-blur-sm">
        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#c8a84b]/40">SCAN SCORE</div>
        <div className="font-mono text-xl leading-none tracking-[0.1em] text-[#c8a84b]">{score}</div>
        <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#c8a84b]/35">
          NODES: {kills} · TIME: {time}s
        </div>
      </div>

      {/* Lives — top right */}
      <div className="absolute right-5 top-5 z-10 border border-[#c8a84b]/30 bg-[#14120e]/90 px-3.5 py-2.5 text-right backdrop-blur-sm">
        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#c8a84b]/40">INTEGRITY</div>
        <div className="mt-1 flex justify-end gap-2">
          {[1, 2, 3].map(i => (
            <span key={i} className={`text-base ${i <= lives ? "text-[#c8a84b]" : "text-[#c8a84b]/20"}`}>◆</span>
          ))}
        </div>
      </div>

      {showRecal && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 font-mono text-2xl uppercase tracking-[0.22em] text-[#c84848]">
          ◆ RECALIBRATING ◆
        </div>
      )}
    </div>
  );
}
