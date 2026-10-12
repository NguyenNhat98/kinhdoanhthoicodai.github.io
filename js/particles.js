/* ============================================================================
   CANVAS PARTICLE ENGINE: hoa đào / đom đóm / lá liễu + mưa / bụi mực / đèn trời,
   đồng xu nảy, pháo hoa thăng cấp, lấp lánh. Tự tạm dừng khi ẩn tab (tiết kiệm pin).
   ========================================================================== */
(function () {
  'use strict';
  const rnd = (a, b) => a + Math.random() * (b - a);
  class VFX {
    constructor(canvas) {
      this.cv = canvas; this.ctx = canvas.getContext('2d');
      this.amb = []; this.coins = []; this.sparks = []; this.rain = [];
      this.theme = 'thanhphong'; this.running = false; this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.low = (navigator.hardwareConcurrency || 4) <= 4;
      this.resize(); window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.running = false; else this.start(); });
      this.setTheme('thanhphong'); this.start();
    }
    resize() {
      this.w = window.innerWidth; this.h = window.innerHeight;
      this.cv.width = this.w * this.dpr; this.cv.height = this.h * this.dpr;
      this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    setTheme(id) {
      this.theme = id; this.amb = []; this.rain = [];
      const n = this.low ? 18 : 30;
      for (let i = 0; i < n; i++) this.amb.push(this.newAmb(true));
      if (id === 'giangnam') for (let i = 0; i < (this.low ? 30 : 55); i++) this.rain.push({ x: rnd(0, this.w), y: rnd(0, this.h), l: rnd(10, 22), v: rnd(9, 14) });
    }
    newAmb(init) {
      const t = this.theme, x = rnd(0, this.w), y = init ? rnd(0, this.h) : null;
      if (t === 'thanhphong') return { k: 'petal', x, y: init ? y : -20, s: rnd(6, 13), vx: rnd(-0.4, 1.1), vy: rnd(0.7, 1.6), r: rnd(0, 360), vr: rnd(-1.2, 1.2), a: rnd(0.35, 0.85), ph: rnd(0, 6) };
      if (t === 'daituong') return { k: 'fly', x, y: init ? y : this.h + 10, s: rnd(1.6, 3.4), vx: rnd(-0.3, 0.3), vy: -rnd(0.3, 0.9), a: rnd(0.4, 1), ph: rnd(0, 6) };
      if (t === 'giangnam') return { k: 'leaf', x, y: init ? y : -20, s: rnd(9, 16), vx: rnd(-0.3, 0.7), vy: rnd(0.6, 1.3), r: rnd(0, 360), vr: rnd(-1, 1), a: rnd(0.4, 0.8), ph: rnd(0, 6) };
      if (t === 'thuymac') return { k: 'ink', x, y: init ? y : -10, s: rnd(1.5, 3.5), vx: rnd(-0.2, 0.2), vy: rnd(0.2, 0.6), a: rnd(0.12, 0.35), ph: rnd(0, 6) };
      return { k: 'lan', x, y: init ? y : this.h + 20, s: rnd(9, 17), vx: rnd(-0.2, 0.2), vy: -rnd(0.35, 0.9), a: rnd(0.55, 1), ph: rnd(0, 6) };
    }
    start() { if (this.running) return; this.running = true; this.last = performance.now(); requestAnimationFrame((t) => this.loop(t)); }

    /* ------------ hạt trang trí theo theme ------------ */
    drawAmb(p, t) {
      const c = this.ctx;
      c.save(); c.globalAlpha = p.a; c.translate(p.x, p.y);
      if (p.k === 'petal') {
        c.rotate(p.r * Math.PI / 180); c.fillStyle = '#ffb7c5'; const s = p.s;
        c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-s / 2, -s / 2, -s, s / 2, 0, s); c.bezierCurveTo(s, s / 2, s / 2, -s / 2, 0, 0); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(0, s * 0.2, s * 0.12, 0, 6.3); c.fill();
      } else if (p.k === 'fly') {
        const g = 0.5 + 0.5 * Math.sin(t / 400 + p.ph); c.globalAlpha = p.a * g;
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, p.s * 4); gr.addColorStop(0, '#fff6b0'); gr.addColorStop(0.4, 'rgba(255,200,80,.6)'); gr.addColorStop(1, 'rgba(255,160,40,0)');
        c.fillStyle = gr; c.beginPath(); c.arc(0, 0, p.s * 4, 0, 6.3); c.fill();
      } else if (p.k === 'leaf') {
        c.rotate(p.r * Math.PI / 180); c.fillStyle = '#8bc29a'; const s = p.s;
        c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.45, -s * 0.2, 0, s); c.quadraticCurveTo(-s * 0.45, -s * 0.2, 0, -s); c.fill();
        c.strokeStyle = 'rgba(40,90,60,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -s); c.lineTo(0, s); c.stroke();
      } else if (p.k === 'ink') {
        c.fillStyle = '#2b2b2b'; c.beginPath(); c.arc(0, 0, p.s, 0, 6.3); c.fill();
      } else { // đèn trời
        const g = 0.75 + 0.25 * Math.sin(t / 300 + p.ph), s = p.s;
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, s * 2.4); gr.addColorStop(0, 'rgba(255,190,90,' + 0.6 * g + ')'); gr.addColorStop(1, 'rgba(255,140,40,0)');
        c.fillStyle = gr; c.beginPath(); c.arc(0, 0, s * 2.4, 0, 6.3); c.fill();
        c.fillStyle = '#ffb347'; c.strokeStyle = '#c8622a'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(-s * 0.55, -s * 0.5); c.lineTo(s * 0.55, -s * 0.5); c.lineTo(s * 0.7, s * 0.55); c.lineTo(-s * 0.7, s * 0.55); c.closePath(); c.fill(); c.stroke();
      }
      c.restore();
    }

    /* ------------ API hiệu ứng tương tác ------------ */
    spawnCoins(x, y, n = 5) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI - Math.PI / 2 - Math.PI / 2, sp = rnd(4, 9);
        this.coins.push({ x, y, vx: Math.cos(ang) * sp * 0.6, vy: Math.sin(ang) * sp - 3, g: 0.38, s: rnd(18, 26), a: 1, life: 62, r: rnd(0, 6), vr: rnd(-0.25, 0.25) });
      }
    }
    sparkle(x, y, n = 8, color = '#ffe27a') {
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, s = rnd(1, 3.2); this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.03, life: rnd(26, 46), max: 46, c: color, s: rnd(1.5, 3) }); }
    }
    fireworks(x, y) {
      const cols = ['#ffd54a', '#ff6b5a', '#fff2b0', '#ff9fb3', '#8be0c0'];
      for (let b = 0; b < 3; b++) {
        const cx = x + rnd(-70, 70), cy = y + rnd(-90, -10), col = cols[(Math.random() * cols.length) | 0];
        setTimeout(() => {
          for (let i = 0; i < 34; i++) { const a = i / 34 * 6.28, s = rnd(2.4, 5.2); this.sparks.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.07, life: 54, max: 54, c: col, s: 2.6 }); }
        }, b * 170);
      }
      // vòng sáng vàng mạ kim
      this.sparks.push({ ring: true, x, y, r: 6, life: 28, max: 28 });
    }
    burst(x, y) { this.spawnCoins(x, y, 10); this.sparkle(x, y, 18); this.fireworks(x, y); }

    loop(t) {
      if (!this.running) return;
      const dt = Math.min(2.5, (t - this.last) / 16.67); this.last = t;
      const c = this.ctx; c.clearRect(0, 0, this.w, this.h);
      if (window.Game.S && window.Game.S.settings.quality === 0) { this.coins = []; this.sparks = []; requestAnimationFrame(tt => this.loop(tt)); return; }
      const reduced = document.body.classList.contains('reduce-motion');
      const ambientVisible = !window.WUI?.isOpen() && (!window.UI || window.UI.page === 'market');
      // hạt nền
      for (const p of reduced || !ambientVisible ? [] : this.amb) {
        p.x += (p.vx + (p.k === 'petal' || p.k === 'leaf' ? Math.sin(p.y / 50 + p.ph) * 0.5 : p.k === 'fly' || p.k === 'lan' ? Math.sin(t / 900 + p.ph) * 0.4 : 0)) * dt; p.y += p.vy * dt;
        if (p.r != null) p.r += p.vr * dt;
        if (p.y > this.h + 24 || p.y < -30 || p.x < -30 || p.x > this.w + 30) Object.assign(p, this.newAmb(false), p.vy < 0 ? { y: this.h + 20 } : { y: -20 });
        this.drawAmb(p, t);
      }
      // mưa bụi (Giang Nam)
      if (this.rain.length && !reduced && ambientVisible) {
        c.strokeStyle = 'rgba(120,160,150,.35)'; c.lineWidth = 1; c.beginPath();
        for (const r of this.rain) { c.moveTo(r.x, r.y); c.lineTo(r.x - r.l * 0.25, r.y + r.l); r.y += r.v * dt; r.x -= r.v * 0.25 * dt; if (r.y > this.h) { r.y = -r.l; r.x = rnd(0, this.w + 40); } }
        c.stroke();
      }
      // đồng xu cổ đại (tròn, viền vàng, lỗ vuông)
      for (let i = this.coins.length - 1; i >= 0; i--) {
        const k = this.coins[i]; k.x += k.vx * dt; k.y += k.vy * dt; k.vy += k.g * dt; k.r += k.vr * dt; k.a -= dt / k.life;
        if (k.a <= 0 || k.y > this.h + 30) { this.coins.splice(i, 1); continue; }
        c.save(); c.globalAlpha = Math.max(0, k.a); c.translate(k.x, k.y); c.scale(Math.abs(Math.cos(k.r)) * 0.6 + 0.4, 1);
        const g = c.createRadialGradient(-k.s * 0.15, -k.s * 0.15, 1, 0, 0, k.s / 2);
        g.addColorStop(0, '#fff3a0'); g.addColorStop(0.6, '#ffd54a'); g.addColorStop(1, '#c8901a');
        c.fillStyle = g; c.strokeStyle = '#9a6a10'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, k.s / 2, 0, 6.3); c.fill(); c.stroke();
        c.fillStyle = '#3a2a10'; c.fillRect(-k.s * 0.14, -k.s * 0.14, k.s * 0.28, k.s * 0.28);
        c.restore();
      }
      // tia lửa / pháo hoa
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i]; s.life -= dt;
        if (s.life <= 0) { this.sparks.splice(i, 1); continue; }
        if (s.ring) { s.r += 5 * dt; c.save(); c.globalAlpha = s.life / s.max; c.strokeStyle = '#ffd54a'; c.lineWidth = 3; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.3); c.stroke(); c.restore(); continue; }
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += s.g * dt; s.vx *= 0.985;
        c.save(); c.globalAlpha = s.life / s.max; c.fillStyle = s.c; c.shadowColor = s.c; c.shadowBlur = 8; c.beginPath(); c.arc(s.x, s.y, s.s, 0, 6.3); c.fill(); c.restore();
      }
      requestAnimationFrame((tt) => this.loop(tt));
    }
  }
  window.VFX = VFX;
})();
