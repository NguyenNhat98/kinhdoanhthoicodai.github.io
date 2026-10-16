/* Hội làng (phần 6): 5 trò dân gian mới — Nhảy lò cò, Thả thuyền giấy, Cờ cá ngựa, Bắn nỏ, Mò cua bắt ốc. Mọi hình vẽ quay đúng hướng di chuyển. */
(function () {
  'use strict';
  const F = window.Festival, G = window.Game, FX = F.FX, H = F.H, GA = window.GameArt, GI = window.GameIcons;
  const $ = (q, r) => (r || document).querySelector(q);
  const { hud, setScore, comboTxt, shell, loop, track, clamp, rnd } = H;
  const reduce = () => document.body.classList.contains('reduce-motion');
  const sfx = (t) => window.Audio2.sfx(t);
  const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const SV = (body) => `<svg class="ga" viewBox="0 0 64 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

  /* ---------- hình vẽ mới (đầu/mũi luôn hướng PHẢI trừ khi ghi chú) ---------- */
  const ART = {
    paperboat: `<defs>${grad('pb1', '#fffaf0', '#e8dcc0')}</defs><path d="M4 38h56l-10 14H14z" fill="url(#pb1)" stroke="#8a7a5a" stroke-width="2.2" stroke-linejoin="round"/><path d="M32 8l16 30H32z" fill="#fff" stroke="#8a7a5a" stroke-width="2.2" stroke-linejoin="round"/><path d="M32 8L16 38h16z" fill="#f0e4cc" stroke="#8a7a5a" stroke-width="2.2" stroke-linejoin="round"/><path d="M32 8v30" stroke="#c8b898" stroke-width="1.6"/>`,
    lotus: `<ellipse cx="32" cy="46" rx="26" ry="9" fill="#3a9a4a" stroke="#1f6a2a" stroke-width="2"/><g fill="#ffb0d0" stroke="#d8508a" stroke-width="1.8" stroke-linejoin="round"><path d="M32 40C22 30 22 16 32 8c10 8 10 22 0 32z"/><path d="M30 40C16 36 10 24 14 16c12 0 18 12 16 24z" fill="#ffc8de"/><path d="M34 40C48 36 54 24 50 16c-12 0-18 12-16 24z" fill="#ffc8de"/></g><circle cx="32" cy="30" r="3.4" fill="#ffd54a"/>`,
    horse: `<defs>${grad('hs1', '#e8b878', '#a8703a')}</defs><path d="M10 52V36q0-12 12-16l4-10 6 6q14 0 18 12l4 10v14h-8V44H30v8z" fill="url(#hs1)" stroke="#5a3410" stroke-width="2.2" stroke-linejoin="round"/><path d="M26 10l-4 12" stroke="#3a2010" stroke-width="3.4" stroke-linecap="round"/><circle cx="36" cy="22" r="2" fill="#2a1a08"/><path d="M10 38q-6 4-4 14" stroke="#3a2010" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M46 28q8 2 10 8" stroke="#a8703a" stroke-width="0"/>`,
    dice: `<rect x="8" y="8" width="48" height="48" rx="10" fill="#fff" stroke="#8a1a10" stroke-width="3"/><g fill="#c8201a"><circle cx="22" cy="22" r="4.4"/><circle cx="42" cy="22" r="4.4"/><circle cx="32" cy="32" r="4.4"/><circle cx="22" cy="42" r="4.4"/><circle cx="42" cy="42" r="4.4"/></g>`,
    crossbow: `<path d="M8 32h46" stroke="#6a4a2a" stroke-width="5" stroke-linecap="round"/><path d="M20 12q-6 20 0 40" stroke="#8a5a2a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M20 12l24 20-24 20" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M44 32l10 0-4-4M54 32l-4 4" stroke="#444" stroke-width="2.6" stroke-linecap="round"/><path d="M30 32v-8h8v8" stroke="#6a4a2a" stroke-width="3" fill="none"/>`,
    arrow: `<path d="M6 32h46" stroke="#8a5a2a" stroke-width="3.6" stroke-linecap="round"/><path d="M52 24l10 8-10 8z" fill="#bbb" stroke="#555" stroke-width="2" stroke-linejoin="round"/><path d="M6 32l-4-8M6 32l-4 8M14 32l-4-8M14 32l-4 8" stroke="#e0301f" stroke-width="3" stroke-linecap="round"/>`,
    target: `<circle cx="32" cy="32" r="28" fill="#fff" stroke="#8a1a10" stroke-width="2.4"/><circle cx="32" cy="32" r="22" fill="#e0301f"/><circle cx="32" cy="32" r="15" fill="#fff"/><circle cx="32" cy="32" r="9" fill="#e0301f"/><circle cx="32" cy="32" r="3.6" fill="#ffd54a"/>`,
    crab: `<defs>${grad('cr1', '#ff8a6a', '#d8402a')}</defs><ellipse cx="32" cy="38" rx="18" ry="12" fill="url(#cr1)" stroke="#8a2010" stroke-width="2.2"/><path d="M14 32q-8-4-8-12 6 2 10 8zM50 32q8-4 8-12-6 2-10 8z" fill="#ff8a6a" stroke="#8a2010" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 42l-8 4M14 48l-6 8M52 42l8 4M50 48l6 8" stroke="#8a2010" stroke-width="3" stroke-linecap="round"/><circle cx="26" cy="28" r="3.4" fill="#fff" stroke="#8a2010" stroke-width="1.4"/><circle cx="38" cy="28" r="3.4" fill="#fff" stroke="#8a2010" stroke-width="1.4"/><circle cx="26" cy="28" r="1.4" fill="#2a1a08"/><circle cx="38" cy="28" r="1.4" fill="#2a1a08"/>`,
    snail: `<defs>${grad('sn1', '#e8c070', '#a8782a')}</defs><path d="M6 52q0-4 6-4h40q4 0 4 4t-4 4H12q-6 0-6-4z" fill="#d8c8a0" stroke="#8a7a5a" stroke-width="2"/><path d="M14 48V34" stroke="#d8c8a0" stroke-width="4" stroke-linecap="round"/><circle cx="14" cy="32" r="3" fill="#2a1a08"/><circle cx="34" cy="34" r="16" fill="url(#sn1)" stroke="#6a4a14" stroke-width="2.4"/><path d="M34 34m-9 0a9 9 0 1 0 9-9M34 34m-4 0a4 4 0 1 0 4-4" fill="none" stroke="#6a4a14" stroke-width="2"/>`,
    boot: `<path d="M18 8h20v26l12 8q6 6 0 12H14q-4 0-4-6z" fill="#6a4a2a" stroke="#3a2410" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 8h20" stroke="#8a6a3a" stroke-width="4"/>`,
    hopkid: `<ellipse cx="32" cy="60" rx="12" ry="3" fill="#000" opacity=".15"/><path d="M24 62l1-22q7-5 14 0l1 22z" fill="#e0508a" stroke="#7a1a40" stroke-width="1.8" stroke-linejoin="round"/><circle cx="32" cy="26" r="11" fill="#ffd9ae" stroke="#a06a2a" stroke-width="1.8"/><path d="M20 22q12-14 24 0z" fill="#2a1a1a"/><circle cx="20" cy="22" r="5" fill="#2a1a1a"/><circle cx="44" cy="22" r="5" fill="#2a1a1a"/><circle cx="28" cy="27" r="1.4" fill="#2a1a08"/><circle cx="36" cy="27" r="1.4" fill="#2a1a08"/><path d="M29 31q3 2 6 0" stroke="#b0402a" stroke-width="1.4" fill="none"/><path d="M26 62l-4 0M40 62l6-8" stroke="#5a3a1a" stroke-width="3.2" stroke-linecap="round"/>`
  };
  Object.keys(ART).forEach((k) => { GA.art[k] = SV(ART[k]); GA.img(k); });
  const ICO = {
    nhayloco: `<g fill="#ffe27a" stroke="#a87a1a" stroke-width="2"><rect x="22" y="4" width="20" height="16" rx="2"/><rect x="22" y="22" width="20" height="16" rx="2" fill="#ffc2d8" stroke="#a02a5a"/><rect x="6" y="40" width="20" height="16" rx="2"/><rect x="28" y="40" width="20" height="16" rx="2"/></g><g transform="translate(26 6) scale(.55)">${ART.hopkid}</g>`,
    thuyengiay: ART.paperboat, cocangua: ART.horse, bannu: ART.target, moccua: ART.crab
  };
  Object.keys(ICO).forEach((k) => { GI[k] = (s) => `<svg class="gi" viewBox="0 0 64 64" width="${s || 56}" height="${s || 56}" aria-hidden="true">${ICO[k]}</svg>`; });
  GI.keys = Object.keys(GI).filter((k) => typeof GI[k] === 'function' && k !== 'keys');
  const art = (n, cls) => `<span class="ga-host ${cls || ''}">${GA.art[n] || ''}</span>`;

  /* ======================================================================
     1. NHẢY LÒ CÒ — 1 chân cho ô đơn, 2 chân cho ô đôi, đúng hạn
     ====================================================================== */
  F.EXTRA.nhayloco = ['🦶', 'Nhảy lò cò', 'Ô đơn bấm 1 chân, ô đôi bấm 2 chân · 30 giây', 'Xu + nguyên liệu']; F.extra.nhayloco = 1;
  F.GUIDES.nhayloco = ['🦶 Nhảy lò cò', ['Các ô vuông trượt xuống. Ô ĐƠN: bấm “1 chân”. Ô ĐÔI (hai ô liền nhau): bấm “2 chân”.', 'Bấm đúng loại khi ô chạm vạch vàng (đúng +2, hoàn hảo +3). Bấm sai hoặc để trượt mất 1 mạng.', 'Có 3 mạng, tốc độ tăng dần. Nhảy liên tiếp đúng để tăng hệ số.']];
  F.custom.nhayloco = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, lives: 3, rows: [], next: .3, kind: 'one', speed: 30, hop: null, cleared: 0 });
    shell(host, 'nhayloco', `<h3>🦶 Nhảy lò cò</h3>${hud(30, '<span id="nlL">❤️❤️❤️</span>')}<div class="hop-field" id="hf"><div class="hop-line"></div><div class="hop-kid" id="hk">${art('hopkid')}</div></div><div class="foot-row"><button class="btn gold big foot" data-hop="one">🦶 1 chân</button><button class="btn gold big foot" data-hop="two">👣 2 chân</button></div>`);
    const hf = $('#hf'), hk = $('#hk'), lives = () => { const l = $('#nlL'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    let fh = hf.clientHeight;
    const spawn = () => { const kind = Math.random() < .5 ? 'one' : 'two', el = document.createElement('div'); el.className = 'hop-row ' + kind; el.innerHTML = kind === 'one' ? '<i></i>' : '<i></i><i></i>'; el.style.transform = 'translateY(-60px)'; hf.appendChild(el); r.rows.push({ el, y: -60, kind }); };
    r.press = (k, btn) => {
      if (r.done) return; btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      const lineY = fh * .78, row = r.rows.filter((x) => !x.done).sort((a, b) => Math.abs(a.y - lineY) - Math.abs(b.y - lineY))[0];
      hk.classList.remove('h1', 'h2'); void hk.offsetWidth; hk.classList.add(k === 'one' ? 'h1' : 'h2'); sfx('tap');
      if (!row || Math.abs(row.y - lineY) > 80) { miss('Sớm quá!'); return; }
      row.done = true; const d = Math.abs(row.y - lineY);
      if (row.kind !== k) { row.el.classList.add('bad'); miss('Sai ô!'); return; }
      row.el.classList.add('ok'); r.combo++; r.best = Math.max(r.best, r.combo); r.cleared++; const perfect = d < 22, pts = (perfect ? 3 : 2) * FX.mult(r); r.score += pts; setScore(r); comboTxt(r);
      const b = hk.getBoundingClientRect(); FX.fly(b.left + b.width / 2, b.top - 6, perfect ? `Hoàn hảo +${pts}` : `+${pts}`, perfect ? 'gold' : ''); if (perfect) FX.boom(b.left + b.width / 2, b.top + b.height, ['✨', '⭐'], 5); sfx(perfect ? 'coin' : 'tap');
      r.speed = Math.min(78, 30 + r.cleared * 1.6);
    };
    const miss = (txt) => { r.lives--; r.combo = 0; lives(); comboTxt(r); const b = hk.getBoundingClientRect(); FX.fly(b.left + b.width / 2, b.top - 6, txt, 'bad'); FX.shake(hf); sfx('error'); G.buzz(40); if (r.lives <= 0) r.over = true; };
    r.end = () => F.finish(r, clamp(Math.round(r.score * .6), 0, 30), `Nhảy đúng ${r.cleared} ô, combo cao nhất ${r.best}.`);
    loop(r, (dt) => {
      if (r.t % 1 < dt) fh = hf.clientHeight; r.next -= dt; if (r.next <= 0) { spawn(); r.next = rnd(.7, 1.1) * (30 / r.speed + .3); }
      r.rows = r.rows.filter((x) => { x.y += r.speed * dt * 2.6 * (fh / 320); x.el.style.transform = `translate3d(0, ${x.y}px, 0)`;
        if (!x.done && x.y > fh * .78 + 90) { x.done = true; x.el.classList.add('bad'); miss('Trượt ô!'); }
        if (x.y > fh + 20) { x.el.remove(); return false; } return true; });
    }, 30);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run, b = e.target.closest('[data-hop]'); if (r && !r.done && r.type === 'nhayloco' && b) { e.preventDefault(); r.press(b.dataset.hop, b); } });

  /* ======================================================================
     2. THẢ THUYỀN GIẤY — kéo thuyền trôi xuôi dòng, né đá, hái sen (canvas)
     ====================================================================== */
  F.EXTRA.thuyengiay = ['⛵', 'Thả thuyền giấy', 'Kéo thuyền trôi xuôi dòng, né đá, hái sen · 30 giây', 'Xu + nguyên liệu']; F.extra.thuyengiay = 1;
  F.GUIDES.thuyengiay = ['⛵ Thả thuyền giấy', ['Kéo ngón tay để lái thuyền giấy sang trái/phải trên dòng suối đang chảy xuống.', 'Hái bông sen 🪷 +2. Né đá và xoáy nước: va vào làm thuyền ướt (3 lần là chìm).', 'Dòng chảy nhanh dần. Hái sen liên tiếp để tăng hệ số.']];
  F.custom.thuyengiay = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, lives: 3, items: [], next: .4, px: .5, hurt: 0, scroll: 0 });
    shell(host, 'thuyengiay', `<h3>⛵ Thả thuyền giấy</h3>${hud(30, '<span id="tgL">❤️❤️❤️</span>')}<canvas class="dragon-cv" id="gcv"></canvas><p class="muted" style="margin:4px 0 0;text-align:center">Kéo ngón tay để lái thuyền</p>`);
    const cv = $('#gcv'), fg = cv.closest('.folk-game'), W = Math.min((fg ? fg.clientWidth : 360) - 24, 520) || 320, Hh = fg && fg.closest('.fg-stage') ? Math.max(300, fg.clientHeight - cv.offsetTop - 64) : 340, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; cv.width = W * dpr; cv.height = Hh * dpr; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lives = () => { const l = $('#tgL'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    const move = (e) => { const b = cv.getBoundingClientRect(); r.tx = clamp((e.clientX - b.left) / b.width, .08, .92); };
    track(cv, 'pointerdown', (e) => { move(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); r.drag = true; e.preventDefault(); });
    track(cv, 'pointermove', (e) => { if (r.drag) move(e); }); track(cv, 'pointerup', () => { r.drag = false; });
    r.tx = .5; let tilt = 0;
    r.end = () => F.finish(r, clamp(Math.round(r.score * .9 + r.lives * 2), 0, 30), r.lives > 0 ? `Thuyền về bến an toàn, hái ${Math.round(r.score / 2)} bông sen.` : 'Thuyền đã chìm giữa dòng.');
    loop(r, (dt) => {
      const spd = 150 + r.t * 5; r.scroll += spd * dt; r.hurt = Math.max(0, r.hurt - dt);
      const prev = r.px; r.px += (r.tx - r.px) * Math.min(1, dt * 7); tilt += ((r.px - prev) * 60 - tilt) * Math.min(1, dt * 8);
      r.next -= dt; if (r.next <= 0) { const k = Math.random(); r.items.push({ x: rnd(.1, .9), y: -30, kind: k < .4 ? 'lotus' : k < .8 ? 'rock' : 'swirl', a: rnd(0, 6) }); r.next = rnd(.35, .75) * (180 / spd) * 1.2; }
      const bx = r.px * W, by = Hh * .78;
      r.items = r.items.filter((it) => { it.y += spd * dt; it.a += dt * 3;
        if (!it.got && Math.abs(it.y - by) < 24 && Math.abs(it.x * W - bx) < 28) { it.got = true; const b = cv.getBoundingClientRect(), fx = b.left + it.x * b.width, fy = b.top + it.y / Hh * b.height;
          if (it.kind === 'lotus') { r.combo++; r.best = Math.max(r.best, r.combo); const p = 2 * FX.mult(r); r.score += p; setScore(r); comboTxt(r); FX.fly(fx, fy, '+' + p, 'gold'); FX.boom(fx, fy, ['🌸', '✨'], 5); sfx('coin'); }
          else if (r.hurt <= 0) { r.lives--; lives(); r.hurt = 1.2; r.combo = 0; comboTxt(r); FX.fly(fx, fy, it.kind === 'rock' ? 'Va đá!' : 'Xoáy nước!', 'bad'); FX.shake(cv); sfx('error'); G.buzz(40); if (r.lives <= 0) r.over = true; } }
        return it.y < Hh + 40 && !(it.got && it.kind === 'lotus'); });
      // vẽ
      const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#7ad0f0'); g.addColorStop(1, '#2a8ab8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; for (let i = 0; i < 14; i++) { const y = ((i * 63 + r.scroll * .6) % (Hh + 40)) - 20, x = (i * 97) % W; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 18, y + 8, x + 36, y); ctx.stroke(); }
      ctx.fillStyle = '#5aa83a'; ctx.fillRect(0, 0, 18, Hh); ctx.fillRect(W - 18, 0, 18, Hh); ctx.fillStyle = '#3a7a22'; ctx.fillRect(16, 0, 3, Hh); ctx.fillRect(W - 19, 0, 3, Hh);
      r.items.forEach((it) => { const x = it.x * W; if (it.kind === 'lotus') GA.draw(ctx, 'lotus', x, it.y + Math.sin(it.a) * 2, 38); else if (it.kind === 'rock') GA.draw(ctx, 'rock', x, it.y, 40); else { ctx.save(); ctx.translate(x, it.y); ctx.rotate(it.a); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, 8 + k * 7, k, k + 4); ctx.stroke(); } ctx.restore(); } });
      ctx.save(); if (r.hurt > 0 && Math.floor(r.t * 16) % 2) ctx.globalAlpha = .4; GA.draw(ctx, 'paperboat', bx, by + Math.sin(r.t * 5) * 2, 52, clamp(tilt * .06, -.45, .45)); ctx.restore();
    }, 30);
  };

  /* ======================================================================
     3. CỜ CÁ NGỰA — gieo xúc xắc đua ngựa với máy, có ô thưởng / ô lùi
     ====================================================================== */
  F.EXTRA.cocangua = ['🐎', 'Cờ cá ngựa', 'Gieo xúc xắc, đua ngựa về chuồng trước máy', 'Xu + nguyên liệu']; F.extra.cocangua = 1;
  F.GUIDES.cocangua = ['🐎 Cờ cá ngựa', ['Bấm “Gieo xúc xắc” để ngựa của bạn tiến lên. Máy cũng gieo lần lượt.', 'Ô ⭐ thưởng thêm một lượt, ô 🕳️ lùi 3 ô, ô 🚀 nhảy vọt 4 ô. Gieo ra 6 được gieo lại.', 'Khi sát đích bạn có thể chọn “Đi chắc” (tiến đúng số ô) hoặc “Liều” (tăng 2 ô nhưng 1/3 khả năng lùi 2). Về đích trước thì thắng.']];
  F.custom.cocangua = (r, host) => {
    const N = 24, SPECIAL = { 5: 'star', 9: 'hole', 12: 'rocket', 16: 'star', 19: 'hole', 21: 'rocket' };
    Object.assign(r, { score: 0, combo: 0, best: 0, me: 0, cpu: 0, turn: 'me', busy: false, rolls: 0 });
    const cells = Array.from({ length: N + 1 }, (_, i) => `<i class="hc ${SPECIAL[i] || ''} ${i === N ? 'goal' : ''}" data-c="${i}">${i === 0 ? '🏠' : i === N ? '🏁' : SPECIAL[i] === 'star' ? '⭐' : SPECIAL[i] === 'hole' ? '🕳️' : SPECIAL[i] === 'rocket' ? '🚀' : i}</i>`).join('');
    shell(host, 'cocangua', `<h3>🐎 Cờ cá ngựa</h3><div class="x-hud"><span id="hrT">Đến lượt bạn</span><span id="xScore">Điểm 0</span><span id="hrD">${GA.art.dice}</span></div><div class="horse-board" id="hb">${cells}<div class="horse me" id="hm">${GA.art.horse}</div><div class="horse cpu" id="hc2">${GA.art.horse}</div></div><div class="foot-row"><button class="btn gold big foot" data-roll="safe">🎲 Gieo xúc xắc</button><button class="btn gold big foot" data-roll="risk">🔥 Liều (+2)</button></div>`);
    const hb = $('#hb'), place = (el, pos, off) => { const c = $(`[data-c="${clamp(pos, 0, N)}"]`, hb); if (!c) return; const hr = hb.getBoundingClientRect(), cr = c.getBoundingClientRect(); el.style.transform = `translate(${cr.left - hr.left + cr.width / 2 - 20 + off}px, ${cr.top - hr.top - 18}px)`; };
    const sync = () => { place($('#hm'), r.me, -6); place($('#hc2'), r.cpu, 6); };
    setTimeout(sync, 60); window.addEventListener('resize', sync);
    const say = (t) => { const e = $('#hrT'); if (e) e.textContent = t; };
    const diceShow = (n) => { const d = $('#hrD'); if (d) { d.classList.remove('roll'); void d.offsetWidth; d.classList.add('roll'); setTimeout(() => { if (d) d.dataset.n = n; d.innerHTML = `<b>${n}</b>`; }, 280); } };
    const move = (who, n, cb) => { let i = 0; const stepOne = () => { if (F.run !== r || r.done) return; if (i >= n) return cb(); i++; r[who] = Math.min(N, r[who] + 1); sync(); sfx('tap'); r.timer = setTimeout(stepOne, 170); }; stepOne(); };
    const special = (who, cb) => {
      const sp = SPECIAL[r[who]]; if (!sp) return cb(false);
      const e = $(`[data-c="${r[who]}"]`, hb); const b = e && e.getBoundingClientRect();
      if (sp === 'star') { if (who === 'me') { r.score += 3; setScore(r); } if (b) FX.fly(b.left + 10, b.top, who === 'me' ? 'Thưởng lượt! +3' : 'Máy được thưởng', 'gold'); sfx('coin'); return cb(true); }
      if (sp === 'hole') { r[who] = Math.max(0, r[who] - 3); if (b) FX.fly(b.left + 10, b.top, 'Sa hố, lùi 3', 'bad'); sfx('error'); sync(); return setTimeout(() => cb(false), 500); }
      r[who] = Math.min(N, r[who] + 4); if (b) FX.fly(b.left + 10, b.top, 'Phóng vọt +4!', 'gold'); sfx('levelup'); sync(); setTimeout(() => cb(false), 500);
    };
    const finish = (win) => { r.over = true; r.won = win; if (win) { FX.confetti(); r.score += 12; } r.timer = setTimeout(() => F.finish(r, clamp(Math.round(r.score + (win ? 10 : 0)), 0, 30), win ? `Ngựa của bạn về chuồng trước! Gieo ${r.rolls} lần.` : 'Máy về đích trước.'), 500); };
    const cpuTurn = () => {
      if (F.run !== r || r.done) return; say('Máy đang gieo…'); r.turn = 'cpu';
      r.timer = setTimeout(() => { const n = 1 + Math.floor(Math.random() * 6); diceShow(n); r.timer = setTimeout(() => { move('cpu', n, () => { if (r.cpu >= N) return finish(false); special('cpu', (extra) => { if (r.cpu >= N) return finish(false); if (extra || n === 6) return cpuTurn(); r.turn = 'me'; r.busy = false; say('Đến lượt bạn'); }); }); }, 600); }, 800);
    };
    r.roll = (mode) => {
      if (r.done || r.turn !== 'me' || r.busy) return; r.busy = true; r.rolls++; sfx('whoosh'); G.buzz(10);
      let n = 1 + Math.floor(Math.random() * 6); diceShow(n);
      if (mode === 'risk') { if (Math.random() < .34) { r.timer = setTimeout(() => { say('Liều thất bại, lùi 2'); r.me = Math.max(0, r.me - 2); sync(); sfx('error'); r.timer = setTimeout(cpuTurn, 800); }, 700); return; } n += 2; }
      r.timer = setTimeout(() => { say(`Bạn gieo được ${n}`); move('me', n, () => { r.combo = n === 6 ? r.combo + 1 : 0; if (r.me >= N) return finish(true); special('me', (extra) => { if (r.me >= N) return finish(true); if (extra || n === 6) { r.busy = false; say(n === 6 ? 'Ra 6! Gieo lại' : 'Được thưởng lượt!'); return; } r.timer = setTimeout(cpuTurn, 500); }); }); }, 700);
    };
    r.end = () => finish(false);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run, b = e.target.closest('[data-roll]'); if (r && !r.done && r.type === 'cocangua' && b) { e.preventDefault(); r.roll(b.dataset.roll); } });

  /* ======================================================================
     4. BẮN NỎ — canh gió và mục tiêu di động
     ====================================================================== */
  F.EXTRA.bannu = ['🏹', 'Bắn nỏ', 'Canh thời điểm bắn trúng bia di động · 8 mũi tên', 'Xu + nguyên liệu']; F.extra.bannu = 1;
  F.GUIDES.bannu = ['🏹 Bắn nỏ', ['Bia gỗ di chuyển lên xuống. Tâm ngắm lắc nhẹ theo gió. Bấm “Bắn!” khi tâm ngắm nằm trên bia.', 'Hồng tâm +10, vòng giữa +6, vòng ngoài +3. Trúng liên tiếp tăng hệ số.', 'Có 8 mũi tên. Gió đổi hướng sau mỗi lượt, nhìn cờ gió ở góc để canh.']];
  F.custom.bannu = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, shots: 0, ty: 50, tdir: 1, wind: 0, cx: 50, cy: 50, arrows: [], hits: 0, lock: 0 });
    shell(host, 'bannu', `<h3>🏹 Bắn nỏ</h3><div class="x-hud"><span id="xTime" style="display:none">⏱ 99</span><span id="bnN">Mũi 1/8</span><span id="xScore">Điểm 0</span><span id="bnW">🌬️ 0</span></div><div class="archery" id="ar"><div class="ar-sky"></div><div class="ar-flag" id="afl"><i></i></div><div class="ar-bg"></div><div class="ar-target" id="at">${GA.art.target}</div><div class="ar-cross" id="ac"><i></i><i></i></div><div class="ar-bow">${GA.art.crossbow}</div></div><button class="btn gold big grab-btn" data-shoot>🏹 Bắn!</button>`);
    const ar = $('#ar'), at = $('#at'), ac = $('#ac'), fl = $('#afl');
    const newWind = () => { r.wind = Math.round(rnd(-3, 3)); const w = $('#bnW'); if (w) w.textContent = '🌬️ ' + (r.wind === 0 ? 'lặng' : (r.wind < 0 ? '◀ ' : '▶ ') + Math.abs(r.wind)); fl.style.setProperty('--w', r.wind); };
    newWind();
    r.shoot = () => {
      if (r.done || r.lock > 0 || r.shots >= 8) return; r.shots++; r.lock = .9; sfx('whoosh'); G.buzz(15);
      const hr = at.getBoundingClientRect(), cr = ac.getBoundingClientRect(), dx = cr.left + cr.width / 2 - (hr.left + hr.width / 2), dy = cr.top + cr.height / 2 - (hr.top + hr.height / 2), d = Math.hypot(dx, dy) / (hr.width / 2);
      const a = document.createElement('div'); a.className = 'ar-arrow'; a.innerHTML = GA.art.arrow; a.style.left = (cr.left - ar.getBoundingClientRect().left + cr.width / 2) + 'px'; a.style.top = (cr.top - ar.getBoundingClientRect().top + cr.height / 2) + 'px'; a.style.setProperty('--fx', Math.max(60, hr.left + hr.width / 2 - cr.left - 20) + 'px'); ar.appendChild(a); setTimeout(() => a.remove(), 1600);
      let pts = 0, txt = 'Trượt'; if (d < .2) { pts = 10; txt = 'HỒNG TÂM!'; } else if (d < .55) { pts = 6; txt = 'Trúng giữa'; } else if (d < 1) { pts = 3; txt = 'Trúng bia'; }
      if (pts) { r.combo++; r.hits++; r.best = Math.max(r.best, r.combo); pts *= FX.mult(r); sfx(pts >= 10 ? 'levelup' : 'coin'); } else { r.combo = 0; sfx('error'); }
      r.score += pts; setScore(r); comboTxt(r); FX.fly(cr.left + cr.width / 2, cr.top - 10, pts ? `${txt} +${pts}` : txt, pts >= 10 ? 'big' : pts ? 'gold' : 'bad'); if (pts >= 10) FX.boom(hr.left + hr.width / 2, hr.top + hr.height / 2, ['✨', '⭐', '🎯'], 8);
      const n = $('#bnN'); if (n) n.textContent = `Mũi ${Math.min(8, r.shots + 1)}/8`;
      if (r.shots >= 8) r.timer = setTimeout(() => { r.over = true; r.finishNow(); }, 1100); else setTimeout(newWind, 700);
    };
    r.finishNow = () => F.finish(r, clamp(Math.round(r.score * .4), 0, 30), `Trúng ${r.hits}/8 mũi tên (combo cao nhất ${r.best}).`);
    r.end = () => { if (!r.done) r.finishNow(); };
    loop(r, (dt) => {
      r.lock -= dt; r.ty += r.tdir * (28 + r.shots * 5) * dt; if (r.ty > 78) { r.ty = 78; r.tdir = -1; } if (r.ty < 22) { r.ty = 22; r.tdir = 1; }
      at.style.top = r.ty + '%';
      const tl = 78 + Math.sin(r.t * .8) * 4; at.style.left = tl + '%';
      r.cx = tl + (14 + Math.abs(r.wind) * 2) * Math.sin(r.t * 1.6 + r.shots) + r.wind * 2.4; r.cy = r.ty + (26 + Math.abs(r.wind) * 2) * Math.sin(r.t * 2.1 + 1) + r.wind * 1.5;
      ac.style.left = clamp(r.cx, 8, 94) + '%'; ac.style.top = clamp(r.cy, 8, 92) + '%'; fl.style.transform = `rotate(${r.wind * 6}deg)`;
    }, 90);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run; if (r && !r.done && r.type === 'bannu' && (e.target.closest('[data-shoot]') || e.target.closest('#ar'))) { e.preventDefault(); r.shoot(); } });

  /* ======================================================================
     5. MÒ CUA BẮT ỐC — chạm đúng hang có cua/ốc, né rắn nước
     ====================================================================== */
  F.EXTRA.moccua = ['🦀', 'Mò cua bắt ốc', 'Chạm cua, ốc thò lên khỏi bùn, tránh rắn nước · 30 giây', 'Xu + nguyên liệu']; F.extra.moccua = 1;
  F.GUIDES.moccua = ['🦀 Mò cua bắt ốc', ['Ruộng nước có nhiều hang. Cua 🦀 (+2) và ốc 🐌 (+1) thò lên một lúc rồi chui xuống, hãy chạm trước khi chúng lặn.', 'Đừng chạm vào rắn nước 🐍: bị trừ 3 điểm và mất combo. Cua vàng hiếm +5.', 'Chạm đúng liên tiếp tăng hệ số. Ruộng càng về cuối ngập nhiều bọt, nhanh dần.']];
  F.custom.moccua = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, holes: Array(12).fill(0), next: .5, caught: 0 });
    shell(host, 'moccua', `<h3>🦀 Mò cua bắt ốc</h3>${hud(30)}<div class="paddy" id="pd">${Array.from({ length: 12 }, (_, i) => `<button class="mud" data-mud="${i}" aria-label="Hang ${i + 1}"><i class="mud-hole"></i><b class="mud-it"></b></button>`).join('')}</div>`);
    const SNAKE = '<svg class="ga" viewBox="0 0 64 64"><path d="M10 50q-4-14 8-18t14 4q4 8 12 4t6-14q-2-8 6-10" stroke="#3a8a3a" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M10 50q-4-14 8-18t14 4q4 8 12 4t6-14" stroke="#7ad07a" stroke-width="3" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/><circle cx="50" cy="12" r="7" fill="#4a9a4a" stroke="#1f5a1f" stroke-width="2"/><circle cx="52" cy="10" r="1.6" fill="#fff"/><path d="M56 14l6 3" stroke="#e0301f" stroke-width="2" stroke-linecap="round"/></svg>';
    const IT = { crab: GA.art.crab, snail: GA.art.snail, gold: GA.art.crab.replace('#ff8a6a', '#ffe27a').replace('#d8402a', '#e09a00'), snake: SNAKE };
    r.end = () => F.finish(r, clamp(Math.round(r.score * .8), 0, 30), `Bắt được ${r.caught} con, điểm cao nhất combo ${r.best}.`);
    loop(r, (dt) => {
      r.next -= dt; if (r.next <= 0) { const free = r.holes.map((h, i) => h ? -1 : i).filter((i) => i >= 0); if (free.length) { const i = free[Math.floor(rnd(0, free.length))], k = Math.random(), kind = k < .12 ? 'snake' : k < .2 ? 'gold' : k < .6 ? 'crab' : 'snail', el = $(`[data-mud="${i}"]`), it = $('.mud-it', el); it.innerHTML = IT[kind]; el.className = 'mud up ' + kind; r.holes[i] = { kind, t: rnd(.9, 1.5) - Math.min(.5, r.t * .015) }; }
        r.next = rnd(.3, .65) * (1 - Math.min(.4, r.t * .012)); }
      r.holes.forEach((h, i) => { if (!h) return; h.t -= dt; if (h.t <= 0) { r.holes[i] = 0; const el = $(`[data-mud="${i}"]`); if (el) el.className = 'mud'; if (h.kind !== 'snake') { r.combo = 0; comboTxt(r); } } });
    }, 30);
  };
  document.addEventListener('pointerdown', (e) => {
    const r = F.run, b = e.target.closest('[data-mud]'); if (!r || r.done || r.type !== 'moccua' || !b) return; e.preventDefault();
    const i = +b.dataset.mud, h = r.holes[i], rc = b.getBoundingClientRect(); if (!h) { r.combo = 0; comboTxt(r); return; }
    r.holes[i] = 0; b.className = 'mud hit ' + h.kind; setTimeout(() => { if (b.classList.contains('hit')) b.className = 'mud'; }, 300);
    if (h.kind === 'snake') { r.score = Math.max(0, r.score - 3); r.combo = 0; FX.fly(rc.left + rc.width / 2, rc.top, '−3 Rắn!', 'bad'); FX.shake($('#pd')); sfx('error'); G.buzz(50); }
    else { r.caught++; r.combo++; r.best = Math.max(r.best, r.combo); const p = (h.kind === 'gold' ? 5 : h.kind === 'crab' ? 2 : 1) * FX.mult(r); r.score += p; FX.fly(rc.left + rc.width / 2, rc.top, '+' + p, h.kind === 'gold' ? 'gold' : ''); FX.boom(rc.left + rc.width / 2, rc.top + 10, ['💦', '✨'], 4); sfx(h.kind === 'gold' ? 'levelup' : 'pop'); G.buzz(8); }
    setScore(r); comboTxt(r);
  });

  /* ---------- nhóm trên sảnh ---------- */
  const add = (title, ids) => F.GROUPS.forEach((g) => { if (g[1] === title) ids.forEach((id) => g[2].push(id)); });
  add('Vận động & phản xạ', ['nhayloco', 'moccua']); add('Nhịp điệu & khéo tay', ['bannu']); add('Phiêu lưu bầu trời', ['thuyengiay']); add('Trí tuệ dân gian', ['cocangua']);
  ['nhayloco', 'thuyengiay', 'cocangua', 'bannu', 'moccua'].forEach((id) => { F.NEW[id] = 1; F.TIMED[id] = 1; });
})();
