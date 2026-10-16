/* Hội làng (phần 2): hiệu ứng bay/nhảy/nổ/lướt/combo, 3 trò mới (Hứng lồng đèn, Nhảy bao bố, Nhảy dây),
   điểm số + sao cho mọi trò, và hiệu ứng cho các trò cũ */
(function () {
  'use strict';
  const F = window.Festival, $ = (q) => document.querySelector(q), rnd = (a, b) => a + Math.random() * (b - a);
  const reduce = () => document.body.classList.contains('reduce-motion');
  const sfx = (t) => window.Audio2.sfx(t);

  /* ---------- bộ hiệu ứng dùng chung ---------- */
  const FX = F.FX = {
    fly(x, y, txt, cls) { if (reduce()) return; const e = document.createElement('span'); e.className = 'fx-fly ' + (cls || ''); e.textContent = txt; e.style.left = x + 'px'; e.style.top = y + 'px'; document.body.appendChild(e); setTimeout(() => e.remove(), 950); },
    at(el, txt, cls) { if (!el) return; const b = el.getBoundingClientRect(); FX.fly(b.left + b.width / 2, b.top + b.height / 3, txt, cls); },
    boom(x, y, set, n) {
      if (reduce()) return; set = set || ['💥', '✨', '🔥']; n = n || 8;
      for (let i = 0; i < n; i++) { const e = document.createElement('span'), a = (i / n) * 6.283 + rnd(0, .5), m = rnd(40, 90); e.className = 'fx-boom'; e.textContent = set[i % set.length]; e.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * m}px;--dy:${Math.sin(a) * m}px`; document.body.appendChild(e); setTimeout(() => e.remove(), 700); }
    },
    confetti(n) { if (reduce()) return; for (let i = 0; i < (n || 26); i++) { const e = document.createElement('i'); e.className = 'fx-conf'; e.style.cssText = `left:${rnd(5, 95)}vw;background:hsl(${rnd(0, 360)},85%,60%);--sx:${rnd(-60, 60)}px;animation-delay:${rnd(0, .4)}s`; document.body.appendChild(e); setTimeout(() => e.remove(), 1900); } },
    shake(el) { if (!el || reduce()) return; el.classList.remove('fx-shake'); void el.offsetWidth; el.classList.add('fx-shake'); },
    pulse(el) { if (!el) return; el.classList.remove('fx-pulse'); void el.offsetWidth; el.classList.add('fx-pulse'); },
    combo(r, el) { r.combo = (r.combo || 0) + 1; r.best = Math.max(r.best || 0, r.combo); const c = $('#xCombo'); if (c) { c.textContent = r.combo > 1 ? `🔥 x${r.combo}` : ''; FX.pulse(c); } if (r.combo > 0 && r.combo % 5 === 0) { FX.at(el, `COMBO x${r.combo}!`, 'big'); sfx('levelup'); } },
    mult: (r) => 1 + Math.min(2, Math.floor((r.combo || 0) / 5))
  };
  const hud = (t, extra) => `<div class="x-hud"><span id="xTime">⏱ ${t}</span><span id="xScore">Điểm 0</span><span id="xCombo" class="combo-pill"></span>${extra || ''}</div>`;
  const setScore = (r) => { const s = $('#xScore'); if (s) { s.textContent = 'Điểm ' + r.score; FX.pulse(s); } };
  const shell = (host, type, body) => { host.innerHTML = `<div class="folk-game game-${type}">${body}<div id="folkResult" role="status"></div><button class="btn ghost sm" data-faction="leave">Rời trò chơi</button></div>`; host.scrollIntoView({ behavior: reduce() ? 'instant' : 'smooth', block: 'start' }); };
  const loop = (r, fn, secs) => {
    r.left = secs; let last = performance.now();
    const frame = (t) => {
      if (F.run !== r || r.done || window.UI.page !== 'festival' || !$('#xTime')) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t; r.left -= dt; fn(dt);
      const tm = $('#xTime'); if (tm) tm.textContent = '⏱ ' + Math.max(0, Math.ceil(r.left));
      if (r.left <= 0 || r.over) return r.end();
      r.raf = requestAnimationFrame(frame);
    };
    r.raf = requestAnimationFrame(frame);
  };

  /* ---------- 1. Hứng lồng đèn ---------- */
  F.EXTRA.denlong = ['🏮', 'Hứng lồng đèn', 'Kéo giỏ hứng lồng đèn, né pháo nổ · 25 giây', 'Xu + nguyên liệu']; F.extra.denlong = 1;
  F.GUIDES.denlong = ['🏮 Hứng lồng đèn', ['Lồng đèn rơi từ trên xuống. Kéo ngón tay (hoặc chạm trái/phải) để di chuyển giỏ hứng.', 'Lồng đèn đỏ +1, lồng vàng +3 và đem lại combo. Cứ 5 combo là tăng hệ số điểm.', 'Né quả pháo 💣: hứng trúng sẽ nổ, trừ điểm và mất combo.']];
  F.custom.denlong = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, x: 50, items: [], next: 0.3 });
    shell(host, 'denlong', `<h3>🏮 Hứng lồng đèn</h3>${hud(25)}<div class="lantern-field" id="lf"><span class="basket" id="bk">🧺</span></div>`);
    const lf = $('#lf'), bk = $('#bk'), mv = (e) => { const b = lf.getBoundingClientRect(); r.x = Math.max(8, Math.min(92, (e.clientX - b.left) / b.width * 100)); };
    lf.addEventListener('pointerdown', (e) => { mv(e); lf.setPointerCapture && lf.setPointerCapture(e.pointerId); r.drag = true; });
    lf.addEventListener('pointermove', (e) => { if (r.drag) mv(e); }); lf.addEventListener('pointerup', () => { r.drag = false; });
    r.end = () => F.finish(r, Math.min(30, Math.round(r.score * 0.7)), `Hứng được ${r.score} điểm (combo cao nhất ${r.best}).`);
    let fw = lf.clientWidth, fh = lf.clientHeight;
    loop(r, (dt) => {
      if (r.t % 1 < dt) { fw = lf.clientWidth; fh = lf.clientHeight; }
      bk.style.left = r.x + '%'; r.next -= dt;
      if (r.next <= 0) { const k = Math.random(), kind = k < .16 ? 'bomb' : k < .34 ? 'gold' : 'red', e = document.createElement('span'); e.className = 'lant ' + kind; e.textContent = kind === 'bomb' ? '💣' : '🏮'; const x = rnd(8, 92); e.style.left = '0'; e.style.top = '0'; lf.appendChild(e); r.items.push({ e, x, y: -10, v: rnd(34, 52) + (25 - r.left) * 1.4, kind, rot: rnd(-2, 2) }); r.next = rnd(.35, .75); }
      r.items = r.items.filter((it) => {
        it.y += it.v * dt; it.e.style.transform = `translate3d(${it.x / 100 * fw}px, ${it.y / 100 * fh}px, 0) translateX(-50%) rotate(${Math.sin(it.y / 8 + it.rot) * 14}deg)`;
        const hit = it.y > 78 && it.y < 96 && Math.abs(it.x - r.x) < 11, b = hit ? it.e.getBoundingClientRect() : null;
        if (hit) {
          if (it.kind === 'bomb') { r.score = Math.max(0, r.score - 3); r.combo = 0; FX.boom(b.left + b.width / 2, b.top, ['💥', '🔥', '💨'], 10); FX.shake(lf); sfx('error'); window.Game.buzz(50); FX.at(it.e, '−3', 'bad'); const c = $('#xCombo'); if (c) c.textContent = ''; }
          else { FX.combo(r, it.e); const pts = (it.kind === 'gold' ? 3 : 1) * FX.mult(r); r.score += pts; FX.at(it.e, '+' + pts, it.kind === 'gold' ? 'gold' : ''); sfx('coin'); FX.pulse(bk); }
          setScore(r); it.e.remove(); return false;
        }
        if (it.y > 104) { if (it.kind !== 'bomb') { r.combo = 0; const c = $('#xCombo'); if (c) c.textContent = ''; } it.e.remove(); return false; }
        return true;
      });
    }, 25);
  };

  /* ---------- 2. Nhảy bao bố ---------- */
  F.EXTRA.baobo = ['🏃', 'Nhảy bao bố', 'Bấm luân phiên hai chân để chạy tới đích · 15 giây', 'Xu + nguyên liệu']; F.extra.baobo = 1;
  F.GUIDES.baobo = ['🏃 Nhảy bao bố', ['Bấm luân phiên nút “Chân trái” và “Chân phải” thật nhanh để nhảy lên phía trước.', 'Bấm trùng một chân hai lần sẽ vấp, mất tốc độ và mất combo.', 'Về đích trong 15 giây để thắng; về càng sớm điểm càng cao.']];
  F.custom.baobo = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, dist: 0, last: '', speed: 0 });
    shell(host, 'baobo', `<h3>🏃 Nhảy bao bố</h3>${hud(15)}<div class="track" id="tk"><span class="finish">🏁</span><span class="runner" id="rn">🧒</span><i class="lane"></i></div><div class="foot-row"><button class="btn gold big foot" data-foot="L">🦶 Chân trái</button><button class="btn gold big foot" data-foot="R">Chân phải 🦶</button></div>`);
    const rn = $('#rn'), tk = $('#tk');
    r.press = (f, btn) => {
      if (r.done) return; const b = rn.getBoundingClientRect();
      if (f !== r.last) { r.dist += 3.4 + Math.min(2.5, r.combo * 0.12); r.speed = 1; FX.combo(r, rn); r.score += FX.mult(r); setScore(r); rn.classList.remove('hop'); void rn.offsetWidth; rn.classList.add('hop'); FX.boom(b.left, b.top + b.height, ['💨'], 2); sfx('tap'); }
      else { r.dist = Math.max(0, r.dist - 2); r.combo = 0; r.speed = 0; FX.at(rn, 'Vấp!', 'bad'); FX.shake(tk); const c = $('#xCombo'); if (c) c.textContent = ''; sfx('error'); window.Game.buzz(40); }
      r.last = f; btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      if (r.dist >= 100) { r.won = true; r.over = true; }
    };
    r.end = () => { const bonus = r.won ? Math.round(r.left * 2) : 0; r.score += bonus; if (r.won) FX.confetti(); F.finish(r, Math.min(30, Math.round(r.dist / 4) + bonus + Math.round(r.best / 2)), r.won ? `Về đích! Còn dư ${Math.ceil(r.left)} giây (+${bonus} điểm).` : `Hết giờ, mới chạy được ${Math.round(r.dist)}%.`); };
    loop(r, () => { r.dist = Math.max(0, r.dist - 0.12); rn.style.left = Math.min(90, r.dist * .9) + '%'; }, 15);
  };

  /* ---------- 3. Nhảy dây ---------- */
  F.EXTRA.nhaydday = ['🪢', 'Nhảy dây', 'Nhấn đúng nhịp để nhảy qua dây · 3 mạng', 'Xu + nguyên liệu']; F.extra.nhaydday = 1;
  F.GUIDES.nhaydday = ['🪢 Nhảy dây', ['Sợi dây quay quanh người. Khi dây tới gần chân (vùng xanh), nhấn “Nhảy!”.', 'Nhấn chuẩn giữa vùng xanh được “Hoàn hảo” (+3), lệch một chút được “Tốt” (+1).', 'Nhảy hụt hoặc nhấn sai lúc sẽ mất 1 mạng (3 mạng). Dây quay nhanh dần.']];
  F.custom.nhaydday = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, lives: 3, ang: 0, speed: 2.4, jumped: false, cleared: 0, wasIn: false });
    shell(host, 'nhayday', `<h3>🪢 Nhảy dây</h3>${hud(40, '<span id="xLives">❤️❤️❤️</span>')}<div class="rope-stage" id="rs"><div class="rope-ring" id="rr"></div><span class="jumper" id="jp">🧒</span><div class="rope-zone"></div></div><button class="btn gold big jump-btn" data-jump>Nhảy! ⤴</button>`);
    const rr = $('#rr'), jp = $('#jp'), lives = () => { const l = $('#xLives'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    const inZone = () => { const a = ((r.ang % 360) + 360) % 360; return Math.min(Math.abs(a - 180), 360) < 38 ? Math.abs(a - 180) : null; };
    r.jump = (btn) => {
      if (r.done || r.jumped) return; r.jumped = true; jp.classList.remove('up'); void jp.offsetWidth; jp.classList.add('up'); setTimeout(() => { r.jumped = false; }, 520);
      const d = inZone(), b = jp.getBoundingClientRect();
      if (d == null || d > 38) { r.lives--; r.combo = 0; lives(); FX.at(jp, 'Hụt!', 'bad'); FX.shake($('#rs')); sfx('error'); window.Game.buzz(50); const c = $('#xCombo'); if (c) c.textContent = ''; if (r.lives <= 0) r.over = true; }
      else { const perfect = d < 14; FX.combo(r, jp); const pts = (perfect ? 3 : 1) * FX.mult(r); r.score += pts; setScore(r); FX.at(jp, perfect ? 'Hoàn hảo! +' + pts : 'Tốt +' + pts, perfect ? 'gold' : ''); if (perfect) FX.boom(b.left + b.width / 2, b.top + b.height, ['✨', '⭐'], 6); sfx(perfect ? 'coin' : 'tap'); r.cleared++; r.speed = Math.min(6.5, 2.4 + r.cleared * 0.09); }
    };
    r.end = () => F.finish(r, Math.min(30, Math.round(r.score * 0.8)), `Nhảy qua ${r.cleared} vòng dây, ${r.score} điểm (combo cao nhất ${r.best}).`);
    loop(r, (dt) => { r.ang += r.speed * 360 * 0.5 * dt; rr.style.setProperty('--a', r.ang + 'deg'); const z = inZone(); if (r.wasIn && z == null && !r.jumpedThis) { /* dây đã qua mà chưa nhảy */ } r.wasIn = z != null; }, 40);
  };

  /* ---------- nút bấm của trò mới ---------- */
  document.addEventListener('pointerdown', (e) => {
    const r = F.run; if (!r || r.done) return;
    const f = e.target.closest('[data-foot]'); if (f && r.type === 'baobo') { e.preventDefault(); r.press(f.dataset.foot, f); return; }
    const j = e.target.closest('[data-jump]'); if (j && r.type === 'nhaydday') { e.preventDefault(); r.jump(j); }
  });

  /* ---------- tổng kết có sao + pháo giấy cho mọi trò ---------- */
  const fin = F.finish;
  F.finish = function (r, score, text) {
    const stars = score >= 20 ? 3 : score >= 10 ? 2 : score > 0 ? 1 : 0;
    fin(r, score, text);
    const res = $('#folkResult'); if (res) res.insertAdjacentHTML('afterbegin', `<div class="fx-stars">${[1, 2, 3].map((i) => `<i class="${i <= stars ? 'on' : ''}" style="animation-delay:${i * .18}s">★</i>`).join('')}</div><div class="fx-score">Điểm ván: <b>${score}</b></div>`);
    if (stars >= 2) FX.confetti(stars === 3 ? 40 : 22); if (stars === 3) sfx('levelup');
  };

  /* ---------- hiệu ứng + điểm cho 3 trò cũ ---------- */
  document.addEventListener('click', (e) => {
    const r = F.run; if (!r || r.done && r.type !== 'oanquan') return;
    const b = e.target.closest('[data-faction]'); if (!b) return; const a = b.dataset.faction;
    if (r.type === 'throw' && a === 'throw') {
      const hit = r.hits > (r._h || 0); r._h = r.hits; const ball = $('.throw-ball');
      if (hit) { r.combo = (r.combo || 0) + 1; FX.at(ball, `+5${r.combo > 1 ? ' x' + r.combo : ''}`, 'gold'); FX.boom(window.innerWidth / 2, ball.getBoundingClientRect().top - 60, ['✨', '⭐'], 8); FX.pulse($('.throw-hoop')); }
      else { r.combo = 0; FX.at(ball, 'Chệch', 'bad'); }
      let h = $('#xhud'); if (!h) { $('.folk-game h3').insertAdjacentHTML('afterend', '<div class="x-hud" id="xhud"><span id="xt"></span><span id="xs"></span></div>'); h = $('#xhud'); }
      $('#xt').textContent = `Ném ${r.shots}/5`; $('#xs').textContent = `Điểm ${r.hits * 5}${r.combo > 1 ? ' · 🔥x' + r.combo : ''}`;
    } else if (r.type === 'memory' && a === 'flip') {
      setTimeout(() => {
        const m = r.matched.length / 2; if (m > (r._m || 0)) { r._m = m; r.combo = (r.combo || 0) + 1; const el = $(`[data-index="${r.matched[r.matched.length - 1]}"]`); FX.at(el, `Cặp ${m}! ${r.combo > 1 ? '🔥x' + r.combo : ''}`, 'gold'); FX.boom(el.getBoundingClientRect().left + 20, el.getBoundingClientRect().top, ['✨', '⭐'], 6); sfx('coin'); }
        else if (r.chosen.length === 0 && r.tries > (r._t || 0)) { r.combo = 0; }
        r._t = r.tries;
        let h = $('#xhud'); if (!h) { $('.folk-game h3').insertAdjacentHTML('afterend', '<div class="x-hud" id="xhud"><span id="xt"></span><span id="xs"></span></div>'); }
        $('#xt').textContent = `Lần thử ${r.tries}/18`; $('#xs').textContent = `Điểm ${r.matched.length}${r.combo > 1 ? ' · 🔥x' + r.combo : ''}`;
      }, 60);
    } else if (r.type === 'oanquan' && a === 'pit') {
      setTimeout(() => { const t = r.banks[0] + r.banks[1]; if (t > (r._b || 0)) { FX.fly(window.innerWidth / 2, window.innerHeight / 2, `💥 Ăn +${t - (r._b || 0)}`, 'big'); FX.boom(window.innerWidth / 2, window.innerHeight / 2, ['💥', '⭐'], 8); sfx('coin'); } r._b = t; }, 80);
    }
  });
})();
