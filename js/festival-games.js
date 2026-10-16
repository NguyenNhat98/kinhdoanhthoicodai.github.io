/* Hội làng (phần 3): 5 trò chơi dân gian mới (Thả diều, Rồng rắn lên mây, Múa lân, Chơi chuyền, Nặn tò he),
   đếm ngược 3-2-1, thanh thời gian, kỷ lục + sao từng trò, trang Hội làng chia nhóm, hạt trang trí cho mọi ván. */
(function () {
  'use strict';
  const F = window.Festival, G = window.Game, FX = F.FX, $ = (q, r) => (r || document).querySelector(q), rnd = (a, b) => a + Math.random() * (b - a);
  const reduce = () => document.body.classList.contains('reduce-motion');
  const sfx = (t) => window.Audio2.sfx(t);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- hạ tầng nhỏ dùng chung ---------- */
  const hud = (t, extra) => `<div class="x-hud"><span id="xTime">⏱ ${t}</span><span id="xScore">Điểm 0</span><span id="xCombo" class="combo-pill"></span>${extra || ''}</div>`;
  const setScore = (r) => { const s = $('#xScore'); if (s) { s.textContent = 'Điểm ' + Math.round(r.score); FX.pulse(s); } };
  const comboTxt = (r) => { const c = $('#xCombo'); if (c) { c.textContent = r.combo > 1 ? `🔥 x${r.combo}` : ''; if (r.combo > 1) FX.pulse(c); } };
  const shell = (host, type, body) => {
    host.innerHTML = `<div class="folk-game game-${type}">${body}<div id="folkResult" role="status"></div><button class="btn ghost sm" data-faction="leave">Rời trò chơi</button></div>`;
    host.scrollIntoView({ behavior: reduce() ? 'instant' : 'smooth', block: 'start' });
  };
  const loop = (r, fn, secs) => {
    r.left = secs; let last = performance.now();
    const frame = (t) => {
      if (F.run !== r || r.done || window.UI.page !== 'festival' || !$('#xTime')) return;
      const dt = clamp((t - last) / 1000, 0, 0.05); last = t; r.left -= dt; r.t = (r.t || 0) + dt; fn(dt);
      const tm = $('#xTime'); if (tm) tm.textContent = '⏱ ' + Math.max(0, Math.ceil(r.left));
      if (r.left <= 0 || r.over) return r.end();
      r.raf = requestAnimationFrame(frame);
    };
    r.raf = requestAnimationFrame(frame);
  };
  const track = (host, ev, fn, opt) => { host.addEventListener(ev, fn, opt); };
  const mult = (r) => 1 + Math.min(2, Math.floor((r.combo || 0) / 5));
  F.H = { hud, setScore, comboTxt, shell, loop, track, mult, clamp, rnd };

  /* ======================================================================
     1. THẢ DIỀU — giữ để diều bay lên, thả để diều hạ; bám theo luồng gió, ăn sao, né chim
     ====================================================================== */
  F.EXTRA.thadieu = ['🪁', 'Thả diều', 'Giữ & thả để lái diều theo luồng gió · 30 giây', 'Xu + nguyên liệu']; F.extra.thadieu = 1;
  F.GUIDES.thadieu = ['🪁 Thả diều', ['Chạm giữ vào bầu trời để diều bay lên, thả tay diều sẽ hạ xuống.', 'Giữ diều trong dải gió xanh để ghi điểm liên tục; ở trong gió càng lâu hệ số càng cao.', 'Ăn sao ⭐ (+3), né chim 🐦 và mây giông ⛈️: va vào sẽ bị trừ điểm và mất hệ số.']];
  F.custom.thadieu = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, y: 50, vy: 0, hold: false, items: [], next: 1, acc: 0, streak: 0, inBand: false, wob: 0 });
    shell(host, 'thadieu', `<h3>🪁 Thả diều</h3>${hud(30)}<div class="sky-field" id="sf"><i class="cloud c1">☁️</i><i class="cloud c2">☁️</i><i class="cloud c3">☁️</i>
      <div class="wind-band" id="wb"><span>〰 luồng gió 〰</span></div>
      <svg class="kite-string" viewBox="0 0 100 100" preserveAspectRatio="none"><line id="ks" x1="9" y1="90" x2="24" y2="50" vector-effect="non-scaling-stroke"/></svg>
      <div class="kite" id="kt"><b>🪁</b><i class="tail"><u></u><u></u><u></u><u></u></i></div><span class="kid">🧒</span><div class="grass"></div>
      <p class="sky-hint" id="skh">Chạm giữ để bay lên · thả để hạ xuống</p></div>`);
    const sf = $('#sf'), kt = $('#kt'), wb = $('#wb'), ks = $('#ks');
    const down = (e) => { r.hold = true; const h = $('#skh'); if (h) h.remove(); e.preventDefault(); sf.setPointerCapture && sf.setPointerCapture(e.pointerId); };
    const up = () => { r.hold = false; };
    track(sf, 'pointerdown', down); track(sf, 'pointerup', up); track(sf, 'pointercancel', up); track(sf, 'lostpointercapture', up);
    const spawn = () => {
      const k = Math.random(), kind = k < .38 ? 'star' : k < .75 ? 'bird' : 'storm', e = document.createElement('span');
      e.className = 'sky-it ' + kind; e.style.left = '0'; e.style.bottom = '0'; e.textContent = kind === 'star' ? '⭐' : kind === 'bird' ? '🐦' : '⛈️';
      const y = rnd(14, 88); sf.appendChild(e); r.items.push({ e, x: 108, y, v: kind === 'star' ? rnd(28, 36) : rnd(34, 52) + (30 - r.left) * .6, kind });
    };
    r.end = () => { if (r.won === undefined) r.won = 1; F.finish(r, Math.min(30, Math.round(r.score / 3)), `Diều bay được ${Math.round(r.score)} điểm (hệ số cao nhất x${Math.min(3, 1 + Math.floor(r.best / 4))}).`); };
    let sw = sf.clientWidth, sh = sf.clientHeight;
    loop(r, (dt) => {
      if (r.t % 1 < dt) { sw = sf.clientWidth; sh = sf.clientHeight; }
      r.vy += (r.hold ? 130 : -95) * dt; r.vy = clamp(r.vy, -48, 52); r.y = clamp(r.y + r.vy * dt, 8, 94);
      const c = 50 + 27 * Math.sin(r.t * .75) + 11 * Math.sin(r.t * 1.9), hw = 14;
      wb.style.bottom = (c - hw) + '%'; wb.style.height = hw * 2 + '%';
      const kx = 24, inBand = Math.abs(r.y - c) < hw;
      kt.style.bottom = r.y + '%'; kt.style.left = kx + '%'; kt.style.transform = `translate(-50%, 50%) rotate(${clamp(-r.vy * .7, -28, 28) + Math.sin(r.t * 7) * 3 + r.wob}deg)`;
      r.wob *= .9;
      ks.setAttribute('x2', kx); ks.setAttribute('y2', 100 - r.y);
      if (inBand) {
        r.streak += dt; r.acc += dt * 2.2 * (1 + Math.min(2, Math.floor(r.streak / 3))); const pts = Math.floor(r.acc);
        if (pts > 0) { r.acc -= pts; r.score += pts; setScore(r); }
        r.combo = Math.floor(r.streak / .75); r.best = Math.max(r.best, r.combo); comboTxt(r);
        if (!r.inBand) { sf.classList.add('in-wind'); } kt.classList.add('glow');
        if (!reduce() && Math.random() < dt * 9) { const s = document.createElement('i'); s.className = 'wind-spark'; s.textContent = '✨'; s.style.cssText = `left:${kx + rnd(-5, 2)}%;bottom:${r.y + rnd(-4, 4)}%`; sf.appendChild(s); setTimeout(() => s.remove(), 700); }
      } else { if (r.inBand) { sf.classList.remove('in-wind'); kt.classList.remove('glow'); } if (r.streak > 0) { r.streak = 0; r.combo = 0; comboTxt(r); } }
      r.inBand = inBand;
      r.next -= dt; if (r.next <= 0) { spawn(); r.next = rnd(.7, 1.3); }
      r.items = r.items.filter((it) => {
        it.x -= it.v * dt; it.e.style.translate = (it.x / 100 * sw) + 'px ' + (-(it.y / 100 * sh)) + 'px';
        if (it.kind === 'bird') it.e.style.transform = `translate(-50%, 50%) translateY(${Math.sin(r.t * 9 + it.y) * 5}px) scaleX(-1)`; /* chim bay sang trái */
        const hit = Math.abs(it.x - kx) < 6.5 && Math.abs(it.y - r.y) < 8.5;
        if (hit) {
          if (it.kind === 'star') { r.score += 3; setScore(r); FX.at(kt, '+3 ⭐', 'gold'); FX.boom(kt.getBoundingClientRect().left + 20, kt.getBoundingClientRect().top + 20, ['✨', '⭐'], 6); sfx('coin'); }
          else { r.score = Math.max(0, r.score - 3); r.streak = 0; r.combo = 0; comboTxt(r); setScore(r); r.wob = 30; FX.at(kt, '−3', 'bad'); FX.shake(sf); sfx('error'); G.buzz(40); FX.boom(kt.getBoundingClientRect().left + 20, kt.getBoundingClientRect().top + 20, ['💥', '🪶'], 6); }
          it.e.remove(); return false;
        }
        if (it.x < -10) { it.e.remove(); return false; } return true;
      });
    }, 30);
  };

  /* ======================================================================
     2. RỒNG RẮN LÊN MÂY — dẫn đầu đoàn trẻ, ăn kẹo để dài thêm, tránh thầy thuốc ăn đuôi
     ====================================================================== */
  F.EXTRA.rongran = ['🐉', 'Rồng rắn lên mây', 'Dẫn đoàn dài thêm, né thầy thuốc · 30 giây', 'Xu + nguyên liệu']; F.extra.rongran = 1;
  F.GUIDES.rongran = ['🐉 Rồng rắn lên mây', ['Kéo ngón tay trên sân để dẫn đầu rồng. Cả đoàn trẻ nối đuôi theo sau.', 'Ăn kẹo 🍬 để đoàn dài thêm một bạn (+1 điểm).', 'Thầy thuốc 🧙 đuổi theo xin “khúc đuôi”: chạm vào đoàn sẽ cắt mất các bạn phía sau. Khi đoàn có từ 3 bạn, húc đầu rồng vào thầy sẽ đuổi thầy đi (+2).']];
  F.custom.rongran = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, collected: 0, lost: 0 });
    shell(host, 'rongran', `<h3>🐉 Rồng rắn lên mây</h3>${hud(30, '<span id="xKids">🧒 ×1</span>')}<canvas class="dragon-cv" id="dcv"></canvas><p class="muted" style="margin:4px 0 0">Kéo ngón tay để dẫn đầu rồng</p>`);
    const cv = $('#dcv'), fgm = cv.closest('.folk-game'), W = Math.min((fgm ? fgm.clientWidth : 360) - 24, 520) || 320, H = fgm && fgm.closest('.fg-stage') ? Math.max(300, fgm.clientHeight - cv.offsetTop - 64) : 330, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const KIDS = ['🧒', '👧', '👦', '🧑', '👶', '🧒'], GAP = 21;
    const segs = [{ x: W * .25, y: H * .5 }]; for (let i = 0; i < 3; i++) segs.push({ x: segs[0].x - (i + 1) * GAP, y: segs[0].y });
    const tgt = { x: segs[0].x, y: segs[0].y }, wiz = { x: W - 24, y: 30, stun: 0, speed: 55 }, candies = [], clouds = Array.from({ length: 5 }, () => ({ x: rnd(0, W), y: rnd(10, H - 20), s: rnd(26, 44), v: rnd(4, 12) }));
    let candyT = 0;
    const move = (e) => { const b = cv.getBoundingClientRect(); tgt.x = clamp((e.clientX - b.left) / b.width * W, 8, W - 8); tgt.y = clamp((e.clientY - b.top) / b.height * H, 8, H - 8); };
    track(cv, 'pointerdown', (e) => { move(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); r.drag = true; e.preventDefault(); });
    track(cv, 'pointermove', (e) => { if (r.drag) move(e); }); track(cv, 'pointerup', () => { r.drag = false; });
    const kidsHud = () => { const k = $('#xKids'); if (k) k.textContent = `🧒 ×${segs.length - 1}`; };
    const spawnCandy = () => { if (candies.length < 4) candies.push({ x: rnd(20, W - 20), y: rnd(20, H - 20), p: rnd(0, 6), icon: Math.random() < .25 ? '🍭' : '🍬' }); };
    r.end = () => F.finish(r, clamp(Math.round(r.score * 1.35), 0, 30), `Đoàn dài ${segs.length - 1} bạn · ăn ${r.collected} kẹo, mất ${r.lost} bạn.`);
    for (let i = 0; i < 3; i++) spawnCandy();
    const ART = { '☁️': 'cloud', '🍭': 'lolly', '🍬': 'candy', '🐉': 'dragonhead', '🧙': 'doctor', '🧒': 'boy', '👧': 'girl', '👦': 'boy2', '🧑': 'boy3', '👶': 'girl2' };
    const emoji = (t, x, y, s, rot) => { if (ART[t] && window.GameArt && GameArt.draw(ctx, ART[t], x, y, s * (t === '☁️' ? 1.5 : 1.25), rot)) return; ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.font = s + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, 0, 0); ctx.restore(); };
    loop(r, (dt) => {
      // đầu rồng đuổi theo ngón tay
      const h = segs[0], dx = tgt.x - h.x, dy = tgt.y - h.y, d = Math.hypot(dx, dy), sp = Math.min(d, 175 * dt);
      if (d > 2) { h.x += dx / d * sp; h.y += dy / d * sp; r.ang = Math.atan2(dy, dx); }
      for (let i = 1; i < segs.length; i++) { const a = segs[i - 1], b = segs[i], ddx = a.x - b.x, ddy = a.y - b.y, dd = Math.hypot(ddx, ddy); if (dd > GAP) { b.x = a.x - ddx / dd * GAP; b.y = a.y - ddy / dd * GAP; } }
      candyT -= dt; if (candyT <= 0) { spawnCandy(); candyT = rnd(.7, 1.5); }
      for (let i = candies.length - 1; i >= 0; i--) {
        const c = candies[i]; if (Math.hypot(c.x - h.x, c.y - h.y) < 24) {
          candies.splice(i, 1); const tail = segs[segs.length - 1]; segs.push({ x: tail.x, y: tail.y }); r.collected++; r.score++; r.combo++; r.best = Math.max(r.best, r.combo);
          setScore(r); comboTxt(r); kidsHud(); const b = cv.getBoundingClientRect(); FX.fly(b.left + h.x / W * b.width, b.top + h.y / H * b.height, '+1', 'gold'); sfx('pop');
        }
      }
      // thầy thuốc
      wiz.stun = Math.max(0, wiz.stun - dt);
      if (wiz.stun <= 0) {
        const tail = segs[segs.length - 1], dx2 = tail.x - wiz.x, dy2 = tail.y - wiz.y, d2 = Math.hypot(dx2, dy2) || 1; wiz.speed = 55 + (30 - r.left) * 2.6;
        wiz.x += dx2 / d2 * wiz.speed * dt; wiz.y += dy2 / d2 * wiz.speed * dt;
        if (segs.length > 1) for (let i = 1; i < segs.length; i++) {
          if (Math.hypot(segs[i].x - wiz.x, segs[i].y - wiz.y) < 17) {
            const gone = segs.length - i; segs.length = i; r.lost += gone; r.score = Math.max(0, r.score - gone * .5); r.combo = 0; wiz.stun = 1.6;
            setScore(r); comboTxt(r); kidsHud(); const b = cv.getBoundingClientRect(); FX.fly(b.left + wiz.x / W * b.width, b.top + wiz.y / H * b.height, `−${gone} bạn`, 'bad'); FX.shake(cv); sfx('error'); G.buzz(40); break;
          }
        }
        if (segs.length >= 4 && Math.hypot(h.x - wiz.x, h.y - wiz.y) < 24) { wiz.stun = 3.2; wiz.x = rnd(0, 1) < .5 ? 20 : W - 20; wiz.y = rnd(20, H - 20); r.score += 2; r.combo += 2; setScore(r); const b = cv.getBoundingClientRect(); FX.fly(b.left + h.x / W * b.width, b.top + h.y / H * b.height, 'Đuổi thầy +2', 'gold'); FX.boom(b.left + h.x / W * b.width, b.top + h.y / H * b.height, ['💫', '✨'], 6); sfx('coin'); }
      }
      // vẽ
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fd0f0'); g.addColorStop(.6, '#cfeeff'); g.addColorStop(1, '#fff1cf'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      clouds.forEach((c) => { c.x += c.v * dt; if (c.x > W + 40) c.x = -40; ctx.globalAlpha = .75; emoji('☁️', c.x, c.y, c.s); }); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(176,115,58,.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); segs.forEach((s, i) => { if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); }); ctx.stroke();
      candies.forEach((c) => { c.p += dt * 4; emoji(c.icon, c.x, c.y + Math.sin(c.p) * 3, 24); });
      for (let i = segs.length - 1; i >= 1; i--) emoji(KIDS[i % KIDS.length], segs[i].x, segs[i].y + Math.sin(r.t * 8 + i) * 1.6, 22);
      r.face = Math.abs(Math.cos(r.ang || 0)) > .15 ? (Math.cos(r.ang) < 0 ? -1 : 1) : (r.face || 1);
      ctx.save(); ctx.shadowColor = 'rgba(255,180,40,.9)'; ctx.shadowBlur = 14; ctx.translate(h.x, h.y); ctx.scale(r.face, 1); emoji('🐉', 0, 0, 34, Math.sin(r.t * 6) * .12 + (r.face > 0 ? Math.sin(r.ang || 0) : -Math.sin(r.ang || 0)) * .5 * (r.face > 0 ? 1 : -1)); ctx.restore();
      ctx.globalAlpha = wiz.stun > 0 ? .6 : 1; emoji('🧙', wiz.x, wiz.y, 30); ctx.globalAlpha = 1; if (wiz.stun > 0) emoji('💫', wiz.x, wiz.y - 20, 18);
    }, 30);
  };

  /* ======================================================================
     3. MÚA LÂN — game nhịp điệu 3 trống
     ====================================================================== */
  F.EXTRA.mualan = ['🦁', 'Múa lân', 'Gõ trống đúng nhịp khi nốt chạm vạch · ~30 giây', 'Xu + nguyên liệu']; F.extra.mualan = 1;
  F.GUIDES.mualan = ['🦁 Múa lân', ['Nốt trống rơi xuống ba cột. Khi nốt chạm vạch vàng, chạm vào trống ở đúng cột.', 'Đúng giữa vạch là “Hoàn hảo” (+3), lệch một chút là “Tốt” (+1). Gõ liên tiếp để tăng hệ số.', 'Bỏ lỡ nốt sẽ mất hệ số. Lân càng múa vui khi bạn gõ càng chuẩn!']];
  F.custom.mualan = (r, host) => {
    const BEAT = .55, FALL = 1.5, LINE = 82, NOTES = [];
    let lane = 1; for (let i = 0; i < 38; i++) { const t = 1.8 + i * BEAT * (i % 7 === 6 ? 1.5 : 1); let l = Math.random() < .35 ? lane : Math.floor(rnd(0, 3)); lane = l; NOTES.push({ t, l, el: null, done: false }); if (i % 9 === 8) NOTES.push({ t, l: (l + 1 + Math.floor(rnd(0, 2))) % 3, el: null, done: false }); }
    const total = NOTES[NOTES.length - 1].t + 1.2;
    Object.assign(r, { score: 0, combo: 0, best: 0, perfect: 0, good: 0, miss: 0, clock: 0 });
    shell(host, 'mualan', `<h3>🦁 Múa lân</h3>${hud(Math.ceil(total))}<div class="lion-stage" id="ls"><span class="lion" id="ln">🦁</span><i class="lan-l">🏮</i><i class="lan-r">🏮</i></div>
      <div class="drum-field" id="df"><div class="drum-line"></div>${[0, 1, 2].map((i) => `<div class="drum-lane" data-lane="${i}"></div>`).join('')}</div>
      <div class="drum-row">${['🥁', '🥁', '🥁'].map((d, i) => `<button class="drum-btn d${i}" data-drum="${i}" aria-label="Trống ${i + 1}"><span>${d}</span></button>`).join('')}</div>`);
    const df = $('#df'), ln = $('#ln'), ls = $('#ls');
    const judge = (text, cls) => { const j = document.createElement('b'); j.className = 'judge ' + cls; j.textContent = text; df.appendChild(j); setTimeout(() => j.remove(), 600); };
    const lionTo = (l, mood) => { ln.style.left = (22 + l * 28) + '%'; ln.classList.remove('dance'); void ln.offsetWidth; ln.classList.add('dance'); if (mood) { ln.dataset.m = mood; setTimeout(() => { ln.dataset.m = ''; }, 380); } };
    r.hit = (l) => {
      if (r.done) return; const btn = $(`[data-drum="${l}"]`); if (btn) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
      sfx('drum'); let best = null, bd = 9;
      NOTES.forEach((n) => { if (n.l === l && !n.done && n.el) { const d = Math.abs(n.t - r.clock); if (d < bd) { bd = d; best = n; } } });
      if (!best || bd > .26) { return; }
      best.done = true; best.el.classList.add(bd < .1 ? 'hit-p' : 'hit-g'); const e = best.el; setTimeout(() => e.remove(), 220);
      const perfect = bd < .1; r.combo++; r.best = Math.max(r.best, r.combo); const pts = (perfect ? 3 : 1) * mult(r); r.score += pts; perfect ? r.perfect++ : r.good++;
      setScore(r); comboTxt(r); judge(perfect ? 'HOÀN HẢO +' + pts : 'Tốt +' + pts, perfect ? 'p' : 'g'); lionTo(l, 'happy'); sfx(perfect ? 'coin' : 'tap'); G.buzz(8);
      if (!reduce()) { const b = e.getBoundingClientRect(); FX.boom(b.left + b.width / 2, b.top + b.height / 2, perfect ? ['✨', '⭐', '🎊'] : ['✨'], perfect ? 6 : 3); }
      if (r.combo > 0 && r.combo % 10 === 0) { FX.fly(window.innerWidth / 2, ls.getBoundingClientRect().top + 30, `COMBO x${r.combo}!`, 'big'); FX.confetti(14); sfx('levelup'); }
    };
    r.end = () => { const sc = clamp(Math.round(r.score / 8), 0, 30); if (sc >= 20) FX.confetti(); F.finish(r, sc, `Hoàn hảo ${r.perfect} · Tốt ${r.good} · Trượt ${r.miss} (combo cao nhất ${r.best}).`); };
    loop(r, (dt) => {
      r.clock += dt;
      NOTES.forEach((n) => {
        if (n.done) return;
        if (!n.el && r.clock > n.t - FALL) { n.el = document.createElement('span'); n.el.className = 'drum-note n' + n.l; n.el.textContent = '🥁'; $(`.drum-lane[data-lane="${n.l}"]`, df).appendChild(n.el); }
        if (n.el) {
          const p = 1 - (n.t - r.clock) / FALL; n.el.style.top = (p * LINE) + '%';
          if (r.clock > n.t + .26) { n.done = true; n.el.classList.add('miss'); const e = n.el; setTimeout(() => e.remove(), 300); r.miss++; if (r.combo) { r.combo = 0; comboTxt(r); } judge('Trượt', 'm'); lionTo(1, 'sad'); sfx('error'); }
        }
      });
      if (r.clock > total - .3) r.over = true;
    }, total);
  };
  document.addEventListener('pointerdown', (e) => {
    const r = F.run; if (!r || r.done || r.type !== 'mualan') return;
    const b = e.target.closest('[data-drum]'), l = e.target.closest('.drum-lane');
    if (b) { e.preventDefault(); r.hit(+b.dataset.drum); } else if (l) { e.preventDefault(); r.hit(+l.dataset.lane); }
  });

  /* ======================================================================
     4. CHƠI CHUYỀN — nhặt đủ số que khi quả tung lên, rồi hứng quả đúng lúc
     ====================================================================== */
  F.EXTRA.chuyen = ['🤹', 'Chơi chuyền', 'Nhặt đủ que trước khi quả rơi, rồi hứng · 5 vòng', 'Xu + nguyên liệu']; F.extra.chuyen = 1;
  F.GUIDES.chuyen = ['🤹 Chơi chuyền', ['Mỗi vòng, quả được tung lên. Bấm “🤏 Nhặt” đủ số que của vòng (vòng 1 nhặt 1, vòng 2 nhặt 2…).', 'Ngay khi quả rơi xuống gần tay (vùng sáng), bấm “🖐️ Hứng”. Hứng sớm hoặc chưa nhặt đủ sẽ hỏng vòng.', 'Có 3 mạng. Qua đủ 5 vòng để nhận điểm tối đa; hứng thật chuẩn được thưởng thêm.']];
  F.custom.chuyen = (r, host) => {
    Object.assign(r, { score: 0, round: 1, lives: 3, picked: 0, phase: 'ready', t0: 0, T: 1.5, perfect: 0, cleared: 0 });
    shell(host, 'chuyen', `<h3>🤹 Chơi chuyền</h3><div class="x-hud"><span id="chRound">Vòng 1/5 · nhặt 1</span><span id="xScore">Điểm 0</span><span id="chLives">❤️❤️❤️</span></div>
      <div class="chuyen-stage" id="cs"><span class="ch-ball" id="cb">⚽</span><div class="ch-hand" id="ch"><i></i></div><div class="ch-ground" id="cg">${Array.from({ length: 5 }, (_, i) => `<span class="stone" data-st="${i}">🪨</span>`).join('')}</div><b class="ch-msg" id="cm">Sẵn sàng…</b></div>
      <div class="foot-row"><button class="btn gold big foot" data-pick>🤏 Nhặt</button><button class="btn gold big foot" data-catch>🖐️ Hứng</button></div>`);
    const cb = $('#cb'), cs = $('#cs'), cm = $('#cm'), lives = () => { const l = $('#chLives'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    const msg = (t, cls) => { cm.textContent = t; cm.className = 'ch-msg ' + (cls || ''); };
    const head = () => { const e = $('#chRound'); if (e) e.textContent = `Vòng ${r.round}/5 · nhặt ${r.round}`; };
    const resetStones = () => document.querySelectorAll('#cg .stone').forEach((s) => s.classList.remove('taken'));
    const toss = () => { r.phase = 'air'; r.t0 = performance.now(); r.picked = 0; r.T = Math.max(.85, 1.5 - r.round * .09); resetStones(); msg('Nhặt ' + r.round + ' que!', ''); sfx('whoosh'); head(); };
    const fail = (why) => {
      if (r.phase !== 'air') return; r.phase = 'wait'; r.lives--; lives(); FX.shake(cs); sfx('error'); G.buzz(40); msg(why, 'bad'); FX.at(cb, why, 'bad');
      if (r.lives <= 0) { r.timer = setTimeout(() => r.finish(), 800); } else r.timer = setTimeout(toss, 1100);
    };
    r.finish = () => F.finish(r, clamp(Math.round(r.score), 0, 30), `Qua ${r.cleared}/5 vòng, hứng hoàn hảo ${r.perfect} lần.`);
    r.pick = () => {
      if (r.done || r.phase !== 'air') return; if (r.picked >= r.round) return; const st = document.querySelector(`#cg .stone[data-st="${r.picked}"]`); r.picked++;
      if (st) st.classList.add('taken'); sfx('tap'); const b = st ? st.getBoundingClientRect() : null; if (b) FX.fly(b.left + 10, b.top, `${r.picked}/${r.round}`, ''); msg(r.picked >= r.round ? 'Đủ rồi — hứng quả!' : `Nhặt ${r.picked}/${r.round}`, r.picked >= r.round ? 'ok' : '');
    };
    r.catch = () => {
      if (r.done || r.phase !== 'air') return; const el = (performance.now() - r.t0) / 1000, d = r.T - el;
      if (r.picked < r.round) return fail('Chưa nhặt đủ!');
      if (d > .3) return fail('Hứng sớm!');
      r.phase = 'wait'; const perfect = Math.abs(d) < .1; r.cleared++; if (perfect) r.perfect++; const pts = r.round * 1.6 + (perfect ? 2 : 0); r.score += pts; setScore(r);
      FX.at(cb, perfect ? 'Hoàn hảo! +' + Math.round(pts) : 'Hứng được +' + Math.round(pts), perfect ? 'gold' : ''); FX.boom(cb.getBoundingClientRect().left + 16, cb.getBoundingClientRect().top + 16, ['✨', '⭐'], perfect ? 8 : 4); sfx(perfect ? 'levelup' : 'coin'); msg(perfect ? 'Hoàn hảo! ✨' : 'Hứng được!', 'ok');
      if (r.round >= 5) { FX.confetti(30); r.timer = setTimeout(() => r.finish(), 900); } else { r.round++; r.timer = setTimeout(toss, 1000); }
    };
    r.timer = setTimeout(toss, 900);
    const frame = () => {
      if (F.run !== r || r.done || !$('#cb')) return;
      if (r.phase === 'air') {
        const p = (performance.now() - r.t0) / 1000 / r.T, h = 4 * p * (1 - p), y = clamp(h, -.2, 1);
        cb.style.bottom = (22 + y * 48) + '%'; cb.style.transform = `translateX(-50%) rotate(${p * 540}deg)`;
        $('#ch').classList.toggle('ready', r.T - (performance.now() - r.t0) / 1000 < .3 && r.picked >= r.round);
        if (p > 1.12) fail('Rơi mất!');
      } else { cb.style.bottom = '22%'; $('#ch').classList.remove('ready'); }
      r.raf = requestAnimationFrame(frame);
    };
    r.raf = requestAnimationFrame(frame);
  };
  document.addEventListener('pointerdown', (e) => {
    const r = F.run; if (!r || r.done || r.type !== 'chuyen') return;
    const p = e.target.closest('[data-pick]'), c = e.target.closest('[data-catch]');
    if (p) { e.preventDefault(); r.pick(); p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); }
    if (c) { e.preventDefault(); r.catch(); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
  });

  /* ======================================================================
     5. NẶN TÒ HE — vẽ theo đường chấm để nặn hình
     ====================================================================== */
  F.EXTRA.tohe = ['🎨', 'Nặn tò he', 'Rê ngón tay theo nét chấm để nặn con vật · 40 giây', 'Xu + nguyên liệu']; F.extra.tohe = 1;
  F.GUIDES.tohe = ['🎨 Nặn tò he', ['Đặt ngón tay vào chấm xanh rồi rê theo đường nét chấm để nặn bột màu thành hình.', 'Giữ ngón tay sát đường nét: lệch xa sẽ giảm điểm “khéo tay”. Nhấc tay giữa chừng vẫn nặn tiếp được từ chỗ cũ.', 'Nặn xong 3 hình trong 40 giây để được điểm tối đa; xong sớm có điểm thưởng.']];
  const SHAPES = {
    tim: { name: 'Trái tim', col: '#ff6b8e', f: (t) => { const a = t * 6.2832; return [16 * Math.pow(Math.sin(a), 3), -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]; }, k: 7.6 },
    sao: { name: 'Ngôi sao', col: '#ffc233', f: (t) => { const n = 10, i = t * n, a = Math.floor(i), fr = i - a, p = (k) => { const ang = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? 6.2 : 15; return [Math.cos(ang) * rad, Math.sin(ang) * rad]; }, p0 = p(a), p1 = p(a + 1); return [p0[0] + (p1[0] - p0[0]) * fr, p0[1] + (p1[1] - p0[1]) * fr]; }, k: 9 },
    hoa: { name: 'Bông hoa', col: '#b07cff', f: (t) => { const a = t * 6.2832, r = 9 + 6 * Math.cos(5 * a); return [Math.cos(a) * r, Math.sin(a) * r]; }, k: 9 },
    cuon: { name: 'Vòng xoắn ốc', col: '#4fc3a1', f: (t) => { const a = t * 6.2832 * 2.2, r = 2 + t * 13; return [Math.cos(a) * r, Math.sin(a) * r]; }, k: 9.5, open: true },
    tron: { name: 'Mặt trời', col: '#ff9a3d', f: (t) => { const a = t * 6.2832, r = 13 + 2.2 * Math.sin(a * 12); return [Math.cos(a - Math.PI / 2) * r, Math.sin(a - Math.PI / 2) * r]; }, k: 9.6 }
  };
  F.custom.tohe = (r, host) => {
    const keys = Object.keys(SHAPES).sort(() => Math.random() - .5).slice(0, 3);
    Object.assign(r, { score: 0, combo: 0, best: 0, idx: 0, shape: 0, keys, done3: 0, off: 0, frames: 0, drawing: false, stroke: [], shapeScore: 0 });
    shell(host, 'tohe', `<h3>🎨 Nặn tò he</h3>${hud(40, '<span id="thName"></span>')}<div class="tohe-wrap"><canvas class="tohe-cv" id="tcv"></canvas><div class="tohe-done" id="thd"></div></div><p class="muted" style="margin:4px 0 0">Rê ngón tay theo nét chấm, bắt đầu từ chấm xanh</p>`);
    const cv = $('#tcv'), fgt = cv.closest('.folk-game'), availH = fgt && fgt.closest('.fg-stage') ? fgt.clientHeight - cv.offsetTop - 60 : 340, S = Math.floor(Math.min(cv.parentElement.clientWidth, availH, 460)) || 300, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = S + 'px'; cv.style.height = S + 'px'; cv.width = S * dpr; cv.height = S * dpr; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let pts = [], tol = 24;
    const build = () => {
      const def = SHAPES[keys[r.shape]], N = 90; pts = [];
      for (let i = 0; i <= N; i++) { const p = def.f(i / N); pts.push({ x: S / 2 + p[0] * def.k * S / 340 * 1.0, y: S / 2 + p[1] * def.k * S / 340 + 4 }); }
      r.pts = pts; r.idx = 0; r.stroke = []; r.off = 0; r.frames = 0; r.drawing = false; const n = $('#thName'); if (n) n.textContent = `${r.shape + 1}/3 · ${def.name}`;
    };
    build();
    const pos = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * S, y: (e.clientY - b.top) / b.height * S }; };
    const near = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
    const nextShape = (accuracy) => {
      const def = SHAPES[keys[r.shape]], bonus = Math.round(clamp(accuracy, 0, 1) * 4), pts2 = 8 + bonus; r.score += pts2; r.done3++; r.combo++; r.best = Math.max(r.best, r.combo); setScore(r); comboTxt(r);
      const d = $('#thd'); d.innerHTML = `<span>${['🐓', '🐉', '🐟', '🦐', '🐢'][r.shape % 5]}</span><b>${def.name} xong! +${pts2}</b>`; d.classList.remove('show'); void d.offsetWidth; d.classList.add('show');
      sfx('levelup'); FX.boom(window.innerWidth / 2, cv.getBoundingClientRect().top + S / 2, ['✨', '⭐', '🎨'], 10); G.buzz([20, 30, 40]);
      r.shape++; if (r.shape >= 3) { r.won = true; r.over = true; return; } r.lock = true; setTimeout(() => { r.lock = false; build(); }, 900);
    };
    track(cv, 'pointerdown', (e) => { if (r.lock) return; e.preventDefault(); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); const p = pos(e), need = r.idx === 0 ? pts[0] : pts[r.idx]; if (near(p, need) < 34) { r.drawing = true; r.stroke.push(p); } });
    track(cv, 'pointermove', (e) => {
      if (!r.drawing || r.lock) return; const p = pos(e); r.stroke.push(p); r.frames++;
      let best = 1e9; for (let i = Math.max(0, r.idx - 2); i < Math.min(pts.length, r.idx + 9); i++) { const d = near(p, pts[i]); if (d < best) best = d; if (d < 22 && i >= r.idx) { r.idx = i + 1; } }
      if (best > tol) r.off++;
      if (r.idx >= pts.length - 2) { r.drawing = false; nextShape(1 - r.off / Math.max(1, r.frames) * 1.6); }
    });
    const stop = () => { r.drawing = false; }; track(cv, 'pointerup', stop); track(cv, 'pointercancel', stop);
    r.end = () => { if (!r.won) { const part = r.shape < 3 ? Math.round(r.idx / pts.length * 8) : 0; r.score += part; } const sc = clamp(Math.round(r.score + (r.won ? r.left * .3 : 0)), 0, 30); if (r.won) FX.confetti(); F.finish(r, sc, r.won ? `Nặn xong cả 3 hình, còn dư ${Math.ceil(r.left)} giây!` : `Nặn xong ${r.done3}/3 hình.`); };
    const draw = (t) => {
      const def = SHAPES[keys[Math.min(r.shape, 2)]], g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#fff3d6'); g.addColorStop(1, '#f6d9a0'); ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = 'rgba(150,100,40,.12)'; ctx.lineWidth = 1; for (let i = 20; i < S; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke(); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(120,80,30,.45)'; ctx.setLineDash([2, 9]); ctx.lineWidth = 6; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
      if (r.idx > 1) { ctx.strokeStyle = def.col; ctx.lineWidth = 15; ctx.shadowColor = def.col; ctx.shadowBlur = 10; ctx.beginPath(); for (let i = 0; i < Math.min(r.idx, pts.length); i++) i ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < Math.min(r.idx, pts.length); i++) i ? ctx.lineTo(pts[i].x - 2, pts[i].y - 2) : ctx.moveTo(pts[i].x - 2, pts[i].y - 2); ctx.stroke(); }
      const nx = pts[Math.min(r.idx, pts.length - 1)], pulse = 1 + .25 * Math.sin(t / 160);
      ctx.fillStyle = r.idx === 0 ? '#2fb85a' : '#fff'; ctx.strokeStyle = def.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(nx.x, nx.y, 9 * pulse, 0, 6.3); ctx.fill(); ctx.stroke();
      if (r.drawing && r.stroke.length) { const l = r.stroke[r.stroke.length - 1]; ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.fillText('🥢', l.x + 10, l.y - 8); }
    };
    loop(r, () => draw(performance.now()), 40);
  };

  /* ======================================================================
     ĐẾM NGƯỢC 3-2-1 CHO CÁC TRÒ CÓ ĐỒNG HỒ
     ====================================================================== */
  const TIMED = F.TIMED = { dapnieu: 1, batvit: 1, keoco: 1, denlong: 1, baobo: 1, nhaydday: 1, thadieu: 1, rongran: 1, mualan: 1, chuyen: 1, tohe: 1 };
  const prevStart = F.start;
  F.start = function (type) {
    if (F.run && !F.run.done) return;
    if (!TIMED[type] || reduce()) return prevStart.apply(this, arguments);
    const host = $('#festivalGame'); if (!host) return;
    const meta = F.EXTRA[type] || ['🎮', type, '', ''], g = F.GUIDES[type] || [meta[1], []];
    const r = F.run = { type, done: false, pending: true, start: performance.now() };
    host.innerHTML = `<div class="folk-game game-${type} cd-wrap"><div class="cd-card"><div class="cd-icon">${meta[0]}</div><h3>${meta[1]}</h3><ul>${g[1].slice(0, 2).map((x) => `<li>${x}</li>`).join('')}</ul><div class="cd-num" id="cdn">3</div><div class="cd-bar"><i></i></div></div><button class="btn ghost sm" data-faction="leave">Rời trò chơi</button></div>`;
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    let n = 3; sfx('tick');
    const step = () => {
      if (F.run !== r) return; n--; const el = $('#cdn'); if (!el) return;
      if (n > 0) { el.textContent = n; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); sfx('tick'); r.timer = setTimeout(step, 650); }
      else { el.textContent = 'BẮT ĐẦU!'; el.classList.add('go'); sfx('gong'); r.timer = setTimeout(() => { if (F.run !== r) return; F.run = null; prevStart.call(F, type); }, 480); }
    };
    r.timer = setTimeout(step, 650);
  };

  /* ======================================================================
     THANH THỜI GIAN + HẠT TRANG TRÍ CHO MỌI VÁN
     ====================================================================== */
  setInterval(() => {
    const r = F.run, t = $('#xTime'); if (!r || r.done || !t) return;
    const hudEl = t.parentElement, s = parseInt((t.textContent.match(/\d+/) || [])[0], 10); if (isNaN(s)) return;
    let bar = $('.x-bar', hudEl.parentElement);
    if (!bar) { hudEl.insertAdjacentHTML('afterend', '<div class="x-bar"><i></i></div>'); bar = $('.x-bar', hudEl.parentElement); r._tot = s; }
    r._tot = Math.max(r._tot || s, s); bar.firstChild.style.width = (s / r._tot * 100) + '%'; bar.classList.toggle('low', s <= 5);
    if (s <= 5 && r._lastTick !== s && s > 0) { r._lastTick = s; sfx('tick'); }
  }, 120);
  const ICONS = { default: ['🌸', '🏮', '✨'], dapnieu: ['🏺', '✨', '💨'], batvit: ['💧', '🫧', '🌸'], keoco: ['💪', '✨', '🚩'], denlong: ['🏮', '✨', '🌙'], baobo: ['💨', '🍃', '✨'], nhaydday: ['✨', '🎶', '🌸'], thadieu: ['🌸', '☁️', '✨'], rongran: ['☁️', '✨', '🍬'], mualan: ['🎊', '🏮', '✨'], chuyen: ['🌸', '✨', '🍃'], tohe: ['🎨', '✨', '🌸'], throw: ['🎊', '✨', '🏮'], memory: ['✨', '🌸', '🧺'], oanquan: ['🌸', '✨', '🏮'] };
  let ambT = 0;
  new MutationObserver(() => {
    if (ambT) return;
    ambT = setTimeout(() => {
      ambT = 0; const g = $('#festivalGame .folk-game'); if (!g || g.querySelector('.fg-amb') || reduce() || document.body.dataset.quality === '0') return;
      const set = ICONS[(F.run && F.run.type) || ''] || ICONS.default;
      let h = '<div class="fg-amb" aria-hidden="true">'; for (let i = 0; i < 8; i++) h += `<span style="left:${rnd(2, 96).toFixed(0)}%;--d:${rnd(6, 11).toFixed(1)}s;--dl:${(-rnd(0, 10)).toFixed(1)}s;--s:${rnd(12, 20).toFixed(0)}px">${set[i % set.length]}</span>`; g.insertAdjacentHTML('afterbegin', h + '</div>');
    }, 120);
  }).observe(document.body, { childList: true, subtree: true });

  /* ======================================================================
     KỶ LỤC + SAO TỪNG TRÒ, NHẬN THƯỞNG CÓ MƯA XU
     ====================================================================== */
  const bests = () => { const f = G.S.flags; if (!f.festBest) f.festBest = {}; return f.festBest; };
  const starsOf = (s) => (s >= 20 ? 3 : s >= 10 ? 2 : s > 0 ? 1 : 0);
  const finish = F.finish;
  F.finish = function (r, score, text) {
    const was = r && r.done; finish.call(this, r, score, text);
    if (was || !r || !r.done || r !== F.run) return;
    const b = bests(), old = b[r.type] || 0, res = $('#folkResult');
    if (score > old) { b[r.type] = score; G.save(); if (res && score > 0) res.insertAdjacentHTML('afterbegin', `<div class="fg-record">🏆 ${old ? 'Kỷ lục mới!' : 'Lần đầu hoàn thành!'} <b>${score}</b>${old ? ` <small>(trước đó ${old})</small>` : ''}</div>`); if (score >= 10) sfx('win'); }
    else if (res && old > 0) res.insertAdjacentHTML('afterbegin', `<div class="fg-record soft">Kỷ lục của bạn: <b>${old}</b></div>`);
    if (score > 0 && window.UI && window.UI.vfx) { const rc = (res || document.body).getBoundingClientRect(); window.UI.vfx.spawnCoins(window.innerWidth / 2, Math.max(60, rc.top + 10), score >= 20 ? 14 : 7); }
  };

  /* ======================================================================
     TRANG HỘI LÀNG: chia nhóm, kỷ lục, nhãn MỚI, hero động
     ====================================================================== */
  const GROUPS = [
    ['🏃', 'Vận động & phản xạ', ['dapnieu', 'batvit', 'keoco', 'baobo', 'nhaydday', 'denlong']],
    ['🎶', 'Nhịp điệu & khéo tay', ['mualan', 'chuyen', 'tohe', 'throw']],
    ['🌤️', 'Phiêu lưu bầu trời', ['thadieu', 'rongran']],
    ['🧠', 'Trí tuệ dân gian', ['oanquan', 'memory']]
  ];
  F.GROUPS = GROUPS; const NEW = F.NEW = { thadieu: 1, rongran: 1, mualan: 1, chuyen: 1, tohe: 1 };
  const mount = F.mount;
  F.mount = function (host) {
    mount.apply(this, arguments);
    const cards = host.querySelector('.festival-cards'); if (!cards) return;
    const by = {}; cards.querySelectorAll('[data-fgame]').forEach((b) => { by[b.dataset.fgame] = b; });
    const wrap = document.createElement('div'); wrap.className = 'fest-groups'; const b = bests(); let totalStars = 0, played = 0;
    GROUPS.forEach(([ic, title, ids]) => {
      const list = ids.filter((id) => by[id]); if (!list.length) return;
      const sec = document.createElement('section'); sec.className = 'fest-sec'; sec.innerHTML = `<h4 class="fest-h"><span>${ic}</span>${title}<em>${list.length} trò</em></h4>`;
      const box = document.createElement('div'); box.className = 'festival-cards';
      list.forEach((id, i) => {
        const el = by[id], s = starsOf(b[id] || 0); totalStars += s; if (b[id]) played++;
        el.dataset.cat = ic; el.style.setProperty('--i', i);
        const ico = el.querySelector(':scope > i'); if (ico && window.gameIcon && window.gameIcon(id)) { ico.innerHTML = window.gameIcon(id, 66); ico.classList.add('gi-wrap'); }
        if (NEW[id]) el.insertAdjacentHTML('beforeend', '<span class="fg-new">MỚI</span>');
        const meta = el.querySelector('div > span'); if (meta) meta.insertAdjacentHTML('beforeend', ` <u class="fg-stars">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</u>${b[id] ? ` · 🏆 ${b[id]}` : ''}`);
        box.appendChild(el);
      });
      sec.appendChild(box); wrap.appendChild(sec);
    });
    cards.replaceWith(wrap);
    const hero = host.querySelector('.festival-hero');
    if (hero) {
      hero.insertAdjacentHTML('beforeend', `<div class="fh-deco" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i style="left:${6 + i * 11}%;--d:${(5 + (i % 4) * 1.3).toFixed(1)}s;--dl:${(-i * .9).toFixed(1)}s">${['🌸', '🏮', '✨'][i % 3]}</i>`).join('')}</div><div class="fh-stat">⭐ ${totalStars}/${Object.keys(by).length * 3} sao · 🎮 ${played}/${Object.keys(by).length} trò đã chơi</div>`);
    }
  };
})();
