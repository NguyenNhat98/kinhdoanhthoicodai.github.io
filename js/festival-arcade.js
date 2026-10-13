/* Hội làng (phần 4): CHẾ ĐỘ TOÀN MÀN HÌNH cho mọi trò + 6 trò dân gian mới
   (Bịt mắt bắt dê, Bắn bi, Đi cà kheo, Thổi cơm thi, Đua thuyền rồng, Gói bánh chưng). */
(function () {
  'use strict';
  const F = window.Festival, G = window.Game, FX = F.FX, H = F.H, $ = (q, r) => (r || document).querySelector(q);
  const { hud, setScore, comboTxt, shell, loop, track, clamp, rnd } = H;
  const reduce = () => document.body.classList.contains('reduce-motion');
  const sfx = (t) => window.Audio2.sfx(t);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ======================================================================
     CHẾ ĐỘ TOÀN MÀN HÌNH: ván chơi phủ kín màn hình, nền riêng từng trò, kết quả dạng bảng trượt lên
     ====================================================================== */
  const prevStart = F.start;
  F.start = function (type) {
    if (F.run && !F.run.done) return;
    const host = $('#festivalGame'); if (!host) return prevStart.apply(this, arguments);
    host.dataset.g = type; host.classList.add('fg-stage'); document.body.classList.add('fg-playing');
    prevStart.apply(this, arguments);
    if (!F.run) { leaveStage(); return; }
  };
  function leaveStage() {
    const host = $('#festivalGame'); if (host) { host.classList.remove('fg-stage'); delete host.dataset.g; }
    document.body.classList.remove('fg-playing');
  }
  /* khi host bị làm rỗng (Rời trò chơi) thì thoát chế độ toàn màn hình; thu gọn hướng dẫn trong ván */
  new MutationObserver(() => {
    const host = $('#festivalGame'); if (!host || !host.classList.contains('fg-stage')) { if (document.body.classList.contains('fg-playing')) leaveStage(); return; }
    if (!host.firstElementChild) leaveStage();
    host.querySelectorAll('details.game-guide[open]').forEach((d) => { if (!d.dataset.seen) { d.dataset.seen = 1; if (F.run && !F.run.pending) d.removeAttribute('open'); } });
  }).observe(document.body, { childList: true, subtree: true });
  /* chuyển trang thì thoát toàn màn hình */
  document.addEventListener('click', (e) => { if (e.target.closest('#nav button')) leaveStage(); }, true);

  /* ======================================================================
     1. BỊT MẮT BẮT DÊ — nghe "bê he", rê tay trong bóng tối, nóng/lạnh, chộp dê
     ====================================================================== */
  F.EXTRA.bitmat = ['🙈', 'Bịt mắt bắt dê', 'Rê tay trong bóng tối, theo vòng nóng – lạnh · 35 giây', 'Xu + nguyên liệu']; F.extra.bitmat = 1;
  F.GUIDES.bitmat = ['🙈 Bịt mắt bắt dê', ['Sân tối om: chỉ thấy một vùng sáng quanh ngón tay. Kéo ngón tay để rê tay đi tìm chú dê 🐐.', 'Vòng quanh tay đỏ & nhấp nhanh là “nóng” (dê ở gần), xanh & chậm là “lạnh”. Dê thỉnh thoảng kêu “Bê… he!” để chỉ hướng.', 'Khi thấy dê trong vùng sáng, bấm “🙌 Chộp!”. Chộp hụt mất 2 giây. Bắt càng nhiều dê càng nhiều điểm.']];
  F.custom.bitmat = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, caught: 0, miss: 0, hx: 50, hy: 60, beat: 0, penalty: 0 });
    shell(host, 'bitmat', `<h3>🙈 Bịt mắt bắt dê</h3>${hud(35)}<div class="blind-field" id="bf"><span class="goat" id="gt">🐐</span><div class="blind-dark" id="bd"></div><i class="hot-ring" id="hr"></i><span class="kid-hand" id="kh">🖐️</span><b class="goat-call" id="gc"></b></div><button class="btn gold big grab-btn" data-grab>🙌 Chộp!</button>`);
    const bf = $('#bf'), gt = $('#gt'), bd = $('#bd'), hr = $('#hr'), kh = $('#kh'), gc = $('#gc');
    const goat = { x: rnd(20, 80), y: rnd(20, 70), tx: 50, ty: 50, v: 22, wait: 0 };
    const newTarget = () => { goat.tx = rnd(8, 92); goat.ty = rnd(10, 88); goat.wait = rnd(.2, 1.1); };
    newTarget();
    const move = (e) => { const b = bf.getBoundingClientRect(); r.hx = clamp((e.clientX - b.left) / b.width * 100, 3, 97); r.hy = clamp((e.clientY - b.top) / b.height * 100, 3, 97); r.moved = 1; };
    track(bf, 'pointerdown', (e) => { move(e); r.drag = true; bf.setPointerCapture && bf.setPointerCapture(e.pointerId); e.preventDefault(); });
    track(bf, 'pointermove', (e) => { if (r.drag) move(e); }); track(bf, 'pointerup', () => { r.drag = false; });
    const dist = () => { const b = bf.getBoundingClientRect(); return Math.hypot((goat.x - r.hx) / 100 * b.width, (goat.y - r.hy) / 100 * b.height); };
    r.grab = () => {
      if (r.done || r.penalty > 0) return; const d = dist(), b = bf.getBoundingClientRect();
      if (d < 46) {
        r.caught++; r.combo++; r.best = Math.max(r.best, r.combo); const pts = 8 + Math.min(4, Math.round(r.left / 10)); r.score += pts; setScore(r); comboTxt(r);
        FX.fly(b.left + goat.x / 100 * b.width, b.top + goat.y / 100 * b.height, `Bắt được! +${pts}`, 'gold'); FX.boom(b.left + goat.x / 100 * b.width, b.top + goat.y / 100 * b.height, ['🐐', '✨', '⭐'], 8); sfx('cheer'); G.buzz([20, 30, 40]);
        gt.classList.add('caught'); setTimeout(() => gt.classList.remove('caught'), 500); goat.x = rnd(10, 90); goat.y = rnd(15, 85); newTarget();
      } else { r.miss++; r.combo = 0; comboTxt(r); r.penalty = 2; FX.at(kh, 'Hụt rồi!', 'bad'); FX.shake(bf); sfx('error'); G.buzz(40); }
    };
    r.end = () => F.finish(r, clamp(Math.round(r.score * .9), 0, 30), `Bắt được ${r.caught} chú dê, chộp hụt ${r.miss} lần.`);
    let callT = 1.2;
    loop(r, (dt) => {
      r.t = r.t || 0; r.beat += dt;
      // dê đi lang thang, né khi tay đến quá gần
      goat.wait -= dt; const dx = goat.tx - goat.x, dy = goat.ty - goat.y, dd = Math.hypot(dx, dy);
      if (goat.wait <= 0 && dd > 1) { const sp = goat.v + (35 - r.left) * .5; goat.x += dx / dd * sp * dt; goat.y += dy / dd * sp * dt; } else if (dd <= 1.5) newTarget();
      const d = dist(); if (d < 70 && Math.random() < dt * 1.4) { goat.tx = clamp(goat.x + (goat.x - r.hx) * 2 + rnd(-10, 10), 6, 94); goat.ty = clamp(goat.y + (goat.y - r.hy) * 2 + rnd(-10, 10), 8, 92); goat.wait = 0; }
      gt.style.left = goat.x + '%'; gt.style.top = goat.y + '%';
      kh.style.left = r.hx + '%'; kh.style.top = r.hy + '%'; hr.style.left = r.hx + '%'; hr.style.top = r.hy + '%';
      bd.style.setProperty('--x', r.hx + '%'); bd.style.setProperty('--y', r.hy + '%');
      const near = clamp(1 - d / 260, 0, 1); hr.style.setProperty('--n', near.toFixed(2)); hr.style.animationDuration = (1.1 - near * .85).toFixed(2) + 's';
      gt.style.opacity = d < 78 ? 1 : 0;
      if (r.penalty > 0) { r.penalty -= dt; bf.classList.add('stunned'); } else bf.classList.remove('stunned');
      // tiếng dê kêu chỉ hướng + tiếng "tích" nóng/lạnh
      callT -= dt; if (callT <= 0) { callT = rnd(1.8, 2.8); const b = bf.getBoundingClientRect(), ang = Math.atan2(goat.y - r.hy, goat.x - r.hx); gc.textContent = pick(['Bê… he!', 'Bê hê hê!', 'Be be!']); gc.style.left = clamp(r.hx + Math.cos(ang) * 22, 10, 90) + '%'; gc.style.top = clamp(r.hy + Math.sin(ang) * 22, 10, 90) + '%'; gc.classList.remove('say'); void gc.offsetWidth; gc.classList.add('say'); if (near > .35) sfx('pop'); void b; }
      r.tickT = (r.tickT || 0) - dt; if (near > .4 && r.tickT <= 0) { r.tickT = .7 - near * .55; sfx('tick'); }
    }, 35);
  };
  document.addEventListener('pointerdown', (e) => {
    const r = F.run; if (!r || r.done || r.type !== 'bitmat') return;
    if (e.target.closest('[data-grab]')) { e.preventDefault(); r.grab(); }
  });

  /* ======================================================================
     2. BẮN BI — kéo ngược rồi thả để bắn, đẩy bi ra khỏi vòng (canvas vật lý)
     ====================================================================== */
  F.EXTRA.banbi = ['🔮', 'Bắn bi', 'Kéo & thả bắn bi đẩy bi ra khỏi vòng · 6 lượt', 'Xu + nguyên liệu']; F.extra.banbi = 1;
  F.GUIDES.banbi = ['🔮 Bắn bi', ['Đặt ngón tay lên viên bi của bạn ở dưới cùng, kéo ngược xuống rồi thả để bắn: kéo càng xa bắn càng mạnh.', 'Bi của bạn đụng các viên trong vòng làm chúng văng đi. Viên nào ra khỏi vòng tròn thì bạn ăn, mỗi viên +3 điểm.', 'Có 6 lượt bắn. Một phát ăn nhiều viên được thưởng combo.']];
  F.custom.banbi = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, shots: 0, eaten: 0, moving: false, aim: null });
    shell(host, 'banbi', `<h3>🔮 Bắn bi</h3><div class="x-hud"><span id="bbShots">Lượt 1/6</span><span id="xScore">Điểm 0</span><span id="bbEaten">Ăn 0</span></div><div class="marble-wrap" id="mw"><canvas class="marble-cv" id="mcv"></canvas></div><p class="muted" style="margin:4px 0 0;text-align:center">Kéo ngược viên bi xanh rồi thả để bắn</p>`);
    const wrap = $('#mw'), cv = $('#mcv'), dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(240, Math.floor(wrap.clientWidth || 320)), Hh = Math.max(280, Math.floor(wrap.clientHeight || 420));
    cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; cv.width = W * dpr; cv.height = Hh * dpr; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = 12, cx = W / 2, cy = Hh * .38, ring = Math.min(W * .36, Hh * .27), COLS = ['#ff5a5a', '#ffb02e', '#5ac8fa', '#a56cff', '#ff7ab8', '#6fdc6f', '#ffd54a', '#ff8a3d'];
    const marbles = [], sparks = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, rr = i % 2 ? ring * .32 : ring * .62; marbles.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, vx: 0, vy: 0, c: COLS[i], out: false, own: false }); }
    const shooter = { x: cx, y: Hh - 46, vx: 0, vy: 0, c: '#3aa0ff', own: true, shooter: true };
    const all = () => marbles.concat([shooter]);
    const pt = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * Hh }; };
    track(cv, 'pointerdown', (e) => { if (r.moving || r.done) return; const p = pt(e); if (Math.hypot(p.x - shooter.x, p.y - shooter.y) < 52) { r.aim = { x: p.x, y: p.y }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); e.preventDefault(); } });
    track(cv, 'pointermove', (e) => { if (r.aim) { const p = pt(e); r.aim = { x: p.x, y: Math.max(p.y, shooter.y - 4) }; } });
    const release = () => {
      if (!r.aim) return; const dx = shooter.x - r.aim.x, dy = shooter.y - r.aim.y, d = Math.min(150, Math.hypot(dx, dy)); r.aim = null;
      if (d < 14) return; const sp = d * 8.5, n = Math.hypot(dx, dy); shooter.vx = dx / n * sp; shooter.vy = dy / n * sp; r.moving = true; r.shots++; r.before = marbles.filter((m) => !m.out).length; sfx('whoosh'); G.buzz(12);
      const sh = $('#bbShots'); if (sh) sh.textContent = `Lượt ${Math.min(6, r.shots)}/6`;
    };
    track(cv, 'pointerup', release); track(cv, 'pointercancel', () => { r.aim = null; });
    const spark = (x, y, c) => { if (reduce()) return; for (let i = 0; i < 6; i++) sparks.push({ x, y, vx: rnd(-90, 90), vy: rnd(-90, 90), l: .45, c }); };
    r.end = () => { if (r.done) return; const bonus = r.eaten >= 8 ? 6 : 0; r.score += bonus; if (r.eaten >= 8) FX.confetti(); F.finish(r, clamp(Math.round(r.score), 0, 30), `Bạn ăn ${r.eaten}/8 viên bi trong ${Math.min(6, r.shots)} lượt${bonus ? ' — sạch vòng, thưởng thêm!' : '.'}`); };
    let last = performance.now();
    const frame = (t) => {
      if (F.run !== r || r.done || !$('#mcv')) return;
      const dt = clamp((t - last) / 1000, 0, .033); last = t;
      const live = all().filter((m) => !m.out);
      // vật lý
      for (let step = 0; step < 2; step++) {
        const h = dt / 2;
        live.forEach((m) => { m.x += m.vx * h; m.y += m.vy * h; const f = Math.pow(.12, h); m.vx *= f; m.vy *= f; if (Math.abs(m.vx) < 14 && Math.abs(m.vy) < 14) { m.vx = 0; m.vy = 0; }
          if (m.x < R) { m.x = R; m.vx = Math.abs(m.vx) * .8; } if (m.x > W - R) { m.x = W - R; m.vx = -Math.abs(m.vx) * .8; } if (m.y < R) { m.y = R; m.vy = Math.abs(m.vy) * .8; } if (m.y > Hh - R) { m.y = Hh - R; m.vy = -Math.abs(m.vy) * .8; } });
        for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
          const a = live[i], b = live[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d > 0 && d < R * 2) {
            const nx = dx / d, ny = dy / d, ov = R * 2 - d; a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { const imp = -rv * .96; a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny; if (-rv > 60) { spark((a.x + b.x) / 2, (a.y + b.y) / 2, '#fff3a0'); if (Math.random() < .6) sfx('tap'); } }
          }
        }
      }
      // bi ra khỏi vòng
      marbles.forEach((m) => {
        if (!m.out && Math.hypot(m.x - cx, m.y - cy) > ring + R * .6 && r.moving) { m.out = true; r.eaten++; r.combo++; r.best = Math.max(r.best, r.combo); const pts = 3 + (r.combo > 1 ? 1 : 0); r.score += pts; setScore(r); const b = cv.getBoundingClientRect(); FX.fly(b.left + m.x / W * b.width, b.top + m.y / Hh * b.height, '+' + pts + (r.combo > 1 ? ' x' + r.combo : ''), 'gold'); spark(m.x, m.y, m.c); sfx('coin'); const e = $('#bbEaten'); if (e) e.textContent = 'Ăn ' + r.eaten; }
      });
      // dừng hẳn -> lượt kế
      if (r.moving && all().filter((m) => !m.out).every((m) => !m.vx && !m.vy)) {
        r.moving = false; if (r.eaten === (r.eatenBefore || 0)) r.combo = 0; r.eatenBefore = r.eaten;
        if (r.shots >= 6 || marbles.every((m) => m.out)) { r.timer = setTimeout(() => r.end(), 600); r.moving = true; }
        else { shooter.x = cx; shooter.y = Hh - 46; shooter.vx = shooter.vy = 0; }
      }
      // vẽ
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, Hh)); g.addColorStop(0, '#d9b078'); g.addColorStop(1, '#a3763e'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
      ctx.strokeStyle = 'rgba(70,40,10,.12)'; ctx.lineWidth = 1; for (let y = 8; y < Hh; y += 14) { ctx.beginPath(); ctx.moveTo(0, y + Math.sin(y) * 2); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.lineWidth = 6; ctx.strokeStyle = '#f6ecd0'; ctx.beginPath(); ctx.arc(cx, cy, ring + R * .6, 0, 6.3); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(80,45,10,.5)'; ctx.stroke();
      ctx.setLineDash([3, 8]); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(10, Hh - 80); ctx.lineTo(W - 10, Hh - 80); ctx.stroke(); ctx.setLineDash([]);
      const drawBall = (m, big) => { const rr = R + (big ? 2 : 0); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3; const gr = ctx.createRadialGradient(m.x - rr * .35, m.y - rr * .4, 1, m.x, m.y, rr); gr.addColorStop(0, '#fff'); gr.addColorStop(.25, m.c); gr.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(m.x, m.y, rr, 0, 6.3); ctx.fill(); ctx.restore(); };
      marbles.forEach((m) => { if (!m.out) drawBall(m); });
      if (!r.moving || shooter.vx || shooter.vy) drawBall(shooter, true);
      if (r.aim) {
        const dx = shooter.x - r.aim.x, dy = shooter.y - r.aim.y, n = Math.min(150, Math.hypot(dx, dy)), ang = Math.atan2(dy, dx);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.setLineDash([2, 8]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(shooter.x, shooter.y); ctx.lineTo(shooter.x + Math.cos(ang) * (n * 3.2), shooter.y + Math.sin(ang) * (n * 3.2)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#ff6a3d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(shooter.x, shooter.y); ctx.lineTo(r.aim.x, r.aim.y); ctx.stroke(); ctx.fillStyle = '#ff6a3d'; ctx.beginPath(); ctx.arc(r.aim.x, r.aim.y, 7, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.round(n / 1.5) + '%', shooter.x, shooter.y - 24);
      }
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.l -= dt; if (s.l <= 0) { sparks.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; ctx.globalAlpha = s.l * 2; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, 6.3); ctx.fill(); } ctx.globalAlpha = 1;
      r.raf = requestAnimationFrame(frame);
    };
    r.raf = requestAnimationFrame(frame);
  };

  /* ======================================================================
     3. ĐI CÀ KHEO — giữ thăng bằng, né gió giật, đi càng xa càng nhiều điểm
     ====================================================================== */
  F.EXTRA.cakheo = ['🦩', 'Đi cà kheo', 'Chạm trái/phải giữ thăng bằng, đi thật xa · 30 giây', 'Xu + nguyên liệu']; F.extra.cakheo = 1;
  F.GUIDES.cakheo = ['🦩 Đi cà kheo', ['Người đi cà kheo luôn bị nghiêng. Bấm nửa TRÁI để đẩy người sang trái, nửa PHẢI để đẩy sang phải, giữ cho thanh thăng bằng ở giữa.', 'Khi có mũi tên gió ⚠️ báo trước, gió sẽ giật mạnh về phía đó: hãy đẩy ngược lại trước.', 'Giữ thăng bằng tốt thì đi nhanh và nhận điểm thưởng ⭐ trên đường. Ngã 3 lần là hết ván.']];
  F.custom.cakheo = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, ang: 0, w: 0, lives: 3, dist: 0, fall: 0, gust: null, nextGust: 2.5, coin: [], steady: 0 });
    shell(host, 'cakheo', `<h3>🦩 Đi cà kheo</h3>${hud(30, '<span id="ckLives">❤️❤️❤️</span>')}<div class="stilt-field" id="sf2"><div class="stilt-bg"></div><div class="gust-warn" id="gw"></div><div class="stilt-man" id="sm"><b class="sm-head">🧒</b><i class="sm-body"></i><i class="sm-leg l"></i><i class="sm-leg r"></i></div><div class="stilt-ground"></div><div class="balance" id="bl"><i id="bn"></i><span class="bz"></span></div><div class="stilt-pads"><div data-lean="-1"><span>⬅️ Đẩy trái</span></div><div data-lean="1"><span>Đẩy phải ➡️</span></div></div></div>`);
    const sf = $('#sf2'), sm = $('#sm'), bn = $('#bn'), gw = $('#gw'), lives = () => { const l = $('#ckLives'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    r.push = 0; r.press = {};
    sf.addEventListener('pointerdown', (e) => { const p = e.target.closest('[data-lean]'); if (!p) return; e.preventDefault(); r.press[e.pointerId] = +p.dataset.lean; p.classList.add('on'); sf.setPointerCapture && sf.setPointerCapture(e.pointerId); });
    const up = (e) => { delete r.press[e.pointerId]; sf.querySelectorAll('[data-lean]').forEach((p) => p.classList.remove('on')); Object.values(r.press).forEach((d) => { const p = sf.querySelector(`[data-lean="${d}"]`); if (p) p.classList.add('on'); }); };
    sf.addEventListener('pointerup', up); sf.addEventListener('pointercancel', up);
    r.end = () => F.finish(r, clamp(Math.round(r.dist / 14 + r.score), 0, 30), `Đi được ${Math.round(r.dist)} m, ngã ${3 - r.lives} lần.`);
    loop(r, (dt) => {
      if (r.fall > 0) { r.fall -= dt; if (r.fall <= 0) { r.ang = 0; r.w = 0; sm.classList.remove('fallen'); } else return; }
      const lean = Object.values(r.press).reduce((a, b) => a + b, 0);
      // gió giật có báo trước
      r.nextGust -= dt; if (r.nextGust <= 0 && !r.gust) { r.gust = { dir: Math.random() < .5 ? -1 : 1, warn: 1.1, t: 0 }; gw.textContent = r.gust.dir < 0 ? '⚠️ gió từ trái 💨' : '💨 gió từ phải ⚠️'; gw.className = 'gust-warn on ' + (r.gust.dir < 0 ? 'l' : 'r'); sfx('whoosh'); }
      let wind = Math.sin(r.t * .9) * 8 + Math.sin(r.t * 2.3) * 5;
      if (r.gust) { if (r.gust.warn > 0) r.gust.warn -= dt; else { r.gust.t += dt; wind += r.gust.dir * 150 * Math.exp(-r.gust.t * 1.6); if (r.gust.t > 1.6) { r.gust = null; r.nextGust = rnd(2.2, 3.6); gw.className = 'gust-warn'; gw.textContent = ''; } } }
      r.w += (r.ang * 1.6 + wind + lean * 150) * dt * (1 + Math.abs(r.ang) / 60); r.w *= Math.pow(.55, dt); r.ang += r.w * dt;
      const steady = Math.abs(r.ang) < 14; r.dist += (steady ? 5.2 : 2.6) * dt * (1 + Math.min(.6, r.dist / 200)); r.steady = steady ? r.steady + dt : 0;
      if (steady && r.steady > 2.5) { r.steady = 0; r.score += 1; setScore(r); r.combo++; r.best = Math.max(r.best, r.combo); comboTxt(r); FX.at(sm, 'Vững vàng +1', 'gold'); }
      if (!steady && r.combo) { r.combo = 0; comboTxt(r); }
      sm.style.setProperty('--a', clamp(r.ang, -60, 60) + 'deg'); bn.style.left = (50 + clamp(r.ang, -50, 50)) + '%'; bn.classList.toggle('bad', !steady);
      sf.style.setProperty('--d', r.dist * 14 + 'px');
      if (Math.abs(r.ang) >= 46) { r.lives--; lives(); r.fall = 1.1; sm.classList.add('fallen'); FX.at(sm, 'Ngã rồi!', 'bad'); FX.shake(sf); sfx('error'); G.buzz(60); r.combo = 0; r.gust = null; r.nextGust = 2; gw.className = 'gust-warn'; gw.textContent = ''; if (r.lives <= 0) r.over = true; }
    }, 30);
  };
  F.TIMED.cakheo = 1;

  /* ======================================================================
     4. THỔI CƠM THI — giữ lửa đúng độ theo từng giai đoạn nấu
     ====================================================================== */
  F.EXTRA.thoicom = ['🍚', 'Thổi cơm thi', 'Giữ lửa đúng độ theo từng giai đoạn · 35 giây', 'Xu + nguyên liệu']; F.extra.thoicom = 1;
  F.GUIDES.thoicom = ['🍚 Thổi cơm thi', ['Giữ nút “🪭 Quạt lửa” để lửa mạnh lên, thả tay để lửa nhỏ dần. Kim nhiệt phải nằm trong vùng xanh của giai đoạn hiện tại.', 'Có 3 giai đoạn: Nấu sôi (lửa to) → Om (lửa nhỏ) → Cháy giòn (lửa vừa). Vùng xanh dịch chuyển theo từng giai đoạn.', 'Trong vùng xanh thanh “Cơm chín” đầy lên; quá nóng cơm bị cháy khét, quá nguội thì cơm sượng. Đầy thanh trước khi hết giờ để thắng.']];
  F.custom.thoicom = (r, host) => {
    const PH = [['🔥 Nấu sôi', 68, 86, 'Lửa to!'], ['♨️ Om cơm', 28, 46, 'Hạ lửa nhỏ…'], ['✨ Cháy giòn', 50, 66, 'Lửa vừa, giữ đều!']];
    Object.assign(r, { score: 0, combo: 0, best: 0, temp: 40, prog: 0, burnt: 0, fan: false, phase: 0, inZoneT: 0 });
    shell(host, 'thoicom', `<h3>🍚 Thổi cơm thi</h3>${hud(35)}<div class="cook-stage" id="cs2"><div class="cook-phase" id="cph"></div><div class="rice-pot" id="rp"><span class="lid">🍲</span><i class="steam s1"></i><i class="steam s2"></i><i class="steam s3"></i></div><div class="flames" id="fl"><b>🔥</b><b>🔥</b><b>🔥</b></div><div class="heat" id="ht"><span class="hz" id="hz"></span><i id="hn"></i><em>nguội</em><em class="hot">nóng</em></div><div class="cook-bar"><i id="cb"></i><span id="cbt">Cơm chín 0%</span></div></div><button class="btn gold big fan-btn" data-fan>🪭 Giữ để quạt lửa</button>`);
    const hz = $('#hz'), hn = $('#hn'), cb = $('#cb'), cbt = $('#cbt'), cph = $('#cph'), fl = $('#fl'), rp = $('#rp'), cs = $('#cs2');
    const setPhase = (i) => { r.phase = i; const p = PH[i]; hz.style.left = p[1] + '%'; hz.style.width = (p[2] - p[1]) + '%'; cph.innerHTML = `<b>${p[0]}</b> <small>${p[3]}</small>`; FX.pulse(cph); sfx('boil'); };
    setPhase(0);
    r.end = () => { const win = r.prog >= 100; if (win) FX.confetti(); const sc = clamp(Math.round(r.prog * .22 + (win ? r.left * .3 : 0) - r.burnt * 2), 0, 30); F.finish(r, sc, win ? `Cơm chín thơm lừng! Còn dư ${Math.ceil(r.left)} giây.` : `Cơm mới chín ${Math.round(r.prog)}%${r.burnt ? `, cháy khét ${r.burnt} lần` : ''}.`); };
    loop(r, (dt) => {
      r.temp += (r.fan ? 46 : -30) * dt * (r.fan ? 1 - r.temp / 140 : 1); r.temp = clamp(r.temp, 0, 100);
      const ph = PH[r.phase], inZ = r.temp >= ph[1] && r.temp <= ph[2];
      if (inZ) { r.prog += dt * 100 / 20; r.inZoneT += dt; r.combo = Math.floor(r.inZoneT / 1.5); r.best = Math.max(r.best, r.combo); if (r.prog / 33.4 > r.phase + 1 && r.phase < 2) setPhase(r.phase + 1); } else { r.inZoneT = 0; r.combo = 0; }
      if (r.temp > 94) { r.prog = Math.max(0, r.prog - dt * 9); if (!r.burning) { r.burning = true; r.burnt++; FX.at(rp, 'Khét rồi!', 'bad'); sfx('error'); G.buzz(30); } cs.classList.add('burning'); } else { r.burning = false; cs.classList.remove('burning'); }
      r.prog = clamp(r.prog, 0, 100); if (r.prog >= 100) r.over = true;
      hn.style.left = r.temp + '%'; cb.style.width = r.prog + '%'; cbt.textContent = 'Cơm chín ' + Math.round(r.prog) + '%'; comboTxt(r);
      fl.style.setProperty('--t', (r.temp / 100).toFixed(2)); rp.style.setProperty('--t', (r.temp / 100).toFixed(2)); rp.classList.toggle('good', inZ);
      r.score = Math.round(r.prog); const s = $('#xScore'); if (s) s.textContent = 'Chín ' + Math.round(r.prog) + '%';
    }, 35);
  };
  F.TIMED.thoicom = 1;
  const fanBtn = (on) => { const r = F.run; if (!r || r.done || r.type !== 'thoicom') return; r.fan = on; const b = $('[data-fan]'); if (b) b.classList.toggle('pop', on); if (on) sfx('whoosh'); };
  document.addEventListener('pointerdown', (e) => { if (e.target.closest('[data-fan]')) { e.preventDefault(); fanBtn(true); } });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => document.addEventListener(ev, () => fanBtn(false), true));

  /* ======================================================================
     5. ĐUA THUYỀN RỒNG — chèo đúng nhịp trống
     ====================================================================== */
  F.EXTRA.duathuyen = ['🛶', 'Đua thuyền rồng', 'Chèo đúng nhịp trống, về nhất · 30 giây', 'Xu + nguyên liệu']; F.extra.duathuyen = 1;
  F.GUIDES.duathuyen = ['🛶 Đua thuyền rồng', ['Trống đánh theo nhịp: vòng tròn ở giữa thu nhỏ dần. Bấm “CHÈO!” khi vòng ngoài trùng vòng trong.', 'Đúng nhịp thuyền lao vút (hoàn hảo là tăng tốc mạnh nhất). Chèo lệch nhịp hoặc bấm bừa thì thuyền chậm lại.', 'Đua với 3 thuyền khác, về đích đầu tiên trong 30 giây để thắng. Hạng càng cao điểm càng lớn.']];
  F.custom.duathuyen = (r, host) => {
    const NAMES = ['Bạn', 'Thuyền Rồng Vàng', 'Thuyền Phượng Đỏ', 'Thuyền Sen Xanh'], COL = ['#ffd54a', '#ff6a4a', '#ff7ab8', '#4fc3a1'];
    Object.assign(r, { score: 0, combo: 0, best: 0, perfect: 0, good: 0, bad: 0, pos: [0, 0, 0, 0], boost: 0, bpm: 96, beat: 0, lastBeat: 0, finish: [] });
    shell(host, 'duathuyen', `<h3>🛶 Đua thuyền rồng</h3>${hud(30)}<div class="river" id="rv"><i class="bank t"></i>${NAMES.map((n, i) => `<div class="lane" data-l="${i}"><span class="lane-n">${i ? n : '⭐ Bạn'}</span><b class="boat ${i ? '' : 'me'}" id="bt${i}" style="--c:${COL[i]}">🛶</b></div>`).join('')}<i class="finish-line"></i><i class="bank b"></i></div><div class="beat-zone" id="bz"><i class="beat-ring" id="brg"></i><i class="beat-core"></i><b id="bjd"></b></div><button class="btn gold big row-btn" data-row>🥁 CHÈO!</button>`);
    const bts = [0, 1, 2, 3].map((i) => $('#bt' + i)), brg = $('#brg'), bjd = $('#bjd'), per = 60 / r.bpm; let ai = [0, 0, 0, 0]; const spd = [0, 6.2, 5.8, 5.4];
    const judge = (t, c) => { bjd.textContent = t; bjd.style.color = c; bjd.classList.remove('say'); void bjd.offsetWidth; bjd.classList.add('say'); };
    r.row = (btn) => {
      if (r.done) return; const ph = (r.beat % per) / per, off = Math.min(ph, 1 - ph) * per; sfx('drum'); btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      if (r.t - r.lastRow < .18) { r.boost = Math.max(0, r.boost - .5); r.lastRow = r.t; return; } r.lastRow = r.t;
      if (off < .07) { r.perfect++; r.combo++; r.boost = Math.min(3.2, r.boost + 1.3); judge('HOÀN HẢO!', '#ffe27a'); sfx('coin'); const b = bts[0].getBoundingClientRect(); FX.boom(b.left, b.top + b.height / 2, ['💦', '✨'], 4); }
      else if (off < .16) { r.good++; r.combo++; r.boost = Math.min(3.2, r.boost + .7); judge('Tốt', '#8bf0a6'); }
      else { r.bad++; r.combo = 0; r.boost = Math.max(-1.5, r.boost - 1); judge('Lệch nhịp', '#ff8a7a'); FX.shake($('#rv')); }
      r.best = Math.max(r.best, r.combo); comboTxt(r);
    };
    r.lastRow = -9;
    r.end = () => {
      const order = [0, 1, 2, 3].sort((a, b) => r.pos[b] - r.pos[a]), rank = order.indexOf(0) + 1, sc = [0, 28, 18, 10, 4][rank] + Math.min(2, Math.floor(r.perfect / 8));
      if (rank === 1) FX.confetti(); F.finish(r, clamp(sc, 0, 30), `Về hạng ${rank}/4! Chèo hoàn hảo ${r.perfect} lần, lệch nhịp ${r.bad} lần.`);
    };
    loop(r, (dt) => {
      r.beat += dt; const ph = (r.beat % per) / per; brg.style.transform = `scale(${(2.6 - ph * 1.6).toFixed(3)})`; brg.style.opacity = (.25 + ph * .75).toFixed(2);
      if (ph < dt / per && r.t > .3) { sfx('tick'); }
      r.boost *= Math.pow(.6, dt);
      for (let i = 0; i < 4; i++) {
        const v = i === 0 ? clamp(3.4 + r.boost * 2.2, 1.2, 9.5) : spd[i] * (1 + Math.sin(r.t * (1.2 + i * .4) + i) * .12);
        r.pos[i] += v * dt; bts[i].style.left = (2 + Math.min(r.pos[i], 100) * .84) + '%';
        if (r.pos[i] >= 100 && !r.finish.includes(i)) { r.finish.push(i); if (i === 0) r.over = true; }
      }
      if (r.finish.length >= 3 && !r.over) r.over = true;
      const s = $('#xScore'); if (s) s.textContent = 'Hạng ' + ([0, 1, 2, 3].sort((a, b) => r.pos[b] - r.pos[a]).indexOf(0) + 1) + '/4';
    }, 30);
  };
  F.TIMED.duathuyen = 1;
  document.addEventListener('pointerdown', (e) => { const r = F.run, b = e.target.closest('[data-row]'); if (r && !r.done && r.type === 'duathuyen' && b) { e.preventDefault(); r.row(b); } });

  /* ======================================================================
     6. GÓI BÁNH CHƯNG — nhớ thứ tự nguyên liệu (kiểu Simon)
     ====================================================================== */
  F.EXTRA.goibanh = ['🎍', 'Gói bánh chưng', 'Nhìn kỹ rồi gói đúng thứ tự nguyên liệu · 3 mạng', 'Xu + nguyên liệu']; F.extra.goibanh = 1;
  F.GUIDES.goibanh = ['🎍 Gói bánh chưng', ['Mỗi vòng, các nguyên liệu sáng lên theo một thứ tự. Hãy nhìn và nhớ kỹ.', 'Khi tới lượt bạn, chạm đúng các nguyên liệu theo thứ tự đã thấy. Mỗi vòng xong là thêm một nguyên liệu vào chiếc bánh.', 'Chạm sai mất 1 trong 3 mạng (vòng đó được chơi lại). Gói được càng nhiều vòng điểm càng cao.']];
  F.custom.goibanh = (r, host) => {
    const ING = [['🍃', 'Lá dong'], ['🍚', 'Gạo nếp'], ['🟢', 'Đậu xanh'], ['🥩', 'Thịt'], ['🧂', 'Hành tiêu']];
    Object.assign(r, { score: 0, combo: 0, best: 0, lives: 3, round: 1, seq: [], inp: 0, phase: 'show', cleared: 0 });
    shell(host, 'goibanh', `<h3>🎍 Gói bánh chưng</h3><div class="x-hud"><span id="gbRound">Vòng 1</span><span id="xScore">Điểm 0</span><span id="gbLives">❤️❤️❤️</span></div><div class="banh-stage" id="bs"><div class="banh" id="bh"></div><b class="gb-msg" id="gbm">Nhìn kỹ nhé…</b></div><div class="ing-row" id="ir">${ING.map((x, i) => `<button class="ing" data-ing="${i}"><span>${x[0]}</span><small>${x[1]}</small></button>`).join('')}</div>`);
    const ir = $('#ir'), gbm = $('#gbm'), bh = $('#bh'), lives = () => { const l = $('#gbLives'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    const msg = (t, c) => { gbm.textContent = t; gbm.className = 'gb-msg ' + (c || ''); };
    const flash = (i, ms) => { const b = ir.children[i]; if (!b) return; b.classList.add('lit'); sfx('pop'); setTimeout(() => b.classList.remove('lit'), ms || 380); };
    const layers = () => { bh.innerHTML = Array.from({ length: Math.min(8, r.cleared) }, (_, k) => `<i style="--k:${k}">${['🍃', '🍚', '🟢', '🥩', '🟢', '🍚', '🍃', '🎍'][k]}</i>`).join('') + (r.cleared >= 8 ? '' : '<u>🎍</u>'); };
    layers();
    const play = () => {
      if (F.run !== r || r.done) return; r.phase = 'show'; r.inp = 0; ir.classList.add('lock');
      while (r.seq.length < r.round + 2) r.seq.push(Math.floor(Math.random() * 5));
      msg(`Nhìn kỹ… (${r.seq.length} nguyên liệu)`, '');
      let i = 0; const step = () => { if (F.run !== r || r.done) return; if (i >= r.seq.length) { r.phase = 'input'; ir.classList.remove('lock'); msg('Đến lượt bạn!', 'ok'); return; } flash(r.seq[i], Math.max(260, 520 - r.round * 30)); i++; r.timer = setTimeout(step, Math.max(380, 760 - r.round * 40)); };
      r.timer = setTimeout(step, 700);
    };
    r.tap = (i) => {
      if (r.done || r.phase !== 'input') return; flash(i, 200);
      if (i !== r.seq[r.inp]) { r.lives--; lives(); r.combo = 0; r.phase = 'wait'; msg('Sai rồi! Xem lại nhé.', 'bad'); FX.shake($('#bs')); sfx('error'); G.buzz(40); if (r.lives <= 0) { r.timer = setTimeout(() => r.finish(), 800); } else r.timer = setTimeout(play, 1200); return; }
      r.inp++; r.combo++; r.best = Math.max(r.best, r.combo);
      if (r.inp >= r.seq.length) { r.phase = 'wait'; r.cleared++; r.round++; r.score += 4; setScore(r); layers(); msg('Gói xong một lớp! 🎉', 'ok'); sfx('levelup'); FX.boom(window.innerWidth / 2, $('#bs').getBoundingClientRect().top + 90, ['✨', '🎍', '⭐'], 8); const rd = $('#gbRound'); if (rd) rd.textContent = 'Vòng ' + r.round; if (r.cleared >= 8) { FX.confetti(); r.timer = setTimeout(() => r.finish(), 1000); } else r.timer = setTimeout(play, 1100); }
    };
    r.finish = () => F.finish(r, clamp(Math.round(r.score), 0, 30), `Gói được ${r.cleared} lớp bánh, nhớ chuỗi dài nhất ${r.seq.length} nguyên liệu.`);
    r.timer = setTimeout(play, 600);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run, b = e.target.closest('[data-ing]'); if (r && !r.done && r.type === 'goibanh' && b) { e.preventDefault(); r.tap(+b.dataset.ing); } });

  /* ---------- nhóm trên trang Hội làng ---------- */
  const add = (title, ids) => F.GROUPS.forEach((g) => { if (g[1] === title) ids.forEach((id) => g[2].push(id)); });
  add('Vận động & phản xạ', ['cakheo', 'duathuyen']); add('Nhịp điệu & khéo tay', ['thoicom', 'banbi']); add('Phiêu lưu bầu trời', ['bitmat']); add('Trí tuệ dân gian', ['goibanh']);
  ['bitmat', 'banbi', 'cakheo', 'thoicom', 'duathuyen', 'goibanh'].forEach((id) => { F.NEW[id] = 1; });
  F.TIMED.bitmat = 1; F.TIMED.banbi = 1; F.TIMED.goibanh = 1;
})();
